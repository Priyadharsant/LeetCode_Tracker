import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MessageSquare, BookOpen, ChevronLeft } from 'lucide-react';
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
import YoutubeIcon from './components/YoutubeIcon';
import NotificationToast from './components/NotificationToast';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { user, isGuest } = useAuth();

  const handleMouseEnter = () => {
    if (window.matchMedia('(hover: hover)').matches) {
      setIsMenuOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.matchMedia('(hover: hover)').matches) {
      setIsMenuOpen(false);
    }
  };

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
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="fixed bottom-6 right-6 z-40 flex flex-row-reverse items-center gap-3"
        >
          {/* Main Trigger Button: Left Chevron */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-3 border rounded-full shadow-lg transition-all duration-300 flex items-center justify-center group/trigger relative ${isMenuOpen
                ? 'bg-brand-500 text-white border-brand-500 scale-105'
                : 'bg-surface-800 border-surface-700 text-brand-400 hover:bg-brand-500 hover:text-white hover:border-brand-500'
              }`}
          >
            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
            {!isMenuOpen && (
              <span className="absolute bottom-full mb-2 right-0 px-2 py-1 bg-surface-800 text-white text-xs font-medium rounded opacity-0 group-hover/trigger:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-surface-700 shadow-md">
                Resources & Help
              </span>
            )}
          </button>

          {/* Expanded Menu Items: Horizontal Row extending to the left */}
          <div className={`flex flex-row-reverse items-center gap-3 transition-all duration-300 ${isMenuOpen ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none'
            }`}>
            {/* takeUforward YouTube */}
            <a
              href="https://www.youtube.com/@takeUforward/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="p-3 bg-surface-800 border border-surface-700 text-brand-400 hover:bg-brand-500 hover:text-white hover:border-brand-500 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center group relative animate-pulse-subtle"
            >
              <YoutubeIcon className="w-5 h-5" />
              <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-800 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-surface-700 shadow-md">
                takeUforward YouTube
              </span>
            </a>

            {/* Striver's A2Z Sheet */}
            <a
              href="https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="p-3 bg-surface-800 border border-surface-700 text-brand-400 hover:bg-brand-500 hover:text-white hover:border-brand-500 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center group relative"
            >
              <BookOpen className="w-5 h-5" />
              <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-800 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-surface-700 shadow-md">
                Striver's A2Z Sheet
              </span>
            </a>

            {/* Send Feedback */}
            <button
              onClick={() => {
                setIsFeedbackOpen(true);
                setIsMenuOpen(false);
              }}
              className="p-3 bg-surface-800 border border-surface-700 text-surface-400 hover:bg-brand-500 hover:text-white hover:border-brand-500 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center group relative"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-800 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-surface-700 shadow-md">
                Send Feedback
              </span>
            </button>
          </div>
          <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
        </div>
      )}
      <NotificationToast />
    </div>
  );
}

export default App;
