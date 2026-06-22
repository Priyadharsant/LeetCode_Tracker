  import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Download, CheckCircle2, ExternalLink, Calendar, DatabaseBackup } from 'lucide-react';
import DSALoader from '../components/DSALoader';

export default function Revise() {
  const { data: levels, loading, toggleRevisionStatus } = useData();
  const { user } = useAuth();

  const [selectedLevel, setSelectedLevel] = React.useState(null);

  if (loading) return <DSALoader />;

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

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12">
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
            <AnimatePresence mode="wait">
              {activeLevel && (
                <motion.div
                  key={activeLevel.level}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-surface-800 border border-surface-700 rounded-2xl overflow-hidden"
                >
                  <div className="bg-surface-800 border-b border-surface-700 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/10 text-brand-400 font-bold text-sm">
                        {activeLevel.level}
                      </div>
                      <h2 className="text-lg font-bold">{activeLevel.goal}</h2>
                    </div>
                  </div>
                  <div className="p-4 md:p-6">
                    <div className="flex flex-col gap-3">
                      {activeLevel.solvedProblems.map((problem, pIdx) => (
                        <div
                          key={pIdx}
                          className={`group flex items-center justify-between p-3 md:p-4 rounded-xl border transition-all ${
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
                              <a 
                                href={problem.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`font-medium text-sm md:text-base transition-colors truncate hover:text-brand-300 ${problem.revised ? 'line-through text-surface-400' : 'text-white'}`}
                              >
                                {problem.name}
                              </a>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                <span className={`text-xs ${problem.revised ? 'text-surface-500' : 'text-surface-400'}`}>
                                  {problem.topic}
                                </span>
                                {problem.solvedAt && (
                                  <span className={`text-xs flex items-center ${problem.revised ? 'text-surface-500' : 'text-brand-400/80'}`}>
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(problem.solvedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <a 
                            href={problem.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-4 p-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:text-white hover:bg-surface-700 hover:border-surface-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
