import React from 'react';
import { Calendar, Flame } from 'lucide-react';

export default function MonthCalendar({ data }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Extract all solved dates
  const solvedDates = new Set();
  const solvedDatesTimeSet = new Set(); // For streak calculation

  data.forEach(lvl => {
    lvl.problems.forEach(p => {
      if (p.solved && p.solvedAt) {
        const d = new Date(p.solvedAt);
        const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        solvedDates.add(dateStr);
        
        // Time based set for precise streak calc
        const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        solvedDatesTimeSet.add(dTime.getTime());
      }
    });
  });

  // Calculate Streak
  let currentStreak = 0;
  const tempDate = new Date(year, month, today.getDate()); // Today at midnight
  
  // Check if solved today
  if (solvedDatesTimeSet.has(tempDate.getTime())) {
    currentStreak++;
    tempDate.setDate(tempDate.getDate() - 1);
  } else {
    // If not solved today, check yesterday
    tempDate.setDate(tempDate.getDate() - 1);
    if (solvedDatesTimeSet.has(tempDate.getTime())) {
      currentStreak++;
      tempDate.setDate(tempDate.getDate() - 1);
    }
  }

  // Continue counting backwards if we have a streak
  if (currentStreak > 0) {
    while (solvedDatesTimeSet.has(tempDate.getTime())) {
      currentStreak++;
      tempDate.setDate(tempDate.getDate() - 1);
    }
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-surface-200">
          <Calendar className="w-5 h-5 text-brand-500" />
          <h3 className="font-semibold">{monthNames[month]} {year}</h3>
        </div>
        
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500">
          <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'animate-pulse text-orange-400' : 'text-surface-500'}`} />
          <span className="text-sm font-bold">{currentStreak} <span className="hidden xl:inline">Day</span> Streak</span>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-surface-500">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;
          
          const dateStr = `${year}-${month}-${day}`;
          const isSolved = solvedDates.has(dateStr);
          const isToday = day === today.getDate();

          return (
            <div 
              key={day} 
              className={`aspect-square flex items-center justify-center rounded-md text-sm transition-all duration-300 relative
                ${isSolved ? 'bg-brand-500/20 text-brand-400 font-bold border border-brand-500/30 shadow-[0_0_10px_rgba(255,161,22,0.1)]' : 'bg-surface-800 text-surface-400 border border-surface-700'}
                ${isToday && !isSolved ? 'border-white/40 text-white font-bold bg-surface-700/50 shadow-sm' : ''}
                ${isToday && isSolved ? 'border-brand-300 ring-1 ring-brand-500/50 scale-[1.05] z-10' : ''}
              `}
            >
              {day}
              {isSolved && <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-brand-500"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
