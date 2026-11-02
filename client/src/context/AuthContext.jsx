import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import authService from '../services/auth.service';
import {
  refreshSession,
  setAccessToken,
  setRefreshHandler
} from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    setRefreshHandler((nextUser) => {
      setUser(nextUser);
      if (!nextUser) setAccessToken(null);
    });

    let active = true;

    const restore = async () => {
      try {
        const data = await refreshSession();
        if (!active) return;
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setBooting(false);
      }
    };

    restore();

    const handleExpired = () => setUser(null);
    window.addEventListener('govvoice:session-expired', handleExpired);

    return () => {
      active = false;
      setRefreshHandler(null);
      window.removeEventListener('govvoice:session-expired', handleExpired);
    };
  }, []);

  const login = useCallback(async (payload) => {
    const data = await authService.login(payload);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Clear local state even if the network request fails.
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const updated = await authService.updateProfile(payload);
    setUser(updated);
    return updated;
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await authService.me();
    setUser(fresh);
    return fresh;
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      updateProfile,
      refreshUser
    }),
    [user, booting, login, register, logout, updateProfile, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};

export default AuthContext;
