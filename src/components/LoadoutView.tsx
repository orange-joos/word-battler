import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  Check,
  Wand2,
  Star,
  Search,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { ELEMENTS } from '../data/elements';
import { getAllWordsList } from '../engine/forge';
import { PartOfSpeech, Word } from '../types';
import { juice } from '../engine/juice';
import {
  canPetEvolve,
  getEvolutionBranch,
} from '../data/evolutionData';
import { EvolutionSequenceModal } from './EvolutionSequenceModal';
import { CreatureSprite } from './CreatureSprite';
import { getPartOfSpeechMeta } from '../data/vocabDatabase';
import { PET_ACCESSORIES_CATALOG } from '../engine/progression';

type ArsenalTab = 'companion-roster' | 'word-catalog';
type RoleTab = 'all' | 'adjective' | 'noun' | 'verb' | 'adverb';

const CARD_THEMES: Record<
  string,
  { cardBg: string; headerBg: string; pedestalTop: string; pedestalSide: string }
> = {
  fire: {
    cardBg: 'from-[#f97316] to-[#c2410c]',
    headerBg: 'bg-[#7c2d12]/60',
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
    petAccessories,
    equipPetAccessory,
    petBonds,
    increasePetBond,
    feedPetStatTreat,
  } = useGame();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<ArsenalTab>('companion-roster');
  const [roleTab, setRoleTab] = useState<RoleTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [evolvingPetId, setEvolvingPetId] = useState<string | null>(null);
  const [trainFeedback, setTrainFeedback] = useState<string | null>(null);
  const [petMood, setPetMood] = useState<'idle' | 'happy'>('idle');
  const [petSpeechBubble, setPetSpeechBubble] = useState<string | null>(null);

  const ownedPets = creatures.filter((c) => !c.id.startsWith('boss_'));
  const selectedPet =
    ownedPets.find((c) => c.id === playerId) || ownedPets[0];

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

  const filteredWords = allWords.filter((w) => {
    if (roleTab !== 'all' && w.partOfSpeech !== roleTab) return false;
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
    return a.word.localeCompare(b.word);
  });

  const handleChooseBuddy = (id: string, name: string) => {
    juice.ding(740, 110);
    setPlayerId(id);
    restartBattle(id);
    setTrainFeedback(`🐾 ${name} is now your active buddy!`);
    setTimeout(() => setTrainFeedback(null), 2000);
  };

  const handleEquipWord = (word: Word) => {
    updatePetLoadout(selectedPet.id, word.partOfSpeech, word.id);
    juice.ding(740, 90);
    juice.speakWord(word.word);
  };

  const handleTrainPet = (targetPet = selectedPet) => {
    const res = trainPetWithCoins(targetPet.id, 50);
    if (!res.success) {
      setTrainFeedback(res.error || 'Need 50 Coins! Win battles to earn more.');
      setTimeout(() => setTrainFeedback(null), 2500);
      return;
    }
    setTrainFeedback(`⭐ ${targetPet.name} leveled up to Lv.${(targetPet.level || 8) + 1}!`);
    setTimeout(() => setTrainFeedback(null), 2500);
  };

  const isReadyToEvolve = canPetEvolve(selectedPet);
  const evoBranch = getEvolutionBranch(selectedPet);
  const activeTheme = CARD_THEMES[selectedPet.element] || CARD_THEMES.fire;
  const activeElemInfo = ELEMENTS[selectedPet.element] || ELEMENTS.fire;

  return (
    <div className="h-full w-full overflow-y-auto bg-gradient-to-b from-[#fed7aa] via-[#fef3c7] to-[#bae6fd] p-2 sm:p-4 select-none">
      <div className="mx-auto max-w-[1260px] space-y-3 pb-8">
        {/* TOP HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setTab('hub')}
              className="flex items-center gap-1.5 rounded-full border-[3px] border-[#7c2d12] bg-gradient-to-b from-[#fdba74] to-[#f97316] px-4 py-1.5 font-display text-xs sm:text-sm font-black uppercase text-white shadow-[0_4px_0_#7c2d12] hover:brightness-105 cursor-pointer"
            >
              <span>◀ Back to Map</span>
            </button>

            <div className="flex items-center gap-1.5 rounded-full border-[3px] border-[#78350f] bg-[#fef3c7] px-3.5 py-1 shadow-[0_3px_0_#78350f]">
              <span className="text-sm">🪙</span>
              <span className="font-mono text-xs sm:text-sm font-black text-[#451a03]">
                {(currentUser?.lexiCoins ?? 450).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                autoEquipBestLoadout(selectedPet.id, 'all');
                juice.fanfare();
                setTrainFeedback(`🪄 Picked great words for ${selectedPet.name}!`);
                setTimeout(() => setTrainFeedback(null), 2000);
              }}
              className="flex items-center gap-1.5 rounded-2xl border-[3px] border-[#14532d] bg-gradient-to-b from-[#86efac] to-[#22c55e] px-3.5 py-1.5 font-display text-xs font-black uppercase text-[#14532d] shadow-[0_4px_0_#14532d] hover:brightness-105 cursor-pointer"
            >
              <Wand2 className="h-4 w-4" />
              <span>Auto-Pick Words</span>
            </button>

            <button
              type="button"
              onClick={() => useCreatureInBattle(selectedPet.id)}
              className="flex items-center gap-1.5 rounded-2xl border-[3px] border-[#7f1d1d] bg-gradient-to-b from-[#fda4af] to-[#f43f5e] px-4 py-1.5 font-display text-xs font-black uppercase text-white shadow-[0_4px_0_#7f1d1d] hover:brightness-105 cursor-pointer"
            >
              <span>⚔️ Battle ({selectedPet.name})</span>
            </button>
          </div>
        </div>

        {trainFeedback && (
          <div className="rounded-2xl border-[3px] border-[#14532d] bg-[#bbf7d0] px-4 py-2 text-center font-display text-xs sm:text-sm font-black text-[#14532d] shadow">
            {trainFeedback}
          </div>
        )}

        {/* 2 BIG FRIENDLY FOLDER TABS */}
        <div className="flex flex-wrap items-end gap-2 pl-4 -mb-3 relative z-10">
          <button
            type="button"
            onClick={() => {
              juice.click();
              setActiveTab('companion-roster');
            }}
            className={`rounded-t-3xl border-[4px] border-b-0 border-[#451a03] px-6 py-2.5 font-display text-sm sm:text-base font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'companion-roster'
                ? 'bg-[#fde68a] text-[#451a03] -translate-y-1'
                : 'bg-[#fed7aa]/80 text-[#78350f] hover:bg-[#fde68a]/70'
            }`}
          >
            🐾 Choose Buddy ({ownedPets.length})
          </button>

          <button
            type="button"
            onClick={() => {
              juice.click();
              setActiveTab('word-catalog');
            }}
            className={`rounded-t-3xl border-[4px] border-b-0 border-[#14532d] px-6 py-2.5 font-display text-sm sm:text-base font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'word-catalog'
                ? 'bg-[#86efac] text-[#14532d] -translate-y-1'
                : 'bg-[#bbf7d0]/80 text-[#166534] hover:bg-[#86efac]/70'
            }`}
          >
            🔤 My Word Cards ({allWords.length})
          </button>
        </div>

        {/* ====================================================================
            TAB 1: CHOOSE BUDDY — Big, Friendly Visual Cards
           ==================================================================== */}
        {activeTab === 'companion-roster' && (
          <div className="overflow-hidden rounded-3xl border-[4px] border-[#1e3a8a] bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#1d4ed8] shadow-[0_8px_0_#172554]">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
              {/* LEFT 4 COLS: MY ACTIVE BUDDY STAGE */}
              <div className="lg:col-span-4 relative flex flex-col justify-between p-5 bg-gradient-to-b from-[#0369a1]/60 via-[#0284c7]/40 to-[#1e3a8a]/80 border-b-4 lg:border-b-0 lg:border-r-4 border-[#1e3a8a]">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border-2 border-[#1a162b] bg-[#fde047] px-3 py-1 font-display text-xs font-black uppercase text-[#1a162b] shadow">
                    ★ My Active Buddy
                  </span>
                  <span className="rounded-full border-2 border-[#1a162b] bg-white px-3 py-1 font-display text-xs font-black text-[#1a162b]">
                    {activeElemInfo.icon} {activeElemInfo.name} · Lv.{selectedPet.level || 8}
                  </span>
                </div>

                {petSpeechBubble && (
                  <div className="my-2 rounded-2xl border-2 border-[#1a162b] bg-[#fff8e7] px-3.5 py-2 text-center text-xs font-black text-[#1a162b] shadow-[0_3px_0_#1a162b] animate-bounce">
                    💬 <strong>{selectedPet.name}:</strong> “{petSpeechBubble}”
                  </div>
                )}

                {/* Big Active Buddy Pedestal */}
                <div className="my-4 flex flex-col items-center">
                  <div className="relative z-10 -mb-5">
                    <CreatureSprite
                      creatureId={selectedPet.forged?.sourceId || selectedPet.id}
                      stage={selectedPet.stage || 1}
                      element={selectedPet.element}
                      secondaryElement={selectedPet.infusionElement}
                      accessoryId={petAccessories[selectedPet.id]}
                      isPrismatic={(petBonds[selectedPet.id] || 1) >= 5}
                      mood={petMood}
                      size="xl"
                    />
                  </div>
                  <div className="w-44 flex flex-col items-center">
                    <svg viewBox="0 0 160 66" className="w-full h-auto overflow-visible">
                      <ellipse cx="80" cy="56" rx="68" ry="12" fill="rgba(15, 23, 42, 0.45)" />
                      <path
                        d="M16,22 L16,44 A64,16 0 0,0 144,44 L144,22 Z"
                        fill={activeTheme.pedestalSide}
                        stroke="#1a162b"
                        strokeWidth="3.5"
                      />
                      <ellipse
                        cx="80"
                        cy="22"
                        rx="64"
                        ry="16"
                        fill={activeTheme.pedestalTop}
                        stroke="#1a162b"
                        strokeWidth="3.5"
                      />
                    </svg>
                  </div>
                  <h2 className="font-display text-2xl font-black text-white drop-shadow-[0_2px_0_#1a162b] mt-1">
                    {selectedPet.name}
                  </h2>
                </div>

                {/* Simple Care, Dress-Up & Evolution Box */}
                <div className="space-y-2.5 rounded-2xl border-[3px] border-[#1a162b] bg-[#0f172a]/90 p-3.5 text-white shadow-[0_4px_0_#090714]">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        juice.ding(880, 140);
                        increasePetBond(selectedPet.id, 1);
                        setPetMood('happy');
                        setPetSpeechBubble('Yay! That tickles! ❤️');
                        setTimeout(() => setPetMood('idle'), 2200);
                      }}
                      className="rounded-xl border-2 border-[#1a162b] bg-pink-300 hover:bg-pink-200 py-2 font-display text-xs font-black text-[#1a162b] shadow-[0_2px_0_#1a162b] cursor-pointer"
                    >
                      ✋ Pet Buddy
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        juice.fanfare();
                        feedPetStatTreat(selectedPet.id, 'attack');
                        increasePetBond(selectedPet.id, 1);
                        setPetMood('happy');
                        setPetSpeechBubble('Yum! Thank you for the treat! 🍎');
                        setTimeout(() => setPetMood('idle'), 2200);
                      }}
                      className="rounded-xl border-2 border-[#1a162b] bg-emerald-300 hover:bg-emerald-200 py-2 font-display text-xs font-black text-[#1a162b] shadow-[0_2px_0_#1a162b] cursor-pointer"
                    >
                      🍎 Give Treat
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTrainPet(selectedPet)}
                      className="flex-1 rounded-xl border-2 border-[#1a162b] bg-[#fde047] hover:bg-[#facc15] py-2 font-display text-xs font-black uppercase text-[#1a162b] shadow-[0_2px_0_#1a162b] cursor-pointer"
                    >
                      ⭐ Level Up (50 🪙)
                    </button>

                    {isReadyToEvolve && (
                      <button
                        type="button"
                        onClick={() => setEvolvingPetId(selectedPet.id)}
                        className="flex items-center gap-1 rounded-xl border-2 border-[#1a162b] bg-gradient-to-r from-amber-400 to-orange-500 px-3.5 py-2 font-display text-xs font-black uppercase text-white shadow-[0_2px_0_#1a162b] animate-pulse cursor-pointer"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Evolve!</span>
                      </button>
                    )}
                  </div>

                  {/* Fun Hat / Gear Strip */}
                  <div className="pt-2 border-t border-white/15">
                    <div className="text-[10px] font-black uppercase text-sky-200 mb-1">
                      🎩 Dress Up Your Buddy:
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {PET_ACCESSORIES_CATALOG.map((acc) => {
                        const isEquipped = petAccessories[selectedPet.id] === acc.id;
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => equipPetAccessory(selectedPet.id, isEquipped ? '' : acc.id)}
                            title={acc.name}
                            className={`flex flex-col items-center rounded-lg border p-1 text-xs font-black transition cursor-pointer ${
                              isEquipped
                                ? 'border-[#fde047] bg-[#fde047] text-[#1a162b]'
                                : 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
                            }`}
                          >
                            <span>{acc.icon}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Simple 3-Stage Evolution Preview */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/15">
                    {evoBranch.map((stg) => {
                      const unlocked = (selectedPet.stage || 1) >= stg.stage;
                      return (
                        <div
                          key={stg.stage}
                          className={`rounded-xl border px-2 py-1 text-center text-[10px] font-black ${
                            unlocked
                              ? 'border-[#fde047]/60 bg-white/10 text-[#fde047]'
                              : 'border-white/10 bg-black/30 text-slate-400'
                          }`}
                        >
                          <div className="truncate">{stg.name}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT 8 COLS: BIG FRIENDLY "CHOOSE BUDDY" VISUAL CARDS */}
              <div className="lg:col-span-8 p-4 sm:p-5 bg-[#0284c7]/25 overflow-y-auto max-h-[560px]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-base sm:text-lg font-black uppercase tracking-wide text-[#fde047] drop-shadow-[0_2px_0_#1a162b]">
                    🐾 Tap Any Card to Choose Your Buddy!
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {ownedPets.map((pet) => {
                    const isLead = pet.id === selectedPet.id;
                    const theme = CARD_THEMES[pet.element] || CARD_THEMES.fire;
                    const elInfo = ELEMENTS[pet.element] || ELEMENTS.fire;
                    const starCount = Math.min(5, Math.max(3, (pet.stage || 1) + 2));

                    return (
                      <div
                        key={pet.id}
                        onClick={() => handleChooseBuddy(pet.id, pet.name)}
                        className={`group relative flex flex-col justify-between rounded-3xl border-[3px] bg-gradient-to-b ${theme.cardBg} p-4 text-white transition-all cursor-pointer ${
                          isLead
                            ? 'border-[#fde047] ring-4 ring-[#fde047]/70 shadow-[0_7px_0_#0f172a] -translate-y-1'
                            : 'border-[#0f172a] hover:-translate-y-1 shadow-[0_5px_0_#0f172a]'
                        }`}
                      >
                        {isLead && (
                          <div
                            className="absolute -top-2.5 -right-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-[#22c55e] shadow-md"
                            title="Active Buddy"
                          >
                            <Check className="h-4 w-4 stroke-[3.5] text-white" />
                          </div>
                        )}

                        {/* Card Top Pill */}
                        <div className={`flex items-center justify-between gap-2 rounded-2xl ${theme.headerBg} px-3 py-1.5 border border-white/20`}>
                          <span className="flex items-center gap-1.5 font-display text-xs font-black text-white">
                            <span>{elInfo.icon}</span>
                            <span>{elInfo.name}</span>
                          </span>
                          <span className="rounded-lg bg-black/40 px-2 py-0.5 font-mono text-xs font-black text-[#fde047]">
                            Lv.{pet.level || 8}
                          </span>
                        </div>

                        {/* Big Pet Sprite */}
                        <div className="my-3 flex items-center justify-center py-1">
                          <CreatureSprite
                            creatureId={pet.forged?.sourceId || pet.id}
                            stage={pet.stage || 1}
                            element={pet.element}
                            secondaryElement={pet.infusionElement}
                            accessoryId={petAccessories[pet.id]}
                            isPrismatic={(petBonds[pet.id] || 1) >= 5}
                            size="lg"
                          />
                        </div>

                        {/* Pet Name, Stars & Big Choose Buddy Button */}
                        <div className="space-y-2.5 text-center">
                          <div className="font-display text-lg font-black text-white truncate drop-shadow-[0_1.5px_0_#000]">
                            {pet.name}
                          </div>

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

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChooseBuddy(pet.id, pet.name);
                            }}
                            className={`w-full rounded-2xl border-2 border-[#1a162b] py-2 font-display text-xs sm:text-sm font-black uppercase tracking-wide shadow-[0_3px_0_#1a162b] transition cursor-pointer ${
                              isLead
                                ? 'bg-[#4ade80] text-[#1a162b]'
                                : 'bg-[#fde047] hover:bg-white text-[#1a162b]'
                            }`}
                          >
                            {isLead ? '✓ Active Buddy!' : '🐾 Choose Buddy'}
                          </button>
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
            TAB 2: MY WORD CARDS — Big, Friendly Visual Cards
           ==================================================================== */}
        {activeTab === 'word-catalog' && (
          <div className="rounded-3xl border-[4px] border-[#b45309] bg-[#fef3c7] p-4 sm:p-5 shadow-[0_8px_0_#78350f] space-y-4">
            {/* Active Buddy's 4 Colored Sentence Slots */}
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
                    {selectedPet.name}’s 4 Battle Word Cards
                  </span>
                </div>
                <span className="text-xs font-bold text-[#78350f]">
                  Tap any word card below to put it in {selectedPet.name}’s deck!
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(
                  [
                    { pos: 'adjective' as PartOfSpeech, label: '1. Adjective', bg: 'bg-amber-100 border-amber-500' },
                    { pos: 'noun' as PartOfSpeech, label: '2. Noun', bg: 'bg-sky-100 border-sky-500' },
                    { pos: 'verb' as PartOfSpeech, label: '3. Verb', bg: 'bg-rose-100 border-rose-500' },
                    { pos: 'adverb' as PartOfSpeech, label: '4. Adverb', bg: 'bg-purple-100 border-purple-500' },
                  ] as const
                ).map(({ pos, label, bg }) => {
                  const equipped = getWordById(petLoadout[pos]);
                  return (
                    <div
                      key={pos}
                      className={`rounded-2xl border-[3px] p-3 text-left ${bg}`}
                    >
                      <div className="text-xs font-black uppercase text-[#451a03]/80">
                        {label}
                      </div>
                      <div className="font-display text-base sm:text-lg font-black text-[#1a162b] truncate mt-0.5">
                        {equipped ? equipped.word : 'Empty'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Role Filter Pills + Search Box */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-[3px] border-[#d97706] bg-[#fffbeb] p-3">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'all', label: '📚 All Words' },
                    { id: 'adjective', label: '🎨 Adjectives' },
                    { id: 'noun', label: '🛡️ Nouns' },
                    { id: 'verb', label: '⚡ Verbs' },
                    { id: 'adverb', label: '✨ Adverbs' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      juice.click();
                      setRoleTab(tab.id);
                    }}
                    className={`rounded-xl border-2 px-3.5 py-2 font-display text-xs sm:text-sm font-black uppercase transition cursor-pointer ${
                      roleTab === tab.id
                        ? 'border-[#1a162b] bg-[#fde047] text-[#1a162b] shadow-[0_3px_0_#1a162b]'
                        : 'border-[#d97706]/50 bg-white text-[#78350f] hover:bg-amber-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#78350f]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find a word..."
                  className="w-full rounded-xl border-2 border-[#78350f] bg-white pl-9 pr-3 py-2 font-display text-xs sm:text-sm font-bold text-[#1a162b] placeholder:text-[#78350f]/60 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                />
              </div>
            </div>

            {/* Big Friendly Word Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[440px] overflow-y-auto pr-1">
              {sortedWords.map((word) => {
                const isEquipped = petLoadout[word.partOfSpeech] === word.id;
                const elInfo = ELEMENTS[word.element] || ELEMENTS.fire;
                const posMeta = getPartOfSpeechMeta(word.partOfSpeech);

                return (
                  <div
                    key={word.id}
                    onClick={() => handleEquipWord(word)}
                    className={`group relative flex flex-col justify-between rounded-2xl border-[3px] border-[#1a162b] bg-white p-3 text-center transition cursor-pointer shadow-[0_4px_0_#1a162b] ${
                      isEquipped ? 'ring-4 ring-[#16a34a] bg-emerald-50 -translate-y-1' : 'hover:-translate-y-0.5 hover:bg-amber-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`rounded-lg border px-2 py-0.5 font-display text-[10px] font-black uppercase ${posMeta.pillBg} ${posMeta.pillText} ${posMeta.cardBorder}`}
                      >
                        {posMeta.icon} {posMeta.label}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          juice.speakWord(`${word.word}. ${word.definition}`);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#1a162b] bg-amber-100 hover:bg-[#fde047] cursor-pointer"
                        title="Hear Word"
                      >
                        <Volume2 className="h-3.5 w-3.5 text-[#1a162b]" />
                      </button>
                    </div>

                    <div className="my-2 py-2 px-1">
                      <div className="font-display text-lg font-black text-[#1a162b] truncate">
                        {elInfo.icon} {word.word}
                      </div>
                      <div className="text-xs font-bold text-slate-600 line-clamp-2 leading-snug mt-1">
                        {word.definition}
                      </div>
                    </div>

                    <div
                      className={`rounded-xl border-2 border-[#1a162b] py-1 text-xs font-display font-black uppercase ${
                        isEquipped
                          ? 'bg-[#4ade80] text-[#1a162b]'
                          : 'bg-[#fde047] text-[#1a162b]'
                      }`}
                    >
                      {isEquipped ? '✓ Equipped!' : 'Tap to Use'}
                    </div>
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
