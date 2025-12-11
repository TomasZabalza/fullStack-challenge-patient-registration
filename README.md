## Backend Overview

This repository contains a backend implemented with Express + Prisma targeting PostgreSQL. It includes Dockerized development tooling, validation, file upload handling for document photos, and an outbox-based async email confirmation flow.

**Tech choice note:** The stack uses Node.js (Express) for the API and Angular for the frontend instead of the suggested Laravel/React pairing, reflecting my experience and allowing faster delivery while still meeting the challenge requirements (Postgres, validation, async email, drag/drop uploads, etc.).

### How requirements are met
- **Patient API with validation and unique email**: `backend/src/routes/patients.ts` exposes `POST /patients` to create and `GET /patients` to list. Validation lives in `backend/src/validators/patientValidators.ts` (letters-only full name, `@gmail.com` email, formatted phone country code/number). The route calls `backend/src/services/patientService.ts` which catches Prisma unique constraint errors and surfaces 409 on duplicate emails.
- **Document photo upload (.jpg only, drag-n-drop friendly)**: `multer` handles `documentPhoto` in `POST /patients` with the file filter in `backend/src/validators/uploadValidators.ts` enforcing `.jpg`/JPEG and a 5MB limit. Files are stored under `backend/uploads/documents/` and served statically via `/uploads/...` (`backend/src/app.ts`). The frontend can use drag-and-drop because the endpoint accepts multipart form-data.
- **Phone split into country code and number**: Stored separately as `phoneCountryCode` and `phoneNumber` on the `Patient` model (`backend/prisma/schema.prisma`) and returned grouped under `phone` in responses.
- **PostgreSQL persistence**: Prisma models (`Patient`, `EmailOutbox`) live in `backend/prisma/schema.prisma` with migrations in `backend/prisma/migrations/...`. Prisma connects through a pg adapter configured in `backend/src/lib/prisma.ts`.
- **Email uniqueness**: Prisma schema marks `email` as `@unique`; handled in the create route with a specific conflict response.
- **Async confirmation email (non-blocking)**: Successful patient creation writes to `EmailOutbox` within the same transaction in the service layer (`backend/src/services/patientService.ts`). A polling worker (`backend/src/workers/outboxWorker.ts`) runs on server start (`backend/src/index.ts`) and sends messages via Mailtrap SMTP (`backend/src/services/mailer.ts`), updating outbox status to SENT/FAILED.
- **Health check**: `GET /health` in `backend/src/app.ts` returns `{ status: "ok" }`.
- **Dockerized environment**: `docker-compose.yml` spins up Postgres (`db`) and the backend (`backend`). The backend Dockerfile (`backend/Dockerfile`) installs dependencies, builds TypeScript, and runs the server. Compose mounts `backend/uploads` for persisted uploads and runs migrations on start.
- **Environment configuration**: Sample envs in `backend/.env.example` (PORT, DATABASE_URL, Mailtrap creds, MAIL_FROM). Runtime config loader in `backend/src/config/env.ts` validates required variables.

### API surface
- `GET /health` – liveness check.
- `GET /patients` – list patients (newest first), returns card-ready data including `documentPhotoUrl`.
- `POST /patients` – multipart form-data with fields: `fullName`, `email`, `phoneCountryCode`, `phoneNumber`, `documentPhoto` (JPEG). Returns 400 with field-level errors on validation issues, 409 on duplicate email, 201 with created patient on success.

### Data model (Prisma)
- `Patient`: `id`, `fullName`, `email` (unique), `phoneCountryCode`, `phoneNumber`, `documentPhotoPath`, timestamps, relation to `EmailOutbox`.
- `EmailOutbox`: `id`, `patientId`, `toEmail`, `subject`, `body`, `status` (`PENDING|SENT|FAILED`), `error`, `sentAt`, timestamps.

### Running locally with Docker
1) `cp backend/.env.example backend/.env` and fill Mailtrap credentials.  
2) From repo root: `docker compose up --build backend db` (runs migrations then starts API on port 4000).  
3) Access API at `http://localhost:4000`; uploaded images available under `http://localhost:4000/uploads/...`.

### Useful scripts (inside `backend`)
- `npm run dev` – ts-node-dev server (needs local Postgres and `.env`).
- `npm run db:migrate` – run Prisma migrate dev.
- `npm run db:deploy` – apply migrations in production/compose.
- `npm run prisma:generate` – regenerate Prisma client.
- `npm run build` – compile TypeScript (runs prisma generate beforehand).

## Frontend Overview (Angular)
- **App structure**: Minimal root `app.ts` renders a common navbar and `router-outlet`. Main page logic lives in `src/app/pages/home/home.component.ts/html/scss`. Shared components under `src/app/components/` and `src/app/common/`.
- **API client**: `src/app/services/patient.service.ts` targets `environment.apiBase` (configurable via `src/environments/environment*.ts`) and normalizes document photo URLs to absolute backend paths. Pagination params (`page`, `limit`) are sent when listing.
- **Listing cards**: `src/app/components/patient-list/*` renders patient cards with loading skeletons, empty/error states, expand handling, and pager controls. Each card (`patient-card/*`) shows name/photo collapsed, expands to phone and date details; avatar is fixed top-right.
- **Add patient modal**: `src/app/components/patient-form-modal/*` contains the drag/drop JPEG upload, Gmail-only email validation, split phone fields, per-field errors on submit, and success/error status messaging. Drag/drop delegates back to the home page for file handling.
- **Page wiring**: `home.component.ts` coordinates state (patients, expanded card, pagination, modal visibility, submission status), loads data on init, refreshes after create, and owns validation/file checks. Button triggers open the modal; submission calls backend and auto-refreshes the list on success.
- **Styling/layout**: Global base styles in `src/styles.scss` (fonts, reset). Page and hero/board styling in `pages/home/*.scss`; card/list/modal styling co-located with components. Responsive grid (3/2/1 columns) to prevent card pile-up.
- **Environment config**: `src/environments/environment.ts` (dev) and `environment.prod.ts` (compose/prod) define `apiBase`. Update these to point the frontend at the correct backend host.
- **Testing placeholders**: Spec stubs added for navbar, list, card, form modal, and home components (under respective folders) for future unit tests.

## Setup Guide
1) Clone repo and install dependencies:
   - Backend: `cd backend && npm ci`
   - Frontend: `cd frontend/patient-registration && npm ci`
2) Environment files:
   - Backend: copy `backend/.env.example` to `backend/.env` and set DB + Mailtrap creds.
   - Frontend: configure API base in `frontend/patient-registration/src/environments/environment*.ts` if not using defaults.
3) Database & migrations:
   - Ensure Postgres available (Docker compose provides one).
   - Run `npm run db:migrate` inside `backend` (or `docker compose up --build` to auto-apply).
4) Run locally:
   - Backend: `npm run dev` (http://localhost:4000)
   - Frontend: `npm start` from `frontend/patient-registration` (http://localhost:4200)
5) Docker (full stack): from repo root `docker compose up --build`. Backend on 4000, frontend on 4200, Postgres on 5432.
6) Tests/lint:
   - Backend: `npm run lint` and `npm test`
   - Frontend: `npm run lint`
