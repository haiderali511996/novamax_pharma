const { app, request, registerUser, createWarehouse, createProduct, createBatch, createCustomer } = require('./helpers/factory');

describe('Doctor commission and cascading discount pricing', () => {
  test('a cash-commission doctor gets credited on their ledger when their referred order is invoiced', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token, { sellingPrice: 100 });
    const customer = await createCustomer(token);
    await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 100 });

    const doctor = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dr. Ahmed', incentiveType: 'cash_commission', commissionPercent: 20 });

    const order = await request(app)
      .post('/api/sales-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: 'SO-DOC-1',
        customer: customer._id,
        warehouse: warehouse._id,
        referringDoctor: doctor.body.data._id,
        items: [{ product: product._id, quantity: 1000, unitPrice: 100, taxRate: 0, total: 100000 }],
        subTotal: 100000,
        grandTotal: 100000,
      });

    await request(app).post(`/api/sales-orders/${order.body.data._id}/confirm`).set('Authorization', `Bearer ${token}`);
    await request(app).post(`/api/sales-orders/${order.body.data._id}/generate-invoice`).set('Authorization', `Bearer ${token}`);

    // 20% of 1 Lac (100,000) = 20,000 owed to the doctor.
    const ledger = await request(app)
      .get(`/api/ledger-entries/statement?partyType=doctor&party=${doctor.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(ledger.body.data.closingBalance).toBe(20000);
  });

  test('paying a doctor their commission credits the ledger and reduces the balance owed', async () => {
    const { token } = await registerUser();
    const doctor = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dr. Fatima', incentiveType: 'cash_commission', commissionPercent: 20 });

    await request(app)
      .post('/api/ledger-entries')
      .set('Authorization', `Bearer ${token}`)
      .send({ partyType: 'doctor', party: doctor.body.data._id, type: 'debit', amount: 20000, description: 'Commission owed' });

    await request(app)
      .post('/api/ledger-entries')
      .set('Authorization', `Bearer ${token}`)
      .send({ partyType: 'doctor', party: doctor.body.data._id, type: 'credit', amount: 15000, description: 'Partial commission payment' });

    const ledger = await request(app)
      .get(`/api/ledger-entries/statement?partyType=doctor&party=${doctor.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(ledger.body.data.closingBalance).toBe(5000);
  });

  test('a product-discount doctor does NOT get a ledger entry - the incentive is only in the price', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token, { sellingPrice: 100 });
    const customer = await createCustomer(token);
    await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 100 });

    const doctor = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dr. Bilal', incentiveType: 'product_discount', discountPercent: 20 });

    const order = await request(app)
      .post('/api/sales-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: 'SO-DOC-2',
        customer: customer._id,
        warehouse: warehouse._id,
        referringDoctor: doctor.body.data._id,
        items: [{ product: product._id, quantity: 10, unitPrice: 80, taxRate: 0, total: 800 }],
        subTotal: 800,
        grandTotal: 800,
      });

    await request(app).post(`/api/sales-orders/${order.body.data._id}/confirm`).set('Authorization', `Bearer ${token}`);
    await request(app).post(`/api/sales-orders/${order.body.data._id}/generate-invoice`).set('Authorization', `Bearer ${token}`);

    const ledger = await request(app)
      .get(`/api/ledger-entries/statement?partyType=doctor&party=${doctor.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(ledger.body.data.closingBalance).toBe(0);
    expect(ledger.body.data.rows.length).toBe(0);
  });

  test('pricing quote cascades doctor discount then pharmacy discount off TP (not summed)', async () => {
    const { token } = await registerUser();
    const product = await createProduct(token, { sellingPrice: 100 });
    const customer = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'City Pharmacy', type: 'pharmacy', pharmacyDiscountPercent: 15 });
    const doctor = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dr. Sana', incentiveType: 'product_discount', discountPercent: 20 });

    const quote = await request(app)
      .get(`/api/pricing/quote?product=${product._id}&doctor=${doctor.body.data._id}&customer=${customer.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    // TP=100 -> 20% doctor discount -> 80 -> 15% pharmacy discount -> 68
    // (NOT a flat 35% off, which would be 65)
    expect(quote.body.data.priceAfterDoctorDiscount).toBe(80);
    expect(quote.body.data.finalPrice).toBe(68);
  });

  test('pricing quote with no doctor applies the pharmacy discount directly off TP', async () => {
    const { token } = await registerUser();
    const product = await createProduct(token, { sellingPrice: 100 });
    const customer = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Corner Pharmacy', type: 'pharmacy', pharmacyDiscountPercent: 15 });

    const quote = await request(app)
      .get(`/api/pricing/quote?product=${product._id}&customer=${customer.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(quote.body.data.doctorDiscountPercent).toBe(0);
    expect(quote.body.data.finalPrice).toBe(85);
  });

  test('doctor-commissions report shows total sales, commission earned, and balance owed', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token, { sellingPrice: 50 });
    const customer = await createCustomer(token);
    await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 100 });

    const doctor = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dr. Report', incentiveType: 'cash_commission', commissionPercent: 10 });

    const order = await request(app)
      .post('/api/sales-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: 'SO-DOC-3',
        customer: customer._id,
        warehouse: warehouse._id,
        referringDoctor: doctor.body.data._id,
        items: [{ product: product._id, quantity: 20, unitPrice: 50, taxRate: 0, total: 1000 }],
        subTotal: 1000,
        grandTotal: 1000,
      });
    await request(app).post(`/api/sales-orders/${order.body.data._id}/confirm`).set('Authorization', `Bearer ${token}`);
    await request(app).post(`/api/sales-orders/${order.body.data._id}/generate-invoice`).set('Authorization', `Bearer ${token}`);

    const report = await request(app).get('/api/reports/doctor-commissions').set('Authorization', `Bearer ${token}`);
    const row = report.body.data.rows.find((r) => r.doctorId === String(doctor.body.data._id));
    expect(row.totalSales).toBe(1000);
    expect(row.commissionEarned).toBe(100);
    expect(row.commissionPaid).toBe(0);
    expect(row.balanceOwed).toBe(100);
  });
});
