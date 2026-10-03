# AzureDrop — Secure File Storage Platform

Group 5 cohort 8 Capstone project for Techcrush Cloud computing Bootcamp.

## What this is
A secure file upload/download platform built on Azure — users upload files,
which are stored in Azure Blob Storage (not on the app server), with
metadata tracked in PostgreSQL and access secured via Managed Identity.

## Team
( Oluwaseun Samuel, Damilare, stanley, the rest will be added later in the day )

## Features

| Feature | Status |
|---|---|
| User authentication (register, login, current user) | Done |
| Forgot / reset password | Done |
| File upload / download | Done (needs a real Azure storage account to test) |
| File type and size validation (10 MB; PDF, Word, TXT, JPEG, PNG) | Done |
| File categories | Done |
| File search (by filename and/or category) | Done |
| Temporary file-sharing links (expire, public access without login) | Done |
| File metadata | Done |
| `/health` endpoint | Done |
| Docker, Nginx, HTTPS, GitHub Actions CI/CD | In progress (infra / CI-CD groups) |

## Tech stack
- **Backend:** Node.js + Express 5
- **Database:** PostgreSQL
- **File storage:** Azure Blob Storage
- **Auth:** JWT (bcryptjs for password hashing)
- **Deployment target:** Azure VM, Docker, Nginx reverse proxy, GitHub Actions

## Architecture
See [docs/architecture.md](docs/architecture.md)

## Documentation
| Doc | What it covers |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Big picture, backend layers, schema, endpoints |
| [docs/features-api.md](docs/features-api.md) | Request/response details for categories, search, share links, metadata, password reset |
| [docs/backend-setup.md](docs/backend-setup.md) | Running the backend, environment variables, tests |
| [docs/troubleshooting.md](docs/troubleshooting.md) | Common problems and fixes |
| [docs/optional/](docs/optional/) | Frontend guide and a plain-English "why we built it this way" |

## Setup (backend)

You need Node 18+ and PostgreSQL.

```bash
cd backend
npm install
cp .env.example .env                        # fill in the values; never commit .env
psql -d <your_db> -f src/config/schema.sql  # creates users, files, shared_links
npm run migrate                             # extra indexes + password reset table
npm start                                   # then open http://localhost:3000/health
```

All configuration comes from environment variables. See `backend/.env.example`
for the full list (database, JWT secret, Azure storage, optional SMTP for reset emails).

## API overview

Everything except register, login, forgot/reset password, `/health` and
`GET /share/:token` needs the header `Authorization: Bearer <token>`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Files | `POST /files/upload`, `GET /files`, `GET /files/:id/download` |
| Categories | `PATCH /files/:id/category`, `GET /files/categories`, `GET /files/category/:category` |
| Search | `GET /files/search?query=&category=&page=&limit=` |
| Metadata | `GET /files/:id/metadata` |
| Share links | `POST /files/:id/share`, `GET /files/:id/shares`, `DELETE /shares/:token`, `GET /share/:token` (public) |
| Health | `GET /health` |

Details: [docs/features-api.md](docs/features-api.md).

## Tests

`npm run test:e2e` (from `backend/`) runs 50 automated checks against a real
**test** database. See [docs/backend-setup.md](docs/backend-setup.md), section 6.

## Status
🚧 In progress — backend features complete and tested; deployment (Docker, Nginx,
HTTPS, CI/CD) and the frontend are being built by the other groups.
