import { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ChevronRight, Package, Truck, MapPin, CreditCard, XCircle,
  CheckCircle2, Clock
} from 'lucide-react';
import { orderService } from '../services/orderService';
import {
  formatPrice, formatDateTime, statusLabels, paymentStatusLabels, paymentMethodLabels
} from '../utils/formatters';
import Loader from '../components/ui/Loader';
import SafeImage from '../components/ui/SafeImage';

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    orderService
      .getById(id)
      .then(setOrder)
      .catch(() => {
        toast.error('Pedido no encontrado');
        navigate('/mis-pedidos');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async () => {
    if (!window.confirm('¿Seguro que quieres cancelar este pedido?')) return;
    try {
      setCancelling(true);
      await orderService.cancel(id);
      toast.success('Pedido cancelado');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo cancelar');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <Loader text="Cargando pedido..." fullScreen />;
  if (!order) return null;

  const address = order.shippingAddress || {};
  const currentStep = STEPS.indexOf(order.status);
  const isCancelled = ['cancelled', 'refunded'].includes(order.status);

  return (
    <div className="container fade-in">
      <div className="breadcrumb">
        <Link to="/mis-pedidos">Mis compras</Link>
        <ChevronRight size={13} />
        <span>Pedido {order.orderNumber}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, margin: '16px 0' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Pedido {order.orderNumber}
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-soft)', marginTop: 2 }}>
            Realizado el {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`status-badge status-${order.status}`}>
            {statusLabels[order.status]}
          </span>
          {['pending', 'confirmed'].includes(order.status) && (
            <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={cancelling}>
              <XCircle size={14} /> {cancelling ? 'Cancelando...' : 'Cancelar pedido'}
            </button>
          )}
        </div>
      </div>

      {!isCancelled && (
        <div className="checkout-card">
          <h2 style={{ marginBottom: 22 }}>Estado del pedido</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              return (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 120px' }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      background: done ? 'var(--success)' : 'var(--border)',
                      color: done ? '#fff' : 'var(--text-light)',
                      flexShrink: 0
                    }}
                  >
                    {done ? <CheckCircle2 size={18} /> : <Clock size={17} />}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: done ? 700 : 500, color: done ? 'var(--dark)' : 'var(--text-light)' }}>
                    {statusLabels[step]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="checkout-layout">
        <div>
          <div className="checkout-card">
            <h2><Package size={19} color="var(--brand)" /> Productos</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {order.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
                  <SafeImage
                    src={item.primaryImage}
                    alt={item.productName}
                    style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', background: 'var(--bg-soft)' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {item.slug ? (
                      <Link to={`/producto/${item.productId}`} style={{ fontWeight: 600, fontSize: 14 }}>
                        {item.productName}
                      </Link>
                    ) : (
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.productName}</div>
                    )}
                    <div style={{ fontSize: 12.5, color: 'var(--text-light)', marginTop: 2 }}>
                      {item.productSku && `SKU: ${item.productSku} · `}Cantidad: {item.quantity}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{formatPrice(item.totalPrice)}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{formatPrice(item.unitPrice)} c/u</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="checkout-card">
            <h2><MapPin size={19} color="var(--brand)" /> Dirección de envío</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-soft)' }}>
              <strong>{address.firstName} {address.lastName}</strong><br />
              {address.addressLine1}
              {address.addressLine2 && `, ${address.addressLine2}`}<br />
              {address.city}, {address.state} ({address.postalCode})<br />
              {address.country}
              {address.phone && <><br />Tel: {address.phone}</>}
            </p>
          </div>

          <div className="checkout-card">
            <h2><CreditCard size={19} color="var(--brand)" /> Pago</h2>
            <div className="summary-row">
              <span>Medio de pago</span>
              <span>{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</span>
            </div>
            <div className="summary-row">
              <span>Estado del pago</span>
              <span style={{ color: order.paymentStatus === 'paid' ? 'var(--success)' : 'var(--warning)', fontWeight: 700 }}>
                {paymentStatusLabels[order.paymentStatus]}
              </span>
            </div>
            {order.paymentReference && (
              <div className="summary-row">
                <span>Referencia</span>
                <span style={{ fontSize: 12.5 }}>{order.paymentReference}</span>
              </div>
            )}
          </div>
        </div>

        <aside className="cart-summary">
          <h2>Resumen</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Envío</span>
            <span className={order.shippingCost === 0 ? 'green' : ''}>
              {order.shippingCost === 0 ? 'Gratis' : formatPrice(order.shippingCost)}
            </span>
          </div>
          {order.discountAmount > 0 && (
            <div className="summary-row">
              <span>Descuento</span>
              <span className="green">-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
          {order.notes && (
            <div style={{ marginTop: 14, padding: 12, background: 'var(--bg-soft)', borderRadius: 8, fontSize: 13 }}>
              <strong>Notas:</strong> {order.notes}
            </div>
          )}
          <Link to="/productos" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
            Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  );
};

export default OrderDetail;