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
  const elementColor = isFire ? 'text-orange-600 border-orange-600/50' : 'text-sky-600 border-sky-600/50';

  const speakWord = () => {
    juice.speak(word.word);
    juice.ding(600, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border-2 border-violet-400 bg-white p-6 text-slate-900 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg bg-violet-50 p-2 text-violet-700 transition hover:bg-violet-100 hover:text-violet-900"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start justify-between pr-8">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-3xl font-bold text-orange-900 capitalize">{word.word}</h2>
              <button
                type="button"
                onClick={speakWord}
                title="Speak Word Aloud"
                className="rounded-lg bg-violet-100/60 p-1.5 text-violet-700 transition hover:bg-violet-200 hover:text-violet-900"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="rounded bg-violet-100 px-2 py-0.5 uppercase tracking-wider text-violet-700">
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
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Definition</span>
            <p className="mt-1 text-base text-slate-800">{word.definition}</p>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Example Sentence</span>
            <p className="mt-1 italic text-violet-800">"{word.example}"</p>
          </div>

          {word.forge && (
            <div className="rounded-xl border border-amber-600/40 bg-amber-50/20 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700">
                <Sparkles className="h-3.5 w-3.5" /> Forged Word Origin
              </div>
              <p className="mt-1 text-xs text-amber-900">
                Created through {word.forge.process} using parts:{' '}
                <strong className="text-amber-700">{word.forge.parts.join(' + ')}</strong>
              </p>
              <p className="mt-0.5 text-xs text-slate-700">
                Morphology Attack Bonus: <span className="font-semibold text-emerald-600">+{word.forge.powerBonus} Power</span>
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white transition hover:bg-violet-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
