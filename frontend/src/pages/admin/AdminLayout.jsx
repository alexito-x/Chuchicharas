import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Tags, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/productos', label: 'Productos', icon: Package },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { to: '/admin/categorias', label: 'Categorías', icon: Tags },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/resenas', label: 'Reseñas', icon: MessageSquare }
];

const AdminLayout = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="container fade-in">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-head">
            <h2>Panel de administración</h2>
            <p>Gestión de Chuchicharas</p>
          </div>
          <nav className="admin-nav">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={17} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;