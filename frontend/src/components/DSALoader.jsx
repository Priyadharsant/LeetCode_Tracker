import { motion } from 'framer-motion';

export default function DSALoader() {
  const message = "Searching user data...";
  // A visual representation of searching with a magnifying glass lens
  const dots = [0, 1, 2, 3, 4];
  
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center w-full px-4">
      <div className="relative w-48 h-16 mb-4 flex items-center justify-between px-6">
        
        {/* Background nodes/dots representing data being searched */}
        {dots.map((i) => {
          // Calculate when the lens will cross this dot (forward and backward)
          // Lens moves forward from 0 to 50% time, backward from 50% to 100% time
          const tForward = (i / 4) * 0.5;
          const tBackward = 0.5 + ((4 - i) / 4) * 0.5;
          
          return (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-surface-700 relative z-0"
              animate={{
                scale: [1, 1, 1.8, 1, 1, 1.8, 1, 1],
                backgroundColor: [
                  '#3e3e3e', // base (surface-700)
                  '#3e3e3e', 
                  '#ffa116', // highlight (brand-500)
                  '#3e3e3e', 
                  '#3e3e3e', 
                  '#ffa116', // highlight return
                  '#3e3e3e', 
                  '#3e3e3e'
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                times: [
                  0,
                  Math.max(0, tForward - 0.05),
                  tForward,
                  Math.min(0.5, tForward + 0.05),
                  0.5,
                  Math.max(0.5, tBackward - 0.05),
                  tBackward,
                  Math.min(1, tBackward + 0.05)
                ],
                ease: "linear"
              }}
            />
          );
        })}

        {/* The Magnifying Glass / Lens */}
        <motion.div
          className="absolute top-1/2 left-4 -mt-4 z-10 text-brand-400"
          animate={{
            x: [0, 136, 0] // 136px is roughly the distance to cross the dots
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0px 0px 8px rgba(255,161,22,0.6))' }}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </motion.div>
      </div>
      
      <div className="flex flex-col items-center gap-1">
        <motion.div 
          className="text-brand-400 font-mono text-sm sm:text-base tracking-widest uppercase font-bold"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {message}
        </motion.div>
      </div>
    </div>
  );
}
