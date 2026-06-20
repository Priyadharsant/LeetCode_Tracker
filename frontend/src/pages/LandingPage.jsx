import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code, User, LogIn } from 'lucide-react';

export default function LandingPage() {
  const { user, isGuest, loginAsGuest, loginServer } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user || isGuest) {
    return <Navigate to="/dashboard" />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const res = await loginServer(username, password);
    if (!res.success) return setError(res.error || 'Login failed');
    navigate('/dashboard');
  };

  const handleGuest = () => {
    loginAsGuest();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel max-w-md w-full p-8"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-brand-500/10 rounded-xl ring-1 ring-brand-400/20">
            <Code className="w-12 h-12 text-brand-300" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-accent-sky to-accent-amber mb-2">
          DSA Journey
        </h1>
        <p className="text-center text-surface-400 mb-8 text-sm">
          Master Data Structures and Algorithms level by level.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-surface-400 mb-1">Username</label>
            <input
              id="landing-username"
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-surface-950/70 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-400 mb-1">Password</label>
            <input
              id="landing-password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface-950/70 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold py-2.5 rounded-lg transition-colors mt-2"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        </form>
        
        <div className="text-center mb-6">
          <p className="text-surface-500 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-300 hover:text-brand-200 font-medium">
              Sign up here
            </Link>
          </p>
        </div>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-surface-500 text-sm">Or</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button
          onClick={handleGuest}
          className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-surface-100 font-semibold py-2.5 rounded-lg transition-colors ring-1 ring-white/10"
        >
          <User className="w-4 h-4" />
          Continue as Guest
        </button>
        <p className="text-center text-surface-600 mt-4 text-xs">
          Guest progress is saved to your browser's local storage.
        </p>
      </motion.div>
    </div>
  );
}
