import React from 'react';
import { Swords, Flame, Volume2, VolumeX, HelpCircle, RotateCcw, BookOpen } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface HeaderProps {
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenGuide }) => {
  const { tab, setTab, isMuted, toggleMute, words, creatures, playerId, resetAll } = useGame();

  const activePet = creatures.find((c) => c.id === playerId) || creatures[0];
  const activeLoadoutCount = activePet?.loadout
    ? Object.values(activePet.loadout).filter(Boolean).length
    : 0;

  const forgedWordsCount = [
    ...(words.adjectives || []),
    ...(words.nouns || []),
    ...(words.verbs || []),
    ...(words.adverbs || []),
  ].filter((w) => Boolean(w.forge || (w.powerBonus && w.powerBonus > 0))).length;

  const forgedCreaturesCount = creatures.filter((c) => Boolean(c.forged)).length;

  return (
    <header className="sticky top-0 z-30 border-b border-violet-900/80 bg-[#100c18]/95 backdrop-blur-md px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-violet-700 shadow-md shadow-violet-950">
            <Swords className="h-5 w-5 text-amber-100" />
          </div>
          <div>
            <h1 className="font-serif text-lg sm:text-xl font-bold tracking-[0.25em] text-orange-50">
              WORD BATTLER
            </h1>
            <p className="text-[11px] text-violet-300 hidden sm:block">
              Vocabulary &amp; Morphology Pet Arena
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Game sections">
          <button
            type="button"
            onClick={() => setTab('battle')}
            className={`flex items-center gap-2 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold tracking-wide transition-all ${
              tab === 'battle'
                ? 'bg-violet-600 text-violet-50 shadow-md shadow-violet-900/50'
                : 'bg-violet-950 text-violet-300 hover:bg-violet-900 hover:text-violet-100'
            }`}
          >
            <Swords className="h-4 w-4" />
            <span>Battle</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('loadout')}
            className={`flex items-center gap-2 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold tracking-wide transition-all relative ${
              tab === 'loadout'
                ? 'bg-violet-600 text-violet-50 shadow-md shadow-violet-900/50'
                : 'bg-violet-950 text-violet-300 hover:bg-violet-900 hover:text-violet-100'
            }`}
          >
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <span>Arsenal</span>
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-700/80 border border-emerald-500/60 px-1 text-[10px] font-bold text-emerald-200">
              {activeLoadoutCount}/4
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('forge')}
            className={`flex items-center gap-2 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold tracking-wide transition-all relative ${
              tab === 'forge'
                ? 'bg-violet-600 text-violet-50 shadow-md shadow-violet-900/50'
                : 'bg-violet-950 text-violet-300 hover:bg-violet-900 hover:text-violet-100'
            }`}
          >
            <Flame className="h-4 w-4 text-amber-400" />
            <span>Word Forge</span>
            {(forgedWordsCount > 0 || forgedCreaturesCount > 0) && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-violet-950">
                {forgedWordsCount + forgedCreaturesCount}
              </span>
            )}
          </button>
        </nav>

        {/* Control Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-800 bg-violet-950 text-violet-300 hover:bg-violet-900 hover:text-violet-100 transition"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-violet-200" />}
          </button>

          <button
            type="button"
            onClick={onOpenGuide}
            title="Linguistic Rules &amp; Guide"
            aria-label="How to Play and Rules"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-800 bg-violet-950 text-violet-300 hover:bg-violet-900 hover:text-violet-100 transition"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all forged words and creatures back to initial state?')) {
                resetAll();
              }
            }}
            title="Reset Game Data"
            aria-label="Reset Game Data"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border border-violet-800/60 bg-violet-950/60 text-slate-400 hover:text-slate-200 hover:bg-violet-900 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
