import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Loader2, CheckCircle2, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FeedbackModal({ isOpen, onClose }) {
  const { user } = useAuth();
  
  const [type, setType] = useState('Bug Report');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (isOpen) {
      setShouldRender(true);
      timeoutId = setTimeout(() => {
        setAnimate(true);
      }, 10);
    } else {
      setAnimate(false);
      timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          message,
          email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setStatus('success');
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred.');
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setMessage('');
    setType('Bug Report');
    setErrorMessage('');
    onClose();
  };

  if (!shouldRender) return null;

  return createPortal(
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div
        className={`relative w-full max-w-lg bg-surface-900 border border-surface-800 rounded-2xl shadow-2xl overflow-hidden z-10 transition-all duration-300 transform ${
          animate ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800 bg-surface-900/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/10 text-brand-500">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-white">Send Feedback</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {status === 'success' ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Thank you!</h4>
              <p className="text-surface-400">Your feedback has been sent directly to the developer.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-400 mb-2">
                  Feedback Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-shadow appearance-none"
                  disabled={status === 'loading'}
                >
                  <option>Bug Report</option>
                  <option>Feature Request</option>
                  <option>Content Issue</option>
                  <option>General Feedback</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-400 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-shadow min-h-[120px] resize-y"
                  required
                  disabled={status === 'loading'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-400 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="So we can follow up with you"
                  className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-shadow"
                  disabled={status === 'loading'}
                />
              </div>

              {status === 'error' && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-sm text-red-400">{errorMessage}</p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={status === 'loading' || !message.trim()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
