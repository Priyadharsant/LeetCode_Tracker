import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationManager from '../utils/NotificationManager';
import { useAuth } from '../context/AuthContext';

export default function NotificationToast() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();

  useEffect(() => {
    if (isGuest || !user) return;
    
    // Only show if notifications are supported, permission is not denied, user hasn't dismissed it recently, and hasn't saved a time yet
    const dismissed = sessionStorage.getItem(`dsa_notify_dismissed_${user.username}`);
    const timeSaved = localStorage.getItem(`dsa_reminder_time_${user.username}`);
    
    if (NotificationManager.isSupported && Notification.permission !== 'denied' && !dismissed && !timeSaved) {
      // Add a slight delay before popping up so it feels less aggressive
      const timer = setTimeout(() => {
        setShow(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, isGuest]);

  useEffect(() => {
    let hideTimer;
    if (show) {
      hideTimer = setTimeout(() => {
        setShow(false);
      }, 10000); // Auto close after 10 seconds
    }
    return () => clearTimeout(hideTimer);
  }, [show]);

  const handleDismiss = () => {
    setShow(false);
    if (user) {
      sessionStorage.setItem(`dsa_notify_dismissed_${user.username}`, 'true');
    }
  };

  const handleNotifyMe = () => {
    setShow(false);
    navigate('/account?requestNotify=true');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-6 right-6 z-50 glass-panel p-4 pr-12 rounded-2xl shadow-2xl border border-brand-500/30 max-w-sm flex items-start gap-4"
        >
          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-surface-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-brand-400" />
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-1">Never lose your streak!</h4>
            <p className="text-surface-400 text-xs mb-3 leading-relaxed">
              Enable daily reminders so you never forget to practice.
            </p>
            <button
              onClick={handleNotifyMe}
              className="bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold text-xs px-4 py-2 rounded-lg transition-colors"
            >
              Notify Me
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
