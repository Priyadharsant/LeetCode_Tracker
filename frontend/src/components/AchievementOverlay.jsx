import { motion } from 'framer-motion';
import { Trophy, Sparkles, ArrowRight, Share2 } from 'lucide-react';

export default function AchievementOverlay({ level, onHide }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-950/90 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 10, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="relative max-w-md w-full glass-panel p-8 text-center overflow-hidden"
      >
        {/* Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-500/20 blur-[100px] -z-10 rounded-full"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent-amber/10 blur-[80px] -z-10 rounded-full"></div>

        <div className="relative inline-flex mb-6">
          <div className="absolute inset-0 bg-brand-500 blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shadow-2xl shadow-brand-500/40">
            <Trophy className="w-10 h-10" />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-2 -right-2 text-accent-amber"
          >
            <Sparkles className="w-6 h-6" />
          </motion.div>
        </div>

        <h2 className="text-4xl font-black text-white mb-2 tracking-tight">LEVEL MASTERED</h2>
        <p className="text-brand-300 font-bold text-lg mb-6">Level {level} Accomplished</p>

        <div className="space-y-4 mb-8">
          <p className="text-surface-400 leading-relaxed">
            Congratulations! You've successfully conquered every problem in Level {level}.
            Your systematic approach is paying off.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[10px] text-surface-500 uppercase font-bold tracking-wider mb-1">Status</div>
            <div className="text-emerald-400 font-bold">100% Correct</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[10px] text-surface-500 uppercase font-bold tracking-wider mb-1">Badge</div>
            <div className="text-accent-amber font-bold">L{level} Pro</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onHide}
            className="w-full py-4 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 flex items-center justify-center gap-2 group"
          >
            Continue Journey
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-surface-300 font-medium rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Achievement
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
