# API Reference — Categories, Search, Share Links, Metadata

Covers the four features from the project brief ("File categories", "File search", "Temporary file-sharing links", "File metadata").
Code lives in `backend/routes/features.js`, `controllers/`, `models/`.

**Conventions**

- JSON in / JSON out. Errors are always `{ "error": "message" }`.
- 🔒 = needs `Authorization: Bearer <JWT>`. Users only ever see/modify **their own** files; another user's file returns `404` (not `403`) so IDs can't be probed.
- Common status codes: `400` bad input, `401` missing/invalid token, `404` not found, `410` expired link, `500` server error.

## Canonical file metadata object

Every endpoint that returns a file uses this shape (built by `toMetadata()` in `models/fileModel.js`):

```json
{
  "id": "…",
  "filename": "q3-invoice.pdf",
  "file_type": "application/pdf",
  "file_size": 48213,
  "category": "invoices",
  "file_url": "https://<account>.blob.core.windows.net/<container>/…",
  "uploaded_at": "2026-10-01T09:30:00.000Z",
  "uploader": { "id": "…", "name": "Ada Obi" }
}
```

`file_size` is in bytes (number). `category` is `null` when unset. Uploader email/password are never returned.

> **For the upload/download teammate:** please use `toMetadata()` (or the same shape) in the list/detail endpoints so metadata is consistent everywhere.

---

## 1. File categories

### 🔒 `PATCH /files/:id/category`

Set, change, or clear a file's category.

Body: `{ "category": "invoices" }` — trimmed, max 50 chars. `null` or `""` clears it.

Response `200`: `{ "file": <metadata> }` · `404` file not found / not yours · `400` invalid category.

### 🔒 `GET /files/categories`

The caller's categories with counts (uncategorised files are skipped).

```json
{ "categories": [ { "category": "invoices", "file_count": 4 }, { "category": "photos", "file_count": 12 } ] }
```

### 🔒 `GET /files/category/:category?page=1&limit=20`

Files in one category (case-insensitive exact match). Response: see [paged list](#paged-list-response).

## 2. File search

### 🔒 `GET /files/search?query=&category=&page=1&limit=20`

| Param | Meaning |
|---|---|
| `query` | Case-insensitive substring match on `filename`. `%` and `_` are matched literally. |
| `category` | Case-insensitive exact match on `category`. |
| `page`, `limit` | 1-based page; `limit` default 20, max 100. |

All filters optional and combinable (AND). With none, it lists all the caller's files, newest first.

Example: `GET /files/search?query=invoice&category=finance`

### Paged list response

```json
{
  "files": [ <metadata>, … ],
  "pagination": { "page": 1, "limit": 20, "total": 37, "total_pages": 2 }
}
```

## 3. Temporary sharing links

### 🔒 `POST /files/:id/share`

Create a link. Body (optional): `{ "expires_in_minutes": 60 }` — integer 1…10080 (default 60, max 7 days; configurable via env).

Response `201`:

```json
{
  "share_token": "k3J…(43 chars, 256-bit random)",
  "share_path": "/share/k3J…",
  "expires_at": "2026-10-02T11:00:00.000Z",
  "created_at": "2026-10-02T10:00:00.000Z",
  "file_id": "…"
}
```

The frontend builds the full URL as `<site origin>` + `share_path`.

### `GET /share/:token` — **public, no login**

Returns limited file info plus a short-lived download URL.

```json
{
  "file": { "id": "…", "filename": "…", "file_type": "…", "file_size": 48213, "category": "invoices", "uploaded_at": "…" },
  "download_url": "https://…blob.core.windows.net/…?<read-only SAS>",
  "download_url_expires_at": "…",
  "share_expires_at": "…"
}
```

- `?redirect=1` → `302` straight to the download instead of JSON.
- `404` unknown token · **`410` link expired** (checked server-side against `expires_at` on every request).
- `download_url` is a read-only Azure SAS valid for at most 10 min and never beyond the link's own expiry; the blob container can stay private. The uploader's identity is not exposed.

### 🔒 `GET /files/:id/shares`

Lists links for a file: `{ "shares": [ { id, file_id, share_token, expires_at, created_at, expired } ] }`.

### 🔒 `DELETE /shares/:token`

Revoke a link early. `204` on success, `404` if it doesn't exist / isn't yours. *(Extra beyond the brief — small and useful for a "temporary" link feature.)*

## 4. File metadata

### 🔒 `GET /files/:id/metadata`

Response `200`: `{ "file": <metadata> }` · `404` not found / not yours.

Search, category lists and category-update responses all include the same metadata object, so list views and detail views stay consistent.

## Health

`GET /health` → `{ "status": "ok", "database": "up" }` (`503` if the DB is unreachable). Defined in `backend/dev-server.js`; **skip it if the shared app already has one.**
