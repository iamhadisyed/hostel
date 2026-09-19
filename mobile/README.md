# Hostel Management - Mobile App

React Native (Expo) app for the multi-tenant hostel/hotel management platform. Single codebase, single login, role-based navigation stack resolved from the authenticated user's role - matching the web app's feature set for Super Admin, Owner, Warden, Front Desk, and Student/Visitor.

## Setup

```bash
npm install
cp .env.example .env
```

Set `EXPO_PUBLIC_API_URL` in `.env` to point at your running Laravel backend:

- Android emulator: `http://10.0.2.2:8000/api` (the default)
- Physical device on the same network: `http://<your-machine-LAN-IP>:8000/api`
- iOS simulator: `http://localhost:8000/api`

## Run

```bash
npm run android   # Android emulator/device (primary target)
npm run ios       # iOS simulator (macOS only)
```

## Structure

- `src/libs/api.ts` - typed fetch client, Sanctum bearer token stored via AsyncStorage
- `src/contexts/AuthContext.tsx` - session state (login/register/logout/refresh)
- `src/navigation/RootNavigator.tsx` - picks the role's tab navigator once authenticated
- `src/screens/<role>/` - screens per role, mirroring the web app's feature set
- `src/components/ui.tsx` - small shared UI kit (no external UI library dependency)

## Notes

- The property-setup wizard (Super Admin) is intentionally simplified to a single-floor form on mobile - full multi-floor onboarding is a desktop task; the web app covers it in full.
- `VerifyEmailBanner` reflects the spec's rule that unverified guests can still browse and submit booking requests - only voucher generation is gated on verification, enforced by the backend.
