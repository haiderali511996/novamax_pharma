# NovaMax Pharma ERP

Internal ERP system for NovaMax Pharmaceutical, built with Next.js, Node.js/Express, and MongoDB.

## Modules

- **Core**: Authentication (JWT), role-based access control, user management, dashboard
- **Inventory**: Products (linked to Manufacturer), batches with expiry tracking, warehouses, stock movements. Sales/Purchase Orders adjust real stock automatically (see Sales/Purchases below)
- **Sales**: Customers, sales orders, invoices, returns. Confirming a sales order deducts stock (FEFO across batches if none was chosen on the line) and can generate the matching customer invoice in one action
- **Purchases**: Suppliers, manufacturers, purchase orders. Receiving a purchase order creates/tops up the relevant batch and logs the stock-in movement
- **Returns**: Customer or distributor returns restock the exact batch and credit the party's ledger once approved
- **Distribution**: Territories/areas, distributors (with the products and promotional items they carry), and distributor invoices — each invoice also captures the receiving pharmacy's name, license number and address, since every distributor prints its own invoice format
- **Field Force**: Doctor/chemist/hospital visit logs for medical reps, sales targets with live target-vs-achieved (computed from confirmed orders attributed to the rep), and expense claims with an approve → reimburse workflow
- **HR & Payroll**: Employees, attendance, leaves, payroll, and an org chart (CEO down to office boy) built from each employee's "Reports To" and territory assignment
- **Finance**: Chart of accounts, transactions, expenses (Salaries, Running Expense, Office Expense, Promotional Material, Other)
- **Ledgers**: Running-balance account statements per Customer, Distributor, Manufacturer, and Employee, plus a categorized Expense register. Customer/distributor invoices, paid payroll, approved returns, and reimbursed expense claims all auto-post ledger entries; everything else is entered manually
- **Reports**: Stock valuation, aged receivables, aged payables, sales by territory, and a monthly profit & loss — every list and report can export to CSV
- **Compliance**: Drug licenses (with real file uploads for the actual document), GMP certificates and other regulatory documents with renewal alerts
- **Notifications**: Automatic intimation to the Sales team — in-app and by email — when a customer or distributor invoice has been unpaid for 30+ days (background scan every 6 hours, plus a manual "Run Scan Now" for admins/managers)
- **Printable invoices**: Browser print-to-PDF views for both customer and distributor invoices, itemized when line items exist
- **Audit log**: Every create/update/delete across the system, plus key workflow actions (confirm, receive, approve, reject), with before/after snapshots — admin only

## Roles

`admin`, `manager`, `pharmacist`, `sales`, `hr`, `accountant`, `staff`

## Project structure

```
backend/    Express REST API (Node.js + MongoDB/Mongoose)
frontend/   Next.js App Router UI (Tailwind CSS)
```

## Getting started

### Prerequisites

- Node.js 20.9+
- A running MongoDB instance (local or Atlas)

### Option A: Docker Compose (Mongo + backend + frontend together)

```bash
docker compose up --build
```

Frontend at http://localhost:3000, API at http://localhost:5000. Set `JWT_SECRET` (and optionally `SMTP_*`) in a `.env` file next to `docker-compose.yml`, or export them before running — see `docker-compose.yml` for the full list. Then seed the first admin user:

```bash
docker compose exec backend npm run seed
```

### Option B: Run each app directly

#### 1. Backend

```bash
cd backend
cp .env.example .env   # edit MONGO_URI / JWT_SECRET as needed
npm install
npm run seed            # creates the first admin user
npm run dev              # starts the API on http://localhost:5000
```

Default seeded admin credentials (override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars):

- Email: `admin@novamaxpharma.com`
- Password: `Admin@123`

#### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local   # points to the backend API
npm install
npm run dev              # starts the UI on http://localhost:3000
```

Log in with the seeded admin account, then use the sidebar to manage each module. As `admin`, you can also create additional users with specific roles under **Administration → Users**.

## Testing

```bash
cd backend
npm test
```

Runs the full Jest + Supertest suite (59 tests across 13 files) against an isolated in-memory MongoDB per test file — no external database needed. A GitHub Actions workflow (`.github/workflows/ci.yml`) runs this plus the frontend build on every push/PR.

## Deploying to production (erp.novamaxpharma.com)

Two supported paths, depending on what kind of hosting you have:

- **Shared hosting / cPanel, no SSH, no Docker** → see [`DEPLOY-CPANEL.md`](./DEPLOY-CPANEL.md)
  (uses cPanel's "Setup Node.js App" / Passenger for both apps).
- **VPS with Docker** → follow the steps below.

This uses MongoDB Atlas (not the local `mongo` container) and nginx as a reverse
proxy in front of the two app containers.

1. **Atlas**: Network Access must allow the production server's IP (or
   `0.0.0.0/0` if the server's IP isn't static). Database user/password are
   already in the connection string.
2. **On the server**: install Docker + Docker Compose, clone this repo, then
   copy `.env.production.example` to `.env` (same directory as
   `docker-compose.prod.yml`) and fill in `MONGO_URI` / `JWT_SECRET` (generate
   one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
   `.env` is gitignored — it never gets committed.
3. **Build and start**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
   The backend binds to `127.0.0.1:5000` and the frontend to `127.0.0.1:3000` —
   neither is exposed to the internet directly; nginx is the only public entry
   point.
4. **DNS**: point `erp.novamaxpharma.com`'s A record at the server's IP.
5. **nginx + TLS**: copy `deploy/nginx.conf` to
   `/etc/nginx/sites-available/erp.novamaxpharma.com`, symlink it into
   `sites-enabled`, `nginx -t && systemctl reload nginx`, then run
   `certbot --nginx -d erp.novamaxpharma.com` to get HTTPS (certbot rewrites
   the config to redirect HTTP → HTTPS).
6. **Seed the first admin user**:
   ```bash
   docker compose -f docker-compose.prod.yml exec backend node src/utils/seed.js
   ```

## Security notes

- Login/register are rate-limited (20 requests / 15 min / IP); the rest of the API carries a looser ceiling (1000 requests / 15 min / IP) as defense-in-depth
- `helmet` is applied globally; CORS is open by default (`CLIENT_URL=*`) since auth is Bearer-token based, not cookie-based — tighten `CLIENT_URL` in production if desired

## API overview

All endpoints (except `/api/auth/login` and `/api/auth/register`) require a `Authorization: Bearer <token>` header. REST resources follow the same convention:

```
GET    /api/<resource>          list (supports ?search=&page=&limit=)
POST   /api/<resource>          create
GET    /api/<resource>/:id      retrieve
PUT    /api/<resource>/:id      update
DELETE /api/<resource>/:id      delete
```

Resources: `products`, `batches`, `warehouses`, `stock-movements`, `customers`, `suppliers`, `manufacturers`, `sales-orders`, `purchase-orders`, `invoices`, `returns`, `territories`, `distributors`, `distributor-invoices`, `field-visits`, `sales-targets`, `expense-claims`, `employees`, `attendance`, `leaves`, `payroll`, `accounts`, `transactions`, `expenses`, `licenses`, `users`.

Extra endpoints:
- `GET /api/batches/expiry-alerts?days=90` — batches expiring within N days
- `GET /api/licenses/renewal-alerts?days=60` — licenses needing renewal soon
- `GET /api/employees/org-chart` — flattened employee list for building the reporting-hierarchy tree
- `GET /api/notifications` / `PUT /api/notifications/:id/read` / `POST /api/notifications/scan-overdue` (admin/manager) — the overdue-invoice intimation system
- `GET /api/ledger-entries?partyType=&party=` / `POST /api/ledger-entries` / `PUT|DELETE /api/ledger-entries/:id` — raw ledger entries
- `GET /api/ledger-entries/statement?partyType=customer|distributor|manufacturer|employee&party=<id>` — running-balance statement for one party
- `POST /api/sales-orders/:id/confirm` — deducts stock (FEFO) and marks the order confirmed
- `POST /api/sales-orders/:id/generate-invoice` — creates the customer invoice for a confirmed order
- `POST /api/purchase-orders/:id/receive` — creates/tops up batches and marks the PO received
- `POST /api/returns/:id/approve` / `POST /api/returns/:id/reject` — restocks + credits the ledger, or leaves everything untouched
- `GET /api/sales-targets/:id/progress` — target vs. achieved, computed live from confirmed orders
- `POST /api/expense-claims/:id/approve` / `POST /api/expense-claims/:id/reject` — reimburse (posts an Expense + employee ledger credit) or reject
- `GET /api/reports/stock-valuation` / `aged-receivables` / `aged-payables` / `sales-by-territory` / `profit-loss?month=&year=`
- `GET /api/dashboard/summary` — aggregated stats for the dashboard home page
