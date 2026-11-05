import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, ShieldCheck, CreditCard, HeadphonesIcon,
  ArrowRight, Zap, Tag, TrendingUp
} from 'lucide-react';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import ProductCard from '../components/ui/ProductCard';
import ProductSkeleton from '../components/ui/ProductSkeleton';
import SafeImage from '../components/ui/SafeImage';
import Stars from '../components/ui/Stars';
import { formatPrice } from '../utils/formatters';
import { getErrorMessage } from '../services/api';

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [deals, setDeals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [featuredData, categoriesData, dealsData, bestData] = await Promise.all([
        productService.getFeatured(8),
        categoryService.getAll({ parentId: 0, limit: 10, isActive: true }),
        productService.getProducts({ onSale: true, sortBy: 'newest', limit: 4 }),
        productService.getProducts({ sortBy: 'best_selling', limit: 4 })
      ]);
      setFeatured(featuredData);
      setCategories(categoriesData);
      setDeals(dealsData.products);
      setBestSellers(bestData.products);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const heroProduct = featured[0];

  return (
    <div className="container fade-in">
      <div className="hero-stage">
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge"><Zap size={14} /> Ofertas de la semana</span>
          <h1>
            Todo lo que buscas,<br />
            <span>al mejor precio</span>
          </h1>
          <p>
            Miles de productos en tecnología, hogar, moda y más. Envíos a todo
            México y compra protegida.
          </p>
          <div className="hero-actions">
            <Link to="/productos" className="btn btn-lg btn-light">
              Ver productos <ArrowRight size={18} />
            </Link>
            <Link to="/productos?ofertas=true" className="btn btn-lg btn-glass">
              Ofertas del día
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          {heroProduct && (
            <SafeImage src={heroProduct.primaryImage} alt={heroProduct.name} />
          )}
        </div>
      </section>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>No pudimos cargar el catálogo: {error}</span>
          <button className="btn btn-sm btn-primary" onClick={load}>Reintentar</button>
        </div>
      )}

      <section className="benefits">
        <div className="benefit">
          <div className="benefit-icon"><Truck size={23} /></div>
          <div>
            <strong>Envío gratis</strong>
            <span>En productos seleccionados</span>
          </div>
        </div>
        <div className="benefit">
          <div className="benefit-icon"><CreditCard size={23} /></div>
          <div>
            <strong>Hasta 6 meses</strong>
            <span>Sin intereses</span>
          </div>
        </div>
        <div className="benefit">
          <div className="benefit-icon"><ShieldCheck size={23} /></div>
          <div>
            <strong>Compra protegida</strong>
            <span>Recibe lo que esperas</span>
          </div>
        </div>
        <div className="benefit">
          <div className="benefit-icon"><HeadphonesIcon size={23} /></div>
          <div>
            <strong>Atención personalizada</strong>
            <span>Estamos para ayudarte</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title"><Tag size={22} color="var(--brand)" /> Categorías</h2>
          <Link to="/productos" className="section-link">
            Ver todas <ArrowRight size={15} />
          </Link>
        </div>
        <div className="categories-grid">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/productos?categoria=${cat.slug}`} className="category-card">
              {cat.image_url && <SafeImage src={cat.image_url} alt={cat.name} loading="lazy" />}
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title"><Zap size={22} color="var(--danger)" /> Ofertas destacadas</h2>
          <Link to="/productos?ofertas=true" className="section-link">
            Ver ofertas <ArrowRight size={15} />
          </Link>
        </div>
        <div className="products-grid">
          {loading ? (
            <ProductSkeleton count={4} />
          ) : (
            deals.map((p) => <ProductCard key={p.id} product={p} />)
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title"><TrendingUp size={22} color="var(--success)" /> Productos destacados</h2>
          <Link to="/productos" className="section-link">
            Ver más <ArrowRight size={15} />
          </Link>
        </div>
        <div className="products-grid">
          {loading ? (
            <ProductSkeleton count={8} />
          ) : (
            featured.map((p) => <ProductCard key={p.id} product={p} />)
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">🔥 Los más vendidos</h2>
          <Link to="/productos?orden=best_selling" className="section-link">
            Ver más <ArrowRight size={15} />
          </Link>
        </div>
        <div className="products-grid">
          {loading ? (
            <ProductSkeleton count={4} />
          ) : (
            bestSellers.map((p) => <ProductCard key={p.id} product={p} />)
          )}
        </div>
      </section>

      {featured[1] && (
        <section className="section featured-banner" style={{ background: 'none', padding: 0 }}>
          <div
            className="featured-banner-bg"
            style={{
              background: 'linear-gradient(120deg, var(--plum), var(--plum-soft))',
              borderRadius: 16,
            }}
          />
          <div
            className="featured-banner-content"
            style={{
              borderRadius: 16,
              padding: '32px 36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
              flexWrap: 'wrap',
              color: '#fff',
              position: 'relative',
              zIndex: 1
            }}
          >
            <div>
              <span style={{ background: 'var(--brand)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '5px 12px', borderRadius: 20 }}>
                DESTACADO
              </span>
              <h2 style={{ fontSize: 27, fontWeight: 900, margin: '12px 0 6px', letterSpacing: '-0.6px' }}>
                {featured[1].name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Stars rating={featured[1].ratingAverage} />
                <span style={{ fontSize: 13, opacity: 0.75 }}>
                  {Number(featured[1].ratingAverage).toFixed(1)} · {featured[1].ratingCount} opiniones
                </span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>{formatPrice(featured[1].price)}</div>
              <div style={{ fontSize: 13.5, color: '#9be8c4', fontWeight: 600, marginTop: 2 }}>
                Hasta 6 meses sin intereses de {formatPrice(featured[1].price / 6)}
              </div>
            </div>
            <Link
              to={`/producto/${featured[1].id}`}
              className="btn btn-lg"
              style={{ background: 'var(--white)', color: 'var(--brand-dark)', fontWeight: 800 }}
            >
              Ver producto <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;