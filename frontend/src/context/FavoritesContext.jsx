import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { favoriteService } from '../services/favoriteService';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);
const STORAGE_KEY = 'chuchicharas_guest_favorites';

const normalizeFavorite = (product) => ({
  id: Number(product.id),
  name: product.name,
  slug: product.slug,
  shortDescription: product.shortDescription || '',
  price: Number(product.price) || 0,
  originalPrice: product.originalPrice != null ? Number(product.originalPrice) : null,
  primaryImage: product.primaryImage || null,
  brand: product.brand || null,
  ratingAverage: Number(product.ratingAverage) || 0,
  ratingCount: Number(product.ratingCount) || 0,
  soldCount: Number(product.soldCount) || 0,
  shippingFree: !!product.shippingFree,
  isFeatured: !!product.isFeatured,
  conditionType: product.conditionType || 'new',
  category: product.category || null,
  stockQuantity: Number(product.stockQuantity) || 0
});

const readGuestFavorites = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(stored)) return [];
    return stored
      .filter((item) => item && Number(item.id) > 0 && item.name)
      .map(normalizeFavorite);
  } catch {
    return [];
  }
};

const writeGuestFavorites = (favorites) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.map(normalizeFavorite)));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export const FavoritesProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [favorites, setFavorites] = useState(() => readGuestFavorites());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (authLoading) return undefined;

    if (!isAuthenticated) {
      setFavorites(readGuestFavorites());
      return undefined;
    }

    let active = true;
    const sync = async () => {
      setSyncing(true);
      const guestFavorites = readGuestFavorites();
      try {
        let remote = await favoriteService.getAll();
        if (guestFavorites.length) {
          const remoteIds = new Set(remote.map((item) => item.id));
          const missing = guestFavorites.filter((item) => !remoteIds.has(item.id));
          if (missing.length) {
            await Promise.allSettled(missing.map((item) => favoriteService.add(item.id)));
            remote = await favoriteService.getAll();
          }
          localStorage.removeItem(STORAGE_KEY);
        }
        if (active) setFavorites(remote.map(normalizeFavorite));
      } catch {
        if (active) setFavorites(guestFavorites);
      } finally {
        if (active) setSyncing(false);
      }
    };

    sync();
    return () => {
      active = false;
    };
  }, [isAuthenticated, authLoading, user?.id]);

  const ids = useMemo(() => new Set(favorites.map((item) => item.id)), [favorites]);

  const isFavorite = useCallback((productId) => ids.has(Number(productId)), [ids]);

  const toggleFavorite = useCallback(
    async (product) => {
      const productId = Number(product.id);
      if (!productId) return false;

      const exists = ids.has(productId);
      const previous = favorites;

      if (exists) {
        const next = favorites.filter((item) => item.id !== productId);
        setFavorites(next);
        if (!isAuthenticated) {
          writeGuestFavorites(next);
          return false;
        }
        try {
          const remote = await favoriteService.remove(productId);
          setFavorites(remote.map(normalizeFavorite));
        } catch (error) {
          setFavorites(previous);
          throw error;
        }
        return false;
      }

      const next = [normalizeFavorite(product), ...favorites.filter((item) => item.id !== productId)];
      setFavorites(next);
      if (!isAuthenticated) {
        writeGuestFavorites(next);
        return true;
      }
      try {
        const remote = await favoriteService.add(productId);
        setFavorites(remote.map(normalizeFavorite));
      } catch (error) {
        setFavorites(previous);
        throw error;
      }
      return true;
    },
    [favorites, ids, isAuthenticated]
  );

  const value = {
    favorites,
    count: favorites.length,
    syncing,
    isFavorite,
    toggleFavorite
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites debe usarse dentro de FavoritesProvider');
  return context;
};

export default FavoritesContext;
