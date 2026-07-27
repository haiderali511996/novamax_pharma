// Content for the in-app User Guide (/help). Each section maps to a nav
// group and shows real screenshots of the running system alongside plain
// instructions for staff who have never used the software before.
export const HELP_SECTIONS = [
  {
    slug: 'getting-started',
    label: 'Getting Started',
    intro: 'How to log in and find your way around NovaMax ERP.',
    topics: [
      {
        heading: 'Logging in',
        image: 'login.png',
        body: [
          'Open the app in your browser and enter the email and password given to you by your admin.',
          'If you forget your password, ask an Admin to reset it from the Users page - there is no self-service reset yet.',
        ],
      },
      {
        heading: 'The Dashboard',
        image: 'dashboard.png',
        body: [
          'After logging in you land on the Dashboard, which shows quick totals (stock value, open invoices, low-stock alerts, etc.) so you can see the state of the business at a glance.',
          'The left sidebar is organized into groups (Overview, Inventory, Sales, Purchases, Distribution, Field Force, HR & Payroll, Finance, Ledgers, Compliance, Administration). Click any item to open that module.',
        ],
      },
      {
        heading: 'Every module works the same way',
        body: [
          'Almost every page in the system (Products, Customers, Doctors, Distributors, etc.) is a table with a search box, an "Export CSV" button, and a green "+ Add New" button in the top right.',
          'Click "+ Add New" to open a form, fill it in, and Save. Click "Edit" on any row to change it, or "Delete" to remove it (only where deleting makes sense - e.g. you cannot delete an invoice, only cancel it).',
          'Some fields are dropdowns that search another module live (e.g. picking a Customer while creating a Sales Order) - just start typing to filter the list.',
        ],
      },
    ],
  },
  {
    slug: 'inventory',
    label: 'Inventory',
    intro: 'Manage products, batches/expiry, warehouses, and stock movements.',
    topics: [
      {
        heading: 'Products',
        image: 'products.png',
        body: [
          'A Product is a brand you sell (e.g. "Novamox 500mg"). Set its Trade Price (Selling Price) here - this is the base price everything else discounts from.',
          'Link a "usual" Manufacturer on the product, but remember: the manufacturer who actually produced a specific batch is recorded on the Batch itself, not here (see below) - useful when the same brand is toll-manufactured by different factories over time.',
        ],
      },
      {
        heading: 'Batches & Expiry',
        image: 'batches.png',
        body: [
          'Every unit of stock belongs to a Batch: a batch number, expiry date, quantity, and which Manufacturer actually produced that run.',
          'The system automatically sells the batch closest to expiry first (FEFO - First-Expire-First-Out) when you confirm a Sales Order without picking a specific batch.',
          'Batches nearing expiry show up here so you can push them for sale or write them off before they go to waste.',
        ],
      },
      {
        heading: 'Warehouses & Stock Movements',
        image: 'warehouses.png',
        body: [
          'Warehouses are your physical storage locations. Every batch belongs to exactly one warehouse.',
          'Stock Movements is a read-only audit trail of every stock change - sales, purchases, returns, and manual adjustments - so you can always answer "where did this stock go?".',
        ],
      },
    ],
  },
  {
    slug: 'sales',
    label: 'Sales',
    intro: 'Customers, Sales Orders, Invoices, and Returns.',
    topics: [
      {
        heading: 'Customers',
        image: 'customers.png',
        body: [
          'A Customer is anyone you sell to directly - usually a pharmacy. Set their standard "Discount off Trade Price" here (e.g. 15%) - this is applied automatically after any doctor discount (see the Doctor Commissions guide).',
        ],
      },
      {
        heading: 'Sales Orders',
        image: 'sales-orders.png',
        body: [
          'Create a Sales Order: pick the Customer, Warehouse, add line items, and optionally a Referring Doctor if a doctor prescribed/referred this sale.',
          'Click "Confirm & Deduct Stock" once the order is final - this is the point stock actually leaves inventory.',
          'Once confirmed, click "Generate Invoice" to create the customer invoice and (if a cash-commission doctor was linked) automatically credit their commission ledger.',
        ],
      },
      {
        heading: 'Invoices',
        image: 'invoices.png',
        body: [
          'Every invoice is exactly one of 3 statuses: Sale Based (nothing paid yet), Partially Paid, or Fully Paid. Record payments here and the status updates automatically.',
          'Invoices unpaid 30+ days automatically notify the Sales team so nothing slips through the cracks.',
          'Click an invoice to open a print-friendly view you can hand to the customer or save as a PDF.',
        ],
      },
      {
        heading: 'Returns',
        image: 'returns.png',
        body: [
          'When a pharmacy can\'t sell medicine and sends it back, record it here with a Reason (unsold/slow-moving, near-expiry, expired, damaged, etc.) and a Disposition.',
          '"Restock" puts the goods back into that exact batch because they are still sellable. "Write off" credits the customer (they don\'t owe for it) but does NOT put the stock back, because it is expired or damaged and can no longer be resold.',
        ],
      },
    ],
  },
  {
    slug: 'purchases',
    label: 'Purchases',
    intro: 'Suppliers, Manufacturers, and Purchase Orders.',
    topics: [
      {
        heading: 'Suppliers & Manufacturers',
        image: 'manufacturers.png',
        body: [
          'A Supplier is who you physically buy stock from. A Manufacturer is who actually produced it - since NovaMax outsources brands to multiple contract (toll) manufacturers, these are tracked separately and a brand can have batches from more than one manufacturer at the same time.',
        ],
      },
      {
        heading: 'Purchase Orders',
        image: 'purchase-orders.png',
        body: [
          'Raise a Purchase Order against a Supplier, optionally tagging the Manufacturer if you are buying directly from a toll manufacturer.',
          'When you "Receive" the order, a new Batch is created automatically with the batch number and expiry you enter, stamped with that manufacturer - stock is added to inventory immediately.',
        ],
      },
    ],
  },
  {
    slug: 'distribution',
    label: 'Distribution',
    intro: 'Territories/Areas, Distributors, and itemized Distributor Invoices.',
    topics: [
      {
        heading: 'Territories / Areas',
        image: 'territories.png',
        body: ['Territories group your sales activity by geography (e.g. "Karachi South"). Employees, Doctors, and Distributors can all be assigned to one.'],
      },
      {
        heading: 'Distributors & Distributor Invoices',
        image: 'distributors.png',
        body: [
          'Distributors are the businesses you supply in bulk (as opposed to direct pharmacy Customers). Record which territories/areas and products they carry.',
          'Distributor Invoices are itemized (product/batch/quantity/price) and print in the same layout as your real Hadi Health Care sample invoice, with the distributor\'s pharmacy name, license, and address.',
        ],
      },
    ],
  },
  {
    slug: 'doctor-commissions',
    label: 'Doctor Commissions & Pricing',
    intro: 'How doctor referral incentives and pharmacy discounts are calculated and paid.',
    topics: [
      {
        heading: 'Two ways to compensate a referring doctor',
        image: 'doctors.png',
        body: [
          'Go to Doctors (under Field Force) and add a doctor with an "Incentive Type":',
          '• Cash commission - the doctor gets a % of the sales value in cash. E.g. "20K PKR per 1 Lac sales" = 20% commission. Set Commission % to 20.',
          '• Product discount - instead of cash, the doctor\'s referred sales get an extra discount off Trade Price (commonly 20%, 25%, or 50%). Set Discount % accordingly.',
          'A doctor is only ever one type at a time - pick whichever matches the deal you agreed with them.',
        ],
      },
      {
        heading: 'The rate is not fixed everywhere - it can vary by area',
        body: [
          'The same doctor can negotiate a different rate in different areas - e.g. 20% commission in Karachi South but only 15% in Karachi North. The Commission %/Discount % on the doctor\'s main record is just the DEFAULT, used for any area that has no override.',
          'On the Doctors page, use "Area-Specific Rates" to add one row per territory with its own rate. Any territory left out simply uses the default.',
          'When you create a Sales Order, pick the Area/Territory the sale belongs to - that is what tells the system which rate to apply. Get this field right or the commission for an area-specific doctor will fall back to their default rate instead.',
          'Nothing here changes what the doctor\'s total commission looks like - it\'s still one doctor, one combined running balance on their ledger. The Doctor Commissions report shows a "By Area" column breaking down exactly how much came from each territory and at what rate.',
        ],
      },
      {
        heading: 'How the price is actually calculated',
        body: [
          'Trade Price (TP) is the product\'s Selling Price. The discount cascade is:',
          '1. If a Product-discount doctor referred the sale, their % comes off TP first.',
          '2. The pharmacy\'s own standard discount (set on the Customer, e.g. 15%) is then applied to what is LEFT - not added to the doctor\'s discount.',
          'Example: TP = 100, doctor discount 20% -> price becomes 80, then pharmacy discount 15% off that 80 -> final price 68 (NOT a flat 35% off, which would be 65).',
          'If no doctor is involved (or the doctor is a cash-commission type instead), the pharmacy discount is simply applied directly to TP.',
          'When building a Sales Order, enter the unit price for each line manually using this calculation, or check the Doctors and Customers pages for the exact percentages to apply.',
        ],
      },
      {
        heading: 'A doctor with multiple locations (e.g. hospital in the morning, clinic in the evening)',
        body: [
          'Some doctors refer business from more than one place in the same day - say, "Nawazsharif Medical Complex" in the morning and a private clinic in the evening.',
          'This is still ONE doctor record with ONE commission rate. When you create each Sales Order, fill in the "Referral Location" field with wherever that particular referral happened - the doctor field stays the same.',
          'Their commission is calculated on the combined total from every location, not per location - e.g. 1 Lac from the hospital + 1 Lac from the clinic = 2 Lac combined, and a 20% doctor earns 40K total, not two separate 20K entries.',
          'The Doctor Commissions report still shows you the split by location (a "By Location" column) so you know exactly how much came from where, without it affecting the doctor\'s single running commission balance.',
        ],
      },
      {
        heading: 'Getting paid: the Doctor Commission Ledger',
        image: 'ledgers-doctors.png',
        body: [
          'For cash-commission doctors, generating an invoice from a sales order that has a Referring Doctor automatically posts their commission as a debit ("we owe them") on the Doctor Commission Ledger under Ledgers.',
          'When you actually pay the doctor, go to their ledger and add a credit entry for the amount paid - the running balance shows exactly what is still owed.',
          'Product-discount doctors never get a ledger entry - their incentive was already given away as a lower price at the point of sale, so there is nothing left to pay them in cash.',
        ],
      },
      {
        heading: 'Doctor Commissions report - ranking and totals',
        image: 'report-doctor-commissions.png',
        body: [
          'Go to Reports > Doctor Commissions to see every doctor ranked #1 (best) to last by how much business they referred, along with their % share of total company sales, commission earned, commission paid, and balance still owed.',
          'Summary cards at the top show company-wide totals: what % of all NovaMax sales came through doctor referrals, and the total commission expense earned/paid/still owed across every doctor - everything you need for a monthly payout run.',
          'The Dashboard also shows a running "Doctor Commission Expense" total, the "% of Business From Doctors", and a card naming your current top referring doctor, so you don\'t have to open the report just to check the headline numbers.',
        ],
      },
    ],
  },
  {
    slug: 'field-force',
    label: 'Field Force (Medical Reps)',
    intro: 'Doctor & chemist visits, sales targets, expense claims, the facility directory, and visit schedules for your reps.',
    topics: [
      {
        heading: 'Doctor & Chemist Visits',
        image: 'field-visits.png',
        body: ['Reps log every visit here: who they saw, what samples they gave out, and notes for the next visit - a simple CRM diary independent of actual sales.'],
      },
      {
        heading: 'Sales Targets & Expense Claims',
        image: 'sales-targets.png',
        body: [
          'Set a monthly sales target per employee and track it against actual confirmed sales.',
          'Expense Claims let reps submit travel/field expenses with a receipt upload for approval.',
        ],
      },
      {
        heading: 'Facility Directory (Hospitals, Clinics & Pharmacies)',
        body: [
          'Under Distribution > Facility Directory, keep a list of every hospital, clinic, and pharmacy in each area/territory, with address, phone, contact person, and an optional Google Maps link (or latitude/longitude) so a rep can tap through for directions.',
          '"Search OpenStreetMap" at the top of the page looks up real hospitals/clinics/pharmacies near a city or area for free, with no API key or billing - type a city/area (e.g. "Gulberg, Lahore"), pick a radius, tick which types to include, and Search. Review the results, tick the ones you want, optionally assign them all to one Area/Territory, and click Import Selected. This data is community-maintained (OpenStreetMap), so coverage and phone numbers are not as complete as Google Maps - always double-check before relying on a number. If the search fails with a "busy" message, OpenStreetMap\'s free public server is temporarily overloaded/rate-limited - wait a minute (or try a smaller radius) and try again.',
          '"Import from CSV" below it is the bulk-load option for data you already have - export your own list (e.g. from Excel) as a CSV with columns name,type,territoryName,address,city,phone,contactPerson,latitude,longitude,googleMapsUrl,notes and upload it. Only "name" is required per row; a territory name that does not exist yet is created automatically, and rows sharing the same territory name are matched to the same territory instead of creating duplicates.',
          'NovaMax does not scrape Google Maps/Google My Business - Google\'s terms do not allow bulk-copying that data into a separate database (unlike OpenStreetMap, whose license explicitly permits it). If you need Google-quality data for a specific place, look it up yourself and add/edit the entry manually with its details.',
        ],
      },
      {
        heading: 'Visit Schedules (Weekly/Monthly Beat Plan)',
        body: [
          'Under Field Force > Visit Schedules, set up a recurring plan for each rep or distributor worker: who they visit (a Customer, Distributor, or a Facility Directory entry), how often (weekly on a chosen day, or monthly on a chosen day-of-month), and the purpose - Re-take Order, Collect Invoice/Payment, both, or a plain visit.',
          'A monthly schedule set to day 31 still fires in shorter months - it automatically falls back to the last real day of that month (e.g. the 28th/29th in February) instead of silently skipping it.',
          'The "This Week\'s Beat Plan" tab shows a 7-day board of exactly which visits are due each day, so a rep (or their manager) can see the whole week\'s route at a glance instead of checking each schedule one by one.',
        ],
      },
    ],
  },
  {
    slug: 'hr-payroll',
    label: 'HR & Payroll',
    intro: 'Employees, org chart, attendance, leave, and payroll.',
    topics: [
      {
        heading: 'Employees & Org Chart',
        image: 'employees.png',
        body: [
          'Every employee records who they report to, building the full company hierarchy from CEO down to office staff. See it visually on the Org Chart page.',
        ],
      },
      {
        heading: 'Attendance, Leaves & Payroll',
        image: 'payroll.png',
        body: [
          'Attendance and Leaves feed into Payroll - running payroll for a month automatically posts a salary-paid entry to each employee\'s ledger.',
        ],
      },
    ],
  },
  {
    slug: 'finance',
    label: 'Finance',
    intro: 'Chart of Accounts, Transactions, and Expenses.',
    topics: [
      {
        heading: 'Accounts & Transactions',
        image: 'accounts.png',
        body: ['A simple chart of accounts and the double-entry Transactions that hit them - use this for anything that does not belong to a subsidiary ledger.'],
      },
      {
        heading: 'Expenses',
        image: 'expenses.png',
        body: [
          'Every company expense falls into one of 4 categories: Salaries, Running Expense, Office Expense, or Promotional Material - useful for tracking marketing spend on doctors/samples separately from rent and utilities.',
        ],
      },
    ],
  },
  {
    slug: 'ledgers',
    label: 'Ledgers',
    intro: 'A running account statement for every party you owe or are owed by.',
    topics: [
      {
        heading: 'One ledger per party type',
        image: 'ledgers-customers.png',
        body: [
          'Customer Ledger - how much each pharmacy/customer owes you (invoices raised minus payments/returns received).',
          'Distributor Ledger - the same, for distributors.',
          'Manufacturer Ledger - how much you owe each manufacturer (bills received minus payments made).',
          'Doctor Commission Ledger - how much you owe each cash-commission doctor.',
          'Employee Ledger - net advances/loans given to staff.',
          'Every ledger works the same: pick the party, see the full statement with a running balance, and add a manual entry if something needs correcting.',
        ],
      },
    ],
  },
  {
    slug: 'reports',
    label: 'Reports',
    intro: 'Stock valuation, receivables/payables aging, sales, doctor commissions, and profit & loss.',
    topics: [
      {
        heading: 'Available reports',
        image: 'reports.png',
        body: [
          'Stock Valuation - current inventory value by product, batch, and manufacturer.',
          'Aged Receivables / Aged Payables - overdue invoices and manufacturer bills bucketed by how many days overdue.',
          'Sales by Territory - confirmed sales grouped by sales rep territory.',
          'Doctor Commissions - sales referred and commission owed per doctor.',
          'Profit & Loss - a simplified monthly P&L (revenue, cost of goods sold, expenses, net profit).',
          'Every report has an "Export CSV" button so you can pull the data into Excel.',
        ],
      },
    ],
  },
  {
    slug: 'compliance',
    label: 'Compliance',
    intro: 'Licenses and controlled documents.',
    topics: [
      {
        heading: 'Licenses & Documents',
        image: 'licenses.png',
        body: ['Track drug licenses and other regulatory documents, including expiry dates and a file upload for the actual scanned document.'],
      },
    ],
  },
  {
    slug: 'administration',
    label: 'Administration',
    intro: 'Users, roles, and the audit log.',
    topics: [
      {
        heading: 'Users & Roles',
        image: 'users.png',
        body: [
          'Admins can create logins and assign a role: admin, manager, pharmacist, sales, hr, accountant, or staff. Roles control which modules and actions are visible.',
        ],
      },
      {
        heading: 'Audit Log',
        image: 'audit-logs.png',
        body: ['Every create, edit, delete, and workflow action (confirm order, approve return, etc.) is logged here with who did it and when - visible to Admins only.'],
      },
      {
        heading: 'Notifications',
        image: 'notifications.png',
        body: ['The bell icon shows system alerts, such as invoices unpaid 30+ days, which are also emailed automatically to the Sales team.'],
      },
    ],
  },
];
