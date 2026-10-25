import React from 'react';
import { X, Volume2, Sparkles } from 'lucide-react';
import { Word } from '../types';
import { juice } from '../engine/juice';

interface WordModalProps {
  word: Word | null;
  onClose: () => void;
}

export const WordModal: React.FC<WordModalProps> = ({ word, onClose }) => {
  if (!word) return null;

  const isFire = word.element === 'fire';
  const elementColor = isFire ? 'text-orange-400 border-orange-500/50' : 'text-sky-400 border-sky-500/50';

  const speakWord = () => {
    juice.speak(word.word);
    juice.ding(600, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border-2 border-violet-700 bg-[#161022] p-6 text-slate-100 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg bg-violet-950 p-2 text-violet-300 hover:bg-violet-900 hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start justify-between pr-8">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-3xl font-bold text-orange-50 capitalize">{word.word}</h2>
              <button
                type="button"
                onClick={speakWord}
                title="Speak Word Aloud"
                className="rounded-lg bg-violet-900/60 p-1.5 text-violet-300 hover:bg-violet-800 hover:text-white transition"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="rounded bg-violet-900 px-2 py-0.5 uppercase tracking-wider text-violet-300">
                {word.partOfSpeech}
              </span>
              <span className={`rounded border px-2 py-0.5 uppercase tracking-wider ${elementColor}`}>
                {word.element} {isFire ? '🔥' : '❄️'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4 text-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Definition</span>
            <p className="mt-1 text-base text-slate-200">{word.definition}</p>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Example Sentence</span>
            <p className="mt-1 italic text-violet-200">"{word.example}"</p>
          </div>

          {word.forge && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
                <Sparkles className="h-3.5 w-3.5" /> Forged Word Origin
              </div>
              <p className="mt-1 text-xs text-amber-100">
                Created through {word.forge.process} using parts:{' '}
                <strong className="text-amber-300">{word.forge.parts.join(' + ')}</strong>
              </p>
              <p className="mt-0.5 text-xs text-slate-300">
                Morphology Attack Bonus: <span className="font-semibold text-emerald-400">+{word.forge.powerBonus} Power</span>
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-violet-700 px-4 py-2 font-semibold text-violet-100 hover:bg-violet-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
