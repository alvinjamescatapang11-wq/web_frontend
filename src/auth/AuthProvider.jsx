import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [initialSession] = useState(() => {
    const hasToken = authApi.hasToken();
    const user = hasToken ? authApi.getCachedUser() : null;
    return {
      user,
      status: !hasToken ? 'anonymous' : user ? 'authenticated' : 'loading',
    };
  });
  const [user, setUser] = useState(initialSession.user);
  const [status, setStatus] = useState(initialSession.status);

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
    if (user && status === 'authenticated') {
      authApi.cacheUser(user);
    }
  }, [status, user]);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!authApi.hasToken()) {
        setStatus('anonymous');
        return;
      }

      const cachedUser = authApi.getCachedUser();
      if (cachedUser && active) {
        setUser(cachedUser);
        setStatus('authenticated');
      }

      try {
        const currentUser = await authApi.currentUser();
        if (active) {
          setUser(currentUser);
          setStatus('authenticated');
        }
      } catch (error) {
        if (active) {
          if (cachedUser && authApi.hasToken() && error.response?.status !== 401) {
            setUser(cachedUser);
            setStatus('authenticated');
          } else {
            authApi.clearToken();
            setUser(null);
            setStatus('anonymous');
          }
        }
      }
    }

    const onUnauthorized = () => {
      if (active) {
        authApi.clearToken();
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
