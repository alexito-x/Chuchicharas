import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, ShoppingCart, User, Menu, X, LogOut, Package,
  LayoutDashboard, Heart, ChevronDown, Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import Logo from '../ui/Logo';
import PostalCodeBar from './PostalCodeBar';
import { toast } from 'react-toastify';

const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const { count: favoritesCount } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [categories, setCategories] = useState([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const debounceRef = useRef(null);
  const suggestionsRequestRef = useRef(0);

  useEffect(() => {
    categoryService
      .getTree()
      .then((tree) => setCategories(tree.slice(0, 10)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get('q') || '');
    setShowSuggestions(false);
    setUserMenuOpen(false);
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback((value) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const requestId = ++suggestionsRequestRef.current;

    if (value.trim().length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const data = await productService.getSuggestions(value.trim());
        if (requestId === suggestionsRequestRef.current) {
          setSuggestions(data);
        }
      } catch {
        if (requestId === suggestionsRequestRef.current) {
          setSuggestions([]);
        }
      } finally {
        if (requestId === suggestionsRequestRef.current) {
          setLoadingSuggestions(false);
        }
      }
    }, 280);
  }, []);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setShowSuggestions(true);
    fetchSuggestions(value);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    const q = search.trim();
    navigate(q ? `/productos?q=${encodeURIComponent(q)}` : '/productos');
  };

  const pickSuggestion = (suggestion) => {
    setShowSuggestions(false);
    if (suggestion.type === 'category') {
      navigate(`/productos?categoria=${suggestion.slug}`);
    } else {
      setSearch(suggestion.text);
      navigate(`/productos?q=${encodeURIComponent(suggestion.text)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.info('Sesión cerrada');
    } finally {
      navigate('/');
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-top">
          <button
            className="menu-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menú"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Logo />

          <div className="header-search" ref={searchRef}>
            <form onSubmit={submitSearch} role="search">
              <input
                type="search"
                placeholder="Buscar productos, marcas y más..."
                value={search}
                onChange={handleSearchChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                aria-label="Buscar productos"
              />
              <button type="submit" className="search-btn" aria-label="Buscar">
                <Search size={19} />
              </button>
            </form>

            {showSuggestions && (search.trim().length >= 2) && (
              <div className="search-suggestions">
                {loadingSuggestions ? (
                  <div className="suggestion-item">
                    <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Buscando...</span>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="suggestion-item">
                    <span>Sin sugerencias para "{search}"</span>
                  </div>
                ) : (
                  suggestions.map((s, i) => (
                    <div
                      key={`${s.type}-${i}`}
                      className="suggestion-item"
                      onClick={() => pickSuggestion(s)}
                    >
                      <Search size={15} />
                      <span>{s.text}</span>
                      <span className="suggestion-type">
                        {s.type === 'category' ? 'Categoría' : 'Producto'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="header-actions">
            {isAuthenticated ? (
              <div className="user-menu" ref={userMenuRef}>
                <button
                  className="header-link"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-expanded={userMenuOpen}
                >
                  <User size={20} />
                  <span>{user.firstName}</span>
                  <ChevronDown size={14} />
                </button>

                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <strong>{user.firstName} {user.lastName}</strong>
                      <span>{user.email}</span>
                    </div>
                    <Link to="/mis-pedidos" className="dropdown-item">
                      <Package size={16} /> Mis compras
                    </Link>
                    <Link to="/perfil" className="dropdown-item">
                      <User size={16} /> Mi perfil
                    </Link>
                    <Link to="/favoritos" className="dropdown-item">
                      <Heart size={16} /> Mis favoritos
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="dropdown-item">
                        <LayoutDashboard size={16} /> Panel de administración
                      </Link>
                    )}
                    <button className="dropdown-item danger" onClick={handleLogout}>
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="header-link hide-mobile">
                <User size={20} />
                <span>Ingresar</span>
              </Link>
            )}

            <Link to="/favoritos" className="header-link" aria-label="Favoritos">
              <Heart size={20} />
              <span className="hide-mobile">Favoritos</span>
              {favoritesCount > 0 && <span className="cart-badge">{favoritesCount > 99 ? '99+' : favoritesCount}</span>}
            </Link>

            <Link to="/carrito" className="header-link" aria-label="Carrito de compras">
              <ShoppingCart size={20} />
              <span className="hide-mobile">Carrito</span>
              {count > 0 && <span className="cart-badge">{count > 99 ? '99+' : count}</span>}
            </Link>

            {isAdmin && (
              <Link to="/admin" className="header-link hide-mobile" title="Panel admin">
                <LayoutDashboard size={20} />
              </Link>
            )}
          </div>
        </div>
      </div>

      <nav className="header-categories">
        <div className="container">
          <NavLink
            to="/productos"
            className={`cat-link ${location.pathname === '/productos' && !new URLSearchParams(location.search).get('categoria') && !new URLSearchParams(location.search).get('ofertas') ? 'active' : ''}`}
          >
            Todos los productos
          </NavLink>
          {categories.map((cat) => (
            <NavLink
              key={cat.id}
              to={`/productos?categoria=${cat.slug}`}
              className={`cat-link ${new URLSearchParams(location.search).get('categoria') === cat.slug ? 'active' : ''}`}
            >
              {cat.name}
            </NavLink>
          ))}
          <NavLink
            to="/productos?ofertas=true"
            className={`cat-link ${new URLSearchParams(location.search).get('ofertas') === 'true' ? 'active' : ''}`}
            style={{ color: 'var(--danger)', fontWeight: 700 }}
          >
            Ofertas
          </NavLink>
        </div>
      </nav>

      <PostalCodeBar />

      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <Link to="/productos" onClick={() => setMobileOpen(false)}>Productos</Link>
        {isAuthenticated ? (
          <>
            <Link to="/mis-pedidos" onClick={() => setMobileOpen(false)}>
              <Package size={17} /> Mis compras
            </Link>
            <Link to="/perfil" onClick={() => setMobileOpen(false)}>
              <User size={17} /> Mi perfil
            </Link>
            <Link to="/favoritos" onClick={() => setMobileOpen(false)}>
              <Heart size={17} /> Mis favoritos
            </Link>
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileOpen(false)}>
                <LayoutDashboard size={17} /> Panel admin
              </Link>
            )}
            <button onClick={handleLogout}>
              <LogOut size={17} /> Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/favoritos" onClick={() => setMobileOpen(false)}>
              <Heart size={17} /> Mis favoritos
            </Link>
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              <User size={17} /> Ingresar
            </Link>
            <Link to="/registro" onClick={() => setMobileOpen(false)}>
              <User size={17} /> Crear cuenta
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;