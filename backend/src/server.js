import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from './config/index.js';
import { testConnection } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { sanitizeInput } from './middleware/validation.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import userRoutes from './routes/userRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
const configuredOrigins = Array.isArray(config.cors.origin)
  ? config.cors.origin
  : [config.cors.origin];
const developmentOrigins = config.nodeEnv === 'development'
  ? [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174'
    ]
  : [];
const allowedOrigins = new Set([...configuredOrigins, ...developmentOrigins].filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    // Requests without Origin (curl, health checks, server-to-server) are allowed.
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(sanitizeInput);

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intenta nuevamente más tarde'
  }
});

app.use(`${config.apiPrefix}/auth`, rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Demasiados intentos, espera 15 minutos' }
}));

app.use(config.apiPrefix, limiter);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Chuchicharas API funcionando',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

app.get(config.apiPrefix, (req, res) => {
  res.json({
    success: true,
    message: 'Chuchicharas E-commerce API',
    version: '1.0.0',
    endpoints: {
      auth: `${config.apiPrefix}/auth`,
      products: `${config.apiPrefix}/products`,
      categories: `${config.apiPrefix}/categories`,
      cart: `${config.apiPrefix}/cart`,
      orders: `${config.apiPrefix}/orders`,
      reviews: `${config.apiPrefix}/reviews`,
      favorites: `${config.apiPrefix}/favorites`,
      admin: `${config.apiPrefix}/admin`
    }
  });
});

app.use(`${config.apiPrefix}/auth`, authRoutes);
app.use(`${config.apiPrefix}/products`, productRoutes);
app.use(`${config.apiPrefix}/categories`, categoryRoutes);
app.use(`${config.apiPrefix}/cart`, cartRoutes);
app.use(`${config.apiPrefix}/orders`, orderRoutes);
app.use(`${config.apiPrefix}/reviews`, reviewRoutes);
app.use(`${config.apiPrefix}/favorites`, favoriteRoutes);
app.use(`${config.apiPrefix}/admin/users`, userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export const startServer = async () => {
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('⚠️  No se pudo conectar a la base de datos. Verifica que XAMPP/MySQL esté corriendo.');
    console.error('   La API iniciará de todas formas, pero las consultas fallarán.');
  }
  
  const server = app.listen(config.port, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     🛒 CHUCHICHARAS E-COMMERCE API 🛒      ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log(`  🚀 Servidor:     http://localhost:${config.port}`);
    console.log(`  📡 API:          http://localhost:${config.port}${config.apiPrefix}`);
    console.log(`  💚 Health:       http://localhost:${config.port}/health`);
    console.log(`  🌍 Entorno:      ${config.nodeEnv}`);
    console.log('════════════════════════════════════════════');
    console.log('');
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`El puerto ${config.port} ya está en uso. Cambia PORT en backend/.env o detén el proceso anterior.`);
    } else {
      console.error('Error al iniciar el servidor:', error);
    }
    process.exitCode = 1;
  });

  return server;
};

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (currentFile === invokedFile) {
  startServer().catch((error) => {
    console.error('No se pudo iniciar la API:', error);
    process.exitCode = 1;
  });
}

export default app;