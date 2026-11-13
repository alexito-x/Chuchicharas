import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Heart, Truck, Star } from 'lucide-react';
import { formatPrice, calcDiscount } from '../../utils/formatters';
import { useFavorites } from '../../context/FavoritesContext';
import SafeImage from './SafeImage';

const ProductCard = ({ product }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const discount = calcDiscount(product.price, product.originalPrice);
  const favorite = isFavorite(product.id);

  const handleFavorite = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      const added = await toggleFavorite(product);
      toast.success(added ? 'Agregado a favoritos' : 'Eliminado de favoritos');
    } catch {
      toast.error('No se pudo actualizar favoritos');
    }
  };

  return (
    <article className="product-card">
      <Link to={`/producto/${product.id}`} className="product-image-wrap">
        {!!product.isFeatured && !discount && (
          <span className="product-tag featured">Destacado</span>
        )}
        {discount && <span className="product-tag">-{discount}%</span>}
        <SafeImage src={product.primaryImage} alt={product.name} loading="lazy" />
      </Link>

      <button
        type="button"
        className={`product-fav ${favorite ? 'active' : ''}`}
        onClick={handleFavorite}
        aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        aria-pressed={favorite}
      >
        <Heart size={17} fill={favorite ? 'currentColor' : 'none'} />
      </button>

      <div className="product-body">
        {product.brand && <span className="product-brand">{product.brand}</span>}
        <Link to={`/producto/${product.id}`} className="product-name">
          {product.name}
        </Link>

        <div className="product-price-row">
          <span className="product-price">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="product-price-old">{formatPrice(product.originalPrice)}</span>
          )}
          {discount && <span className="product-discount">{discount}% OFF</span>}
        </div>

        {product.price > 0 && (
          <span className="product-installments">
            6 meses sin intereses de {formatPrice(product.price / 6)}
          </span>
        )}

        {!!product.shippingFree && (
          <span className="product-shipping">
            <Truck size={13} /> Envío gratis
          </span>
        )}

        {product.ratingCount > 0 ? (
          <span className="product-rating">
            <Star size={12} fill="#ffb400" color="#ffb400" />
            {Number(product.ratingAverage).toFixed(1)} ({product.ratingCount})
          </span>
        ) : (
          <span className="product-rating">Sin calificaciones</span>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
