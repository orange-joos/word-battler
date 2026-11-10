import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  Check,
  Wand2,
  TrendingUp,
  ArrowUpDown,
  Star,
  Search,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { ELEMENTS } from '../data/elements';
import { getAllWordsList } from '../engine/forge';
import { PartOfSpeech, Word, ElementType } from '../types';
import { juice } from '../engine/juice';
import {
  canPetEvolve,
  getEvolutionBranch,
} from '../data/evolutionData';
import { EvolutionSequenceModal } from './EvolutionSequenceModal';
import { CreatureSprite } from './CreatureSprite';
import { getGradeTierMeta } from '../data/vocabDatabase';

type ArsenalTab = 'companion-roster' | 'word-catalog';
type RoleTab = 'all' | 'noun' | 'verb' | 'modifiers';

const CARD_THEMES: Record<
  string,
  { cardBg: string; headerBg: string; pedestalTop: string; pedestalSide: string }
> = {
  fire: {
    cardBg: 'from-[#16a34a] to-[#15803d]',
    headerBg: 'bg-[#14532d]/60',
    pedestalTop: '#f97316',
    pedestalSide: '#c2410c',
  },
  water: {
    cardBg: 'from-[#0ea5e9] to-[#0284c7]',
    headerBg: 'bg-[#0c4a6e]/60',
    pedestalTop: '#38bdf8',
    pedestalSide: '#0284c7',
  },
  ice: {
    cardBg: 'from-[#06b6d4] to-[#0891b2]',
    headerBg: 'bg-[#164e63]/60',
    pedestalTop: '#67e8f9',
    pedestalSide: '#0891b2',
  },
  grass: {
    cardBg: 'from-[#22c55e] to-[#16a34a]',
    headerBg: 'bg-[#14532d]/60',
    pedestalTop: '#84cc16',
    pedestalSide: '#4d7c0f',
  },
  electric: {
    cardBg: 'from-[#0284c7] to-[#0369a1]',
    headerBg: 'bg-[#0c4a6e]/60',
    pedestalTop: '#facc15',
    pedestalSide: '#ca8a04',
  },
  earth: {
    cardBg: 'from-[#d97706] to-[#b45309]',
    headerBg: 'bg-[#78350f]/60',
    pedestalTop: '#f59e0b',
    pedestalSide: '#b45309',
  },
  air: {
    cardBg: 'from-[#14b8a6] to-[#0d9488]',
    headerBg: 'bg-[#134e4a]/60',
    pedestalTop: '#5eead4',
    pedestalSide: '#0f766e',
  },
  light: {
    cardBg: 'from-[#db2777] to-[#9d174d]',
    headerBg: 'bg-[#831843]/60',
    pedestalTop: '#fde047',
    pedestalSide: '#ca8a04',
  },
  shadow: {
    cardBg: 'from-[#7e22ce] to-[#581c87]',
    headerBg: 'bg-[#3b0764]/60',
    pedestalTop: '#a855f7',
    pedestalSide: '#6b21a8',
  },
};

export const LoadoutView: React.FC = () => {
  const {
    creatures,
    words,
    playerId,
    setPlayerId,
    restartBattle,
    updatePetLoadout,
    autoEquipBestLoadout,
    useCreatureInBattle,
    trainPetWithCoins,
    evolvePet,
    setTab,
  } = useGame();
  const { currentUser } = useAuth();

  // Declutter #14: Unified 2-Tab Arsenal ('companion-roster' | 'word-catalog')
  const [activeTab, setActiveTab] = useState<ArsenalTab>('companion-roster');
  const [elementFilter, setElementFilter] = useState<ElementType | 'all'>('all');
  const [sortMode, setSortMode] = useState<'level' | 'power' | 'name'>('level');

  // Support companion & released/wild silhouette tracking (#14)
  const [supportPetId, setSupportPetId] = useState<string>('pet_aquafin');
  const [releasedPetIds, setReleasedPetIds] = useState<string[]>([]);

  // Declutter #15a: 4 Role Tabs (All, Nouns, Verbs, Modifiers) + Search Bar
  const [roleTab, setRoleTab] = useState<RoleTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [evolvingPetId, setEvolvingPetId] = useState<string | null>(null);
  const [trainFeedback, setTrainFeedback] = useState<string | null>(null);

  const allTamerPets = creatures.filter((c) => !c.id.startsWith('boss_'));
  const bossDiscoveryCreatures = creatures.filter((c) => c.id.startsWith('boss_'));

  const ownedPets = allTamerPets.filter((c) => !releasedPetIds.includes(c.id));
  const selectedPet =
    ownedPets.find((c) => c.id === playerId) || ownedPets[0] || allTamerPets[0];

  const supportPet =
    ownedPets.find((c) => c.id === supportPetId && c.id !== selectedPet.id) ||
    ownedPets.find((c) => c.id !== selectedPet.id) ||
    selectedPet;

  const allWords = getAllWordsList(words);
  const petAffinity = selectedPet.elementAffinity || selectedPet.element;
  const petLoadout = selectedPet.loadout || {
    verb: null,
    noun: null,
    adjective: null,
    adverb: null,
  };

  const getWordById = (id: string | null): Word | null => {
    if (!id) return null;
    return allWords.find((w) => w.id === id) || null;
  };

  // Owned pets sorted & filtered for the unified Companion Roster (#14)
  const filteredOwnedPets = ownedPets
    .filter((p) => (elementFilter === 'all' ? true : p.element === elementFilter))
    .sort((a, b) => {
      if (sortMode === 'level') return (b.level || 8) - (a.level || 8);
      if (sortMode === 'power') {
        const aP = a.stats.hp + a.stats.attack + a.stats.defense + a.stats.speed;
        const bP = b.stats.hp + b.stats.attack + b.stats.defense + b.stats.speed;
        return bP - aP;
      }
      return a.name.localeCompare(b.name);
    });

  // Unowned / Released / Wild Discovery silhouettes at the bottom of the roster (#14)
  const unownedSilhouettes = [
    ...allTamerPets.filter((c) => releasedPetIds.includes(c.id)),
    ...bossDiscoveryCreatures,
  ];

  // Top 4 Squad Pets for the Left Pedestals
  const squadPedestalPets = [
    selectedPet,
    supportPet,
    ...ownedPets.filter((p) => p.id !== selectedPet.id && p.id !== supportPet.id),
  ]
    .filter((v, idx, arr) => arr.findIndex((x) => x.id === v.id) === idx)
    .slice(0, 4);

  // Declutter #15a: Filtered Words using only the 4 Role Tabs + Search Bar
  const filteredWords = allWords.filter((w) => {
    if (roleTab === 'noun' && w.partOfSpeech !== 'noun') return false;
    if (roleTab === 'verb' && w.partOfSpeech !== 'verb') return false;
    if (
      roleTab === 'modifiers' &&
      w.partOfSpeech !== 'adjective' &&
      w.partOfSpeech !== 'adverb'
    ) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      const matchesWord = w.word.toLowerCase().includes(q);
      const matchesDef = (w.definition || '').toLowerCase().includes(q);
      if (!matchesWord && !matchesDef) return false;
    }
    return true;
  });

  const sortedWords = [...filteredWords].sort((a, b) => {
    const aMatch = a.element === petAffinity ? 1 : 0;
    const bMatch = b.element === petAffinity ? 1 : 0;
    if (bMatch !== aMatch) return bMatch - aMatch;
    const aPwr = a.powerBonus ?? (a.forge?.powerBonus || 0);
    const bPwr = b.powerBonus ?? (b.forge?.powerBonus || 0);
    return bPwr - aPwr;
  });

  const handleEquipLead = (id: string) => {
    juice.click();
    setPlayerId(id);
    restartBattle(id);
    setTrainFeedback('Equipped as ★ Lead Companion!');
    setTimeout(() => setTrainFeedback(null), 2000);
  };

  const handleEquipSupport = (id: string) => {
    juice.click();
    setSupportPetId(id);
    setTrainFeedback('Equipped as 🤝 Support Companion!');
    setTimeout(() => setTrainFeedback(null), 2000);
  };

  const handleReleasePet = (id: string, name: string) => {
    if (id === selectedPet.id || ownedPets.length <= 1) {
      setTrainFeedback('Equip another Lead Companion before releasing this pet!');
      setTimeout(() => setTrainFeedback(null), 2200);
      return;
    }
    juice.boing();
    setReleasedPetIds((prev) => [...prev, id]);
    setTrainFeedback(`Released ${name} to the Sanctuary Wilds (can be recalled below).`);
    setTimeout(() => setTrainFeedback(null), 2400);
  };

  const handleRecallWildPet = (id: string, name: string) => {
    juice.fanfare();
    setReleasedPetIds((prev) => prev.filter((item) => item !== id));
    setTrainFeedback(`Befriended & recalled ${name} to your Companion Roster!`);
    setTimeout(() => setTrainFeedback(null), 2200);
  };

  const handleEquipWord = (word: Word) => {
    updatePetLoadout(selectedPet.id, word.partOfSpeech, word.id);
    juice.ding(740, 90);
    juice.speakWord(word.word);
  };

  const handleTrainPet = (targetPet = selectedPet) => {
    const res = trainPetWithCoins(targetPet.id, 50);
    if (!res.success) {
      setTrainFeedback(res.error || 'Need 50 Lexi-Coins! Win battles to earn more.');
      setTimeout(() => setTrainFeedback(null), 2500);
      return;
    }
    setTrainFeedback(`Trained ${targetPet.name} to Level ${(targetPet.level || 8) + 1}!`);
    setTimeout(() => setTrainFeedback(null), 2500);
  };

  const isReadyToEvolve = canPetEvolve(selectedPet);
  const evoBranch = getEvolutionBranch(selectedPet);

  return (
    <div className="h-full w-full overflow-y-auto bg-gradient-to-b from-[#fed7aa] via-[#fef3c7] to-[#bae6fd] p-2 sm:p-4 select-none">
      <div className="mx-auto max-w-[1320px] space-y-2.5 pb-8">
        {/* ====================================================================
            TOP PASTEL STORYBOOK BINDER HEADER & 2 UNIFIED FOLDER TABS (#14)
           ==================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setTab('hub')}
              className="flex items-center gap-1.5 rounded-full border-[3px] border-[#7c2d12] bg-gradient-to-b from-[#fdba74] to-[#f97316] px-4 py-1.5 font-display text-xs sm:text-sm font-black uppercase text-white shadow-[0_4px_0_#7c2d12] hover:brightness-105 cursor-pointer"
            >
              <span>◀ BACK</span>
            </button>

            <div className="flex items-center gap-1.5 rounded-full border-[3px] border-[#78350f] bg-[#fef3c7] px-3 py-1 shadow-[0_3px_0_#78350f]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#78350f] bg-[#facc15] font-mono text-xs font-black text-[#78350f]">
                🪙
              </span>
              <span className="font-mono text-xs sm:text-sm font-black text-[#451a03]">
                {(currentUser?.lexiCoins ?? 450).toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => handleTrainPet(selectedPet)}
                title="Train Active Pet (+1 Level for 50 Coins)"
                className="ml-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#14532d] bg-[#4ade80] font-black text-xs text-[#14532d] cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => autoEquipBestLoadout(selectedPet.id, 'all')}
              className="flex items-center gap-1.5 rounded-2xl border-[3px] border-[#14532d] bg-gradient-to-b from-[#86efac] to-[#22c55e] px-3 py-1.5 font-display text-xs font-black uppercase text-[#14532d] shadow-[0_4px_0_#14532d] hover:brightness-105 cursor-pointer"
            >
              <Wand2 className="h-4 w-4" />
              <span>Auto-Loadout</span>
            </button>

            <button
              type="button"
              onClick={() => useCreatureInBattle(selectedPet.id)}
              className="flex items-center gap-1.5 rounded-2xl border-[3px] border-[#7f1d1d] bg-gradient-to-b from-[#fda4af] to-[#f43f5e] px-3.5 py-1.5 font-display text-xs font-black uppercase text-white shadow-[0_4px_0_#7f1d1d] hover:brightness-105 cursor-pointer"
            >
              <span>🐾 BATTLE ({selectedPet.name})</span>
            </button>
          </div>
        </div>

        {trainFeedback && (
          <div className="rounded-2xl border-[3px] border-[#14532d] bg-[#bbf7d0] px-4 py-2 text-center font-display text-xs sm:text-sm font-black text-[#14532d] shadow">
            ✨ {trainFeedback}
          </div>
        )}

        {/* ====================================================================
            DECLUTTER #14: 2 UNIFIED FOLDER TABS (COMPANION ROSTER & WORD CATALOG)
           ==================================================================== */}
        <div className="flex flex-wrap items-end gap-2 pl-4 -mb-3 relative z-10">
          <button
            type="button"
            onClick={() => {
              juice.click();
              setActiveTab('companion-roster');
            }}
            className={`rounded-t-3xl border-[4px] border-b-0 border-[#451a03] px-6 py-2.5 font-display text-xs sm:text-base font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'companion-roster'
                ? 'bg-[#fde68a] text-[#451a03] -translate-y-1 shadow-[0_-3px_0_rgba(255,255,255,0.6)_inset]'
                : 'bg-[#fed7aa]/80 text-[#78350f] hover:bg-[#fde68a]/70'
            }`}
          >
            🐾 COMPANION ROSTER ({ownedPets.length} Owned)
          </button>

          <button
            type="button"
            onClick={() => {
              juice.click();
              setActiveTab('word-catalog');
            }}
            className={`rounded-t-3xl border-[4px] border-b-0 border-[#14532d] px-6 py-2.5 font-display text-xs sm:text-base font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'word-catalog'
                ? 'bg-[#86efac] text-[#14532d] -translate-y-1 shadow-[0_-3px_0_rgba(255,255,255,0.6)_inset]'
                : 'bg-[#bbf7d0]/80 text-[#166534] hover:bg-[#86efac]/70'
            }`}
          >
            🔤 WORD CATALOG ({allWords.length})
          </button>
        </div>

        {/* ====================================================================
            TAB 1 (DECLUTTER #14): UNIFIED "COMPANION ROSTER"
            - Owned pets in full color with 1-click Equip Lead / Equip Support / Release
            - Unowned & wild pets shown as silhouettes at the bottom
           ==================================================================== */}
        {activeTab === 'companion-roster' && (
          <div className="overflow-hidden rounded-3xl border-[4px] border-[#1e3a8a] bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#1d4ed8] shadow-[0_8px_0_#172554]">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
              {/* LEFT 5 COLS: SQUAD PEDESTALS + ACTIVE LEAD EVOLUTION LINEUP */}
              <div className="lg:col-span-5 relative flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-b from-[#0369a1]/60 via-[#0284c7]/40 to-[#1e3a8a]/80 border-b-4 lg:border-b-0 lg:border-r-4 border-[#1e3a8a]">
                <div className="flex items-center justify-between z-10">
                  <div className="rounded-xl border-2 border-white/40 bg-[#0f172a]/70 px-3 py-1 text-white">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 block">
                      Active Squad Stage
                    </span>
                    <span className="font-display text-xs sm:text-sm font-black text-[#fde047]">
                      ★ Lead: {selectedPet.name} · 🤝 Support: {supportPet.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      juice.click();
                      setSortMode((prev) =>
                        prev === 'level' ? 'power' : prev === 'power' ? 'name' : 'level'
                      );
                    }}
                    className="flex items-center gap-1.5 rounded-xl border-[3px] border-white bg-[#0284c7] hover:bg-[#0369a1] px-3 py-1.5 font-display text-xs font-black text-white shadow-[0_3px_0_#0c4a6e] cursor-pointer"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span>Sort: {sortMode.toUpperCase()}</span>
                  </button>
                </div>

                {/* Staggered 4 Elemental Cylinder Pedestals */}
                <div className="relative my-3 grid grid-cols-2 gap-x-4 gap-y-5 items-end justify-items-center py-2">
                  {squadPedestalPets.map((pet, idx) => {
                    const isLead = pet.id === selectedPet.id;
                    const isSupport = !isLead && pet.id === supportPet.id;
                    const theme = CARD_THEMES[pet.element] || CARD_THEMES.fire;
                    const elInfo = ELEMENTS[pet.element] || ELEMENTS.fire;

                    return (
                      <div
                        key={pet.id}
                        onClick={() => handleEquipLead(pet.id)}
                        className={`group relative flex flex-col items-center cursor-pointer transition-transform ${
                          idx % 2 === 1 ? 'mt-5' : ''
                        } ${isLead ? 'scale-105 z-20' : 'hover:scale-105 z-10'}`}
                      >
                        {isLead && (
                          <span className="mb-1 rounded-full border-2 border-[#1a162b] bg-[#fde047] px-2.5 py-0.5 font-display text-[10px] font-black uppercase text-[#1a162b] shadow">
                            ★ LEAD
                          </span>
                        )}
                        {isSupport && (
                          <span className="mb-1 rounded-full border-2 border-[#1a162b] bg-cyan-300 px-2.5 py-0.5 font-display text-[10px] font-black uppercase text-[#1a162b] shadow">
                            🤝 SUPPORT
                          </span>
                        )}

                        <div className="relative z-10 -mb-5">
                          <CreatureSprite
                            creatureId={pet.forged?.sourceId || pet.id}
                            stage={pet.stage || 1}
                            element={pet.element}
                            size="lg"
                          />
                        </div>

                        <div className="relative w-34 sm:w-38 flex flex-col items-center">
                          <svg viewBox="0 0 160 66" className="w-full h-auto overflow-visible">
                            <ellipse cx="80" cy="56" rx="68" ry="12" fill="rgba(15, 23, 42, 0.45)" />
                            <path
                              d="M16,22 L16,44 A64,16 0 0,0 144,44 L144,22 Z"
                              fill={theme.pedestalSide}
                              stroke="#1a162b"
                              strokeWidth="3.5"
                            />
                            <ellipse
                              cx="80"
                              cy="22"
                              rx="64"
                              ry="16"
                              fill={theme.pedestalTop}
                              stroke="#1a162b"
                              strokeWidth="3.5"
                            />
                          </svg>
                          <div className="-mt-6 z-20 flex h-8 w-8 items-center justify-center rounded-xl border-[3px] border-[#1a162b] bg-white text-base shadow-[0_3px_0_#1a162b]">
                            {elInfo.icon}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Compact 3-Stage Evolution Preview + Train & Evolve Bar for Active Lead */}
                <div className="space-y-2 rounded-2xl border-[3px] border-[#1a162b] bg-[#0f172a]/90 p-3 text-white shadow-[0_4px_0_#090714]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-display text-sm font-black text-[#fde047]">
                        {selectedPet.name} · Stage {selectedPet.stage || 1}/3 (Lv.{selectedPet.level || 8})
                      </div>
                      <div className="text-[11px] font-bold text-sky-200">
                        HP {selectedPet.stats.hp} · ATK {selectedPet.stats.attack} · DEF {selectedPet.stats.defense}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleTrainPet(selectedPet)}
                        className="flex items-center gap-1 rounded-xl border-2 border-[#1a162b] bg-[#fde047] hover:bg-[#facc15] px-3 py-1.5 font-display text-xs font-black text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
                      >
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>Train (50 🪙)</span>
                      </button>
                      {isReadyToEvolve && (
                        <button
                          type="button"
                          onClick={() => setEvolvingPetId(selectedPet.id)}
                          className="flex items-center gap-1 rounded-xl border-2 border-[#1a162b] bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1.5 font-display text-xs font-black text-white shadow-[0_3px_0_#1a162b] animate-pulse cursor-pointer"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Evolve!</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mini 3-Stage Evolution Strip */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/15">
                    {evoBranch.map((stg) => {
                      const unlocked = (selectedPet.stage || 1) >= stg.stage;
                      return (
                        <div
                          key={stg.stage}
                          className={`flex items-center gap-1.5 rounded-xl border px-2 py-1 text-[10px] font-black ${
                            unlocked
                              ? 'border-[#fde047]/60 bg-white/10 text-white'
                              : 'border-white/10 bg-black/30 text-slate-400'
                          }`}
                        >
                          <span>Stg {stg.stage}:</span>
                          <span className="truncate text-[#fde047]">{stg.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT 7 COLS: UNIFIED COMPANION ROSTER (OWNED FULL-COLOR + UNOWNED SILHOUETTES AT BOTTOM) */}
              <div className="lg:col-span-7 flex flex-col bg-[#0284c7]/25">
                {/* Element Filter Bar */}
                <div className="flex items-center overflow-x-auto border-b-4 border-[#1e3a8a] bg-[#0369a1]">
                  <button
                    type="button"
                    onClick={() => {
                      juice.click();
                      setElementFilter('all');
                    }}
                    className={`flex flex-col items-center justify-center px-5 py-2 border-r-2 border-[#1e3a8a] font-display text-xs font-black uppercase transition cursor-pointer shrink-0 ${
                      elementFilter === 'all'
                        ? 'bg-[#0284c7] text-white border-b-4 border-b-[#38bdf8]'
                        : 'text-sky-200 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-lg">💠</span>
                    <span>ALL</span>
                  </button>

                  {(
                    ['fire', 'grass', 'electric', 'water', 'ice', 'earth', 'air', 'light', 'shadow'] as ElementType[]
                  ).map((elemKey) => {
                    const el = ELEMENTS[elemKey];
                    const isActive = elementFilter === elemKey;
                    return (
                      <button
                        key={elemKey}
                        type="button"
                        onClick={() => {
                          juice.click();
                          setElementFilter(elemKey);
                        }}
                        className={`flex flex-col items-center justify-center px-4 py-2 border-r-2 border-[#1e3a8a] font-display text-[11px] font-black uppercase transition cursor-pointer shrink-0 ${
                          isActive
                            ? 'bg-[#0284c7] text-[#fde047] border-b-4 border-b-[#fde047]'
                            : 'text-sky-100 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xl drop-shadow">{el.icon}</span>
                        <span>{el.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Scrollable Unified Roster Grid */}
                <div className="p-4 overflow-y-auto max-h-[520px] space-y-5">
                  {/* 1. Owned Full-Color Companions with 1-Click Equip Lead / Equip Support / Release */}
                  <div>
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="font-display text-xs font-black uppercase tracking-wider text-[#fde047]">
                        ★ Owned Companions ({filteredOwnedPets.length})
                      </span>
                      <span className="text-[11px] font-bold text-sky-100">
                        1-Click Equip Lead, Equip Support, or Release
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                      {filteredOwnedPets.map((pet) => {
                        const isLead = pet.id === selectedPet.id;
                        const isSupport = !isLead && pet.id === supportPet.id;
                        const theme = CARD_THEMES[pet.element] || CARD_THEMES.fire;
                        const elInfo = ELEMENTS[pet.element] || ELEMENTS.fire;
                        const starCount = Math.min(5, Math.max(3, (pet.stage || 1) + 2));

                        return (
                          <div
                            key={pet.id}
                            className={`group relative flex flex-col justify-between rounded-2xl border-[3px] bg-gradient-to-b ${theme.cardBg} p-3 text-white transition-all ${
                              isLead
                                ? 'border-[#fde047] ring-4 ring-[#fde047]/60 shadow-[0_7px_0_#0f172a]'
                                : isSupport
                                ? 'border-cyan-300 ring-2 ring-cyan-300/60 shadow-[0_6px_0_#0f172a]'
                                : 'border-[#0f172a] shadow-[0_5px_0_#0f172a]'
                            }`}
                          >
                            {(isLead || isSupport) && (
                              <div
                                className={`absolute -top-2.5 -right-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white shadow-md ${
                                  isLead ? 'bg-[#22c55e]' : 'bg-cyan-500'
                                }`}
                                title={isLead ? 'Active Lead Companion' : 'Active Support Companion'}
                              >
                                <Check className="h-4 w-4 stroke-[3.5] text-white" />
                              </div>
                            )}

                            <div className={`flex items-center gap-2 rounded-xl ${theme.headerBg} px-2.5 py-1.5 border border-white/20`}>
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#1a162b] bg-white/95 text-lg shadow-xs">
                                {elInfo.icon}
                              </span>
                              <div className="leading-tight overflow-hidden">
                                <div className="font-display text-sm font-black text-white truncate drop-shadow-[0_1.5px_0_#000]">
                                  {pet.name}
                                </div>
                                <div className="font-mono text-[11px] font-black text-[#fde047]">
                                  Lvl {pet.level || 8} · Stg {pet.stage || 1}
                                </div>
                              </div>
                            </div>

                            <div
                              onClick={() => handleEquipLead(pet.id)}
                              className="my-2 flex items-center justify-center py-1 cursor-pointer"
                            >
                              <CreatureSprite
                                creatureId={pet.forged?.sourceId || pet.id}
                                stage={pet.stage || 1}
                                element={pet.element}
                                size="md"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-center gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`h-3.5 w-3.5 ${
                                      s <= starCount
                                        ? 'fill-[#facc15] text-[#ca8a04]'
                                        : 'fill-black/30 text-black/40'
                                    } drop-shadow`}
                                  />
                                ))}
                              </div>

                              {/* Declutter #14: 1-Click Equip Lead / Equip Support / Release */}
                              <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/20 text-[10px] font-black">
                                <button
                                  type="button"
                                  onClick={() => handleEquipLead(pet.id)}
                                  className={`rounded-lg py-1 px-1 text-center cursor-pointer transition ${
                                    isLead
                                      ? 'bg-[#fde047] text-[#1a162b]'
                                      : 'bg-black/40 hover:bg-black/60 text-white'
                                  }`}
                                >
                                  {isLead ? '★ Lead' : 'Equip Lead'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEquipSupport(pet.id)}
                                  className={`rounded-lg py-1 px-1 text-center cursor-pointer transition ${
                                    isSupport
                                      ? 'bg-cyan-300 text-[#1a162b]'
                                      : 'bg-black/40 hover:bg-black/60 text-cyan-200'
                                  }`}
                                >
                                  {isSupport ? '🤝 Support' : 'Support'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReleasePet(pet.id, pet.name)}
                                  className="rounded-lg bg-rose-950/70 hover:bg-rose-800 py-1 px-1 text-center text-rose-200 cursor-pointer transition"
                                  title="Release to Sanctuary Wilds"
                                >
                                  Release
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Unowned / Undiscovered Companions as Silhouettes at the Bottom (#14) */}
                  <div className="pt-3 border-t-2 border-white/20">
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="font-display text-xs font-black uppercase tracking-wider text-sky-200">
                        🌑 Unowned &amp; Wild Discovery Silhouettes ({unownedSilhouettes.length})
                      </span>
                      <span className="text-[10px] font-bold text-sky-200/80">
                        Befriend in Word World Realms or click to recall
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                      {unownedSilhouettes.map((silhouettePet) => {
                        const isReleasedTamerPet = !silhouettePet.id.startsWith('boss_');
                        const elInfo = ELEMENTS[silhouettePet.element] || ELEMENTS.fire;

                        return (
                          <div
                            key={silhouettePet.id}
                            className="flex flex-col items-center justify-between rounded-2xl border-2 border-slate-700 bg-slate-950/75 p-3 text-center text-slate-300 shadow-inner"
                          >
                            <div className="w-full flex items-center justify-between text-[10px] font-black text-slate-400">
                              <span>{elInfo.icon} {elInfo.name}</span>
                              <span>{isReleasedTamerPet ? 'WILD' : 'MYTHIC'}</span>
                            </div>

                            {/* Silhouette Sprite */}
                            <div className="my-2 brightness-0 contrast-200 opacity-60">
                              <CreatureSprite
                                creatureId={silhouettePet.forged?.sourceId || silhouettePet.id}
                                stage={silhouettePet.stage || 3}
                                element={silhouettePet.element}
                                size="sm"
                                animated={false}
                              />
                            </div>

                            <div className="w-full space-y-1">
                              <div className="font-display text-xs font-black text-slate-200 truncate">
                                {isReleasedTamerPet ? silhouettePet.name : `??? (${elInfo.name})`}
                              </div>
                              {isReleasedTamerPet ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRecallWildPet(silhouettePet.id, silhouettePet.name)
                                  }
                                  className="w-full rounded-lg border border-amber-400 bg-amber-400/20 hover:bg-amber-400/35 py-1 text-[10px] font-black uppercase text-[#fde047] cursor-pointer"
                                >
                                  Recall Pet
                                </button>
                              ) : (
                                <div className="text-[9px] font-bold text-slate-400">
                                  Clear {elInfo.name} Stage 10
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 2 (DECLUTTER #15a): "WORD CATALOG"
            Replaced the 21 simultaneous filter buttons with 4 Role Tabs
            (All, Nouns, Verbs, Modifiers) and a clean Search Bar.
           ==================================================================== */}
        {activeTab === 'word-catalog' && (
          <div className="rounded-3xl border-[4px] border-[#b45309] bg-[#fef3c7] p-3.5 sm:p-5 shadow-[0_8px_0_#78350f] space-y-4">
            {/* Active Companion's 4 Equipped Sentence Slots */}
            <div className="rounded-2xl border-[3px] border-[#d97706] bg-[#fffbeb] p-3.5 shadow-inner space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CreatureSprite
                    creatureId={selectedPet.forged?.sourceId || selectedPet.id}
                    stage={selectedPet.stage || 1}
                    element={selectedPet.element}
                    size="xs"
                  />
                  <span className="font-display text-sm sm:text-base font-black text-[#451a03]">
                    {selectedPet.name}’s Equipped 4-Card Sentence Deck
                  </span>
                </div>
                <span className="text-xs font-bold text-[#78350f]">
                  Click any word below to equip it into its matching slot
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(
                  [
                    { pos: 'adjective' as PartOfSpeech, label: '1. Adjective (Modifier)', bg: 'bg-[#fed7aa] border-[#ea580c]' },
                    { pos: 'noun' as PartOfSpeech, label: '2. Noun', bg: 'bg-[#bae6fd] border-[#0284c7]' },
                    { pos: 'verb' as PartOfSpeech, label: '3. Verb', bg: 'bg-[#fecdd3] border-[#e11d48]' },
                    { pos: 'adverb' as PartOfSpeech, label: '4. Adverb (Modifier)', bg: 'bg-[#e9d5ff] border-[#9333ea]' },
                  ] as const
                ).map(({ pos, label, bg }) => {
                  const equipped = getWordById(petLoadout[pos]);
                  return (
                    <div
                      key={pos}
                      className={`rounded-xl border-2 p-2.5 text-left ${bg}`}
                    >
                      <div className="text-[10px] font-black uppercase text-[#451a03]/80">
                        {label}
                      </div>
                      <div className="font-display text-sm sm:text-base font-black text-[#1a162b] truncate">
                        {equipped ? equipped.word : 'Empty'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Declutter #15a: 4 Role Tabs (All, Nouns, Verbs, Modifiers) + Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-[3px] border-[#d97706] bg-[#fffbeb] p-3">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'all', label: '📚 All Words' },
                    { id: 'noun', label: '🛡️ Nouns' },
                    { id: 'verb', label: '⚡ Verbs' },
                    { id: 'modifiers', label: '🎨 Modifiers (Adj / Adv)' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      juice.click();
                      setRoleTab(tab.id);
                    }}
                    className={`rounded-xl border-2 px-4 py-2 font-display text-xs sm:text-sm font-black uppercase transition cursor-pointer ${
                      roleTab === tab.id
                        ? 'border-[#1a162b] bg-[#fde047] text-[#1a162b] shadow-[0_3px_0_#1a162b]'
                        : 'border-[#d97706]/50 bg-white text-[#78350f] hover:bg-amber-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#78350f]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search words or meanings..."
                  className="w-full rounded-xl border-2 border-[#78350f] bg-white pl-9 pr-3 py-2 font-display text-xs sm:text-sm font-bold text-[#1a162b] placeholder:text-[#78350f]/60 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                />
              </div>
            </div>

            {/* Rounded Color-Coded Catalog Tiles Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
              {sortedWords.map((word) => {
                const isEquipped = petLoadout[word.partOfSpeech] === word.id;
                const tierMeta = getGradeTierMeta(word.gradeTier);
                const elInfo = ELEMENTS[word.element] || ELEMENTS.fire;
                const pwr = word.powerBonus ?? word.forge?.powerBonus ?? tierMeta.powerBonus;

                const tileFrame =
                  word.element === 'fire'
                    ? 'bg-[#fed7aa] border-[#ea580c] text-[#7c2d12]'
                    : word.element === 'water' || word.element === 'ice'
                    ? 'bg-[#bae6fd] border-[#0284c7] text-[#0c4a6e]'
                    : word.element === 'grass'
                    ? 'bg-[#bbf7d0] border-[#16a34a] text-[#14532d]'
                    : word.element === 'shadow'
                    ? 'bg-[#e9d5ff] border-[#9333ea] text-[#581c87]'
                    : 'bg-[#fef08a] border-[#ca8a04] text-[#713f12]';

                return (
                  <div
                    key={word.id}
                    onClick={() => handleEquipWord(word)}
                    className={`group relative flex flex-col justify-between rounded-2xl border-[3px] p-2.5 text-center transition cursor-pointer shadow-[0_4px_0_rgba(0,0,0,0.18)] ${tileFrame} ${
                      isEquipped ? 'ring-4 ring-[#16a34a] -translate-y-1' : 'hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] font-black uppercase">
                      <span className="rounded bg-white/80 px-1.5 py-0.2 border border-current">
                        {word.partOfSpeech}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          juice.speakWord(`${word.word}. ${word.definition}`);
                        }}
                        className="rounded-lg bg-white/80 p-1 hover:bg-white cursor-pointer"
                        title="Pronounce Word"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="my-1.5 rounded-xl bg-white/75 py-2 px-1 border border-current/20">
                      <div className="text-xl">{elInfo.icon}</div>
                      <div className="font-display text-sm font-black text-[#1a162b] truncate">
                        {word.word}
                      </div>
                      <div className="text-[10px] font-bold text-slate-700 line-clamp-2 leading-tight mt-0.5">
                        {word.definition}
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border-2 border-current bg-white/90 px-2 py-0.5 text-[10px] font-black">
                      <span>{tierMeta.shortLabel}</span>
                      <span>+{pwr} PWR</span>
                    </div>

                    {isEquipped && (
                      <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#16a34a] text-white shadow">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {evolvingPetId && (
        <EvolutionSequenceModal
          creature={creatures.find((c) => c.id === evolvingPetId) || selectedPet}
          onComplete={(evolved) => {
            evolvePet(evolved.id);
            setEvolvingPetId(null);
          }}
          onClose={() => setEvolvingPetId(null)}
        />
      )}
    </div>
  );
};
export default LoadoutView;
