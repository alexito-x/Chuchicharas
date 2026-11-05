import { MapPin, RefreshCw } from 'lucide-react';
import { usePostalCode } from '../../context/PostalCodeContext';

const PostalCodeBar = () => {
  const { postalCode, city, region, loading, error, refresh } = usePostalCode();
  const place = [city, region].filter(Boolean).join(', ');
  const actionLabel = error && !postalCode ? 'Reintentar' : 'Actualizar';

  return (
    <div className="postal-code-bar" aria-live="polite">
      <div className="container postal-code-bar-inner">
        <MapPin size={14} className="postal-code-icon" />
        {postalCode ? (
          <>
            <span className="postal-code-copy">Código postal detectado:</span>
            <strong className="postal-code-value">C.P. {postalCode}</strong>
            {place && <span className="postal-code-place">{place}</span>}
          </>
        ) : loading ? (
          <span className="postal-code-copy">Detectando tu código postal..</span>
        ) : (
          <span className="postal-code-copy">{error || 'Código postal no disponible'}</span>
        )}
        <button
          type="button"
          className="postal-code-refresh"
          onClick={refresh}
          disabled={loading}
          title="Actualizar código postal según tu conexión"
          aria-label="Actualizar código postal"
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          <span>{loading && !postalCode ? 'Detectando' : actionLabel}</span>
        </button>
      </div>
    </div>
  );
};

export default PostalCodeBar;
