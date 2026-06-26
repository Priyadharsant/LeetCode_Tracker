import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';
import { Brain, Gauge, Network, Sparkles } from 'lucide-react';
import DSALoader from '../components/DSALoader';

export default function TechniqueWise() {
  const { getTechniqueData, loading, error } = useData();

  if (loading) {
    return <DSALoader message="Loading techniques..." />;
  }
  if (error) {
    return <div className="p-12 text-center text-red-500">{error}</div>;
  }

  const topics = getTechniqueData();
  const uniqueProblems = new Map();
  topics.forEach(t => {
    t.problems.forEach(p => {
      uniqueProblems.set(`${p.originalLevel}-${p.originalIndex}`, p);
    });
  });
  const totalProblems = uniqueProblems.size;
  const solvedProblems = Array.from(uniqueProblems.values()).filter(p => p.solved).length;
  const totalAssignments = topics.reduce((sum, t) => sum + t.problems.length, 0);
  const strongest = [...topics]
    .map(t => ({
      ...t,
      progress: t.problems.length === 0 ? 0 : (t.problems.filter(p => p.solved).length / t.problems.length) * 100
    }))
    .sort((a, b) => b.progress - a.progress || b.problems.length - a.problems.length)[0];

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12">
      <div className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-300 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Multi-pattern map
          </div>
          <h1 className="text-3xl font-bold mb-2">Technique Wise Practice</h1>
          <p className="text-surface-400 max-w-2xl">
            Problems are assigned to every matching technique, so one question can train multiple patterns.
          </p>
          <p className="text-xs text-surface-600 mt-2">
            {totalProblems} unique problems, {totalAssignments} technique links.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          <div className="surface-tile px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-surface-500 mb-1">
              <Brain className="w-3.5 h-3.5 text-brand-300" />
              Techniques
            </div>
            <div className="text-2xl font-extrabold text-white">{topics.length}</div>
          </div>
          <div className="surface-tile px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-surface-500 mb-1">
              <Network className="w-3.5 h-3.5 text-accent-sky" />
              Problems
            </div>
            <div className="text-2xl font-extrabold text-white">{solvedProblems}/{totalProblems}</div>
          </div>
          <div className="surface-tile px-4 py-3 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-xs text-surface-500 mb-1">
              <Gauge className="w-3.5 h-3.5 text-accent-amber" />
              Strongest
            </div>
            <div className="text-sm font-bold text-white truncate">{strongest?.topic || 'None yet'}</div>
          </div>
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="text-center text-zinc-500 py-10">No technique problems found yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((t) => {
            const total = t.problems.length;
            const solved = t.problems.filter(p => p.solved).length;
            const progress = total === 0 ? 0 : (solved / total) * 100;
            const isComplete = progress === 100;

            return (
              <div key={t.topic}>
                <Link 
                  to={`/techniques/${encodeURIComponent(t.topic)}`}
                  className={`glass-panel block h-full p-6 group overflow-hidden relative transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(22,183,157,0.12)] ${
                    isComplete ? 'border-brand-500/30 bg-brand-500/[0.02]' : 'hover:border-brand-500/30 hover:bg-surface-900/80'
                  }`}
                >
                  {/* Subtle Background Glow on Hover */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/20 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Top Gradient Border */}
                  <div className={`absolute inset-x-0 top-0 h-[2px] opacity-70 transition-colors ${
                    isComplete ? 'bg-brand-400' : 'bg-gradient-to-r from-surface-700 via-surface-600 to-surface-700 group-hover:from-brand-500 group-hover:via-accent-sky group-hover:to-brand-400'
                  }`} />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-6">
                      <div className="flex items-center gap-2">
                        {isComplete && <Sparkles className="w-4 h-4 text-brand-300" />}
                        <h2 className="text-lg font-bold text-surface-100 group-hover:text-brand-300 transition-colors">{t.topic}</h2>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider border rounded-full px-2.5 py-0.5 transition-colors ${
                        isComplete ? 'text-brand-300 border-brand-500/30 bg-brand-500/10' : 'text-surface-400 border-white/10 bg-surface-950 group-hover:border-brand-500/20'
                      }`}>
                        {t.problems.length} PROB
                      </span>
                    </div>

                    {/* Progress Stats */}
                    <div className="flex justify-between text-sm text-surface-400 mb-2 font-medium">
                      <span>{solved} / {total} Solved</span>
                      <span className={isComplete ? 'text-brand-300' : 'group-hover:text-brand-200'}>{progress.toFixed(0)}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-surface-950 rounded-full overflow-hidden mb-6 ring-1 ring-white/5">
                      <div 
                        style={{ width: `${progress}%` }}
                        className={`h-full rounded-full ${
                          isComplete ? 'bg-brand-400 shadow-[0_0_10px_rgba(56,204,177,0.5)]' : 'bg-gradient-to-r from-surface-600 to-brand-500'
                        }`}
                      />
                    </div>

                    {/* Problem Tags */}
                    <div className="mt-auto">
                      <p className="text-[10px] uppercase tracking-widest text-surface-600 mb-2 font-semibold">Sample Problems</p>
                      <div className="flex flex-wrap gap-2">
                        {[...t.problems].sort((a, b) => (a.solved === b.solved ? 0 : a.solved ? 1 : -1)).slice(0, 3).map(p => (
                          <span
                            key={`${p.originalLevel}-${p.originalIndex}-${p.name}`}
                            className={`max-w-full truncate rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                              p.solved 
                                ? 'bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20 line-through decoration-brand-500/40 opacity-70' 
                                : 'bg-surface-950 text-surface-300 ring-1 ring-white/10 group-hover:ring-white/20'
                            }`}
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
