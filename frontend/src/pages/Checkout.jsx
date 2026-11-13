import { useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  CreditCard, Truck, ShieldCheck, ArrowLeft, Check, Landmark,
  Wallet, Banknote, Lock
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { getErrorMessage } from '../services/api';
import { formatPrice } from '../utils/formatters';
import SafeImage from '../components/ui/SafeImage';
import Loader from '../components/ui/Loader';

const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Tarjeta de crédito', desc: 'Visa, Mastercard, American Express', icon: CreditCard },
  { value: 'debit_card', label: 'Tarjeta de débito', desc: 'Débito inmediato', icon: CreditCard },
  { value: 'mercadopago', label: 'Mercado Pago', desc: 'Saldo o tarjetas guardadas', icon: Wallet },
  { value: 'transfer', label: 'Transferencia bancaria', desc: 'CLABE interbancaria', icon: Landmark },
  { value: 'cash_on_delivery', label: 'Pago contra entrega', desc: 'Pagas al recibir el producto', icon: Banknote }
];

const MEXICAN_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México',
  'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit',
  'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

const FIELD_LABELS = {
  firstName: 'Nombre',
  lastName: 'Apellido',
  phone: 'Teléfono',
  addressLine1: 'Dirección',
  addressLine2: 'Piso / Depto',
  city: 'Ciudad',
  state: 'Estado',
  postalCode: 'Código postal',
  notes: 'Notas'
};

const validateForm = (form) => {
  const errors = {};
  const firstName = form.firstName.trim();
  const lastName = form.lastName.trim();
  const phone = form.phone.trim();
  const addressLine1 = form.addressLine1.trim();
  const addressLine2 = form.addressLine2.trim();
  const city = form.city.trim();
  const state = form.state.trim();
  const postalCode = form.postalCode.trim();
  const notes = form.notes.trim();

  if (firstName.length < 2 || firstName.length > 100) {
    errors.firstName = 'El nombre debe tener entre 2 y 100 caracteres';
  }
  if (lastName.length < 2 || lastName.length > 100) {
    errors.lastName = 'El apellido debe tener entre 2 y 100 caracteres';
  }
  if (phone && !/^[+0-9()\-\s]{6,20}$/.test(phone)) {
    errors.phone = 'Teléfono inválido (mínimo 6 dígitos)';
  }
  if (addressLine1.length < 5 || addressLine1.length > 255) {
    errors.addressLine1 = 'La dirección debe tener al menos 5 caracteres';
  }
  if (addressLine2.length > 255) {
    errors.addressLine2 = 'Máximo 255 caracteres';
  }
  if (city.length < 2 || city.length > 100) {
    errors.city = 'La ciudad debe tener al menos 2 caracteres';
  }
  if (state.length < 2 || state.length > 100) {
    errors.state = 'Selecciona un estado';
  }
  if (!/^[0-9]{5}$/.test(postalCode)) {
    errors.postalCode = 'El código postal debe tener 5 dígitos';
  }
  if (notes.length > 1000) {
    errors.notes = 'Máximo 1000 caracteres';
  }

  return errors;
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, loading, refreshCart } = useCart();
  const { user } = useAuth();
  const formRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    notes: ''
  });

  const fieldError = (name) => fieldErrors[name];

  const focusFirstError = (errors) => {
    const firstField = Object.keys(errors)[0];
    if (!firstField) return;
    const input = formRef.current?.querySelector(`[name="${firstField}"]`);
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const applyServerErrors = (err) => {
    const serverErrors = err.response?.data?.errors;
    if (!serverErrors?.length) return;

    const mapped = {};
    serverErrors.forEach((item) => {
      const key = item.field?.split('.').pop();
      if (key && FIELD_LABELS[key]) {
        mapped[key] = item.message;
      }
    });
    setFieldErrors(mapped);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const items = useMemo(
    () => cart.items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity
    })),
    [cart.items]
  );

  if (loading && cart.items.length === 0) {
    return <Loader text="Cargando carrito..." fullScreen />;
  }

  if (cart.items.length === 0) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-icon"><CreditCard size={34} /></div>
          <h2>No hay productos para pagar</h2>
          <p>Agrega productos al carrito para continuar.</p>
          <Link to="/productos" className="btn btn-primary">Ver productos</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error(errors[Object.keys(errors)[0]]);
      focusFirstError(errors);
      return;
    }

    setFieldErrors({});
    setProcessing(true);

    const shippingAddress = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim() || undefined,
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      country: 'México'
    };

    let order;
    try {
      order = await orderService.create({
        items,
        shippingAddress,
        paymentMethod,
        notes: form.notes.trim() || undefined
      });
    } catch (err) {
      applyServerErrors(err);
      toast.error(err.response?.data?.message || getErrorMessage(err));
      setProcessing(false);
      return;
    }

    try {
      if (paymentMethod === 'cash_on_delivery') {
        toast.success('Pedido creado. Pagarás al recibir tu compra.');
      } else {
        await orderService.pay(order.id);
        toast.success('¡Pago aprobado! Tu pedido quedó confirmado.');
      }
    } catch {
      toast.warning('El pedido se creó, pero el pago no pudo completarse. Reinténtalo desde el detalle del pedido.');
    } finally {
      try {
        await refreshCart();
      } catch {
      }
      setProcessing(false);
      navigate(`/mis-pedidos/${order.id}`, { replace: true });
    }
  };

  return (
    <div className="container fade-in">
      <div className="breadcrumb">
        <Link to="/carrito"><ArrowLeft size={13} style={{ verticalAlign: '-2px' }} /> Volver al carrito</Link>
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '14px 0 0', letterSpacing: '-0.6px' }}>
        Finalizar compra
      </h1>

      <form onSubmit={handleSubmit} className="checkout-layout" ref={formRef} noValidate>
        <div>
          <div className="checkout-card">
            <h2><span className="step-number">1</span> Datos de envío</h2>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="firstName">Nombre *</label>
                <input
                  id="firstName"
                  className={`form-input ${fieldError('firstName') ? 'input-error' : ''}`}
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                  aria-invalid={!!fieldError('firstName')}
                />
                {fieldError('firstName') && <p className="form-error">{fieldError('firstName')}</p>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="lastName">Apellido *</label>
                <input
                  id="lastName"
                  className={`form-input ${fieldError('lastName') ? 'input-error' : ''}`}
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                  aria-invalid={!!fieldError('lastName')}
                />
                {fieldError('lastName') && <p className="form-error">{fieldError('lastName')}</p>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Teléfono</label>
                <input
                  id="phone"
                  className={`form-input ${fieldError('phone') ? 'input-error' : ''}`}
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+52 55 1234 5678"
                  autoComplete="tel"
                  aria-invalid={!!fieldError('phone')}
                />
                {fieldError('phone') && <p className="form-error">{fieldError('phone')}</p>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="postalCode">Código postal *</label>
                <input
                  id="postalCode"
                  className={`form-input ${fieldError('postalCode') ? 'input-error' : ''}`}
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  placeholder="50450"
                  inputMode="numeric"
                  maxLength={5}
                  autoComplete="postal-code"
                  aria-invalid={!!fieldError('postalCode')}
                />
                {fieldError('postalCode') && <p className="form-error">{fieldError('postalCode')}</p>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="addressLine1">Dirección *</label>
              <input
                id="addressLine1"
                className={`form-input ${fieldError('addressLine1') ? 'input-error' : ''}`}
                name="addressLine1"
                value={form.addressLine1}
                onChange={handleChange}
                placeholder="Calle, número y colonia"
                autoComplete="street-address"
                aria-invalid={!!fieldError('addressLine1')}
              />
              {fieldError('addressLine1') && <p className="form-error">{fieldError('addressLine1')}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="addressLine2">Piso / Depto (opcional)</label>
              <input
                id="addressLine2"
                className={`form-input ${fieldError('addressLine2') ? 'input-error' : ''}`}
                name="addressLine2"
                value={form.addressLine2}
                onChange={handleChange}
                placeholder="Ej. Interior 2"
                aria-invalid={!!fieldError('addressLine2')}
              />
              {fieldError('addressLine2') && <p className="form-error">{fieldError('addressLine2')}</p>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="city">Ciudad *</label>
                <input
                  id="city"
                  className={`form-input ${fieldError('city') ? 'input-error' : ''}`}
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Atlacomulco de Fabela"
                  autoComplete="address-level2"
                  aria-invalid={!!fieldError('city')}
                />
                {fieldError('city') && <p className="form-error">{fieldError('city')}</p>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="state">Estado *</label>
                <select
                  id="state"
                  className={`form-select ${fieldError('state') ? 'input-error' : ''}`}
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  autoComplete="address-level1"
                  aria-invalid={!!fieldError('state')}
                >
                  <option value="">Selecciona un estado</option>
                  {MEXICAN_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {fieldError('state') && <p className="form-error">{fieldError('state')}</p>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="country">País</label>
              <input id="country" className="form-input" value="México" disabled readOnly />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="notes">Notas para el vendedor (opcional)</label>
              <textarea
                id="notes"
                className={`form-textarea ${fieldError('notes') ? 'input-error' : ''}`}
                name="notes"
                rows={2}
                value={form.notes}
                onChange={handleChange}
                aria-invalid={!!fieldError('notes')}
              />
              {fieldError('notes') && <p className="form-error">{fieldError('notes')}</p>}
            </div>
          </div>

          <div className="checkout-card">
            <h2><span className="step-number">2</span> Medio de pago</h2>
            <div className="payment-methods">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const active = paymentMethod === method.value;
                return (
                  <label key={method.value} className={`payment-method ${active ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value={method.value}
                      checked={active}
                      onChange={() => setPaymentMethod(method.value)}
                    />
                    <Icon size={21} color="var(--brand)" />
                    <div>
                      <div className="payment-method-label">{method.label}</div>
                      <div className="payment-method-desc">{method.desc}</div>
                    </div>
                    {active && <Check size={18} color="var(--success)" style={{ marginLeft: 'auto' }} />}
                  </label>
                );
              })}
            </div>

            {paymentMethod === 'credit_card' && (
              <div style={{ marginTop: 18, padding: 16, background: 'var(--bg-soft)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-soft)', marginBottom: 12 }}>
                  <Lock size={14} /> Pago simulado: no se solicitan datos reales de tarjeta
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Número de tarjeta</label>
                    <input className="form-input" placeholder="4111 1111 1111 1111" maxLength={19} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Vencimiento / CVV</label>
                    <input className="form-input" placeholder="12/28 · 123" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="cart-summary">
          <h2>Tu pedido</h2>

          <div className="checkout-items">
            {cart.items.map((item) => (
              <div key={item.id} className="checkout-item">
                <SafeImage src={item.product.primaryImage} alt={item.product.name} />
                <div className="checkout-item-info">
                  <div className="checkout-item-name">{item.product.name}</div>
                  <div className="checkout-item-qty">Cantidad: {item.quantity}</div>
                </div>
                <div className="checkout-item-price">{formatPrice(item.total)}</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 8 }}>
            <div className="summary-row">
              <span>Subtotal</span>
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
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={processing} style={{ marginTop: 16 }}>
            {processing ? 'Procesando pago...' : `Pagar ${formatPrice(cart.summary.total)}`}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16, fontSize: 12.5, color: 'var(--text-soft)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <ShieldCheck size={15} color="var(--success)" /> Compra protegida
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Truck size={15} color="var(--brand)" /> Envío a todo el país
            </span>
          </div>
        </aside>
      </form>
    </div>
  );
};

export default Checkout;
