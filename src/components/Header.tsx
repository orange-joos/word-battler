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
    <header className="sticky top-0 z-30 border-b-4 border-[#793d35] bg-[#aa5544] px-4 py-3 text-white shadow-md">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 lg:flex-nowrap">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#ffce7a] bg-gradient-to-br from-amber-400 to-pink-500 shadow-md shadow-[#763b36]">
            <Swords className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-lg sm:text-xl font-bold tracking-wide text-white">
              WORD BATTLER
            </h1>
            <p className="hidden text-[11px] text-orange-50 sm:block">
              Vocabulary &amp; Morphology Pet Arena
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="order-3 flex basis-full flex-wrap items-center justify-center gap-1.5 lg:order-none lg:basis-auto lg:gap-2" aria-label="Game sections">
          <button
            type="button"
            onClick={() => setTab('battle')}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs sm:px-4 sm:text-sm font-semibold tracking-wide transition-all ${
              tab === 'battle'
                ? 'bg-amber-300 text-amber-950 shadow-md shadow-[#783f36]'
                : 'bg-[#893f3b] text-orange-50 hover:bg-[#783832]'
            }`}
          >
            <Swords className="h-4 w-4" />
            <span>Battle</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('loadout')}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs sm:px-4 sm:text-sm font-semibold tracking-wide transition-all relative ${
              tab === 'loadout'
                ? 'bg-amber-300 text-amber-950 shadow-md shadow-[#783f36]'
                : 'bg-[#893f3b] text-orange-50 hover:bg-[#783832]'
            }`}
          >
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <span>Arsenal</span>
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full border border-emerald-300 bg-emerald-100 px-1 text-[10px] font-bold text-emerald-800">
              {activeLoadoutCount}/4
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('forge')}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs sm:px-4 sm:text-sm font-semibold tracking-wide transition-all relative ${
              tab === 'forge'
                ? 'bg-amber-300 text-amber-950 shadow-md shadow-[#783f36]'
                : 'bg-[#893f3b] text-orange-50 hover:bg-[#783832]'
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
        <div className="order-2 ml-auto flex items-center gap-2 lg:order-none lg:ml-0">
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#f3c794] bg-[#fff4dc] text-[#74452f] transition hover:bg-amber-200 hover:text-amber-950"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-violet-200" />}
          </button>

          <button
            type="button"
            onClick={onOpenGuide}
            title="Linguistic Rules &amp; Guide"
            aria-label="How to Play and Rules"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#f3c794] bg-[#fff4dc] text-[#74452f] transition hover:bg-amber-200 hover:text-amber-950"
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
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-[#f3c794] bg-[#fff4dc] text-[#74452f] transition hover:bg-amber-200 hover:text-amber-950 sm:flex"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
