import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code, UserPlus } from 'lucide-react';

export default function Signup() {
  const { user, isGuest, signupServer } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (user || isGuest) {
    return <Navigate to="/dashboard" />;
  }

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const res = await signupServer(username, password);
    if (!res.success) {
      setError(res.error || 'Signup failed');
      return;
    }
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
          Create Account
        </h1>
        <p className="text-center text-surface-400 mb-8 text-sm">
          Join us and track your DSA journey.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-surface-400 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-surface-950/70 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all"
              placeholder="Choose a username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface-950/70 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all"
              placeholder="Create a password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-400 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-surface-950/70 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all"
              placeholder="Confirm your password"
            />
          </div>
          
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold py-2.5 rounded-lg transition-colors mt-2"
          >
            <UserPlus className="w-4 h-4" />
            Sign Up
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-surface-500 text-sm">
            Already have an account?{' '}
            <Link to="/" className="text-brand-300 hover:text-brand-200 font-medium">
              Log in here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
