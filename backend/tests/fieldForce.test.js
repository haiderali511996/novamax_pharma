const {
  app,
  request,
  registerUser,
  createWarehouse,
  createProduct,
  createBatch,
  createCustomer,
} = require('./helpers/factory');

describe('Field-force CRM', () => {
  test('sales target progress reflects confirmed orders attributed to the rep', async () => {
    const { token } = await registerUser();
    const employee = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: 'MR-1', name: 'Field Rep' });
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token);
    const customer = await createCustomer(token);
    await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 100 });

    const now = new Date();
    const target = await request(app)
      .post('/api/sales-targets')
      .set('Authorization', `Bearer ${token}`)
      .send({ employee: employee.body.data._id, month: now.getMonth() + 1, year: now.getFullYear(), targetAmount: 1000 });

    let progress = await request(app)
      .get(`/api/sales-targets/${target.body.data._id}/progress`)
      .set('Authorization', `Bearer ${token}`);
    expect(progress.body.data.achieved).toBe(0);

    const order = await request(app)
      .post('/api/sales-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: 'SO-1',
        customer: customer._id,
        warehouse: warehouse._id,
        salesRep: employee.body.data._id,
        items: [{ product: product._id, quantity: 20, unitPrice: 5, taxRate: 0, total: 100 }],
        subTotal: 100,
        grandTotal: 100,
      });
    await request(app).post(`/api/sales-orders/${order.body.data._id}/confirm`).set('Authorization', `Bearer ${token}`);

    progress = await request(app)
      .get(`/api/sales-targets/${target.body.data._id}/progress`)
      .set('Authorization', `Bearer ${token}`);
    expect(progress.body.data.achieved).toBe(100);
    expect(progress.body.data.percentage).toBe(10);
  });

  test('duplicate sales target for same employee/month/year is rejected', async () => {
    const { token } = await registerUser();
    const employee = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: 'MR-2', name: 'Rep2' });

    await request(app)
      .post('/api/sales-targets')
      .set('Authorization', `Bearer ${token}`)
      .send({ employee: employee.body.data._id, month: 7, year: 2026, targetAmount: 1000 });
    const dup = await request(app)
      .post('/api/sales-targets')
      .set('Authorization', `Bearer ${token}`)
      .send({ employee: employee.body.data._id, month: 7, year: 2026, targetAmount: 2000 });
    expect(dup.status).toBe(400);
  });

  test('approving an expense claim reimburses the employee and posts a Running Expense', async () => {
    const { token } = await registerUser();
    const employee = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: 'MR-3', name: 'Rep3' });

    const claim = await request(app)
      .post('/api/expense-claims')
      .set('Authorization', `Bearer ${token}`)
      .send({ employee: employee.body.data._id, title: 'Fuel', category: 'fuel', amount: 40 });

    const approve = await request(app)
      .post(`/api/expense-claims/${claim.body.data._id}/approve`)
      .set('Authorization', `Bearer ${token}`);
    expect(approve.body.data.status).toBe('approved');

    const ledger = await request(app)
      .get(`/api/ledger-entries/statement?partyType=employee&party=${employee.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(ledger.body.data.closingBalance).toBe(-40);

    const expenses = await request(app)
      .get('/api/expenses?category=running_expense')
      .set('Authorization', `Bearer ${token}`);
    expect(expenses.body.data).toHaveLength(1);

    const reapprove = await request(app)
      .post(`/api/expense-claims/${claim.body.data._id}/approve`)
      .set('Authorization', `Bearer ${token}`);
    expect(reapprove.status).toBe(400);
  });
});
