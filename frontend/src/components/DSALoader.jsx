import { Loader2 } from 'lucide-react';

export default function DSALoader({ message = "Loading..." }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center w-full px-4 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      <div className="text-surface-400 font-medium text-sm sm:text-base animate-pulse">
        {message}
      </div>
    </div>
  );
}
