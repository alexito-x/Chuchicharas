import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
import { getErrorMessage } from '../services/api';

const Register = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname;

  useEffect(() => {
    if (isAuthenticated) navigate(from || '/', { replace: true });
  }, [isAuthenticated, from, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      setError('La contraseña debe incluir mayúscula, minúscula y número');
      return;
    }

    try {
      setLoading(true);
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password
      });
      toast.success('¡Cuenta creada con éxito!');
      navigate(from || '/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Logo />
          <h1>Crea tu cuenta</h1>
          <p>Es gratis y te permite comprar más rápido</p>
        </div>

        {error && <div className="auth-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                className="form-input"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                minLength={2}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Apellido *</label>
              <input
                className="form-input"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                minLength={2}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              className="form-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono (opcional)</label>
            <input
              className="form-input"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="11 2345-6789"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña *</label>
            <input
              className="form-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            <div className="form-hint">Mínimo 8 caracteres, con mayúscula, minúscula y número.</div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar contraseña *</label>
            <input
              className="form-input"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            <UserPlus size={18} />
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;