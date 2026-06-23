import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Download, CheckCircle2, ExternalLink, Calendar, DatabaseBackup, RotateCcw, ChevronDown } from 'lucide-react';
import DSALoader from '../components/DSALoader';
import VideoModal from '../components/VideoModal';
import YoutubeIcon from '../components/YoutubeIcon';

export default function Revise() {
  const { data: levels, loading, toggleRevisionStatus, resetReviseProgress } = useData();
  const { user } = useAuth();

  const [selectedLevel, setSelectedLevel] = React.useState(null);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState('all');
  
  const [videoModalConfig, setVideoModalConfig] = React.useState({
    isOpen: false,
    videoId: null,
    problemName: ''
  });

  // Filter levels to only include those with at least one solved problem
  const solvedLevels = levels.map(level => {
    return {
      ...level,
      solvedProblems: level.problems
        .map((p, index) => ({ ...p, originalIndex: index }))
        .filter(p => p.solved)
    };
  }).filter(level => level.solvedProblems.length > 0);

  // Set initial selected level
  React.useEffect(() => {
    if (solvedLevels.length > 0 && selectedLevel === null) {
      setSelectedLevel(solvedLevels[0].level);
    }
  }, [solvedLevels, selectedLevel]);

  const activeLevel = solvedLevels.find(l => l.level === selectedLevel) || solvedLevels[0];

  const filteredProblems = activeLevel ? activeLevel.solvedProblems.filter(p => {
    if (filterStatus === 'revised' && !p.revised) return false;
    if (filterStatus === 'needs revision' && p.revised) return false;
    return true;
  }).sort((a, b) => {
    if (a.revised === b.revised) return 0;
    return a.revised ? 1 : -1; // false (unrevised) comes before true (revised)
  }) : [];

  const handleConfirmReset = () => {
    resetReviseProgress(activeLevel.level);
    setShowConfirm(false);
  };

  if (loading) return <DSALoader />;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 relative">
      <VideoModal 
        isOpen={videoModalConfig.isOpen}
        onClose={() => setVideoModalConfig({ ...videoModalConfig, isOpen: false })}
        videoId={videoModalConfig.videoId}
        problemName={videoModalConfig.problemName}
      />
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/80"
              onClick={() => setShowConfirm(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface-900 border border-surface-700 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Reset Phase {activeLevel.level}?</h3>
                  <p className="text-sm text-surface-400 mt-1">This will un-check all items you have marked as revised in this phase.</p>
                </div>
              </div>
              <p className="text-surface-300 mb-8">This action cannot be undone. Are you absolutely sure?</p>
              
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-surface-300 hover:bg-surface-800 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmReset}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20"
                >
                  Yes, Reset Phase
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-300 mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Revise Mode
          </div>
          <h1 className="text-3xl font-bold mb-2">Review Your Progress</h1>
          <p className="text-surface-400">Revisit the problems you've already solved, organized by phase.</p>
        </motion.div>
        
        {solvedLevels.length > 0 && activeLevel && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-surface-800 text-surface-200 hover:bg-surface-700 hover:text-white rounded-xl font-bold transition-all border border-surface-700 hover:border-surface-600 shadow-sm"
              title={`Reset revision progress for Phase ${activeLevel.level}`}
            >
              <RotateCcw className="w-4 h-4 text-brand-400" />
              Reset Phase {activeLevel.level}
            </button>
          </motion.div>
        )}
      </div>

      {solvedLevels.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-800/50 border border-surface-700 rounded-2xl p-12 text-center"
        >
          <CheckCircle2 className="w-16 h-16 text-surface-600 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No problems solved yet</h3>
          <p className="text-surface-400 max-w-md mx-auto">
            Start solving problems in the Roadmap to see them appear here for revision.
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Side Navigation */}
          <div className="lg:w-1/3 xl:w-1/4 flex-shrink-0">
            <div className="sticky top-28 flex flex-col gap-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-2 px-2">Your Phases</h2>
              {solvedLevels.map(level => (
                <button
                  key={level.level}
                  onClick={() => setSelectedLevel(level.level)}
                  className={`text-left flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    selectedLevel === level.level
                      ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-lg shadow-brand-500/5'
                      : 'bg-transparent text-surface-400 hover:bg-surface-800 hover:text-white border border-transparent'
                  }`}
                >
                  <span className="truncate pr-2">Level {level.level}: {level.goal}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedLevel === level.level ? 'bg-brand-500/20 text-brand-300' : 'bg-surface-800 text-surface-500'
                  }`}>
                    {level.solvedProblems.length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
              {activeLevel && (
                <motion.div
                  key={activeLevel.level}
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
                  }}
                  className="bg-surface-800 border border-surface-700 rounded-2xl overflow-hidden"
                >
                  <motion.div variants={{ hidden: { opacity: 0, y: 5 }, show: { opacity: 1, y: 0 } }} className="bg-surface-800 border-b border-surface-700 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/10 text-brand-400 font-bold text-sm">
                        {activeLevel.level}
                      </div>
                      <h2 className="text-lg font-bold">{activeLevel.goal}</h2>
                    </div>

                    <div className="relative group z-20">
                      <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-surface-900 border border-surface-700 rounded-lg text-surface-300 hover:text-white hover:border-surface-600 transition-colors">
                        <span className="capitalize">{filterStatus === 'needs revision' ? 'Needs Revision' : filterStatus}</span>
                        <ChevronDown className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                      </button>
                      
                      <div className="absolute right-0 mt-2 w-48 bg-surface-800 border border-surface-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all overflow-hidden transform origin-top-right scale-95 group-hover:scale-100">
                        <div className="py-1">
                          {['all', 'revised', 'needs revision'].map(f => (
                            <button
                              key={f}
                              onClick={() => setFilterStatus(f)}
                              className={`w-full text-left px-4 py-2 text-sm capitalize transition-colors ${filterStatus === f ? 'bg-brand-500/10 text-brand-400 font-bold' : 'text-surface-300 hover:bg-surface-700 hover:text-white'}`}
                            >
                              {f === 'needs revision' ? 'Needs Revision' : f}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  <div className="p-4 md:p-6">
                    <div className="flex flex-col gap-3">
                      {filteredProblems.length === 0 ? (
                        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="text-center py-8 text-surface-400">
                          No problems match this filter.
                        </motion.div>
                      ) : (
                        filteredProblems.map((problem, pIdx) => (
                        <motion.div
                          key={pIdx}
                          variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                          className={`group flex items-center justify-between p-3 md:p-4 rounded-xl border transition-colors ${
                            problem.revised 
                              ? 'bg-surface-800/40 border-brand-500/30 opacity-75' 
                              : 'bg-surface-900 border-surface-700 hover:border-brand-500/50'
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                toggleRevisionStatus(activeLevel.level, problem.originalIndex, problem.revised);
                              }}
                              className={`p-1.5 rounded-lg border transition-colors flex-shrink-0 ${
                                problem.revised 
                                  ? 'bg-brand-500/20 border-brand-500/50 text-brand-400' 
                                  : 'bg-surface-800 border-surface-600 text-surface-400 hover:text-white hover:border-brand-500'
                              }`}
                              title={problem.revised ? "Mark as needs revision" : "Mark as revised"}
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            
                            <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <a 
                                    href={problem.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className={`font-medium text-sm md:text-base transition-colors truncate hover:text-brand-300 ${problem.revised ? 'line-through text-surface-400' : 'text-white'}`}
                                  >
                                    {problem.name}
                                  </a>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                  <span className="text-[10px] uppercase font-bold tracking-widest text-surface-500 flex items-center gap-1.5 bg-surface-900 px-2 py-0.5 rounded">
                                    <div className={`w-1 h-1 rounded-full ${problem.revised ? 'bg-brand-500' : 'bg-surface-600'}`}></div>
                                    {problem.topic}
                                  </span>
                                  
                                  {problem.companies && problem.companies.length > 0 && (
                                    <div className="flex items-center gap-1.5 border-l border-surface-700/50 pl-3">
                                      {problem.companies.map(c => (
                                        <span key={c} className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md border bg-surface-800 text-surface-400 border-surface-700">
                                          {c}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {problem.lastRevisedAt && (
                                    <span className="text-[10px] font-medium text-surface-500 ml-auto md:ml-0 flex items-center gap-1">
                                      <RotateCcw className="w-3 h-3" />
                                      {new Date(problem.lastRevisedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <div className={`relative group/vidbtn flex items-center justify-center transition-all ${problem.videoId ? '' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setVideoModalConfig({
                                      isOpen: true,
                                      videoId: problem.videoId || null,
                                      problemName: problem.name
                                    });
                                  }}
                                  className={`p-2 rounded-xl transition-colors ${problem.videoId ? 'text-red-500 hover:bg-red-500/10' : 'text-surface-400 hover:text-white hover:bg-surface-800'}`}
                                >
                                  <YoutubeIcon className="w-5 h-5" />
                                </button>
                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-800 text-surface-200 text-xs font-medium rounded opacity-0 group-hover/vidbtn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-surface-700 shadow-xl z-[60]">
                                  Video Solution
                                </div>
                              </div>
                              
                              <div className="relative group/linkbtn flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                                <a 
                                  href={problem.link} 
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
                    </div>
                  </div>
                </motion.div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
