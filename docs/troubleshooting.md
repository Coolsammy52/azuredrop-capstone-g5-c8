# Troubleshooting

> Add new problems as you hit them: **Symptom → Cause → Fix**.

## Backend: categories, search, share links, metadata

| Symptom | Likely cause | Fix |
|---|---|---|
| `401 Authentication required` | No `Authorization: Bearer <token>` header | Log in and send the token |
| `401 Invalid or expired token` | Token expired, or `JWT_SECRET` differs from the one that signed it | Use the same `JWT_SECRET` as the auth module |
| `404 File not found` on a file that exists | The file belongs to a different user | Log in as the owner |
| `/files/search` returns "Invalid identifier" (400) | Another router's `/files/:id` caught the request first | Mount `routes/features.js` **before** the files router |
| `npm run migrate` fails: relation "files" does not exist | Upload teammate's tables aren't created yet | Create `users` and `files` first, then re-run |
| Migration fails: foreign key type mismatch | `files.id` isn't UUID | Change `file_id` type in `migrations/001_*.sql` to match |
| `410 This share link has expired` | `expires_at` has passed | Create a new link |
| Share download URL gives 403 from Azure | VM identity lacks roles, or link already expired | Grant **Storage Blob Data Reader** + **Storage Blob Delegator**; request a fresh URL |
| Share endpoint returns the plain blob URL | No Azure env vars set | Set `AZURE_STORAGE_ACCOUNT_NAME` (VM) or the connection string (local) |
| `/health` returns `503` | Database unreachable | Check `DATABASE_URL`/`PG*` values and that Postgres is running |
