import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('tet_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const persist = (token, userObj) => {
    localStorage.setItem('tet_token', token);
    localStorage.setItem('tet_user', JSON.stringify(userObj));
    setUser(userObj);
  };

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosClient.post('/auth/login', { email, password });
      persist(data.token, data.user);
      return data.user;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosClient.post('/auth/register', payload);
      persist(data.token, data.user);
      return data.user;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tet_token');
    localStorage.removeItem('tet_user');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, login, register, logout }),
    [user, loading, error, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
