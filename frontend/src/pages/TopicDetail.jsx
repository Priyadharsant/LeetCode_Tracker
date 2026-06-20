import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useState } from 'react';
import { ExternalLink, CheckCircle, Circle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TopicInfo from '../components/TopicInfo';
import DSALoader from '../components/DSALoader';

export default function TopicDetail({ mode = 'topic' }) {
  const { topicId } = useParams();
  const decodedTopic = decodeURIComponent(topicId);
  const { getTopicData, getTechniqueData, loading, error, toggleProblemStatus } = useData();
  const [filterStatus, setFilterStatus] = useState('all');
  const isTechnique = mode === 'technique';

  if (loading) {
    return <DSALoader message="Loading topic details..." />;
  }
  if (error) {
    return <div className="p-12 text-center text-red-500">{error}</div>;
  }

  const topics = isTechnique ? getTechniqueData() : getTopicData();
  const topicObj = topics.find(t => t.topic === decodedTopic);

  if (!topicObj) {
    return <div className="p-12 text-center text-zinc-500">{isTechnique ? 'Technique' : 'Topic'} not found.</div>;
  }

  const filteredProblems = topicObj.problems.filter(p => {
    if (filterStatus === 'solved') return p.solved;
    if (filterStatus === 'unsolved') return !p.solved;
    return true;
  }).sort((a, b) => {
    if (a.solved === b.solved) return 0;
    return a.solved ? 1 : -1;
  });

  const totalCurrent = topicObj.problems.length;
  const solvedCurrent = topicObj.problems.filter(p => p.solved).length;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12">
      <Link to={isTechnique ? '/techniques' : '/topics'} className="inline-flex items-center gap-2 text-surface-400 hover:text-brand-300 mb-8 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to {isTechnique ? 'Techniques' : 'Topics'}
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-accent-sky to-accent-amber">{decodedTopic}</h1>
        <p className="text-surface-400">
          {isTechnique
            ? `Practice questions that train the ${decodedTopic} technique, including problems that also belong to other patterns.`
            : `Practice questions related to ${decodedTopic}.`}
        </p>
      </motion.div>

      {!isTechnique && <TopicInfo topic={decodedTopic} />}

      {/* Section Header & Filters */}
      <div className="glass-panel p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Problems</h2>
        </div>
        
        <div className="flex flex-col items-end gap-3">
           <div className="text-sm font-mono text-surface-400 bg-surface-950/70 px-3 py-1.5 rounded-md border border-white/10">
             <span className="text-brand-300 font-bold">{solvedCurrent}</span> / {totalCurrent} Solved
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
        <AnimatePresence mode="popLayout">
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
              exit={{ 
                opacity: [1, 0],
                x: [0, 40],
                filter: ["blur(0px)", "blur(12px)"],
                clipPath: ["inset(0% 0% 0% 0%)", "inset(0% 0% 0% 100%)"],
                transition: { duration: 0.5, ease: "easeOut" }
              }}
              key={`${p.originalLevel}-${p.originalIndex}`} 
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                p.solved 
                  ? 'bg-surface-950/50 border-white/5 opacity-75' 
                  : 'bg-surface-900/75 border-white/10 hover:border-brand-400/30 hover:bg-surface-900 hover:shadow-lg hover:shadow-black/20'
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <button 
                  onClick={() => toggleProblemStatus(p.originalLevel, p.originalIndex, p.solved)}
                  className="focus:outline-none flex-shrink-0"
                >
                  {p.solved ? (
                    <CheckCircle className="w-6 h-6 text-brand-300" />
                  ) : (
                    <Circle className="w-6 h-6 text-surface-600 group-hover:text-brand-300 transition-colors" />
                  )}
                </button>
                
                <div className="flex flex-col">
                  <a 
                    href={p.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`font-medium transition-colors ${
                      p.solved 
                        ? 'text-surface-500 line-through decoration-surface-700' 
                        : 'text-surface-200 group-hover:text-brand-300'
                    }`}
                  >
                    {p.name}
                  </a>
                  <span className="text-xs text-surface-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-surface-700"></span>
                    Level {p.originalLevel}
                  </span>
                  {isTechnique && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.techniques?.slice(0, 4).map(technique => (
                        <span
                          key={technique}
                          className={`rounded-md border px-2 py-0.5 text-[11px] ${
                            technique === decodedTopic
                              ? 'border-brand-400/30 bg-brand-500/10 text-brand-200'
                              : 'border-white/10 bg-surface-950 text-surface-500'
                          }`}
                        >
                          {technique}
                        </span>
                      ))}
                    </div>
                  )}
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