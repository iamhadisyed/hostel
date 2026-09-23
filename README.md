# Hostel/Hotel Management System

A multi-tenant platform for managing hostels/hotels in Pakistan (or anywhere): room/bed booking, staff & payroll, expenses, food ordering, and feedback — with a Super Admin who onboards properties, an Owner who runs the business, a Warden who runs day-to-day operations, a Front Desk role for walk-ins/visitors, and Students/Guests who book and stay.

## Table of Contents

- [The Idea](#the-idea)
- [Who Uses This](#who-uses-this)
- [What's Built](#whats-built)
- [What's Left](#whats-left)
- [Repository Layout](#repository-layout)
- [Tech Stack](#tech-stack)
- [Local Development](#local-development)
- [Deployment Guide](#deployment-guide)
- [Environment Variables Reference](#environment-variables-reference)

## The Idea

Small hostels and hotels — especially student hostels and budget hotels common in Pakistan — mostly run on registers, WhatsApp groups, and memory. This platform digitizes that whole operation:

- A **Super Admin** (the platform operator) onboards new properties and their Owners.
- An **Owner** can run multiple properties, sees cross-property analytics (revenue, occupancy, payroll burn, net savings), and manages staff accounts.
- A **Warden/Manager** runs one property day-to-day: approves guest registrations, verifies payments, manages staff and payroll, tracks expenses, and manages the food menu.
- **Front Desk/Security** handles walk-in registrations and visitor logging, with read-only visibility otherwise.
- **Students/Guests** self-register, browse room availability, get approved, pay via a generated voucher, order food during their stay, and leave feedback.

Everything is API-first (Laravel REST API) so the same backend serves both the web dashboard (Next.js) and the mobile app (React Native/Expo).

## Who Uses This

| Role | Where they work | What they do |
|---|---|---|
| Super Admin | Web (primary) | Onboard properties, attach/create Owners |
| Owner | Web + Mobile | Cross-property analytics, expense approval, staff account management, everything a Warden can do |
| Warden/Manager | Web + Mobile | Approve bookings, verify payments, manage staff/payroll/expenses/food menu |
| Front Desk/Security | Web + Mobile | Register walk-in guests, log visitors |
| Student/Guest | Web + Mobile | Browse rooms, book, pay, order food, give feedback |

## What's Built

### Backend (Laravel 12 REST API) — `backend/`

All core modules from the original spec, built in this order:

1. **Auth/OTP** — registration, email OTP verification (queued email), login via Sanctum tokens. Unverified users can still log in and browse (read-only), matching the "cannot generate a voucher until verified" rule.
2. **Property Setup Wizard** — Super Admin creates a hotel in one call: attaches/creates an Owner, defines room types with monthly pricing, and lays out floors/rooms; beds are auto-generated per room capacity.
3. **Booking/Voucher flow** — guests pick a specific bed at registration (held via row-locking to prevent double-booking); Warden approves/rejects; approval auto-generates a monthly billing cycle + voucher; guests upload payment proof; Warden verifies it (rejection reopens the voucher and releases the bed); checkout settles any unpaid food orders into the final bill. A scheduled command (`vouchers:manage-cycles`) auto-generates the next month's cycle and expires unpaid overdue vouchers.
4. **Staff & Payroll** — staff records (daily/monthly wage), attendance tracking, payroll generation (with deductions/advances/loan repayments), PDF salary slip generation (dompdf) once paid.
5. **Expense Management** — Warden logs expenses with receipt upload; Owner approves/rejects; feeds into analytics.
6. **Owner Analytics** — revenue, payroll burn, expenses, net savings, occupancy rate, average stay duration, and pricing performance by room type, filterable by property and date range.
7. **Food Ordering** — Warden/Owner manage a per-property menu; guests order during an active stay (settle per-order or ride a tab to checkout); kitchen fulfillment tracked pending → preparing → delivered.
8. **Feedback** — 1–5 rating + comment, allowed mid-stay or after checkout; average rating shown per property and per room.
9. **Front Desk extras** — daily presence check-in/check-out logs (distinct from booking-level vacate) and visitor pass logging.
10. **Audit Log** — every state-changing action (approvals, payments, payroll, expenses, checkout, etc.) recorded with actor, role, before/after state, and property.
11. **Security/reliability hardening** — rate limiting on auth/OTP endpoints, queued OTP emails, S3-compatible file storage for all uploads (documents, payment proofs, receipts, salary slips).

**Automated test suite**: 72 Feature tests (PHPUnit) covering every module above, running against an in-memory SQLite DB in under 2 seconds. Run with `composer test`. CI runs this automatically on every push/PR via `.github/workflows/backend-tests.yml`.

### Web App (Next.js on the Materialize MUI theme) — `web/`

Role-gated dashboards wired to the real API for every role:

- **Super Admin**: property onboarding wizard, property list.
- **Owner**: analytics dashboard, expense review, Warden/Front Desk account management, plus everything below.
- **Warden**: booking approval/payment verification/checkout, staff + attendance, payroll generation & payment, food menu management.
- **Front Desk**: walk-in registration with live bed selection, visitor pass logging.
- **Student**: property/bed-level availability browsing (works pre-verification), booking status with document + payment-proof upload, food ordering, feedback.

### Mobile App (Expo/React Native) — `mobile/`

Single codebase, single login, role-based navigation — the same feature coverage as the web app, built for Android first (spec requirement), with iOS buildable from the same code. Uses a lightweight custom UI kit (no heavy component library) and Expo's image picker for document/payment-proof uploads.

### What Was Verified (not just written — actually run)

- Backend: 72/72 automated tests passing.
- Web: full user flows (registration → OTP → login → property wizard → booking → payment → analytics) driven through a real browser via Playwright against a live backend, zero console/runtime errors.
- Mobile: TypeScript compiles clean, the Android Metro bundle builds without errors, and the same core flows were verified through a react-native-web preview against the live backend.

Along the way, several real bugs were found and fixed (not just built around): a foreign-key table-name mismatch, a payroll date-boundary bug, a walk-in booking authorization gap (any Front Desk/Warden user could book into *any* hotel, not just their own), a voucher-renewal command that would have silently duplicated vouchers every day in production, and a CI workflow that had never actually run because it was sitting in the wrong directory for a monorepo.

## What's Left

These are gaps, not secrets — flagging them so nothing is assumed "done" that isn't:

### Product gaps
- **No real dashboard/overview for 4 of 5 roles.** Only the Owner lands on an actual stats dashboard (Analytics). Super Admin, Warden, Front Desk, and Student all land directly on a working list/feature page with no "at a glance" summary (pending approvals, today's check-ins, outstanding dues, etc.).
- **No payment gateway.** Guests upload a payment screenshot and a human verifies it — there's no JazzCash/EasyPaisa/Raast (or Stripe, if going international) integration for instant, automatic payment confirmation.
- **No push notifications.** Guests only find out about approval/rejection/payment verification by reopening the app.
- **No WhatsApp/SMS notifications.** Email is the only channel right now (OTP, and nothing else is notified at all). In Pakistan specifically, WhatsApp is where most users actually look.
- **No live/real-time bed availability.** Two guests browsing the same room simultaneously won't see a bed disappear from the list the instant someone else books it — the server-side row locking prevents the actual double-booking, but the UI doesn't push updates.
- **No Urdu/localization.** UI is English-only.
- **Mobile tab icons are placeholders** — cosmetic only, not wired to a proper icon set yet.
- **Super Admin's property wizard on mobile is simplified** to one floor (the full multi-floor wizard is web-only by design, since it's a desktop-shaped task).

### Engineering gaps
- **No production deployment yet.** Nothing has been deployed anywhere — this has only run in local/dev environments. The section below is the guide for doing that.
- **No staging/production S3 bucket configured.** `.env.example` documents the settings, but no real bucket has been created or tested against.
- **No frontend (web) or mobile automated test suite** — only the backend has one. The web app was verified manually via Playwright during development, but there's no repeatable Jest/Playwright suite committed.
- **No mobile app store builds.** The app has never been built into an actual `.apk`/`.aab` or submitted anywhere.
- **No monitoring/error tracking** (e.g. Sentry) wired in for any of the three apps.
- **No database backup strategy** documented or automated.

## Repository Layout

```
hostel/
├── backend/     Laravel 12 REST API (PHP 8.3+, MySQL, Sanctum auth)
├── web/         Next.js 15 web app (Materialize MUI theme)
├── mobile/      Expo/React Native app (Android-first)
└── .github/
    └── workflows/
        └── backend-tests.yml   CI: runs the backend test suite on push/PR to main
```

Each app is independently deployable and has its own `README.md` / `.env.example` with more detail.

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | Laravel 12, PHP 8.3+, MySQL 8, Sanctum (token auth) |
| File storage | S3-compatible (AWS S3, DigitalOcean Spaces, MinIO, etc.) |
| PDF generation | barryvdh/laravel-dompdf |
| Web frontend | Next.js 15 (App Router), MUI 7 (Materialize theme), TypeScript |
| Mobile | Expo (React Native 0.86), React Navigation, TypeScript |
| CI | GitHub Actions |

## Local Development

### Prerequisites

- PHP 8.3+, Composer
- Node.js 20+, npm/pnpm
- MySQL 8 (or SQLite for quick local testing)
- An S3-compatible bucket for file uploads (or use `local` disk for dev)

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Point DB_* at your MySQL instance, or for a quick start use SQLite:
#   DB_CONNECTION=sqlite
#   touch database/database.sqlite

php artisan migrate --seed
php artisan serve   # http://localhost:8000
```

Run the test suite any time with `composer test`.

### Web

```bash
cd web
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm run dev   # http://localhost:3000
```

### Mobile

```bash
cd mobile
npm install
cp .env.example .env
# Android emulator: EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api
# Physical device: EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:8000/api
npm run android
```

## Deployment Guide

This is a from-scratch, step-by-step path to a live production deployment. Pick any host that runs PHP/MySQL — the steps below use a generic Linux VPS (works the same on DigitalOcean, Linode, AWS Lightsail, a local Pakistani host, etc.).

### Step 1 — Provision infrastructure

1. **A server** for the backend: 1–2 vCPU / 2 GB RAM is enough to start. Ubuntu 22.04 LTS recommended.
2. **A managed MySQL 8 database** (or MySQL on the same server if budget is tight). Note the host, port, database name, username, password.
3. **An S3-compatible bucket** for file storage — AWS S3, DigitalOcean Spaces, or Backblaze B2 all work. Note the access key, secret key, region, bucket name, and endpoint (only needed for non-AWS providers).
4. **A domain name**, with two subdomains pointed at your server's IP:
   - `api.yourdomain.com` → backend
   - `app.yourdomain.com` → web frontend

### Step 2 — Deploy the backend (Laravel)

On the server:

```bash
# System packages
sudo apt update
sudo apt install -y php8.3 php8.3-fpm php8.3-mysql php8.3-mbstring php8.3-xml \
  php8.3-curl php8.3-zip php8.3-gd php8.3-bcmath nginx mysql-client
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Get the code
git clone https://github.com/<your-org>/hostel.git
cd hostel/backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
```

Edit `.env` with production values (see [Environment Variables Reference](#environment-variables-reference) below), then:

```bash
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link
```

**Set up the queue worker** (required — OTP emails are queued):

```bash
# Install a process manager
sudo apt install -y supervisor
```

Create `/etc/supervisor/conf.d/hostel-worker.conf`:

```ini
[program:hostel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/hostel/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
numprocs=2
user=www-data
redirect_stderr=true
stdout_logfile=/path/to/hostel/backend/storage/logs/worker.log
```

```bash
sudo supervisorctl reread && sudo supervisorctl update && sudo supervisorctl start hostel-worker:*
```

**Set up the scheduler** (required — this runs `vouchers:manage-cycles` daily):

```bash
crontab -e
# Add this line:
* * * * * cd /path/to/hostel/backend && php artisan schedule:run >> /dev/null 2>&1
```

**Configure Nginx** (`/etc/nginx/sites-available/hostel-api`):

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    root /path/to/hostel/backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/hostel-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**Add HTTPS** (required — the mobile app and browsers will refuse mixed content):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### Step 3 — Deploy the web frontend (Next.js)

Simplest path: **Vercel** (built by the same team as Next.js, zero-config for this app).

1. Push the repo to GitHub (already done).
2. In Vercel: New Project → import the repo → set **Root Directory** to `web`.
3. Set environment variable `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api`.
4. Deploy. Point `app.yourdomain.com` at the Vercel project (Vercel's dashboard walks through the DNS record).

Alternative (self-hosted, same server as the API):

```bash
cd hostel/web
npm install
npm run build
# Serve with a process manager:
npm install -g pm2
pm2 start npm --name hostel-web -- start
pm2 save
```

Then add another Nginx server block proxying `app.yourdomain.com` to `localhost:3000`, and run `certbot` again for that subdomain.

### Step 4 — Configure CORS

Laravel needs to allow the web app's domain. In `backend/config/cors.php` (create it if it doesn't exist — Laravel uses framework defaults otherwise), set:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['https://app.yourdomain.com'],
```

### Step 5 — Build and distribute the mobile app

```bash
cd hostel/mobile
npm install -g eas-cli
eas login
eas build:configure
```

Set `EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api` in `.env` (or as an EAS secret), then:

```bash
eas build --platform android --profile production
```

This produces a downloadable `.aab` (for Google Play) or `.apk` (for direct distribution — common for internal/hostel-staff-only apps in Pakistan where a Play Store listing isn't needed yet). For the Play Store:

1. Create a Google Play Console developer account (one-time $25 fee).
2. Create a new app listing, upload the `.aab` from the EAS build.
3. Fill in the store listing, privacy policy (required — write one covering the CNIC/document uploads), and content rating.
4. Submit for review.

For fast internal testing without the Play Store: distribute the `.apk` directly (e.g. via a link, WhatsApp, or a service like Firebase App Distribution).

### Step 6 — Smoke test production

1. Register a guest account on the live web app; confirm the OTP email arrives.
2. Log in as Super Admin (seed one via `php artisan tinker` if needed — see below), onboard a test property.
3. Run through one full booking cycle end-to-end: register → verify → book → approve → pay → verify payment → checkout.
4. Confirm the scheduled command is running: `php artisan schedule:list` on the server, and check `storage/logs/laravel.log` the next day for `vouchers:manage-cycles` output.

**Seeding the first Super Admin in production:**

```bash
php artisan tinker
>>> \App\Models\User::create([
...   'name' => 'Super Admin',
...   'email' => 'admin@yourdomain.com',
...   'password' => bcrypt('a-strong-password'),
...   'role' => 'super_admin',
...   'email_verified_at' => now(),
... ]);
```

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Production value |
|---|---|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_URL` | `https://api.yourdomain.com` |
| `DB_CONNECTION` | `mysql` |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | your managed MySQL credentials |
| `FILESYSTEM_DISK` | `s3` |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `AWS_BUCKET` | your S3/Spaces credentials |
| `AWS_ENDPOINT` | leave empty for AWS S3; set for DigitalOcean Spaces/MinIO |
| `AWS_USE_PATH_STYLE_ENDPOINT` | `true` for most non-AWS S3-compatible providers |
| `QUEUE_CONNECTION` | `database` (make sure the worker from Step 2 is running) |
| `MAIL_MAILER` | a real transactional mail provider (e.g. `smtp` with a provider like Mailgun/SES) — `log` only works for local dev |
| `OTP_EXPIRY_MINUTES` | `10` (or your preference) |

### Web (`web/.env.local` or Vercel project settings)

| Variable | Production value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com/api` |

### Mobile (`mobile/.env` or EAS secret)

| Variable | Production value |
|---|---|
| `EXPO_PUBLIC_API_URL` | `https://api.yourdomain.com/api` |
