# Troubleshooting

> Add new problems as you hit them: **Symptom → Cause → Fix**.

## Backend: categories, search, share links, metadata

| Symptom | Likely cause | Fix |
|---|---|---|
| `401 Authentication required` | No `Authorization: Bearer <token>` header | Log in and send the token |
| `401 Invalid or expired token` | Token expired, or `JWT_SECRET` differs from the one that signed it | Use the same `JWT_SECRET` as the auth module |
| `404 File not found` on a file that exists | The file belongs to a different user | Log in as the owner |
| `/files/search` returns "Invalid identifier" (400) | Another router's `/files/:id` caught the request first | Mount `src/routes/featureRoutes.js` **before** the `/files` router in `src/server.js` |
| `npm run migrate` fails: relation "files" does not exist | Upload teammate's tables aren't created yet | Create `users` and `files` first, then re-run |
| Migration fails: foreign key type mismatch | `files.id` isn't UUID | Change `file_id` type in `migrations/001_*.sql` to match |
| `410 This share link has expired` | `expires_at` has passed | Create a new link |
| Share download URL gives 403 from Azure | VM identity lacks roles, or link already expired | Grant **Storage Blob Data Contributor** + **Storage Blob Delegator**; request a fresh URL |
| Share endpoint returns the plain blob URL | No Azure env vars set | Set `AZURE_STORAGE_ACCOUNT_NAME` (VM) or the connection string (local) |
| API starts but every request fails with a database error | Wrong `DB_*` values, SSL missing, or the server firewall blocks this machine | Check `DB_*` (and `DB_SSL=true` for Azure Database for PostgreSQL) and the server firewall rules. `GET /health` only shows that the API is running, not that the database is reachable |

## Merge and setup problems

| Symptom | Likely cause | Fix |
|---|---|---|
| `npm install` fails with a JSON error after a merge | The merge left two JSON objects in `package.json` and `package-lock.json` | Keep one valid `package.json`, delete `package-lock.json`, run `npm install` |
| Clearing a category fails with a null error | `files.category` is `NOT NULL` | The API resets it to `other` instead of null |
| Foreign key type error when running migrations | `file_id` was created as UUID but `files.id` is `SERIAL` | Use `INTEGER` for `file_id` |
| Server won't start: "AZURE_STORAGE_CONNECTION_STRING is not configured" | Missing Azure values in `.env` | Fill in `AZURE_STORAGE_CONNECTION_STRING` and `AZURE_STORAGE_CONTAINER` |
| `npm run migrate` fails: relation "users" does not exist | Tables not created yet | Run `src/config/schema.sql` first, then `npm run migrate` |

## Forgot / reset password

| Symptom | Likely cause | Fix |
|---|---|---|
| No reset email arrives | `SMTP_HOST` is not set, so the link is only printed in the server console | Set `SMTP_*` and `MAIL_FROM` in `.env`, or copy the link from the console when testing |
| Reset link goes to the wrong site | `FRONTEND_URL` is wrong or missing | Set it to the frontend address |
| `400 Reset link is invalid or has expired` | Token older than 30 minutes, already used, or replaced by a newer request | Ask for a new link |
| `relation "password_reset_tokens" does not exist` | Migration 002 hasn't been run | `npm run migrate` |

## Running the test script

| Symptom | Likely cause | Fix |
|---|---|---|
| "Set TEST_DB_NAME and TEST_DB_PASSWORD first" | Variables not set | See [backend-setup.md](backend-setup.md), section 6 |
| "Refusing to run: ... does not look like a test database" | The database name must contain `test`, because the script empties its tables | Create a separate database such as `azuredrop_test` |
| `password authentication failed` | Wrong `TEST_DB_PASSWORD` | Use your Postgres password |
