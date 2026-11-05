import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/server.js';
import { isValidImageSource } from '../src/utils/imageSource.js';
import { getAllowedOrderTransitions } from '../src/controllers/orderController.js';

let server;
let baseUrl;

before(async () => {
  server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    instance.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('health endpoint responds with a healthy API status', async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.match(body.message, /API funcionando/);
});

test('API root exposes the versioned endpoints', async () => {
  const response = await fetch(`${baseUrl}/api/v1`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.endpoints.products, '/api/v1/products');
});

test('CORS accepts the configured local development origin', async () => {
  const response = await fetch(`${baseUrl}/api/v1/products`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'GET'
    }
  });
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
});

test('login route rejects malformed credentials before reaching the database', async () => {
  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'no-es-un-correo', password: '' })
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.ok(Array.isArray(body.errors) && body.errors.length > 0);
});

test('image source validation accepts safe local and HTTPS sources only', () => {
  assert.equal(isValidImageSource('/images/product-placeholder.svg'), true);
  assert.equal(isValidImageSource('https://cdn.example.com/product.jpg'), true);
  assert.equal(isValidImageSource('javascript:alert(1)'), false);
  assert.equal(isValidImageSource('//attacker.example/image.png'), false);
  assert.equal(isValidImageSource('https://user:password@example.com/image.png'), false);
  assert.equal(isValidImageSource(`data:image/png;base64,${'A'.repeat(64)}`), true);
  assert.equal(isValidImageSource(`data:image/png;base64,${'A'.repeat(4096)}`), true);
  assert.equal(isValidImageSource(`data:image/png;base64,${'A'.repeat(8 * 1024 * 1024)}`), false);
  assert.equal(isValidImageSource(''), false);
});


test('order cancellation does not imply a refund; only paid cancelled orders can be refunded', () => {
  assert.deepEqual(getAllowedOrderTransitions({ status: 'cancelled', payment_status: 'pending' }), []);
  assert.deepEqual(getAllowedOrderTransitions({ status: 'cancelled', payment_status: 'paid' }), ['refunded']);
  assert.deepEqual(getAllowedOrderTransitions({ status: 'delivered', payment_status: 'pending' }), []);
  assert.deepEqual(getAllowedOrderTransitions({ status: 'delivered', payment_status: 'paid' }), ['refunded']);
});


test('public review pagination rejects invalid values before querying MySQL', async () => {
  const response = await fetch(`${baseUrl}/api/v1/reviews/product/1?page=-1&limit=500`);
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.ok(Array.isArray(body.errors) && body.errors.length >= 1);
});
