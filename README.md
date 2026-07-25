# NovaMax Pharma ERP

Internal ERP system for NovaMax Pharmaceutical, built with Next.js, Node.js/Express, and MongoDB.

## Modules

- **Core**: Authentication (JWT), role-based access control, user management, dashboard
- **Inventory**: Products, batches with expiry tracking, warehouses, stock movements
- **Sales**: Customers, sales orders, invoices
- **Purchases**: Suppliers, purchase orders
- **Distribution**: Territories/areas, distributors (with the products and promotional items they carry), and distributor invoices — each invoice also captures the receiving pharmacy's name, license number and address, since every distributor prints its own invoice format
- **HR & Payroll**: Employees, attendance, leaves, payroll, and an org chart (CEO down to office boy) built from each employee's "Reports To" and territory assignment
- **Finance**: Chart of accounts, transactions, expenses
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

Resources: `products`, `batches`, `warehouses`, `stock-movements`, `customers`, `suppliers`, `sales-orders`, `purchase-orders`, `invoices`, `territories`, `distributors`, `distributor-invoices`, `employees`, `attendance`, `leaves`, `payroll`, `accounts`, `transactions`, `expenses`, `licenses`, `users`.

Extra endpoints:
- `GET /api/batches/expiry-alerts?days=90` — batches expiring within N days
- `GET /api/licenses/renewal-alerts?days=60` — licenses needing renewal soon
- `GET /api/employees/org-chart` — flattened employee list for building the reporting-hierarchy tree
- `GET /api/notifications` / `PUT /api/notifications/:id/read` / `POST /api/notifications/scan-overdue` (admin/manager) — the overdue-invoice intimation system
- `GET /api/dashboard/summary` — aggregated stats for the dashboard home page
