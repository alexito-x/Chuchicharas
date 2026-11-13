export const formatPrice = (value) => {
  const num = Number(value) || 0;
  const hasCents = !Number.isInteger(num);
  return num.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: hasCents ? 2 : 0,
    minimumFractionDigits: hasCents ? 2 : 0
  });
};

export const formatPricePlain = (value) => {
  const num = Number(value) || 0;
  return num.toLocaleString('es-MX', { maximumFractionDigits: 0 });
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calcDiscount = (price, originalPrice) => {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

export const installmentLabel = (price, count = 6) => {
  const amount = price / count;
  return `${count} meses sin intereses de ${formatPrice(amount)}`;
};

export const statusLabels = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado'
};

export const paymentStatusLabels = {
  pending: 'Pago pendiente',
  paid: 'Pagado',
  failed: 'Pago fallido',
  refunded: 'Reembolsado'
};

export const paymentMethodLabels = {
  credit_card: 'Tarjeta de crédito',
  debit_card: 'Tarjeta de débito',
  mercadopago: 'Mercado Pago',
  transfer: 'Transferencia bancaria',
  cash_on_delivery: 'Pago contra entrega'
};

export const conditionLabels = {
  new: 'Nuevo',
  used: 'Usado',
  refurbished: 'Reacondicionado'
};