import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ForgeToken, Word, Creature, Affix } from '../types';
import { createForge, getAllWordsList } from '../engine/forge';
import { juice } from '../engine/juice';
import {
  Sparkles,
  ArrowRightLeft,
  X,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Swords,
  Search,
} from 'lucide-react';

export const WordForgeView: React.FC = () => {
  const {
    words,
    creatures,
    commitWord,
    commitCreature,
    goToBattle,
    useCreatureInBattle,
  } = useGame();

  const [leftSlot, setLeftSlot] = useState<ForgeToken | null>(null);
  const [rightSlot, setRightSlot] = useState<ForgeToken | null>(null);
  const [activeBin, setActiveBin] = useState<'words' | 'affixes' | 'creatures'>('words');
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<{ kind: 'word' | 'creature'; text: string; id: string } | null>(null);

  const forge = useMemo(() => {
    return createForge({ creatures, words });
  }, [creatures, words]);

  // Resolve tokens
  const describeToken = (token: ForgeToken | null) => {
    if (!token) return null;
    if (token.kind === 'word') {
      const w = getAllWordsList(words).find((e) => e.id === token.id);
      return w ? { title: w.word, sub: w.partOfSpeech, element: w.element, isForged: Boolean(w.forge) } : null;
    }
    if (token.kind === 'affix') {
      const a = forge.listAffixes().find((e) => e.id === token.id);
      return a ? { title: a.type === 'prefix' ? `${a.text}-` : `-${a.text}`, sub: `${a.type} · ${a.gloss}`, element: null, isForged: false } : null;
    }
    if (token.kind === 'creature') {
      const c = creatures.find((e) => e.id === token.id);
      return c ? { title: c.name, sub: 'creature', element: c.element, isForged: Boolean(c.forged) } : null;
    }
    return null;
  };

  const leftDesc = describeToken(leftSlot);
  const rightDesc = describeToken(rightSlot);

  // Live fusion preview
  const outcome = useMemo(() => {
    if (!leftSlot || !rightSlot) return null;
    return forge.fuse(leftSlot, rightSlot);
  }, [forge, leftSlot, rightSlot]);

  const handleSelectToken = (token: ForgeToken) => {
    juice.ding(560, 80);
    setNotice(null);
    if (!leftSlot) {
      setLeftSlot(token);
    } else if (!rightSlot) {
      setRightSlot(token);
    } else {
      // If both full, replace right
      setRightSlot(token);
    }
  };

  const handleSwap = () => {
    juice.ding(400, 60);
    const temp = leftSlot;
    setLeftSlot(rightSlot);
    setRightSlot(temp);
  };

  const handleCommitForge = () => {
    if (!outcome || !outcome.ok || !outcome.result) return;

    juice.forgeChime();

    if (outcome.kind === 'creature-fusion') {
      const newCreature = outcome.result as Creature;
      commitCreature(newCreature);
      setNotice({
        kind: 'creature',
        text: `${newCreature.name} joined your roster!`,
        id: newCreature.id,
      });
      juice.speak(`${newCreature.name} has been forged!`);
    } else {
      const newWord = outcome.result as Word;
      commitWord(newWord);
      setNotice({
        kind: 'word',
        text: `"${newWord.word}" added to your battle vocabulary!`,
        id: newWord.id,
      });
      juice.speak(newWord.word);
    }

    setLeftSlot(null);
    setRightSlot(null);
  };

  // Filter items in active bin
  const filteredWords = useMemo(() => {
    const list = getAllWordsList(words);
    if (!searchQuery) return list;
    return list.filter((w) => w.word.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [words, searchQuery]);

  const filteredAffixes = useMemo(() => {
    const list = forge.listAffixes();
    if (!searchQuery) return list;
    return list.filter((a) => a.text.toLowerCase().includes(searchQuery.toLowerCase()) || a.gloss.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [forge, searchQuery]);

  const filteredCreatures = useMemo(() => {
    if (!searchQuery) return creatures;
    return creatures.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [creatures, searchQuery]);

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[#100c18] px-4 py-6 sm:px-6 sm:py-8 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-950/20 px-3 py-1 text-xs font-semibold text-amber-300">
            <Sparkles className="h-3.5 w-3.5" /> Layer 2: Word Relationships &amp; Morphology
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-[0.25em] text-orange-50">
            THE WORD FORGE
          </h2>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-violet-300">
            Combine affixes, words, and creatures according to real English rules to coin new words and hybrid battle pets.
          </p>
        </header>

        {/* Success Notice Banner */}
        {notice && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border-2 border-emerald-500/80 bg-emerald-950/50 p-4 shadow-xl">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-100">✦ Forged Successfully!</p>
                <p className="text-xs text-emerald-200/90">{notice.text}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notice.kind === 'creature' ? (
                <button
                  type="button"
                  onClick={() => useCreatureInBattle(notice.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow"
                >
                  <Swords className="h-4 w-4" /> Battle with {notice.id}!
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToBattle}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-violet-50 hover:bg-violet-500 transition shadow"
                >
                  <Swords className="h-4 w-4" /> Go to Battle
                </button>
              )}
            </div>
          </div>
        )}

        {/* Forge Slots Workbench */}
        <section className="rounded-2xl border-2 border-violet-800 bg-gradient-to-b from-violet-950/90 to-[#171025] p-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Slot 1 */}
            <div
              className={`flex min-h-[110px] flex-1 flex-col justify-between rounded-xl border-2 p-4 transition-all ${
                leftSlot
                  ? 'border-violet-400 bg-violet-900/60 shadow-lg'
                  : 'border-dashed border-violet-700/80 bg-violet-950/40'
              }`}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-300">
                  Slot 1 · Modifier / Prefix
                </span>
                <p className="font-serif text-xl sm:text-2xl font-bold text-orange-50 mt-1 capitalize">
                  {leftDesc ? leftDesc.title : 'Select item below'}
                </p>
                {leftDesc && (
                  <span className="text-xs text-violet-300 capitalize">{leftDesc.sub}</span>
                )}
              </div>
              {leftSlot && (
                <button
                  type="button"
                  onClick={() => setLeftSlot(null)}
                  className="mt-2 flex items-center gap-1 text-xs text-rose-300 hover:text-rose-100 self-start"
                >
                  <X className="h-3 w-3" /> Clear slot
                </button>
              )}
            </div>

            {/* Swap Button */}
            <button
              type="button"
              onClick={handleSwap}
              title="Swap Slot Positions"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-800 text-violet-100 hover:bg-violet-700 transition self-center shadow-md active:scale-95"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>

            {/* Slot 2 */}
            <div
              className={`flex min-h-[110px] flex-1 flex-col justify-between rounded-xl border-2 p-4 transition-all ${
                rightSlot
                  ? 'border-violet-400 bg-violet-900/60 shadow-lg'
                  : 'border-dashed border-violet-700/80 bg-violet-950/40'
              }`}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-300">
                  Slot 2 · Head / Base / Creature
                </span>
                <p className="font-serif text-xl sm:text-2xl font-bold text-orange-50 mt-1 capitalize">
                  {rightDesc ? rightDesc.title : 'Select item below'}
                </p>
                {rightDesc && (
                  <span className="text-xs text-violet-300 capitalize">{rightDesc.sub}</span>
                )}
              </div>
              {rightSlot && (
                <button
                  type="button"
                  onClick={() => setRightSlot(null)}
                  className="mt-2 flex items-center gap-1 text-xs text-rose-300 hover:text-rose-100 self-start"
                >
                  <X className="h-3 w-3" /> Clear slot
                </button>
              )}
            </div>
          </div>

          {/* Morphological Preview Panel */}
          <div className="mt-5 border-t border-violet-800/80 pt-4">
            {!leftSlot && !rightSlot ? (
              <div className="rounded-xl border border-violet-800/60 bg-violet-950/30 p-4 text-center text-xs sm:text-sm text-slate-400">
                Place two tokens in the forge slots to preview the English morphological fusion.
              </div>
            ) : !leftSlot || !rightSlot ? (
              <div className="rounded-xl border border-violet-800/60 bg-violet-950/30 p-4 text-center text-xs sm:text-sm text-violet-300">
                Select one more item to test the combination.
              </div>
            ) : !outcome || !outcome.ok ? (
              <div className="rounded-xl border-2 border-rose-500/70 bg-rose-950/40 p-4 text-slate-100">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                  <AlertTriangle className="h-4 w-4" /> Fusion Failed:
                </div>
                {outcome?.reasons.map((r, i) => (
                  <p key={i} className="mt-1 text-xs sm:text-sm text-rose-200">
                    {r}
                  </p>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-amber-400 bg-violet-950/90 p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    Linguistic Synthesis: {outcome.kind?.toUpperCase()}
                  </span>
                  <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 uppercase">
                    {(outcome.result as any).element} {(outcome.result as any).element === 'fire' ? '🔥' : '❄️'}
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-orange-50 mt-1 capitalize">
                  {(outcome.result as any).word || (outcome.result as any).name}
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {outcome.lesson}
                </p>

                <div className="mt-3 text-xs text-violet-300 italic">
                  Definition: "{(outcome.result as any).definition || (outcome.result as any).description}"
                </div>

                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    id="commit-forge"
                    onClick={handleCommitForge}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 font-bold text-violet-950 hover:from-amber-400 hover:to-orange-400 transition shadow-lg active:scale-95"
                  >
                    <Flame className="h-4 w-4" /> Forge It!
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Inventory Catalogs */}
        <section className="rounded-2xl border border-violet-900 bg-violet-950/30 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-violet-800/60 pb-3">
            {/* Bin Switcher */}
            <div className="flex gap-1.5">
              {(['words', 'affixes', 'creatures'] as const).map((bin) => (
                <button
                  key={bin}
                  type="button"
                  data-bin={bin}
                  onClick={() => {
                    setActiveBin(bin);
                    juice.ding(600, 60);
                  }}
                  className={`rounded-lg px-4 py-1.5 text-xs sm:text-sm font-semibold capitalize tracking-wide transition ${
                    activeBin === bin
                      ? 'bg-violet-600 text-violet-50 shadow'
                      : 'bg-violet-950 text-violet-300 hover:bg-violet-900'
                  }`}
                >
                  {bin}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${activeBin}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-violet-800 bg-violet-950/80 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex flex-wrap gap-2.5">
            {activeBin === 'words' &&
              filteredWords.map((w) => {
                const isFire = w.element === 'fire';
                return (
                  <button
                    key={w.id}
                    type="button"
                    data-token-kind="word"
                    data-token-id={w.id}
                    onClick={() => handleSelectToken({ kind: 'word', id: w.id })}
                    className={`rounded-xl border-2 bg-violet-950 px-3.5 py-2 text-left transition hover:bg-violet-900 ${
                      isFire ? 'border-orange-500/70 text-orange-200' : 'border-sky-500/70 text-sky-200'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-slate-100">{w.word}</span>
                    <span className="text-[11px] uppercase tracking-wider text-violet-300">
                      {w.partOfSpeech} · {w.element}
                    </span>
                    {w.forge && (
                      <span className="block text-[10px] text-amber-300">✦ Forged</span>
                    )}
                  </button>
                );
              })}

            {activeBin === 'affixes' &&
              filteredAffixes.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  data-token-kind="affix"
                  data-token-id={a.id}
                  onClick={() => handleSelectToken({ kind: 'affix', id: a.id })}
                  className="rounded-xl border-2 border-violet-500/70 bg-violet-950 px-3.5 py-2 text-left text-slate-100 transition hover:bg-violet-900"
                >
                  <span className="block text-sm font-semibold text-amber-200">
                    {a.type === 'prefix' ? `${a.text}-` : `-${a.text}`}
                  </span>
                  <span className="text-[11px] text-violet-300 uppercase">
                    {a.type} · {a.gloss}
                  </span>
                </button>
              ))}

            {activeBin === 'creatures' &&
              filteredCreatures.map((c) => {
                const isFire = c.element === 'fire';
                return (
                  <button
                    key={c.id}
                    type="button"
                    data-token-kind="creature"
                    data-token-id={c.id}
                    onClick={() => handleSelectToken({ kind: 'creature', id: c.id })}
                    className={`rounded-xl border-2 bg-violet-950 px-3.5 py-2 text-left transition hover:bg-violet-900 ${
                      isFire ? 'border-orange-500/70 text-orange-200' : 'border-sky-500/70 text-sky-200'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-slate-100">{c.name}</span>
                    <span className="text-[11px] uppercase tracking-wider text-violet-300">
                      {c.element} · HP {c.stats.hp}
                    </span>
                    {c.forged && (
                      <span className="block text-[10px] text-amber-300">✦ Hybrid Pet</span>
                    )}
                  </button>
                );
              })}
          </div>
        </section>
      </div>
    </main>
  );
};
