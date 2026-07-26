import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CodeXml, LayoutDashboard, Layers3, User, Map, BookOpen, Terminal, LibraryBig, Bookmark, Menu, X } from 'lucide-react';

export default function Navbar({ isOffline }) {
  const { user, isGuest } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  if (!user && !isGuest) return null;

  const isActive = (path) => location.pathname === path;
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/roadmap', label: 'Roadmap', icon: Map },
    { to: '/patterns', label: 'Patterns', icon: LibraryBig },
    { to: '/practice', label: 'Practice', icon: Layers3 },
    { to: '/revise', label: 'Revise', icon: BookOpen },
    { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
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

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            <div className="flex items-center gap-6">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`group relative flex items-center gap-2 py-5 text-sm font-medium transition-colors ${isActive(to) ? 'text-white' : 'text-surface-400 hover:text-white'
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

            <div className="h-6 w-px bg-white/10 mx-4"></div>

            <Link
              to="/account"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/account')
                  ? 'bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20'
                  : 'text-surface-400 hover:bg-white/5 hover:text-white'
                }`}
              title="Account"
            >
              <User className="w-4 h-4" />
              <span>{isGuest ? 'Guest' : user?.username}</span>
            </Link>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              to="/account"
              className={`p-2 rounded-lg text-surface-400 hover:bg-white/5 hover:text-white transition-colors ${isActive('/account') ? 'text-brand-300 bg-brand-500/10 ring-1 ring-brand-500/20' : ''
                }`}
              title="Account"
            >
              <User className="w-5 h-5" />
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-surface-400 hover:bg-white/5 hover:text-white transition-colors focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-surface-900/98 backdrop-blur-2xl px-4 py-3 space-y-1 shadow-2xl animate-page-enter">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive(to)
                  ? 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30'
                  : 'text-surface-400 hover:bg-white/5 hover:text-white'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive(to) ? 'text-brand-400' : 'text-surface-500'}`} />
              <span>{label}</span>
            </Link>
          ))}
          <div className="border-t border-white/5 pt-4 text-center text-xs text-surface-500">
            Created by{' '}
            <a
              href="https://priyan.online"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 font-semibold transition-all hover:underline"
            >
              Priyan
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
