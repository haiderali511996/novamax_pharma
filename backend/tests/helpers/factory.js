const request = require('supertest');
const app = require('../../src/app');

let counter = 0;
function unique(prefix) {
  counter += 1;
  return `${prefix}${Date.now()}${counter}`;
}

async function registerUser(overrides = {}) {
  const email = overrides.email || `${unique('user')}@test.com`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: overrides.name || 'Test User', email, password: 'password123', role: overrides.role || 'admin' });
  return { token: res.body.data.token, id: res.body.data._id, email };
}

async function createWarehouse(token, overrides = {}) {
  const res = await request(app)
    .post('/api/warehouses')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: overrides.name || 'Main Warehouse', code: overrides.code || unique('WH') });
  return res.body.data;
}

async function createProduct(token, overrides = {}) {
  const res = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: overrides.name || 'Test Product',
      sku: overrides.sku || unique('SKU'),
      costPrice: overrides.costPrice ?? 1,
      sellingPrice: overrides.sellingPrice ?? 3,
      ...overrides,
    });
  return res.body.data;
}

async function createBatch(token, { product, warehouse, ...overrides }) {
  const res = await request(app)
    .post('/api/batches')
    .set('Authorization', `Bearer ${token}`)
    .send({
      product,
      warehouse,
      batchNumber: overrides.batchNumber || unique('BATCH'),
      expiryDate: overrides.expiryDate || '2027-01-01',
      quantity: overrides.quantity ?? 100,
      ...overrides,
    });
  return res.body.data;
}

async function createCustomer(token, overrides = {}) {
  const res = await request(app)
    .post('/api/customers')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: overrides.name || 'Test Customer', ...overrides });
  return res.body.data;
}

module.exports = { app, request, unique, registerUser, createWarehouse, createProduct, createBatch, createCustomer };
