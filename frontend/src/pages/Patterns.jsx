import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ExternalLink, CheckCircle, Circle, LibraryBig, Code2 } from 'lucide-react';
import DSALoader from '../components/DSALoader';
import VideoModal from '../components/VideoModal';
import YoutubeIcon from '../components/YoutubeIcon';

export default function Patterns() {
  const { data, loading, error, toggleProblemStatus } = useData();
  const [activeTechnique, setActiveTechnique] = useState(null);
  
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

  if (loading || !data || data.length === 0) {
    return <DSALoader message="Loading Pattern View..." />;
  }
  if (error) {
    return <div className="p-12 text-center text-red-500">{error}</div>;
  }

  const currentProblems = activeTechnique ? techniquesMap.get(activeTechnique) || [] : [];
  const totalCurrent = currentProblems.length;
  const solvedCurrent = currentProblems.filter(p => p.solved).length;

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

            <div className="space-y-3">
              {currentProblems.map((problem) => (
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
                        <ExternalLink className="w-3.5 h-3.5 text-surface-500 hidden sm:block" />
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-surface-900 text-surface-400 border border-surface-700">
                          {problem.topic}
                        </span>
                        
                        {problem.companies && problem.companies.length > 0 && (
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-xs font-medium bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
                            {problem.companies[0]} {problem.companies.length > 1 && `+${problem.companies.length - 1}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Video Button */}
                    {(problem.videoId || problem.name) && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setVideoModalConfig({
                            isOpen: true,
                            videoId: problem.videoId || null,
                            problemName: problem.name
                          });
                        }}
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors group/video ${
                          problem.videoId 
                            ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' 
                            : 'text-surface-400 hover:bg-surface-700 hover:text-surface-300 opacity-0 group-hover:opacity-100'
                        }`}
                        title="Video Solution"
                      >
                        <YoutubeIcon className={`w-5 h-5 ${problem.videoId ? '' : 'text-surface-400 group-hover/video:text-surface-300'}`} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {currentProblems.length === 0 && (
                <div className="text-center py-12 text-surface-400">
                  No problems found for this technique.
                </div>
              )}
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
