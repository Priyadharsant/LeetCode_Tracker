import React from 'react';
import { Flame } from 'lucide-react';

function formatKey(d) {
    return d.slice(0, 10);
}

export default function StreakCard({ dates = [] }) {
    const today = new Date();
    const dateSet = new Set(dates.filter(Boolean).map(formatKey));

    let streak = 0;
    let cur = new Date(today);
    // Also check if they haven't solved today but solved yesterday
    let checkDay = new Date(today);
    const todayKey = checkDay.toISOString().slice(0, 10);
    
    if (!dateSet.has(todayKey)) {
        checkDay.setDate(checkDay.getDate() - 1);
        const yesterdayKey = checkDay.toISOString().slice(0, 10);
        if (dateSet.has(yesterdayKey)) {
            // Keep counting from yesterday
            cur = new Date(checkDay);
        }
    }

    while (true) {
        const key = cur.toISOString().slice(0, 10);
        if (dateSet.has(key)) {
            streak += 1;
            cur.setDate(cur.getDate() - 1);
        } else {
            break;
        }
    }

    return (
        <div className="metric-panel flex flex-col justify-between h-full group">
            <div className="relative z-10">
                <div className="flex items-center gap-2 text-surface-400 mb-2 text-sm font-medium">
                    <Flame className="w-4 h-4 text-accent-coral" />
                    Current Streak
                </div>
                <div className="text-3xl font-extrabold text-white mt-1">{streak}<span className="text-lg text-surface-500">d</span></div>
            </div>
            <div className="relative z-10 text-xs text-surface-400 mt-4 leading-relaxed">
                {streak > 0 ? "You're on fire! Keep it up today." : "Solve a problem today to start your streak."}
            </div>
        </div>
    );
}
