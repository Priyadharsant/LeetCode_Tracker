import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Clock, Code2, BookOpen, Layers, Zap } from 'lucide-react';
import { useData } from '../context/DataContext';
import DSALoader from '../components/DSALoader';

export default function CheatSheet() {
  const { cheatsheetData, loading } = useData();
  const [activeLang, setActiveLang] = useState('Java');
  
  if (loading) {
    return <DSALoader message="Loading Cheat Sheet..." />;
  }

  if (!cheatsheetData || cheatsheetData.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-surface-400">
        No cheat sheet data found.
      </div>
    );
  }

  const currentData = cheatsheetData.find(d => d.language === activeLang) || cheatsheetData[0];

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12">
      <div className="mb-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-400 mb-6">
            <Terminal className="w-4 h-4" />
            DSA Cheat Sheet
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 pb-2 bg-gradient-to-r from-white to-surface-400 bg-clip-text text-transparent">
            Language Reference
          </h1>
          <p className="text-lg text-surface-400 max-w-2xl mb-8">
            A quick, comprehensive guide to data types, declarations, and crucial APIs for acing your technical interviews in multiple languages.
          </p>

          <div className="flex flex-wrap gap-2">
            {cheatsheetData.map((langData) => (
              <button
                key={langData.language}
                onClick={() => setActiveLang(langData.language)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeLang === langData.language
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-white border border-surface-700 hover:border-surface-600'
                }`}
              >
                {langData.language}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        key={activeLang}
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.05 } }
        }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
          {/* Main DS Grid */}
          <div className="lg:col-span-2 space-y-6">
            <motion.h2 
              variants={{ hidden: { opacity: 0, y: 5 }, show: { opacity: 1, y: 0 } }}
              className="text-2xl font-bold flex items-center gap-2 mb-6 text-white border-b border-surface-800 pb-4"
            >
              <Layers className="w-6 h-6 text-brand-400" />
              Data Structures ({activeLang})
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentData.dataStructures.map((ds, idx) => (
                <motion.div 
                  key={idx}
                  variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                  className="bg-surface-800/40 border border-surface-700/50 hover:border-brand-500/40 rounded-2xl p-5 transition-colors hover:bg-surface-800 hover:shadow-lg hover:shadow-brand-500/5 group flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors">{ds.name}</h3>
                  </div>
                  
                  <div className="bg-surface-900 rounded-lg p-3 font-mono text-sm text-brand-400/90 mb-4 overflow-x-auto border border-surface-800 whitespace-pre">
                    {ds.declaration}
                  </div>
                  
                  <div className="space-y-3 mt-auto">
                    <div>
                      <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5" /> Core APIs
                      </h4>
                      <div className="flex flex-wrap gap-1.5 overflow-visible">
                        {ds.apis.map((api, aIdx) => (
                          <div key={aIdx} className="relative group/tooltip flex">
                            <span className="text-xs cursor-help bg-surface-700/50 hover:bg-surface-600/60 text-surface-300 px-2 py-1 rounded-md border border-surface-600/50 transition-colors">
                              {api.name}
                            </span>
                            {api.complexity && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 rounded bg-surface-900 border border-surface-700 text-xs text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                <div className="font-bold text-brand-400 mb-0.5 font-mono">{api.name}</div>
                                <div dangerouslySetInnerHTML={{__html: `Time: ${api.complexity.replace(/O\((.*?)\)/g, '<span class="text-orange-400">O($1)</span>')}`}} />
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-900" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-surface-800/50">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-surface-400">
                        <Clock className="w-3.5 h-3.5 text-orange-400/80" />
                        <span dangerouslySetInnerHTML={{__html: ds.timeComplexity.replace(/O\((.*?)\)/g, '<span class="text-orange-400">O($1)</span>')}} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <motion.div variants={{ hidden: { opacity: 0, x: 10 }, show: { opacity: 1, x: 0 } }} className="bg-gradient-to-br from-brand-900/40 to-surface-900 border border-brand-500/20 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap className="w-24 h-24 text-brand-400" />
              </div>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-white relative z-10">
                <Zap className="w-5 h-5 text-brand-400" />
                Master First
              </h2>
              <p className="text-sm text-surface-400 mb-4 relative z-10">Prioritize these structures for LeetCode</p>
              <ol className="space-y-2 relative z-10">
                {currentData.topPriority.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm font-medium text-surface-200">
                    <span className="flex items-center justify-center w-5 h-5 rounded bg-brand-500/20 text-brand-300 text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, x: 10 }, show: { opacity: 1, x: 0 } }} className="bg-surface-800 border border-surface-700 rounded-2xl p-6">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-white">
                <BookOpen className="w-5 h-5 text-brand-400" />
                Utility Classes / Modules
              </h2>
              <div className="space-y-4">
                {currentData.utilities.map((util, idx) => (
                  <div key={idx} className="bg-surface-900 rounded-xl p-4 border border-surface-700/50">
                    <h3 className="font-bold text-white mb-2 text-sm">{util.class}</h3>
                    <div className="flex flex-wrap gap-1.5 overflow-visible">
                      {util.apis.map((api, aIdx) => (
                        <div key={aIdx} className="relative group/tooltip flex">
                          <span className="text-xs cursor-help bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-surface-300 px-2 py-1 rounded border border-surface-700 transition-colors">
                            {api.name}
                          </span>
                          {api.complexity && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 rounded bg-surface-900 border border-surface-700 text-xs text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                              <div className="font-bold text-brand-400 mb-0.5 font-mono">{api.name}</div>
                              <div dangerouslySetInnerHTML={{__html: `Time: ${api.complexity.replace(/O\((.*?)\)/g, '<span class="text-orange-400">O($1)</span>')}`}} />
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-900" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
    </div>
  );
}
