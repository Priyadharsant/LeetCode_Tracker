import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ExternalLink, CheckCircle, Circle, Trophy, PartyPopper, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import AchievementOverlay from '../components/AchievementOverlay';
import MonthCalendar from '../components/MonthCalendar';
import DSALoader from '../components/DSALoader';
import VideoModal from '../components/VideoModal';
import YoutubeIcon from '../components/YoutubeIcon';

export default function Practice() {
  const [searchParams] = useSearchParams();
  const targetPhase = parseInt(searchParams.get('phase'));

  const { data, loading, error, toggleProblemStatus } = useData();
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(targetPhase || 1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showAchievement, setShowAchievement] = useState(false);
  
  // Video Modal State
  const [videoModalConfig, setVideoModalConfig] = useState({
    isOpen: false,
    videoId: null,
    problemName: ''
  });

  const topicStats = useMemo(() => {
    if (!data) return [];
    const stats = {};
    data.forEach(lvl => {
      lvl.problems.forEach(p => {
        if (!stats[p.topic]) stats[p.topic] = { total: 0, solved: 0 };
        stats[p.topic].total++;
        if (p.solved) stats[p.topic].solved++;
      });
    });
    
    return Object.entries(stats)
      .map(([topic, { total, solved }]) => ({
        topic,
        total,
        solved,
        percentage: total > 0 ? (solved / total) * 100 : 0
      }))
      .filter(t => t.solved > 0)
      .sort((a, b) => b.percentage - a.percentage || b.solved - a.solved)
      .slice(0, 5); // Top 5 strongest topics
  }, [data]);

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
    <div className="w-full mx-auto p-4 sm:p-6 lg:p-8">
      <VideoModal 
        isOpen={videoModalConfig.isOpen}
        onClose={() => setVideoModalConfig({ ...videoModalConfig, isOpen: false })}
        videoId={videoModalConfig.videoId}
        problemName={videoModalConfig.problemName}
      />
      <AnimatePresence>
        {showAchievement && (
          <AchievementOverlay
            level={currentLevel}
            onHide={() => setShowAchievement(false)}
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar: Accordion */}
        <div className="lg:col-span-3 space-y-3 lg:sticky lg:top-24 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide">
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
               <div className="relative group">
                 <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-surface-900 border border-surface-700 rounded-lg text-surface-300 hover:text-white hover:border-surface-600 transition-colors">
                   <span className="capitalize">{filterStatus} Problems</span>
                   <ChevronDown className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                 </button>
                 
                 <div className="absolute right-0 mt-2 w-40 bg-surface-800 border border-surface-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden transform origin-top-right scale-95 group-hover:scale-100">
                   <div className="py-1">
                     {['all', 'solved', 'unsolved'].map(f => (
                       <button
                         key={f}
                         onClick={() => setFilterStatus(f)}
                         className={`w-full text-left px-4 py-2 text-sm capitalize transition-colors ${filterStatus === f ? 'bg-brand-500/10 text-brand-400 font-bold' : 'text-surface-300 hover:bg-surface-700 hover:text-white'}`}
                       >
                         {f} Problems
                       </button>
                     ))}
                   </div>
                 </div>
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
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
                                        <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <a 
                                    href={p.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className={`font-medium text-sm md:text-base transition-colors truncate hover:text-brand-300 ${p.solved ? 'line-through text-surface-400' : 'text-white'}`}
                                  >
                                    {p.name}
                                  </a>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
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

                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <div className={`relative group/vidbtn flex items-center justify-center transition-all ${p.videoId ? '' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setVideoModalConfig({
                                      isOpen: true,
                                      videoId: p.videoId || null,
                                      problemName: p.name
                                    });
                                  }}
                                  className={`p-2 rounded-xl transition-colors ${p.videoId ? 'text-red-500 hover:bg-red-500/10' : 'text-surface-400 hover:text-white hover:bg-surface-800'}`}
                                >
                                  <YoutubeIcon className="w-5 h-5" />
                                </button>
                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-800 text-surface-200 text-xs font-medium rounded opacity-0 group-hover/vidbtn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-surface-700 shadow-xl z-[60]">
                                  Video Solution
                                </div>
                              </div>
                              
                              <div className="relative group/linkbtn flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                                <a 
                                  href={p.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-xl text-surface-500 hover:text-brand-500 hover:bg-brand-500/10 transition-colors"
                                >
                                  <ExternalLink className="w-5 h-5" />
                                </a>
                                <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-surface-800 text-surface-200 text-xs font-medium rounded opacity-0 group-hover/linkbtn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-surface-700 shadow-xl z-[60]">
                                  Solve on LeetCode
                                </div>
                              </div>
                            </div>
                </motion.div>
              ))
            )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Sidebar: Calendar and Stats */}
        <div className="lg:col-span-3 space-y-6">
          <MonthCalendar data={data} />
          
          {topicStats && topicStats.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-white">Strongest Topics</h3>
              </div>
              
              <div className="space-y-4">
                {topicStats.map((stat, i) => (
                  <div key={stat.topic} className="relative">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-surface-300 truncate pr-2" title={stat.topic}>
                        {stat.topic}
                      </span>
                      <span className="text-brand-400 font-bold shrink-0">
                        {stat.percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-surface-800 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.percentage}%` }}
                        transition={{ duration: 1, delay: 0.3 + (i * 0.1) }}
                        className="h-full bg-brand-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
        
      </div>
    </div>
  );
}
