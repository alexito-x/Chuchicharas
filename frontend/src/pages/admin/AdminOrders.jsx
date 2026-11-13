import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Search, Eye, Truck, X } from 'lucide-react';
import { orderService } from '../../services/orderService';
import {
  formatPrice, formatDateTime, statusLabels, paymentStatusLabels
} from '../../utils/formatters';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import Loader from '../../components/ui/Loader';

const STATUS_OPTIONS = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
];

const NEXT_STATUS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: []
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    orderService
      .getAdminOrders({ page, limit: 12, status: status || undefined, search: search || undefined })
      .then((data) => {
        setOrders(data.orders);
        setPagination(data.pagination);
      })
      .catch(() => toast.error('No se pudieron cargar los pedidos'))
      .finally(() => setLoading(false));
  }, [page, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (order) => {
    setDetail(order);
    setNewStatus('');
    setDetailLoading(true);
    try {
      const full = await orderService.getById(order.id);
      setDetail(full);
    } catch {
      toast.error('No se pudo cargar el detalle');
    } finally {
      setDetailLoading(false);
    }
  };

  const changeStatus = async () => {
    if (!newStatus) return;
    try {
      setUpdating(true);
      await orderService.updateStatus(detail.id, { status: newStatus });
      toast.success('Estado actualizado');
      setDetail((prev) => ({ ...prev, status: newStatus }));
      setNewStatus('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo actualizar el estado');
    } finally {
      setUpdating(false);
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1>Pedidos</h1>
          <p>Controlá el estado y la logística de cada compra</p>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <form onSubmit={submitSearch} style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 460, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <Search size={16} style={{ position: 'absolute', left: 11, top: 11, color: 'var(--text-light)' }} />
              <input
                className="form-input"
                placeholder="Pedido, email o cliente..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ paddingLeft: 34, paddingTop: 9, paddingBottom: 9 }}
              />
            </div>
            <select
              className="select-sm"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">Todos los estados</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
            <button className="btn btn-ghost btn-sm" type="submit">Buscar</button>
          </form>
          <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
            {pagination?.total || 0} pedidos
          </span>
        </div>

        {loading ? (
          <Loader text="Cargando pedidos..." />
        ) : orders.length === 0 ? (
          <div className="admin-panel-body" style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>
            <Truck size={34} style={{ marginBottom: 10, opacity: 0.5 }} />
            <p>No hay pedidos que coincidan.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700 }}>{o.orderNumber}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{o.user.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-light)' }}>{o.user.email}</div>
                    </td>
                    <td style={{ fontSize: 12.5 }}>{formatDateTime(o.createdAt)}</td>
                    <td style={{ fontWeight: 700 }}>{formatPrice(o.totalAmount)}</td>
                    <td>
                      <span className={`status-badge ${o.paymentStatus === 'paid' ? 'status-delivered' : 'status-pending'}`}>
                        {paymentStatusLabels[o.paymentStatus]}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${o.status}`}>
                        {statusLabels[o.status]}
                      </span>
                    </td>
                    <td>
                      <button className="icon-btn" onClick={() => openDetail(o)} title="Ver detalle">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination && (
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />
      )}

      <Modal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Pedido ${detail.orderNumber}` : 'Pedido'}
        size="large"
        footer={
          detail && (
            <>
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Cerrar</button>
              {(detail.status === 'cancelled' && detail.paymentStatus === 'paid' ? ['refunded'] : detail.status === 'delivered' && detail.paymentStatus !== 'paid' ? [] : NEXT_STATUS[detail.status] || []).length > 0 && (
                <>
                  <select
                    className="select-sm"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="">Cambiar estado a...</option>
                    {(detail.status === 'cancelled' && detail.paymentStatus === 'paid' ? ['refunded'] : detail.status === 'delivered' && detail.paymentStatus !== 'paid' ? [] : NEXT_STATUS[detail.status] || []).map((s) => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </select>
                  <button className="btn btn-primary" onClick={changeStatus} disabled={!newStatus || updating}>
                    {updating ? 'Actualizando...' : 'Confirmar'}
                  </button>
                </>
              )}
            </>
          )
        }
      >
        {detailLoading ? (
          <Loader text="Cargando detalle..." />
        ) : detail ? (
          <div>
            <div className="form-row">
              <div>
                <div className="filter-label">Cliente</div>
                <p style={{ fontSize: 14 }}>
                  {detail.user?.firstName} {detail.user?.lastName}<br />
                  <span style={{ color: 'var(--text-light)', fontSize: 13 }}>{detail.user?.email}</span>
                </p>
              </div>
              <div>
                <div className="filter-label">Estado</div>
                <span className={`status-badge status-${detail.status}`}>
                  {statusLabels[detail.status]}
                </span>
                <span className={`status-badge ${detail.paymentStatus === 'paid' ? 'status-delivered' : 'status-pending'}`} style={{ marginLeft: 8 }}>
                  {paymentStatusLabels[detail.paymentStatus]}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div className="filter-label">Productos</div>
              {detail.items?.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13.5 }}>
                  <span>
                    {item.productName} <span style={{ color: 'var(--text-light)' }}>x{item.quantity}</span>
                  </span>
                  <strong>{formatPrice(item.totalPrice)}</strong>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="summary-row">
                <span>Subtotal</span><span>{formatPrice(detail.subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Envío</span><span>{detail.shippingCost === 0 ? 'Gratis' : formatPrice(detail.shippingCost)}</span>
              </div>
              {detail.discountAmount > 0 && (
                <div className="summary-row">
                  <span>Descuento</span><span style={{ color: 'var(--success)' }}>-{formatPrice(detail.discountAmount)}</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Total</span><span>{formatPrice(detail.totalAmount)}</span>
              </div>
            </div>

            {detail.shippingAddress && (
              <div style={{ marginTop: 16, padding: 14, background: 'var(--bg-soft)', borderRadius: 8, fontSize: 13.5, lineHeight: 1.6 }}>
                <div className="filter-label">Envío a</div>
                {detail.shippingAddress.firstName} {detail.shippingAddress.lastName}<br />
                {detail.shippingAddress.addressLine1}
                {detail.shippingAddress.addressLine2 ? `, ${detail.shippingAddress.addressLine2}` : ''}<br />
                {detail.shippingAddress.city}, {detail.shippingAddress.state} ({detail.shippingAddress.postalCode})<br />
                {detail.shippingAddress.country}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default AdminOrders;