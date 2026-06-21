import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ExternalLink, CheckCircle, Circle, Trophy, PartyPopper, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import AchievementOverlay from '../components/AchievementOverlay';
import DSALoader from '../components/DSALoader';
import MonthCalendar from '../components/MonthCalendar';

export default function Practice() {
  const [searchParams] = useSearchParams();
  const phaseParam = searchParams.get('phase');
  const targetPhase = phaseParam ? parseInt(phaseParam, 10) : null;

  const { data, loading, error, toggleProblemStatus } = useData();
  const [currentLevel, setCurrentLevel] = useState(null);
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showAchievement, setShowAchievement] = useState(false);

  useEffect(() => {
    if (data && data.length > 0) {
      if (targetPhase && data.some(d => d.level === targetPhase)) {
        setCurrentLevel(targetPhase);
        setExpandedLevel(targetPhase);
      } else if (currentLevel === null) {
        setCurrentLevel(data[0].level);
        setExpandedLevel(data[0].level);
      }
    }
  }, [data, targetPhase]);

  if (loading || !data || data.length === 0) {
    return <DSALoader message="Loading Practice Area..." />;
  }
  if (error) {
    return <div className="p-12 text-center text-red-500">{error}</div>;
  }

  const levelObj = data.find(d => d.level === currentLevel) || data[0];
  const problems = levelObj.problems.map((p, i) => ({ ...p, originalIndex: i }));
  
  const filteredProblems = problems.filter(p => {
    if (filterStatus === 'solved' && !p.solved) return false;
    if (filterStatus === 'unsolved' && p.solved) return false;
    if (selectedCompany && (!p.companies || !p.companies.includes(selectedCompany))) return false;
    return true;
  }).sort((a, b) => {
    if (a.solved === b.solved) return 0;
    return a.solved ? 1 : -1;
  });

  const totalCurrent = problems.length;
  const solvedCurrent = problems.filter(p => p.solved).length;
  const isLevelComplete = totalCurrent > 0 && solvedCurrent === totalCurrent;

  const handleToggle = async (level, index, solved) => {
    if (!solved) {
      const remainingUnsolved = problems.filter(p => !p.solved).length;
      if (remainingUnsolved === 1) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffa116', '#e69013', '#ffffff']
        });
        setTimeout(() => setShowAchievement(true), 800);
      }
    }
    await toggleProblemStatus(level, index, solved);
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      <AnimatePresence>
        {showAchievement && (
          <AchievementOverlay
            level={currentLevel}
            onHide={() => setShowAchievement(false)}
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar: Accordion */}
        <div className="lg:col-span-3 space-y-3">
          <h2 className="text-lg font-bold text-white mb-4 pl-1">All Levels</h2>
          {data.map(lvl => {
            const lSolved = lvl.problems.filter(p => p.solved).length;
            const lTotal = lvl.problems.length;
            const lComplete = lTotal > 0 && lSolved === lTotal;
            const isExpanded = expandedLevel === lvl.level;
            const isActive = currentLevel === lvl.level;

            return (
              <div key={lvl.level} className={`glass-panel overflow-hidden transition-all duration-300 ${isActive ? 'border-brand-500 shadow-[0_0_15px_rgba(255,161,22,0.15)]' : ''}`}>
                <button
                  onClick={() => {
                    setExpandedLevel(isExpanded ? null : lvl.level);
                    setCurrentLevel(lvl.level);
                  }}
                  className="w-full p-4 flex items-center justify-between bg-surface-800 hover:bg-surface-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {lComplete ? <CheckCircle className="w-5 h-5 text-brand-500" /> : <div className="w-5 h-5 rounded-full border-2 border-surface-500" />}
                    <span className={`font-semibold ${isActive ? 'text-brand-500' : 'text-surface-200'}`}>Phase {lvl.level}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-surface-500" /> : <ChevronDown className="w-5 h-5 text-surface-500" />}
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-surface-900 border-t border-surface-700"
                    >
                      <div className="p-4 space-y-4">
                        <div>
                          <p className="text-sm text-surface-300 font-medium">{lvl.goal}</p>
                          <div className="mt-2 text-xs text-surface-500">{lSolved} / {lTotal} Solved</div>
                        </div>
                        <button
                          onClick={() => setCurrentLevel(lvl.level)}
                          className={`w-full py-2 rounded text-sm font-bold transition-colors ${isActive ? 'bg-brand-500 text-surface-900' : 'bg-surface-800 text-brand-500 hover:bg-surface-700 border border-brand-500'}`}
                        >
                          {isActive ? 'Current View' : 'All Problems'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Center Panel: Problem List */}
        <div className="lg:col-span-6">
          <div className={`glass-panel p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-500 ${isLevelComplete ? 'border-brand-500/30 bg-brand-500/[0.02]' : ''}`}>
            <div className="flex items-center gap-4">
              {isLevelComplete && (
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 shrink-0 shadow-inner">
                  <Trophy className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Phase {levelObj.level}</h2>
                  {isLevelComplete && (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-brand-500/10 text-brand-500 rounded ring-1 ring-brand-500/20">
                      <PartyPopper className="w-3 h-3" />
                      Mastered
                    </span>
                  )}
                </div>
                <p className="text-surface-400 text-sm max-w-md">{levelObj.goal}</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
               <div className={`text-sm font-mono px-3 py-1.5 rounded-md border transition-colors ${isLevelComplete ? 'bg-brand-500/10 border-brand-500/20 text-brand-500' : 'bg-surface-900 border-surface-700 text-surface-400'}`}>
                 <span className={`${isLevelComplete ? 'text-brand-500' : 'text-brand-500'} font-bold`}>{solvedCurrent}</span> / {totalCurrent} Solved
               </div>
               <div className="flex gap-1 bg-surface-900 p-1 rounded-lg border border-surface-700">
                  {['all', 'solved', 'unsolved'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilterStatus(f)}
                      className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${filterStatus === f ? 'bg-surface-700 text-white' : 'text-surface-500 hover:text-surface-300'}`}
                    >
                      {f}
                    </button>
                  ))}
               </div>
            </div>
          </div>

          {totalCurrent > 0 && (
            <div className="w-full bg-surface-800 rounded-full h-2 mb-8 overflow-hidden ring-1 ring-surface-700">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(solvedCurrent / totalCurrent) * 100}%` }}
                className="premium-bar-gradient h-2 rounded-full transition-all duration-500 ease-out"
              />
            </div>
          )}

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
                    className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${p.solved ? 'bg-brand-500/[0.03] border-brand-500/10 opacity-90 shadow-sm' : 'bg-surface-800 border-surface-700 hover:border-brand-500/50 hover:bg-surface-700'}`}
                  >
                  <div className="flex items-center gap-4 flex-1">
                    <button 
                      onClick={() => handleToggle(levelObj.level, p.originalIndex, p.solved)}
                      className="focus:outline-none flex-shrink-0 transition-transform active:scale-90"
                    >
                      {p.solved ? (
                        <div className="relative group/check">
                          <CheckCircle className="w-6 h-6 text-brand-500 relative z-10 transition-transform group-hover/check:scale-110" />
                        </div>
                      ) : (
                        <div className="relative group/circle">
                           <Circle className="w-6 h-6 text-surface-500 group-hover:text-brand-500 transition-all group-hover:scale-110" />
                        </div>
                      )}
                    </button>
                    
                    <div className="flex flex-col">
                      <a 
                        href={p.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`font-semibold tracking-tight transition-colors ${p.solved ? 'text-surface-500 line-through decoration-brand-500/30' : 'text-surface-200 group-hover:text-brand-500'}`}
                      >
                        {p.name}
                      </a>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-surface-500 flex items-center gap-1.5 bg-surface-900 px-2 py-0.5 rounded">
                          <div className={`w-1 h-1 rounded-full ${p.solved ? 'bg-brand-500' : 'bg-surface-600'}`}></div>
                          {p.topic}
                        </span>
                        
                        {p.companies && p.companies.length > 0 && (
                          <div className="flex items-center gap-1.5 border-l border-surface-700/50 pl-3">
                            {p.companies.map(c => (
                              <span key={c} className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md border bg-surface-800 text-surface-400 border-surface-700">
                                {c}
                              </span>
                            ))}
                          </div>
                        )}

                        {p.solved && p.solvedAt && (
                          <span className="text-[10px] font-medium text-surface-500 ml-auto md:ml-0">
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
                    className="p-2 text-surface-500 hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </motion.div>
              ))
            )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Sidebar: Calendar */}
        <div className="lg:col-span-3">
          <MonthCalendar data={data} />
        </div>
        
      </div>
    </div>
  );
}
