const { app, request, registerUser } = require('./helpers/factory');

describe('Audit log', () => {
  test('create/update/delete on a generic CRUD resource are all audited', async () => {
    const { token } = await registerUser();
    const created = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'City Pharmacy' });
    const id = created.body.data._id;

    await request(app)
      .put(`/api/customers/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'City Pharmacy Updated' });
    await request(app).delete(`/api/customers/${id}`).set('Authorization', `Bearer ${token}`);

    const res = await request(app).get('/api/audit-logs?resource=Customer').set('Authorization', `Bearer ${token}`);
    expect(res.body.data.map((l) => l.action)).toEqual(['delete', 'update', 'create']);
    expect(res.body.data[1].before.name).toBe('City Pharmacy');
    expect(res.body.data[1].after.name).toBe('City Pharmacy Updated');
    expect(res.body.data[2].userEmail).toBeDefined();
  });

  test('workflow actions (e.g. sales order confirm) are audited with an actionLabel', async () => {
    const { token } = await registerUser();
    const warehouse = await request(app)
      .post('/api/warehouses')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'WH', code: 'WH1' });
    const customer = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cust' });
    const product = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Prod', sku: 'SKU1', costPrice: 1, sellingPrice: 3 });
    await request(app)
      .post('/api/batches')
      .set('Authorization', `Bearer ${token}`)
      .send({ product: product.body.data._id, warehouse: warehouse.body.data._id, batchNumber: 'B1', expiryDate: '2027-01-01', quantity: 10 });
    const order = await request(app)
      .post('/api/sales-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: 'SO-1',
        customer: customer.body.data._id,
        warehouse: warehouse.body.data._id,
        items: [{ product: product.body.data._id, quantity: 5, unitPrice: 3, taxRate: 0, total: 15 }],
        subTotal: 15,
        grandTotal: 15,
      });
    await request(app).post(`/api/sales-orders/${order.body.data._id}/confirm`).set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/audit-logs?resource=SalesOrder&action=action')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data.some((l) => l.actionLabel === 'confirm')).toBe(true);
  });

  test('non-admin users cannot view the audit log', async () => {
    const { token } = await registerUser({ role: 'sales' });
    const res = await request(app).get('/api/audit-logs').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
