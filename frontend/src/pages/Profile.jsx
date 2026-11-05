import { useState } from 'react';
import { toast } from 'react-toastify';
import { User, Lock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { getErrorMessage } from '../services/api';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || ''
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await authService.updateProfile(form);
      updateUser(updated);
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    try {
      setChanging(true);
      await authService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword
      });
      toast.success('Contraseña actualizada');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setChanging(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="container fade-in" style={{ maxWidth: 820 }}>
      <div style={{ paddingTop: 18 }}>
        <h1 style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-0.5px' }}>Mi perfil</h1>
        <p style={{ color: 'var(--text-soft)', fontSize: 14, marginTop: 2 }}>{user?.email}</p>
      </div>

      <div className="checkout-card" style={{ marginTop: 18 }}>
        <h2><User size={19} color="var(--brand)" /> Datos personales</h2>
        <form onSubmit={saveProfile}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input
                className="form-input"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                minLength={2}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Apellido</label>
              <input
                className="form-input"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                minLength={2}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input
              className="form-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="11 2345-6789"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={user?.email || ''} disabled />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      <div className="checkout-card">
        <h2><Lock size={19} color="var(--brand)" /> Cambiar contraseña</h2>
        <form onSubmit={changePassword}>
          <div className="form-group">
            <label className="form-label">Contraseña actual</label>
            <input
              className="form-input"
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nueva contraseña</label>
              <input
                className="form-input"
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar nueva contraseña</label>
              <input
                className="form-input"
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                required
                autoComplete="new-password"
              />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={changing}>
            {changing ? 'Actualizando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>

      <div className="checkout-card">
        <button className="btn btn-ghost" onClick={handleLogout}>
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Profile;