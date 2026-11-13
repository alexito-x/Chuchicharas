import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronRight, SearchX } from 'lucide-react';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import ProductCard from '../components/ui/ProductCard';
import CategoryProductCarousel from '../components/ui/CategoryProductCarousel';
import ProductSkeleton from '../components/ui/ProductSkeleton';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { getErrorMessage } from '../services/api';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'best_selling', label: 'Más vendidos' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'rating', label: 'Mejor calificados' }
];

const CONDITIONS = [
  { value: 'new', label: 'Nuevo' },
  { value: 'used', label: 'Usado' },
  { value: 'refurbished', label: 'Reacondicionado' }
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get('q') || '';
  const categorySlug = searchParams.get('categoria') || '';
  const sortBy = searchParams.get('orden') || 'newest';
  const page = parseInt(searchParams.get('pagina') || '1', 10);
  const offers = searchParams.get('ofertas') === 'true';
  const brandParam = searchParams.get('marca') || '';
  const conditionParam = searchParams.get('condicion') || '';
  const minPriceParam = searchParams.get('precioMin') || '';
  const maxPriceParam = searchParams.get('precioMax') || '';

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [priceMin, setPriceMin] = useState(minPriceParam);
  const [priceMax, setPriceMax] = useState(maxPriceParam);

  useEffect(() => {
    setPriceMin(minPriceParam);
    setPriceMax(maxPriceParam);
  }, [minPriceParam, maxPriceParam]);

  useEffect(() => {
    Promise.all([categoryService.getTree(), productService.getBrands()])
      .then(([tree, brandsData]) => {
        setCategories(tree);
        setBrands(brandsData);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!categorySlug) {
      setActiveCategory(null);
      return;
    }
    categoryService
      .getBySlug(categorySlug)
      .then(setActiveCategory)
      .catch(() => setActiveCategory(null));
  }, [categorySlug]);

  const updateParam = useCallback(
    (key, value) => {
      const next = new URLSearchParams(searchParams);
      if (value === '' || value == null) next.delete(key);
      else next.set(key, value);
      if (key !== 'pagina') next.delete('pagina');
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 16,
        sortBy
      };
      if (q) params.search = q;
      if (categorySlug) {
        try {
          const cat = await categoryService.getBySlug(categorySlug);
          params.category = cat.id;
        } catch {
          /* ignore */
        }
      }
      if (brandParam) params.brand = brandParam;
      if (conditionParam) params.condition = conditionParam;
      if (minPriceParam) params.minPrice = minPriceParam;
      if (maxPriceParam) params.maxPrice = maxPriceParam;
      if (offers) params.onSale = true;

      const data = await productService.getProducts(params);
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, q, categorySlug, brandParam, conditionParam, minPriceParam, maxPriceParam, offers]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const applyPriceFilter = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    priceMin ? next.set('precioMin', priceMin) : next.delete('precioMin');
    priceMax ? next.set('precioMax', priceMax) : next.delete('precioMax');
    next.delete('pagina');
    setSearchParams(next);
  };

  const clearFilters = () => {
    setPriceMin('');
    setPriceMax('');
    setSearchParams(q ? { q } : {});
  };

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (brandParam) n++;
    if (conditionParam) n++;
    if (minPriceParam || maxPriceParam) n++;
    if (categorySlug) n++;
    return n;
  }, [brandParam, conditionParam, minPriceParam, maxPriceParam, categorySlug]);

  const title = activeCategory ? activeCategory.name : q ? `Resultados para "${q}"` : offers ? 'Ofertas del día' : 'Todos los productos';
  const showCategoryCarousel = !q && !categorySlug && !offers && !brandParam && !conditionParam && !minPriceParam && !maxPriceParam && page === 1;

  return (
    <div className="container fade-in">
      <div className="breadcrumb">
        <Link to="/">Inicio</Link>
        <ChevronRight size={13} />
        <span>{title}</span>
      </div>

      <div className="toolbar" style={{ marginTop: 16 }}>
        <div className="toolbar-info">
          <h1 style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 3 }}>{title}</h1>
          {pagination && (
            <span>
              <strong>{pagination.total}</strong> {pagination.total === 1 ? 'producto' : 'productos'} encontrados
            </span>
          )}
        </div>
        <div className="toolbar-actions">
          <button
            className="btn btn-ghost btn-sm filter-toggle"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <SlidersHorizontal size={15} />
            Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <select
            className="select-sm"
            value={sortBy}
            onChange={(e) => updateParam('orden', e.target.value)}
            aria-label="Ordenar productos"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {showCategoryCarousel && <CategoryProductCarousel />}

      <div className="catalog-layout">
        <aside className={`filters-panel ${filtersOpen ? 'open' : ''}`}>
          <div className="filters-title">
            Filtros
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                style={{ fontSize: 12.5, color: 'var(--brand)', fontWeight: 600 }}
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="filter-group">
            <div className="filter-label">Categorías</div>
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="radio"
                  name="cat"
                  checked={!categorySlug}
                  onChange={() => updateParam('categoria', '')}
                />
                Todas
              </label>
              {categories.map((cat) => (
                <div key={cat.id}>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="cat"
                      checked={categorySlug === cat.slug}
                      onChange={() => updateParam('categoria', cat.slug)}
                    />
                    {cat.name}
                  </label>
                  {cat.children?.length > 0 && categorySlug === cat.slug && (
                    <div style={{ paddingLeft: 22 }}>
                      {cat.children.map((child) => (
                        <label key={child.id} className="filter-option">
                          <input
                            type="radio"
                            name="cat"
                            checked={categorySlug === child.slug}
                            onChange={() => updateParam('categoria', child.slug)}
                          />
                          {child.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-label">Precio</div>
            <form onSubmit={applyPriceFilter}>
              <div className="price-range">
                <input
                  type="number"
                  placeholder="Mín"
                  min="0"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  aria-label="Precio mínimo"
                />
                <span style={{ color: 'var(--text-light)' }}>—</span>
                <input
                  type="number"
                  placeholder="Máx"
                  min="0"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  aria-label="Precio máximo"
                />
              </div>
              <button type="submit" className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 9 }}>
                Aplicar
              </button>
            </form>
          </div>

          <div className="filter-group">
            <div className="filter-label">Condición</div>
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="radio"
                  name="cond"
                  checked={!conditionParam}
                  onChange={() => updateParam('condicion', '')}
                />
                Todas
              </label>
              {CONDITIONS.map((c) => (
                <label key={c.value} className="filter-option">
                  <input
                    type="radio"
                    name="cond"
                    checked={conditionParam === c.value}
                    onChange={() => updateParam('condicion', c.value)}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-label">Marcas</div>
            <div className="filter-options" style={{ maxHeight: 220, overflowY: 'auto' }}>
              {brands.map((b) => (
                <label key={b} className="filter-option">
                  <input
                    type="checkbox"
                    checked={brandParam === b}
                    onChange={() => updateParam('marca', brandParam === b ? '' : b)}
                  />
                  {b}
                </label>
              ))}
            </div>
          </div>

          {(brandParam || conditionParam || minPriceParam || maxPriceParam) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, paddingTop: 14 }}>
              {brandParam && (
                <button className="chip active" onClick={() => updateParam('marca', '')}>
                  {brandParam} <X size={12} />
                </button>
              )}
              {conditionParam && (
                <button className="chip active" onClick={() => updateParam('condicion', '')}>
                  {CONDITIONS.find((c) => c.value === conditionParam)?.label} <X size={12} />
                </button>
              )}
              {(minPriceParam || maxPriceParam) && (
                <button className="chip active" onClick={clearFilters}>
                  Precio: {minPriceParam || '0'} - {maxPriceParam || '∞'} <X size={12} />
                </button>
              )}
            </div>
          )}
        </aside>

        <main>
          {loading ? (
            <div className="products-grid">
              <ProductSkeleton count={12} />
            </div>
          ) : error ? (
            <div className="alert alert-error" role="alert">
              <span>No pudimos cargar los productos: {error}</span>
              <button className="btn btn-sm btn-primary" onClick={loadProducts}>Reintentar</button>
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No encontramos productos"
              message="Prueba con otros filtros o términos de búsqueda."
              actionLabel="Ver todos los productos"
              actionTo="/productos"
            />
          ) : (
            <>
              <div className="products-grid">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <Pagination
                page={pagination?.page || 1}
                totalPages={pagination?.totalPages || 1}
                onChange={(newPage) => updateParam('pagina', String(newPage))}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;