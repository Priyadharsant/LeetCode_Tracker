import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Roadmap from './pages/Roadmap';
import Practice from './pages/Practice';
import Patterns from './pages/Patterns';
import Account from './pages/Account';
import Revise from './pages/Revise';
import CheatSheet from './pages/CheatSheet';
import Bookmarks from './pages/Bookmarks';
import { useAuth } from './context/AuthContext';
import DSALoader from './components/DSALoader';
import FeedbackModal from './components/FeedbackModal';

function ProtectedRoute({ children }) {
  const { user, isGuest, loading } = useAuth();
  if (loading) return <DSALoader message="Authenticating..." />;
  if (!user && !isGuest) return <Navigate to="/" />;
  return children;
}

function App() {
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

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
    <div className="min-h-screen text-white selection:bg-brand-500/30 relative pb-20">
      <div className="grid-overlay"></div>
      {isOffline && (
        <div className="bg-red-500/90 text-white text-center py-1.5 text-sm font-medium fixed top-0 w-full z-[100] backdrop-blur-sm shadow-md">
          ⚠️ You are offline. Some features may not be available.
        </div>
      )}
      <div className={isOffline ? "pt-8" : ""}>
        <Navbar isOffline={isOffline} />
        <main key={location.pathname} className="animate-page-enter">
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
            <Route path="/patterns" element={<ProtectedRoute><Patterns /></ProtectedRoute>} />
            <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
            <Route path="/revise" element={<ProtectedRoute><Revise /></ProtectedRoute>} />
            <Route path="/do-later" element={<Navigate to="/bookmarks" replace />} />
            <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
            <Route path="/cheatsheet" element={<ProtectedRoute><CheatSheet /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>

      {(user || isGuest) && (
        <>
          <button 
            onClick={() => setIsFeedbackOpen(true)}
            className="fixed bottom-6 right-6 z-40 p-3 bg-surface-800 border border-surface-700 text-surface-400 hover:bg-brand-500 hover:text-white hover:border-brand-500 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center group"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="absolute right-full mr-4 px-2 py-1 bg-surface-800 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-surface-700">
              Send Feedback
            </span>
          </button>
          <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
        </>
      )}
    </div>
  );
}

export default App;
