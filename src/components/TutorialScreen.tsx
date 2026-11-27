import React, { useState } from 'react';
import { ArrowRight, Compass, Hammer, Swords, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { juice } from '../engine/juice';
import { CreatureSprite } from './CreatureSprite';

export const TutorialScreen: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  const { creatures, playerId, setActiveScreen, setTab, preferredGradeBand, setPreferredGradeBand } =
    useGame();
  const starterPet = creatures.find((creature) => creature.id === playerId);

  const [demoTabletLinked, setDemoTabletLinked] = useState<string[]>([
    'fiercely',
    'ignites',
    'blazing',
    'flame',
  ]);
  const [demoFossilCleared, setDemoFossilCleared] = useState<boolean>(false);

  const enterWorld = () => {
    juice.fanfare();
    updateProfile({ onboardingComplete: true });
    setTab('hub');
    setActiveScreen('game');
  };

  const toggleDemoTablet = (word: string) => {
    juice.click();
    juice.speakWord(word);
    setDemoTabletLinked((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    );
  };

  const petName = starterPet?.name || 'Emberfox';
  const demoSentence =
    demoTabletLinked.length > 0
      ? `${petName} ${demoTabletLinked.join(' ')}!`
      : 'Tap the Word Cards above to build a sentence!';

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#1e1b4b] via-[#312e81] to-[#0f172a] px-4 py-6 select-none">
      <section className="w-full max-w-4xl rounded-3xl border-[4px] border-[#1a162b] bg-[#fff8e7] p-5 shadow-[0_10px_0_#090714] sm:p-7 space-y-5">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-r from-[#283593] via-[#3949ab] to-[#1a237e] p-4 text-white">
          <div className="flex items-center gap-3.5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-[3px] border-[#1a162b] bg-[#ffd54f]/20 shadow shrink-0">
              <CreatureSprite
                creatureId={starterPet?.id || 'emberfox'}
                stage={starterPet?.stage || 1}
                element={starterPet?.element || 'fire'}
                size="sm"
              />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#ffd54f]">
                Official Fossil Ranger Field Guide · {currentUser?.displayName || 'Explorer'}
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-white drop-shadow-[0_2px_0_#1a162b]">
                Welcome to Aetheria Sky-Sanctuary!
              </h1>
              <p className="text-xs font-bold text-sky-100">
                Partnered with <strong>{petName}</strong> · Master K–8 Word Cards across 9 Elemental Realms
              </p>
            </div>
          </div>

          {/* Grade Band Quick Selector */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">
              Select Grade Band:
            </span>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: 'all', label: 'All K–8' },
                  { id: 'k-2', label: 'K–2' },
                  { id: '3-5', label: '3–5' },
                  { id: '6-8', label: '6–8' },
                ] as const
              ).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setPreferredGradeBand(b.id);
                    juice.click();
                  }}
                  className={`rounded-lg border-2 border-[#1a162b] px-2.5 py-1 text-[10px] font-black uppercase cursor-pointer ${
                    preferredGradeBand === b.id
                      ? 'bg-[#ffd54f] text-[#1a162b]'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3 Interactive Field Training Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Step 1: Winding Node Maps & Fossil Dig Sites */}
          <article className="flex flex-col justify-between rounded-2xl border-[3px] border-[#1a162b] bg-white p-4 shadow-[0_4px_0_#1a162b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#1a162b] bg-[#dcfce7] text-[#166534]">
                  <Compass className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-[#1a162b] px-2.5 py-0.5 font-mono text-[10px] font-black text-[#ffd54f]">
                  STEP 1 · REALM TRAILS
                </span>
              </div>
              <h2 className="mt-2.5 font-display text-base font-black text-[#1a162b]">
                9 Winding Elemental Maps &amp; Dig Sites
              </h2>
              <p className="mt-1 text-xs font-bold text-[#5d4037] leading-relaxed">
                Travel from <strong>Stage 1-1 to 9-10</strong>. Tap any rock or sand tile at Stage <strong>X-4</strong> to unearth rare <strong>Word Tablets</strong>!
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setDemoFossilCleared(true);
                juice.ding(880, 130);
              }}
              className={`mt-3 w-full rounded-xl border-2 border-[#1a162b] p-2.5 text-center font-display text-xs font-black transition cursor-pointer ${
                demoFossilCleared
                  ? 'bg-[#dcfce7] text-[#166534]'
                  : 'bg-[#fef3c7] hover:bg-[#fde68a] text-[#92400e]'
              }`}
            >
              {demoFossilCleared ? (
                <span className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Unearthed Ancient Tablet (+2 Power)!
                </span>
              ) : (
                '⛏️ Tap to Test Fossil Excavation!'
              )}
            </button>
          </article>

          {/* Step 2: Natural Action Sentences */}
          <article className="flex flex-col justify-between rounded-2xl border-[3px] border-[#1a162b] bg-white p-4 shadow-[0_4px_0_#1a162b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#1a162b] bg-[#fef3c7] text-[#b45309]">
                  <Swords className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-[#1a162b] px-2.5 py-0.5 font-mono text-[10px] font-black text-[#ffd54f]">
                  STEP 2 · WORD CARDS
                </span>
              </div>
              <h2 className="mt-2.5 font-display text-base font-black text-[#1a162b]">
                Build Real English Battle Sentences
              </h2>
              <p className="mt-1 text-xs font-bold text-[#5d4037] leading-relaxed">
                Tap 1–4 <strong>Word Cards</strong> (or tap <strong>🔄 Choice</strong> to swap words) to cast natural English action sentences!
              </p>
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                {['fiercely', 'ignites', 'blazing', 'flame'].map((w) => {
                  const active = demoTabletLinked.includes(w);
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => toggleDemoTablet(w)}
                      className={`rounded-lg border-2 border-[#1a162b] py-1 text-xs font-black cursor-pointer ${
                        active ? 'bg-[#ffd54f] text-[#1a162b]' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
              <div className="rounded-lg bg-[#1a162b] px-2 py-1 text-center font-display text-[11px] font-black text-[#fde047] truncate">
                “{demoSentence}”
              </div>
            </div>
          </article>

          {/* Step 3: Word Forge */}
          <article className="flex flex-col justify-between rounded-2xl border-[3px] border-[#1a162b] bg-white p-4 shadow-[0_4px_0_#1a162b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#1a162b] bg-[#ffe4e6] text-[#be123c]">
                  <Hammer className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-[#1a162b] px-2.5 py-0.5 font-mono text-[10px] font-black text-[#ffd54f]">
                  STEP 3 · WORD FORGE
                </span>
              </div>
              <h2 className="mt-2.5 font-display text-base font-black text-[#1a162b]">
                Merge Real Compounds, Prefixes &amp; Buddies
              </h2>
              <p className="mt-1 text-xs font-bold text-[#5d4037] leading-relaxed">
                Visit the <strong>Word Forge</strong> to combine prefixes (<em>un- + frozen → unfrozen</em>), compounds, and Dual-Element hybrid buddies!
              </p>
            </div>

            <div className="mt-3 rounded-xl border-2 border-[#1a162b] bg-[#f5e6c8] p-2.5 text-center space-y-0.5">
              <div className="font-mono text-[10px] font-black uppercase text-[#78350f]">
                Real-English Forge Recipes
              </div>
              <div className="font-display text-xs font-black text-[#1a162b]">
                blazing + flame → <span className="text-[#b45309]">wildfire</span>
              </div>
              <div className="font-display text-[11px] font-black text-[#1a162b]">
                chilly + -ness → <span className="text-[#b45309]">chilliness</span> (Y → I!)
              </div>
            </div>
          </article>
        </div>

        {/* Launch Button */}
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={enterWorld}
            className="flex items-center gap-2.5 rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-b from-[#4ade80] to-[#16a34a] px-8 py-3.5 font-display text-base font-black uppercase tracking-wider text-[#1a162b] shadow-[0_5px_0_#1a162b] transition hover:brightness-105 active:translate-y-0.5 cursor-pointer"
          >
            <Sparkles className="h-5 w-5" /> Enter Aetheria Sky-Sanctuary <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </main>
  );
};
