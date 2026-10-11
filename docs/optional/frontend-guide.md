# Frontend Guide (Optional)

How to call my backend endpoints from the frontend. Exact request/response details are in [../features-api.md](../features-api.md).

## Basics

- Put the API address in a setting (for example `VITE_API_URL`). Do not write it directly in code.
- Every endpoint needs the header `Authorization: Bearer <token>`, except `GET /share/:token`.
- Send JSON with `Content-Type: application/json`.
- Errors always look like `{ "error": "message" }`. Show the message to the user.
- IDs are plain text. Do not do maths on them.
- Dates are ISO text (UTC). Format them for the user.

## Data shapes

```ts
type FileMetadata = {
  id: number;
  filename: string;
  file_type: string;        // e.g. "application/pdf"
  file_size: number;        // bytes
  category: string;         // "other" if never set
  file_url: string;         // internal link, do NOT use it to download
  uploaded_at: string;
  uploader: { id: number; name: string };
};

type PagedFiles = {
  files: FileMetadata[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
};
```

## Small helper

```js
async function api(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(body && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error), { status: res.status });
  return data;
}
```

## Examples

**Search (leave out empty values, wait about 300 ms after typing):**
```js
const qs = new URLSearchParams({ query, category, page, limit: 20 });
const { files, pagination } = await api(`/files/search?${qs}`, { token });
```

**Categories:**
```js
const { categories } = await api("/files/categories", { token });   // [{ category, file_count }]
const { files } = await api(`/files/category/${encodeURIComponent(name)}`, { token });
```

**Set or reset a category** (free text, max 50 characters):
```js
await api(`/files/${id}/category`, { method: "PATCH", body: { category: "invoices" }, token });
await api(`/files/${id}/category`, { method: "PATCH", body: { category: null }, token }); // reset to "other"
```
"Invoices" and "invoices" match in filters, but show as two names in the category list. You may want to make them lowercase in the UI.

**File details page:**
```js
const { file } = await api(`/files/${id}/metadata`, { token });
```

**Create a share link:**
```js
const link = await api(`/files/${id}/share`, { method: "POST", body: { expires_in_minutes: 60 }, token });
const url = window.location.origin + link.share_path;
```
Good choices for the user: 15 minutes, 1 hour, 24 hours, 7 days (10080 minutes). The maximum is 10080.

**Public share page** (no login, no token):
```js
try {
  const data = await api(`/share/${token}`);
  // show data.file.*; the Download button goes to data.download_url
} catch (e) {
  if (e.status === 410) { /* "This link has expired" */ }
  else if (e.status === 404) { /* "Link not found" */ }
}
```
`GET /share/:token?redirect=1` sends the browser straight to the download, which works for a simple link.

**One thing to decide as a team:** the API path `/share/:token` and a frontend page with the same path would clash on one domain. Put the API under `/api`, or give the page another path like `/s/:token`.

**Manage links:** `GET /files/:id/shares` lists them. `DELETE /shares/:token` removes one (returns 204).

## What to do for each status

| Status | Meaning | What to show |
|---|---|---|
| 400 | Bad input | The error message |
| 401 | Not logged in or token expired | Go to login |
| 404 | Not found, or not your file | "File not found" |
| 410 | Share link expired (public endpoint) | "This link has expired" |
| 5xx | Server problem | "Something went wrong, try again" |
