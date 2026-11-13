import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('chuchicharas_user');
    const token = localStorage.getItem('chuchicharas_token');
    let parsedUser = null;

    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser);
      } catch {
        localStorage.removeItem('chuchicharas_user');
      }
    }

    if (parsedUser && token) {
      setUser(parsedUser);
      authService
        .getProfile()
        .then((profile) => {
          setUser(profile);
          localStorage.setItem('chuchicharas_user', JSON.stringify(profile));
        })
        .catch((error) => {
          if ([401, 403].includes(error.response?.status)) {
            localStorage.removeItem('chuchicharas_user');
            localStorage.removeItem('chuchicharas_token');
            localStorage.removeItem('chuchicharas_refresh_token');
            setUser(null);
            return;
          }
          // Do not log users out merely because the API/DB is temporarily offline.
          setUser(parsedUser);
        })
        .finally(() => setLoading(false));
    } else {
      // Clear incomplete/corrupted sessions so Axios does not keep sending stale tokens.
      localStorage.removeItem('chuchicharas_user');
      localStorage.removeItem('chuchicharas_token');
      localStorage.removeItem('chuchicharas_refresh_token');
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem('chuchicharas_token', data.accessToken);
    localStorage.setItem('chuchicharas_refresh_token', data.refreshToken);
    localStorage.setItem('chuchicharas_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    localStorage.setItem('chuchicharas_token', data.accessToken);
    localStorage.setItem('chuchicharas_refresh_token', data.refreshToken);
    localStorage.setItem('chuchicharas_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
    } finally {
      localStorage.removeItem('chuchicharas_token');
      localStorage.removeItem('chuchicharas_refresh_token');
      localStorage.removeItem('chuchicharas_user');
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    localStorage.setItem('chuchicharas_user', JSON.stringify(updated));
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};

export default AuthContext;