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
      <div className="rounded-xl border border-violet-300/60 bg-violet-50/40 p-3 sm:p-4 text-xs sm:text-sm text-violet-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-violet-800">🔍 Word Inspector:</span>
          <span>Tap any word card below to preview its definition, audio pronunciation, and 4x4 Action Matrix role!</span>
        </div>
      </div>
    );
  }

  const isFire = word.element === 'fire';
  const elementColor = isFire ? 'text-orange-600 border-orange-600/40' : 'text-sky-600 border-sky-600/40';
  const matrixEffect = getMatrixEffectInfo(activeCategory, word.partOfSpeech);

  const speakWord = () => {
    juice.speak(word.word);
    juice.ding(640, 90);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-amber-600/60 bg-gradient-to-r from-violet-50/95 via-white to-violet-50/95 p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Word Info */}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-serif text-2xl font-bold text-orange-900 capitalize">
              {word.word}
            </h4>

            <button
              type="button"
              onClick={speakWord}
              title="Hear pronunciation"
              className="flex items-center gap-1 rounded-md bg-violet-100/80 px-2 py-1 text-xs font-medium text-violet-800 transition cursor-pointer hover:bg-violet-200 hover:text-violet-900"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Pronounce</span>
            </button>

            <span className="rounded bg-violet-100/90 px-2 py-0.5 text-xs font-semibold uppercase text-violet-800">
              {word.partOfSpeech}
            </span>

            <span className={`rounded border px-2 py-0.5 text-xs font-semibold uppercase ${elementColor}`}>
              {word.element} {isFire ? '🔥' : '❄️'}
            </span>

            {word.forge && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-700">
                <Sparkles className="h-3 w-3" />
                <span>+{word.forge.powerBonus} Power ({word.forge.process})</span>
              </span>
            )}
          </div>

          {/* Definition and Example */}
          <p className="text-xs sm:text-sm text-slate-800 leading-snug">
            <strong className="text-violet-700">Definition:</strong> {word.definition}
          </p>
          <p className="text-xs italic text-violet-700/90">
            "{word.example}"
          </p>

          {/* 4x4 Matrix Role Badge */}
          <div className="flex items-center gap-1.5 pt-1 text-xs text-amber-700">
            <Zap className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>
              <strong>In {activeCategory}:</strong> <span className="text-amber-800">{matrixEffect.name}</span> — {matrixEffect.description}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {onSlotWord && (
            <button
              type="button"
              onClick={() => onSlotWord(word)}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-violet-800 hover:bg-amber-400 transition shadow cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Slot Word</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            title="Dismiss Inspector"
            className="rounded-lg p-1.5 text-violet-600 transition hover:text-violet-900 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
