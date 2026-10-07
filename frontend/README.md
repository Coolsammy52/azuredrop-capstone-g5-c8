# AzureDrop frontend

React single-page app for AzureDrop, a secure file upload platform: upload, download, categorise, search and share files by temporary link. It talks to the AzureDrop backend API; there is no mock data.

Stack: Vite, React 18, React Router v6, Tailwind CSS (colours mapped to CSS variables for light and dark mode). No other UI framework.

## Requirements

- Node 18 or newer
- The AzureDrop backend running (default `http://localhost:3000`)

## Setup

```bash
cd frontend
npm install
cp .env.example .env     # then edit VITE_API_URL if needed
npm run dev              # http://localhost:5173
```

## Environment variable

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Base URL of the backend. Every request is built from this one value. In production it can be a path prefix such as `/api` when served behind Nginx. |

## Scripts

- `npm run dev` start the dev server
- `npm run build` production build into `dist/`
- `npm run preview` serve the production build locally

## Running against the local backend

1. `cd backend && npm install`
2. Copy `.env.example` to `.env` and fill it in
3. `psql -d <db> -f src/config/schema.sql`, then `npm run migrate`
4. `npm start` (port 3000)
5. In another terminal, start the frontend as above. CORS is open, so no proxy is needed.

Without email settings the backend prints password reset links in its console.

## Routes

| Route | Screen | Login |
|---|---|---|
| `/login`, `/signup`, `/forgot-password`, `/reset-password?token=` | Auth screens | no |
| `/s/:token` | Public shared-file page | no |
| `/` | My files (search, category filter, pager) | yes |
| `/upload` | Upload files | yes |
| `/files/:id` | File details, category, delete, share links | yes |
| `/account` | Account | yes |

## Folder structure

```
src/
  api/         client (URLs, token, errors) and one module per area
  components/  app shell, file list, dialog, pager, copy field, shared UI
  context/     auth, categories, theme, toasts
  hooks/       debounce, paged files
  pages/       one file per route
  styles/      tokens.css (design tokens) and base.css
  utils/       size/date formatting, file-type chips, upload validation
```

## Behaviour notes

- The JWT expires after 1 hour. Any 401 from a private call clears the token, returns to `/login` and shows "Your session expired. Log in again."
- "Keep me signed in" stores the token in `localStorage`; otherwise `sessionStorage`.
- Downloads use `fetch` with the Authorization header and save the blob, because a plain link cannot send the token.
- Uploads go one after another, with progress through `XMLHttpRequest`. Files are checked in the browser first (10 MB, PDF/DOC/DOCX/TXT/JPG/PNG).
- Share links are shown as `<this site>/s/<token>`.
- "Delete file" on the file details page asks for confirmation, then removes the file, its share links and its record for good (`DELETE /files/:id`).

## Common problems

- **"Can't reach the server"**: the backend is not running or `VITE_API_URL` is wrong. Restart `npm run dev` after editing `.env`.
- **Blank page after deploy on a sub-path or Nginx**: configure the server to fall back to `index.html` for unknown paths so routes like `/s/:token` work on refresh.
- **Reset link does nothing**: links work once and expire after 30 minutes; request a new one.

## Preview mode (review without a backend)

`npm run dev:preview` starts the app with sample data and a fake signed-in user, so every screen can be reviewed without the backend or Azure. A "Preview mode" badge is shown in the corner. Useful addresses: `/s/demo-active`, `/s/demo-expired`, `/s/anything` (share page states), `/reset-password?token=abc` (or `token=bad` for the error). Name an upload file with "fail" in it to see the upload error state. Data resets on reload.

This is fake data for review only. Before the final hand-in, delete `src/preview/`, `.env.preview`, the `dev:preview` script and the preview block in `src/main.jsx`.
