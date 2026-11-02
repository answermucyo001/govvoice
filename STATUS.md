# GovVoice Rwanda — CFCS Platform: Complete

Backend (MySQL 8) and frontend (React/Vite) are fully implemented and verified against a live local MySQL instance.

## Client (`client/`)
- Vite + React + Tailwind, i18next (Kinyarwanda default, English, French), Rwanda flag colors, responsive.
- `vite build` passes; Playwright smoke tests pass (RW/EN/FR, persistence, auth, portals, 404, guards).
- Dev server: `http://127.0.0.1:5173/`.

## Server (`server/`)
- Node 24 + Express, MySQL 8 via `mysql2` pool + prepared statements, JWT access + refresh (HttpOnly cookie, rotation), bcrypt cost 12, Multer + Cloudinary/S3/local storage, SMS (console/AT/Twilio), node-cron escalation, express-validator validation, pino logging.
- Files: images/PDF only, max 5 files, 5MB each.
- Schema: 5 provinces / 30 districts / 416 sectors from `rwanda-geo`, 10 departments, 10 categories, users, submissions, attachments, notifications, audit logs.
- Roles: `citizen`, `district_head`, `super_admin`; one district head per district (functional unique index).
- National ID stored as AES-256-GCM `VARBINARY` plus SHA-256 hash for uniqueness.
- Demo seed: `SEED_DEMO=true` → citizen `citizen@example.rw` / `Citizen123!`, 6 sample submissions.
- Super admin: `admin@govvoice.rw` / `ChangeMe123!`.
- API smoke tests passed: register, login, refresh rotation, submission create/track, public portal, admin status updates, confirm/reopen/reply, attachments, super-admin district head CRUD, escalation job.
- Unit tests: `npm test` → 11/11 passing.

## Run locally
1. Start MySQL 8 on port 3307 with datadir `C:\Users\Students\AppData\Local\Temp\opencode\cfcs-mysql`.
2. `cd server && npm run migrate && npm run seed`
3. `cd server && npm start` (API on 5000)
4. `cd client && npm run dev` (web on 5173)
5. Open Google Chrome at `http://127.0.0.1:5173/`.

## Deployment
- Dockerfile (multi-stage, serves API + SPA on port 5000), `docker-compose.yml` (MySQL 8), `render.yaml`, `railway.json`, `vercel.json`.
- Health check: `/api/health`.
- `SERVE_CLIENT=true` serves `client/dist` from the API process for single-service deploys.