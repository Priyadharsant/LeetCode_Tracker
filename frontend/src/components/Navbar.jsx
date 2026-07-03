import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CodeXml, LayoutDashboard, Layers3, User, Map, BookOpen, Terminal, LibraryBig, Bookmark } from 'lucide-react';

export default function Navbar({ isOffline }) {
  const { user, isGuest } = useAuth();
  const location = useLocation();

  if (!user && !isGuest) return null;

  const isActive = (path) => location.pathname === path;
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/roadmap', label: 'Roadmap', icon: Map },
    { to: '/patterns', label: 'Patterns', icon: LibraryBig },
    { to: '/practice', label: 'Practice', icon: Layers3 },
    { to: '/revise', label: 'Revise', icon: BookOpen },
    { to: '/do-later', label: 'Do Later', icon: Bookmark },
    { to: '/cheatsheet', label: 'CheatSheet', icon: Terminal },
  ];

  return (
    <nav className={`sticky z-40 transition-all ${isOffline ? 'top-8' : 'top-0'} w-full border-b border-white/10 bg-surface-900/95 backdrop-blur-2xl shadow-xl shadow-black/40`}>
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-500 via-accent-sky to-accent-amber opacity-80" />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-[72px] gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-white/5 ring-1 ring-white/10 group-hover:bg-brand-500/10 group-hover:ring-brand-400/30 transition-colors">
              <CodeXml className="w-5 h-5 text-brand-400" />
            </div>
            <div className="leading-tight">
              <span className="block text-sm font-bold text-white tracking-tight sm:text-base">DSA Tracker</span>
            </div>
          </Link>
          <div className="flex items-center gap-1 overflow-x-auto">
            {/* Desktop Menu */}
            <div className="hidden items-center gap-6 md:flex mr-6">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link 
                  key={to} 
                  to={to} 
                  className={`group relative flex items-center gap-2 py-5 text-sm font-medium transition-colors ${
                    isActive(to) ? 'text-white' : 'text-surface-400 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive(to) ? 'text-brand-400' : 'text-surface-500 group-hover:text-brand-400/70'}`} />
                  {label}
                  {isActive(to) && (
                    <div 
                      className="absolute bottom-2 left-0 right-0 h-[3px] bg-brand-400 rounded-full shadow-[0_-2px_10px_rgba(56,204,177,0.5)]"
                    />
                  )}
                </Link>
              ))}
            </div>
            
            {/* Mobile Menu */}
            <div className="flex items-center gap-2 md:hidden mr-4">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link 
                  key={to} 
                  to={to} 
                  className={`p-2 rounded-lg transition-colors ${
                    isActive(to) ? 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30' : 'text-surface-400 hover:bg-white/5 hover:text-white'
                  }`} 
                  title={label}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
            
            <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block"></div>

            <Link 
              to="/account"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/account') 
                  ? 'bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20' 
                  : 'text-surface-400 hover:bg-white/5 hover:text-white'
              }`}
              title="Account"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{isGuest ? 'Guest' : user?.username}</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
