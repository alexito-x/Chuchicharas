import bcrypt from 'bcryptjs';
import { query, queryOne, transaction } from '../config/database.js';
import { generateTokens, verifyRefreshToken } from '../middleware/auth.js';
import { config } from '../config/index.js';
import { AppError, ValidationError } from '../middleware/errorHandler.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      throw new ValidationError('El email ya está registrado', [
        { field: 'email', message: 'Este email ya está en uso' }
      ]);
    }
    
    const passwordHash = await bcrypt.hash(password, 12);
    
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified) 
       VALUES (?, ?, ?, ?, ?, 'user', FALSE)`,
      [email, passwordHash, firstName, lastName, phone || null]
    );
    
    const user = await queryOne(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = ?',
      [result.insertId]
    );
    
    const { accessToken, refreshToken } = generateTokens(user);
    
    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    
    const user = await queryOne(
      'SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = ?',
      [normalizedEmail]
    );
    
    if (!user) {
      throw new AppError('Credenciales inválidas', 401, 'INVALID_CREDENTIALS');
    }
    
    if (!user.is_active) {
      throw new AppError('Cuenta desactivada', 403, 'ACCOUNT_DISABLED');
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AppError('Credenciales inválidas', 401, 'INVALID_CREDENTIALS');
    }
    
    const { accessToken, refreshToken } = generateTokens(user);
    
    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new AppError('Refresh token requerido', 400, 'REFRESH_TOKEN_REQUIRED');
    }
    
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new AppError('Refresh token inválido o expirado', 401, 'INVALID_REFRESH_TOKEN');
    }
    
    if (decoded.type !== 'refresh') {
      throw new AppError('Token inválido', 401, 'INVALID_TOKEN_TYPE');
    }
    
    const user = await queryOne(
      'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );
    
    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }
    
    const tokens = generateTokens(user);
    
    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await queryOne(
      `SELECT id, email, first_name, last_name, phone, role, email_verified, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    
    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role,
          emailVerified: user.email_verified,
          createdAt: user.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body;
    
    await query(
      'UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?',
      [firstName, lastName, phone || null, req.user.id]
    );
    
    const user = await queryOne(
      'SELECT id, email, first_name, last_name, phone, role FROM users WHERE id = ?',
      [req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await queryOne(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );
    
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new AppError('Contraseña actual incorrecta', 400, 'INVALID_CURRENT_PASSWORD');
    }
    
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    
    await query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Contraseña cambiada correctamente'
    });
  } catch (error) {
    next(error);
  }
};