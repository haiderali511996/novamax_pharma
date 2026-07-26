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

  test('doctor-commissions report ranks doctors best-to-worst by business generated and totals a company-wide summary', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token, { sellingPrice: 50 });
    const customer = await createCustomer(token);
    await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 1000 });

    const topDoctor = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dr. Top', incentiveType: 'cash_commission', commissionPercent: 10 });
    const lowDoctor = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dr. Low', incentiveType: 'cash_commission', commissionPercent: 10 });

    async function placeOrder(orderNumber, doctorId, quantity) {
      const order = await request(app)
        .post('/api/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber,
          customer: customer._id,
          warehouse: warehouse._id,
          referringDoctor: doctorId,
          items: [{ product: product._id, quantity, unitPrice: 50, taxRate: 0, total: quantity * 50 }],
          subTotal: quantity * 50,
          grandTotal: quantity * 50,
        });
      await request(app).post(`/api/sales-orders/${order.body.data._id}/confirm`).set('Authorization', `Bearer ${token}`);
      await request(app).post(`/api/sales-orders/${order.body.data._id}/generate-invoice`).set('Authorization', `Bearer ${token}`);
    }

    await placeOrder('SO-RANK-TOP', topDoctor.body.data._id, 100); // 5000
    await placeOrder('SO-RANK-LOW', lowDoctor.body.data._id, 10); // 500
    // A sale with no doctor at all - counts toward company sales but not doctor-referred sales.
    const directOrder = await request(app)
      .post('/api/sales-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: 'SO-RANK-DIRECT',
        customer: customer._id,
        warehouse: warehouse._id,
        items: [{ product: product._id, quantity: 90, unitPrice: 50, taxRate: 0, total: 4500 }],
        subTotal: 4500,
        grandTotal: 4500,
      });
    await request(app).post(`/api/sales-orders/${directOrder.body.data._id}/confirm`).set('Authorization', `Bearer ${token}`);

    const report = await request(app).get('/api/reports/doctor-commissions').set('Authorization', `Bearer ${token}`);
    const rows = report.body.data.rows;

    expect(rows[0].doctor).toBe('Dr. Top');
    expect(rows[0].rank).toBe(1);
    expect(rows[1].doctor).toBe('Dr. Low');
    expect(rows[1].rank).toBe(2);

    // Company sales = 5000 + 500 + 4500 = 10000. Doctor-referred = 5000 + 500 = 5500 -> 55%.
    const { summary } = report.body.data;
    expect(summary.totalCompanySales).toBe(10000);
    expect(summary.totalDoctorReferredSales).toBe(5500);
    expect(summary.doctorReferredSalesPercent).toBe(55);
    expect(summary.totalCommissionExpense).toBe(550); // 10% of 5500
    expect(summary.topDoctor.name).toBe('Dr. Top');
  });

  test('dashboard summary surfaces doctor commission expense and % of business from doctors', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token, { sellingPrice: 100 });
    const customer = await createCustomer(token);
    await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 100 });

    const doctor = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dr. Dashboard', incentiveType: 'cash_commission', commissionPercent: 20 });

    const order = await request(app)
      .post('/api/sales-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: 'SO-DASH-1',
        customer: customer._id,
        warehouse: warehouse._id,
        referringDoctor: doctor.body.data._id,
        items: [{ product: product._id, quantity: 10, unitPrice: 100, taxRate: 0, total: 1000 }],
        subTotal: 1000,
        grandTotal: 1000,
      });
    await request(app).post(`/api/sales-orders/${order.body.data._id}/confirm`).set('Authorization', `Bearer ${token}`);
    await request(app).post(`/api/sales-orders/${order.body.data._id}/generate-invoice`).set('Authorization', `Bearer ${token}`);

    const dashboard = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${token}`);
    expect(dashboard.body.data.doctorCommissionExpense).toBe(200);
    expect(dashboard.body.data.doctorReferredSalesPercent).toBe(100);
    expect(dashboard.body.data.topDoctor.name).toBe('Dr. Dashboard');
  });

  test('a doctor referring business from two different locations in one day rolls up under one commission total, broken down per location', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token, { sellingPrice: 100 });
    const customer = await createCustomer(token);
    await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 2000 });

    const doctor = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dr. Multi-Site', incentiveType: 'cash_commission', commissionPercent: 20 });

    async function placeOrder(orderNumber, referralLocation) {
      const order = await request(app)
        .post('/api/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber,
          customer: customer._id,
          warehouse: warehouse._id,
          referringDoctor: doctor.body.data._id,
          referralLocation,
          items: [{ product: product._id, quantity: 1000, unitPrice: 100, taxRate: 0, total: 100000 }],
          subTotal: 100000,
          grandTotal: 100000,
        });
      await request(app).post(`/api/sales-orders/${order.body.data._id}/confirm`).set('Authorization', `Bearer ${token}`);
      await request(app).post(`/api/sales-orders/${order.body.data._id}/generate-invoice`).set('Authorization', `Bearer ${token}`);
    }

    // Morning at the hospital: 1 Lac. Evening at the clinic: another 1 Lac.
    await placeOrder('SO-MULTISITE-1', 'Nawazsharif Medical Complex');
    await placeOrder('SO-MULTISITE-2', 'City Clinic (Evening)');

    const report = await request(app).get('/api/reports/doctor-commissions').set('Authorization', `Bearer ${token}`);
    const row = report.body.data.rows.find((r) => r.doctor === 'Dr. Multi-Site');

    // Same doctor, same 20% - the two locations combine into ONE total, not two separate doctors.
    expect(row.totalSales).toBe(200000);
    expect(row.commissionEarned).toBe(40000);
    expect(row.orderCount).toBe(2);

    // But the breakdown still shows exactly where each half came from.
    expect(row.byLocation).toHaveLength(2);
    const byLocation = Object.fromEntries(row.byLocation.map((l) => [l.location, l.totalSales]));
    expect(byLocation['Nawazsharif Medical Complex']).toBe(100000);
    expect(byLocation['City Clinic (Evening)']).toBe(100000);

    // The doctor's ledger also shows the combined 40,000 owed, not two separate 20,000 entries per doctor.
    const ledger = await request(app)
      .get(`/api/ledger-entries/statement?partyType=doctor&party=${doctor.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(ledger.body.data.closingBalance).toBe(40000);
  });

  test('a doctor commission rate can vary by area - not fixed company-wide', async () => {
    const { token } = await registerUser();
    const warehouse = await createWarehouse(token);
    const product = await createProduct(token, { sellingPrice: 100 });
    const customer = await createCustomer(token);
    await createBatch(token, { product: product._id, warehouse: warehouse._id, quantity: 5000 });

    const territoryA = await request(app)
      .post('/api/territories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Karachi South' });
    const territoryB = await request(app)
      .post('/api/territories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Karachi North' });
    const territoryC = await request(app)
      .post('/api/territories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Lahore Central' });

    // Default rate 10%, but this doctor negotiated 20% in Karachi South and
    // 15% in Karachi North. Lahore Central has no override - falls back to 10%.
    const doctor = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Dr. Area Variance',
        incentiveType: 'cash_commission',
        commissionPercent: 10,
        areaRates: [
          { territory: territoryA.body.data._id, commissionPercent: 20 },
          { territory: territoryB.body.data._id, commissionPercent: 15 },
        ],
      });

    async function placeOrder(orderNumber, territoryId, amount) {
      const order = await request(app)
        .post('/api/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber,
          customer: customer._id,
          warehouse: warehouse._id,
          referringDoctor: doctor.body.data._id,
          territory: territoryId,
          items: [{ product: product._id, quantity: amount / 100, unitPrice: 100, taxRate: 0, total: amount }],
          subTotal: amount,
          grandTotal: amount,
        });
      await request(app).post(`/api/sales-orders/${order.body.data._id}/confirm`).set('Authorization', `Bearer ${token}`);
      await request(app).post(`/api/sales-orders/${order.body.data._id}/generate-invoice`).set('Authorization', `Bearer ${token}`);
    }

    await placeOrder('SO-AREA-A', territoryA.body.data._id, 100000); // 20% -> 20,000
    await placeOrder('SO-AREA-B', territoryB.body.data._id, 100000); // 15% -> 15,000
    await placeOrder('SO-AREA-C', territoryC.body.data._id, 100000); // no override -> default 10% -> 10,000

    // Combined commission: 20,000 + 15,000 + 10,000 = 45,000 - each area at its own rate.
    const ledger = await request(app)
      .get(`/api/ledger-entries/statement?partyType=doctor&party=${doctor.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(ledger.body.data.closingBalance).toBe(45000);

    const report = await request(app).get('/api/reports/doctor-commissions').set('Authorization', `Bearer ${token}`);
    const row = report.body.data.rows.find((r) => r.doctor === 'Dr. Area Variance');
    expect(row.totalSales).toBe(300000);
    expect(row.commissionEarned).toBe(45000);

    const byArea = Object.fromEntries(row.byArea.map((a) => [a.territory, a]));
    expect(byArea['Karachi South'].commissionPercent).toBe(20);
    expect(byArea['Karachi South'].commissionEarned).toBe(20000);
    expect(byArea['Karachi North'].commissionPercent).toBe(15);
    expect(byArea['Karachi North'].commissionEarned).toBe(15000);
    expect(byArea['Lahore Central'].commissionPercent).toBe(10);
    expect(byArea['Lahore Central'].commissionEarned).toBe(10000);
  });

  test('pricing quote uses the area-specific discount for a product-discount doctor', async () => {
    const { token } = await registerUser();
    const product = await createProduct(token, { sellingPrice: 100 });

    const territoryA = await request(app)
      .post('/api/territories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Area A' });
    const territoryB = await request(app)
      .post('/api/territories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Area B' });

    const doctor = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Dr. Area Discount',
        incentiveType: 'product_discount',
        discountPercent: 20,
        areaRates: [{ territory: territoryA.body.data._id, discountPercent: 50 }],
      });

    const quoteAreaA = await request(app)
      .get(`/api/pricing/quote?product=${product._id}&doctor=${doctor.body.data._id}&territory=${territoryA.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(quoteAreaA.body.data.priceAfterDoctorDiscount).toBe(50); // 50% off TP in Area A

    const quoteAreaB = await request(app)
      .get(`/api/pricing/quote?product=${product._id}&doctor=${doctor.body.data._id}&territory=${territoryB.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(quoteAreaB.body.data.priceAfterDoctorDiscount).toBe(80); // falls back to default 20% off TP in Area B
  });
});
