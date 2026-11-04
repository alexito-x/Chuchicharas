import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('work/Chuchicharas');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(root, p), s);
function replaceOnce(source, from, to, label) {
  if (!source.includes(from)) throw new Error('No se encontró el bloque esperado: ' + label);
  return source.replace(from, to);
}

let server = read('backend/src/server.js');
server = replaceOnce(server, "import { testConnection } from './config/database.js';", "import { queryOne, testConnection } from './config/database.js';", 'import queryOne');
server = replaceOnce(server, "import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';", "import { AppError, errorHandler, notFoundHandler } from './middleware/errorHandler.js';", 'AppError');
server = replaceOnce(server, "const allowedOrigins = new Set([...configuredOrigins, ...developmentOrigins].filter(Boolean));", "const capacitorOrigins = ['https://localhost'];\nconst allowedOrigins = new Set([...configuredOrigins, ...developmentOrigins, ...capacitorOrigins].filter(Boolean));", 'CORS Android');
server = replaceOnce(server, "return callback(new Error(`Origen no permitido por CORS: ${origin}`));", "return callback(new AppError('Origen no permitido por CORS', 403, 'CORS_ORIGIN_DENIED'));", 'CORS 403');
server = replaceOnce(server, "app.get('/health', (req, res) => {\n  res.json({\n    success: true,\n    message: 'Chuchicharas API funcionando',\n    timestamp: new Date().toISOString(),\n    environment: config.nodeEnv\n  });\n});", "app.get('/health', async (req, res) => {\n  try {\n    await queryOne('SELECT 1 AS database_ready');\n    return res.status(200).json({ success: true, message: 'Chuchicharas API y base de datos disponibles', database: 'connected', timestamp: new Date().toISOString(), environment: config.nodeEnv });\n  } catch {\n    return res.status(503).json({ success: false, message: 'API disponible sin conexión a la base de datos', database: 'unavailable', timestamp: new Date().toISOString() });\n  }\n});", 'health MySQL');
server = replaceOnce(server, "  if (!dbConnected) {\n    console.error('⚠️  No se pudo conectar a la base de datos. Verifica que XAMPP/MySQL esté corriendo.');\n    console.error('   La API iniciará de todas formas, pero las consultas fallarán.');\n  }", "  if (!dbConnected) {\n    if (config.nodeEnv === 'production') throw new Error('No se inicia en producción: MySQL no está disponible.');\n    console.error('No se pudo conectar a MySQL; la API inicia solo en desarrollo.');\n  }", 'DB fail-fast');
server = replaceOnce(server, "  max: 50,\n  message: { success: false, message: 'Demasiados intentos, espera 15 minutos' }", "  max: 10,\n  standardHeaders: true,\n  legacyHeaders: false,\n  message: { success: false, message: 'Demasiados intentos, espera 15 minutos' }", 'rate limit auth');
write('backend/src/server.js', server);

const authMiddleware = String.raw`import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { queryOne } from '../config/database.js';

const readBearerToken = (req) => {
  const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
};

export const authenticateToken = async (req, res, next) => {
  const token = readBearerToken(req);
  if (!token) return res.status(401).json({ success: false, message: 'Token de acceso requerido' });
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
    if (!Number.isInteger(Number(decoded.userId))) throw new Error('Invalid token payload');
  } catch (error) {
    const expired = error.name === 'TokenExpiredError';
    return res.status(401).json({ success: false, message: expired ? 'Token expirado' : 'Token inválido', code: expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN' });
  }
  try {
    const user = await queryOne('SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = ? AND is_active = TRUE', [decoded.userId]);
    if (!user) return res.status(401).json({ success: false, message: 'Usuario no encontrado o inactivo' });
    req.user = user;
    return next();
  } catch (error) { return next(error); }
};

export const optionalAuth = async (req, res, next) => {
  const token = readBearerToken(req);
  if (!token) return next();
  let decoded;
  try { decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] }); }
  catch { return next(); }
  try {
    const user = await queryOne('SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = ? AND is_active = TRUE', [decoded.userId]);
    if (user) req.user = user;
    return next();
  } catch (error) { return next(error); }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Autenticación requerida' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'No tienes permisos para realizar esta acción' });
  return next();
};

export const generateTokens = (user) => {
  const accessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn, algorithm: 'HS256' });
  const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn, algorithm: 'HS256' });
  return { accessToken, refreshToken };
};
export const verifyRefreshToken = (token) => jwt.verify(token, config.jwt.refreshSecret, { algorithms: ['HS256'] });
`;
write('backend/src/middleware/auth.js', authMiddleware);

let validators = read('backend/src/validators/auth.js');
validators = validators.replaceAll("body('email')\n    .isEmail()", "body('email')\n    .isString()\n    .isEmail()");
validators = validators.replace("body('password')\n    .isLength({ min: 8 })", "body('password')\n    .isString()\n    .isLength({ min: 8, max: 72 })");
validators = validators.replace("body('password')\n    .notEmpty()", "body('password')\n    .isString()\n    .notEmpty()");
write('backend/src/validators/auth.js', validators);

let api = read('frontend/src/services/api.js');
api = replaceOnce(api, "const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';", "const configuredApiUrl = import.meta.env.VITE_API_URL;\nif (import.meta.env.PROD && (!configuredApiUrl || !/^https:\\/\\//i.test(configuredApiUrl))) {\n  throw new Error('VITE_API_URL debe configurarse con la URL HTTPS pública de la API antes de compilar producción.');\n}\nconst API_URL = configuredApiUrl || 'http://localhost:3001/api/v1';", 'API HTTPS requerida');
write('frontend/src/services/api.js', api);

const pkgPath = path.join(root, 'backend/package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
delete pkg.dependencies?.multer;
delete pkg.dependencies?.nodemailer;
delete pkg.dependencies?.uuid;
pkg.scripts = { ...pkg.scripts, test: 'node --test test/smoke.test.js', 'test:integration': 'node --test test/auth.integration.test.js' };
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
const lockPath = path.join(root, 'backend/package-lock.json');
const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
if (lock.packages?.['']?.dependencies) {
  delete lock.packages[''].dependencies.multer;
  delete lock.packages[''].dependencies.nodemailer;
  delete lock.packages[''].dependencies.uuid;
}
for (const name of ['multer', 'nodemailer', 'uuid']) {
  if (lock.packages?.['node_modules/' + name]) delete lock.packages['node_modules/' + name];
}
fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');

const integration = String.raw`import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import app from '../src/server.js';
import pool, { query } from '../src/config/database.js';
let server;
let baseUrl;
const email = 'ci-' + randomUUID() + '@chuchicharas.test';
const password = 'TestSeguro2026A';
before(async () => {
  await query('SELECT 1');
  server = await new Promise((resolve, reject) => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); instance.once('error', reject); });
  baseUrl = 'http://127.0.0.1:' + server.address().port;
});
after(async () => {
  await query('DELETE FROM users WHERE email = ?', [email]).catch(() => {});
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await pool.end();
});
const post = (route, body) => fetch(baseUrl + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
test('CORS permite Capacitor Android y rechaza origen externo', async () => {
  const ok = await fetch(baseUrl + '/api/v1/auth/login', { method: 'OPTIONS', headers: { Origin: 'https://localhost', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } });
  assert.equal(ok.headers.get('access-control-allow-origin'), 'https://localhost');
  const denied = await fetch(baseUrl + '/api/v1/auth/login', { method: 'OPTIONS', headers: { Origin: 'https://attacker.invalid', 'Access-Control-Request-Method': 'POST' } });
  assert.equal(denied.status, 403);
});
test('registro persiste usuario en MySQL y no expone hash', async () => {
  const response = await post('/api/v1/auth/register', { email, password, firstName: 'Prueba', lastName: 'Integracion' });
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.ok(body.data.accessToken && body.data.refreshToken);
  assert.equal(body.data.user.email, email);
  assert.equal(Object.hasOwn(body.data.user, 'password_hash'), false);
  const row = await query('SELECT password_hash FROM users WHERE email = ?', [email]);
  assert.ok(row[0].password_hash.startsWith('$2'));
});
test('registro duplicado responde 409', async () => {
  const response = await post('/api/v1/auth/register', { email, password, firstName: 'Prueba', lastName: 'Duplicada' });
  assert.equal(response.status, 409);
});
test('cuenta existente inicia sesión y accede al perfil protegido', async () => {
  const login = await post('/api/v1/auth/login', { email, password });
  const body = await login.json();
  assert.equal(login.status, 200);
  assert.equal(body.data.user.email, email);
  const profile = await fetch(baseUrl + '/api/v1/auth/profile', { headers: { Authorization: 'Bearer ' + body.data.accessToken } });
  assert.equal(profile.status, 200);
  assert.equal((await profile.json()).data.user.email, email);
});
test('contraseña incorrecta devuelve 401 genérico', async () => {
  const response = await post('/api/v1/auth/login', { email, password: 'Incorrecta2026A' });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).code, 'INVALID_CREDENTIALS');
});
test('cuenta desactivada no puede iniciar sesión', async () => {
  const inactiveEmail = 'inactive-' + randomUUID() + '@chuchicharas.test';
  const hash = await bcrypt.hash(password, 12);
  await query("INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) VALUES (?, ?, 'Inactivo', 'Test', 'user', FALSE)", [inactiveEmail, hash]);
  try { assert.equal((await post('/api/v1/auth/login', { email: inactiveEmail, password })).status, 403); }
  finally { await query('DELETE FROM users WHERE email = ?', [inactiveEmail]); }
});
test('token inválido se rechaza y Helmet añade cabeceras', async () => {
  const response = await fetch(baseUrl + '/api/v1/auth/profile', { headers: { Authorization: 'Bearer not-a-jwt' } });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});
test('health verifica conexión real con MySQL', async () => {
  const response = await fetch(baseUrl + '/health');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).database, 'connected');
});
`;
write('backend/test/auth.integration.test.js', integration);
console.log('Hardening aplicado: CORS Android, health MySQL, auth middleware, validación, rate limit, API HTTPS obligatoria, tests de integración y eliminación de dependencias vulnerables no utilizadas (Multer, Nodemailer y uuid).');
