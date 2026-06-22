import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function ModernTimePicker({ value, onChange }) {
  // value is "HH:mm" in 24h format
  const [hour24, minute] = (value || '09:00').split(':');
  let h = parseInt(hour24, 10);
  const isPM = h >= 12;
  const hour12 = h % 12 || 12;

  const updateTime = (newH24, newMin) => {
    const formattedH = newH24.toString().padStart(2, '0');
    const formattedM = newMin.toString().padStart(2, '0');
    onChange(`${formattedH}:${formattedM}`);
  };

  const handleHourChange = (delta) => {
    let currentH = parseInt(hour24, 10);
    let newH = (currentH + delta + 24) % 24;
    updateTime(newH, minute);
  };

  const handleMinuteChange = (delta) => {
    let currentM = parseInt(minute, 10);
    let newM = (currentM + delta + 60) % 60;
    updateTime(hour24, newM);
  };

  const toggleAmPm = () => {
    let currentH = parseInt(hour24, 10);
    let newH = (currentH + 12) % 24;
    updateTime(newH, minute);
  };

  const formatDigit = (num) => num.toString().padStart(2, '0');

  return (
    <div className="flex items-center justify-between bg-surface-950 px-4 py-2 rounded-xl border border-white/10 w-full shadow-inner">
      {/* Hours */}
      <div className="flex flex-col items-center flex-1">
        <button 
          onClick={() => handleHourChange(1)}
          className="p-1 text-surface-500 hover:text-brand-400 transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <div className="w-full text-center text-xl font-mono font-bold text-white">
          {formatDigit(hour12)}
        </div>
        <button 
          onClick={() => handleHourChange(-1)}
          className="p-1 text-surface-500 hover:text-brand-400 transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="text-surface-600 font-bold text-xl pb-1 px-2">:</div>

      {/* Minutes */}
      <div className="flex flex-col items-center flex-1">
        <button 
          onClick={() => handleMinuteChange(1)}
          className="p-1 text-surface-500 hover:text-brand-400 transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <div className="w-full text-center text-xl font-mono font-bold text-white">
          {formatDigit(parseInt(minute, 10))}
        </div>
        <button 
          onClick={() => handleMinuteChange(-1)}
          className="p-1 text-surface-500 hover:text-brand-400 transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* AM/PM Toggle */}
      <div className="ml-2 pl-4 border-l border-white/10 flex flex-col items-center justify-center h-full">
        <button
          onClick={toggleAmPm}
          className="w-[60px] py-2 bg-surface-900 hover:bg-surface-800 text-brand-400 font-bold rounded-xl text-sm transition-colors ring-1 ring-brand-500/20 shadow-md"
        >
          {isPM ? 'PM' : 'AM'}
        </button>
      </div>
    </div>
  );
}
