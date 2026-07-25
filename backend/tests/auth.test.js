const { app, request } = require('./helpers/factory');

describe('Auth', () => {
  test('registers a user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin', email: 'admin@test.com', password: 'password123', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.email).toBe('admin@test.com');
  });

  test('rejects duplicate email registration', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin', email: 'dup@test.com', password: 'password123', role: 'admin' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin2', email: 'dup@test.com', password: 'password123', role: 'admin' });
    expect(res.status).toBe(400);
  });

  test('logs in with correct credentials and rejects wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Login User', email: 'login@test.com', password: 'password123', role: 'admin' });

    const good = await request(app).post('/api/auth/login').send({ email: 'login@test.com', password: 'password123' });
    expect(good.status).toBe(200);
    expect(good.body.data.token).toBeDefined();

    const bad = await request(app).post('/api/auth/login').send({ email: 'login@test.com', password: 'wrongpass' });
    expect(bad.status).toBe(401);
  });

  test('rejects unauthenticated access to protected routes', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me returns the current user', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Me User', email: 'me@test.com', password: 'password123', role: 'sales' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${reg.body.data.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('me@test.com');
    expect(res.body.data.role).toBe('sales');
  });
});
