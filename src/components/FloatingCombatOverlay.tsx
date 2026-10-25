import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CombatPopup {
  id: string;
  text: string;
  type: 'damage' | 'crit' | 'shield' | 'heal' | 'buff' | 'debuff' | 'evade';
}

interface FloatingCombatOverlayProps {
  popups: CombatPopup[];
}

export const FloatingCombatOverlay: React.FC<FloatingCombatOverlayProps> = ({ popups }) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center overflow-visible">
      <AnimatePresence>
        {popups.map((popup) => {
          let styleClasses = 'text-white text-xl';
          if (popup.type === 'damage') {
            styleClasses = 'text-rose-400 font-extrabold text-2xl drop-shadow-[0_4px_12px_rgba(244,63,94,0.8)]';
          } else if (popup.type === 'crit') {
            styleClasses = 'text-amber-300 font-black text-3xl drop-shadow-[0_4px_16px_rgba(251,191,36,0.9)] tracking-wider';
          } else if (popup.type === 'shield') {
            styleClasses = 'text-violet-300 font-bold text-xl drop-shadow-[0_4px_12px_rgba(168,85,247,0.8)]';
          } else if (popup.type === 'heal') {
            styleClasses = 'text-emerald-300 font-bold text-xl drop-shadow-[0_4px_12px_rgba(52,211,153,0.8)]';
          } else if (popup.type === 'buff') {
            styleClasses = 'text-amber-200 font-bold text-base drop-shadow-[0_3px_10px_rgba(245,158,11,0.7)]';
          } else if (popup.type === 'debuff') {
            styleClasses = 'text-teal-300 font-bold text-base drop-shadow-[0_3px_10px_rgba(20,184,166,0.7)]';
          } else if (popup.type === 'evade') {
            styleClasses = 'text-sky-300 font-black text-2xl drop-shadow-[0_4px_14px_rgba(56,189,248,0.8)]';
          }

          return (
            <motion.div
              key={popup.id}
              initial={{ opacity: 0, y: 15, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [15, -25, -45, -70],
                scale: popup.type === 'crit' ? [0.5, 1.4, 1.3, 1] : [0.5, 1.2, 1.1, 0.9],
              }}
              exit={{ opacity: 0, y: -80, scale: 0.8 }}
              transition={{ duration: 1.3, times: [0, 0.2, 0.7, 1], ease: 'easeOut' }}
              className={`absolute font-serif select-none whitespace-nowrap ${styleClasses}`}
            >
              {popup.text}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
