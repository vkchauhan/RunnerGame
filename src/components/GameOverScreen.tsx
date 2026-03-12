import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Trophy, Star } from 'lucide-react';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  onRetry: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, highScore, onRetry }) => {
  const isNewHighScore = score > 0 && score >= highScore;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="absolute inset-0 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-10 text-center z-50"
    >
      <motion.div 
        initial={{ scale: 0.8, y: 20, opacity: 0 }} 
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <Trophy size={80} className="text-orange-500" />
            {isNewHighScore && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-full shadow-lg"
              >
                NEW RECORD!
              </motion.div>
            )}
          </div>
        </div>

        <h2 className="text-6xl font-black tracking-tighter mb-2 text-white italic">CRASHED!</h2>
        <p className="text-white/40 uppercase tracking-[0.3em] text-xs font-bold mb-10">The journey ends here</p>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-widest text-orange-500 font-black mb-1">Final Score</p>
            <p className="text-4xl font-black text-white">{score}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star size={10} className="text-yellow-400 fill-yellow-400" />
              <p className="text-[10px] uppercase tracking-widest text-yellow-400 font-black">Best</p>
            </div>
            <p className="text-4xl font-black text-white">{highScore}</p>
          </div>
        </div>

        <button 
          onClick={onRetry} 
          className="w-full bg-white text-black hover:bg-orange-500 hover:text-white font-black py-6 px-12 rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl group"
        >
          <RotateCcw size={24} className="group-hover:rotate-180 transition-transform duration-500" /> 
          TRY AGAIN
        </button>
      </motion.div>
    </motion.div>
  );
};
