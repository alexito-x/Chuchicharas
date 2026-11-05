import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { queryOne } from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token de acceso requerido' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await queryOne(
      'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no encontrado o inactivo' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado' 
      });
    }
    return res.status(403).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await queryOne(
      'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );
    
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Autenticación requerida' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos para realizar esta acción' 
      });
    }
    
    next();
  };
};

export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  
  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
  
  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};