import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Coins,
  Compass,
  Gem,
  LockKeyhole,
  MapPinned,
  Play,
  Sparkles,
  Star,
  Swords,
  Wind,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { WORLD_TIERS } from '../data/worldTiers';

interface OverworldMapProps {
  onOpenGuide?: () => void;
}

type NodeState = 'completed' | 'active' | 'locked';

function getNodeState(index: number, zoneId: string, zoneProgress: Record<string, { stars: number; cleared: boolean }>): NodeState {
  if (zoneProgress[zoneId]?.cleared) return 'completed';
  const prerequisitesCleared = WORLD_TIERS.slice(0, index).every((tier) => zoneProgress[tier.id]?.cleared);
  return prerequisitesCleared ? 'active' : 'locked';
}

export const OverworldMap: React.FC<OverworldMapProps> = ({ onOpenGuide }) => {
  const { setTab, startBattleInZone, zoneProgress } = useGame();
  const { currentUser, setIsCustomizingAvatar } = useAuth();
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  const activeIndex = WORLD_TIERS.findIndex((tier, index) => getNodeState(index, tier.id, zoneProgress) === 'active');
  const currentTier = WORLD_TIERS[activeIndex >= 0 ? activeIndex : WORLD_TIERS.length - 1];
  const selectedTier = WORLD_TIERS.find((tier) => tier.id === selectedTierId);
  const selectedProgress = selectedTier ? zoneProgress[selectedTier.id] || { stars: 0, cleared: false } : null;

  const openTier = (tierId: string, index: number) => {
    if (getNodeState(index, tierId, zoneProgress) !== 'locked') setSelectedTierId(tierId);
  };

  const launchTier = () => {
    if (!selectedTier || !selectedProgress) return;
    startBattleInZone(selectedTier.id, selectedTier.boss.id);
    setSelectedTierId(null);
  };

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden text-[#39304f]"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 12% 9%, #ffffffa8 0 2%, transparent 16%), radial-gradient(ellipse at 88% 23%, #ffffff99 0 2%, transparent 15%), linear-gradient(180deg, #c8f1d0 0%, #dff3cb 25%, #d4eff5 48%, #cdeeff 64%, #ffe9ba 82%, #f8d59b 100%)',
      }}
    >
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b-4 border-[#724a36] bg-[#fff9e9]/95 px-3 py-3 shadow-[0_4px_0_#b98955] backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setTab('hub')}
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border-2 border-[#87573b] bg-[#f7d99d] px-3 text-xs font-black text-[#5b3b2e] shadow-[0_3px_0_#87573b] transition hover:-translate-y-0.5 hover:bg-[#ffedc3] active:translate-y-0.5 active:shadow-none"
            aria-label="Back to Hub"
          >
            <ArrowLeft size={17} />
            <span className="hidden sm:inline">Hub</span>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800 sm:text-xs">
              <Compass size={14} />
              The Lexi Archipelago
            </div>
            <h1 className="truncate font-serif text-lg font-black leading-tight text-[#47364d] sm:text-2xl">
              {currentTier ? currentTier.name : 'Adventure Map'}
            </h1>
          </div>
        </div>

        <div className="order-3 flex w-full flex-wrap items-center justify-between gap-2 sm:order-none sm:w-auto sm:justify-end">
          <div className="flex items-center gap-2" aria-label="Explorer currencies">
            <div className="flex min-h-10 items-center gap-1.5 rounded-xl border-2 border-amber-600/70 bg-amber-100 px-2.5 text-xs font-black text-amber-950 shadow-sm sm:px-3">
              <Coins size={16} className="text-amber-600" />
              <span className="hidden sm:inline">Lexi-Coins</span>
              <span aria-label={`${(currentUser?.lexiCoins ?? 0).toLocaleString()} Lexi-Coins`}>
                {(currentUser?.lexiCoins ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex min-h-10 items-center gap-1.5 rounded-xl border-2 border-violet-500/60 bg-violet-100 px-2.5 text-xs font-black text-violet-950 shadow-sm sm:px-3">
              <Gem size={16} className="text-violet-600" />
              <span className="hidden sm:inline">Fusion Tokens</span>
              <span aria-label={`${(currentUser?.fusionTokens ?? 0).toLocaleString()} Fusion Tokens`}>
                {(currentUser?.fusionTokens ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-1.5" aria-label="Hub navigation">
            <button
              type="button"
              onClick={() => setTab('loadout')}
              className="flex min-h-10 items-center gap-1 rounded-xl border-2 border-[#9270b9] bg-white/90 px-2.5 text-xs font-black text-violet-900 shadow-sm transition hover:bg-violet-100 sm:px-3"
            >
              <BookOpen size={15} />
              <span className="hidden sm:inline">Arsenal</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('forge')}
              className="flex min-h-10 items-center gap-1 rounded-xl border-2 border-[#d28a45] bg-white/90 px-2.5 text-xs font-black text-amber-900 shadow-sm transition hover:bg-amber-100 sm:px-3"
            >
              <Sparkles size={15} />
              <span className="hidden sm:inline">Forge</span>
            </button>
            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className="flex min-h-10 items-center gap-1 rounded-xl border-2 border-sky-600/50 bg-white/90 px-2.5 text-xs font-black text-sky-900 shadow-sm transition hover:bg-sky-100 sm:px-3"
              >
                <MapPinned size={15} />
                <span className="hidden sm:inline">Guide</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCustomizingAvatar(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-pink-500/60 bg-white/90 text-lg shadow-sm transition hover:bg-pink-100"
              aria-label="Customize explorer"
              title="Customize explorer"
            >
              {currentUser?.avatarConfig?.emoji || currentUser?.avatarEmoji || '🧭'}
            </button>
          </nav>
        </div>
      </header>

      <main className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <span className="absolute left-[5%] top-12 text-3xl opacity-60">☁️</span>
          <span className="absolute right-[9%] top-44 text-2xl opacity-65">☁️</span>
          <span className="absolute bottom-28 left-[7%] text-4xl opacity-75">🌼</span>
          <span className="absolute right-[8%] top-[58%] text-3xl opacity-75">🌲</span>
          <span className="absolute bottom-14 right-[17%] text-2xl opacity-70">🌷</span>
          <div className="absolute -left-20 top-[26%] h-48 w-64 rounded-[50%] bg-emerald-300/25 blur-3xl" />
          <div className="absolute -right-20 top-[51%] h-56 w-64 rounded-[50%] bg-sky-300/25 blur-3xl" />
          <div className="absolute -left-12 bottom-0 h-52 w-72 rounded-[50%] bg-amber-300/30 blur-3xl" />
        </div>

        <section className="relative mx-auto max-w-5xl px-3 pb-14 pt-6 sm:px-8 sm:pt-9" aria-labelledby="map-heading">
          <div className="mx-auto mb-4 max-w-xl text-center sm:mb-8">
            <p className="inline-flex items-center gap-2 rounded-full border-2 border-white/90 bg-white/65 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-900 shadow-sm sm:text-xs">
              <Wind size={14} />
              Pick a path, brave explorer
            </p>
            <h2 id="map-heading" className="mt-2 font-serif text-2xl font-black text-[#453650] drop-shadow-[0_2px_0_#fff] sm:text-4xl">
              Your next great adventure
            </h2>
            <p className="mt-1 text-xs font-bold text-[#5c566b] sm:text-sm">
              {activeIndex >= 0
                ? `Stage ${activeIndex + 1} of ${WORLD_TIERS.length} is ready. Replay any realm you have already cleared!`
                : 'Every realm is yours to revisit. Choose a completed stage to play again!'}
            </p>
          </div>

          <div className="relative mx-auto max-w-2xl">
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M50 0 C14 8 86 17 50 25 C17 33 83 42 50 50 C14 58 86 67 50 75 C16 83 84 92 50 100"
                fill="none"
                stroke="#fff5ce"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M50 0 C14 8 86 17 50 25 C17 33 83 42 50 50 C14 58 86 67 50 75 C16 83 84 92 50 100"
                fill="none"
                stroke="#9c7048"
                strokeWidth="7"
                strokeDasharray="1 2.7"
                strokeLinecap="round"
              />
            </svg>

            <ol className="relative">
              {WORLD_TIERS.map((tier, index) => {
                const state = getNodeState(index, tier.id, zoneProgress);
                const progress = zoneProgress[tier.id] || { stars: 0, cleared: false };
                const locked = state === 'locked';
                const active = state === 'active';

                return (
                  <li
                    key={tier.id}
                    className={`relative flex min-h-[176px] items-center ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}
                  >
                    {active && (
                      <span
                        className={`pointer-events-none absolute z-0 h-[142px] w-[80%] rounded-[1.8rem] bg-amber-300/55 blur-md animate-pulse ${
                          index % 2 === 0 ? 'right-[2%]' : 'left-[2%]'
                        }`}
                        aria-hidden="true"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => openTier(tier.id, index)}
                      disabled={locked}
                      aria-current={active ? 'step' : undefined}
                      aria-label={`${tier.name}, ${state}${locked ? '. Clear the previous realm to unlock.' : '. Open stage preview.'}`}
                      className={`group relative z-10 flex min-h-[132px] w-[min(78%,20rem)] flex-col rounded-[1.65rem] border-[3px] p-3 text-left shadow-[0_7px_0_#6c4a3a55,0_14px_24px_#493c3725] transition duration-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-violet-500 disabled:cursor-not-allowed ${
                        index % 2 === 0 ? 'mr-[4%]' : 'ml-[4%]'
                      } ${
                        active
                          ? 'border-amber-300 bg-gradient-to-br from-[#fffbe4] via-[#fff2bf] to-[#ffe1a0] shadow-[0_7px_0_#6c4a3a55,0_0_0_3px_#ffcc6b80,0_14px_24px_#493c3725] hover:-translate-y-1 hover:shadow-[0_9px_0_#6c4a3a55,0_0_0_5px_#ffcc6b80,0_18px_28px_#493c3740]'
                          : state === 'completed'
                          ? 'border-emerald-400 bg-gradient-to-br from-[#f2fff1] via-[#e5f7d9] to-[#d8efc5] hover:-translate-y-1 hover:shadow-[0_9px_0_#6c4a3a55,0_18px_28px_#493c3740]'
                          : 'border-slate-400/80 bg-gradient-to-br from-slate-100/95 to-slate-300/90 text-slate-600 opacity-80'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="rounded-full border border-[#8b674c]/30 bg-white/75 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#694b3c]">
                          Realm {tier.tierNumber}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                            active
                              ? 'bg-amber-500 text-white'
                              : state === 'completed'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-500 text-white'
                          }`}
                        >
                          {active ? <Swords size={11} /> : state === 'completed' ? <Check size={11} /> : <LockKeyhole size={10} />}
                          {active ? 'Ready' : state === 'completed' ? 'Cleared' : 'Locked'}
                        </span>
                      </span>

                      <span className="mt-1 flex items-center gap-3">
                        <span
                          className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-white/80 text-3xl shadow-inner ${
                            active ? 'bg-gradient-to-br from-orange-200 to-amber-400' : state === 'completed' ? 'bg-gradient-to-br from-emerald-200 to-lime-400' : 'bg-gradient-to-br from-slate-200 to-slate-400 grayscale'
                          }`}
                        >
                          {tier.icon}
                          {locked && (
                            <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-slate-600 text-white">
                              <LockKeyhole size={12} />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate font-serif text-base font-black leading-tight text-[#49374d] sm:text-lg">
                            {tier.name}
                          </strong>
                          <span className="mt-0.5 block truncate text-[10px] font-bold text-[#6b5b69] sm:text-xs">
                            {tier.subtitle}
                          </span>
                          <span className="mt-1 flex items-center gap-0.5" aria-label={`${progress.stars} of 3 stars`}>
                            {Array.from({ length: 3 }, (_, starIndex) => (
                              <Star
                                key={starIndex}
                                size={13}
                                className={starIndex < progress.stars ? 'fill-amber-400 text-amber-500' : 'fill-white/80 text-amber-300'}
                              />
                            ))}
                            {state === 'completed' && (
                              <span className="ml-1 text-[9px] font-black uppercase tracking-wide text-emerald-800">
                                Best score
                              </span>
                            )}
                          </span>
                        </span>
                        {!locked && <ChevronRight className="h-5 w-5 shrink-0 text-[#795a48] transition group-hover:translate-x-1" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border-2 border-white/90 bg-white/70 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#5b4b66] shadow sm:text-xs">
            <Sparkles size={14} className="text-amber-500" />
            {WORLD_TIERS.filter((tier) => zoneProgress[tier.id]?.cleared).length} / {WORLD_TIERS.length} realms explored
          </div>
        </section>
      </main>

      {selectedTier && selectedProgress && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#241d35]/65 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setSelectedTierId(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="encounter-title"
            className="relative my-auto w-full max-w-lg overflow-hidden rounded-[2rem] border-4 border-white bg-[#fff9e9] shadow-[0_12px_0_#51384c,0_24px_50px_#17132070]"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={`relative overflow-hidden bg-gradient-to-br ${selectedTier.bgGradient} px-5 pb-5 pt-4 text-white`}
            >
              <div className="absolute -right-6 -top-8 text-8xl opacity-25">{selectedTier.bannerEmoji}</div>
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-full border border-white/50 bg-white/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest">
                    {selectedProgress.cleared ? 'Realm cleared · replay' : `Stage ${selectedTier.tierNumber} encounter`}
                  </span>
                  <h2 id="encounter-title" className="mt-2 font-serif text-2xl font-black drop-shadow sm:text-3xl">
                    {selectedTier.name}
                  </h2>
                  <p className="text-xs font-bold text-white/90">{selectedTier.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTierId(null)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-white/60 bg-white/20 transition hover:bg-white/35"
                  aria-label="Close encounter preview"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center gap-3 rounded-2xl border-2 border-[#ead4aa] bg-white/85 p-3">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-amber-100 text-4xl shadow-inner">
                  {selectedTier.boss.spriteEmoji}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-800">Realm guardian</p>
                  <h3 className="font-serif text-lg font-black text-[#47364d]">{selectedTier.boss.name}</h3>
                  <p className="text-xs font-bold text-[#756777]">{selectedTier.boss.title}</p>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-sky-800">
                  <BookOpen size={14} />
                  Wordcraft to master
                </p>
                <p className="mt-1 text-sm font-bold leading-relaxed text-slate-700">{selectedTier.vocabConcept}</p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setSelectedTierId(null)}
                  className="flex min-h-12 flex-1 items-center justify-center rounded-xl border-2 border-[#d1b993] bg-white px-4 text-sm font-black text-[#69534b] transition hover:bg-amber-50"
                >
                  Back to map
                </button>
                <button
                  type="button"
                  onClick={launchTier}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#bd5b47] bg-gradient-to-r from-[#ff8c56] to-[#f35d6c] px-4 text-sm font-black uppercase tracking-wide text-white shadow-[0_4px_0_#a84443] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-1 active:shadow-none"
                >
                  {selectedProgress.cleared ? <Swords size={17} /> : <Play size={17} fill="currentColor" />}
                  {selectedProgress.cleared ? 'Replay realm' : 'Start encounter'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
