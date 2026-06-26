import React from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { BookOpen, CheckCircle2, ExternalLink, RotateCcw, ChevronDown, Layers, Target } from 'lucide-react';
import DSALoader from '../components/DSALoader';
import VideoModal from '../components/VideoModal';
import YoutubeIcon from '../components/YoutubeIcon';

export default function Revise() {
  const { data: levels, loading, toggleProblemStatus, toggleRevisionStatus, resetReviseProgress, resetTechniqueRevision } = useData();
  const { user } = useAuth();

  const [viewMode, setViewMode] = React.useState('phase'); // 'phase' or 'technique'
  const [selectedLevel, setSelectedLevel] = React.useState(null);
  const [selectedTechnique, setSelectedTechnique] = React.useState(null);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = React.useState(false);
  
  const [videoModalConfig, setVideoModalConfig] = React.useState({
    isOpen: false,
    videoId: null,
    problemName: ''
  });

  // Filter levels to only include those with at least one solved problem
  const solvedLevels = React.useMemo(() => levels.map(level => {
    return {
      ...level,
      solvedProblems: level.problems
        .map((p, index) => ({ ...p, level: level.level, originalIndex: index }))
        .filter(p => p.solved)
    };
  }).filter(level => level.solvedProblems.length > 0), [levels]);

  // Set initial selected level
  React.useEffect(() => {
    if (solvedLevels.length > 0 && selectedLevel === null) {
      setSelectedLevel(solvedLevels[0].level);
    }
  }, [solvedLevels, selectedLevel]);

  // Group solved problems by technique
  const solvedTechniquesMap = React.useMemo(() => {
    if (!levels) return new Map();
    const map = new Map();
    levels.forEach(level => {
      level.problems.forEach((p, index) => {
        if (!p.solved) return;
        const problemObj = { ...p, level: level.level, originalIndex: index };
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
  }, [levels]);

  const solvedTechniques = React.useMemo(() => Array.from(solvedTechniquesMap.keys()).sort(), [solvedTechniquesMap]);

  React.useEffect(() => {
    if (solvedTechniques.length > 0 && selectedTechnique === null) {
      setSelectedTechnique(solvedTechniques[0]);
    }
  }, [solvedTechniques, selectedTechnique]);

  const activeLevel = solvedLevels.find(l => l.level === selectedLevel) || solvedLevels[0];
  const activeTechniqueProblems = selectedTechnique ? solvedTechniquesMap.get(selectedTechnique) : [];

  const currentProblems = viewMode === 'phase' 
    ? (activeLevel ? activeLevel.solvedProblems : [])
    : (activeTechniqueProblems || []);

  const filteredProblems = currentProblems.filter(p => {
    if (filterStatus === 'revised' && !p.revised) return false;
    if (filterStatus === 'needs revision' && p.revised) return false;
    return true;
  });

  const handleConfirmReset = () => {
    if (viewMode === 'phase' && activeLevel) {
      resetReviseProgress(activeLevel.level);
    } else if (viewMode === 'technique' && selectedTechnique) {
      resetTechniqueRevision(selectedTechnique);
    }
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
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80"
            onClick={() => setShowConfirm(false)}
          />
          <div 
            className="relative bg-surface-900 border border-surface-700 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Reset {viewMode === 'phase' ? `Phase ${activeLevel?.level}` : selectedTechnique}?
                </h3>
                <p className="text-sm text-surface-400 mt-1">This will un-check all items you have marked as revised in this {viewMode}.</p>
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
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-300 mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Revise Mode
          </div>
          <h1 className="text-3xl font-bold mb-2">Review Your Progress</h1>
          <p className="text-surface-400">Revisit the problems you've already solved, organized by phase or technique.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-surface-900 border border-surface-700 p-1.5 rounded-xl shadow-lg shadow-black/20">
            <button
              onClick={() => setViewMode('phase')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'phase' 
                  ? 'bg-brand-500 text-white shadow-md' 
                  : 'text-surface-400 hover:text-white hover:bg-surface-800'
              }`}
            >
              <Target className="w-4 h-4" />
              Phase
            </button>
            <button
              onClick={() => setViewMode('technique')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'technique' 
                  ? 'bg-brand-500 text-white shadow-md' 
                  : 'text-surface-400 hover:text-white hover:bg-surface-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              Technique
            </button>
          </div>

          {(
            (viewMode === 'phase' && solvedLevels.length > 0 && activeLevel) || 
            (viewMode === 'technique' && solvedTechniques.length > 0 && selectedTechnique)
          ) && (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-surface-800 text-surface-200 hover:bg-surface-700 hover:text-white rounded-xl font-bold transition-all border border-surface-700 hover:border-surface-600 shadow-sm"
              title={`Reset revision progress for ${viewMode === 'phase' ? `Phase ${activeLevel.level}` : selectedTechnique}`}
            >
              <RotateCcw className="w-4 h-4 text-brand-400" />
              Reset {viewMode === 'phase' ? `Phase ${activeLevel.level}` : 'Technique'}
            </button>
          )}
        </div>
      </div>

      {solvedLevels.length === 0 ? (
        <div 
          className="bg-surface-800/50 border border-surface-700 rounded-2xl p-12 text-center"
        >
          <CheckCircle2 className="w-16 h-16 text-surface-600 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No problems solved yet</h3>
          <p className="text-surface-400 max-w-md mx-auto">
            Start solving problems in the Roadmap to see them appear here for revision.
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Side Navigation */}
          <div className="lg:w-1/3 xl:w-1/4 flex-shrink-0">
            <div className="sticky top-28 flex flex-col gap-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-2 px-2">
                {viewMode === 'phase' ? 'Your Phases' : 'Your Techniques'}
              </h2>
              {viewMode === 'phase' ? (
                solvedLevels.map(level => (
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
                ))
              ) : (
                solvedTechniques.map(tech => {
                  const count = solvedTechniquesMap.get(tech).length;
                  return (
                    <button
                      key={tech}
                      onClick={() => setSelectedTechnique(tech)}
                      className={`text-left flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        selectedTechnique === tech
                          ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-lg shadow-brand-500/5'
                          : 'bg-transparent text-surface-400 hover:bg-surface-800 hover:text-white border border-transparent'
                      }`}
                    >
                      <span className="truncate pr-2 capitalize">{tech}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedTechnique === tech ? 'bg-brand-500/20 text-brand-300' : 'bg-surface-800 text-surface-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {((viewMode === 'phase' && activeLevel) || (viewMode === 'technique' && selectedTechnique)) && (
              <div
                className="bg-surface-800 border border-surface-700 rounded-2xl overflow-hidden"
              >
                <div className="bg-surface-800 border-b border-surface-700 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {viewMode === 'phase' ? (
                      <>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/10 text-brand-400 font-bold text-sm">
                          {activeLevel.level}
                        </div>
                        <h2 className="text-lg font-bold">{activeLevel.goal}</h2>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-sky/10 text-accent-sky font-bold text-sm">
                          <Layers className="w-4 h-4" />
                        </div>
                        <h2 className="text-lg font-bold capitalize">{selectedTechnique}</h2>
                      </>
                    )}
                  </div>

                  <div className="relative z-30">
                    <button 
                      onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-surface-900 border border-surface-700 rounded-lg text-surface-300 hover:text-white hover:border-surface-600 transition-colors"
                    >
                      <span className="capitalize">{filterStatus === 'needs revision' ? 'Needs Revision' : filterStatus}</span>
                      <ChevronDown className={`w-4 h-4 opacity-70 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isFilterDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsFilterDropdownOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-surface-800 border border-surface-700 rounded-xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all">
                          <div className="py-1">
                            {['all', 'revised', 'needs revision'].map(f => (
                              <button
                                key={f}
                                onClick={() => {
                                  setFilterStatus(f);
                                  setIsFilterDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm capitalize transition-colors ${filterStatus === f ? 'bg-brand-500/10 text-brand-400 font-bold' : 'text-surface-300 hover:bg-surface-700 hover:text-white'}`}
                              >
                                {f === 'needs revision' ? 'Needs Revision' : f}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="p-4 md:p-6">
                  <div className="flex flex-col gap-3">
                    {filteredProblems.length === 0 ? (
                      <div className="text-center py-8 text-surface-400">
                        No problems match this filter.
                      </div>
                    ) : (
                      filteredProblems.map((problem, pIdx) => (
                        <div
                          key={pIdx}
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
                                toggleRevisionStatus(problem.level, problem.originalIndex, problem.revised);
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
                                
                                {viewMode === 'technique' && (
                                  <span className="text-[10px] font-bold text-surface-400 bg-surface-800 px-1.5 py-0.5 rounded">
                                    Phase {problem.level}
                                  </span>
                                )}
                                
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
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
