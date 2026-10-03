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

See `backend/.env.example`. In short: `DB_*` for PostgreSQL, `JWT_SECRET`, `AZURE_STORAGE_CONNECTION_STRING` and `AZURE_STORAGE_CONTAINER` for file storage. Optional: `AZURE_STORAGE_ACCOUNT_NAME` (Managed Identity for share links on the VM) and `SHARE_*` time limits.

### Azure setup for Managed Identity (optional, for share links on the VM)

1. Turn on a system-assigned managed identity for the VM.
2. In the storage account, give that identity **Storage Blob Data Reader** and **Storage Blob Delegator**.
3. Set `AZURE_STORAGE_ACCOUNT_NAME` on the VM.

If it is not set, share links are signed with the connection string instead.

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
- Tested so far: the server starts and the routes and login check work. Not yet tested against a real database or Azure account.
