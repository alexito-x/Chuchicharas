import bcrypt from 'bcryptjs';
import { config } from '../src/config/index.js';
import { query, queryOne, default as pool } from '../src/config/database.js';

const email = config.admin.email.trim().toLowerCase();
const password = config.admin.password;
const firstName = config.admin.firstName.trim();
const lastName = config.admin.lastName.trim();

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!email || !password) {
  fail('Configura ADMIN_EMAIL y ADMIN_PASSWORD en backend/.env');
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  fail('ADMIN_EMAIL no tiene un formato válido');
}

if (
  password.length < 12 ||
  !/[a-z]/.test(password) ||
  !/[A-Z]/.test(password) ||
  !/\d/.test(password)
) {
  fail('ADMIN_PASSWORD debe tener al menos 12 caracteres, una mayúscula, una minúscula y un número');
}

try {
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);

  if (existing) {
    await query(
      `UPDATE users
       SET password_hash = ?, first_name = ?, last_name = ?, role = 'admin', is_active = TRUE
       WHERE id = ?`,
      [passwordHash, firstName, lastName, existing.id]
    );
    console.log(`Administrador actualizado: ${email}`);
  } else {
    await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
       VALUES (?, ?, ?, ?, 'admin', TRUE, TRUE)`,
      [email, passwordHash, firstName, lastName]
    );
    console.log(`Administrador creado: ${email}`);
  }
} catch (error) {
  console.error('No se pudo configurar el administrador:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
