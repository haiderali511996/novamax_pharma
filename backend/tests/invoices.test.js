const { app, request, registerUser, createCustomer } = require('./helpers/factory');

describe('Invoice 3-status model', () => {
  test('defaults to sale_based and computes isOverdue from due date', async () => {
    const { token } = await registerUser();
    const customer = await createCustomer(token);
    const future = new Date();
    future.setDate(future.getDate() + 10);

    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({ invoiceNumber: 'INV-A', customer: customer._id, amount: 100, dueDate: future.toISOString() });

    expect(res.body.data.status).toBe('sale_based');
    expect(res.body.data.isOverdue).toBe(false);
  });

  test('a past-due sale_based invoice is overdue; fully_paid and cancelled ones never are', async () => {
    const { token } = await registerUser();
    const customer = await createCustomer(token);
    const past = new Date();
    past.setDate(past.getDate() - 45);

    const overdue = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({ invoiceNumber: 'INV-B', customer: customer._id, amount: 200, dueDate: past.toISOString() });
    expect(overdue.body.data.isOverdue).toBe(true);

    const paid = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        invoiceNumber: 'INV-C',
        customer: customer._id,
        amount: 300,
        amountPaid: 300,
        status: 'fully_paid',
        dueDate: past.toISOString(),
      });
    expect(paid.body.data.isOverdue).toBe(false);

    const cancelled = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({ invoiceNumber: 'INV-D', customer: customer._id, amount: 50, isCancelled: true, dueDate: past.toISOString() });
    expect(cancelled.body.data.isOverdue).toBe(false);
  });

  test('rejects the old 5-value status enum', async () => {
    const { token } = await registerUser();
    const customer = await createCustomer(token);
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({ invoiceNumber: 'INV-E', customer: customer._id, amount: 10, status: 'unpaid', dueDate: new Date().toISOString() });
    expect(res.status).toBe(400);
  });
});
