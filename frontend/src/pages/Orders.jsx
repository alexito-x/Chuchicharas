import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { orderService } from '../services/orderService';
import { formatPrice, formatDateTime, statusLabels, paymentStatusLabels } from '../utils/formatters';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    orderService
      .getAll({ page, limit: 10 })
      .then((data) => {
        setOrders(data.orders);
        setPagination(data.pagination);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <Loader text="Cargando tus compras..." fullScreen />;

  return (
    <div className="container fade-in">
      <div style={{ paddingTop: 16 }}>
        <h1 style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-0.6px' }}>Mis compras</h1>
        <p style={{ color: 'var(--text-soft)', fontSize: 14, marginTop: 3 }}>
          Seguí el estado de tus pedidos y revisá tu historial.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Todavía no hiciste compras"
          message="Cuando compres algo, tus pedidos aparecerán aquí."
          actionLabel="Explorar productos"
          actionTo="/productos"
        />
      ) : (
        <>
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-card-head">
                  <div>
                    <div className="order-number">Pedido {order.orderNumber}</div>
                    <div className="order-date">{formatDateTime(order.createdAt)}</div>
                  </div>
                  <span className={`status-badge status-${order.status}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <div className="order-card-body">
                  <div style={{ fontSize: 13.5, color: 'var(--text-soft)' }}>
                    {order.itemsCount} {order.itemsCount === 1 ? 'producto' : 'productos'} ·{' '}
                    {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span className="order-total">{formatPrice(order.totalAmount)}</span>
                    <Link to={`/mis-pedidos/${order.id}`} className="btn btn-outline btn-sm">
                      Ver detalle <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Orders;