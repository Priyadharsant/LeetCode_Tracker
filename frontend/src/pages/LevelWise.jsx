import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { ExternalLink, CheckCircle, Circle, Trophy, PartyPopper, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import AchievementOverlay from '../components/AchievementOverlay';
import DSALoader from '../components/DSALoader';

export default function LevelWise() {
  const { data, loading, error, toggleProblemStatus } = useData();
  const [currentLevel, setCurrentLevel] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAchievement, setShowAchievement] = useState(false);

  useEffect(() => {
    if (data && data.length > 0 && currentLevel === null) {
      setCurrentLevel(data[0].level);
    }
  }, [data, currentLevel]);

  if (loading || !data || data.length === 0) {
    return <DSALoader message="Loading levels..." />;
  }
  if (error) {
    return <div className="p-12 text-center text-red-500">{error}</div>;
  }

  const levelObj = data.find(d => d.level === currentLevel) || data[0];
  const problems = levelObj.problems.map((p, i) => ({ ...p, originalIndex: i }));
  
  const filteredProblems = problems.filter(p => {
    if (filterStatus === 'solved') return p.solved;
    if (filterStatus === 'unsolved') return !p.solved;
    return true;
  }).sort((a, b) => {
    if (a.solved === b.solved) return 0;
    return a.solved ? 1 : -1;
  });

  const totalCurrent = problems.length;
  const solvedCurrent = problems.filter(p => p.solved).length;
  const isLevelComplete = totalCurrent > 0 && solvedCurrent === totalCurrent;

  const handleToggle = async (level, index, solved) => {
    // If we are marking as solved
    if (!solved) {
      const remainingUnsolved = problems.filter(p => !p.solved).length;
      if (remainingUnsolved === 1) {
        // This is the last problem!
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38ccb1', '#62c8ff', '#f6c85f']
        });
        setTimeout(() => setShowAchievement(true), 800);
      }
    }
    await toggleProblemStatus(level, index, solved);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12">
      <AnimatePresence>
        {showAchievement && (
          <AchievementOverlay
            level={currentLevel}
            onHide={() => setShowAchievement(false)}
          />
        )}
      </AnimatePresence>

      {/* Sub-Navigation (Levels) */}
      <nav className="flex flex-wrap justify-center gap-2 mb-10">
        {data.map(lvl => {
          const lSolved = lvl.problems.filter(p => p.solved).length;
          const lTotal = lvl.problems.length;
          const lComplete = lTotal > 0 && lSolved === lTotal;

          return (
            <button
              key={lvl.level}
              onClick={() => setCurrentLevel(lvl.level)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all relative flex items-center gap-2 ${
                currentLevel === lvl.level
                  ? 'bg-brand-500/15 text-brand-200 border border-brand-400/40 shadow-[0_0_22px_rgba(22,183,157,0.12)]'
                  : 'bg-white/[0.03] text-surface-400 border border-white/10 hover:bg-white/[0.06] hover:border-white/20'
              } ${lComplete && currentLevel !== lvl.level ? 'border-brand-500/30' : ''}`}
            >
              {lComplete && <CheckCircle className={`w-3.5 h-3.5 ${currentLevel === lvl.level ? 'text-brand-300' : 'text-brand-500/50'}`} />}
              Level {lvl.level}
            </button>
          );
        })}
      </nav>

      {/* Section Header & Filters */}
      <div className={`glass-panel p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-500 ${
        isLevelComplete ? 'border-brand-400/30 bg-brand-500/[0.02]' : ''
      }`}>
        <div className="flex items-center gap-4">
          {isLevelComplete && (
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 shrink-0 shadow-inner">
              <Trophy className="w-6 h-6" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white tracking-tight">Level {levelObj.level}</h2>
              {isLevelComplete && (
                <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-brand-500/10 text-brand-300 rounded ring-1 ring-brand-500/20">
                  <PartyPopper className="w-3 h-3" />
                  Mastered
                </span>
              )}
            </div>
            <p className="text-surface-400 text-sm max-w-md">{levelObj.goal}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
           <div className={`text-sm font-mono px-3 py-1.5 rounded-md border transition-colors ${
             isLevelComplete
              ? 'bg-brand-500/10 border-brand-500/20 text-brand-300'
              : 'bg-surface-950/70 border-white/10 text-surface-400'
           }`}>
             <span className={`${isLevelComplete ? 'text-brand-300' : 'text-brand-300'} font-bold`}>{solvedCurrent}</span> / {totalCurrent} Solved
           </div>
           <div className="flex gap-1 bg-surface-950/70 p-1 rounded-lg border border-white/10">
              {['all', 'solved', 'unsolved'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                    filterStatus === f 
                      ? 'bg-white/10 text-white' 
                      : 'text-surface-500 hover:text-surface-300'
                  }`}
                >
                  {f}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCurrent > 0 && (
        <div className="w-full bg-surface-900/80 rounded-full h-2 mb-8 overflow-hidden ring-1 ring-white/10">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(solvedCurrent / totalCurrent) * 100}%` }}
            className="premium-bar-gradient h-2 rounded-full transition-all duration-500 ease-out"
          />
        </div>
      )}

      {/* Problem List */}
      <div className="space-y-3 pb-20">
        <AnimatePresence>
          {filteredProblems.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-surface-600 italic"
            >
              No problems found for this filter.
            </motion.div>
          ) : (
            filteredProblems.map((p) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                key={`${levelObj.level}-${p.originalIndex}`} 
                className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                  p.solved 
                    ? 'bg-brand-500/[0.03] border-brand-500/10 opacity-90 shadow-sm'
                    : 'bg-surface-900/75 border-white/10 hover:border-brand-400/30 hover:bg-surface-900 hover:shadow-lg hover:shadow-black/20'
                }`}
              >
              <div className="flex items-center gap-4 flex-1">
                <button 
                  onClick={() => handleToggle(levelObj.level, p.originalIndex, p.solved)}
                  className="focus:outline-none flex-shrink-0 transition-transform active:scale-90"
                >
                  {p.solved ? (
                    <div className="relative group/check">
                      <div className="absolute inset-0 bg-brand-400 blur-md opacity-0 group-hover/check:opacity-40 transition-opacity"></div>
                      <CheckCircle className="w-6 h-6 text-brand-300 relative z-10 transition-transform group-hover/check:scale-110" />
                    </div>
                  ) : (
                    <div className="relative group/circle">
                       <Circle className="w-6 h-6 text-surface-600 group-hover:text-brand-300 transition-all group-hover:scale-110" />
                       <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-brand-400 opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100" />
                    </div>
                  )}
                </button>
                
                <div className="flex flex-col">
                  <a 
                    href={p.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`font-semibold tracking-tight transition-colors ${
                      p.solved 
                        ? 'text-surface-400 line-through decoration-brand-500/30'
                        : 'text-surface-200 group-hover:text-brand-300'
                    }`}
                  >
                    {p.name}
                  </a>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-surface-600 flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded">
                      <div className={`w-1 h-1 rounded-full ${p.solved ? 'bg-brand-400' : 'bg-surface-600'}`}></div>
                      {p.topic}
                    </span>
                    {p.solved && p.solvedAt && (
                      <span className="text-[10px] font-medium text-surface-600">
                        Solved {new Date(p.solvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <a 
                href={p.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-surface-600 hover:text-brand-300 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </motion.div>
          ))
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
