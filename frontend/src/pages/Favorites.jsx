import { Link } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ui/ProductCard';
import EmptyState from '../components/ui/EmptyState';

const Favorites = () => {
  const { favorites, count, syncing } = useFavorites();
  const { isAuthenticated } = useAuth();

  return (
    <div className="container fade-in">
      <div className="favorites-head">
        <div>
          <h1><Heart size={24} color="var(--brand)" /> Mis favoritos</h1>
          <p>
            {count === 0
              ? 'Guarda productos para encontrarlos fácilmente después.'
              : `${count} ${count === 1 ? 'producto guardado' : 'productos guardados'}`}
          </p>
        </div>
        <Link to="/productos" className="btn btn-ghost">Seguir comprando</Link>
      </div>

      {!isAuthenticated && (
        <div className="alert alert-info">
          <span>Tus favoritos se guardan en este dispositivo. Inicia sesión para sincronizarlos en tu cuenta.</span>
          <Link to="/login" className="btn btn-sm btn-primary">Iniciar sesión</Link>
        </div>
      )}

      {syncing && favorites.length === 0 ? (
        <div className="empty-state">
          <Loader2 size={30} className="spin" />
          <p>Cargando favoritos...</p>
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Todavía no tienes favoritos"
          message="Toca el corazón de cualquier producto para guardarlo aquí."
          actionLabel="Explorar productos"
          actionTo="/productos"
        />
      ) : (
        <div className="products-grid">
          {favorites.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
