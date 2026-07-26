import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { CodeXml, UserPlus, Eye, EyeOff } from 'lucide-react';

export default function Signup() {
  const { user, isGuest, signupServer } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user || isGuest) {
    return <Navigate to="/dashboard" />;
  }

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError('Username must be 3-20 characters long and contain only letters, numbers, and underscores.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const res = await signupServer(username, password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Signup failed');
      return;
    }

    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="glass-panel max-w-md w-full p-8 relative z-10">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-brand-500/10 rounded-xl ring-1 ring-brand-400/20">
            <CodeXml className="w-12 h-12 text-brand-400" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-accent-sky to-accent-amber mb-2">
          Create Account
        </h1>
        <p className="text-center text-surface-400 mb-8 text-sm">
          Join us and track your progress on DSA Tracker.
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-surface-950/70 border border-white/10 rounded-lg px-4 py-2.5 pr-10 text-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all"
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-500 hover:text-brand-400 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-400 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-surface-950/70 border border-white/10 rounded-lg px-4 py-2.5 pr-10 text-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-500 hover:text-brand-400 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold py-2.5 rounded-lg transition-colors mt-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-surface-950/30 border-t-surface-950 rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Sign Up
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-surface-500 text-sm">
            Already have an account?{' '}
            <Link to="/" className="text-brand-400 hover:text-brand-300 font-bold transition-all">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
