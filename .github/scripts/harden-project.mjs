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

let frontendPackage = JSON.parse(read('frontend/package.json'));
frontendPackage.dependencies = { ...frontendPackage.dependencies, 'react-router-dom': '^7.18.5' };
frontendPackage.devDependencies = { ...frontendPackage.devDependencies, '@vitejs/plugin-react': '^6.0.3', vite: '^8.3.5' };
write('frontend/package.json', JSON.stringify(frontendPackage, null, 2) + '\n');

let frontendMain = read('frontend/src/main.jsx');
frontendMain = replaceOnce(frontendMain, `const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true
};
`, '', 'eliminar flags de transición ya incorporados en React Router 7');
frontendMain = replaceOnce(frontendMain, '<BrowserRouter future={routerFutureFlags}>', '<BrowserRouter>', 'BrowserRouter compatible con React Router 7');
write('frontend/src/main.jsx', frontendMain);

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


let authController = read('backend/src/controllers/authController.js');
authController = replaceOnce(authController, "import { AppError, ValidationError } from '../middleware/errorHandler.js';", "import { AppError } from '../middleware/errorHandler.js';", 'import de errores de autenticación');
authController = replaceOnce(authController, "throw new ValidationError('El email ya está registrado', [\n        { field: 'email', message: 'Este email ya está en uso' }\n      ]);", "throw new AppError('El email ya está registrado', 409, 'EMAIL_ALREADY_EXISTS');", 'email duplicado HTTP 409');
write('backend/src/controllers/authController.js', authController);

let smoke = read('backend/test/smoke.test.js');
smoke = replaceOnce(smoke, "import app from '../src/server.js';", "import app from '../src/server.js';\nimport pool from '../src/config/database.js';", 'pool en smoke tests');
smoke = replaceOnce(smoke, "after(async () => {\n  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));\n});", "after(async () => {\n  if (server) {\n    server.closeAllConnections?.();\n    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));\n  }\n  await pool.end();\n});", 'cerrar servidor y pool en smoke tests');
smoke = replaceOnce(smoke, "assert.match(body.message, /API funcionando/);", "assert.match(body.message, /API y base de datos disponibles/);", 'mensaje health actualizado');
write('backend/test/smoke.test.js', smoke);

let frontendApi = read('frontend/src/services/api.js');
frontendApi = replaceOnce(frontendApi, "export const getErrorMessage = (error) => {\n  if (error.response?.data?.errors?.length) {\n    return error.response.data.errors.map((e) => e.message).join('. ');\n  }\n  return (\n    error.response?.data?.message ||\n    error.message ||\n    'Ocurrió un error inesperado'\n  );\n};", "export const getErrorMessage = (error) => {\n  if (error.response?.data?.errors?.length) {\n    return error.response.data.errors.map((e) => e.message).join('. ');\n  }\n  if (error.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder. Inténtalo nuevamente.';\n  if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {\n    if (typeof navigator !== 'undefined' && !navigator.onLine) return 'No hay conexión a internet. Revisa tus datos o Wi-Fi e inténtalo de nuevo.';\n    return 'No se pudo conectar con el servidor. La API puede estar apagada o aún no desplegada; inténtalo más tarde.';\n  }\n  return error.response?.data?.message || 'Ocurrió un error inesperado';\n};", 'mensajes de conexión en español');
write('frontend/src/services/api.js', frontendApi);

let main = read('frontend/src/main.jsx');
main = replaceOnce(main, 'position="top-right"', 'position="bottom-center"', 'notificaciones abajo');
main = replaceOnce(main, '                newestOnTop\n', '                newestOnTop={false}\n', 'orden de notificaciones');
write('frontend/src/main.jsx', main);

let styles = read('frontend/src/styles/main.css');
styles += [
  '',
  '/* Notificaciones móviles: separadas del encabezado y respetando la zona segura */',
  '.Toastify__toast-container--bottom-center {',
  '  bottom: calc(env(safe-area-inset-bottom, 0px) + 14px);',
  '  left: 50%;',
  '  transform: translateX(-50%);',
  '  width: min(420px, calc(100vw - 24px));',
  '  padding: 0;',
  '  z-index: 10000;',
  '}',
  '.Toastify__toast {',
  '  min-height: 52px;',
  '  margin-bottom: 8px;',
  '  border-radius: 14px;',
  '  box-shadow: 0 8px 28px rgba(17, 24, 39, 0.18);',
  '}',
  '@media (max-width: 720px) {',
  '  .Toastify__toast-container--bottom-center {',
  '    bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);',
  '    width: calc(100vw - 24px);',
  '    max-width: 420px;',
  '  }',
  '  .Toastify__toast {',
  '    font-size: 13px;',
  '    padding: 10px 12px;',
  '  }',
  '}',
  ''
].join('\n');
/* Rediseño del escaparate 3D */
styles += "\n/* Escaparate principal inspirado en una ficha técnica de producto 3D */\n.hero-stage { position: relative; isolation: isolate; }\n.hero {\n  color: #182331;\n  background: radial-gradient(circle at 79% 46%, rgba(139,198,255,.22), transparent 29%), linear-gradient(135deg,#fff 0%,#f7f9fc 56%,#eef3f8 100%);\n  border: 1px solid #e4eaf1;\n  box-shadow: 0 24px 64px rgba(20,39,61,.09);\n  min-height: 540px;\n}\n.hero::before {\n  width: 520px; height: 520px; right: 9%; top: 50%; transform: translateY(-50%);\n  border: 1px solid rgba(93,135,174,.17);\n  background: radial-gradient(circle,rgba(255,255,255,.12) 0 37%,transparent 37.3%), repeating-radial-gradient(circle,transparent 0 48px,rgba(85,130,170,.12) 49px 50px), radial-gradient(circle,rgba(109,166,214,.10),transparent 68%);\n  box-shadow: inset 0 0 70px rgba(107,154,194,.08); pointer-events: none;\n}\n.hero::after {\n  width: 38%; height: 1px; left: 56px; bottom: 28px; top: auto;\n  border-radius: 0; background: linear-gradient(90deg,#9cb2c7,transparent); opacity: .75;\n}\n.hero-content { max-width: 560px; z-index: 2; }\n.hero-badge {\n  color: #34536f; background: rgba(226,239,250,.8); border: 1px solid #c9ddec;\n  letter-spacing: .09em; text-transform: uppercase; font-size: 10px; border-radius: 5px;\n  -webkit-backdrop-filter: none; backdrop-filter: none;\n}\n.hero h1 { color: #172637; letter-spacing: -.045em; }\n.hero h1 span { color: #648eb2; }\n.hero p { color: #5a6878; opacity: 1; }\n.hero .btn-light { color: #fff; background: #243e56; box-shadow: 0 8px 20px rgba(36,62,86,.18); }\n.hero .btn-light:hover { color: #fff; background: #345b7d; }\n.hero .btn-glass { color: #2e4a64; background: rgba(255,255,255,.72); border: 1px solid #cbd8e4; -webkit-backdrop-filter: none; backdrop-filter: none; }\n.hero .btn-glass:hover { color: #172637; background: #fff; border-color: #8ba9c4; }\n.hero-visual {\n  perspective: 1100px; border: 1px solid rgba(167,190,211,.7);\n  background: linear-gradient(rgba(115,153,186,.055) 1px,transparent 1px), linear-gradient(90deg,rgba(115,153,186,.055) 1px,transparent 1px), radial-gradient(ellipse at 50% 45%,#fff 0%,#f2f6fa 68%,#e6edf4 100%);\n  background-size: 28px 28px,28px 28px,auto; box-shadow: 0 25px 60px rgba(43,69,94,.13);\n}\n.hero-visual::before {\n  content: \"\"; position: absolute; z-index: 0; width: 76%; aspect-ratio: 1; left: 12%; top: 11%;\n  border: 1px solid rgba(91,137,177,.3); border-radius: 50%;\n  box-shadow: 0 0 0 18px rgba(255,255,255,.28),0 0 0 19px rgba(91,137,177,.13),0 0 0 54px rgba(255,255,255,.16),0 0 0 55px rgba(91,137,177,.10);\n  pointer-events: none;\n}\n.hero-visual::after {\n  content: \"CHUCHICHARAS  /  PRODUCT VIEW\"; position: absolute; z-index: 3;\n  top: 16px; left: 17px; right: auto; bottom: auto; width: auto; height: auto;\n  padding: 7px 10px; color: #496783; background: rgba(255,255,255,.82);\n  border: 1px solid #d7e2ec; border-radius: 4px;\n  font: 700 9px/1.2 system-ui,sans-serif; letter-spacing: .13em; opacity: 1; pointer-events: none;\n}\n.hero-visual img {\n  position: relative; z-index: 1; width: min(84%,390px); max-width: 390px; max-height: 82%;\n  object-fit: contain; border-radius: 12px; box-shadow: 0 28px 46px rgba(37,57,78,.14);\n  filter: drop-shadow(0 18px 22px rgba(41,66,91,.15)); rotate: -3deg;\n  animation: chuchi-product-float 7s ease-in-out infinite;\n}\n@keyframes chuchi-product-float { 0%,100% { translate: 0 0; } 50% { translate: 0 -12px; } }\n@media (min-width: 1101px) {\n  .hero { grid-template-columns: minmax(0,47%) 1fr; min-height: 570px; }\n  .hero-visual { right: 38px; top: 38px; bottom: 38px; width: 43%; border-radius: 8px; overflow: hidden; }\n  .hero-visual img { width: 82%; height: 82%; }\n}\n@media (max-width: 1100px) {\n  .hero { grid-template-columns: minmax(0,1fr); gap: 24px; min-height: 0; }\n  .hero::before { width: min(90vw,440px); right: 50%; top: auto; bottom: 2%; transform: translateX(50%); }\n  .hero-visual { position: relative; width: 100%; min-height: 280px; padding: 26px; border-radius: 10px; overflow: hidden; }\n  .hero-visual img { width: min(78%,300px); max-height: 250px; }\n}\n@media (max-width: 720px) {\n  .hero { padding: 26px 20px 22px; margin-top: 14px; border-radius: 14px; gap: 20px; }\n  .hero::after { left: 20px; bottom: 12px; width: 42%; }\n  .hero-content { max-width: none; }\n  .hero-badge { font-size: 9px; padding: 6px 9px; margin-bottom: 13px; }\n  .hero h1 { font-size: clamp(27px,7vw,36px); line-height: 1.05; }\n  .hero p { font-size: 14px; line-height: 1.55; }\n  .hero-actions { gap: 9px; }\n  .hero-actions .btn { min-height: 42px; padding: 10px 13px; font-size: 13px; }\n  .hero-visual { min-height: 255px; padding: 22px 12px; border-radius: 9px; }\n  .hero-visual::after { top: 10px; left: 10px; font-size: 8px; }\n  .hero-visual img { width: min(76%,260px); max-height: 214px; }\n}\n@media (prefers-reduced-motion: reduce) { .hero-visual img { animation: none; } }\n";
write('frontend/src/styles/main.css', styles);

console.log('Hardening aplicado: CORS Android, health MySQL, auth middleware, validación, rate limit, API HTTPS obligatoria, tests de integración y eliminación de dependencias vulnerables no utilizadas (Multer, Nodemailer y uuid).');
