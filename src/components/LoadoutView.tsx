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
import { PageHeading } from './PageHeading';

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
    bgGradient: 'from-emerald-50/60 to-slate-100/80',
    borderColor: 'border-emerald-600/50',
    badgeBg: 'bg-emerald-100/80 text-emerald-700 border border-emerald-400',
    badgeText: 'VERB',
  },
  {
    pos: 'noun',
    label: 'Noun Slot',
    role: 'Substance & Fortification',
    icon: <Shield className="h-4 w-4" />,
    bgGradient: 'from-sky-50/60 to-slate-100/80',
    borderColor: 'border-sky-600/50',
    badgeBg: 'bg-sky-100/80 text-sky-700 border border-sky-400',
    badgeText: 'NOUN',
  },
  {
    pos: 'adjective',
    label: 'Adjective Slot',
    role: 'Quality & Attribute Surge',
    icon: <Sparkles className="h-4 w-4" />,
    bgGradient: 'from-amber-50/60 to-slate-100/80',
    borderColor: 'border-amber-600/50',
    badgeBg: 'bg-amber-100/80 text-amber-700 border border-amber-400',
    badgeText: 'ADJECTIVE',
  },
  {
    pos: 'adverb',
    label: 'Adverb Slot',
    role: 'Momentum & Evasion Stance',
    icon: <Zap className="h-4 w-4" />,
    bgGradient: 'from-purple-50/60 to-slate-100/80',
    borderColor: 'border-purple-600/50',
    badgeBg: 'bg-purple-100/80 text-purple-700 border border-purple-400',
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
    <main className="min-h-[calc(100vh-65px)] bg-gradient-to-b from-sky-50 via-amber-50 to-pink-50 px-4 py-6 font-sans text-slate-900 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <PageHeading
          eyebrow="Your battle preparations"
          title="Word Arsenal"
          description="Choose your battle pet and equip the words that will shape its combat moves."
        />
        {/* Top Header & Pet Selector */}
        <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-violet-300/80 bg-gradient-to-r from-violet-50/80 via-white to-violet-50/80 p-5 shadow-lg shadow-violet-200/40">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 shadow-lg ${
              petAffinity === 'fire'
                ? 'border-orange-600 bg-gradient-to-br from-amber-400 to-red-300 shadow-orange-200/60'
                : 'border-cyan-400 bg-gradient-to-br from-cyan-400 to-blue-200 shadow-cyan-200/60'
            }`}>
              {petAffinity === 'fire' ? (
                <Flame className="h-8 w-8 text-amber-800 animate-pulse" />
              ) : (
                <Snowflake className="h-8 w-8 text-cyan-800 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-orange-900">
                  {activePet.name}
                </h2>
                {activePet.forged && (
                  <span className="rounded-full bg-amber-500/20 border border-amber-600/50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    ✦ HYBRID PET
                  </span>
                )}
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                  petAffinity === 'fire'
                    ? 'bg-orange-50/80 border border-orange-500/70 text-orange-700'
                    : 'bg-cyan-50/80 border border-cyan-500/70 text-cyan-700'
                }`}>
                  {petAffinity === 'fire' ? <Flame className="h-3 w-3" /> : <Snowflake className="h-3 w-3" />}
                  {petAffinity} Affinity
                </span>
              </div>
              <p className="text-xs text-violet-700 mt-1 max-w-xl">
                {activePet.description}
              </p>
            </div>
          </div>

          {/* Pet Switcher & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2">
              <label htmlFor="loadout-pet-select" className="text-xs font-semibold text-violet-700 uppercase tracking-wider">
                Select Pet:
              </label>
              <select
                id="loadout-pet-select"
                value={selectedPetId}
                onChange={(e) => {
                  setSelectedPetId(e.target.value);
                  juice.ding(600, 80);
                }}
                className="rounded-xl border border-violet-400 bg-violet-100/90 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-600 cursor-pointer"
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
              className="flex items-center gap-1.5 rounded-xl border border-amber-600/60 bg-amber-50/40 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100/60 hover:text-amber-900 transition shadow-sm"
              title="Auto-fill empty slots with your best matching words"
            >
              <Zap className="h-3.5 w-3.5 text-amber-600" />
              <span>Auto-Equip</span>
            </button>
          </div>
        </section>

        {/* 4 Dedicated Pet Battle Slots (The 4-Card Arsenal) */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif text-lg font-bold tracking-wide text-orange-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-600" />
                <span>Battle Word Arsenal (4 Dedicated Slots)</span>
              </h3>
              <p className="text-xs text-violet-700">
                Equip 1 card of each part of speech. Matching {petAffinity} affinity grants <strong className="text-amber-700">+4 Elemental Synergy</strong> in combat!
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-violet-600">Loadout Status:</span>
                <span className={`font-bold flex items-center gap-1 ${
                  equippedCount === 4 ? 'text-emerald-600' : 'text-amber-600'
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
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-400 to-amber-400 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-orange-200/60 hover:from-orange-500 hover:to-amber-500 transition active:scale-95"
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
                      : 'border-dashed border-violet-300/60 bg-violet-50/20 hover:border-violet-400'
                  }`}
                >
                  {/* Slot Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-lg bg-violet-100/60 text-slate-800">
                        {slot.icon}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
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
                          <h4 className="font-serif text-lg font-bold text-slate-900 tracking-wide">
                            {equippedWord.word}
                          </h4>
                          <button
                            type="button"
                            onClick={() => juice.speak(equippedWord.word)}
                            className="p-1 text-violet-600 hover:text-slate-800 transition"
                            title="Hear pronunciation"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            equippedWord.element === 'fire'
                              ? 'bg-orange-50/80 border border-orange-400 text-orange-700'
                              : 'bg-cyan-50/80 border border-cyan-400 text-cyan-700'
                          }`}>
                            {equippedWord.element === 'fire' ? '🔥' : '❄️'} {equippedWord.element}
                          </span>

                          {powerBonus > 0 && (
                            <span className="rounded bg-amber-500/20 border border-amber-600/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                              +{powerBonus} PWR
                            </span>
                          )}

                          {depth > 0 && (
                            <span className="rounded bg-violet-200/50 border border-violet-500/40 px-1.5 py-0.5 text-[10px] font-bold text-violet-800">
                              ★ D{depth}
                            </span>
                          )}
                        </div>

                        {/* Affinity Synergy Bonus indicator */}
                        {isAffinityMatch && (
                          <div className="mt-2 rounded-lg bg-orange-500/10 border border-orange-600/30 px-2 py-1 text-[11px] text-amber-700 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-amber-600 shrink-0" />
                            <span><strong>Affinity Match:</strong> +4 Synergy</span>
                          </div>
                        )}

                        <p className="text-[11px] text-slate-700/90 italic mt-2 line-clamp-2">
                          "{equippedWord.definition}"
                        </p>
                      </div>

                      {/* Unequip action */}
                      <div className="pt-3 border-t border-violet-300/50 mt-3 flex items-center justify-between">
                        <span className="text-[10px] text-violet-600 font-medium">
                          {slot.role}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUnequip(slot.pos)}
                          className="flex items-center gap-1 rounded-lg border border-red-300/60 bg-red-50/40 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100/60 hover:text-red-900 transition"
                        >
                          <XCircle className="h-3 w-3" />
                          <span>Unequip</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                      <div className="h-10 w-10 rounded-full border border-violet-400/60 bg-violet-100/30 flex items-center justify-center text-violet-600">
                        {slot.icon}
                      </div>
                      <p className="text-xs text-violet-700 font-medium">
                        Empty {slot.label}
                      </p>
                      <p className="text-[10px] text-violet-600/80 px-2">
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
        <section className="rounded-2xl border border-violet-300/80 bg-violet-50/40 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
                <span>Word Card Collection ({allWords.length} Cards in Arsenal)</span>
              </h3>
              <p className="text-xs text-violet-700">
                Click "Equip" on any word to assign it to your pet's corresponding battle slot!
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-violet-600" />
              <input
                type="text"
                placeholder="Search words & definitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-violet-400 bg-violet-100/60 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-violet-600/70 focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </div>
          </div>

          {/* Filter Bars */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-violet-300/60 py-3">
            {/* Part of Speech Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-600 mr-1 flex items-center gap-1">
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
                        : 'bg-violet-50 border border-violet-300 text-violet-700 hover:bg-violet-100'
                    }`}
                  >
                    {pos === 'all' ? 'All' : `${pos}s`} ({count})
                  </button>
                );
              })}
            </div>

            {/* Element Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-600 mr-1">
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
                      : 'bg-violet-50 border border-violet-300 text-violet-700 hover:bg-violet-100'
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
                      ? 'border-emerald-600/90 bg-emerald-50/30 ring-1 ring-emerald-600/50 shadow-md'
                      : isAffinity
                      ? 'border-violet-400/80 bg-violet-50/60 hover:border-amber-600/80 hover:bg-violet-100/60'
                      : 'border-violet-300/50 bg-violet-50/40 hover:border-violet-500'
                  }`}
                >
                  <div>
                    {/* Card Top Pill Row */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        card.partOfSpeech === 'verb'
                          ? 'bg-emerald-50 border border-emerald-400 text-emerald-700'
                          : card.partOfSpeech === 'noun'
                          ? 'bg-sky-50 border border-sky-400 text-sky-700'
                          : card.partOfSpeech === 'adjective'
                          ? 'bg-amber-50 border border-amber-400 text-amber-700'
                          : 'bg-purple-50 border border-purple-400 text-purple-700'
                      }`}>
                        {card.partOfSpeech}
                      </span>

                      <div className="flex items-center gap-1">
                        <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                          card.element === 'fire'
                            ? 'bg-orange-50 border border-orange-300 text-orange-700'
                            : 'bg-cyan-50 border border-cyan-300 text-cyan-700'
                        }`}>
                          {card.element === 'fire' ? '🔥' : '❄️'}
                        </span>

                        {powerBonus > 0 && (
                          <span className="rounded bg-amber-500/20 border border-amber-600/40 px-1 py-0.5 text-[10px] font-bold text-amber-700">
                            +{powerBonus}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Word Title & Pronunciation */}
                    <div className="flex items-baseline justify-between gap-1">
                      <h4 className="font-serif text-base font-bold text-slate-900 group-hover:text-amber-800 transition">
                        {card.word}
                      </h4>
                      <button
                        type="button"
                        onClick={() => juice.speak(card.word)}
                        className="text-violet-600 hover:text-slate-900 transition p-0.5"
                        title="Pronounce word"
                      >
                        <Volume2 className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Definition & Example */}
                    <p className="text-[11px] text-slate-700 mt-1 line-clamp-2">
                      {card.definition}
                    </p>
                    {card.example && (
                      <p className="text-[10px] text-violet-700/80 italic mt-1 line-clamp-1">
                        "{card.example}"
                      </p>
                    )}

                    {/* Synergy Badge */}
                    {isAffinity && (
                      <div className="mt-2 text-[10px] font-semibold text-amber-700/90 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-600" />
                        <span>Matches {activePet.name} affinity (+4 PWR)</span>
                      </div>
                    )}
                  </div>

                  {/* Equip Button */}
                  <div className="mt-3 pt-2.5 border-t border-violet-300/40">
                    {isEquippedInActivePet ? (
                      <button
                        type="button"
                        onClick={() => handleUnequip(card.partOfSpeech)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-400/30 border border-emerald-600 py-1.5 text-xs font-bold text-emerald-800 hover:bg-red-50/60 hover:border-red-500 hover:text-red-700 transition"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Equipped (Click to Remove)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleEquip(card)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-violet-200/80 hover:bg-violet-300 border border-violet-500 py-1.5 text-xs font-bold text-slate-900 transition active:scale-95"
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
            <div className="py-12 text-center text-slate-600 space-y-2">
              <HelpCircle className="h-8 w-8 mx-auto text-violet-600" />
              <p className="text-sm font-semibold">No word cards match your filter criteria.</p>
              <button
                type="button"
                onClick={() => {
                  setPosFilter('all');
                  setElementFilter('all');
                  setSearchQuery('');
                }}
                className="rounded-lg bg-violet-200 px-3 py-1 text-xs text-slate-800 hover:bg-violet-300"
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
