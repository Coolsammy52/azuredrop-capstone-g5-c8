# AzureDrop Architecture

> Each section below is owned by the person who built that part. Add yours under its own heading.

## 1. Big picture

```
Browser (frontend)
      │  HTTPS
      ▼
   Nginx (reverse proxy)          ← Azure VM
      │
      ▼
  Node.js / Express API
      ├──► PostgreSQL        users, files (info), shared_links
      └──► Azure Blob Storage   the actual file bytes
```

- The browser only ever talks to the API. The API checks the JWT, applies the rules, then uses the database and storage.
- PostgreSQL stores *information about* files; Blob Storage stores the *files themselves*. `files.file_url` links the two.

## 2. Backend architecture

The backend is split in layers; each folder has one job:

```
backend/
  routes/        which URL calls which function
  controllers/   validate input, decide the response
  models/        all SQL (talks to PostgreSQL)
  middleware/    auth (JWT → req.user)
  config/        database pool, Azure Blob client (read from env vars)
  utils/         shared helpers, error handler
  migrations/    SQL that creates/changes tables
```

A request flows: `route → auth middleware → controller → model → PostgreSQL → JSON response`.

### Database (fixed schema)

| Table | Columns |
|---|---|
| `users` | id, name, email, password (hashed), created_at |
| `files` | id, user_id → users.id, filename, file_type, file_size, category, file_url, uploaded_at |
| `shared_links` | id, file_id → files.id, share_token (unique), expires_at, created_at |

### Endpoints by feature

| Feature | Endpoints | Owner |
|---|---|---|
| Auth, upload/download, validation | *(add yours here)* | partner |
| Categories | `PATCH /files/:id/category`, `GET /files/categories`, `GET /files/category/:category` | Dammy |
| Search | `GET /files/search?query=&category=` | Dammy |
| Share links | `POST /files/:id/share`, `GET /share/:token` (public), `GET /files/:id/shares`, `DELETE /shares/:token` | Dammy |
| Metadata | `GET /files/:id/metadata` | Dammy |
| Health | `GET /health` | shared |

Full request/response details: [features-api.md](features-api.md).

### Security rules

- No secrets in code — everything comes from environment variables (`backend/.env.example`).
- Users can only see and change their own files.
- Share links use a random token, expire server-side, and give out a short-lived read-only download URL; the storage container stays private.
- On Azure, the VM uses Managed Identity to reach Blob Storage (no keys stored).

## 3. Deployment

Azure VM → Nginx (HTTPS, reverse proxy) → Node API; code deployed by GitHub Actions; `/health` is used to check a release. *(DevOps owner: add details here.)*
