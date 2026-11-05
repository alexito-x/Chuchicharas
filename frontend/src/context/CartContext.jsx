import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    summary: { subtotal: 0, shipping: 0, total: 0, itemCount: 0 }
  });
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], summary: { subtotal: 0, shipping: 0, total: 0, itemCount: 0 } });
      return;
    }
    try {
      setLoading(true);
      const data = await cartService.getCart();
      setCart(data);
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = useCallback(async (productId, quantity = 1) => {
    const data = await cartService.add(productId, quantity);
    setCart(data);
    return data;
  }, []);

  const updateItem = useCallback(async (productId, quantity) => {
    const data = await cartService.update(productId, quantity);
    setCart(data);
    return data;
  }, []);

  const removeItem = useCallback(async (productId) => {
    const data = await cartService.remove(productId);
    setCart(data);
    return data;
  }, []);

  const clearCart = useCallback(async () => {
    const data = await cartService.clear();
    setCart(data);
    return data;
  }, []);

  const count = cart.items.reduce((acc, item) => acc + item.quantity, 0);

  const value = {
    cart,
    loading,
    count,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    refreshCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
};

export default CartContext;