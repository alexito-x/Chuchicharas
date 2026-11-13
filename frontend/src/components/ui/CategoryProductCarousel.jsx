import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { productService } from '../../services/productService';
import SafeImage from './SafeImage';
import { formatPrice } from '../../utils/formatters';

const CategoryProductCarousel = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollState, setScrollState] = useState({ left: false, right: false });
  const trackRef = useRef(null);

  useEffect(() => {
    let active = true;
    productService
      .getCategoryShowcase()
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const updateScrollState = () => {
      setScrollState({
        left: track.scrollLeft > 4,
        right: track.scrollLeft + track.clientWidth < track.scrollWidth - 4
      });
    };

    updateScrollState();
    track.addEventListener('scroll', updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(track);

    return () => {
      track.removeEventListener('scroll', updateScrollState);
      observer.disconnect();
    };
  }, [products]);

  const scroll = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('.category-carousel-card');
    const gap = parseFloat(getComputedStyle(track).columnGap || '12') || 12;
    const step = ((card?.getBoundingClientRect().width || 220) + gap) * 2;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="category-carousel-section" aria-labelledby="category-carousel-title">
      <div className="category-carousel-head">
        <div>
          <h2 id="category-carousel-title" className="category-carousel-title">
            <LayoutGrid size={20} /> Productos de cada categoría
          </h2>
          <p className="category-carousel-subtitle">
            Una muestra de nuestro catálogo, categoría por categoría.
          </p>
        </div>
        <div className="category-carousel-actions">
          <button
            type="button"
            className="category-carousel-arrow"
            onClick={() => scroll(-1)}
            disabled={!scrollState.left}
            aria-label="Ver productos anteriores"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="category-carousel-arrow"
            onClick={() => scroll(1)}
            disabled={!scrollState.right}
            aria-label="Ver más productos"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        className="category-carousel-track"
        ref={trackRef}
        role="region"
        aria-label="Carrusel de productos por categoría"
        aria-busy={loading}
      >
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="category-carousel-card category-carousel-card-skeleton">
                <div className="skeleton category-carousel-skeleton-image" />
                <div className="category-carousel-skeleton-body">
                  <span className="skeleton" />
                  <span className="skeleton" />
                  <span className="skeleton short" />
                </div>
              </div>
            ))
          : products.map((product) => {
              const imageSrc = product.primaryImage || product.categoryImage;
              const imageAlt = product.primaryImage
                ? product.name
                : product.categoryImage
                  ? `Imagen de la categoría ${product.category.name}`
                  : product.name;

              return (
                <Link
                  key={product.id}
                  to={`/producto/${product.id}`}
                  className="category-carousel-card"
                >
                  <div className="category-carousel-media">
                    <SafeImage src={imageSrc} alt={imageAlt} loading="lazy" />
                    <span className="category-carousel-badge">{product.category.name}</span>
                  </div>
                  <div className="category-carousel-body">
                    <span className="category-carousel-parent">{product.category.parentName}</span>
                    <h3>{product.name}</h3>
                    <span className="category-carousel-price">{formatPrice(product.price)}</span>
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
};

export default CategoryProductCarousel;
