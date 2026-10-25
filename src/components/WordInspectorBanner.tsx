import React from 'react';
import { Volume2, Sparkles, X, PlusCircle, Zap } from 'lucide-react';
import { Word, MoveCategory } from '../types';
import { juice } from '../engine/juice';
import { getMatrixEffectInfo } from '../engine/combat';

interface WordInspectorBannerProps {
  word: Word | null;
  activeCategory?: MoveCategory;
  onClose: () => void;
  onSlotWord?: (word: Word) => void;
}

export const WordInspectorBanner: React.FC<WordInspectorBannerProps> = ({
  word,
  activeCategory = 'ATTACK',
  onClose,
  onSlotWord,
}) => {
  if (!word) {
    return (
      <div className="rounded-xl border border-violet-800/60 bg-violet-950/40 p-3 sm:p-4 text-xs sm:text-sm text-violet-300/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-violet-200">🔍 Word Inspector:</span>
          <span>Tap any word card below to preview its definition, audio pronunciation, and 4x4 Action Matrix role!</span>
        </div>
      </div>
    );
  }

  const isFire = word.element === 'fire';
  const elementColor = isFire ? 'text-orange-400 border-orange-500/40' : 'text-sky-400 border-sky-500/40';
  const matrixEffect = getMatrixEffectInfo(activeCategory, word.partOfSpeech);

  const speakWord = () => {
    juice.speak(word.word);
    juice.ding(640, 90);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/60 bg-gradient-to-r from-violet-950/95 via-[#1a112c] to-violet-950/95 p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Word Info */}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-serif text-2xl font-bold text-orange-50 capitalize">
              {word.word}
            </h4>

            <button
              type="button"
              onClick={speakWord}
              title="Hear pronunciation"
              className="flex items-center gap-1 rounded-md bg-violet-900/80 px-2 py-1 text-xs font-medium text-violet-200 hover:bg-violet-800 hover:text-white transition cursor-pointer"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Pronounce</span>
            </button>

            <span className="rounded bg-violet-900/90 px-2 py-0.5 text-xs font-semibold uppercase text-violet-200">
              {word.partOfSpeech}
            </span>

            <span className={`rounded border px-2 py-0.5 text-xs font-semibold uppercase ${elementColor}`}>
              {word.element} {isFire ? '🔥' : '❄️'}
            </span>

            {word.forge && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-300">
                <Sparkles className="h-3 w-3" />
                <span>+{word.forge.powerBonus} Power ({word.forge.process})</span>
              </span>
            )}
          </div>

          {/* Definition and Example */}
          <p className="text-xs sm:text-sm text-slate-200 leading-snug">
            <strong className="text-violet-300">Definition:</strong> {word.definition}
          </p>
          <p className="text-xs italic text-violet-300/90">
            "{word.example}"
          </p>

          {/* 4x4 Matrix Role Badge */}
          <div className="flex items-center gap-1.5 pt-1 text-xs text-amber-300">
            <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>In {activeCategory}:</strong> <span className="text-amber-200">{matrixEffect.name}</span> — {matrixEffect.description}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {onSlotWord && (
            <button
              type="button"
              onClick={() => onSlotWord(word)}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-violet-950 hover:bg-amber-400 transition shadow cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Slot Word</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            title="Dismiss Inspector"
            className="rounded-lg p-1.5 text-violet-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
