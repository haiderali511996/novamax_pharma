const { app, request, registerUser, createCustomer } = require('./helpers/factory');

describe('Notifications', () => {
  test('scan creates one notification per overdue invoice and never duplicates on re-scan', async () => {
    const { token } = await registerUser();
    const customer = await createCustomer(token);
    const past = new Date();
    past.setDate(past.getDate() - 45);

    await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({ invoiceNumber: 'INV-1', customer: customer._id, amount: 100, dueDate: past.toISOString() });

    const firstScan = await request(app).post('/api/notifications/scan-overdue').set('Authorization', `Bearer ${token}`);
    expect(firstScan.body.data.created).toBe(1);

    const secondScan = await request(app).post('/api/notifications/scan-overdue').set('Authorization', `Bearer ${token}`);
    expect(secondScan.body.data.created).toBe(0);
  });

  test('sales-role users see notifications; other roles only see their own targetRole', async () => {
    const { token: adminToken } = await registerUser({ role: 'admin' });
    const customer = await createCustomer(adminToken);
    const past = new Date();
    past.setDate(past.getDate() - 45);
    await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ invoiceNumber: 'INV-2', customer: customer._id, amount: 100, dueDate: past.toISOString() });
    await request(app).post('/api/notifications/scan-overdue').set('Authorization', `Bearer ${adminToken}`);

    const { token: salesToken } = await registerUser({ role: 'sales' });
    const salesView = await request(app).get('/api/notifications').set('Authorization', `Bearer ${salesToken}`);
    expect(salesView.body.count).toBe(1);

    const { token: hrToken } = await registerUser({ role: 'hr' });
    const hrView = await request(app).get('/api/notifications').set('Authorization', `Bearer ${hrToken}`);
    expect(hrView.body.count).toBe(0);
  });

  test('marking a notification as read updates its state', async () => {
    const { token } = await registerUser();
    const customer = await createCustomer(token);
    const past = new Date();
    past.setDate(past.getDate() - 45);
    await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({ invoiceNumber: 'INV-3', customer: customer._id, amount: 100, dueDate: past.toISOString() });
    await request(app).post('/api/notifications/scan-overdue').set('Authorization', `Bearer ${token}`);

    const list = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
    const notifId = list.body.data[0]._id;

    const markRead = await request(app).put(`/api/notifications/${notifId}/read`).set('Authorization', `Bearer ${token}`);
    expect(markRead.body.data.isRead).toBe(true);
  });
});
