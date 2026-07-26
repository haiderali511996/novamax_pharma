# Deploying to cPanel shared hosting (no SSH, no Docker)

This is the path for `erp.novamaxpharma.com` on shared cPanel hosting using
**Setup Node.js App** (Passenger) for both the frontend and backend, with
MongoDB Atlas as the database (no local Mongo install possible/needed).

## ⚠️ Move the repo out of the public web root first

If you pulled the repo directly into `~/erp.novamaxpharma.com/` (the
subdomain's document root, shown by File Manager), **anyone on the internet
can currently browse to `erp.novamaxpharma.com/.git`, `/docker-compose.yml`,
`/README.md`, etc.** — that folder is served as-is by Apache. This exposes
your source code and, if `.git` isn't blocked, your full commit history.

Fix: move (or re-clone) the repo somewhere **outside** any domain's document
root, e.g. `~/novamax_pharma` (directly in your home directory, as a sibling
of `erp.novamaxpharma.com`, not inside it). cPanel's Node.js App tool lets you
point "Application Root" at any path relative to your home directory — it
does **not** need to live inside the public web folder. If you used cPanel's
"Git™ Version Control" tool to clone it, delete the current clone and redo it
targeting `novamax_pharma` instead of `erp.novamaxpharma.com`.

## 1. Backend — Setup Node.js App

In cPanel → **Software → Setup Node.js App → Create Application**:

| Field | Value |
|---|---|
| Node.js version | Latest available 20.x or 22.x |
| Application mode | Production |
| Application root | `novamax_pharma/backend` |
| Application URL | `erp.novamaxpharma.com` with path `api` (i.e. mounts at `/api`) |
| Application startup file | `src/server.js` |

Environment variables (add via the "Environment Variables" section on the
same screen — do **not** set `PORT`, cPanel/Passenger manages that):

```
NODE_ENV=production
MONGO_URI=mongodb+srv://clausiva2025_db_user:<password>@cluster0.spy5ugi.mongodb.net/novamax_erp?retryWrites=true&w=majority
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
JWT_EXPIRES_IN=7d
CLIENT_URL=https://erp.novamaxpharma.com
```

Click **Create**, then **Run NPM Install** (installs dependencies — no build
step needed for the backend).

Once running, verify it directly: `https://erp.novamaxpharma.com/api/health`
should return `{"success":true,"message":"NovaMax ERP API is running"}`.

## 2. Frontend — Setup Node.js App

Create a second application:

| Field | Value |
|---|---|
| Node.js version | Same as backend |
| Application mode | Production |
| Application root | `novamax_pharma/frontend` |
| Application URL | `erp.novamaxpharma.com` (root, no subpath) |
| Application startup file | `server.js` |

Environment variables:

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://erp.novamaxpharma.com/api
```

Click **Create**, then **Run NPM Install**. This also runs `next build`
automatically (`package.json` has a `postinstall` script that does this) —
so a plain "Run NPM Install" click is the entire deploy for the frontend.
`server.js` (a small Node/Passenger entry point already in the repo) is what
Passenger runs — it's not `next start`, it's a plain HTTP server wrapping
Next.js so Passenger can manage it like any other Node app.

## 3. Verify

Visit `https://erp.novamaxpharma.com` — you should see the login page. Log
in with the seeded admin (see below) and confirm a page that hits the API
(e.g. Dashboard) loads data, not an error.

## 4. Seed the first admin user

Since there's no terminal, run the seed script the same way you'd redeploy:
add a **one-off** environment-based trigger, or simplest — temporarily add a
throwaway route, OR (recommended) if cPanel's Node.js App page has a
"Terminal" / "Run JS script" affordance for your plan, use `node
src/utils/seed.js` there. If truly no shell access at all, ask your host
whether cPanel's Terminal app (jailshell, separate from full SSH) is
available — it's included on many shared plans and is enough to run this one
script once.

## Notes

- Uploaded files (license documents, expense receipts) are served under
  `/api/uploads/...` — this only works because the backend is mounted at
  `/api`; that mapping already matches what the frontend expects, no
  extra config needed.
- Re-deploying after a code change: pull the latest code into
  `~/novamax_pharma`, then click **Restart** on both apps in the Node.js App
  page (and **Run NPM Install** again on the frontend if `package.json`
  changed, to re-trigger the build).
