import React from 'react';
import { useData } from '../context/DataContext';
import { CheckCircle2, Circle } from 'lucide-react';

export default function RecentProblems({ limit = 6 }) {
    const { data } = useData();
    const all = [];
    data.forEach(level => {
        level.problems.forEach((p, idx) => {
            if (p.solvedAt) {
               all.push({ ...p, level: level.level, index: idx });
            }
        });
    });

    // Sort by solvedAt descending
    all.sort((a, b) => new Date(b.solvedAt) - new Date(a.solvedAt));

    const recent = all.slice(0, limit);

    return (
        <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-base font-semibold text-white">Recent Activity</h3>
                    <p className="text-sm text-surface-400">Your latest solved problems</p>
                </div>
            </div>
            
            {recent.length === 0 ? (
                <div className="text-sm text-surface-500 py-4 text-center">No problems solved yet. Time to start coding!</div>
            ) : (
                <ul className="space-y-4">
                    {recent.map((p, i) => (
                        <li key={`${p.name}-${i}`} className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-brand-500/10 text-brand-300 rounded-lg ring-1 ring-brand-400/10 group-hover:bg-brand-500/20 transition-colors">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-surface-100 hover:text-brand-300 transition-colors block">
                                        {p.name}
                                    </a>
                                    <div className="text-xs text-surface-500 flex items-center gap-2 mt-0.5">
                                        <span className="px-2 py-0.5 bg-white/5 rounded text-surface-300 ring-1 ring-white/10">Level {p.level}</span>
                                        <span>•</span>
                                        <span>{p.topic}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-surface-500 whitespace-nowrap">
                                {new Date(p.solvedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
