# AL Qalam — how to run (final stack)

Canonical production path:

- **Backend (API):** `alqalam_node_server.js` at repo root `D:\Al Qalam 2.0`
- **Web frontend:** `alqalam_next` (Next.js)
- **Mobile (optional):** `alqalam_mobile` (Expo)

Legacy HTML/PHP lives under `legacy_archive/` (reference only). See `LEGACY_FREEZE.md`.

---

## Prerequisites

- **Node.js** 18+ (`node -v`)
- **MySQL** with database imported from `alqalam_database.sql` (or your existing `alqalam_db`)
- **npm** (`npm -v`)

---

## 1) Backend (Node + Express + MySQL)

```powershell
cd "D:\Al Qalam 2.0"
npm install
```

Create `.env` in the **same folder** as `alqalam_node_server.js` (repo root). Minimum:

```env
PORT=3000
APP_ENV=development

DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=alqalam_db
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

JWT_SECRET=use_a_long_random_string_in_production
JWT_EXPIRY=24h
```

Start:

```powershell
npm run dev
```

Or production-style:

```powershell
npm start
```

Check: open `http://localhost:3000/health` — should return JSON with `status: ok` when DB is up.

API base for the web app: `http://localhost:3000` (or your deployed API URL).

---

## 2) Web frontend (Next.js)

```powershell
cd "D:\Al Qalam 2.0\alqalam_next"
npm install
```

Copy env example and set the API URL:

```powershell
copy .env.local.example .env.local
```

Edit `alqalam_next/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

Start dev server:

```powershell
npm run dev
```

Open: `http://localhost:3000` (landing) → **Login** at `/login` → **Dashboard** at `/dashboard` and module routes under `/dashboard/*`.

---

## 3) Optional: API smoke test

With backend running and valid credentials:

```powershell
cd "D:\Al Qalam 2.0\alqalam_next"
$env:SMOKE_USERNAME="your_user"
$env:SMOKE_PASSWORD="your_pass"
$env:NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
npm run smoke
```

---

## Deploy (separate hosts)

- **Backend:** any Node host; set the same env vars; expose HTTPS; allow CORS from your Next origin.
- **Frontend:** Vercel/Netlify/self-host; set `NEXT_PUBLIC_API_BASE_URL` to the public API URL only in the Next build environment.

No code change needed when the API URL changes — only environment variables.
