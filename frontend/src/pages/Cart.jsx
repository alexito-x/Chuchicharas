import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShoppingCart, Trash2, Truck, ShieldCheck, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatters';
import QuantitySelector from '../components/ui/QuantitySelector';
import EmptyState from '../components/ui/EmptyState';
import Loader from '../components/ui/Loader';
import SafeImage from '../components/ui/SafeImage';
import { useState } from 'react';

const Cart = () => {
  const { cart, loading, updateItem, removeItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState(null);

  if (!isAuthenticated) {
    return (
      <div className="container">
        <EmptyState
          icon={ShoppingCart}
          title="Inicia sesión para ver tu carrito"
          message="Necesitás una cuenta para guardar productos y comprar."
          actionLabel="Iniciar sesión"
          actionTo="/login"
        />
      </div>
    );
  }

  if (loading && cart.items.length === 0) {
    return <Loader text="Cargando carrito..." fullScreen />;
  }

  const handleQuantity = async (productId, qty) => {
    try {
      setUpdatingId(productId);
      await updateItem(productId, qty);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeItem(productId);
      toast.info('Producto eliminado del carrito');
    } catch {
      toast.error('Error al eliminar el producto');
    }
  };

  const handleClear = async () => {
    if (!window.confirm('¿Vaciar el carrito?')) return;
    await clearCart();
    toast.info('Carrito vaciado');
  };

  if (cart.items.length === 0) {
    return (
      <div className="container">
        <EmptyState
          icon={ShoppingCart}
          title="Tu carrito está vacío"
          message="Agrega productos y aparecerán aquí."
          actionLabel="Explorar productos"
          actionTo="/productos"
        />
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <div className="cart-layout">
        <div className="cart-items">
          <div className="cart-header">
            <h1>Carrito de compras ({cart.summary.itemCount})</h1>
            <button onClick={handleClear} style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>
              Vaciar carrito
            </button>
          </div>

          {cart.items.map((item) => (
            <div key={item.id} className="cart-item">
              <Link to={`/producto/${item.product.id}`} className="cart-item-image">
                <SafeImage
                  src={item.product.primaryImage}
                  alt={item.product.name}
                />
              </Link>
              <div className="cart-item-info">
                <Link to={`/producto/${item.product.id}`} className="cart-item-name">
                  {item.product.name}
                </Link>
                {item.product.brand && (
                  <div className="cart-item-brand">{item.product.brand}</div>
                )}
                {!!item.product.shippingFree && (
                  <div className="cart-item-shipping">
                    <Truck size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> Envío gratis
                  </div>
                )}
                <div className="cart-item-controls">
                  <QuantitySelector
                    value={item.quantity}
                    onChange={(q) => handleQuantity(item.product.id, q)}
                    max={item.product.stockQuantity}
                    disabled={updatingId === item.product.id}
                  />
                  <button className="cart-remove" onClick={() => handleRemove(item.product.id)}>
                    <Trash2 size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> Eliminar
                  </button>
                </div>
              </div>
              <div className="cart-item-price">
                <div className="price">{formatPrice(item.total)}</div>
                {item.quantity > 1 && (
                  <div className="unit">{formatPrice(item.product.price)} c/u</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <aside className="cart-summary">
          <h2>Resumen de compra</h2>
          <div className="summary-row">
            <span>Productos ({cart.summary.itemCount})</span>
            <span>{formatPrice(cart.summary.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Envío</span>
            <span className={cart.summary.shipping === 0 ? 'green' : ''}>
              {cart.summary.shipping === 0 ? 'Gratis' : formatPrice(cart.summary.shipping)}
            </span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(cart.summary.total)}</span>
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--success)', fontWeight: 600, margin: '10px 0 16px' }}>
            6 meses sin intereses de {formatPrice(cart.summary.total / 6)}
          </div>
          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={() => navigate('/checkout')}
          >
            Continuar compra <ArrowRight size={17} />
          </button>
          <Link to="/productos" className="btn btn-ghost btn-block" style={{ marginTop: 10 }}>
            Seguir comprando
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, fontSize: 12.5, color: 'var(--text-soft)' }}>
            <ShieldCheck size={16} color="var(--success)" />
            Compra protegida por Chuchicharas
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;