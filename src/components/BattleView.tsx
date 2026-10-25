import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Word, Creature, MoveCategory, PartOfSpeech } from '../types';
import { evaluateCombo, getMatrixEffectInfo } from '../engine/combat';
import { INITIAL_WORDS } from '../data/initialData';
import { juice } from '../engine/juice';
import { WordInspectorBanner } from './WordInspectorBanner';
import { WordModal } from './WordModal';
import {
  Swords,
  Shield,
  RotateCcw,
  Volume2,
  Heart,
  X,
  Sparkles,
  Zap,
  Activity,
  Flame,
  ShieldAlert,
} from 'lucide-react';

export const BattleView: React.FC = () => {
  const {
    battleState,
    words,
    creatures,
    playerId,
    submitCombo,
    restartBattle,
  } = useGame();

  const [activeCategory, setActiveCategory] = useState<MoveCategory>('ATTACK');
  const [activePosFilter, setActivePosFilter] = useState<PartOfSpeech | 'all'>('all');
  const [slot1Word, setSlot1Word] = useState<Word | null>(null);
  const [slot2Word, setSlot2Word] = useState<Word | null>(null);
  const [inspectedWord, setInspectedWord] = useState<Word | null>(null);
  const [modalWord, setModalWord] = useState<Word | null>(null);

  const player = battleState.player;
  const enemy = battleState.enemy;
  const isBattleEnd = battleState.phase === 'BATTLE_END';

  // Guaranteed word pools
  const allWords = useMemo(() => {
    return [
      ...(words.verbs?.length ? words.verbs : INITIAL_WORDS.verbs || []),
      ...(words.nouns?.length ? words.nouns : INITIAL_WORDS.nouns || []),
      ...(words.adjectives?.length ? words.adjectives : INITIAL_WORDS.adjectives || []),
      ...(words.adverbs?.length ? words.adverbs : INITIAL_WORDS.adverbs || []),
    ];
  }, [words]);

  const canUseWord = (creature: Creature, word: Word) => {
    return creature.allowedElements.includes(word.element);
  };

  const handleCategoryChange = (newCat: MoveCategory) => {
    setActiveCategory(newCat);
    juice.ding(newCat === 'ATTACK' ? 520 : newCat === 'DEFEND' ? 660 : newCat === 'BUFF' ? 880 : 380, 80);
  };

  const handleWordClick = (word: Word) => {
    setInspectedWord(word);
    juice.ding(word.element === 'fire' ? 620 : 520, 80);
    juice.speak(word.word);

    // Slotting logic: slot 1 first, then slot 2. Tapping same word removes it.
    if (slot1Word?.id === word.id) {
      setSlot1Word(null);
    } else if (slot2Word?.id === word.id) {
      setSlot2Word(null);
    } else if (!slot1Word) {
      setSlot1Word(word);
    } else if (!slot2Word) {
      setSlot2Word(word);
    } else {
      // If both full, replace slot 2
      setSlot2Word(word);
    }
  };

  const handleClearSlots = () => {
    setSlot1Word(null);
    setSlot2Word(null);
  };

  const handleSubmit = () => {
    if (isBattleEnd) {
      restartBattle(playerId);
      handleClearSlots();
      return;
    }

    if (!slot1Word) return;

    submitCombo(slot1Word.id, slot2Word ? slot2Word.id : null, activeCategory);
    handleClearSlots();
  };

  // Real-time dynamic evaluation
  const liveEvaluation = useMemo(() => {
    if (!slot1Word && !slot2Word) return null;
    return evaluateCombo(player, slot1Word, slot2Word, activeCategory);
  }, [player, slot1Word, slot2Word, activeCategory]);

  const playerHpRatio = player.maxHp ? Math.max(0, (player.currentHp ?? 0) / player.maxHp) : 0;
  const enemyHpRatio = enemy.maxHp ? Math.max(0, (enemy.currentHp ?? 0) / enemy.maxHp) : 0;

  // Filter words by POS
  const filteredWords = useMemo(() => {
    if (activePosFilter === 'all') return allWords;
    return allWords.filter((w) => w.partOfSpeech === activePosFilter);
  }, [allWords, activePosFilter]);

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[#100c18] px-4 py-6 sm:px-6 sm:py-8 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Roster & Phase Status */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-violet-900 bg-violet-950/40 p-3 sm:p-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label htmlFor="creature-select" className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-violet-300">
              Active Pet:
            </label>
            <select
              id="creature-select"
              value={playerId}
              onChange={(e) => {
                restartBattle(e.target.value);
                handleClearSlots();
              }}
              className="rounded-lg border border-violet-700 bg-violet-900 px-3 py-1.5 text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
            >
              {creatures
                .filter((c) => c.id !== 'rimepup')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.forged ? '✦ (Hybrid)' : ''} — {c.element.toUpperCase()}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-violet-400">Battle Phase:</span>
            <span className="rounded-md bg-violet-900/80 px-2.5 py-1 text-xs font-semibold text-amber-300">
              {battleState.phase.replaceAll('_', ' ')}
            </span>
          </div>
        </section>

        {/* Fighter Arenas with Status Effects */}
        <section className="grid gap-4 sm:grid-cols-2">
          {/* Player Card */}
          <article className="relative overflow-hidden rounded-2xl border-2 border-orange-500/80 bg-gradient-to-b from-violet-950/90 to-[#181126] p-5 shadow-lg shadow-orange-950/20">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-orange-400">
                  You · Champion
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-orange-50">
                    {player.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => juice.speak(`${player.name}. ${player.description}`)}
                    title="Hear creature lore"
                    className="rounded-lg p-1 text-violet-300 hover:text-white transition cursor-pointer"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {(player.shield ?? 0) > 0 && (
                  <span className="flex items-center gap-1 rounded-full border border-violet-400 bg-violet-950 px-2.5 py-0.5 text-xs font-bold text-violet-200 shadow-sm animate-pulse">
                    <Shield className="h-3 w-3 text-violet-300" />
                    <span>+{player.shield}</span>
                  </span>
                )}
                <span className="rounded-full border border-orange-500/60 bg-orange-950/40 px-2.5 py-0.5 text-xs font-semibold uppercase text-orange-300">
                  {player.element} 🔥
                </span>
              </div>
            </div>

            <p className="mt-1 text-xs text-slate-300">
              Channels: <strong className="text-violet-200">{player.allowedElements.join(' + ')}</strong>
            </p>

            {/* Active Status Badges */}
            <div className="mt-2 flex flex-wrap gap-1.5 min-h-[22px]">
              {player.evasionStance && (
                <span className="rounded bg-sky-950 border border-sky-400 px-2 py-0.5 text-[10px] font-bold text-sky-200 animate-pulse">
                  💨 Evasion Stance
                </span>
              )}
              {player.reflectStance && (
                <span className="rounded bg-violet-950 border border-violet-400 px-2 py-0.5 text-[10px] font-bold text-violet-200 animate-pulse">
                  🛡️ Counter-Stance
                </span>
              )}
              {player.empowered && (
                <span className="rounded bg-amber-950 border border-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-200 animate-pulse">
                  ⚡ Empowered (+50%)
                </span>
              )}
              {player.statuses?.map((st) => (
                <span
                  key={st.id}
                  className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                    st.type === 'buff' ? 'bg-emerald-950 border-emerald-400 text-emerald-200' : 'bg-rose-950 border-rose-400 text-rose-200'
                  }`}
                >
                  {st.name} ({st.duration}t)
                </span>
              ))}
            </div>

            {/* HP Bar */}
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="flex items-center gap-1 text-slate-300">
                  <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-400" /> HP
                </span>
                <span className="font-mono text-slate-200">
                  {player.currentHp} / {player.maxHp}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    playerHpRatio > 0.35 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-red-600 to-red-500'
                  }`}
                  style={{ width: `${Math.max(0, playerHpRatio * 100)}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="mt-3 flex gap-4 text-xs text-slate-300 border-t border-violet-900/60 pt-2.5">
              <div>ATK: <strong className="text-orange-300">{player.stats.attack}</strong></div>
              <div>DEF: <strong className="text-sky-300">{player.stats.defense}</strong></div>
              <div>SPD: <strong className="text-violet-300">{player.stats.speed}</strong></div>
              <div>SHIELD: <strong className="text-violet-300">{player.shield || 0}</strong></div>
            </div>
          </article>

          {/* Rival Card */}
          <article className="relative overflow-hidden rounded-2xl border-2 border-sky-500/80 bg-gradient-to-b from-violet-950/90 to-[#181126] p-5 shadow-lg shadow-sky-950/20">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-sky-400">
                  Rival · Challenger
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-sky-50">
                    {enemy.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => juice.speak(`${enemy.name}. ${enemy.description}`)}
                    title="Hear creature lore"
                    className="rounded-lg p-1 text-violet-300 hover:text-white transition cursor-pointer"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {(enemy.shield ?? 0) > 0 && (
                  <span className="flex items-center gap-1 rounded-full border border-violet-400 bg-violet-950 px-2.5 py-0.5 text-xs font-bold text-violet-200 shadow-sm animate-pulse">
                    <Shield className="h-3 w-3 text-violet-300" />
                    <span>+{enemy.shield}</span>
                  </span>
                )}
                <span className="rounded-full border border-sky-500/60 bg-sky-950/40 px-2.5 py-0.5 text-xs font-semibold uppercase text-sky-300">
                  {enemy.element} ❄️
                </span>
              </div>
            </div>

            <p className="mt-1 text-xs text-slate-300">
              Channels: <strong className="text-violet-200">{enemy.allowedElements.join(' + ')}</strong>
            </p>

            {/* Active Status Badges */}
            <div className="mt-2 flex flex-wrap gap-1.5 min-h-[22px]">
              {enemy.evasionStance && (
                <span className="rounded bg-sky-950 border border-sky-400 px-2 py-0.5 text-[10px] font-bold text-sky-200 animate-pulse">
                  💨 Evasion Stance
                </span>
              )}
              {enemy.reflectStance && (
                <span className="rounded bg-violet-950 border border-violet-400 px-2 py-0.5 text-[10px] font-bold text-violet-200 animate-pulse">
                  🛡️ Counter-Stance
                </span>
              )}
              {enemy.empowered && (
                <span className="rounded bg-amber-950 border border-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-200 animate-pulse">
                  ⚡ Empowered (+50%)
                </span>
              )}
              {enemy.statuses?.map((st) => (
                <span
                  key={st.id}
                  className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                    st.type === 'buff' ? 'bg-emerald-950 border-emerald-400 text-emerald-200' : 'bg-rose-950 border-rose-400 text-rose-200'
                  }`}
                >
                  {st.name} ({st.duration}t)
                </span>
              ))}
            </div>

            {/* HP Bar */}
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="flex items-center gap-1 text-slate-300">
                  <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-400" /> HP
                </span>
                <span className="font-mono text-slate-200">
                  {enemy.currentHp} / {enemy.maxHp}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    enemyHpRatio > 0.35 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-red-600 to-red-500'
                  }`}
                  style={{ width: `${Math.max(0, enemyHpRatio * 100)}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="mt-3 flex gap-4 text-xs text-slate-300 border-t border-violet-900/60 pt-2.5">
              <div>ATK: <strong className="text-orange-300">{enemy.stats.attack}</strong></div>
              <div>DEF: <strong className="text-sky-300">{enemy.stats.defense}</strong></div>
              <div>SPD: <strong className="text-violet-300">{enemy.stats.speed}</strong></div>
              <div>SHIELD: <strong className="text-violet-300">{enemy.shield || 0}</strong></div>
            </div>
          </article>
        </section>

        {/* Word Inspector Banner */}
        <WordInspectorBanner
          word={inspectedWord}
          activeCategory={activeCategory}
          onClose={() => setInspectedWord(null)}
          onSlotWord={handleWordClick}
        />

        {/* 4x4 Category Selector Tabs */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
              Choose Move Category (4x4 Action Matrix):
            </span>
            <span className="text-xs text-slate-400">Any part of speech works in each category!</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* ATTACK */}
            <button
              type="button"
              onClick={() => handleCategoryChange('ATTACK')}
              className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer ${
                activeCategory === 'ATTACK'
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white ring-2 ring-orange-400'
                  : 'bg-violet-950 text-violet-300 hover:bg-violet-900'
              }`}
            >
              <Swords className="h-4 w-4" />
              <span>Attack (Offense)</span>
            </button>

            {/* DEFEND */}
            <button
              type="button"
              onClick={() => handleCategoryChange('DEFEND')}
              className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer ${
                activeCategory === 'DEFEND'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white ring-2 ring-violet-400'
                  : 'bg-violet-950 text-violet-300 hover:bg-violet-900'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Defend (Shield)</span>
            </button>

            {/* BUFF */}
            <button
              type="button"
              onClick={() => handleCategoryChange('BUFF')}
              className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer ${
                activeCategory === 'BUFF'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white ring-2 ring-amber-300'
                  : 'bg-violet-950 text-violet-300 hover:bg-violet-900'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Buff (Boost)</span>
            </button>

            {/* DEBUFF */}
            <button
              type="button"
              onClick={() => handleCategoryChange('DEBUFF')}
              className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer ${
                activeCategory === 'DEBUFF'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white ring-2 ring-emerald-400'
                  : 'bg-violet-950 text-violet-300 hover:bg-violet-900'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Debuff (Disrupt)</span>
            </button>
          </div>
        </section>

        {/* Word Selection & Part of Speech Filters */}
        <section className="space-y-4 rounded-2xl border border-violet-900/80 bg-violet-950/30 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-violet-800/60 pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-200">
                Elemental Word Vault
              </h3>
              <p className="text-xs text-violet-300/80">
                Choose 1 word for a direct action, or 2 words to synthesize a combo
              </p>
            </div>

            {/* POS Filter Buttons */}
            <div className="flex items-center gap-1 flex-wrap">
              {(['all', 'verb', 'noun', 'adjective', 'adverb'] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setActivePosFilter(pos)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition cursor-pointer ${
                    activePosFilter === pos
                      ? 'bg-violet-600 text-white shadow'
                      : 'bg-violet-950 text-violet-300 hover:bg-violet-900'
                  }`}
                >
                  {pos === 'all' ? 'All Words' : `${pos}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Word Cards Grid */}
          <div className="flex flex-wrap gap-2.5 max-h-72 overflow-y-auto pr-1">
            {filteredWords.map((word) => {
              const isSelected = slot1Word?.id === word.id || slot2Word?.id === word.id;
              const isUsable = canUseWord(player, word);
              const isFire = word.element === 'fire';
              const matrixRole = getMatrixEffectInfo(activeCategory, word.partOfSpeech);

              return (
                <button
                  key={word.id}
                  type="button"
                  onClick={() => handleWordClick(word)}
                  title={!isUsable ? `${player.name} cannot speak ${word.element} words.` : `${word.definition} — [${matrixRole.name}]: ${matrixRole.description}`}
                  className={`group rounded-xl border-2 px-3.5 py-2 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-300 bg-amber-500/20 ring-2 ring-amber-400 shadow-md scale-105'
                      : isFire
                      ? 'border-orange-500/70 bg-violet-950 hover:bg-violet-900 text-orange-200'
                      : 'border-sky-500/70 bg-violet-950 hover:bg-violet-900 text-sky-200'
                  } ${!isUsable ? 'opacity-40 hover:opacity-75' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="block text-sm font-semibold text-slate-100">{word.word}</span>
                    <span className="text-[10px] rounded px-1.5 py-0.2 bg-violet-900 text-violet-300 uppercase">
                      {word.partOfSpeech}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider mt-0.5">
                    <span className={isFire ? 'text-orange-400' : 'text-sky-400'}>
                      {word.element} {isFire ? '🔥' : '❄️'}
                    </span>
                    <span className="text-[10px] text-amber-300 font-medium">
                      · {matrixRole.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Combo Sentence Builder & Submission Bar */}
        <section className="rounded-2xl border-2 border-violet-700 bg-gradient-to-r from-violet-950/80 via-[#191129] to-violet-950/80 p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto space-y-2">
              <span className="text-xs uppercase tracking-widest text-violet-300 block">
                {activeCategory} Sentence Builder (1 or 2 words):
              </span>

              {/* Interactive Sentence Slots */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Slot 1 */}
                <div
                  className={`min-w-[130px] rounded-xl border-2 p-2.5 text-center transition-all ${
                    slot1Word
                      ? 'border-amber-400 bg-amber-950/40 text-amber-100'
                      : 'border-dashed border-violet-700 bg-violet-950/40 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider block text-violet-300">
                    Slot 1 (Modifier / Action)
                  </span>
                  <div className="flex items-center justify-center gap-1.5 mt-0.5">
                    <span className="font-serif font-bold text-base capitalize">
                      {slot1Word ? slot1Word.word : 'Pick Word'}
                    </span>
                    {slot1Word && (
                      <button
                        type="button"
                        onClick={() => setSlot1Word(null)}
                        className="text-amber-300 hover:text-white cursor-pointer"
                        title="Remove word"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                <span className="font-serif text-xl font-bold text-violet-400">+</span>

                {/* Slot 2 */}
                <div
                  className={`min-w-[130px] rounded-xl border-2 p-2.5 text-center transition-all ${
                    slot2Word
                      ? 'border-sky-400 bg-sky-950/40 text-sky-100'
                      : 'border-dashed border-violet-700 bg-violet-950/40 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider block text-violet-300">
                    Slot 2 (Optional Head)
                  </span>
                  <div className="flex items-center justify-center gap-1.5 mt-0.5">
                    <span className="font-serif font-bold text-base capitalize">
                      {slot2Word ? slot2Word.word : '(Optional)'}
                    </span>
                    {slot2Word && (
                      <button
                        type="button"
                        onClick={() => setSlot2Word(null)}
                        className="text-sky-300 hover:text-white cursor-pointer"
                        title="Remove word"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {(slot1Word || slot2Word) && (
                  <button
                    type="button"
                    onClick={() =>
                      juice.speak(
                        `${slot1Word?.word || ''} ${slot2Word?.word || ''}`
                      )
                    }
                    title="Pronounce Phrase"
                    className="rounded-lg p-2 text-violet-300 hover:text-white transition cursor-pointer"
                  >
                    <Volume2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {(slot1Word || slot2Word) && !isBattleEnd && (
                <button
                  type="button"
                  onClick={handleClearSlots}
                  className="rounded-lg border border-violet-800 px-3 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-900 transition cursor-pointer"
                >
                  Clear Slots
                </button>
              )}

              <button
                type="button"
                id="submit-combo"
                onClick={handleSubmit}
                disabled={!isBattleEnd && !slot1Word}
                className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base sm:text-lg font-bold transition-all shadow-lg w-full sm:w-auto cursor-pointer ${
                  isBattleEnd
                    ? 'bg-amber-500 text-violet-950 hover:bg-amber-400 ring-2 ring-amber-300 animate-pulse'
                    : slot1Word
                    ? activeCategory === 'ATTACK'
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 ring-2 ring-orange-400'
                      : activeCategory === 'DEFEND'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 ring-2 ring-violet-400'
                      : activeCategory === 'BUFF'
                      ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white hover:from-amber-500 hover:to-yellow-500 ring-2 ring-amber-400'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 ring-2 ring-emerald-400'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isBattleEnd ? (
                  <>
                    <RotateCcw className="h-5 w-5" />
                    <span>New Battle</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    <span>Execute {activeCategory}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Linguistic Feedback Preview */}
          {liveEvaluation && slot1Word && !isBattleEnd && (
            <div
              className={`mt-4 rounded-xl border p-3 text-xs sm:text-sm ${
                liveEvaluation.valid
                  ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200'
                  : 'border-rose-500/50 bg-rose-950/30 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {liveEvaluation.valid ? (
                  <>
                    <Zap className="h-4 w-4 text-emerald-400" />
                    <span>
                      {liveEvaluation.effectName} ({activeCategory}): {liveEvaluation.tacticalOutcome}
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                    <span>Linguistic / Element Incompatibility</span>
                  </>
                )}
              </div>
              <p className="mt-1 text-slate-200">{liveEvaluation.reasons[0]}</p>
            </div>
          )}
        </section>

        {/* Combat History Log */}
        <section className="rounded-2xl border border-violet-900 bg-violet-950/30 p-5">
          <div className="flex items-center justify-between mb-3 border-b border-violet-800/60 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-300">
              4x4 Battle Turn Log
            </h3>
            <span className="text-[11px] text-slate-400">Events &amp; Turn History</span>
          </div>

          <div className="max-h-48 space-y-2 overflow-y-auto pr-2">
            {battleState.log.slice().reverse().map((entry) => (
              <div
                key={entry.id}
                className={`rounded-lg p-2.5 text-xs sm:text-sm ${
                  entry.phase === 'BATTLE_END'
                    ? 'border border-amber-500/50 bg-amber-950/40 text-amber-100 font-semibold'
                    : entry.isPlayer
                    ? entry.valid !== false
                      ? 'border-l-4 border-l-emerald-500 bg-violet-900/30 text-slate-200'
                      : 'border-l-4 border-l-rose-500 bg-violet-900/30 text-rose-200'
                    : 'border-l-4 border-l-sky-500 bg-violet-900/30 text-slate-200'
                }`}
              >
                {entry.message}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Word Definition Modal */}
      <WordModal word={modalWord} onClose={() => setModalWord(null)} />
    </main>
  );
};
