# Backend Setup (Categories, Search, Share Links, Metadata)

How to run my part of the backend, how to add it to the main app, and what I assumed. API details are in [features-api.md](features-api.md).

## 1. Run it on your computer

You need Node 18+ and PostgreSQL 13+.

```bash
cd backend
npm install
cp .env.example .env     # open .env and fill in the values (never commit .env)
npm run migrate          # creates the shared_links table
npm start                # check http://localhost:3000/health
```

`npm run migrate` needs the `users` and `files` tables to exist already. It does not create them.

## 2. Environment variables

| Name | What it is |
|---|---|
| `PORT` | Port the app listens on (default 3000) |
| `DATABASE_URL` | PostgreSQL connection (or use `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`) |
| `PGSSL` | `true` if the database needs SSL |
| `JWT_SECRET` | Same secret the login code uses to sign tokens |
| `AZURE_STORAGE_ACCOUNT_NAME` | Storage account name. Use this on the Azure VM (Managed Identity, no key needed) |
| `AZURE_STORAGE_CONNECTION_STRING` | Only for local testing. It contains a key, so keep it out of Git |
| `SHARE_DEFAULT_EXPIRY_MINUTES`, `SHARE_MAX_EXPIRY_MINUTES` | Share link time limits (60 and 10080) |

### Azure setup for share links

1. Turn on a system-assigned managed identity for the VM.
2. In the storage account, give that identity two roles: **Storage Blob Data Reader** and **Storage Blob Delegator**.
3. Set `AZURE_STORAGE_ACCOUNT_NAME` on the VM.

## 3. Add it to the main app

1. Copy these into the main backend: `routes/features.js`, the four `*Controller.js` files for categories, search, share and metadata, `models/fileModel.js`, `models/shareModel.js`, `config/azureBlob.js`, `utils/http.js`, `migrations/`, `scripts/migrate.js`.
2. Copy `config/db.js` and `middleware/auth.js` **only if the app does not have them**. If it does, change the `require` paths to the existing ones. My `auth.js` is only a stand-in.
3. Install the packages: `@azure/identity`, `@azure/storage-blob`, `jsonwebtoken`, `pg`, `dotenv`, `express` (version 4).
4. In `app.js` add:
   ```js
   app.use('/', require('./routes/features'));    // put this BEFORE any router with /files/:id
   app.use(require('./utils/http').errorHandler); // last line, only if there is no error handler
   ```
5. Do not copy `dev-server.js`. It is only for running my part alone. Add `/health` only if the app does not have one.
6. Run `npm run migrate` on every environment, and add it to the GitHub Actions deploy.

Why step 4 matters: `/files/search` would be mistaken for `/files/:id` if the other router comes first.

## 4. Things I assumed (please confirm)

| # | I assumed | If wrong |
|---|---|---|
| 1 | Tables are called `users`, `files` (lowercase). I only add `shared_links`. | Change the table names in `models/` |
| 2 | `users.id` and `files.id` are UUIDs | Change `file_id` to `INTEGER` in `migrations/001_*.sql` |
| 3 | `files.file_size` is in bytes | Nothing to do |
| 4 | `files.category` can be empty (NULL). Categories are free text, max 50 characters | Add a fixed list in `categoryController.js` |
| 5 | `files.file_url` is the full blob link, and the container is private | Change `generateReadUrl` in `config/azureBlob.js` |
| 6 | Login middleware is `middleware/auth.js` and sets `req.user.id`. The token holds the id as `id` or `sub` | Replace my stand-in, keep `req.user.id` |
| 7 | `filename` is the name the user sees | Nothing to do |
| 8 | The partner's list/detail endpoints will use `toMetadata()` from `models/fileModel.js` | Agree on one shape |
| 9 | The partner's `/files/:id` routes are mounted after mine | See step 4 above |

## 5. My design choices

- People can only search, categorise, share and read metadata of **their own** files.
- Share tokens are random and cannot be guessed. Expiry is checked on the server every time (`410` when expired).
- The share page gives a short download link (10 minutes at most) so the storage container can stay private. It does not show who uploaded the file.
- Expired links are not deleted automatically. They just stop working.
- No rate limit on `/share/:token`. We can add one in Nginx later.
- I added a few extras: list categories, list share links, revoke a link, and paging.
- Not yet tested against a real database or Azure account. Test with the real tables before merging.
