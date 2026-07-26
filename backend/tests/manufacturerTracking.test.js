const { app, request, registerUser, createWarehouse, createProduct } = require('./helpers/factory');

describe('Multi-manufacturer batch tracking', () => {
  test('a batch created manually can record which manufacturer produced it', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token);
    const mfg = await request(app).post('/api/manufacturers').set('Authorization', `Bearer ${token}`).send({ name: 'Getz Pharma' });

    const batch = await request(app)
      .post('/api/batches')
      .set('Authorization', `Bearer ${token}`)
      .send({
        product: product._id,
        warehouse: warehouse._id,
        batchNumber: 'B001',
        expiryDate: '2027-01-01',
        quantity: 100,
        manufacturer: mfg.body.data._id,
      });
    expect(batch.body.data.manufacturer).toBe(mfg.body.data._id);

    const fetched = await request(app).get('/api/batches').set('Authorization', `Bearer ${token}`);
    expect(fetched.body.data[0].manufacturer.name).toBe('Getz Pharma');
  });

  test('receiving a PO with a manufacturer stamps it onto the created batch', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token);
    const supplier = await request(app).post('/api/suppliers').set('Authorization', `Bearer ${token}`).send({ name: 'ABC Supplier' });
    const mfgA = await request(app).post('/api/manufacturers').set('Authorization', `Bearer ${token}`).send({ name: 'Manufacturer A' });

    const po = await request(app)
      .post('/api/purchase-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        poNumber: 'PO-1',
        supplier: supplier.body.data._id,
        manufacturer: mfgA.body.data._id,
        warehouse: warehouse._id,
        items: [{ product: product._id, quantity: 50, unitCost: 1, total: 50 }],
        subTotal: 50,
        grandTotal: 50,
      });

    await request(app)
      .post(`/api/purchase-orders/${po.body.data._id}/receive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ product: product._id, batchNumber: 'BATCH-A', expiryDate: '2027-06-01' }] });

    const batches = await request(app).get('/api/batches').set('Authorization', `Bearer ${token}`);
    expect(batches.body.data[0].manufacturer.name).toBe('Manufacturer A');
  });

  test('the same brand can have batches from two different manufacturers at once', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token, { name: 'Shared Brand', sku: 'BRAND1' });
    const mfgA = await request(app).post('/api/manufacturers').set('Authorization', `Bearer ${token}`).send({ name: 'Manufacturer A' });
    const mfgB = await request(app).post('/api/manufacturers').set('Authorization', `Bearer ${token}`).send({ name: 'Manufacturer B' });

    await request(app)
      .post('/api/batches')
      .set('Authorization', `Bearer ${token}`)
      .send({ product: product._id, warehouse: warehouse._id, batchNumber: 'BATCH-A', expiryDate: '2027-01-01', quantity: 50, manufacturer: mfgA.body.data._id });
    await request(app)
      .post('/api/batches')
      .set('Authorization', `Bearer ${token}`)
      .send({ product: product._id, warehouse: warehouse._id, batchNumber: 'BATCH-B', expiryDate: '2027-06-01', quantity: 30, manufacturer: mfgB.body.data._id });

    const batches = await request(app).get('/api/batches').set('Authorization', `Bearer ${token}`);
    const manufacturers = batches.body.data.map((b) => b.manufacturer.name).sort();
    expect(manufacturers).toEqual(['Manufacturer A', 'Manufacturer B']);
  });

  test('stock valuation report includes manufacturer per batch', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token, { costPrice: 2 });
    const mfg = await request(app).post('/api/manufacturers').set('Authorization', `Bearer ${token}`).send({ name: 'Getz Pharma' });
    await request(app)
      .post('/api/batches')
      .set('Authorization', `Bearer ${token}`)
      .send({ product: product._id, warehouse: warehouse._id, batchNumber: 'B1', expiryDate: '2027-01-01', quantity: 10, costPrice: 2, manufacturer: mfg.body.data._id });

    const res = await request(app).get('/api/reports/stock-valuation').set('Authorization', `Bearer ${token}`);
    expect(res.body.data.rows[0].manufacturer).toBe('Getz Pharma');
  });
});
