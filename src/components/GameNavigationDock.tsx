import React, { useState } from 'react';
import { Map, Swords, Hammer, BookOpen, Sparkles } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { canPetEvolve } from '../data/evolutionData';
import { juice } from '../engine/juice';
import { LexiDexModal } from './LexiDexModal';
import { EvolutionSequenceModal } from './EvolutionSequenceModal';
import { Creature } from '../types';

export const GameNavigationDock: React.FC = () => {
  const {
    tab,
    setTab,
    creatures,
    preferredGradeBand,
    setPreferredGradeBand,
    evolvePet,
  } = useGame();

  const [isStickerBookOpen, setIsStickerBookOpen] = useState(false);
  const [evolvingCreature, setEvolvingCreature] = useState<Creature | null>(null);

  const companionPets = creatures.filter((c) => !c.id.startsWith('boss_'));
  const readyToEvolveCount = companionPets.filter((c) => canPetEvolve(c)).length;

  const navItems = [
    {
      id: 'hub' as const,
      label: 'World Hub',
      shortLabel: 'World',
      icon: Map,
      emoji: '🗺️',
      activeBg: 'from-sky-400 to-blue-600 text-white',
    },
    {
      id: 'battle' as const,
      label: 'Battle Arena',
      shortLabel: 'Battle',
      icon: Swords,
      emoji: '⚔️',
      activeBg: 'from-rose-500 to-red-600 text-white',
    },
    {
      id: 'loadout' as const,
      label: 'Pets & Sanctuary',
      shortLabel: 'Pets',
      icon: Sparkles,
      emoji: '🐾',
      badge: readyToEvolveCount > 0 ? `${readyToEvolveCount} Evolve!` : undefined,
      activeBg: 'from-amber-400 to-orange-500 text-[#1a162b]',
    },
    {
      id: 'forge' as const,
      label: 'Word Forge',
      shortLabel: 'Forge',
      icon: Hammer,
      emoji: '🔨',
      activeBg: 'from-emerald-400 to-green-600 text-[#1a162b]',
    },
  ];

  return (
    <>
      <nav
        aria-label="Primary Game Navigation"
        className="relative z-40 flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-[#1a162b] bg-[#1a162b] px-3 py-1.5 text-white shadow-md select-none"
      >
        {/* Left: 4 Primary Screen Tabs + 1-Click Sticker Book */}
        <div className="flex flex-wrap items-center gap-1.5">
          {navItems.map((item) => {
            const isActive = tab === item.id || (item.id === 'hub' && tab === 'shop');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  juice.click();
                  setTab(item.id);
                }}
                className={`relative flex items-center gap-1.5 rounded-xl border-2 px-3 py-1 text-xs font-display font-black uppercase tracking-wide transition cursor-pointer ${
                  isActive
                    ? `border-[#fde047] bg-gradient-to-b ${item.activeBg} shadow-[0_2px_0_#fde047]`
                    : 'border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <span>{item.emoji}</span>
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.shortLabel}</span>
                {item.badge && (
                  <span className="ml-1 rounded-full border border-[#1a162b] bg-[#fde047] px-1.5 py-0.2 text-[10px] font-black text-[#1a162b] animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              juice.click();
              setIsStickerBookOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border-2 border-amber-400/70 bg-gradient-to-b from-purple-600 to-indigo-700 hover:brightness-110 px-3 py-1 text-xs font-display font-black uppercase text-amber-200 cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>📖 Sticker Book</span>
          </button>
        </div>

        {/* Right: Age-Adaptive UI Mode Switcher (#1: Junior K-2 / Explorer 3-5 / Scholar 6-8) */}
        <div className="flex items-center gap-1.5">
          <span className="hidden md:inline text-[11px] font-black uppercase tracking-wider text-amber-300">
            Student Mode:
          </span>
          <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 p-0.5">
            {(
              [
                { id: 'k-2', label: '🎒 K–2 Junior' },
                { id: '3-5', label: '🧭 3–5 Explorer' },
                { id: '6-8', label: '⚔️ 6–8 Scholar' },
                { id: 'all', label: '🌟 All K–8' },
              ] as const
            ).map((band) => (
              <button
                key={band.id}
                type="button"
                onClick={() => {
                  juice.click();
                  setPreferredGradeBand(band.id);
                }}
                className={`rounded-lg px-2 py-0.5 text-[11px] font-black transition cursor-pointer ${
                  preferredGradeBand === band.id
                    ? 'bg-[#fde047] text-[#1a162b] shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title={`Switch vocabulary and UI density to ${band.label}`}
              >
                {band.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <LexiDexModal
        isOpen={isStickerBookOpen}
        onClose={() => setIsStickerBookOpen(false)}
        onTriggerEvolution={(pet) => setEvolvingCreature(pet)}
      />

      {evolvingCreature && (
        <EvolutionSequenceModal
          creature={evolvingCreature}
          onComplete={() => {
            evolvePet(evolvingCreature.id);
            setEvolvingCreature(null);
          }}
          onClose={() => setEvolvingCreature(null)}
        />
      )}
    </>
  );
};
