import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Word, Creature } from '../types';
import { evaluateCombo } from '../engine/combat';
import { juice } from '../engine/juice';
import { WordModal } from './WordModal';
import { Sparkles, Info, Swords, RotateCcw, Volume2, Shield, Heart } from 'lucide-react';

export const BattleView: React.FC = () => {
  const {
    battleState,
    words,
    creatures,
    playerId,
    submitCombo,
    restartBattle,
    setTab,
  } = useGame();

  const [selectedAdjective, setSelectedAdjective] = useState<Word | null>(null);
  const [selectedNoun, setSelectedNoun] = useState<Word | null>(null);
  const [inspectWord, setInspectWord] = useState<Word | null>(null);

  const player = battleState.player;
  const enemy = battleState.enemy;
  const isBattleEnd = battleState.phase === 'BATTLE_END';

  const canUseWord = (creature: Creature, word: Word) => {
    return (
      creature.allowedWordTypes.includes(word.partOfSpeech) &&
      creature.allowedElements.includes(word.element)
    );
  };

  const handleSelectWord = (word: Word) => {
    juice.ding(word.partOfSpeech === 'adjective' ? 520 : 660, 100);
    juice.speak(word.word);

    if (word.partOfSpeech === 'adjective') {
      if (selectedAdjective?.id === word.id) {
        setSelectedAdjective(null);
      } else {
        setSelectedAdjective(word);
      }
    } else if (word.partOfSpeech === 'noun') {
      if (selectedNoun?.id === word.id) {
        setSelectedNoun(null);
      } else {
        setSelectedNoun(word);
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedAdjective(null);
    setSelectedNoun(null);
  };

  const handleSubmit = () => {
    if (isBattleEnd) {
      restartBattle(playerId);
      handleClearSelection();
      return;
    }

    if (!selectedAdjective || !selectedNoun) return;

    submitCombo(selectedAdjective.id, selectedNoun.id);
    handleClearSelection();
  };

  // Real-time dynamic evaluation
  const liveEvaluation = useMemo(() => {
    if (!selectedAdjective && !selectedNoun) return null;
    return evaluateCombo(player, selectedAdjective, selectedNoun);
  }, [player, selectedAdjective, selectedNoun]);

  const playerHpRatio = player.maxHp ? Math.max(0, (player.currentHp ?? 0) / player.maxHp) : 0;
  const enemyHpRatio = enemy.maxHp ? Math.max(0, (enemy.currentHp ?? 0) / enemy.maxHp) : 0;

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[#100c18] px-4 py-6 sm:px-6 sm:py-8 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Roster & Phase Status */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-violet-900 bg-violet-950/40 p-3 sm:p-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label htmlFor="creature-select" className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-violet-300">
              Active Creature:
            </label>
            <select
              id="creature-select"
              value={playerId}
              onChange={(e) => {
                restartBattle(e.target.value);
                handleClearSelection();
              }}
              className="rounded-lg border border-violet-700 bg-violet-900 px-3 py-1.5 text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
            <span className="text-xs uppercase tracking-wider text-violet-400">Combat Phase:</span>
            <span className="rounded-md bg-violet-900/80 px-2.5 py-1 text-xs font-semibold text-amber-300">
              {battleState.phase.replaceAll('_', ' ')}
            </span>
          </div>
        </section>

        {/* Fighter Arenas */}
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
                    className="rounded-lg p-1 text-violet-300 hover:text-white transition"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <span className="rounded-full border border-orange-500/60 bg-orange-950/40 px-2.5 py-0.5 text-xs font-semibold uppercase text-orange-300">
                {player.element} 🔥
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-300">
              Speaks: <strong className="text-violet-200">{player.allowedElements.join(' + ')}</strong>
            </p>

            {/* HP Bar */}
            <div className="mt-4 space-y-1.5">
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
                    className="rounded-lg p-1 text-violet-300 hover:text-white transition"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <span className="rounded-full border border-sky-500/60 bg-sky-950/40 px-2.5 py-0.5 text-xs font-semibold uppercase text-sky-300">
                {enemy.element} ❄️
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-300">
              Speaks: <strong className="text-violet-200">{enemy.allowedElements.join(' + ')}</strong>
            </p>

            {/* HP Bar */}
            <div className="mt-4 space-y-1.5">
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
            </div>
          </article>
        </section>

        {/* Word Pools Section */}
        <section className="space-y-5 rounded-2xl border border-violet-900/80 bg-violet-950/30 p-5">
          {/* Adjectives */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-200">
                  1. Choose Adjective (Modifier)
                </h3>
              </div>
              <span className="text-xs text-slate-400">Click to select · click (i) for definition</span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {words.adjectives?.map((word) => {
                const isSelected = selectedAdjective?.id === word.id;
                const isUsable = canUseWord(player, word);
                const isFire = word.element === 'fire';

                return (
                  <div
                    key={word.id}
                    className={`group relative flex items-center rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-violet-300 bg-violet-800 ring-2 ring-violet-400 shadow-md'
                        : isFire
                        ? 'border-orange-500/70 bg-violet-950 hover:bg-violet-900/80 text-orange-200'
                        : 'border-sky-500/70 bg-violet-950 hover:bg-violet-900/80 text-sky-200'
                    } ${!isUsable ? 'opacity-40 hover:opacity-75' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectWord(word)}
                      title={!isUsable ? `${player.name} cannot speak ${word.element} words.` : word.definition}
                      className="px-3.5 py-2 text-left"
                    >
                      <span className="block text-sm font-semibold text-slate-100">{word.word}</span>
                      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                        <span className={isFire ? 'text-orange-400' : 'text-sky-400'}>
                          {word.element} {isFire ? '🔥' : '❄️'}
                        </span>
                        {word.forge && (
                          <span className="text-amber-300 font-bold">✦ +{word.forge.powerBonus}</span>
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectWord(word);
                      }}
                      title="Inspect Definition"
                      className="pr-2.5 text-violet-400 hover:text-white transition"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nouns */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sky-200">
                  2. Choose Noun (Thing / Head)
                </h3>
              </div>
              <span className="text-xs text-slate-400">Click to select · click (i) for definition</span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {words.nouns?.map((word) => {
                const isSelected = selectedNoun?.id === word.id;
                const isUsable = canUseWord(player, word);
                const isFire = word.element === 'fire';

                return (
                  <div
                    key={word.id}
                    className={`group relative flex items-center rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-violet-300 bg-violet-800 ring-2 ring-violet-400 shadow-md'
                        : isFire
                        ? 'border-orange-500/70 bg-violet-950 hover:bg-violet-900/80 text-orange-200'
                        : 'border-sky-500/70 bg-violet-950 hover:bg-violet-900/80 text-sky-200'
                    } ${!isUsable ? 'opacity-40 hover:opacity-75' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectWord(word)}
                      title={!isUsable ? `${player.name} cannot speak ${word.element} words.` : word.definition}
                      className="px-3.5 py-2 text-left"
                    >
                      <span className="block text-sm font-semibold text-slate-100">{word.word}</span>
                      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                        <span className={isFire ? 'text-orange-400' : 'text-sky-400'}>
                          {word.element} {isFire ? '🔥' : '❄️'}
                        </span>
                        {word.forge && (
                          <span className="text-amber-300 font-bold">✦ +{word.forge.powerBonus}</span>
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectWord(word);
                      }}
                      title="Inspect Definition"
                      className="pr-2.5 text-violet-400 hover:text-white transition"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Combo Sentence Builder & Submission Bar */}
        <section className="rounded-2xl border-2 border-violet-700 bg-gradient-to-r from-violet-950/80 via-[#191129] to-violet-950/80 p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left space-y-1">
              <span className="text-xs uppercase tracking-widest text-violet-300">Formed Sentence Combo:</span>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <p className="font-serif text-2xl sm:text-3xl font-bold text-amber-200">
                  "{selectedAdjective?.word || '…'} {selectedNoun?.word || '…'}"
                </p>
                {(selectedAdjective || selectedNoun) && (
                  <button
                    type="button"
                    onClick={() =>
                      juice.speak(
                        `${selectedAdjective?.word || ''} ${selectedNoun?.word || ''}`
                      )
                    }
                    title="Speak phrase"
                    className="rounded-lg p-1 text-violet-300 hover:text-white transition"
                  >
                    <Volume2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(selectedAdjective || selectedNoun) && !isBattleEnd && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="rounded-lg border border-violet-800 px-3 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-900 transition"
                >
                  Clear
                </button>
              )}

              <button
                type="button"
                id="submit-combo"
                onClick={handleSubmit}
                disabled={!isBattleEnd && (!selectedAdjective || !selectedNoun)}
                className={`flex items-center gap-2 rounded-xl px-6 py-3 text-base sm:text-lg font-bold transition-all shadow-lg ${
                  isBattleEnd
                    ? 'bg-amber-500 text-violet-950 hover:bg-amber-400 ring-2 ring-amber-300 animate-pulse'
                    : selectedAdjective && selectedNoun
                    ? 'bg-violet-600 text-violet-50 hover:bg-violet-500 ring-2 ring-violet-400'
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
                    <Swords className="h-5 w-5" />
                    <span>Execute Sentence</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Linguistic Feedback Preview */}
          {liveEvaluation && selectedAdjective && selectedNoun && !isBattleEnd && (
            <div
              className={`mt-4 rounded-xl border p-3 text-xs sm:text-sm ${
                liveEvaluation.valid
                  ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200'
                  : 'border-rose-500/50 bg-rose-950/30 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {liveEvaluation.valid ? '✓ Valid Grammar & Element Alignment' : '⚠ Warning: Linguistic Incompatibility'}
              </div>
              <p className="mt-1 text-slate-200">{liveEvaluation.reasons[0]}</p>
              {liveEvaluation.valid && (
                <div className="mt-2 flex flex-wrap gap-3 font-mono text-xs text-amber-200">
                  <span>Base Combo Power: <strong>{liveEvaluation.power}</strong></span>
                  <span>Est. Damage: <strong>{Math.max(2, player.stats.attack + liveEvaluation.power - enemy.stats.defense)}</strong></span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Combat History Log */}
        <section className="rounded-2xl border border-violet-900 bg-violet-950/30 p-5">
          <div className="flex items-center justify-between mb-3 border-b border-violet-800/60 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-300">
              Battle Turn Log
            </h3>
            <span className="text-[11px] text-slate-400">Events &amp; Linguistic Feedback</span>
          </div>

          <div className="max-h-48 space-y-2 overflow-y-auto pr-2">
            {battleState.log.slice().reverse().map((entry) => (
              <div
                key={entry.id}
                className={`rounded-lg p-2.5 text-xs sm:text-sm ${
                  entry.phase === 'BATTLE_END'
                    ? 'border border-amber-500/50 bg-amber-950/40 text-amber-100 font-semibold'
                    : entry.isPlayer
                    ? entry.valid
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
      <WordModal word={inspectWord} onClose={() => setInspectWord(null)} />
    </main>
  );
};
