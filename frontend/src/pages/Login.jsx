import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
import { getErrorMessage } from '../services/api';

const Login = () => {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from || (isAdmin ? '/admin' : '/'), { replace: true });
    }
  }, [isAuthenticated, isAdmin, from, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const user = await login(form.email, form.password);
      toast.success(`¡Bienvenido/a, ${user.firstName}!`);
      navigate(from || (user.role === 'admin' ? '/admin' : '/'), { replace: true });
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
          <h1>Ingresa a tu cuenta</h1>
          <p>Compra más rápido y sigue tus pedidos</p>
        </div>

        {error && <div className="auth-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={17} style={{ position: 'absolute', left: 13, top: 13, color: 'var(--text-light)' }} />
              <input
                id="email"
                className="form-input"
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ paddingLeft: 40 }}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={17} style={{ position: 'absolute', left: 13, top: 13, color: 'var(--text-light)' }} />
              <input
                id="password"
                className="form-input"
                type="password"
                placeholder="Tu contraseña"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ paddingLeft: 40 }}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="auth-footer">
          ¿No tienes cuenta? <Link to="/registro">Crea tu cuenta gratis</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;