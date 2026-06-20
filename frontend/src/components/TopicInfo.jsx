import { motion } from 'framer-motion';
import { Info, Lightbulb, Target, Code, Eye, Coffee } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useData } from '../context/DataContext';

const SectionLabel = ({ icon: Icon, textColor, label }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <Icon className={`w-5 h-5 ${textColor}`} />
    <span className={`text-xs font-bold uppercase tracking-widest ${textColor}`}>{label}</span>
  </div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } },
};

// Animations stay in frontend — keyed by topic name
const animations = {
  "Arrays": () => (
    <div className="flex gap-2 p-4 justify-center items-center">
      {[10, 20, 30, 40, 50].map((num, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15, type: 'spring' }} className="flex flex-col items-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-800 border-2 border-emerald-500 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]">{num}</div>
          <span className="text-xs text-zinc-500 mt-2">[{i}]</span>
        </motion.div>
      ))}
    </div>
  ),
  "Dynamic Programming": () => (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="flex gap-2">
        {[1, 1, 2, 3, 5, 8].map((num, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.5, backgroundColor: "#27272a" }} animate={{ opacity: 1, scale: 1, backgroundColor: i > 1 ? "#10b981" : "#27272a" }} transition={{ delay: i * 0.5, duration: 0.5 }} className="w-8 h-8 sm:w-10 sm:h-10 rounded flex items-center justify-center font-bold text-white border border-zinc-700">{num}</motion.div>
        ))}
      </div>
      <p className="text-xs text-zinc-400 italic text-center">Reusing previous states to compute the next.</p>
    </div>
  ),
  "Trees": () => (
    <div className="relative h-40 w-full flex justify-center py-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="absolute top-2 w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center z-10 font-bold text-white border-2 border-zinc-900">1</motion.div>
      <motion.div initial={{ opacity: 0, x: 20, y: -20 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 0.5 }} className="absolute top-16 -ml-20 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center z-10 font-bold text-white border-2 border-zinc-900">2</motion.div>
      <motion.div initial={{ opacity: 0, x: -20, y: -20 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 0.8 }} className="absolute top-16 ml-20 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center z-10 font-bold text-white border-2 border-zinc-900">3</motion.div>
      <svg className="absolute top-7 w-40 h-16" style={{ left: '50%', transform: 'translateX(-50%)' }}>
        <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.5 }} x1="50%" y1="0" x2="25%" y2="100%" stroke="#10b981" strokeWidth="2" />
        <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.8, duration: 0.5 }} x1="50%" y1="0" x2="75%" y2="100%" stroke="#10b981" strokeWidth="2" />
      </svg>
    </div>
  ),
  "Linked List": () => (
    <div className="flex gap-2 sm:gap-4 p-4 justify-center items-center">
      {[1, 2, 3].map((num, i) => (
        <div key={i} className="flex items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.4 }} className="flex items-stretch bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 h-10">
            <div className="px-2 sm:px-3 flex items-center justify-center border-r border-zinc-700 text-emerald-400 font-bold">{num}</div>
            <div className="px-1 sm:px-2 flex items-center justify-center bg-zinc-900 text-[10px] text-zinc-500">next</div>
          </motion.div>
          {i < 2 && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 20 }} transition={{ delay: (i * 0.4) + 0.2 }} className="flex items-center mx-1 sm:mx-2">
              <div className="h-0.5 bg-emerald-500 w-full relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-emerald-500 rotate-45 transform origin-center"></div>
              </div>
            </motion.div>
          )}
        </div>
      ))}
    </div>
  ),
  "Graphs": () => (
    <div className="relative h-40 w-full flex justify-center py-4">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="absolute top-4 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center z-10 font-bold text-white border border-zinc-900">A</motion.div>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }} className="absolute top-24 -ml-16 w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center z-10 font-bold text-white border border-zinc-900">B</motion.div>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.0 }} className="absolute top-24 ml-16 w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center z-10 font-bold text-white border border-zinc-900">C</motion.div>
      <svg className="absolute top-4 w-40 h-28" style={{ left: '50%', transform: 'translateX(-50%)' }}>
        <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4 }} x1="50%" y1="16" x2="20%" y2="80" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
        <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.8 }} x1="20%" y1="80" x2="80%" y2="80" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
        <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.2 }} x1="80%" y1="80" x2="50%" y2="16" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
      </svg>
    </div>
  ),
  "Strings": () => (
    <div className="flex gap-1 p-4 justify-center items-center">
      {['l', 'e', 'e', 't', 'c', 'o', 'd', 'e'].map((char, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, color: i % 2 === 0 ? '#34d399' : '#a1a1aa' }} transition={{ delay: i * 0.1 }} className="w-8 h-10 bg-zinc-900 border border-zinc-700 rounded flex items-center justify-center font-mono font-bold">{char}</motion.div>
      ))}
    </div>
  ),
  "Sorting & Searching": () => {
    const arr = [2, 5, 8, 12, 16]; const targetIdx = 3;
    return (
      <div className="flex gap-2 p-4 justify-center items-center">
        {arr.map((num, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0, scale: i === targetIdx ? 1.2 : 1 }} transition={{ delay: i * 0.15, type: 'spring' }} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white border-2 ${i === targetIdx ? 'border-yellow-400 bg-yellow-900/40' : 'border-emerald-500 bg-zinc-800'}`}>{num}</div>
            <span className="text-xs text-zinc-500 mt-1">[{i}]</span>
          </motion.div>
        ))}
      </div>
    );
  },
  "Math & Bit Manipulation": () => {
    const bits = [0, 1, 0, 1, 1, 0, 0, 1];
    return (
      <div className="flex gap-1 p-4 justify-center items-center">
        {bits.map((bit, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1, backgroundColor: bit ? '#10b981' : '#27272a' }} transition={{ delay: i * 0.1, type: 'spring' }} className="w-8 h-10 rounded flex items-center justify-center font-mono font-bold text-white border border-zinc-700">{bit}</motion.div>
        ))}
      </div>
    );
  },
  "Misc / General": () => {
    const items = ['Stack', 'Queue', 'HashMap', 'Greedy', 'Deque'];
    const colors = ['#10b981', '#14b8a6', '#f59e0b', '#6366f1', '#ec4899'];
    return (
      <div className="flex gap-2 p-4 justify-center items-center flex-wrap">
        {items.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15, type: 'spring' }} className="px-3 py-2 rounded-lg border-2 font-bold text-xs text-white" style={{ borderColor: colors[i], backgroundColor: `${colors[i]}22` }}>{item}</motion.div>
        ))}
      </div>
    );
  },
  "Java": () => {
    const items = [{ label: 'int[]', color: '#10b981' }, { label: 'HashMap', color: '#14b8a6' }, { label: 'PQ', color: '#f59e0b' }, { label: 'Deque', color: '#6366f1' }, { label: 'Set', color: '#ec4899' }];
    return (
      <div className="flex gap-2 p-4 justify-center items-center flex-wrap">
        {items.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.2, type: 'spring' }} className="px-3 py-2 rounded-lg border-2 font-bold text-xs text-white" style={{ borderColor: item.color, backgroundColor: `${item.color}22` }}>{item.label}</motion.div>
        ))}
      </div>
    );
  },
  "default": () => (
    <div className="flex items-center justify-center h-24">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  ),
};

function getAnimation(topic) {
  const keys = Object.keys(animations).filter(k => k !== 'default');
  const match =
    keys.find(k => k.toLowerCase() === topic.toLowerCase()) ||
    keys.find(k => topic.toLowerCase().includes(k.toLowerCase())) ||
    keys.find(k => k.toLowerCase().includes(topic.toLowerCase()));
  return animations[match] || animations['default'];
}

export default function TopicInfo({ topic }) {
  const { topicInfo, loading } = useData();

  // Find the matching topic data from the context
  const keys = Object.keys(topicInfo);
  const match =
    keys.find(k => k.toLowerCase() === topic.toLowerCase()) ||
    keys.find(k => topic.toLowerCase().includes(k.toLowerCase())) ||
    keys.find(k => k.toLowerCase().includes(topic.toLowerCase()));
  const data = match ? topicInfo[match] : null;

  // Show a loading skeleton if the main context is still loading
  if (loading && Object.keys(topicInfo).length === 0) {
    return <div className="glass-panel mb-10 h-96 animate-pulse" />;
  }

  // If no topic is selected or found, don't render anything
  if (!topic || !data) {
    return null;
  }

  const Animation = getAnimation(topic);
  const language = topic.toLowerCase() === 'java' ? 'java' : 'javascript';

  return (
    <div className="glass-panel mb-10 overflow-hidden">
      <div className="h-1 w-full premium-bar-gradient" />

      <motion.div className="p-7 space-y-8" variants={containerVariants} initial="hidden" animate="visible">

        {/* Overview */}
        <motion.section variants={itemVariants}>
          <SectionLabel icon={Info} label="Overview" textColor="text-brand-300" />
          <p className="text-surface-300 text-sm leading-7">{data.description}</p>
        </motion.section>

        <motion.div variants={itemVariants} className="border-t border-white/10" />

        {/* Visualization */}
        <motion.section variants={itemVariants}>
          <SectionLabel icon={Eye} label="Visualization" textColor="text-accent-sky" />
          <div className="bg-surface-950/70 rounded-xl border border-white/10 flex items-center justify-center py-4">
            <Animation />
          </div>
        </motion.section>

        <motion.div variants={itemVariants} className="border-t border-white/10" />

        {/* When to Use + Tips */}
        <motion.section variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <SectionLabel icon={Target} label="When to Use" textColor="text-accent-sky" />
            <ul className="space-y-3">
              {data.whereToUse.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-surface-400 leading-relaxed">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent-sky flex-shrink-0" />{item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionLabel icon={Lightbulb} label="Tips & Tricks" textColor="text-accent-amber" />
            <ul className="space-y-3">
              {data.tips.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-surface-400 leading-relaxed">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent-amber flex-shrink-0" />{item}
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        {/* Java Cheatsheet */}
        {data.javaTechniques && (
          <>
            <motion.div variants={itemVariants} className="border-t border-white/10" />
            <motion.section variants={itemVariants}>
              <SectionLabel icon={Coffee} label="Java Cheatsheet" textColor="text-orange-400" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-surface-500 font-semibold mb-3">Data Types</p>
                  <div className="flex flex-wrap gap-2">
                    {data.javaTechniques.dataTypes.map((dt, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/10 text-brand-200 text-xs font-mono rounded-lg">{dt}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-surface-500 font-semibold mb-3">Solving Techniques</p>
                  <div className="flex flex-wrap gap-2">
                    {data.javaTechniques.techniques.map((t, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/10 text-accent-violet text-xs font-mono rounded-lg">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          </>
        )}

        <motion.div variants={itemVariants} className="border-t border-white/10" />

        {/* Code Example */}
        <motion.section variants={itemVariants}>
          <SectionLabel icon={Code} label="Code Example" textColor="text-purple-400" />
          <div className="bg-surface-950/70 rounded-xl border border-white/10 overflow-x-auto">
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              customStyle={{ background: 'transparent', padding: '1.25rem', margin: 0 }}
              codeTagProps={{ className: 'text-xs font-mono leading-6' }}
            >
              {String(data.example).trim()}
            </SyntaxHighlighter>
          </div>
        </motion.section>

      </motion.div>
    </div>
  );
}
