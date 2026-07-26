const { app, request, registerUser, createWarehouse, createProduct, createBatch, createCustomer } = require('./helpers/factory');

describe('Returns', () => {
  test('approving a return restocks the batch and credits the customer ledger', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token);
    const customer = await createCustomer(token);
    const batch = await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 50 });

    const ret = await request(app)
      .post('/api/returns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        returnNumber: 'RET-1',
        partyType: 'customer',
        party: customer._id,
        items: [{ product: product._id, batch: batch._id, quantity: 5, unitPrice: 5, total: 25 }],
        totalAmount: 25,
        reason: 'Damaged packaging',
      });
    expect(ret.body.data.status).toBe('pending');

    const batchesBefore = await request(app).get('/api/batches').set('Authorization', `Bearer ${token}`);
    expect(batchesBefore.body.data[0].quantity).toBe(50);

    const approve = await request(app)
      .post(`/api/returns/${ret.body.data._id}/approve`)
      .set('Authorization', `Bearer ${token}`);
    expect(approve.status).toBe(200);
    expect(approve.body.data.stockApplied).toBe(true);

    const batchesAfter = await request(app).get('/api/batches').set('Authorization', `Bearer ${token}`);
    expect(batchesAfter.body.data[0].quantity).toBe(55);

    const ledger = await request(app)
      .get(`/api/ledger-entries/statement?partyType=customer&party=${customer._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(ledger.body.data.closingBalance).toBe(-25);

    const reapprove = await request(app)
      .post(`/api/returns/${ret.body.data._id}/approve`)
      .set('Authorization', `Bearer ${token}`);
    expect(reapprove.status).toBe(400);
  });

  test('a return with disposition "restock" (the default) puts stock back, as before', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token);
    const customer = await createCustomer(token);
    const batch = await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 50 });

    const ret = await request(app)
      .post('/api/returns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        returnNumber: 'RET-RESTOCK',
        partyType: 'customer',
        party: customer._id,
        items: [{ product: product._id, batch: batch._id, quantity: 5, unitPrice: 5, total: 25 }],
        totalAmount: 25,
      });
    expect(ret.body.data.disposition).toBe('restock');

    await request(app).post(`/api/returns/${ret.body.data._id}/approve`).set('Authorization', `Bearer ${token}`);

    const batches = await request(app).get('/api/batches').set('Authorization', `Bearer ${token}`);
    expect(batches.body.data[0].quantity).toBe(55);
  });

  test('a return with disposition "writeoff" credits the ledger but does NOT put stock back', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token);
    const customer = await createCustomer(token);
    const batch = await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 50 });

    const ret = await request(app)
      .post('/api/returns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        returnNumber: 'RET-WRITEOFF',
        partyType: 'customer',
        party: customer._id,
        items: [{ product: product._id, batch: batch._id, quantity: 5, unitPrice: 5, total: 25 }],
        totalAmount: 25,
        reasonCategory: 'expired',
        disposition: 'writeoff',
      });
    expect(ret.body.data.disposition).toBe('writeoff');

    const approve = await request(app)
      .post(`/api/returns/${ret.body.data._id}/approve`)
      .set('Authorization', `Bearer ${token}`);
    expect(approve.status).toBe(200);
    expect(approve.body.data.stockApplied).toBe(true);

    // Stock must NOT be restocked - it's expired/damaged, not sellable.
    const batches = await request(app).get('/api/batches').set('Authorization', `Bearer ${token}`);
    expect(batches.body.data[0].quantity).toBe(50);

    // The party is still credited - they don't owe for goods they returned.
    const ledger = await request(app)
      .get(`/api/ledger-entries/statement?partyType=customer&party=${customer._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(ledger.body.data.closingBalance).toBe(-25);
  });

  test('rejecting a return leaves stock and the ledger untouched', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token);
    const customer = await createCustomer(token);
    const batch = await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 50 });

    const ret = await request(app)
      .post('/api/returns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        returnNumber: 'RET-2',
        partyType: 'customer',
        party: customer._id,
        items: [{ product: product._id, batch: batch._id, quantity: 5, unitPrice: 5, total: 25 }],
        totalAmount: 25,
      });

    const reject = await request(app)
      .post(`/api/returns/${ret.body.data._id}/reject`)
      .set('Authorization', `Bearer ${token}`);
    expect(reject.status).toBe(200);
    expect(reject.body.data.status).toBe('rejected');

    const batches = await request(app).get('/api/batches').set('Authorization', `Bearer ${token}`);
    expect(batches.body.data[0].quantity).toBe(50);
  });
});
