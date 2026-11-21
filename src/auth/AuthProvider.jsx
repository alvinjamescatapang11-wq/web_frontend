import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      authApi.clearToken();
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const expireSession = useCallback(() => {
    authApi.clearToken();
    setUser(null);
    setStatus('anonymous');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((current) => current ? { ...current, ...updates } : current);
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!authApi.hasToken()) {
        setStatus('anonymous');
        return;
      }

      try {
        const currentUser = await authApi.currentUser();
        if (active) {
          setUser(currentUser);
          setStatus('authenticated');
        }
      } catch {
        if (active) {
          authApi.clearToken();
          setUser(null);
          setStatus('anonymous');
        }
      }
    }

    const onUnauthorized = () => {
      if (active) {
        setUser(null);
        setStatus('anonymous');
      }
    };

    window.addEventListener('agritrack:unauthorized', onUnauthorized);
    restoreSession();

    return () => {
      active = false;
      window.removeEventListener('agritrack:unauthorized', onUnauthorized);
    };
  }, []);

  const signIn = useCallback(async (credentials) => {
    const signedInUser = await authApi.login(credentials);
    setUser(signedInUser);
    setStatus('authenticated');
    return signedInUser;
  }, []);

  const signInWithGoogle = useCallback(async (credential) => {
    const signedInUser = await authApi.googleLogin(credential);
    setUser(signedInUser);
    setStatus('authenticated');
    return signedInUser;
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signInWithGoogle, signOut, updateUser, expireSession }),
    [user, status, signIn, signInWithGoogle, signOut, updateUser, expireSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
