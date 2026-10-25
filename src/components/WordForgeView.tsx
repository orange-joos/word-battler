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
import { PageHeading } from './PageHeading';

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
    <main className="min-h-[calc(100vh-65px)] bg-gradient-to-b from-sky-50 via-amber-50 to-pink-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <PageHeading
          eyebrow="Layer 2 · Word relationships & morphology"
          title="The Word Forge"
          description="Combine affixes, words, and creatures according to English morphology to create new words and hybrid battle pets."
        />

        {/* Success Notice Banner */}
        {notice && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border-2 border-emerald-600/80 bg-emerald-50/50 p-4 shadow-xl">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-900">✦ Forged Successfully!</p>
                <p className="text-xs text-emerald-800/90">{notice.text}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notice.kind === 'creature' ? (
                <button
                  type="button"
                  onClick={() => useCreatureInBattle(notice.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow"
                >
                  <Swords className="h-4 w-4" /> Battle with {notice.id}!
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToBattle}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 transition shadow"
                >
                  <Swords className="h-4 w-4" /> Go to Battle
                </button>
              )}
            </div>
          </div>
        )}

        {/* Forge Slots Workbench */}
        <section className="rounded-2xl border-[3px] border-[#c88a4e] bg-gradient-to-b from-[#fff9e9] to-[#fffdf6] p-5 shadow-xl shadow-amber-900/15">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Slot 1 */}
            <div
              className={`flex min-h-[110px] flex-1 flex-col justify-between rounded-xl border-2 p-4 transition-all ${
                leftSlot
                  ? 'border-violet-400 bg-violet-100/60 shadow-lg'
                  : 'border-dashed border-violet-400/80 bg-violet-50/40'
              }`}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                  Slot 1 · Modifier / Prefix
                </span>
                <p className="font-serif text-xl sm:text-2xl font-bold text-orange-900 mt-1 capitalize">
                  {leftDesc ? leftDesc.title : 'Select item below'}
                </p>
                {leftDesc && (
                  <span className="text-xs text-violet-700 capitalize">{leftDesc.sub}</span>
                )}
              </div>
              {leftSlot && (
                <button
                  type="button"
                  onClick={() => setLeftSlot(null)}
                  className="mt-2 flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 self-start"
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
              className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-200 text-violet-900 hover:bg-violet-300 transition self-center shadow-md active:scale-95"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>

            {/* Slot 2 */}
            <div
              className={`flex min-h-[110px] flex-1 flex-col justify-between rounded-xl border-2 p-4 transition-all ${
                rightSlot
                  ? 'border-violet-400 bg-violet-100/60 shadow-lg'
                  : 'border-dashed border-violet-400/80 bg-violet-50/40'
              }`}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                  Slot 2 · Head / Base / Creature
                </span>
                <p className="font-serif text-xl sm:text-2xl font-bold text-orange-900 mt-1 capitalize">
                  {rightDesc ? rightDesc.title : 'Select item below'}
                </p>
                {rightDesc && (
                  <span className="text-xs text-violet-700 capitalize">{rightDesc.sub}</span>
                )}
              </div>
              {rightSlot && (
                <button
                  type="button"
                  onClick={() => setRightSlot(null)}
                  className="mt-2 flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 self-start"
                >
                  <X className="h-3 w-3" /> Clear slot
                </button>
              )}
            </div>
          </div>

          {/* Morphological Preview Panel */}
          <div className="mt-5 border-t border-violet-300/80 pt-4">
            {!leftSlot && !rightSlot ? (
              <div className="rounded-xl border border-violet-300/60 bg-violet-50/30 p-4 text-center text-xs sm:text-sm text-slate-600">
                Place two tokens in the forge slots to preview the English morphological fusion.
              </div>
            ) : !leftSlot || !rightSlot ? (
              <div className="rounded-xl border border-violet-300/60 bg-violet-50/30 p-4 text-center text-xs sm:text-sm text-violet-700">
                Select one more item to test the combination.
              </div>
            ) : !outcome || !outcome.ok ? (
              <div className="rounded-xl border-2 border-rose-600/70 bg-rose-50/40 p-4 text-slate-900">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  <AlertTriangle className="h-4 w-4" /> Fusion Failed:
                </div>
                {outcome?.reasons.map((r, i) => (
                  <p key={i} className="mt-1 text-xs sm:text-sm text-rose-800">
                    {r}
                  </p>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-amber-400 bg-violet-50/90 p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-700">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    Linguistic Synthesis: {outcome.kind?.toUpperCase()}
                  </span>
                  <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-semibold text-amber-700 uppercase">
                    {(outcome.result as any).element} {(outcome.result as any).element === 'fire' ? '🔥' : '❄️'}
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-orange-900 mt-1 capitalize">
                  {(outcome.result as any).word || (outcome.result as any).name}
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-slate-800 leading-relaxed">
                  {outcome.lesson}
                </p>

                <div className="mt-3 text-xs text-violet-700 italic">
                  Definition: "{(outcome.result as any).definition || (outcome.result as any).description}"
                </div>

                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    id="commit-forge"
                    onClick={handleCommitForge}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 font-bold text-violet-800 hover:from-amber-400 hover:to-orange-400 transition shadow-lg active:scale-95"
                  >
                    <Flame className="h-4 w-4" /> Forge It!
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Inventory Catalogs */}
        <section className="rounded-2xl border-2 border-amber-300/90 bg-gradient-to-b from-[#fffaf0] to-white p-5 shadow-md shadow-amber-900/10 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-violet-300/60 pb-3">
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
                      ? 'bg-violet-600 text-white shadow'
                      : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                  }`}
                >
                  {bin}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
              <input
                type="text"
                placeholder={`Search ${activeBin}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-violet-300 bg-violet-50/80 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
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
                    className={`rounded-xl border-2 bg-violet-50 px-3.5 py-2 text-left transition hover:bg-violet-100 ${
                      isFire ? 'border-orange-600/70 text-orange-800' : 'border-sky-600/70 text-sky-800'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-slate-900">{w.word}</span>
                    <span className="text-[11px] uppercase tracking-wider text-violet-700">
                      {w.partOfSpeech} · {w.element}
                    </span>
                    {w.forge && (
                      <span className="block text-[10px] text-amber-700">✦ Forged</span>
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
                  className="rounded-xl border-2 border-violet-600/70 bg-violet-50 px-3.5 py-2 text-left text-slate-900 transition hover:bg-violet-100"
                >
                  <span className="block text-sm font-semibold text-amber-800">
                    {a.type === 'prefix' ? `${a.text}-` : `-${a.text}`}
                  </span>
                  <span className="text-[11px] text-violet-700 uppercase">
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
                    className={`rounded-xl border-2 bg-violet-50 px-3.5 py-2 text-left transition hover:bg-violet-100 ${
                      isFire ? 'border-orange-600/70 text-orange-800' : 'border-sky-600/70 text-sky-800'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-slate-900">{c.name}</span>
                    <span className="text-[11px] uppercase tracking-wider text-violet-700">
                      {c.element} · HP {c.stats.hp}
                    </span>
                    {c.forged && (
                      <span className="block text-[10px] text-amber-700">✦ Hybrid Pet</span>
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
