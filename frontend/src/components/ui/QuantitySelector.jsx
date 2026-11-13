import { Minus, Plus } from 'lucide-react';

const QuantitySelector = ({ value, onChange, min = 1, max = 99, disabled = false }) => {
  return (
    <div className="quantity-selector">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="Disminuir cantidad"
      >
        <Minus size={16} />
      </button>
      <span aria-live="polite">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label="Aumentar cantidad"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

export default QuantitySelector;