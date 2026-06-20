import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';
import { Target, Sparkles, BookOpen, Layers, Activity, Brain, Network, Compass, ArrowRight, Code, CheckCircle } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import RadialProgress from '../components/RadialProgress';
import RecentProblems from '../components/RecentProblems';
import Heatmap from '../components/Heatmap';
import StreakCard from '../components/StreakCard';
import Sparkline from '../components/Sparkline';
import DSALoader from '../components/DSALoader';

export default function Dashboard() {
  const { data, getTopicData, getTechniqueData, loading, error } = useData();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const nextProblem = useMemo(() => {
    for (const lvl of data) {
      const unsolved = lvl.problems.find(p => !p.solved);
      if (unsolved) return { ...unsolved, level: lvl.level };
    }
    return null;
  }, [data]);

  const solvedDates = useMemo(() => {
    if (!data) return [];
    return data.flatMap(l => l.problems.map(p => p.solvedAt).filter(Boolean));
  }, [data]);

  const trendData = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().slice(0, 10);
    });
    return last14Days.map(dateStr => solvedDates.filter(d => d.slice(0, 10) === dateStr).length);
  }, [solvedDates]);

  if (loading) {
    return <DSALoader message="Loading workspace..." />;
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass-panel p-6 text-center text-red-400">
          <Activity className="w-8 h-8 mx-auto mb-2" />
          {error}
        </div>
      </div>
    );
  }

  const totalProblems = data.reduce((acc, level) => acc + level.problems.length, 0);
  const totalSolved = data.reduce((acc, level) => acc + level.problems.filter(p => p.solved).length, 0);
  const overallProgress = totalProblems === 0 ? 0 : (totalSolved / totalProblems) * 100;
  const topicStats = getTopicData()
    .map(t => {
      const solved = t.problems.filter(p => p.solved).length;
      const total = t.problems.length;
      return { name: t.topic, solved, total, progress: total === 0 ? 0 : (solved / total) * 100 };
    })
    .sort((a, b) => b.total - a.total);
  const techniqueStats = getTechniqueData()
    .map(t => {
      const solved = t.problems.filter(p => p.solved).length;
      const total = t.problems.length;
      return { name: t.topic, solved, total, progress: total === 0 ? 0 : (solved / total) * 100 };
    })
    .sort((a, b) => b.total - a.total);
  const techniqueAssignments = techniqueStats.reduce((sum, t) => sum + t.total, 0);
  const maxTopicTotal = Math.max(...topicStats.map(t => t.total), 1);
  const maxTechniqueTotal = Math.max(...techniqueStats.map(t => t.total), 1);

  const todayKey = new Date().toISOString().slice(0, 10);
  const solvedToday = solvedDates.filter(d => d.slice(0, 10) === todayKey).length;
  
  let currentLevel = data[0]?.level || 1;
  let currentLevelGoal = data[0]?.goal || '';
  for (const lvl of data) {
    const lSolved = lvl.problems.filter(p => p.solved).length;
    if (lSolved < lvl.problems.length) {
      currentLevel = lvl.level;
      currentLevelGoal = lvl.goal;
      break;
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] border border-white/10 rounded-full text-brand-300 mb-4 text-xs font-semibold uppercase tracking-widest shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            {greeting}, Developer
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Command Center</h1>
          <p className="text-surface-400 max-w-xl text-lg leading-relaxed">
            Monitor your DSA journey, identify patterns, and systematically conquer your interview prep.
          </p>
        </div>
      </motion.div>

      {/* Suggested Next Problem Banner */}
      {nextProblem && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="mb-8 bg-gradient-to-r from-brand-900/40 via-surface-900 to-surface-900 border border-brand-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-brand-900/10 relative overflow-hidden"
        >
          <div className="absolute -left-12 -top-12 w-32 h-32 bg-brand-500/20 blur-[50px] rounded-full"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-surface-400 text-xs font-bold uppercase tracking-wider mb-1">Up Next • Level {nextProblem.level}</h3>
              <div className="text-white font-semibold flex flex-wrap items-center gap-2">
                {nextProblem.title}
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  nextProblem.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  nextProblem.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                  'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {nextProblem.difficulty}
                </span>
              </div>
            </div>
          </div>
          <Link
            to="/levels"
            className="shrink-0 relative z-10 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40"
          >
            Solve Problem
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="metric-panel flex flex-col justify-between items-center text-center group">
          <div className="panel-title relative z-10 mb-4 group-hover:text-brand-300 transition-colors">Total Completion</div>
          <RadialProgress value={overallProgress} size={130} stroke={10} />
          <div className="relative z-10 mt-4 text-sm text-surface-500 font-medium">
            <span className="text-white font-bold text-base mr-1">{totalSolved}</span> of {totalProblems} solved
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="metric-panel flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-surface-400 mb-2 text-sm font-medium">
              <Target className="w-4 h-4 text-accent-amber" />
              Current Focus
            </div>
            <div className="text-2xl font-bold text-white mt-1">Level {currentLevel}</div>
            <p className="text-sm text-surface-500 mt-2 line-clamp-2">{currentLevelGoal}</p>
          </div>
          <div className="relative z-10 mt-6 pt-4 border-t border-white/10">
            <div className="text-xs text-surface-400 flex justify-between">
              <span>Overall Progress</span>
              <span className="text-brand-300 font-bold">{overallProgress.toFixed(1)}%</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="metric-panel flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
             <div className="flex items-center gap-2 text-surface-400 mb-2 text-sm font-medium">
              <Activity className="w-4 h-4 text-accent-sky" />
              Daily Output
            </div>
            <div className="text-4xl font-extrabold text-white mt-2">{solvedToday}</div>
            <p className="text-sm text-surface-500 mt-2">Problems solved today</p>
          </div>
          <div className="absolute -bottom-4 -right-4 opacity-40 group-hover:opacity-60 transition-opacity z-0 pointer-events-none">
             <Sparkline data={trendData} width={160} height={80} stroke="#0ea5e9" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="h-full">
          <StreakCard dates={solvedDates} />
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Heatmap data={solvedDates} days={365} />
          
          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-6">
              <Layers className="w-5 h-5 text-accent-amber" />
              <h3 className="text-lg font-semibold text-white">Curriculum Progress</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map((lvl) => {
                const lTotal = lvl.problems.length;
                const lSolved = lvl.problems.filter(p => p.solved).length;
                const lProg = lTotal === 0 ? 0 : (lSolved / lTotal) * 100;
                const isComplete = lProg === 100;

                return (
                  <div key={lvl.level} className={`surface-tile p-4 transition-all duration-500 ${isComplete ? 'border-brand-500/20 bg-brand-500/[0.02]' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`text-sm font-bold ${isComplete ? 'text-brand-300' : 'text-surface-200'}`}>Level {lvl.level}</div>
                        {isComplete && <CheckCircle className="w-3.5 h-3.5 text-brand-400" />}
                      </div>
                      <div className="text-xs font-mono text-surface-500">{lSolved}/{lTotal}</div>
                    </div>
                    <div className="w-full bg-surface-800/80 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isComplete ? 'bg-brand-400' : 'premium-bar-gradient'}`}
                        style={{ width: `${lProg}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="glass-panel p-6 overflow-hidden flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-cyan-300" />
                <h3 className="text-lg font-semibold text-white">Topic Terrain</h3>
              </div>
              <div className="text-xs font-semibold uppercase tracking-widest text-surface-500">
                {topicStats.length} topics
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topicStats.slice(0, 12).map((topic, idx) => (
                <motion.div
                  key={topic.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="surface-tile p-4 group"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm font-bold text-surface-200 group-hover:text-cyan-300 transition-colors truncate pr-2" title={topic.name}>{topic.name}</div>
                    <div className="text-xs font-mono text-surface-400 shrink-0">
                      <span className="text-white font-medium">{topic.solved}</span>/{topic.total}
                    </div>
                  </div>
                  <div className="w-full bg-surface-800 rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.progress}%` }}
                      transition={{ duration: 1, delay: 0.1 + idx * 0.05 }}
                      className="premium-bar-gradient h-full rounded-full" 
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <RecentProblems limit={7} />

          <div className="glass-panel p-6 flex-1">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Technique Matrix</h3>
              </div>
              <span className="text-xs font-bold text-surface-500">{totalProblems} problems</span>
            </div>
            <div className="mb-5 rounded-lg border border-white/10 bg-surface-950/70 px-3 py-2 text-xs text-surface-500">
              Multi-tagged as {techniqueAssignments} technique links.
            </div>

            <div className="space-y-3">
              {techniqueStats.slice(0, 6).map((technique, idx) => (
                <motion.div
                  key={technique.name}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-2">
                      <Network className="w-3.5 h-3.5 text-surface-600 group-hover:text-brand-300 transition-colors" />
                      <span className="truncate text-sm font-medium text-surface-300" title={technique.name}>{technique.name}</span>
                    </div>
                    <span className="text-xs tabular-nums text-surface-500">{technique.solved}/{technique.total}</span>
                  </div>
                  <div className="relative h-3 rounded-full bg-surface-950/90 border border-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(4, (technique.total / maxTechniqueTotal) * 100)}%` }}
                      transition={{ duration: 1, delay: 0.2 + idx * 0.04 }}
                      className="absolute inset-y-0 left-0 rounded-full bg-surface-800/80"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${technique.progress}%` }}
                      transition={{ duration: 1.2, delay: 0.25 + idx * 0.04 }}
                      className="absolute inset-y-0 left-0 rounded-full premium-bar-gradient"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <Link to="/techniques" className="text-xs font-semibold uppercase tracking-widest text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1">
                View All Techniques <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Level Master Detailed Section */}
      <div className="mt-16">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-6 h-6 text-brand-400" />
          <h2 className="text-2xl font-bold text-white tracking-tight">Level Details</h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {data.map((levelObj, i) => {
            const lTotal = levelObj.problems.length;
            const lSolved = levelObj.problems.filter(p => p.solved).length;
            const lProg = lTotal === 0 ? 0 : (lSolved / lTotal) * 100;
            const isComplete = lProg === 100;

            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                key={levelObj.level}
                className={`group glass-panel p-6 relative overflow-hidden transition-all duration-300 ${isComplete ? 'border-brand-400/30 shadow-brand-500/5' : 'hover:border-brand-400/20'}`}
              >
                {isComplete && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl group-hover:bg-brand-500/10 transition-all"></div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 relative z-10">
                  <div className="max-w-[75%]">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-xl font-bold ${isComplete ? 'text-brand-400' : 'text-white'}`}>
                        Level {levelObj.level}
                      </h3>
                      {isComplete && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-brand-500/10 text-brand-300 rounded ring-1 ring-brand-500/20">
                          Mastered
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-surface-400 leading-relaxed">{levelObj.goal}</p>
                  </div>
                  
                  <div className="text-right sm:text-center shrink-0">
                    <div className="text-2xl font-extrabold text-white">
                      {lSolved}<span className="text-base text-surface-500 font-medium">/{lTotal}</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-wider mb-2">
                    <span className="text-surface-500">Progress</span>
                    <span className={isComplete ? 'text-brand-400' : 'text-surface-300'}>{lProg.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-surface-800/80 rounded-full h-2 overflow-hidden ring-1 ring-inset ring-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${lProg}%` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 + (i * 0.1) }}
                      className={`h-full rounded-full ${isComplete ? 'bg-brand-400' : 'premium-bar-gradient'}`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
