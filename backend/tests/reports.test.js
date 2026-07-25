const {
  app,
  request,
  registerUser,
  createWarehouse,
  createProduct,
  createBatch,
  createCustomer,
} = require('./helpers/factory');

describe('Reports', () => {
  test('stock valuation sums quantity x cost price', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token, { costPrice: 2, sellingPrice: 5 });
    await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 100, costPrice: 2 });

    const res = await request(app).get('/api/reports/stock-valuation').set('Authorization', `Bearer ${token}`);
    expect(res.body.data.totalValue).toBe(200);
  });

  test('aged receivables buckets an invoice by days overdue', async () => {
    const { token } = await registerUser();
    const customer = await createCustomer(token);
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 45);
    await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({ invoiceNumber: 'INV-1', customer: customer._id, amount: 100, dueDate: overdueDate.toISOString() });

    const res = await request(app).get('/api/reports/aged-receivables').set('Authorization', `Bearer ${token}`);
    expect(res.body.data.buckets['31-60']).toBe(100);
  });

  test('aged payables sums outstanding manufacturer ledger balances', async () => {
    const { token } = await registerUser();
    const mfg = await request(app)
      .post('/api/manufacturers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Getz Pharma' });
    await request(app)
      .post('/api/ledger-entries')
      .set('Authorization', `Bearer ${token}`)
      .send({ partyType: 'manufacturer', party: mfg.body.data._id, type: 'debit', amount: 500, description: 'Bill' });

    const res = await request(app).get('/api/reports/aged-payables').set('Authorization', `Bearer ${token}`);
    expect(res.body.data.totalPayable).toBe(500);
  });

  test('sales by territory groups confirmed orders via sales rep -> territory', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token);
    const customer = await createCustomer(token);
    const territory = await request(app)
      .post('/api/territories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Lahore' });
    const employee = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: 'MR-1', name: 'Rep', territory: territory.body.data._id });
    await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 100 });

    const order = await request(app)
      .post('/api/sales-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: 'SO-1',
        customer: customer._id,
        warehouse: warehouse._id,
        salesRep: employee.body.data._id,
        items: [{ product: product._id, quantity: 10, unitPrice: 5, taxRate: 0, total: 50 }],
        subTotal: 50,
        grandTotal: 50,
      });
    await request(app).post(`/api/sales-orders/${order.body.data._id}/confirm`).set('Authorization', `Bearer ${token}`);

    const res = await request(app).get('/api/reports/sales-by-territory').set('Authorization', `Bearer ${token}`);
    expect(res.body.data.rows).toEqual([{ territory: 'Lahore', totalSales: 50, orderCount: 1 }]);
  });

  test('profit & loss computes revenue, COGS, and net profit for the month', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token, { costPrice: 2, sellingPrice: 5 });
    const customer = await createCustomer(token);
    await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 100, costPrice: 2 });

    const order = await request(app)
      .post('/api/sales-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: 'SO-1',
        customer: customer._id,
        warehouse: warehouse._id,
        items: [{ product: product._id, quantity: 10, unitPrice: 5, taxRate: 0, total: 50 }],
        subTotal: 50,
        grandTotal: 50,
      });
    await request(app).post(`/api/sales-orders/${order.body.data._id}/confirm`).set('Authorization', `Bearer ${token}`);
    await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Rent', category: 'office_expense', amount: 20 });

    const res = await request(app).get('/api/reports/profit-loss').set('Authorization', `Bearer ${token}`);
    expect(res.body.data.revenue).toBe(50);
    expect(res.body.data.cogs).toBe(20); // 10 units * costPrice 2
    expect(res.body.data.grossProfit).toBe(30);
    expect(res.body.data.expenses).toBe(20);
    expect(res.body.data.netProfit).toBe(10);
  });
});
