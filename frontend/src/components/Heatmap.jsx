import React, { useRef, useEffect } from 'react';

function getLastNDays(n) {
    const days = [];
    const today = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push(d);
    }
    return days;
}

function formatKey(d) {
    return d.toISOString().slice(0, 10);
}

export default function Heatmap({ data = [], days = 365 }) {
    const scrollRef = useRef(null);

    // Auto-scroll to the far right on mount or data change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [data, days]);

    const dayList = getLastNDays(days);
    const firstDay = dayList[0].getDay(); // 0 is Sunday
    
    // Create padding so the grid aligns with days of the week (Sunday at top)
    const padding = Array.from({ length: firstDay }).map(() => null);
    
    const allCells = [...padding, ...dayList];
    const rawColumns = [];
    for (let i = 0; i < allCells.length; i += 7) {
        rawColumns.push(allCells.slice(i, i + 7));
    }

    const columns = [];
    let lastMonth = null;
    
    rawColumns.forEach(col => {
        const validDays = col.filter(d => d !== null);
        if (validDays.length > 0) {
            // Use the middle day of the week to determine its primary month
            const midIndex = Math.floor(validDays.length / 2);
            const currentMonth = new Date(validDays[midIndex]).getMonth();
            
            if (lastMonth !== null && currentMonth !== lastMonth) {
                // Insert a visual gap
                columns.push({ isGap: true });
            }
            lastMonth = currentMonth;
        }
        columns.push({ isGap: false, cells: col });
    });

    let currentX = 0;
    const months = [];
    columns.forEach((colObj, i) => {
        if (!colObj.isGap) {
            const col = colObj.cells;
            const validDays = col.filter(d => d !== null);
            if (validDays.length > 0) {
                // If it's the first column, or immediately follows a gap
                if (i === 0 || columns[i-1].isGap) {
                    const midIndex = Math.floor(validDays.length / 2);
                    const date = new Date(validDays[midIndex]);
                    months.push({ label: date.toLocaleString('default', { month: 'short' }), x: currentX });
                }
            }
        }
        // Normal column width 11px + 3px gap = 14px. Gap column width 4px + 3px gap = 7px.
        currentX += colObj.isGap ? 7 : 14;
    });

    const counts = {};
    data.forEach(dt => {
        try { 
            const k = dt.slice(0, 10); 
            counts[k] = (counts[k] || 0) + 1; 
        } catch (e) { }
    });

    const max = Math.max(...Object.values(counts), 0);

    return (
        <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-white">Activity Heatmap</h3>
                    <p className="text-sm text-surface-400">Your problem solving frequency over the last year</p>
                </div>
            </div>
            
            <div className="flex gap-2">
                {/* Y-Axis Labels (Mon, Wed, Fri) */}
                <div className="flex flex-col gap-[3px] text-[10px] text-surface-500 pt-[56px] pr-2">
                    <span className="h-[11px]"></span>
                    <span className="h-[11px] leading-[11px]">Mon</span>
                    <span className="h-[11px]"></span>
                    <span className="h-[11px] leading-[11px]">Wed</span>
                    <span className="h-[11px]"></span>
                    <span className="h-[11px] leading-[11px]">Fri</span>
                    <span className="h-[11px]"></span>
                </div>
                
                {/* Grid & Month Labels */}
                <div ref={scrollRef} className="flex-1 overflow-x-auto pb-4 scrollbar-thin scroll-smooth">
                    <div className="relative min-w-max pt-[32px]">
                        {/* Months Header */}
                        <div className="relative h-[20px] mb-1 text-[10px] text-surface-500">
                            {months.map((m, i) => (
                                <span 
                                    key={i} 
                                    className="absolute top-0 left-0" 
                                    style={{ transform: `translateX(${m.x}px)` }}
                                >
                                    {m.label}
                                </span>
                            ))}
                        </div>
                        
                        {/* Grid */}
                        <div className="flex gap-[3px]">
                            {columns.map((colObj, colIndex) => {
                                if (colObj.isGap) {
                                    return <div key={`gap-${colIndex}`} className="w-[4px]" />;
                                }
                                return (
                                    <div key={colIndex} className="flex flex-col gap-[3px]">
                                        {colObj.cells.map((d, rowIndex) => {
                                            if (!d) {
                                                return <div key={`pad-${rowIndex}`} className="w-[11px] h-[11px]" />;
                                            }
                                            const k = formatKey(d);
                                            const c = counts[k] || 0;
                                            const intensity = max === 0 ? 0 : Math.ceil((c / max) * 4);
                                            const colors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
                                            const bgColor = c === 0 ? colors[0] : (colors[intensity] || colors[4]);
                                            
                                            return (
                                                <div 
                                                    key={k} 
                                                    className="group relative w-[11px] h-[11px] rounded-[2px] transition-colors duration-200 outline-none ring-1 ring-white/[0.04] ring-inset hover:ring-white/30 cursor-pointer"
                                                    style={{ backgroundColor: bgColor }} 
                                                >
                                                    <div className={`pointer-events-none absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap bg-surface-900 text-surface-200 text-xs px-2.5 py-1.5 rounded-md shadow-xl border border-white/10 ${
                                                        colIndex < 12 ? 'left-0' :
                                                        colIndex > columns.length - 12 ? 'right-0' :
                                                        'left-1/2 -translate-x-1/2'
                                                    }`}>
                                                        <span className="font-semibold text-white">{c} problems</span> on {new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        <div className={`absolute top-full border-4 border-transparent border-t-surface-900 ${
                                                            colIndex < 12 ? 'left-1.5' :
                                                            colIndex > columns.length - 12 ? 'right-1.5' :
                                                            'left-1/2 -translate-x-1/2'
                                                        }`}></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2 text-[11px] text-surface-500 justify-end w-full max-w-full">
                <span>Less</span>
                <div className="flex gap-[3px]">
                    {['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'].map((color, i) => (
                        <div key={i} className="w-[11px] h-[11px] rounded-[2px] ring-1 ring-white/[0.04] ring-inset" style={{ backgroundColor: color }} />
                    ))}
                </div>
                <span>More</span>
            </div>
        </div>
    );
}