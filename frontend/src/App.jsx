import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Roadmap from './pages/Roadmap';
import Practice from './pages/Practice';
import Account from './pages/Account';
import { useAuth } from './context/AuthContext';
import DSALoader from './components/DSALoader';
import NotificationManager from './utils/NotificationManager';

function ProtectedRoute({ children }) {
  const { user, isGuest, loading } = useAuth();
  if (loading) return <DSALoader message="Authenticating..." />;
  if (!user && !isGuest) return <Navigate to="/" />;
  return children;
}

function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const { user, isGuest } = useAuth();
  
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <div className="min-h-screen text-white selection:bg-brand-500/30 relative">
      <div className="grid-overlay"></div>
      {isOffline && (
        <div className="bg-red-500/90 text-white text-center py-1.5 text-sm font-medium fixed top-0 w-full z-[100] backdrop-blur-sm shadow-md">
          ⚠️ You are offline. Some features may not be available.
        </div>
      )}
      <div className={isOffline ? "pt-8" : ""}>
        <Navbar isOffline={isOffline} />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
            <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
