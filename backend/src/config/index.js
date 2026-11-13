import dotenv from 'dotenv';

dotenv.config();

const csv = (value, fallback = []) => {
  if (!value) return fallback;
  return String(value).split(',').map((item) => item.trim().replace(/\/+$/, '')).filter(Boolean);
};

const jwtSecret = process.env.JWT_SECRET || 'chuchicharas_dev_only_access_secret';
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'chuchicharas_dev_only_refresh_secret';

if (process.env.NODE_ENV === 'production') {
  const unsafe = (value) => value.length < 32 || /change.?me|replace|reemplaz|placeholder|chuchicharas_dev_only|secret_key/i.test(value);
  if (unsafe(jwtSecret) || unsafe(jwtRefreshSecret) || jwtSecret === jwtRefreshSecret) {
    throw new Error('Configuración insegura: define JWT_SECRET y JWT_REFRESH_SECRET distintos, aleatorios y de al menos 32 caracteres.');
  }
  const databaseUser = String(process.env.DB_USER || '').trim();
  const databasePassword = String(process.env.DB_PASSWORD || '');
  if (!process.env.DB_HOST || !process.env.DB_NAME || !databaseUser || databaseUser.toLowerCase() === 'root' || databasePassword.length < 16) {
    throw new Error('Configuración insegura: producción requiere DB_HOST, DB_NAME y un usuario MySQL dedicado con contraseña de al menos 16 caracteres.');
  }
  const productionOrigins = csv(process.env.FRONTEND_URL);
  if (!productionOrigins.length || productionOrigins.some((origin) => {
    try {
      const parsed = new URL(origin);
      return parsed.protocol !== 'https:' || /localhost|127\.0\.0\.1/i.test(parsed.hostname) || parsed.origin !== origin.replace(/\/$/, '');
    } catch {
      return true;
    }
  })) {
    throw new Error('Configuración incompleta: define FRONTEND_URL con el origen HTTPS público de la tienda en producción.');
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'chuchicharas_db'
  },
  
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: jwtRefreshSecret,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  cors: {
    origin: csv(process.env.FRONTEND_URL, process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://localhost:5174']),
    credentials: true
  },
  
  admin: {
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
    firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
    lastName: process.env.ADMIN_LAST_NAME || 'Chuchicharas'
  },
  
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'Chuchicharas <noreply@chuchicharas.com>'
  },
  
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10)
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10)
  }
};

export default config;