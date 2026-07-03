import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ExternalLink, CheckCircle, Circle, LibraryBig, Code2, Bookmark, ChevronDown } from 'lucide-react';
import DSALoader from '../components/DSALoader';
import VideoModal from '../components/VideoModal';
import YoutubeIcon from '../components/YoutubeIcon';

const difficultyWeights = {
  'Easy': 1,
  'Medium': 2,
  'Hard': 3
};

export default function Patterns() {
  const { data, loading, error, toggleProblemStatus, toggleDoLaterStatus } = useData();
  const [activeTechnique, setActiveTechnique] = useState(null);
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  
  // Video Modal State
  const [videoModalConfig, setVideoModalConfig] = useState({
    isOpen: false,
    videoId: null,
    problemName: ''
  });

  const techniquesMap = useMemo(() => {
    if (!data) return new Map();
    const map = new Map();
    
    data.forEach(level => {
      level.problems.forEach((p, idx) => {
        const problemObj = { ...p, level: level.level, originalIndex: idx };
        if (p.techniques && p.techniques.length > 0) {
          p.techniques.forEach(tech => {
            if (!map.has(tech)) map.set(tech, []);
            map.get(tech).push(problemObj);
          });
        } else {
          const tech = "Other";
          if (!map.has(tech)) map.set(tech, []);
          map.get(tech).push(problemObj);
        }
      });
    });
    
    return map;
  }, [data]);

  const sortedTechniques = useMemo(() => {
    return Array.from(techniquesMap.keys()).sort((a, b) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return techniquesMap.get(b).length - techniquesMap.get(a).length;
    });
  }, [techniquesMap]);

  // Set default active technique
  useMemo(() => {
    if (sortedTechniques.length > 0 && !activeTechnique) {
      setActiveTechnique(sortedTechniques[0]);
    }
  }, [sortedTechniques, activeTechnique]);

  const filteredProblems = useMemo(() => {
    const problems = activeTechnique ? techniquesMap.get(activeTechnique) || [] : [];
    return problems
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
        
        if (a.level !== b.level) {
          return a.level - b.level;
        }
        return a.originalIndex - b.originalIndex;
      });
  }, [activeTechnique, techniquesMap, filterStatus, sortBy]);

  const activeProblems = useMemo(() => {
    return activeTechnique ? techniquesMap.get(activeTechnique) || [] : [];
  }, [activeTechnique, techniquesMap]);

  if (loading || !data || data.length === 0) {
    return <DSALoader message="Loading Pattern View..." />;
  }
  if (error) {
    return <div className="p-12 text-center text-red-500">{error}</div>;
  }

  const totalCurrent = activeProblems.length;
  const solvedCurrent = activeProblems.filter(p => p.solved).length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pt-8">
      <div className="mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-400 mb-6">
            <LibraryBig className="w-4 h-4" />
            Pattern Recognition
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 pb-2 bg-gradient-to-r from-white to-surface-400 bg-clip-text text-transparent">
            Technique View
          </h1>
          <p className="text-lg text-surface-400 max-w-2xl mb-8">
            Master algorithms by learning the core patterns. Once you understand a pattern like Sliding Window or Two Pointers, you can solve dozens of problems regardless of the underlying data structure.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar: Techniques List */}
        <div className="lg:w-1/4">
          <div className="sticky top-28 bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
            <div className="p-4 border-b border-surface-800 bg-surface-800/30">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-brand-500" />
                Algorithm Patterns
              </h2>
            </div>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
              <div className="flex flex-col gap-1">
                {sortedTechniques.map(tech => {
                  const techProblems = techniquesMap.get(tech);
                  const solved = techProblems.filter(p => p.solved).length;
                  const total = techProblems.length;
                  const isActive = activeTechnique === tech;
                  const isCompleted = solved === total && total > 0;
                  
                  return (
                    <button
                      key={tech}
                      onClick={() => setActiveTechnique(tech)}
                      className={`flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                        isActive 
                          ? 'bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
                          : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                      }`}
                    >
                      <span className="font-medium text-sm truncate pr-2">{tech}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                          isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface-900 text-surface-500'
                        }`}>
                          {solved}/{total}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Problems Grid */}
        <div className="lg:w-3/4">
          <div className="bg-surface-900 border border-surface-800 rounded-3xl p-6 shadow-xl shadow-black/20 mb-8 min-h-[50vh]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">{activeTechnique}</h2>
                <p className="text-surface-400 text-sm mt-1">
                  {solvedCurrent} of {totalCurrent} problems solved
                </p>
              </div>
              
              {totalCurrent > 0 && (
                <div className="w-full sm:w-48 h-2 bg-surface-800 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${(solvedCurrent / totalCurrent) * 100}%` }}
                    className="h-full bg-gradient-to-r from-brand-500 to-accent-sky"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-surface-800">
              <div className="flex items-center gap-2 relative z-30">
                {/* Sort Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-surface-950 border border-surface-700 rounded-lg text-surface-300 hover:text-white transition-colors"
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
                      <div className="absolute left-0 mt-2 w-48 bg-surface-800 border border-surface-700 rounded-xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all">
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

                {/* Filter Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-surface-950 border border-surface-700 rounded-lg text-surface-300 hover:text-white transition-colors"
                  >
                    <span className="capitalize">{filterStatus} Problems</span>
                    <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isFilterDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsFilterDropdownOpen(false)}
                      />
                      <div className="absolute left-0 mt-2 w-40 bg-surface-800 border border-surface-700 rounded-xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all">
                        <div className="py-1">
                          {['all', 'solved', 'unsolved'].map(f => (
                            <button
                              key={f}
                              onClick={() => {
                                setFilterStatus(f);
                                setIsFilterDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-xs capitalize transition-colors ${filterStatus === f ? 'bg-brand-500/10 text-brand-400 font-bold' : 'text-surface-300 hover:bg-surface-700 hover:text-white'}`}
                            >
                              {f} Problems
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {filteredProblems.length === 0 ? (
                <div className="text-center py-12 text-surface-500 italic">
                  No problems match this filter.
                </div>
              ) : (
                filteredProblems.map((problem) => (
                <div
                  key={`${problem.level}-${problem.originalIndex}`}
                  className={`group relative flex items-center justify-between p-4 sm:p-5 bg-surface-800/50 rounded-2xl border transition-colors ${
                    problem.solved 
                      ? 'border-brand-500/30 bg-brand-500/5' 
                      : 'border-surface-700 hover:border-surface-600 hover:bg-surface-800'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <button
                      onClick={() => toggleProblemStatus(problem.level, problem.originalIndex, problem.solved)}
                      className={`flex-shrink-0 transition-transform active:scale-90 ${
                        problem.solved ? 'text-brand-500' : 'text-surface-600 hover:text-surface-500'
                      }`}
                    >
                      {problem.solved ? (
                        <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7" />
                      ) : (
                        <Circle className="w-6 h-6 sm:w-7 sm:h-7" />
                      )}
                    </button>
                    
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <a 
                          href={problem.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`font-semibold text-sm sm:text-base truncate transition-colors ${
                            problem.solved ? 'text-surface-300 line-through decoration-brand-500/50' : 'text-white hover:text-brand-400'
                          }`}
                        >
                          {problem.name}
                        </a>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-surface-900 text-surface-400 border border-surface-700">
                          {problem.topic}
                        </span>

                        {problem.difficulty && (
                          <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold border ${
                            problem.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            problem.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                            'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                            {problem.difficulty}
                          </span>
                        )}
                        
                        {problem.companies && problem.companies.length > 0 && (
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-xs font-medium bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
                            {problem.companies[0]} {problem.companies.length > 1 && `+${problem.companies.length - 1}`}
                          </span>
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
                        >
                          <YoutubeIcon className="w-5 h-5" />
                        </button>
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-800 text-surface-200 text-xs font-medium rounded opacity-0 group-hover/vidbtn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-surface-700 shadow-xl z-[60]">
                          Video Solution
                        </div>
                      </div>
                    )}
                    
                    {/* LeetCode link */}
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

                    {/* Bookmark Button */}
                    <div className={`relative group/bookmarkbtn flex items-center justify-center transition-all ${problem.doLater ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleDoLaterStatus(problem.level, problem.originalIndex, problem.doLater);
                        }}
                        className={`p-2 rounded-xl transition-colors ${problem.doLater ? 'text-amber-500 hover:text-amber-600' : 'text-surface-500 hover:text-amber-500 hover:bg-surface-800'}`}
                      >
                        <Bookmark className={`w-5 h-5 ${problem.doLater ? 'fill-current' : ''}`} />
                      </button>
                      <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-surface-800 text-surface-200 text-xs font-medium rounded opacity-0 group-hover/bookmarkbtn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-surface-700 shadow-xl z-[60]">
                        {problem.doLater ? 'Remove Bookmark' : 'Do Later'}
                      </div>
                    </div>
                  </div>
                </div>
              )))}
            </div>
          </div>
        </div>
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
