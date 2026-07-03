import React from 'react';
import { useData } from '../context/DataContext';
import { Bookmark, CheckCircle, Circle, ExternalLink, ChevronDown } from 'lucide-react';
import DSALoader from '../components/DSALoader';
import VideoModal from '../components/VideoModal';
import YoutubeIcon from '../components/YoutubeIcon';
import { Link } from 'react-router-dom';

const difficultyWeights = {
  'Easy': 1,
  'Medium': 2,
  'Hard': 3
};

export default function DoLater() {
  const { data: levels, loading, toggleProblemStatus, toggleDoLaterStatus } = useData();

  const [filterStatus, setFilterStatus] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('default');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = React.useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = React.useState(false);

  const [videoModalConfig, setVideoModalConfig] = React.useState({
    isOpen: false,
    videoId: null,
    problemName: ''
  });

  // Extract all bookmarked problems across all levels
  const bookmarkedProblems = React.useMemo(() => {
    if (!levels) return [];
    const list = [];
    levels.forEach(level => {
      level.problems.forEach((problem, index) => {
        if (problem.doLater) {
          list.push({
            ...problem,
            level: level.level,
            originalIndex: index
          });
        }
      });
    });
    return list;
  }, [levels]);

  const filteredProblems = React.useMemo(() => {
    return bookmarkedProblems
      .filter(p => {
        if (filterStatus === 'solved' && !p.solved) return false;
        if (filterStatus === 'unsolved' && p.solved) return false;
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
        
        return 0;
      });
  }, [bookmarkedProblems, filterStatus, sortBy]);

  if (loading) return <DSALoader message="Loading Bookmarks..." />;

  const solvedCount = bookmarkedProblems.filter(p => p.solved).length;
  const totalCount = bookmarkedProblems.length;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 relative">
      <VideoModal 
        isOpen={videoModalConfig.isOpen}
        onClose={() => setVideoModalConfig({ ...videoModalConfig, isOpen: false })}
        videoId={videoModalConfig.videoId}
        problemName={videoModalConfig.problemName}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-300 mb-4">
            <Bookmark className="w-3.5 h-3.5" />
            Do Later List
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Bookmarked Problems
          </h1>
          <p className="text-surface-400 mt-2 max-w-xl text-sm md:text-base">
            Keep track of problems you've bookmarked to solve or review later.
          </p>
        </div>

        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0 relative z-30">
            <div className="text-sm font-mono text-surface-400 bg-surface-950/70 px-4 py-2 rounded-xl border border-white/10 flex items-center justify-between gap-4">
              <span>Progress:</span>
              <span>
                <strong className="text-brand-300 font-bold">{solvedCount}</strong> / {totalCount} Solved
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Sort Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center justify-between gap-2 px-4 py-2 w-full sm:w-auto text-sm font-semibold bg-surface-900 border border-surface-700 rounded-xl text-surface-300 hover:text-white hover:border-surface-600 transition-all active:scale-95"
                >
                  <span>Sort: {sortBy === 'default' ? 'Default' : sortBy === 'difficultyAsc' ? 'Easy → Hard' : 'Hard → Easy'}</span>
                  <ChevronDown className={`w-4 h-4 opacity-70 transition-transform duration-300 ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
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
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${sortBy === opt.value ? 'bg-brand-500/10 text-brand-400 font-bold' : 'text-surface-300 hover:bg-surface-700 hover:text-white'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className="flex items-center justify-between gap-2 px-4 py-2 w-full sm:w-auto text-sm font-semibold bg-surface-900 border border-surface-700 rounded-xl text-surface-300 hover:text-white hover:border-surface-600 transition-all active:scale-95"
                >
                  <span className="capitalize">{filterStatus} Bookmarks</span>
                  <ChevronDown className={`w-4 h-4 opacity-70 transition-transform duration-300 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isFilterDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsFilterDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-surface-800 border border-surface-700 rounded-xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all">
                      <div className="py-1">
                        {['all', 'solved', 'unsolved'].map(f => (
                          <button
                            key={f}
                            onClick={() => {
                              setFilterStatus(f);
                              setIsFilterDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm capitalize transition-colors ${filterStatus === f ? 'bg-brand-500/10 text-brand-400 font-bold' : 'text-surface-300 hover:bg-surface-700 hover:text-white'}`}
                          >
                            {f} Bookmarks
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {totalCount === 0 ? (
        <div className="glass-panel text-center py-20 px-6 rounded-3xl border border-surface-800 bg-surface-900/50 flex flex-col items-center max-w-2xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-surface-800/80 border border-surface-700 flex items-center justify-center text-surface-500 mb-6 shadow-inner">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No bookmarks yet</h3>
          <p className="text-surface-400 text-sm md:text-base mb-8 max-w-md">
            When browsing the curriculum, click the bookmark icon on any problem to save it here for later.
          </p>
          <Link
            to="/practice"
            className="px-6 py-3 rounded-xl bg-brand-500 text-surface-900 font-bold hover:bg-brand-400 hover:shadow-lg hover:shadow-brand-500/10 active:scale-95 transition-all duration-300"
          >
            Explore Problems
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProblems.length === 0 ? (
            <div className="text-center py-16 text-surface-500 italic glass-panel rounded-2xl border border-surface-800">
              No bookmarks found matching "{filterStatus}" filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredProblems.map((problem) => (
                <div 
                  key={`${problem.level}-${problem.originalIndex}`} 
                  className={`group flex items-center justify-between p-4 md:p-5 rounded-2xl border transition-all duration-300 ${
                    problem.solved 
                      ? 'bg-brand-500/[0.02] border-brand-500/10 opacity-80' 
                      : 'bg-surface-800 border-surface-700 hover:border-brand-500/30 hover:bg-surface-700/80 hover:shadow-lg hover:shadow-black/10'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Solve Checkbox */}
                    <button 
                      onClick={() => toggleProblemStatus(problem.level, problem.originalIndex, problem.solved)}
                      className="focus:outline-none flex-shrink-0 transition-transform active:scale-90"
                    >
                      {problem.solved ? (
                        <CheckCircle className="w-6 h-6 text-brand-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-surface-500 hover:text-brand-500 transition-colors" />
                      )}
                    </button>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a 
                          href={problem.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`font-semibold text-sm md:text-base transition-colors truncate hover:text-brand-300 ${
                            problem.solved ? 'line-through text-surface-500' : 'text-white'
                          }`}
                        >
                          {problem.name}
                        </a>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-surface-500 flex items-center gap-1.5 bg-surface-900 px-2 py-0.5 rounded border border-surface-800">
                          Phase {problem.level}
                        </span>
                        
                        <span className="text-[10px] uppercase font-bold tracking-widest text-surface-500 flex items-center gap-1.5 bg-surface-900 px-2 py-0.5 rounded border border-surface-800">
                          {problem.topic}
                        </span>

                        {problem.difficulty && (
                          <span className={`text-[10px] px-2 py-0.5 font-bold rounded border ${
                            problem.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            problem.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                            'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                            {problem.difficulty}
                          </span>
                        )}

                        {problem.companies && problem.companies.length > 0 && (
                          <div className="flex items-center gap-1">
                            {problem.companies.slice(0, 2).map(c => (
                              <span key={c} className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md border bg-surface-800 text-surface-400 border-surface-700">
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {/* Video Solution Button */}
                    {(problem.videoId || problem.name) && (
                      <div className="relative group/vidbtn flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setVideoModalConfig({
                              isOpen: true,
                              videoId: problem.videoId || null,
                              problemName: problem.name
                            });
                          }}
                          className="group/youtube p-2 rounded-xl transition-colors text-surface-400 hover:text-red-500 hover:bg-red-500/10"
                          title="Video Solution"
                        >
                          <YoutubeIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    
                    {/* LeetCode link */}
                    <div className="relative group/linkbtn flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                      <a 
                        href={problem.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl text-surface-500 hover:text-brand-500 hover:bg-brand-500/10 transition-colors"
                        title="Solve on LeetCode"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>

                    {/* Bookmark Toggle (un-bookmark from here) */}
                    <div className="relative group/bookmarkbtn flex items-center justify-center transition-all">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleDoLaterStatus(problem.level, problem.originalIndex, true);
                        }}
                        className="p-2 rounded-xl text-amber-500 hover:text-amber-600 transition-colors"
                        title="Remove Bookmark"
                      >
                        <Bookmark className="w-5 h-5 fill-current" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
