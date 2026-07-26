import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useSearchParams } from 'react-router-dom';
import { User, LogOut, Shield, Activity, Lock, Clock, ExternalLink, KeyRound, ChevronDown, ChevronUp, Bell, BellRing, BellOff, Save, Eye, EyeOff } from 'lucide-react';
import Heatmap from '../components/Heatmap';
import NotificationManager from '../utils/NotificationManager';
import ModernTimePicker from '../components/ModernTimePicker';
import FeedbackModal from '../components/FeedbackModal';

export default function Account() {
  const { user, isGuest, logout, changePassword } = useAuth();
  const { data } = useData();
  const [searchParams, setSearchParams] = useSearchParams();

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwdStatus, setPwdStatus] = useState({ loading: false, error: null, success: false });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Notifications state
  const [notifPermission, setNotifPermission] = useState('default');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [timeSaved, setTimeSaved] = useState(false);
  
  useEffect(() => {
    if (NotificationManager.isSupported) {
      setNotifPermission(NotificationManager.permission);
      NotificationManager.getSubscription().then(sub => setPushEnabled(!!sub));
    } else {
      setNotifPermission('unsupported');
    }
    
    const savedTime = localStorage.getItem(`dsa_reminder_time_${user?.username}`);
    if (savedTime) {
      setReminderTime(savedTime);
    }

    // Auto-request permission if navigating from the Toast
    if (searchParams.get('requestNotify') === 'true') {
      // Remove query param to avoid re-triggering on refresh
      setSearchParams({});
      if (NotificationManager.isSupported && NotificationManager.permission === 'default') {
        handleRequestNotification();
      }
    }
  }, [searchParams, setSearchParams, user]);

  const syncSubscriptionToBackend = async (time) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '/api';
      
      const res = await fetch(`${API_BASE}/notifications/vapidPublicKey`);
      const { publicKey } = await res.json();
      
      const subscription = await NotificationManager.subscribeToPush(publicKey);
      if (!subscription) {
        console.error(`[Push] Failed to get subscription object from browser!`);
        return;
      }

      await fetch(`${API_BASE}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Username': user?.username || ''
        },
        body: JSON.stringify({
          subscription,
          reminderTime: time
        })
      });
      setPushEnabled(true);
    } catch (err) {
      console.error('[Push] Critical error during sync:', err);
    }
  };

  const disablePush = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '/api';
      const oldSub = await NotificationManager.unsubscribeFromPush();
      if (oldSub) {
        await fetch(`${API_BASE}/notifications/unsubscribe`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Username': user?.username || ''
          },
          body: JSON.stringify({ endpoint: oldSub.endpoint })
        });
      }
      localStorage.removeItem(`dsa_reminder_time_${user?.username}`);
      setPushEnabled(false);
      setTimeSaved(false);
    } catch (err) {
      console.error('Error disabling push:', err);
    }
  };

  const handleRequestNotification = async () => {
    const perm = await NotificationManager.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      await syncSubscriptionToBackend(reminderTime);
    }
  };

  const handleSaveTime = async () => {
    if (user) {
      localStorage.setItem(`dsa_reminder_time_${user.username}`, reminderTime);
    }
    await syncSubscriptionToBackend(reminderTime);
    setTimeSaved(true);
    setTimeout(() => setTimeSaved(false), 3000);
  };

  // Process data for Stats and Recent Problems
  const { totalProblems, solvedProblems, recentProblems, solvedDates } = useMemo(() => {
    let total = 0;
    let solved = 0;
    const allSolved = [];
    const dates = [];

    if (data) {
      data.forEach(level => {
        total += level.total;
        level.problems.forEach(p => {
          if (p.solved) {
            solved++;
            allSolved.push(p);
            
            if (p.solvedAt) {
              dates.push(p.solvedAt);
            }
          }
        });
      });
    }

    // Sort by solvedAt descending
    allSolved.sort((a, b) => {
      const timeA = a.solvedAt ? new Date(a.solvedAt).getTime() : 0;
      const timeB = b.solvedAt ? new Date(b.solvedAt).getTime() : 0;
      return timeB - timeA;
    });

    return {
      totalProblems: total,
      solvedProblems: solved,
      recentProblems: allSolved.slice(0, 5),
      solvedDates: dates
    };
  }, [data]);

  const progressPercent = totalProblems === 0 ? 0 : (solvedProblems / totalProblems) * 100;

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      setPwdStatus({ loading: false, error: "Password must be at least 8 characters long.", success: false });
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setPwdStatus({ loading: false, error: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.", success: false });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdStatus({ loading: false, error: "New passwords do not match", success: false });
      return;
    }
    setPwdStatus({ loading: true, error: null, success: false });
    const res = await changePassword(oldPassword, newPassword);
    if (res.success) {
      setPwdStatus({ loading: false, error: null, success: true });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdStatus(prev => ({ ...prev, success: false })), 3000);
    } else {
      setPwdStatus({ loading: false, error: res.error, success: false });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 pb-6">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-300 mb-4">
          <Shield className="w-3.5 h-3.5" />
          Account Settings
        </div>
        <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
        <p className="text-surface-400">Manage your account, view your activity heatmap, and track recent progress.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Account Details */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* User Card */}
          <div className="glass-panel p-8 flex flex-col items-center text-center relative overflow-hidden h-fit">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="w-24 h-24 rounded-full bg-surface-800 border-4 border-brand-500/20 flex items-center justify-center mb-6 relative z-10 shadow-lg">
              <User className="w-10 h-10 text-brand-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 relative z-10">
              {isGuest ? 'Guest User' : user?.username}
            </h2>
            <p className="text-sm text-surface-500 uppercase tracking-widest font-mono mb-8 relative z-10">
              {isGuest ? 'Local Session' : 'Verified Member'}
            </p>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 ring-1 ring-red-500/20 transition-all relative z-10"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>

          {/* Notifications Settings */}
          <div className="glass-panel p-8 flex flex-col h-fit">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-300" />
              Notifications
            </h3>
            
            {isGuest ? (
              <div className="text-center text-surface-500 py-8 flex-grow flex items-center justify-center bg-surface-950/30 rounded-xl border border-white/5 flex-col">
                <BellOff className="w-8 h-8 text-surface-600 mb-3" />
                <p className="text-sm font-medium">Guest accounts cannot enable push notifications.</p>
                <p className="text-xs mt-1">Please create a real account to get daily reminders.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-surface-900 border border-white/10 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Push Notifications</h4>
                    <p className="text-xs text-surface-400">Receive reminders for daily practice.</p>
                  </div>
                  
                  {pushEnabled ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 text-brand-400 rounded-lg border border-brand-500/20">
                          <Bell className="w-4 h-4" />
                          <span className="font-bold text-sm">Enabled</span>
                        </div>
                        <button
                          onClick={disablePush}
                          title="Remove from this device"
                          className="p-1.5 text-surface-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                        >
                          <BellOff className="w-4 h-4" />
                        </button>
                      </div>
                    ) : notifPermission === 'denied' ? (
                    <div className="flex items-center gap-2 text-red-400 text-sm font-bold px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
                      <BellOff className="w-4 h-4" />
                      Blocked
                    </div>
                  ) : notifPermission === 'unsupported' ? (
                    <div className="text-surface-500 text-xs font-medium">
                      Unsupported
                    </div>
                  ) : (
                    <button
                      onClick={handleRequestNotification}
                      className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold rounded-lg text-sm shadow-lg shadow-brand-500/20"
                    >
                      Enable
                    </button>
                  )}
                </div>

                {notifPermission === 'granted' && (
                  <div className="p-4 bg-surface-900 border border-white/10 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-white">Daily Reminder Time</h4>
                    </div>
                    <div className="flex flex-col gap-3">
                      <ModernTimePicker 
                        value={reminderTime} 
                        onChange={(newTime) => setReminderTime(newTime)} 
                      />
                      <button
                        onClick={handleSaveTime}
                        className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center gap-2 border border-white/5 shadow-md"
                      >
                        {timeSaved ? <span className="text-brand-400 font-bold text-sm">Saved!</span> : <><Save className="w-4 h-4" /><span className="text-sm font-bold">Save Time</span></>}
                      </button>
                    </div>
                  </div>
                )}

                {notifPermission === 'denied' && !window.isSecureContext && (
                  <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-xs text-amber-400 text-center font-medium">
                      Push notifications require a secure connection. Please access this site via <strong>localhost</strong> or <strong>HTTPS</strong> to enable them.
                    </p>
                  </div>
                )}
                {notifPermission === 'denied' && window.isSecureContext && (
                  <p className="text-xs text-surface-500 mt-2 px-1 text-center">
                    You blocked notifications. Please click the lock icon in your browser's address bar to enable them.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Change Password Form */}
          <div className="glass-panel p-8 flex flex-col h-fit">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-brand-300" />
              Security Settings
            </h3>

            {isGuest ? (
              <div className="text-center text-surface-500 py-8 flex-grow flex items-center justify-center bg-surface-950/30 rounded-xl border border-white/5 flex-col">
                <Lock className="w-8 h-8 text-surface-600 mb-3" />
                <p className="text-sm font-medium">Guest accounts cannot change passwords.</p>
                <p className="text-xs mt-1">Please create a real account to secure your data.</p>
              </div>
            ) : (
              <div className="flex-grow flex flex-col">
                <button 
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="w-full flex items-center justify-between p-4 bg-surface-900 border border-white/10 rounded-xl hover:bg-surface-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-300">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-white text-sm">Update Password</span>
                  </div>
                  {showPasswordForm ? <ChevronUp className="w-5 h-5 text-surface-400" /> : <ChevronDown className="w-5 h-5 text-surface-400" />}
                </button>

                {showPasswordForm && (
                  <form 
                    className="overflow-hidden"
                    onSubmit={handlePasswordChange} 
                  >
                    <div className="pt-6 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Old Password</label>
                        <div className="relative">
                          <input
                            type={showOldPassword ? "text" : "password"}
                            required
                            value={oldPassword}
                            onChange={e => setOldPassword(e.target.value)}
                            className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-500 hover:text-brand-400"
                          >
                            {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-500 hover:text-brand-400"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-500 hover:text-brand-400"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 space-y-4">
                        {pwdStatus.error && (
                          <div className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                            {pwdStatus.error}
                          </div>
                        )}

                        {pwdStatus.success && (
                          <div className="text-xs font-bold text-brand-300 bg-brand-500/10 border border-brand-500/20 p-3 rounded-lg">
                            Password updated successfully!
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={pwdStatus.loading}
                          className="w-full bg-white text-surface-950 font-bold py-3 px-4 rounded-xl hover:bg-brand-300 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {pwdStatus.loading ? (
                            <div className="w-5 h-5 border-2 border-surface-950/30 border-t-surface-950 rounded-full animate-spin" />
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              Update Password
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Progress */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Stats Card & Heatmap */}
          <div className="glass-panel p-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-brand-400" />
                  Overall Progress
                </h3>
                <div className="text-surface-400 text-sm font-medium bg-surface-900/50 px-3 py-1.5 rounded-lg border border-white/5">
                  <span className="text-white font-bold">{solvedProblems}</span> / {totalProblems} Solved
                </div>
              </div>
              
              <div className="space-y-3 bg-surface-950/50 p-5 rounded-2xl border border-white/5 mb-8">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-surface-400 uppercase tracking-widest text-xs font-bold">Mastery Track</span>
                  <span className="text-brand-300 font-mono">{progressPercent.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-surface-900 rounded-full overflow-hidden ring-1 ring-white/10 shadow-inner">
                  <div 
                    style={{ width: `${progressPercent}%` }}
                    className="h-full premium-bar-gradient rounded-full"
                  />
                </div>
              </div>

              {/* Heatmap Section */}
              <div className="mt-8">
                <Heatmap data={solvedDates} days={180} />
              </div>
            </div>
          </div>

          {/* Recent Problems Feed */}
          <div className="glass-panel p-8 flex flex-col h-full">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent-amber" />
              Recent Solves
            </h3>
            
            {recentProblems.length === 0 ? (
              <div className="text-center text-surface-500 py-8 flex-grow flex items-center justify-center bg-surface-950/30 rounded-xl border border-white/5">
                No problems solved yet. Time to get started!
              </div>
            ) : (
              <div className="space-y-3 flex-grow">
                {recentProblems.map((p, idx) => {
                  const dateStr = p.solvedAt ? new Date(p.solvedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date';
                  return (
                    <div key={`${p.name}-${idx}`} className="flex items-center justify-between p-4 bg-surface-900/40 border border-white/5 rounded-xl hover:bg-surface-800/40 transition-colors">
                      <div>
                        <a href={p.link} target="_blank" rel="noreferrer" className="text-sm font-bold text-white hover:text-brand-300 flex items-center gap-2 mb-1">
                          {p.name}
                          <ExternalLink className="w-3 h-3 text-surface-500" />
                        </a>
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold">
                          <span className="text-surface-400">{p.topic}</span>
                          <span className="w-1 h-1 rounded-full bg-surface-600" />
                          <span className="text-accent-sky">{dateStr}</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
                        <div className="w-2 h-2 rounded-full bg-brand-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="w-full mt-16 pt-8 border-t border-white/5 flex flex-col items-center gap-4 text-xs text-surface-500">
        {/* Footer Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-medium">
          <a 
            href="https://priyan.online" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-surface-400 hover:text-brand-400 transition-colors"
          >
            Portfolio
          </a>
          <span className="w-1 h-1 rounded-full bg-surface-800" />
          <a 
            href="mailto:contact@priyan.online" 
            className="text-surface-400 hover:text-brand-400 transition-colors"
          >
            Contact
          </a>
          <span className="w-1 h-1 rounded-full bg-surface-800" />
          <button 
            onClick={() => setIsFeedbackOpen(true)}
            className="text-surface-400 hover:text-brand-400 transition-colors"
          >
            Feedback
          </button>
        </div>

        {/* Footer Credit & Copyright */}
        <div className="text-center text-[11px] text-surface-600">
          <span>&copy; {new Date().getFullYear()} DSA Tracker. Created by </span>
          <a 
            href="https://priyan.online" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-brand-400 hover:text-brand-300 font-bold transition-all hover:underline"
          >
            Priyan
          </a>
        </div>
      </footer>
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </div>
  );
}
