import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Truck, ShieldCheck, RotateCcw, Star, ShoppingCart, Zap,
  ChevronRight, Heart, PackageX, MessageSquare
} from 'lucide-react';
import { productService } from '../services/productService';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';
import Loader from '../components/ui/Loader';
import Stars from '../components/ui/Stars';
import QuantitySelector from '../components/ui/QuantitySelector';
import ProductCard from '../components/ui/ProductCard';
import ProductGallery from '../components/ui/ProductGallery';
import ShareMenu from '../components/ui/ShareMenu';
import { formatPrice, calcDiscount, conditionLabels, formatDate } from '../utils/formatters';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviewsData, setReviewsData] = useState({ reviews: [], ratingDistribution: {} });
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setQuantity(1);

    Promise.all([
      productService.getProductById(id),
      productService.getRelated(id, 4).catch(() => []),
      reviewService.getProductReviews(id).catch(() => ({ reviews: [], ratingDistribution: {} }))
    ])
      .then(([prod, rel, revs]) => {
        setProduct(prod);
        setRelated(rel);
        setReviewsData(revs);
      })
      .catch(() => {
        toast.error('No se pudo cargar el producto');
        navigate('/productos');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAddToCart = async (redirect = false) => {
    if (!isAuthenticated) {
      toast.info('Inicia sesión para agregar al carrito');
      navigate('/login', { state: { from: { pathname: `/producto/${id}` } } });
      return;
    }
    try {
      redirect ? setBuying(true) : setAdding(true);
      await addItem(product.id, quantity);
      if (redirect) {
        navigate('/carrito');
      } else {
        toast.success('Producto agregado al carrito');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al agregar al carrito');
    } finally {
      setAdding(false);
      setBuying(false);
    }
  };

  const handleFavorite = async () => {
    try {
      const added = await toggleFavorite(product);
      toast.success(added ? 'Agregado a favoritos' : 'Eliminado de favoritos');
    } catch {
      toast.error('No se pudo actualizar favoritos');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      setSubmittingReview(true);
      const newReview = await reviewService.create(product.id, {
        rating: Number(reviewForm.rating),
        title: reviewForm.title,
        comment: reviewForm.comment
      });
      setReviewsData((prev) => ({
        ...prev,
        reviews: [newReview, ...prev.reviews]
      }));
      setReviewForm({ rating: 5, title: '', comment: '' });
      toast.success('¡Gracias por tu reseña!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo enviar la reseña');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <Loader text="Cargando producto..." fullScreen />;
  if (!product) return null;

  const favorite = isFavorite(product.id);
  const discount = calcDiscount(product.price, product.originalPrice);
  const lowStock = product.stockQuantity > 0 && product.stockQuantity <= 10;
  const outOfStock = product.stockQuantity === 0;

  return (
    <div className="container fade-in">
      <div className="breadcrumb">
        <Link to="/">Inicio</Link>
        <ChevronRight size={13} />
        {product.category?.parent && (
          <>
            <Link to={`/productos?categoria=${product.category.parent.slug}`}>
              {product.category.parent.name}
            </Link>
            <ChevronRight size={13} />
          </>
        )}
        <Link to={`/productos?categoria=${product.category?.slug || ''}`}>
          {product.category?.name}
        </Link>
        <ChevronRight size={13} />
        <span style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name}
        </span>
      </div>

      <div className="detail-layout">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="detail-info">
          <div className="detail-condition">
            {conditionLabels[product.conditionType] || 'Nuevo'}
            {product.soldCount > 0 && ` · ${product.soldCount} vendidos`}
          </div>
          <h1 className="detail-title">{product.name}</h1>

          <div className="detail-actions">
            <button
              type="button"
              className={`btn btn-ghost detail-fav ${favorite ? 'active' : ''}`}
              onClick={handleFavorite}
              aria-pressed={favorite}
            >
              <Heart size={17} fill={favorite ? 'currentColor' : 'none'} />
              {favorite ? 'Guardado' : 'Guardar en favoritos'}
            </button>
            <ShareMenu product={product} />
          </div>

          {product.ratingCount > 0 && (
            <div className="detail-rating">
              <Stars rating={product.ratingAverage} size={15} />
              <strong>{Number(product.ratingAverage).toFixed(1)}</strong>
              <span>({product.ratingCount} opiniones)</span>
            </div>
          )}

          <div className="detail-price-row">
            <span className="detail-price">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="detail-price-old">{formatPrice(product.originalPrice)}</span>
            )}
            {discount && <span className="detail-discount">{discount}% OFF</span>}
          </div>

          <div className="detail-installments">
            en <strong>6 meses sin intereses</strong> de {formatPrice(product.price / 6)}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text-soft)', marginTop: 4 }}>
            Precio final · {formatPrice(product.price)}
          </div>

          <div className="detail-shipping">
            {product.shippingFree ? (
              <div className="shipping-line green">
                <Truck size={17} />
                Envío gratis <span>a todo el país</span>
              </div>
            ) : (
              <div className="shipping-line">
                <Truck size={17} />
                Envío: {formatPrice(product.shippingCost)}
              </div>
            )}
            <div className="shipping-line">
              <RotateCcw size={16} />
              Devolución gratis <span>· Tienes 30 días desde que lo recibes</span>
            </div>
            <div className="shipping-line">
              <ShieldCheck size={16} />
              Compra protegida <span>· Recibe el producto que esperabas</span>
            </div>
          </div>

          <div className={`detail-stock ${outOfStock ? 'out-stock' : lowStock ? 'low-stock' : 'in-stock'}`}>
            {outOfStock ? (
              <><PackageX size={17} /> Sin stock disponible</>
            ) : lowStock ? (
              <><Zap size={17} /> ¡Últimas {product.stockQuantity} unidades!</>
            ) : (
              <><ShieldCheck size={17} /> Stock disponible ({product.stockQuantity} unidades)</>
            )}
          </div>

          <div className="detail-buy">
            <div className="detail-buy-row">
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                max={Math.max(1, product.stockQuantity)}
                disabled={outOfStock}
              />
              <span style={{ fontSize: 13, color: 'var(--text-soft)' }}>
                ({product.stockQuantity} disponibles)
              </span>
            </div>
            <button
              className="btn btn-success btn-lg btn-block"
              onClick={() => handleAddToCart(false)}
              disabled={outOfStock || adding}
            >
              <ShoppingCart size={18} />
              {adding ? 'Agregando...' : 'Agregar al carrito'}
            </button>
            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={() => handleAddToCart(true)}
              disabled={outOfStock || buying}
            >
              <Zap size={18} />
              {buying ? 'Procesando...' : 'Comprar ahora'}
            </button>
          </div>

          <div className="detail-warranty">
            {product.warranty && (
              <div className="warranty-item">
                <ShieldCheck size={17} /> Garantía: {product.warranty}
              </div>
            )}
            {product.brand && (
              <div className="warranty-item">
                <Star size={17} /> Marca: <strong>{product.brand}</strong>
              </div>
            )}
            {product.sku && (
              <div className="warranty-item">
                <PackageX size={17} /> SKU: {product.sku}
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="detail-description">
        <h2>Descripción del producto</h2>
        <p>{product.description || product.shortDescription || 'Sin descripción disponible.'}</p>

        {product.attributes?.length > 0 && (
          <>
            <h2 style={{ marginTop: 24 }}>Especificaciones</h2>
            <table className="attributes-table">
              <tbody>
                {product.attributes.map((attr, i) => (
                  <tr key={i}>
                    <th>{attr.name}</th>
                    <td>{attr.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      <section className="detail-description">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={20} /> Opiniones de los compradores
        </h2>

        {product.ratingCount > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>
                {Number(product.ratingAverage).toFixed(1)}
              </div>
              <Stars rating={product.ratingAverage} size={16} />
              <div style={{ fontSize: 12.5, color: 'var(--text-light)', marginTop: 4 }}>
                {product.ratingCount} opiniones
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviewsData.ratingDistribution?.[star] || 0;
                const pct = product.ratingCount ? (count / product.ratingCount) * 100 : 0;
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, width: 30, color: 'var(--text-soft)' }}>{star} ★</span>
                    <div style={{ flex: 1, height: 7, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#ffb400', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-light)', width: 26, textAlign: 'right' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-light)', marginBottom: 18 }}>
            Este producto todavía no tiene opiniones. ¡Sé el primero en opinar!
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reviewsData.reviews.map((review) => (
            <div key={review.id} style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                <Stars rating={review.rating} size={13} />
                <strong style={{ fontSize: 14 }}>{review.title || 'Opinión'}</strong>
                {!!review.isVerifiedPurchase && (
                  <span style={{ fontSize: 11.5, background: '#e5f8ee', color: 'var(--success-dark)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                    Compra verificada
                  </span>
                )}
              </div>
              {review.comment && <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.6 }}>{review.comment}</p>}
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 5 }}>
                {review.user.firstName} {review.user.lastName} · {formatDate(review.createdAt)}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submitReview} style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Deja tu opinión</h3>
          <div className="form-group">
            <label className="form-label">Calificación</label>
            <select
              className="form-select"
              value={reviewForm.rating}
              onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? 'estrella' : 'estrellas'}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Título (opcional)</label>
            <input
              className="form-input"
              type="text"
              maxLength={255}
              value={reviewForm.title}
              onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              placeholder="Resume tu experiencia"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Comentario (opcional)</label>
            <textarea
              className="form-textarea"
              rows={3}
              maxLength={2000}
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="Cuéntanos qué te pareció el producto"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submittingReview}>
            {submittingReview ? 'Enviando...' : 'Publicar opinión'}
          </button>
        </form>
      </section>

      {related.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Productos relacionados</h2>
            <Link to={`/productos?categoria=${product.category?.slug || ''}`} className="section-link">
              Ver más <ChevronRight size={15} />
            </Link>
          </div>
          <div className="products-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;