import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Map, CheckCircle, Code } from 'lucide-react';
import DSALoader from '../components/DSALoader';

export default function Roadmap() {
  const { data, loading, error } = useData();

  if (loading) return <DSALoader message="Loading Roadmap..." />;
  if (error) return <div className="text-center mt-20 text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-surface-800 border border-surface-700 mb-4">
          <Map className="w-8 h-8 text-brand-500" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">DSA Roadmap</h1>
        <p className="text-surface-400 max-w-2xl mx-auto">
          Follow this 10-phase structured path to master Data Structures and Algorithms. 
          Complete each node to unlock your full potential.
        </p>
      </motion.div>

      <div className="relative py-10">
        <div className="absolute left-[50%] top-0 bottom-0 w-1 bg-surface-700 -translate-x-1/2 rounded-full hidden md:block"></div>

        <div className="flex flex-col gap-8 md:gap-0 relative z-10">
          {data.map((lvl, index) => {
            const isEven = index % 2 === 0;
            const total = lvl.problems.length;
            const solved = lvl.problems.filter(p => p.solved).length;
            const progress = total === 0 ? 0 : (solved / total) * 100;
            const isComplete = progress === 100;

            return (
              <div key={lvl.level} className={`flex flex-col md:flex-row items-center w-full ${isEven ? 'md:justify-start' : 'md:justify-end'} relative md:-mb-12`}>
                <motion.div
                  initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className={`w-full md:w-[45%] glass-panel p-6 relative group transition-colors duration-300 hover:border-brand-500 cursor-pointer ${isComplete ? 'border-brand-500/50' : ''}`}
                >
                  <Link to={`/practice?phase=${lvl.level}`} className="block">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-1 block">Phase {lvl.level}</span>
                        <h3 className="text-xl font-bold text-white group-hover:text-brand-500 transition-colors">{lvl.goal}</h3>
                      </div>
                      {isComplete ? (
                        <CheckCircle className="w-6 h-6 text-brand-500 shrink-0" />
                      ) : (
                        <Code className="w-6 h-6 text-surface-500 shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div className="text-sm font-medium text-surface-400">
                        <span className={isComplete ? 'text-brand-500' : 'text-white'}>{solved}</span> / {total} Problems
                      </div>
                      <div className="text-sm font-bold text-surface-300">{progress.toFixed(0)}%</div>
                    </div>
                    
                    <div className="w-full bg-surface-900 rounded-full h-1.5 mt-3 overflow-hidden">
                      <div 
                        className="h-full bg-brand-500 transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </Link>
                </motion.div>

                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface-900 border-4 border-surface-800 items-center justify-center z-20">
                  <div className={`w-3 h-3 rounded-full ${isComplete ? 'bg-brand-500' : 'bg-surface-500'}`}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

