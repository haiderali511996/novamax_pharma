const {
  app,
  request,
  registerUser,
  createWarehouse,
  createProduct,
  createBatch,
  createCustomer,
} = require('./helpers/factory');

describe('Sales & Purchase Orders', () => {
  test('sales order requires a warehouse', async () => {
    const { token } = await registerUser();
    const customer = await createCustomer(token);
    const product = await createProduct(token);
    const res = await request(app)
      .post('/api/sales-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: 'SO-NOWH',
        customer: customer._id,
        items: [{ product: product._id, quantity: 1, unitPrice: 3, taxRate: 0, total: 3 }],
        subTotal: 3,
        grandTotal: 3,
      });
    expect(res.status).toBe(400);
  });

  test('confirming a sales order deducts stock via FEFO across batches', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token);
    const customer = await createCustomer(token);

    const olderBatch = await createBatch(token, {
      product: product._id,
      warehouse: warehouse._id,
      quantity: 5,
      expiryDate: '2026-06-01',
    });
    const newerBatch = await createBatch(token, {
      product: product._id,
      warehouse: warehouse._id,
      quantity: 20,
      expiryDate: '2028-06-01',
    });

    const order = await request(app)
      .post('/api/sales-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: 'SO-1',
        customer: customer._id,
        warehouse: warehouse._id,
        items: [{ product: product._id, quantity: 10, unitPrice: 3, taxRate: 0, total: 30 }],
        subTotal: 30,
        grandTotal: 30,
      });

    const confirm = await request(app)
      .post(`/api/sales-orders/${order.body.data._id}/confirm`)
      .set('Authorization', `Bearer ${token}`);
    expect(confirm.status).toBe(200);
    expect(confirm.body.data.stockApplied).toBe(true);

    const batches = await request(app).get('/api/batches').set('Authorization', `Bearer ${token}`);
    const older = batches.body.data.find((b) => b._id === olderBatch._id);
    const newer = batches.body.data.find((b) => b._id === newerBatch._id);
    // FEFO: the older (earlier expiry) batch should be fully drained first (5 of 5),
    // then the remaining 5 units come out of the newer batch (20 -> 15).
    expect(older.quantity).toBe(0);
    expect(newer.quantity).toBe(15);
  });

  test('confirming twice is blocked and an over-quantity confirm does not mutate stock', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token);
    const customer = await createCustomer(token);
    await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 10 });

    const order = await request(app)
      .post('/api/sales-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: 'SO-2',
        customer: customer._id,
        warehouse: warehouse._id,
        items: [{ product: product._id, quantity: 5, unitPrice: 3, taxRate: 0, total: 15 }],
        subTotal: 15,
        grandTotal: 15,
      });

    await request(app).post(`/api/sales-orders/${order.body.data._id}/confirm`).set('Authorization', `Bearer ${token}`);
    const reconfirm = await request(app)
      .post(`/api/sales-orders/${order.body.data._id}/confirm`)
      .set('Authorization', `Bearer ${token}`);
    expect(reconfirm.status).toBe(400);

    const bigOrder = await request(app)
      .post('/api/sales-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: 'SO-3',
        customer: customer._id,
        warehouse: warehouse._id,
        items: [{ product: product._id, quantity: 9999, unitPrice: 3, taxRate: 0, total: 29997 }],
        subTotal: 29997,
        grandTotal: 29997,
      });
    const failedConfirm = await request(app)
      .post(`/api/sales-orders/${bigOrder.body.data._id}/confirm`)
      .set('Authorization', `Bearer ${token}`);
    expect(failedConfirm.status).toBe(400);

    const batches = await request(app).get('/api/batches').set('Authorization', `Bearer ${token}`);
    expect(batches.body.data[0].quantity).toBe(5); // unchanged since the first confirm took 5 of 10
  });

  test('generating an invoice from a sales order is blocked on a second attempt', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token);
    const customer = await createCustomer(token);
    await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 10 });

    const order = await request(app)
      .post('/api/sales-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: 'SO-4',
        customer: customer._id,
        warehouse: warehouse._id,
        items: [{ product: product._id, quantity: 2, unitPrice: 3, taxRate: 0, total: 6 }],
        subTotal: 6,
        grandTotal: 6,
      });

    const first = await request(app)
      .post(`/api/sales-orders/${order.body.data._id}/generate-invoice`)
      .set('Authorization', `Bearer ${token}`);
    expect(first.status).toBe(201);
    expect(first.body.data.amount).toBe(6);

    const second = await request(app)
      .post(`/api/sales-orders/${order.body.data._id}/generate-invoice`)
      .set('Authorization', `Bearer ${token}`);
    expect(second.status).toBe(400);
  });

  test('receiving a purchase order creates a batch and requires batch/expiry info', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token);
    const supplier = await request(app)
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'ABC Supplier' });

    const po = await request(app)
      .post('/api/purchase-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        poNumber: 'PO-1',
        supplier: supplier.body.data._id,
        warehouse: warehouse._id,
        items: [{ product: product._id, quantity: 100, unitCost: 1, total: 100 }],
        subTotal: 100,
        grandTotal: 100,
      });

    const missingInfo = await request(app)
      .post(`/api/purchase-orders/${po.body.data._id}/receive`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(missingInfo.status).toBe(400);

    const receive = await request(app)
      .post(`/api/purchase-orders/${po.body.data._id}/receive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ product: product._id, batchNumber: 'B001', expiryDate: '2027-01-01' }] });
    expect(receive.status).toBe(200);
    expect(receive.body.data.status).toBe('received');

    const batches = await request(app).get('/api/batches').set('Authorization', `Bearer ${token}`);
    expect(batches.body.data[0].quantity).toBe(100);

    const reReceive = await request(app)
      .post(`/api/purchase-orders/${po.body.data._id}/receive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ product: product._id, batchNumber: 'B001', expiryDate: '2027-01-01' }] });
    expect(reReceive.status).toBe(400);
  });
});
