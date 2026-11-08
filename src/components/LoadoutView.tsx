import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  Check,
  Swords,
  Shield,
  Heart,
  Zap,
  Wand2,
  TrendingUp,
  Coins,
  ArrowUpDown,
  Star,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { ELEMENTS } from '../data/elements';
import { getAllWordsList } from '../engine/forge';
import { PartOfSpeech, Word, GradeTier, ElementType } from '../types';
import { juice } from '../engine/juice';
import {
  canPetEvolve,
  getEvolutionBranch,
  getNextEvolutionStage,
} from '../data/evolutionData';
import { EvolutionSequenceModal } from './EvolutionSequenceModal';
import { CreatureSprite } from './CreatureSprite';
import { GRADE_TIERS, getGradeTierMeta } from '../data/vocabDatabase';

type ArsenalTab = 'my-creatures' | 'word-catalog' | 'charabom-bestiary';

const LETTER_GROUPS = [
  { id: 'ALL', label: 'ALL', letters: null, bg: 'bg-[#fde047] border-[#ca8a04] text-[#1a162b]' },
  { id: 'A', label: 'A', letters: ['a'], bg: 'bg-[#fca5a5] border-[#dc2626] text-[#7f1d1d]' },
  { id: 'B', label: 'B', letters: ['b'], bg: 'bg-[#86efac] border-[#16a34a] text-[#14532d]' },
  { id: 'C', label: 'C', letters: ['c'], bg: 'bg-[#93c5fd] border-[#2563eb] text-[#1e3a8a]' },
  { id: 'D', label: 'D', letters: ['d'], bg: 'bg-[#d8b4fe] border-[#9333ea] text-[#581c87]' },
  { id: 'E-H', label: 'E–H', letters: ['e', 'f', 'g', 'h'], bg: 'bg-[#fdba74] border-[#ea580c] text-[#7c2d12]' },
  { id: 'I-L', label: 'I–L', letters: ['i', 'j', 'k', 'l'], bg: 'bg-[#6ee7b7] border-[#059669] text-[#064e3b]' },
  { id: 'M-P', label: 'M–P', letters: ['m', 'n', 'o', 'p'], bg: 'bg-[#7dd3fc] border-[#0284c7] text-[#0c4a6e]' },
  { id: 'Q-T', label: 'Q–T', letters: ['q', 'r', 's', 't'], bg: 'bg-[#f9a8d4] border-[#db2777] text-[#831843]' },
  { id: 'U-Z', label: 'U–Z', letters: ['u', 'v', 'w', 'x', 'y', 'z'], bg: 'bg-[#fde047] border-[#ca8a04] text-[#713f12]' },
] as const;

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
    levelUpPet,
    evolvePet,
    setTab,
  } = useGame();
  const { currentUser, addRewards } = useAuth();

  const [activeTab, setActiveTab] = useState<ArsenalTab>('my-creatures');
  const [elementFilter, setElementFilter] = useState<ElementType | 'all'>('all');
  const [sortMode, setSortMode] = useState<'level' | 'power' | 'name'>('level');

  // Word Catalog Filters
  const [letterFilter, setLetterFilter] = useState<string>('ALL');
  const [wordElemFilter, setWordElemFilter] = useState<ElementType | 'all'>('all');
  const [activeSlotFilter, setActiveSlotFilter] = useState<PartOfSpeech | 'all'>('all');
  const [gradeFilter, setGradeFilter] = useState<GradeTier | 'all'>('all');

  // Bestiary Inspector state
  const [bestiaryInspectId, setBestiaryInspectId] = useState<string>(playerId);
  const [evolvingPetId, setEvolvingPetId] = useState<string | null>(null);
  const [trainFeedback, setTrainFeedback] = useState<string | null>(null);

  const selectablePets = creatures.filter((c) => !c.id.startsWith('boss_'));
  const selectedPet =
    selectablePets.find((c) => c.id === playerId) || selectablePets[0];

  const inspectedCreature =
    creatures.find((c) => c.id === bestiaryInspectId) || selectedPet;

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

  // Filtered & sorted companions for Mode 1 (Reference #5)
  const filteredPets = selectablePets
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

  // Top 4 Squad Pets for the 4 Left Pedestals in Reference #5
  const squadPedestalPets = [
    selectedPet,
    ...selectablePets.filter((p) => p.id !== selectedPet.id),
  ].slice(0, 4);

  // Filtered Words for Mode 2 (Reference #2 Binder)
  const activeLetterObj = LETTER_GROUPS.find((g) => g.id === letterFilter);
  const filteredWords = allWords.filter((w) => {
    if (activeSlotFilter !== 'all' && w.partOfSpeech !== activeSlotFilter) return false;
    if (gradeFilter !== 'all' && (w.gradeTier || '3') !== gradeFilter) return false;
    if (wordElemFilter !== 'all' && w.element !== wordElemFilter) return false;
    if (activeLetterObj?.letters) {
      const firstChar = w.word.charAt(0).toLowerCase();
      if (!activeLetterObj.letters.includes(firstChar as never)) return false;
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

  const handleSelectPet = (id: string) => {
    juice.click();
    setPlayerId(id);
    setBestiaryInspectId(id);
    restartBattle(id);
  };

  const handleEquipWord = (word: Word) => {
    updatePetLoadout(selectedPet.id, word.partOfSpeech, word.id);
    juice.ding(740, 90);
    juice.speakWord(word.word);
  };

  const handleTrainPet = (targetPet = selectedPet) => {
    const coins = currentUser?.lexiCoins ?? 0;
    if (coins < 50) {
      setTrainFeedback('Need 50 Lexi-Coins! Win battles to earn more.');
      setTimeout(() => setTrainFeedback(null), 2500);
      return;
    }
    addRewards({ coins: -50 });
    levelUpPet(targetPet.id, 1);
    setTrainFeedback(`Trained ${targetPet.name} to Level ${(targetPet.level || 8) + 1}!`);
    setTimeout(() => setTrainFeedback(null), 2500);
  };

  const isReadyToEvolve = canPetEvolve(selectedPet);
  const nextEvo = getNextEvolutionStage(selectedPet);
  const evoBranch = getEvolutionBranch(inspectedCreature);

  return (
    <div className="h-full w-full overflow-y-auto bg-gradient-to-b from-[#fed7aa] via-[#fef3c7] to-[#bae6fd] p-2 sm:p-4 select-none">
      <div className="mx-auto max-w-[1320px] space-y-2.5 pb-8">
        {/* ====================================================================
            TOP PASTEL STORYBOOK BINDER HEADER & FOLDER TABS (Reference #2)
           ==================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          {/* Top-Left: BACK Pill + Coin Counter + Star Progress Bar (Reference #2) */}
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
                C
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

            {/* Star Progress Pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border-[3px] border-[#581c87] bg-[#e9d5ff] px-3 py-1 shadow-[0_3px_0_#581c87]">
              <span className="text-base">⭐</span>
              <div className="relative h-4 w-24 overflow-hidden rounded-full border-2 border-[#581c87] bg-[#581c87]/30">
                <div
                  className="h-full bg-gradient-to-r from-[#84cc16] to-[#22c55e]"
                  style={{ width: `${Math.min(100, Math.round((selectablePets.length / 7) * 100))}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-black text-white drop-shadow">
                  {selectablePets.length} / 7 Pets
                </span>
              </div>
            </div>
          </div>

          {/* Top-Right Action Buttons: Auto-Equip, Train, Battle (Reference #2) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => autoEquipBestLoadout(selectedPet.id, gradeFilter)}
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
            ROUNDED FOLDER TABS ABOVE BINDER FRAME (Reference #2)
           ==================================================================== */}
        <div className="flex flex-wrap items-end gap-2 pl-4 -mb-3 relative z-10">
          <button
            type="button"
            onClick={() => {
              juice.click();
              setActiveTab('my-creatures');
            }}
            className={`rounded-t-3xl border-[4px] border-b-0 border-[#451a03] px-6 py-2.5 font-display text-xs sm:text-base font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'my-creatures'
                ? 'bg-[#fde68a] text-[#451a03] -translate-y-1 shadow-[0_-3px_0_rgba(255,255,255,0.6)_inset]'
                : 'bg-[#fed7aa]/80 text-[#78350f] hover:bg-[#fde68a]/70'
            }`}
          >
            🐾 MY CREATURES ({selectablePets.length})
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

          <button
            type="button"
            onClick={() => {
              juice.click();
              setActiveTab('charabom-bestiary');
            }}
            className={`rounded-t-3xl border-[4px] border-b-0 border-[#581c87] px-6 py-2.5 font-display text-xs sm:text-base font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'charabom-bestiary'
                ? 'bg-[#d8b4fe] text-[#581c87] -translate-y-1 shadow-[0_-3px_0_rgba(255,255,255,0.6)_inset]'
                : 'bg-[#e9d5ff]/80 text-[#6b21a8] hover:bg-[#d8b4fe]/70'
            }`}
          >
            👾 CHARABOM BESTIARY &amp; EVOLUTIONS
          </button>
        </div>

        {/* ====================================================================
            TAB 1: "MY CREATURES" — 4 ELEMENTAL SQUAD PEDESTALS + ELEMENTAL CARD GRID
            (Directly modeled on Reference #5: Screenshot_2026-11-08_083745_3a251a0c.png)
           ==================================================================== */}
        {activeTab === 'my-creatures' && (
          <div className="overflow-hidden rounded-3xl border-[4px] border-[#1e3a8a] bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#1d4ed8] shadow-[0_8px_0_#172554]">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
              {/* LEFT 5 COLS: 4 ELEMENTAL CYLINDER PEDESTALS STAGE (Reference #5 Left) */}
              <div className="lg:col-span-5 relative flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-b from-[#0369a1]/60 via-[#0284c7]/40 to-[#1e3a8a]/80 border-b-4 lg:border-b-0 lg:border-r-4 border-[#1e3a8a]">
                {/* Top Bar: Sort Button & Active Partner Info */}
                <div className="flex items-center justify-between z-10">
                  <div className="rounded-xl border-2 border-white/40 bg-[#0f172a]/70 px-3 py-1 text-white">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 block">
                      Active Squad Stage
                    </span>
                    <span className="font-display text-sm font-black text-[#fde047]">
                      Lead: {selectedPet.name} (Lv.{selectedPet.level || 8})
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
                    className="flex items-center gap-1.5 rounded-xl border-[3px] border-white bg-[#0284c7] hover:bg-[#0369a1] px-3.5 py-1.5 font-display text-xs font-black text-white shadow-[0_3px_0_#0c4a6e] cursor-pointer"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span>Sort: {sortMode.toUpperCase()}</span>
                  </button>
                </div>

                {/* Staggered 4 Elemental Cylinder Pedestals (2x2 Diamond Formation like Reference #5) */}
                <div className="relative my-4 grid grid-cols-2 gap-x-4 gap-y-6 items-end justify-items-center py-2">
                  {squadPedestalPets.map((pet, idx) => {
                    const isLead = pet.id === selectedPet.id;
                    const theme = CARD_THEMES[pet.element] || CARD_THEMES.fire;
                    const elInfo = ELEMENTS[pet.element] || ELEMENTS.fire;
                    const canEvo = canPetEvolve(pet);

                    return (
                      <div
                        key={pet.id}
                        onClick={() => handleSelectPet(pet.id)}
                        className={`group relative flex flex-col items-center cursor-pointer transition-transform ${
                          idx % 2 === 1 ? 'mt-6' : ''
                        } ${isLead ? 'scale-105 z-20' : 'hover:scale-105 z-10'}`}
                      >
                        {isLead && (
                          <span className="mb-1 rounded-full border-2 border-[#1a162b] bg-[#fde047] px-2.5 py-0.5 font-display text-[10px] font-black uppercase text-[#1a162b] shadow">
                            ★ LEAD PARTNER
                          </span>
                        )}
                        {canEvo && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlayerId(pet.id);
                              setEvolvingPetId(pet.id);
                            }}
                            className="mb-1 rounded-full border-2 border-[#1a162b] bg-gradient-to-r from-amber-300 to-orange-400 px-2.5 py-0.5 font-display text-[10px] font-black uppercase text-[#1a162b] animate-bounce shadow cursor-pointer"
                          >
                            ✨ EVOLVE!
                          </button>
                        )}

                        {/* Pet Sprite Standing on Cylinder Pedestal */}
                        <div className="relative z-10 -mb-5">
                          <CreatureSprite
                            creatureId={pet.forged?.sourceId || pet.id}
                            stage={pet.stage || 1}
                            element={pet.element}
                            size="lg"
                          />
                        </div>

                        {/* 3D Colorful Elemental Cylinder Pedestal with Front Gem Badge (Reference #5) */}
                        <div className="relative w-36 sm:w-40 flex flex-col items-center">
                          <svg viewBox="0 0 160 66" className="w-full h-auto overflow-visible">
                            {/* Drop Shadow */}
                            <ellipse cx="80" cy="56" rx="68" ry="12" fill="rgba(15, 23, 42, 0.45)" />
                            {/* Cylinder Side Wall */}
                            <path
                              d="M16,22 L16,44 A64,16 0 0,0 144,44 L144,22 Z"
                              fill={theme.pedestalSide}
                              stroke="#1a162b"
                              strokeWidth="3.5"
                            />
                            {/* Cylinder Top Disc */}
                            <ellipse
                              cx="80"
                              cy="22"
                              rx="64"
                              ry="16"
                              fill={theme.pedestalTop}
                              stroke="#1a162b"
                              strokeWidth="3.5"
                            />
                            {/* Inner Highlight Ring */}
                            <ellipse
                              cx="80"
                              cy="21"
                              rx="50"
                              ry="11"
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth="2"
                              opacity="0.45"
                            />
                          </svg>

                          {/* Elemental Gem Badge Mounted on Front of Pedestal */}
                          <div className="-mt-6 z-20 flex h-9 w-9 items-center justify-center rounded-xl border-[3px] border-[#1a162b] bg-white text-lg shadow-[0_3px_0_#1a162b]">
                            {elInfo.icon}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Companion Quick Train & Evolve Bar at Bottom-Left (Reference #5) */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-[3px] border-[#1a162b] bg-[#0f172a]/85 p-3 text-white shadow-[0_4px_0_#090714]">
                  <div>
                    <div className="font-display text-sm font-black text-[#fde047]">
                      {selectedPet.name} · Stage {selectedPet.stage || 1}/3
                    </div>
                    <div className="text-[11px] font-bold text-sky-200">
                      HP {selectedPet.stats.hp} · ATK {selectedPet.stats.attack} · DEF {selectedPet.stats.defense} · SPD {selectedPet.stats.speed}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
              </div>

              {/* RIGHT 7 COLS: ELEMENTAL FILTER TABS + 3-COL VIBRANT CREATURE CARDS (Reference #5 Right) */}
              <div className="lg:col-span-7 flex flex-col bg-[#0284c7]/25">
                {/* Top Elemental Gem Filter Tabs Bar (Reference #5 Top-Right) */}
                <div className="flex items-center overflow-x-auto border-b-4 border-[#1e3a8a] bg-[#0369a1]">
                  <button
                    type="button"
                    onClick={() => {
                      juice.click();
                      setElementFilter('all');
                    }}
                    className={`flex flex-col items-center justify-center px-5 py-2.5 border-r-2 border-[#1e3a8a] font-display text-xs font-black uppercase transition cursor-pointer shrink-0 ${
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
                        className={`flex flex-col items-center justify-center px-4 py-2.5 border-r-2 border-[#1e3a8a] font-display text-[11px] font-black uppercase transition cursor-pointer shrink-0 ${
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

                {/* 3-Column Color-Coded Creature Card Grid with 5 Stars & Checkmarks (Reference #5) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 p-4 overflow-y-auto max-h-[500px]">
                  {filteredPets.map((pet) => {
                    const isSelected = pet.id === selectedPet.id;
                    const isInSquad = squadPedestalPets.some((s) => s.id === pet.id);
                    const theme = CARD_THEMES[pet.element] || CARD_THEMES.fire;
                    const elInfo = ELEMENTS[pet.element] || ELEMENTS.fire;
                    const starCount = Math.min(5, Math.max(3, (pet.stage || 1) + 2));

                    return (
                      <div
                        key={pet.id}
                        onClick={() => handleSelectPet(pet.id)}
                        className={`group relative flex flex-col justify-between rounded-2xl border-[3px] bg-gradient-to-b ${theme.cardBg} p-3 text-white transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#fde047] ring-4 ring-[#fde047]/60 -translate-y-1 shadow-[0_7px_0_#0f172a]'
                            : 'border-[#0f172a] hover:-translate-y-1 shadow-[0_5px_0_#0f172a]'
                        }`}
                      >
                        {/* Green Checkmark Badge in Top-Right Corner (Reference #5) */}
                        {(isSelected || isInSquad) && (
                          <div
                            className={`absolute -top-2.5 -right-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white shadow-md ${
                              isSelected ? 'bg-[#22c55e]' : 'bg-[#10b981]'
                            }`}
                          >
                            <Check className="h-4 w-4 stroke-[3.5] text-white" />
                          </div>
                        )}

                        {/* Angled Top Header Banner with Element Gem, Name & Level (Reference #5) */}
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

                        {/* Center Creature Illustration */}
                        <div className="my-2 flex items-center justify-center py-1">
                          <CreatureSprite
                            creatureId={pet.forged?.sourceId || pet.id}
                            stage={pet.stage || 1}
                            element={pet.element}
                            size="md"
                          />
                        </div>

                        {/* Bottom 5 Gold Stars Row (Reference #5) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-4 w-4 ${
                                  s <= starCount
                                    ? 'fill-[#facc15] text-[#ca8a04]'
                                    : 'fill-black/30 text-black/40'
                                } drop-shadow`}
                              />
                            ))}
                          </div>

                          <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/20 text-[10px] font-black">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPet(pet.id);
                                setActiveTab('word-catalog');
                              }}
                              className="rounded-lg bg-black/35 hover:bg-black/55 px-2 py-1 text-sky-200 cursor-pointer"
                            >
                              🔤 Loadout
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBestiaryInspectId(pet.id);
                                setActiveTab('charabom-bestiary');
                              }}
                              className="rounded-lg bg-black/35 hover:bg-black/55 px-2 py-1 text-[#fde047] cursor-pointer"
                            >
                              🔎 Inspect
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 2: "WORD CATALOG" — ALPHABET A–Z + ELEMENT TILES + ROUNDED BINDER
            (Directly modeled on Reference #2: IMG_4202_7f9ccdf4.JPG)
           ==================================================================== */}
        {activeTab === 'word-catalog' && (
          <div className="rounded-3xl border-[4px] border-[#b45309] bg-[#fef3c7] p-3.5 sm:p-5 shadow-[0_8px_0_#78350f]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* LEFT 4 COLS: PASTEL A–Z ALPHABET BLOCKS & ELEMENT TILES (Reference #2 Left Panel) */}
              <div className="lg:col-span-4 rounded-2xl border-[3px] border-[#d97706] bg-[#fffbeb] p-3.5 shadow-inner space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-black uppercase tracking-wider text-[#78350f]">
                    🔤 Alphabet Filter Tiles
                  </span>
                  {letterFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setLetterFilter('ALL')}
                      className="text-[10px] font-black text-amber-700 underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Pastel Alphabet Tile Grid (A, B, C, D...) */}
                <div className="grid grid-cols-5 gap-2">
                  {LETTER_GROUPS.map((grp) => {
                    const isActive = letterFilter === grp.id;
                    return (
                      <button
                        key={grp.id}
                        type="button"
                        onClick={() => {
                          juice.click();
                          setLetterFilter(grp.id);
                        }}
                        className={`flex h-12 items-center justify-center rounded-2xl border-[3px] font-display text-sm font-black shadow-[0_3px_0_rgba(0,0,0,0.2)] transition cursor-pointer ${
                          grp.bg
                        } ${isActive ? 'ring-3 ring-[#1a162b] -translate-y-0.5 scale-105' : ' opacity-85 hover:opacity-100'}`}
                      >
                        {grp.label}
                      </button>
                    );
                  })}
                </div>

                {/* Elemental Tile Filter Grid (FIRE, WATER, GROW, SHINE, BOLT, ICE — Reference #2 Bottom-Left) */}
                <div>
                  <span className="font-display text-xs font-black uppercase tracking-wider text-[#78350f] block mb-2">
                    ✨ Elemental Word Tiles
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setWordElemFilter('all')}
                      className={`flex flex-col items-center justify-center rounded-2xl border-[3px] p-2 font-display text-[10px] font-black uppercase cursor-pointer ${
                        wordElemFilter === 'all'
                          ? 'border-[#1a162b] bg-[#fde047] text-[#1a162b]'
                          : 'border-[#d97706]/50 bg-white text-[#78350f]'
                      }`}
                    >
                      <span className="text-lg">🌈</span>
                      <span>ALL</span>
                    </button>
                    {(
                      [
                        { id: 'fire' as ElementType, label: 'FIRE', icon: '🔥', bg: 'bg-[#fed7aa] border-[#ea580c] text-[#7c2d12]' },
                        { id: 'water' as ElementType, label: 'WATER', icon: '💧', bg: 'bg-[#bae6fd] border-[#0284c7] text-[#0c4a6e]' },
                        { id: 'grass' as ElementType, label: 'GROW', icon: '🌱', bg: 'bg-[#bbf7d0] border-[#16a34a] text-[#14532d]' },
                        { id: 'light' as ElementType, label: 'SHINE', icon: '☀️', bg: 'bg-[#fef08a] border-[#ca8a04] text-[#713f12]' },
                        { id: 'electric' as ElementType, label: 'BOLT', icon: '⚡', bg: 'bg-[#fde68a] border-[#d97706] text-[#78350f]' },
                        { id: 'ice' as ElementType, label: 'ICE', icon: '❄️', bg: 'bg-[#cffafe] border-[#0891b2] text-[#164e63]' },
                        { id: 'shadow' as ElementType, label: 'SHADOW', icon: '🌑', bg: 'bg-[#e9d5ff] border-[#7e22ce] text-[#581c87]' },
                      ] as const
                    ).map((tile) => (
                      <button
                        key={tile.id}
                        type="button"
                        onClick={() =>
                          setWordElemFilter((prev) => (prev === tile.id ? 'all' : tile.id))
                        }
                        className={`flex flex-col items-center justify-center rounded-2xl border-[3px] p-2 font-display text-[10px] font-black uppercase transition cursor-pointer ${
                          tile.bg
                        } ${wordElemFilter === tile.id ? 'ring-3 ring-[#1a162b] scale-105' : 'opacity-85 hover:opacity-100'}`}
                      >
                        <span className="text-lg">{tile.icon}</span>
                        <span>{tile.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* K–8 Grade Tier Filter Pills */}
                <div>
                  <span className="font-display text-xs font-black uppercase tracking-wider text-[#78350f] block mb-1.5">
                    🎓 Grade Level Tier
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setGradeFilter('all')}
                      className={`rounded-xl border-2 px-2.5 py-1 text-[10px] font-black uppercase cursor-pointer ${
                        gradeFilter === 'all'
                          ? 'border-[#1a162b] bg-[#78350f] text-white'
                          : 'border-[#d97706] bg-white text-[#78350f]'
                      }`}
                    >
                      All K–8
                    </button>
                    {GRADE_TIERS.map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setGradeFilter(tier.id)}
                        className={`rounded-xl border-2 px-2 py-1 text-[10px] font-black uppercase cursor-pointer ${
                          gradeFilter === tier.id
                            ? 'border-[#1a162b] bg-[#78350f] text-white'
                            : `${tier.badgeBg} ${tier.badgeText} ${tier.badgeBorder}`
                        }`}
                      >
                        {tier.shortLabel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT 8 COLS: ACTIVE PET'S 4 EQUIPPED SLOTS + ROUNDED COLORFUL WORD CARDS (Reference #2 Right Panel) */}
              <div className="lg:col-span-8 flex flex-col justify-between rounded-2xl border-[3px] border-[#d97706] bg-[#fffbeb] p-3.5 shadow-inner space-y-3">
                {/* Active Companion's 4 Equipped Sentence Slots */}
                <div className="rounded-2xl border-2 border-[#f59e0b] bg-[#fef3c7] p-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <CreatureSprite
                        creatureId={selectedPet.forged?.sourceId || selectedPet.id}
                        stage={selectedPet.stage || 1}
                        element={selectedPet.element}
                        size="xs"
                      />
                      <span className="font-display text-xs sm:text-sm font-black text-[#451a03]">
                        {selectedPet.name}’s Equipped 4-Card Sentence Deck
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {(['all', 'adjective', 'noun', 'verb', 'adverb'] as const).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setActiveSlotFilter(pos)}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase cursor-pointer ${
                            activeSlotFilter === pos
                              ? 'bg-[#78350f] text-white'
                              : 'bg-white text-[#78350f] border border-[#d97706]'
                          }`}
                        >
                          {pos === 'all' ? 'All POS' : pos}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        { pos: 'adjective' as PartOfSpeech, label: '1. Adjective', bg: 'bg-[#fed7aa] border-[#ea580c]' },
                        { pos: 'noun' as PartOfSpeech, label: '2. Noun', bg: 'bg-[#bae6fd] border-[#0284c7]' },
                        { pos: 'verb' as PartOfSpeech, label: '3. Verb', bg: 'bg-[#fecdd3] border-[#e11d48]' },
                        { pos: 'adverb' as PartOfSpeech, label: '4. Adverb', bg: 'bg-[#e9d5ff] border-[#9333ea]' },
                      ] as const
                    ).map(({ pos, label, bg }) => {
                      const equipped = getWordById(petLoadout[pos]);
                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() =>
                            setActiveSlotFilter((prev) => (prev === pos ? 'all' : pos))
                          }
                          className={`rounded-xl border-2 p-2 text-left transition cursor-pointer ${bg} ${
                            activeSlotFilter === pos ? 'ring-2 ring-[#1a162b]' : ''
                          }`}
                        >
                          <div className="text-[9px] font-black uppercase text-[#451a03]/80">
                            {label}
                          </div>
                          <div className="font-display text-sm font-black text-[#1a162b] truncate">
                            {equipped ? equipped.word : 'Empty'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rounded Color-Coded Catalog Tiles Grid (Reference #2 Right Grid) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[410px] overflow-y-auto pr-1">
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
                            {word.partOfSpeech.slice(0, 4)}
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
                          <div className="text-2xl">{elInfo.icon}</div>
                          <div className="font-display text-sm font-black text-[#1a162b] truncate">
                            {word.word}
                          </div>
                          <div className="text-[10px] font-bold text-slate-700 line-clamp-2 leading-tight mt-0.5">
                            {word.definition}
                          </div>
                        </div>

                        {/* Rounded Bottom Nameplate Pill (Reference #2) */}
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
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 3: "CHARABOM BESTIARY & EVOLUTIONS"
            Combines:
            - GBA "★ Charabom Select ★" Inspector (Reference #4: IMG_4199_8dcb1870.PNG)
            - Mint-Green (#00e676) Portrait Matrix (Reference #1: IMG_4198_e61ea328.JPG)
            - Lavender 3-Stage Side-by-Side Evolution Sheet (Reference #3: IMG_4200_ace0f650.PNG)
           ==================================================================== */}
        {activeTab === 'charabom-bestiary' && (
          <div className="space-y-4">
            {/* 1. GBA "★ CHARABOM SELECT ★" INSPECTOR SCREEN (Reference #4) */}
            <div
              className="rounded-3xl border-[4px] border-[#1a162b] p-4 sm:p-5 shadow-[0_8px_0_#1a162b]"
              style={{
                backgroundImage:
                  'repeating-conic-gradient(#65d654 0% 25%, #84cc16 0% 50%)',
                backgroundSize: '64px 64px',
              }}
            >
              {/* Gold & Red Outlined "★ Companion Select ★" Title Banner */}
              <div className="mb-3 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-2xl border-[4px] border-[#991b1b] bg-gradient-to-b from-[#fef08a] via-[#facc15] to-[#eab308] px-6 py-1.5 shadow-[0_4px_0_#450a0a]">
                  <span className="text-lg">⭐</span>
                  <span className="font-display text-lg sm:text-2xl font-black tracking-wide text-[#991b1b] drop-shadow-[0_1.5px_0_#fff]">
                    Charabom Companion Select
                  </span>
                  <span className="text-lg">⭐</span>
                </div>
              </div>

              {/* 3-Column GBA Inspector Row: Left Numbered List | Center Sprite | Right Stat Box */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Left 4 Cols: Metallic Blue-Silver Numbered Scroll List (Reference #4 Left Box) */}
                <div className="md:col-span-4 rounded-2xl border-[4px] border-[#38bdf8] bg-gradient-to-b from-[#0f172a] via-[#1e3a8a] to-[#e2e8f0] p-2.5 shadow-[inset_0_0_0_2px_#1e293b]">
                  <div className="max-h-44 overflow-y-auto space-y-1 pr-1 font-mono text-xs sm:text-sm font-black">
                    {creatures.map((c, idx) => {
                      const isCurr = c.id === inspectedCreature.id;
                      const numStr = String(idx + 1).padStart(2, '0');
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            juice.click();
                            setBestiaryInspectId(c.id);
                            if (!c.id.startsWith('boss_')) {
                              setPlayerId(c.id);
                              restartBattle(c.id);
                            }
                          }}
                          className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition cursor-pointer ${
                            isCurr
                              ? 'bg-[#fef08a] text-[#1a162b] border-2 border-[#1a162b] shadow'
                              : 'bg-slate-900/75 text-white hover:bg-slate-800'
                          }`}
                        >
                          <span>
                            No.{numStr} {c.name}
                          </span>
                          <span className="text-xs">{ELEMENTS[c.element]?.icon}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Center 4 Cols: Large Center Creature Showcase */}
                <div className="md:col-span-4 flex flex-col items-center justify-center py-2">
                  <div className="relative rounded-full bg-white/30 p-3 backdrop-blur-xs border-2 border-white/50">
                    <CreatureSprite
                      creatureId={inspectedCreature.forged?.sourceId || inspectedCreature.id}
                      stage={inspectedCreature.stage || (inspectedCreature.id.startsWith('boss_') ? 3 : 1)}
                      element={inspectedCreature.element}
                      size="xl"
                    />
                  </div>
                  {!inspectedCreature.id.startsWith('boss_') && (
                    <button
                      type="button"
                      onClick={() => useCreatureInBattle(inspectedCreature.id)}
                      className="mt-2 rounded-xl border-[3px] border-[#1a162b] bg-[#fde047] hover:bg-[#facc15] px-4 py-1 font-display text-xs font-black uppercase text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
                    >
                      Deploy {inspectedCreature.name} →
                    </button>
                  )}
                </div>

                {/* Right 4 Cols: GBA Ice-Blue Stat Readout Box (Reference #4 Right Box) */}
                <div className="md:col-span-4 rounded-2xl border-[4px] border-[#0284c7] bg-[#e0f2fe] p-3 font-mono text-xs sm:text-sm font-black text-[#0f172a] shadow-[inset_0_0_0_2px_#fff]">
                  <div className="flex items-center justify-between border-b-2 border-[#0284c7] pb-1 mb-1.5">
                    <span className="text-base truncate">{inspectedCreature.name}</span>
                    <span className="text-xs">
                      🔥💧🪨🌿 {String((inspectedCreature.level || 10) * 5).padStart(3, '0')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span>⚔️ ATK</span>
                      <span>
                        {String(inspectedCreature.stats.attack * 10).padStart(3, '0')} / 380
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>🛡️ DEF</span>
                      <span>
                        {String(inspectedCreature.stats.defense * 10).padStart(3, '0')} / 290
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>⭐ HP</span>
                      <span>
                        {String(inspectedCreature.stats.hp * 3).padStart(3, '0')} / 360
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>🥾 SPD</span>
                      <span>
                        {String(inspectedCreature.stats.speed * 10).padStart(3, '0')} / 240
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom GBA Blue-Bordered Description & Special Ability Box (Reference #4 Bottom) */}
              <div className="mt-3 rounded-2xl border-[4px] border-[#3b82f6] bg-[#9be7ff]/35 backdrop-blur-xs p-3 font-mono text-xs sm:text-sm font-black text-[#0f172a] shadow-[inset_0_0_0_2px_#1d4ed8]">
                <p>{inspectedCreature.description}</p>
                <p className="mt-1 text-[#1e3a8a]">
                  Elemental Affinity: {ELEMENTS[inspectedCreature.element]?.icon}{' '}
                  {ELEMENTS[inspectedCreature.element]?.name.toUpperCase()} · Weave 4-card sentences in battle for 2.0x Syntax Surge!
                </p>
              </div>
            </div>

            {/* 2. BOTTOM SPLIT: MINT MUGSHOT MATRIX (Ref #1) + LAVENDER 3-STAGE EVOLUTION SHEET (Ref #3) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* LEFT 6 COLS: MINT-GREEN (#00e676) MUGSHOT PORTRAIT MATRIX (Reference #1) */}
              <div className="lg:col-span-6 rounded-3xl border-[4px] border-[#1a162b] bg-[#00e676] p-3.5 shadow-[0_6px_0_#1a162b]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-display text-sm font-black uppercase text-[#1a162b]">
                    🟩 Charabom Mugshot Matrix (All Forms &amp; Guardians)
                  </span>
                  <span className="rounded bg-[#1a162b] px-2 py-0.5 font-mono text-[10px] font-black text-[#00e676]">
                    Click Any Tile
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {creatures.map((c, idx) => {
                    const tileBgs = [
                      'bg-[#facc15]',
                      'bg-[#38bdf8]',
                      'bg-[#f472b6]',
                      'bg-[#a78bfa]',
                      'bg-[#fb923c]',
                    ];
                    const tileBg = tileBgs[idx % tileBgs.length];
                    const isSelected = c.id === inspectedCreature.id;

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          juice.click();
                          setBestiaryInspectId(c.id);
                          if (!c.id.startsWith('boss_')) {
                            setPlayerId(c.id);
                            restartBattle(c.id);
                          }
                        }}
                        title={c.name}
                        className={`group relative flex flex-col items-center justify-center aspect-square rounded-lg border-[3px] ${tileBg} p-1 transition cursor-pointer overflow-hidden ${
                          isSelected
                            ? 'border-white ring-3 ring-[#1a162b] scale-105'
                            : 'border-[#1a162b] hover:scale-105'
                        }`}
                      >
                        <CreatureSprite
                          creatureId={c.forged?.sourceId || c.id}
                          stage={c.stage || (c.id.startsWith('boss_') ? 3 : 1)}
                          element={c.element}
                          size="sm"
                          animated={false}
                        />
                        <span className="mt-0.5 w-full truncate bg-[#1a162b]/85 px-1 text-[8px] font-mono font-black text-white">
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT 6 COLS: LAVENDER-BLUE 3-STAGE EVOLUTION SHEET (Reference #3) */}
              <div className="lg:col-span-6 rounded-3xl border-[4px] border-[#1a162b] bg-[#7986cb] p-4 text-white shadow-[0_6px_0_#1a162b] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-display text-base font-black text-[#fef08a] drop-shadow-[0_1.5px_0_#1a162b]">
                        🧬 {inspectedCreature.name} Evolution Lineup
                      </h4>
                      <p className="text-xs font-bold text-indigo-100">
                        Side-by-side morphological growth from Hatchling (Stg 1) to Sovereign (Stg 3)
                      </p>
                    </div>
                    <span className="rounded-xl border-2 border-[#1a162b] bg-[#1a162b] px-2.5 py-1 font-mono text-xs font-black text-[#fde047]">
                      Lv.{inspectedCreature.level || 8}
                    </span>
                  </div>

                  {/* Horizontal 3-Stage Evolution Comparison Row (Reference #3) */}
                  <div className="grid grid-cols-3 gap-2.5 rounded-2xl border-[3px] border-[#1a162b] bg-[#5c6bc0] p-3">
                    {evoBranch.map((stg) => {
                      const currentStg = inspectedCreature.stage || 1;
                      const isCurrent = currentStg === stg.stage;
                      const isUnlocked = currentStg >= stg.stage;

                      return (
                        <div
                          key={stg.stage}
                          className={`flex flex-col items-center justify-between rounded-xl border-2 p-2.5 text-center transition ${
                            isCurrent
                              ? 'border-[#fde047] bg-[#3949ab] shadow-[0_4px_0_#1a162b]'
                              : isUnlocked
                              ? 'border-white/40 bg-[#303f9f]/70'
                              : 'border-black/30 bg-black/20 opacity-75'
                          }`}
                        >
                          <span className="rounded-full bg-[#1a162b] px-2 py-0.5 font-mono text-[9px] font-black text-[#fde047]">
                            STAGE {stg.stage} (Lv.{stg.minLevel})
                          </span>
                          <div className="my-2">
                            <CreatureSprite
                              creatureId={inspectedCreature.forged?.sourceId || inspectedCreature.id}
                              stage={stg.stage}
                              element={inspectedCreature.element}
                              size="md"
                            />
                          </div>
                          <div>
                            <div className="font-display text-xs font-black text-white">
                              {stg.name}
                            </div>
                            <div className="text-[9px] font-bold text-indigo-200">
                              {stg.title}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Train & Evolve Controls */}
                {!inspectedCreature.id.startsWith('boss_') && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/20">
                    <button
                      type="button"
                      onClick={() => handleTrainPet(inspectedCreature)}
                      className="flex items-center gap-1.5 rounded-xl border-[3px] border-[#1a162b] bg-[#fde047] hover:bg-[#facc15] px-4 py-2 font-display text-xs font-black text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
                    >
                      <Coins className="h-4 w-4" />
                      <span>Train +1 Level (50 Coins)</span>
                    </button>

                    {canPetEvolve(inspectedCreature) && (
                      <button
                        type="button"
                        onClick={() => setEvolvingPetId(inspectedCreature.id)}
                        className="flex items-center gap-1.5 rounded-xl border-[3px] border-[#1a162b] bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400 px-4 py-2 font-display text-xs font-black uppercase text-[#1a162b] shadow-[0_3px_0_#1a162b] animate-pulse cursor-pointer"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Trigger Evolution!</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
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
