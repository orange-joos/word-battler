import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Word, PartOfSpeech, ElementType, Creature } from '../types';
import { getAllWordsList } from '../engine/forge';
import { INITIAL_WORDS } from '../data/initialData';
import { juice } from '../engine/juice';
import {
  Swords,
  Shield,
  Zap,
  Sparkles,
  Flame,
  Snowflake,
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  BookOpen,
} from 'lucide-react';

interface SlotConfig {
  pos: PartOfSpeech;
  label: string;
  role: string;
  icon: React.ReactNode;
  bgGradient: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
}

const SLOT_CONFIGS: SlotConfig[] = [
  {
    pos: 'verb',
    label: 'Verb Slot',
    role: 'Action & Direct Strike',
    icon: <Swords className="h-4 w-4" />,
    bgGradient: 'from-emerald-950/60 to-slate-900/80',
    borderColor: 'border-emerald-500/50',
    badgeBg: 'bg-emerald-900/80 text-emerald-300 border border-emerald-700',
    badgeText: 'VERB',
  },
  {
    pos: 'noun',
    label: 'Noun Slot',
    role: 'Substance & Fortification',
    icon: <Shield className="h-4 w-4" />,
    bgGradient: 'from-sky-950/60 to-slate-900/80',
    borderColor: 'border-sky-500/50',
    badgeBg: 'bg-sky-900/80 text-sky-300 border border-sky-700',
    badgeText: 'NOUN',
  },
  {
    pos: 'adjective',
    label: 'Adjective Slot',
    role: 'Quality & Attribute Surge',
    icon: <Sparkles className="h-4 w-4" />,
    bgGradient: 'from-amber-950/60 to-slate-900/80',
    borderColor: 'border-amber-500/50',
    badgeBg: 'bg-amber-900/80 text-amber-300 border border-amber-700',
    badgeText: 'ADJECTIVE',
  },
  {
    pos: 'adverb',
    label: 'Adverb Slot',
    role: 'Momentum & Evasion Stance',
    icon: <Zap className="h-4 w-4" />,
    bgGradient: 'from-purple-950/60 to-slate-900/80',
    borderColor: 'border-purple-500/50',
    badgeBg: 'bg-purple-900/80 text-purple-300 border border-purple-700',
    badgeText: 'ADVERB',
  },
];

export const LoadoutView: React.FC = () => {
  const {
    creatures,
    words,
    playerId,
    setPlayerId,
    updatePetLoadout,
    autoEquipBestLoadout,
    goToBattle,
  } = useGame();

  const [selectedPetId, setSelectedPetId] = useState<string>(playerId);
  const [posFilter, setPosFilter] = useState<PartOfSpeech | 'all'>('all');
  const [elementFilter, setElementFilter] = useState<ElementType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCard, setHoveredCard] = useState<Word | null>(null);

  // Active pet being configured
  const activePet = useMemo(() => {
    return creatures.find((c) => c.id === selectedPetId) || creatures[0];
  }, [creatures, selectedPetId]);

  // Guaranteed words catalog list
  const allWords = useMemo(() => {
    return getAllWordsList({
      verbs: words.verbs?.length ? words.verbs : INITIAL_WORDS.verbs,
      nouns: words.nouns?.length ? words.nouns : INITIAL_WORDS.nouns,
      adjectives: words.adjectives?.length ? words.adjectives : INITIAL_WORDS.adjectives,
      adverbs: words.adverbs?.length ? words.adverbs : INITIAL_WORDS.adverbs,
    });
  }, [words]);

  const petAffinity = activePet.elementAffinity || activePet.element;

  // Resolve equipped word objects for active pet
  const equippedWords = useMemo(() => {
    const loadout = activePet.loadout || { verb: null, noun: null, adjective: null, adverb: null };
    return {
      verb: allWords.find((w) => w.id === loadout.verb) || null,
      noun: allWords.find((w) => w.id === loadout.noun) || null,
      adjective: allWords.find((w) => w.id === loadout.adjective) || null,
      adverb: allWords.find((w) => w.id === loadout.adverb) || null,
    };
  }, [activePet, allWords]);

  const equippedCount = Object.values(equippedWords).filter(Boolean).length;

  // Filtered inventory list
  const filteredWords = useMemo(() => {
    return allWords.filter((w) => {
      if (posFilter !== 'all' && w.partOfSpeech !== posFilter) return false;
      if (elementFilter !== 'all' && w.element !== elementFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesWord = w.word.toLowerCase().includes(query);
        const matchesDef = w.definition.toLowerCase().includes(query);
        if (!matchesWord && !matchesDef) return false;
      }
      return true;
    });
  }, [allWords, posFilter, elementFilter, searchQuery]);

  // Handle slot equip / unequip
  const handleEquip = (word: Word) => {
    const slot = word.partOfSpeech;
    updatePetLoadout(activePet.id, slot, word.id);
    juice.ding(word.element === 'fire' ? 700 : 840, 90);
    juice.speak(word.word);
  };

  const handleUnequip = (slot: PartOfSpeech) => {
    updatePetLoadout(activePet.id, slot, null);
    juice.ding(400, 60);
  };

  const handleEnterBattle = () => {
    setPlayerId(activePet.id);
    juice.ding(900, 120);
    goToBattle();
  };

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[#100c18] px-4 py-6 sm:px-6 sm:py-8 text-slate-100 font-sans">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Top Header & Pet Selector */}
        <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-violet-900/80 bg-gradient-to-r from-violet-950/80 via-[#191129] to-violet-950/80 p-5 shadow-lg shadow-violet-950/40">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 shadow-lg ${
              petAffinity === 'fire'
                ? 'border-orange-500 bg-gradient-to-br from-amber-600 to-red-700 shadow-orange-950/60'
                : 'border-cyan-400 bg-gradient-to-br from-cyan-600 to-blue-800 shadow-cyan-950/60'
            }`}>
              {petAffinity === 'fire' ? (
                <Flame className="h-8 w-8 text-amber-200 animate-pulse" />
              ) : (
                <Snowflake className="h-8 w-8 text-cyan-200 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-orange-50">
                  {activePet.name}
                </h2>
                {activePet.forged && (
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/50 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    ✦ HYBRID PET
                  </span>
                )}
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                  petAffinity === 'fire'
                    ? 'bg-orange-950/80 border border-orange-600/70 text-orange-300'
                    : 'bg-cyan-950/80 border border-cyan-600/70 text-cyan-300'
                }`}>
                  {petAffinity === 'fire' ? <Flame className="h-3 w-3" /> : <Snowflake className="h-3 w-3" />}
                  {petAffinity} Affinity
                </span>
              </div>
              <p className="text-xs text-violet-300 mt-1 max-w-xl">
                {activePet.description}
              </p>
            </div>
          </div>

          {/* Pet Switcher & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2">
              <label htmlFor="loadout-pet-select" className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
                Select Pet:
              </label>
              <select
                id="loadout-pet-select"
                value={selectedPetId}
                onChange={(e) => {
                  setSelectedPetId(e.target.value);
                  juice.ding(600, 80);
                }}
                className="rounded-xl border border-violet-700 bg-violet-900/90 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
              >
                {creatures.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.element.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => autoEquipBestLoadout(activePet.id)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/60 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/60 hover:text-amber-100 transition shadow-sm"
              title="Auto-fill empty slots with your best matching words"
            >
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Auto-Equip</span>
            </button>
          </div>
        </section>

        {/* 4 Dedicated Pet Battle Slots (The 4-Card Arsenal) */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif text-lg font-bold tracking-wide text-orange-100 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-400" />
                <span>Battle Word Arsenal (4 Dedicated Slots)</span>
              </h3>
              <p className="text-xs text-violet-300">
                Equip 1 card of each part of speech. Matching {petAffinity} affinity grants <strong className="text-amber-300">+4 Elemental Synergy</strong> in combat!
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-violet-400">Loadout Status:</span>
                <span className={`font-bold flex items-center gap-1 ${
                  equippedCount === 4 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {equippedCount === 4 ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {equippedCount} / 4 Slots Filled
                </span>
              </div>

              <button
                type="button"
                onClick={handleEnterBattle}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-orange-950/60 hover:from-orange-500 hover:to-amber-500 transition active:scale-95"
              >
                <span>Enter Battle ⚔️</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* The 4 Slot Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {SLOT_CONFIGS.map((slot) => {
              const equippedWord = equippedWords[slot.pos];
              const isAffinityMatch = equippedWord && equippedWord.element === petAffinity;
              const powerBonus = equippedWord ? (equippedWord.powerBonus ?? (equippedWord.forge?.powerBonus || 0)) : 0;
              const depth = equippedWord ? (equippedWord.fusionDepth ?? (equippedWord.forge?.depth || 0)) : 0;

              return (
                <div
                  key={slot.pos}
                  className={`relative flex flex-col justify-between rounded-2xl border-2 p-4 transition-all ${
                    equippedWord
                      ? `${slot.borderColor} bg-gradient-to-b ${slot.bgGradient} shadow-md`
                      : 'border-dashed border-violet-800/60 bg-violet-950/20 hover:border-violet-700'
                  }`}
                >
                  {/* Slot Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-lg bg-violet-900/60 text-slate-200">
                        {slot.icon}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        {slot.label}
                      </span>
                    </div>

                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${slot.badgeBg}`}>
                      {slot.badgeText}
                    </span>
                  </div>

                  {/* Slot Body */}
                  {equippedWord ? (
                    <div className="space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-baseline justify-between gap-1">
                          <h4 className="font-serif text-lg font-bold text-slate-100 tracking-wide">
                            {equippedWord.word}
                          </h4>
                          <button
                            type="button"
                            onClick={() => juice.speak(equippedWord.word)}
                            className="p-1 text-violet-400 hover:text-slate-200 transition"
                            title="Hear pronunciation"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            equippedWord.element === 'fire'
                              ? 'bg-orange-950/80 border border-orange-700 text-orange-300'
                              : 'bg-cyan-950/80 border border-cyan-700 text-cyan-300'
                          }`}>
                            {equippedWord.element === 'fire' ? '🔥' : '❄️'} {equippedWord.element}
                          </span>

                          {powerBonus > 0 && (
                            <span className="rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                              +{powerBonus} PWR
                            </span>
                          )}

                          {depth > 0 && (
                            <span className="rounded bg-violet-800/50 border border-violet-600/40 px-1.5 py-0.5 text-[10px] font-bold text-violet-200">
                              ★ D{depth}
                            </span>
                          )}
                        </div>

                        {/* Affinity Synergy Bonus indicator */}
                        {isAffinityMatch && (
                          <div className="mt-2 rounded-lg bg-orange-500/10 border border-orange-500/30 px-2 py-1 text-[11px] text-amber-300 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
                            <span><strong>Affinity Match:</strong> +4 Synergy</span>
                          </div>
                        )}

                        <p className="text-[11px] text-slate-300/90 italic mt-2 line-clamp-2">
                          "{equippedWord.definition}"
                        </p>
                      </div>

                      {/* Unequip action */}
                      <div className="pt-3 border-t border-violet-800/50 mt-3 flex items-center justify-between">
                        <span className="text-[10px] text-violet-400 font-medium">
                          {slot.role}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUnequip(slot.pos)}
                          className="flex items-center gap-1 rounded-lg border border-red-800/60 bg-red-950/40 px-2 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-900/60 hover:text-red-100 transition"
                        >
                          <XCircle className="h-3 w-3" />
                          <span>Unequip</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                      <div className="h-10 w-10 rounded-full border border-violet-700/60 bg-violet-900/30 flex items-center justify-center text-violet-400">
                        {slot.icon}
                      </div>
                      <p className="text-xs text-violet-300 font-medium">
                        Empty {slot.label}
                      </p>
                      <p className="text-[10px] text-violet-400/80 px-2">
                        Select any <strong>{slot.pos}</strong> from your collection below to slot it!
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Word Card Arsenal & Collection Vault */}
        <section className="rounded-2xl border border-violet-900/80 bg-violet-950/40 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <span>Word Card Collection ({allWords.length} Cards in Arsenal)</span>
              </h3>
              <p className="text-xs text-violet-300">
                Click "Equip" on any word to assign it to your pet's corresponding battle slot!
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-violet-400" />
              <input
                type="text"
                placeholder="Search words & definitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-violet-700 bg-violet-900/60 pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-violet-400/70 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Filter Bars */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-violet-900/60 py-3">
            {/* Part of Speech Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-400 mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Part of Speech:
              </span>
              {(['all', 'verb', 'noun', 'adjective', 'adverb'] as const).map((pos) => {
                const count = pos === 'all'
                  ? allWords.length
                  : allWords.filter((w) => w.partOfSpeech === pos).length;

                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => {
                      setPosFilter(pos);
                      juice.ding(500, 50);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition ${
                      posFilter === pos
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-violet-950 border border-violet-800 text-violet-300 hover:bg-violet-900'
                    }`}
                  >
                    {pos === 'all' ? 'All' : `${pos}s`} ({count})
                  </button>
                );
              })}
            </div>

            {/* Element Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-400 mr-1">
                Element:
              </span>
              {(['all', 'fire', 'ice'] as const).map((elem) => (
                <button
                  key={elem}
                  type="button"
                  onClick={() => {
                    setElementFilter(elem);
                    juice.ding(540, 50);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition ${
                    elementFilter === elem
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-violet-950 border border-violet-800 text-violet-300 hover:bg-violet-900'
                  }`}
                >
                  {elem === 'all' ? 'All' : elem === 'fire' ? '🔥 Fire' : '❄️ Ice'}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
            {filteredWords.map((card) => {
              const isEquippedInActivePet =
                activePet.loadout?.[card.partOfSpeech] === card.id;
              const isAffinity = card.element === petAffinity;
              const powerBonus = card.powerBonus ?? (card.forge?.powerBonus || 0);
              const depth = card.fusionDepth ?? (card.forge?.depth || 0);

              return (
                <article
                  key={card.id}
                  className={`group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                    isEquippedInActivePet
                      ? 'border-emerald-500/90 bg-emerald-950/30 ring-1 ring-emerald-500/50 shadow-md'
                      : isAffinity
                      ? 'border-violet-700/80 bg-violet-950/60 hover:border-amber-500/80 hover:bg-violet-900/60'
                      : 'border-violet-800/50 bg-violet-950/40 hover:border-violet-600'
                  }`}
                >
                  <div>
                    {/* Card Top Pill Row */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        card.partOfSpeech === 'verb'
                          ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                          : card.partOfSpeech === 'noun'
                          ? 'bg-sky-950 border border-sky-700 text-sky-300'
                          : card.partOfSpeech === 'adjective'
                          ? 'bg-amber-950 border border-amber-700 text-amber-300'
                          : 'bg-purple-950 border border-purple-700 text-purple-300'
                      }`}>
                        {card.partOfSpeech}
                      </span>

                      <div className="flex items-center gap-1">
                        <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                          card.element === 'fire'
                            ? 'bg-orange-950 border border-orange-800 text-orange-300'
                            : 'bg-cyan-950 border border-cyan-800 text-cyan-300'
                        }`}>
                          {card.element === 'fire' ? '🔥' : '❄️'}
                        </span>

                        {powerBonus > 0 && (
                          <span className="rounded bg-amber-500/20 border border-amber-500/40 px-1 py-0.5 text-[10px] font-bold text-amber-300">
                            +{powerBonus}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Word Title & Pronunciation */}
                    <div className="flex items-baseline justify-between gap-1">
                      <h4 className="font-serif text-base font-bold text-slate-100 group-hover:text-amber-200 transition">
                        {card.word}
                      </h4>
                      <button
                        type="button"
                        onClick={() => juice.speak(card.word)}
                        className="text-violet-400 hover:text-slate-100 transition p-0.5"
                        title="Pronounce word"
                      >
                        <Volume2 className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Definition & Example */}
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                      {card.definition}
                    </p>
                    {card.example && (
                      <p className="text-[10px] text-violet-300/80 italic mt-1 line-clamp-1">
                        "{card.example}"
                      </p>
                    )}

                    {/* Synergy Badge */}
                    {isAffinity && (
                      <div className="mt-2 text-[10px] font-semibold text-amber-300/90 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        <span>Matches {activePet.name} affinity (+4 PWR)</span>
                      </div>
                    )}
                  </div>

                  {/* Equip Button */}
                  <div className="mt-3 pt-2.5 border-t border-violet-800/40">
                    {isEquippedInActivePet ? (
                      <button
                        type="button"
                        onClick={() => handleUnequip(card.partOfSpeech)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500 py-1.5 text-xs font-bold text-emerald-200 hover:bg-red-950/60 hover:border-red-600 hover:text-red-300 transition"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Equipped (Click to Remove)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleEquip(card)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-violet-800/80 hover:bg-violet-700 border border-violet-600 py-1.5 text-xs font-bold text-slate-100 transition active:scale-95"
                      >
                        <span>＋ Equip to {card.partOfSpeech}</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {filteredWords.length === 0 && (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <HelpCircle className="h-8 w-8 mx-auto text-violet-500" />
              <p className="text-sm font-semibold">No word cards match your filter criteria.</p>
              <button
                type="button"
                onClick={() => {
                  setPosFilter('all');
                  setElementFilter('all');
                  setSearchQuery('');
                }}
                className="rounded-lg bg-violet-800 px-3 py-1 text-xs text-slate-200 hover:bg-violet-700"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
