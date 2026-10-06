# Deployment Guide — Hostel/Hotel Management System

## Overview

This repo contains a Laravel 12 API backend (`backend/`) and a Next.js 16 static-exported frontend (`web/`). The backend is deployed as plain PHP under GoDaddy's shared-hosting Apache/PHP stack; the frontend is built to static HTML/CSS/JS and uploaded as files — no Node.js process runs on the server for either component. (A `mobile/` React Native app also exists in this repo but is out of scope for this guide — it's not part of a web deployment.)

## Deployment Flow

```
Pull latest from main
      │
      ▼
Install dependencies locally
  backend: composer install --no-dev --optimize-autoloader
  web:     pnpm install
      │
      ▼
Configure environment
  backend/.env  — DB creds, APP_URL, mail, AWS/S3 (if used)
  web/.env.local — NEXT_PUBLIC_API_URL must point at the LIVE backend URL
      │
      ▼
Run build command(s)
  backend: npm run build  (compiles the default welcome-page assets only)
  web:     pnpm build
      │
      ▼
Locate build output folder(s)
  backend: the whole backend/ folder (entry point is backend/public/)
  web:     web/out/
      │
      ▼
Upload to GoDaddy — which folder goes where
  backend/  → a subdomain's docroot pointed at backend/public  (e.g. api.yourdomain.com)
  web/out/  → public_html (root domain) or another subdomain's docroot
      │
      ▼
Apply server config (.htaccess for the frontend's extensionless routes,
storage/bootstrap permissions for the backend)
      │
      ▼
Verify live site
```

## Step-by-Step

### 1. Pull the project
```
git clone https://github.com/iamhadisyed/hostel.git
cd hostel
git checkout main
git pull origin main
```

### 2. Local setup — Backend
```
cd backend
composer install --no-dev --optimize-autoloader
```
Environment: copy `.env.example` to `.env`. These values MUST be set correctly for production:
- `APP_ENV=production`
- `APP_DEBUG=false` — never leave `true` in production, it leaks stack traces/secrets
- `APP_KEY` — generate a fresh one with `php artisan key:generate` (don't reuse a dev key)
- `APP_URL` — the live backend URL, e.g. `https://api.yourdomain.com`
- `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` — the MySQL database GoDaddy provisions in cPanel
- `SESSION_DRIVER=database` — fine as-is; requires the `sessions` table (created by the default migrations)
- `QUEUE_CONNECTION=database` — fine as-is; nothing in the app currently dispatches queued jobs, so no worker process is needed
- `FILESYSTEM_DISK` — defaults to `s3` in `.env.example`. If you don't have an S3-compatible bucket, change this to `local` so uploaded files (documents, payroll PDFs) are written to `backend/storage/app` instead — simpler for shared hosting, see Known Issues below
- `AWS_*` — only required if you keep `FILESYSTEM_DISK=s3`
- `MAIL_MAILER` — defaults to `log` in `.env.example`; set to `smtp` (with `MAIL_HOST`/`MAIL_USERNAME`/`MAIL_PASSWORD`/`MAIL_PORT`/`MAIL_FROM_ADDRESS`) so OTP/notification emails actually send in production
- `OTP_EXPIRY_MINUTES` — business logic value, defaults to `10`, change only if desired

### 3. Local setup — Frontend
```
cd web
pnpm install
```
(Confirmed from `pnpm-lock.yaml` — use `pnpm`, not `npm`/`yarn`, to match the committed lockfile.)

Environment: create `web/.env.local` with:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```
This **must** point at the live backend URL *before* running the build — static exports bake this value into the generated HTML/JS at build time; changing it after the build has no effect and requires a rebuild.

### 4. Build
```
# Backend (optional — only affects Laravel's default, unused welcome page)
cd backend && npm run build

# Frontend
cd web && pnpm build
```
Confirm the output folder produced: `web/out/` (verified — contains 20 pre-rendered `.html` files plus `_next/` static assets; `output: 'export'` is set in `web/next.config.ts`).

### 5. GoDaddy folder placement

- **Backend**: upload the entire `backend/` folder (including `vendor/`, built via `composer install` above) to a location *outside* `public_html` on GoDaddy — e.g. `~/laravel-app/`. Then point a subdomain (e.g. `api.yourdomain.com`) at `~/laravel-app/public` as its docroot, using cPanel → Domains → "Create A New Domain" (subdomain) with document root set to `laravel-app/public`. This keeps `.env`, `app/`, and everything else outside the web-servable root — don't point any public docroot directly at the `backend/` folder itself, only at its `public` subfolder.
- **Frontend**: upload the *contents* of `web/out/` (not the `out` folder itself) into `public_html` if this is meant to be the main site at the root domain, or into a subdomain's docroot if you're keeping the root domain for something else. Given this project has one frontend serving all roles (owner/warden/front-desk/student/super-admin), the root domain is the natural choice.
- No other frontend/app folders exist in this repo that need separate placement (the `mobile/` app isn't deployed to GoDaddy).

### 6. .htaccess

Needed — but not for SPA "history mode" routing. Next's static export writes each route as a sibling `.html` file (e.g. `owner/accounts.html`, not `owner/accounts/index.html`). A direct hit or page refresh on `/owner/accounts` (no extension) will 404 on plain Apache unless rewritten to the matching `.html` file. Place this `.htaccess` in the **same directory `web/out/`'s contents were uploaded to** (`public_html` or the frontend subdomain's docroot):

```apache
RewriteEngine On

# Serve the file as-is if it exists
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# Otherwise, if a matching .html file exists, serve that
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.*)$ $1.html [L]

# Custom 404 page
ErrorDocument 404 /404.html
```

### 7. File permissions (Laravel backend)
```
chmod -R 775 storage bootstrap/cache
```
(On GoDaddy's shared hosting, the web server user already owns these via cPanel's file ownership model — `775` is normally sufficient; avoid `777`.)

Also run once after first upload:
```
php artisan migrate --force
php artisan storage:link
```
(`storage:link` only matters if you set `FILESYSTEM_DISK=local` — see Known Issues.)

### 8. Verification checklist
- [ ] Homepage loads (`https://yourdomain.com`)
- [ ] Refreshing a deep/nested route (e.g. `https://yourdomain.com/owner/accounts`) does not 404
- [ ] A real API call from frontend to backend succeeds — e.g. the login page's request reaches `https://api.yourdomain.com/api/...` and returns data, not a CORS or 404 error
- [ ] Login/auth flow works end to end (token issued by Sanctum, stored client-side, sent as `Authorization: Bearer` on subsequent requests)
- [ ] The daily `vouchers:manage-cycles` scheduled command actually runs — check `storage/logs/laravel.log` a day after setup, or run it manually once via SSH/cPanel Terminal to confirm it doesn't error
- [ ] Uploading/downloading a document or payroll PDF works (exercises whichever `FILESYSTEM_DISK` you configured)

## Known issues / things to double check

- **Laravel's scheduler needs a cPanel Cron Job.** Shared hosting has no persistent process, so add a cron entry (cPanel → Cron Jobs) running every minute:
  ```
  * * * * * php /home/<cpanel-user>/laravel-app/artisan schedule:run >> /dev/null 2>&1
  ```
  Without this, the daily `vouchers:manage-cycles` command silently never runs.
- **`FILESYSTEM_DISK` defaults to `s3` in `.env.example`.** If you don't set up an S3-compatible bucket and AWS credentials, file uploads (`DocumentController`, payroll PDFs in `PayrollController`) will fail. Either provision S3 (or a compatible service) and fill in the `AWS_*` vars, or switch to `FILESYSTEM_DISK=local` and run `php artisan storage:link` so uploaded files are served from `backend/storage/app/public` via the `public/storage` symlink.
- **CORS has no published `config/cors.php`.** The app relies on Laravel's built-in default (allow-all on `api/*`), which works but is permissive. Consider publishing and restricting `allowed_origins` to your actual frontend domain(s) once deployed.
- **`MAIL_MAILER=log` in `.env.example`.** Left as-is, OTP/notification emails are written to the log file instead of actually sent — set real SMTP credentials for production.
- **Backend's `npm run build` only affects Laravel's unused default welcome page** (`GET /` → `resources/views/welcome.blade.php`). Skipping it means that one route throws a Vite-manifest error if ever hit directly — harmless for the real app (the frontend and API routes don't touch it), but worth building anyway so the bare backend domain doesn't show an error page if someone visits it directly.
