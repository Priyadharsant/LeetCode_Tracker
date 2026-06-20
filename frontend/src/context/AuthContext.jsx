import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null means not decided. 
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('dsa_user');
    const storedGuest = localStorage.getItem('dsa_guest');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (storedGuest === 'true') {
      setIsGuest(true);
    }
    
    setLoading(false);
  }, []);

  const login = (username) => {
    const newUser = { username, token: 'mock-jwt-token-123' };
    setUser(newUser);
    setIsGuest(false);
    localStorage.setItem('dsa_user', JSON.stringify(newUser));
    localStorage.removeItem('dsa_guest');
  };

  const loginServer = async (username, password) => {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
      }
      const data = await res.json();
      const newUser = { username: data.username, token: data.token };
      setUser(newUser);
      setIsGuest(false);
      localStorage.setItem('dsa_user', JSON.stringify(newUser));
      localStorage.removeItem('dsa_guest');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const signupServer = async (username, password) => {
    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Signup failed');
      }
      const data = await res.json();
      const newUser = { username: data.username, token: data.token };
      setUser(newUser);
      setIsGuest(false);
      localStorage.setItem('dsa_user', JSON.stringify(newUser));
      localStorage.removeItem('dsa_guest');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    if (!user) return { success: false, error: 'Not logged in' };
    try {
      const res = await fetch(`${API_BASE}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, oldPassword, newPassword })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Password change failed');
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const loginAsGuest = () => {
    setIsGuest(true);
    setUser(null);
    localStorage.setItem('dsa_guest', 'true');
    localStorage.removeItem('dsa_user');
  };

  const logout = () => {
    // Clear session completely on logout
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('dsa_user');
    localStorage.removeItem('dsa_guest');
    // We intentionally keep 'dsa_progress_guest' so they don't lose guest progress if they log out
    // Redirect to landing page
    try {
      window.location.href = '/';
    } catch (e) { }
  };

  return (
    <AuthContext.Provider value={{ user, isGuest, loading, login, loginAsGuest, logout, loginServer, signupServer, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
