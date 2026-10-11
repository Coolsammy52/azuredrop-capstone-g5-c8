# Backend Setup

How to run the backend (auth, upload/download, validation, categories, search, share links, metadata). API details for categories, search, share links and metadata are in [features-api.md](features-api.md).

## 1. Run it on your computer

You need Node 18+ and PostgreSQL.

```bash
cd backend
npm install
cp .env.example .env     # open .env and fill in the values (never commit .env)
psql -d <your_db> -f src/config/schema.sql    # creates users, files, shared_links
npm run migrate          # adds extra indexes (safe to run again)
npm start                # check http://localhost:3000/health
```

## 2. Folder layout (all code is in `backend/src/`)

```
src/server.js          starts the app, mounts the routes
src/routes/            authRoutes, fileRoutes (upload/download), featureRoutes (categories, search, share, metadata)
src/controllers/       authController, fileController, category/search/share/metadata controllers
src/models/            fileModel, shareModel (SQL for my features)
src/middleware/        authMiddleware (checks the JWT, sets req.user.id)
src/config/            db.js, azureStorage.js, azureBlob.js (share links), schema.sql
src/utils/http.js      error handler helpers
migrations/ + scripts/ extra indexes for search; run with npm run migrate
```

## 3. Environment variables

See `backend/.env.example`. In short: `DB_*` for PostgreSQL (add `DB_SSL=true` for Azure Database for PostgreSQL), `JWT_SECRET`, `AZURE_STORAGE_CONTAINER`, and one way to reach storage: `AZURE_STORAGE_ACCOUNT_NAME` (Managed Identity, for the VM) or `AZURE_STORAGE_CONNECTION_STRING` (local development). If the account name is set it wins. Optional: `SHARE_*` time limits and `SMTP_*` for reset emails.

### Azure setup for Managed Identity (recommended on the VM)

1. Turn on a system-assigned managed identity for the VM.
2. In the storage account, give that identity **Storage Blob Data Contributor** (upload and download) and **Storage Blob Delegator** (share links).
3. Set `AZURE_STORAGE_ACCOUNT_NAME` on the VM.

Upload, download and share links all use the identity. Leave the connection string unset on the VM.

## 4. How the two parts fit together

| Question | Answer (from the auth/upload code) |
|---|---|
| Type of `users.id` and `files.id` | `SERIAL` integers, so `shared_links.file_id` is `INTEGER` |
| How the user id gets into a request | JWT holds `{ userId }`; `authMiddleware` sets `req.user.id` |
| What `files.file_url` holds | Full blob URL: `https://<account>.blob.core.windows.net/<container>/users/<id>/<time>-<name>` |
| Category on upload | `files.category` is `NOT NULL`, upload sets `"other"` |
| Route order | `featureRoutes` is mounted **before** `/files` in `server.js` |

Things to know:
- Clearing a category (null or empty) sets it back to `"other"`, because the column cannot be empty.
- The schema doc says the users column is `password`, but `schema.sql` uses `password_hash`. The code is consistent with `password_hash`; the docs should match.
- `shared_links` is defined in `schema.sql` and in my migration with the same columns. Either can run first.
- `expires_at` is `TIMESTAMP` (no time zone). It works as long as the server's time zone does not change.

## 5. My design choices

- People can only search, categorise, share and read metadata of **their own** files.
- Share tokens are random and cannot be guessed. Expiry is checked on the server every time (`410` when expired).
- The share page gives a short download link (10 minutes at most), so the container can stay private. It does not show who uploaded the file.
- Expired links are not deleted automatically. They just stop working.
- No rate limit on `/share/:token`. We can add one in Nginx later.
- Extras beyond the brief: list categories, list share links, revoke a link, and paging.
- Tested: 54 automated checks pass against a real PostgreSQL database (see section 6). Not yet tested: real file upload/download against Azure Blob Storage.

## 6. Run the automated test

`npm run test:e2e` starts the server and checks every endpoint (54 checks: auth, forgot/reset password, categories, search, metadata, share links, security). It needs a **separate test database**, because it empties the tables. It refuses to run unless the database name contains `test`.

```bash
# 1. create an empty database, e.g. azuredrop_test (pgAdmin: right-click Databases -> Create)
# 2. set these, then run (PowerShell):
$env:TEST_DB_NAME="azuredrop_test"; $env:TEST_DB_PASSWORD="<your postgres password>"
npm run test:e2e
```

Optional: `TEST_DB_HOST` (localhost), `TEST_DB_PORT` (5432), `TEST_DB_USER` (postgres), `TEST_API_PORT` (3100). The script creates the tables itself. Real file upload, download and delete are not covered (they need a real Azure storage account), so test those by hand with your real `.env`.
