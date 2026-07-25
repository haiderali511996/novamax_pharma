const { app, request, registerUser, createWarehouse, createProduct, createBatch } = require('./helpers/factory');

describe('Inventory', () => {
  test('creates a product, warehouse, and batch', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token);
    const batch = await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 50 });

    expect(batch.quantity).toBe(50);
    expect(batch.product).toBe(product._id);
  });

  test('expiry-alerts endpoint returns batches expiring within the window', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token);

    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 10);
    await createBatch(token, { product: product._id, warehouse: warehouse._id, expiryDate: soonDate.toISOString() });

    const farDate = new Date();
    farDate.setFullYear(farDate.getFullYear() + 5);
    await createBatch(token, { product: product._id, warehouse: warehouse._id, expiryDate: farDate.toISOString() });

    const res = await request(app)
      .get('/api/batches/expiry-alerts?days=30')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  test('manufacturer link on product is populated on read', async () => {
    const { token } = await registerUser();
    const mfg = await request(app)
      .post('/api/manufacturers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Getz Pharma' });

    const product = await createProduct(token, { manufacturer: mfg.body.data._id });
    const res = await request(app).get(`/api/products/${product._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.body.data.manufacturer.name).toBe('Getz Pharma');
  });

  test('rejects an invalid ObjectId for manufacturer', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad Product', sku: 'BADX', costPrice: 1, sellingPrice: 2, manufacturer: 'not-an-id' });
    expect(res.status).toBe(400);
  });
});
