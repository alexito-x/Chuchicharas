import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const PostalCodeContext = createContext(null);

const STORAGE_KEY = 'chuchicharas_postal_location';
const CACHE_TTL = 12 * 60 * 60 * 1000;
const LOCATION_API = 'https://ipwho.is/';

const readCache = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!parsed?.data?.postalCode || !parsed.savedAt) return null;
    if (Date.now() - parsed.savedAt > CACHE_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

export const PostalCodeProvider = ({ children }) => {
  const [location, setLocation] = useState(() => readCache());
  const [loading, setLoading] = useState(() => !readCache());
  const [error, setError] = useState('');
  const requestRef = useRef(null);

  const fetchPostalCode = useCallback(async () => {
    if (requestRef.current) requestRef.current.abort();

    const controller = new AbortController();
    requestRef.current = controller;
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 8000);

    setLoading(true);
    setError('');

    try {
      const response = await fetch(LOCATION_API, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('No se pudo consultar la ubicación');

      const data = await response.json();
      const postalCode = String(data?.postal || '').trim();
      if (!data?.success || !postalCode) throw new Error('Código postal no disponible');

      const nextLocation = {
        postalCode,
        city: data.city || '',
        region: data.region || '',
        country: data.country || '',
        countryCode: data.country_code || '',
        updatedAt: Date.now()
      };

      setLocation(nextLocation);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: nextLocation, savedAt: nextLocation.updatedAt }));
      } catch {
      }
    } catch (err) {
      if (err.name === 'AbortError' && !timedOut) return;
      setError('No pudimos detectar tu código postal');
    } finally {
      clearTimeout(timeout);
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!readCache()) fetchPostalCode();
    return () => {
      if (requestRef.current) requestRef.current.abort();
    };
  }, [fetchPostalCode]);

  const refresh = useCallback(() => {
    fetchPostalCode();
  }, [fetchPostalCode]);

  return (
    <PostalCodeContext.Provider
      value={{
        postalCode: location?.postalCode || '',
        city: location?.city || '',
        region: location?.region || '',
        country: location?.country || '',
        loading,
        error,
        refresh
      }}
    >
      {children}
    </PostalCodeContext.Provider>
  );
};

export const usePostalCode = () => {
  const context = useContext(PostalCodeContext);
  if (!context) throw new Error('usePostalCode debe usarse dentro de PostalCodeProvider');
  return context;
};
