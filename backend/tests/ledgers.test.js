const { app, request, registerUser } = require('./helpers/factory');

describe('Ledgers', () => {
  test('manufacturer ledger: debit (bill) increases balance, credit (payment) decreases it', async () => {
    const { token } = await registerUser();
    const mfg = await request(app)
      .post('/api/manufacturers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Getz Pharma' });

    await request(app)
      .post('/api/ledger-entries')
      .set('Authorization', `Bearer ${token}`)
      .send({ partyType: 'manufacturer', party: mfg.body.data._id, type: 'debit', amount: 1000, description: 'Bill #1' });
    await request(app)
      .post('/api/ledger-entries')
      .set('Authorization', `Bearer ${token}`)
      .send({ partyType: 'manufacturer', party: mfg.body.data._id, type: 'credit', amount: 400, description: 'Payment' });

    const statement = await request(app)
      .get(`/api/ledger-entries/statement?partyType=manufacturer&party=${mfg.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(statement.body.data.closingBalance).toBe(600);
  });

  test('creating a customer invoice auto-posts a debit; a manual payment posts a credit', async () => {
    const { token } = await registerUser();
    const customer = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'City Pharmacy' });
    const future = new Date();
    future.setDate(future.getDate() + 10);

    await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({ invoiceNumber: 'INV-1', customer: customer.body.data._id, amount: 250, dueDate: future.toISOString() });

    let statement = await request(app)
      .get(`/api/ledger-entries/statement?partyType=customer&party=${customer.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(statement.body.data.closingBalance).toBe(250);
    expect(statement.body.data.rows[0].source).toBe('invoice');

    await request(app)
      .post('/api/ledger-entries')
      .set('Authorization', `Bearer ${token}`)
      .send({ partyType: 'customer', party: customer.body.data._id, type: 'credit', amount: 100, description: 'Payment received' });

    statement = await request(app)
      .get(`/api/ledger-entries/statement?partyType=customer&party=${customer.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(statement.body.data.closingBalance).toBe(150);
  });

  test('creating a distributor invoice auto-posts a debit to the distributor ledger', async () => {
    const { token } = await registerUser();
    const territory = await request(app)
      .post('/api/territories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Lahore' });
    const distributor = await request(app)
      .post('/api/distributors')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Al-Falah', territory: territory.body.data._id });
    const future = new Date();
    future.setDate(future.getDate() + 10);

    await request(app)
      .post('/api/distributor-invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({ invoiceNumber: 'DINV-1', distributor: distributor.body.data._id, amount: 300, dueDate: future.toISOString() });

    const statement = await request(app)
      .get(`/api/ledger-entries/statement?partyType=distributor&party=${distributor.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(statement.body.data.closingBalance).toBe(300);
  });

  test('approved payroll auto-posts a credit to the employee ledger, once', async () => {
    const { token } = await registerUser();
    const employee = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: 'EMP-1', name: 'Field Rep' });

    await request(app)
      .post('/api/payroll')
      .set('Authorization', `Bearer ${token}`)
      .send({ employee: employee.body.data._id, month: 7, year: 2026, basicSalary: 1000, netPay: 1000, status: 'paid' });

    let statement = await request(app)
      .get(`/api/ledger-entries/statement?partyType=employee&party=${employee.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(statement.body.data.rows).toHaveLength(1);
    expect(statement.body.data.closingBalance).toBe(-1000);

    const payrollList = await request(app).get('/api/payroll').set('Authorization', `Bearer ${token}`);
    await request(app)
      .put(`/api/payroll/${payrollList.body.data[0]._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'paid' });

    statement = await request(app)
      .get(`/api/ledger-entries/statement?partyType=employee&party=${employee.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(statement.body.data.rows).toHaveLength(1); // re-saving as paid must not double-post
  });

  test('statement endpoint requires partyType and party', async () => {
    const { token } = await registerUser();
    const res = await request(app).get('/api/ledger-entries/statement').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
