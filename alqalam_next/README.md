# AL Qalam Next.js Starter

This folder is the migration start from the current app to Next.js.

## 1) Install

```bash
npm install
```

## 2) Environment

Copy `.env.local.example` to `.env.local` and set:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

Use your deployed Node API URL in production.

## 3) Run

```bash
npm run dev
```

## Current scope

- Landing page (`/`) with STREAM-first blocks
- Login (`/login`) -> calls `POST /auth/login`
- Dashboard (`/dashboard`) + module routes:
  - `/dashboard/students`
  - `/dashboard/staff`
  - `/dashboard/attendance`
  - `/dashboard/fee`

## Component architecture

- `src/components/ui` -> reusable primitives
- `src/components/modules` -> domain modules
- `src/features/*` -> session logic and API contracts

## Deployment model

- Frontend and backend deploy independently
- Configure API target via `.env.local` only (`NEXT_PUBLIC_API_BASE_URL`)
- Contract reference: `docs/API_CONTRACT.md`

## Smoke test

```bash
SMOKE_USERNAME=admin SMOKE_PASSWORD=yourpass NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 npm run smoke
```
