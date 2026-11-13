import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Package, ShoppingCart, DollarSign, AlertTriangle,
  ArrowRight, TrendingUp
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { formatPrice, formatDateTime, statusLabels } from '../../utils/formatters';
import Loader from '../../components/ui/Loader';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Cargando dashboard..." />;
  if (!data) return <p>No se pudieron cargar las estadísticas.</p>;

  const { stats, recentOrders, lowStockProducts, topCategories } = data;

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen general de tu tienda</p>
        </div>
        <Link to="/admin/productos" className="btn btn-primary btn-sm">
          <Package size={15} /> Gestionar productos
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={22} /></div>
          <div className="stat-info">
            <strong>{stats.totalUsers}</strong>
            <span>Clientes registrados</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><Package size={22} /></div>
          <div className="stat-info">
            <strong>{stats.totalProducts}</strong>
            <span>Productos activos</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><ShoppingCart size={22} /></div>
          <div className="stat-info">
            <strong>{stats.totalOrders}</strong>
            <span>Pedidos totales</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><DollarSign size={22} /></div>
          <div className="stat-info">
            <strong style={{ fontSize: 19 }}>{formatPrice(stats.totalRevenue)}</strong>
            <span>Ingresos cobrados</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }} className="dashboard-cols">
        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Últimos pedidos</h2>
            <Link to="/admin/pedidos" className="section-link">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 24 }}>Sin pedidos recientes</td></tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.orderNumber}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-light)' }}>{formatDateTime(order.createdAt)}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{order.user.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-light)' }}>{order.user.email}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatPrice(order.totalAmount)}</td>
                      <td>
                        <span className={`status-badge status-${order.status}`}>
                          {statusLabels[order.status]}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="admin-panel">
            <div className="admin-panel-head">
              <h2><AlertTriangle size={16} color="var(--danger)" style={{ verticalAlign: '-2px' }} /> Stock bajo</h2>
            </div>
            <div className="admin-panel-body" style={{ paddingTop: 10 }}>
              {lowStockProducts.length === 0 ? (
                <p style={{ fontSize: 13.5, color: 'var(--text-light)' }}>Todo el stock está en orden.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {lowStockProducts.map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-light)' }}>{p.sku || 'Sin SKU'}</div>
                      </div>
                      <span className="badge-stock low">{p.stock_quantity} u.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-head">
              <h2><TrendingUp size={16} color="var(--success)" style={{ verticalAlign: '-2px' }} /> Categorías top</h2>
            </div>
            <div className="admin-panel-body" style={{ paddingTop: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topCategories.map((c) => (
                  <div key={c.slug} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                    <span>{c.name}</span>
                    <strong>{c.product_count} prod.</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .dashboard-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;