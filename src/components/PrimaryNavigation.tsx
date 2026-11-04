import React from 'react';
import { Compass, Egg, Flame, ShoppingBag, Swords } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { TabType } from '../types';

interface PrimaryNavigationProps {
  variant: 'header' | 'hub';
}

const TABS: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
  { id: 'hub', label: 'Word World', icon: <Compass className="h-4 w-4" /> },
  { id: 'battle', label: 'Arena', icon: <Swords className="h-4 w-4" /> },
  { id: 'loadout', label: 'Pet Hatchery', icon: <Egg className="h-4 w-4" /> },
  { id: 'forge', label: 'Word Forge', icon: <Flame className="h-4 w-4" /> },
  { id: 'shop', label: 'Lexi Shop', icon: <ShoppingBag className="h-4 w-4" /> },
];

export const PrimaryNavigation: React.FC<PrimaryNavigationProps> = ({ variant }) => {
  const { tab, setTab, words, creatures, playerId } = useGame();
  const isHub = variant === 'hub';
  const activePet = creatures.find((creature) => creature.id === playerId);
  const activeLoadoutCount = activePet?.loadout
    ? Object.values(activePet.loadout).filter(Boolean).length
    : 0;
  const forgedCount = [
    ...(words.adjectives || []),
    ...(words.nouns || []),
    ...(words.verbs || []),
    ...(words.adverbs || []),
  ].filter((word) => Boolean(word.forge || (word.powerBonus && word.powerBonus > 0))).length
    + creatures.filter((creature) => Boolean(creature.forged)).length;

  return (
    <nav
      aria-label="Game sections"
      className={
        isHub
          ? 'flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border-2 border-[#5a2e12] bg-[#fff9ed]/95 p-1.5 shadow-[0_4px_0_#5a2e12] backdrop-blur-sm'
          : 'order-3 flex basis-full items-center justify-center gap-1 overflow-x-auto lg:order-none lg:basis-auto'
      }
    >
      {TABS.map(({ id, label, icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setTab(id)}
          aria-current={tab === id ? 'page' : undefined}
          className={
            tab === id
              ? 'flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-[#7b4632] bg-gradient-to-r from-amber-400 to-orange-400 px-2.5 py-2 text-[10px] font-black text-white shadow-[0_2px_0_#7b4632] sm:px-3 sm:text-xs'
              : isHub
                ? 'flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-200 bg-white px-2.5 py-2 text-[10px] font-black text-[#71432f] transition hover:bg-amber-100 sm:px-3 sm:text-xs'
                : 'flex shrink-0 items-center gap-1.5 rounded-lg bg-[#893f3b] px-2.5 py-2 text-[10px] font-bold text-orange-50 transition hover:bg-[#783832] sm:px-3 sm:text-xs'
          }
        >
          {icon}
          <span>{label}</span>
          {!isHub && id === 'loadout' && (
            <span className="rounded-full bg-emerald-100 px-1.5 text-[9px] font-black text-emerald-800">{activeLoadoutCount}/4</span>
          )}
          {!isHub && id === 'forge' && forgedCount > 0 && (
            <span className="rounded-full bg-amber-400 px-1.5 text-[9px] font-black text-amber-950">{forgedCount}</span>
          )}
        </button>
      ))}
    </nav>
  );
};
