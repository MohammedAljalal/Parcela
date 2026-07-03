// Holds the logged-in admin/vendor in memory + localStorage, and exposes
// login/logout. Only users with role "admin" or "vendor" are allowed in —
// regular customers are rejected right after a successful login.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../api/auth';
import { setTokens, clearTokens } from '../api/client';

const AuthContext = createContext(null);

const ALLOWED_ROLES = ['admin', 'vendor'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('parcela_admin_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const hasToken = localStorage.getItem('parcela_admin_access_token');
      if (!hasToken) {
        setIsLoading(false);
        return;
      }
      try {
        const freshUser = await authApi.getMe();
        if (!ALLOWED_ROLES.includes(freshUser.role)) throw new Error('Not authorized');
        setUser(freshUser);
        localStorage.setItem('parcela_admin_user', JSON.stringify(freshUser));
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, refreshToken, user: loggedInUser } = await authApi.login(email, password);

    if (!ALLOWED_ROLES.includes(loggedInUser.role)) {
      throw new Error('This account does not have dashboard access');
    }

    setTokens({ accessToken: token, refreshToken });
    localStorage.setItem('parcela_admin_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    clearTokens();
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem('parcela_admin_user', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
