import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useState } from 'react';
import { ExternalLink, CheckCircle, Circle, ArrowLeft, Bookmark, ChevronDown } from 'lucide-react';
import TopicInfo from '../components/TopicInfo';
import DSALoader from '../components/DSALoader';
import VideoModal from '../components/VideoModal';
import YoutubeIcon from '../components/YoutubeIcon';

const difficultyWeights = {
  'Easy': 1,
  'Medium': 2,
  'Hard': 3
};

export default function TopicDetail({ mode = 'topic' }) {
  const { topicId } = useParams();
  const decodedTopic = decodeURIComponent(topicId);
  const { getTopicData, getTechniqueData, loading, error, toggleProblemStatus, toggleDoLaterStatus } = useData();
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const isTechnique = mode === 'technique';

  // Video Modal State
  const [videoModalConfig, setVideoModalConfig] = useState({
    isOpen: false,
    videoId: null,
    problemName: ''
  });

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

  const filteredProblems = topicObj.problems
    .filter(p => {
      if (filterStatus === 'solved') return p.solved;
      if (filterStatus === 'unsolved') return !p.solved;
      return true;
    })
    .sort((a, b) => {
      if (a.solved !== b.solved) {
        return a.solved ? 1 : -1;
      }
      
      if (sortBy === 'difficultyAsc') {
        const diffA = difficultyWeights[a.difficulty] || 2;
        const diffB = difficultyWeights[b.difficulty] || 2;
        if (diffA !== diffB) return diffA - diffB;
      } else if (sortBy === 'difficultyDesc') {
        const diffA = difficultyWeights[a.difficulty] || 2;
        const diffB = difficultyWeights[b.difficulty] || 2;
        if (diffA !== diffB) return diffB - diffA;
      }
      
      if (a.originalLevel !== b.originalLevel) {
        return a.originalLevel - b.originalLevel;
      }
      return a.originalIndex - b.originalIndex;
    });

  const totalCurrent = topicObj.problems.length;
  const solvedCurrent = topicObj.problems.filter(p => p.solved).length;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12">
      <Link to={isTechnique ? '/techniques' : '/topics'} className="inline-flex items-center gap-2 text-surface-400 hover:text-brand-300 mb-8 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to {isTechnique ? 'Techniques' : 'Topics'}
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-accent-sky to-accent-amber">{decodedTopic}</h1>
        <p className="text-surface-400">
          {isTechnique
            ? `Practice questions that train the ${decodedTopic} technique, including problems that also belong to other patterns.`
            : `Practice questions related to ${decodedTopic}.`}
        </p>
      </div>

      {!isTechnique && <TopicInfo topic={decodedTopic} />}

      {/* Section Header & Filters */}
      <div className="glass-panel p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Problems</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
           <div className="text-sm font-mono text-surface-400 bg-surface-950/70 px-3 py-1.5 rounded-md border border-white/10">
             <span className="text-brand-300 font-bold">{solvedCurrent}</span> / {totalCurrent} Solved
           </div>
           
           <div className="flex gap-2 relative z-30">
             {/* Sort Dropdown */}
             <div className="relative">
               <button 
                 onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                 className="flex items-center gap-2 px-3 py-1 text-xs font-medium bg-surface-950/70 border border-white/10 rounded-lg text-surface-300 hover:text-white transition-colors"
               >
                 <span>Sort: {sortBy === 'default' ? 'Default' : sortBy === 'difficultyAsc' ? 'Easy → Hard' : 'Hard → Easy'}</span>
                 <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
               </button>
               
               {isSortDropdownOpen && (
                 <>
                   <div 
                     className="fixed inset-0 z-40" 
                     onClick={() => setIsSortDropdownOpen(false)}
                   />
                   <div className="absolute right-0 mt-2 w-48 bg-surface-800 border border-surface-700 rounded-xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all">
                     <div className="py-1">
                       {[
                         { value: 'default', label: 'Default Order' },
                         { value: 'difficultyAsc', label: 'Difficulty: Easy to Hard' },
                         { value: 'difficultyDesc', label: 'Difficulty: Hard to Easy' }
                       ].map(opt => (
                         <button
                           key={opt.value}
                           onClick={() => {
                             setSortBy(opt.value);
                             setIsSortDropdownOpen(false);
                           }}
                           className={`w-full text-left px-4 py-2 text-xs transition-colors ${sortBy === opt.value ? 'bg-brand-500/10 text-brand-400 font-bold' : 'text-surface-300 hover:bg-surface-700 hover:text-white'}`}
                         >
                           {opt.label}
                         </button>
                       ))}
                     </div>
                   </div>
                 </>
               )}
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
      </div>

      {/* Progress Bar */}
      {totalCurrent > 0 && (
        <div className="w-full bg-surface-900/80 rounded-full h-2 mb-8 overflow-hidden ring-1 ring-white/10">
          <div 
            style={{ width: `${(solvedCurrent / totalCurrent) * 100}%` }}
            className="premium-bar-gradient h-2 rounded-full"
          />
        </div>
      )}

      {/* Problem List */}
      <div className="space-y-3 pb-20">
        {filteredProblems.length === 0 ? (
          <div className="text-center py-12 text-surface-600 italic">
            No problems found for this filter.
          </div>
        ) : (
          filteredProblems.map((p) => (
            <div 
              key={`${p.originalLevel}-${p.originalIndex}`} 
              className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border gap-3 sm:gap-4 ${
                p.solved 
                  ? 'bg-surface-950/50 border-white/5 opacity-75' 
                  : 'bg-surface-900/75 border-white/10 hover:border-brand-400/30 hover:bg-surface-900 hover:shadow-lg hover:shadow-black/20'
              }`}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
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
                
                <div className="flex flex-col min-w-0 flex-1">
                  <a 
                    href={p.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`font-medium transition-colors truncate ${
                      p.solved 
                        ? 'text-surface-500 line-through decoration-surface-700' 
                        : 'text-surface-200 group-hover:text-brand-300'
                    }`}
                  >
                    {p.name}
                  </a>
                  <span className="text-xs text-surface-600 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-surface-700"></span>
                    Level {p.originalLevel}
                    {p.difficulty && (
                      <span className={`text-[9px] px-1.5 py-0.5 font-bold rounded-full border ${
                        p.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        p.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {p.difficulty}
                      </span>
                    )}
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

              <div className="flex items-center gap-2 shrink-0 sm:ml-2 mt-2 sm:mt-0 justify-end sm:justify-start w-full sm:w-auto border-t border-surface-700/30 sm:border-0 pt-2 sm:pt-0">
                {/* Video Solution Button */}
                {(p.videoId || p.name) && (
                  <div className="relative group/vidbtn flex items-center justify-center transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setVideoModalConfig({
                          isOpen: true,
                          videoId: p.videoId || null,
                          problemName: p.name
                        });
                      }}
                      className="group/youtube p-2 rounded-xl transition-colors text-surface-400 hover:text-red-500 hover:bg-red-500/10"
                    >
                      <YoutubeIcon className="w-5 h-5" />
                    </button>
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-800 text-surface-200 text-xs font-medium rounded opacity-0 group-hover/vidbtn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-surface-700 shadow-xl z-[60]">
                      Video Solution
                    </div>
                  </div>
                )}

                {/* LeetCode link */}
                <div className="relative group/linkbtn flex items-center justify-center transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
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

                {/* Bookmark Button */}
                <div className={`relative group/bookmarkbtn flex items-center justify-center transition-all ${p.doLater ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100'}`}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleDoLaterStatus(p.originalLevel, p.originalIndex, p.doLater);
                    }}
                    className={`p-2 rounded-xl transition-colors ${p.doLater ? 'text-amber-500 hover:text-amber-600' : 'text-surface-500 hover:text-amber-500 hover:bg-surface-800'}`}
                  >
                    <Bookmark className={`w-5 h-5 ${p.doLater ? 'fill-current' : ''}`} />
                  </button>
                  <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-surface-800 text-surface-200 text-xs font-medium rounded opacity-0 group-hover/bookmarkbtn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-surface-700 shadow-xl z-[60]">
                    {p.doLater ? 'Remove Bookmark' : 'Bookmark'}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <VideoModal 
        isOpen={videoModalConfig.isOpen}
        onClose={() => setVideoModalConfig({ ...videoModalConfig, isOpen: false })}
        videoId={videoModalConfig.videoId}
        problemName={videoModalConfig.problemName}
      />
    </div>
  );
}