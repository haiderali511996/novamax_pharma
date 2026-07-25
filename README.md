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
- **Compliance**: Drug licenses, GMP certificates and other regulatory documents with renewal alerts
- **Notifications**: Automatic intimation to the Sales team when a customer or distributor invoice has been unpaid for 30+ days (background scan every 6 hours, plus a manual "Run Scan Now" for admins/managers)

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

### 1. Backend

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

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local   # points to the backend API
npm install
npm run dev              # starts the UI on http://localhost:3000
```

Log in with the seeded admin account, then use the sidebar to manage each module. As `admin`, you can also create additional users with specific roles under **Administration → Users**.

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
