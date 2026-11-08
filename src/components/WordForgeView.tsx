import React, { useState } from 'react';
import {
  Hammer,
  Sparkles,
  Volume2,
  RotateCcw,
  Swords,
  Check,
  Map,
  Flame,
  BookOpen,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { INITIAL_AFFIXES } from '../data/initialData';
import { ELEMENTS } from '../data/elements';
import { forgeCombine, getAllWordsList } from '../engine/forge';
import { ForgeToken, Word, Creature, GradeTier } from '../types';
import { juice } from '../engine/juice';
import { CreatureSprite } from './CreatureSprite';
import { GRADE_TIERS, getGradeTierMeta } from '../data/vocabDatabase';

export const WordForgeView: React.FC = () => {
  const {
    creatures,
    words,
    commitWord,
    commitCreature,
    useCreatureInBattle,
    setTab,
    updatePetLoadout,
    playerId,
  } = useGame();
  const { addRewards } = useAuth();

  const [slot1, setSlot1] = useState<ForgeToken | null>(null);
  const [slot2, setSlot2] = useState<ForgeToken | null>(null);
  const [drawerTab, setDrawerTab] = useState<'affixes' | 'words' | 'creatures'>('affixes');
  const [gradeFilter, setGradeFilter] = useState<GradeTier | 'all'>('all');
  const [forgedWordIds, setForgedWordIds] = useState<string[]>([]);
  const [forgedCreatureIds, setForgedCreatureIds] = useState<string[]>([]);
  const [isStriking, setIsStriking] = useState(false);
  const [justForgedBanner, setJustForgedBanner] = useState<string | null>(null);

  const allWords = getAllWordsList(words);
  const nonBossCreatures = creatures.filter((c) => !c.id.startsWith('boss_'));

  const handleSelectToken = (token: ForgeToken) => {
    juice.click();
    if (token.kind === 'word') {
      const w = allWords.find((x) => x.id === token.id);
      if (w) juice.speakWord(w.word);
    } else if (token.kind === 'affix') {
      const a = INITIAL_AFFIXES.find((x) => x.id === token.id);
      if (a) juice.speakWord(a.text);
    }

    if (slot1 && slot1.kind === token.kind && slot1.id === token.id) {
      setSlot1(null);
      return;
    }
    if (slot2 && slot2.kind === token.kind && slot2.id === token.id) {
      setSlot2(null);
      return;
    }

    if (!slot1) {
      setSlot1(token);
      if (token.kind === 'affix') setDrawerTab('words');
    } else if (!slot2) {
      setSlot2(token);
    } else {
      setSlot1(token);
      setSlot2(null);
    }
  };

  const preview =
    slot1 && slot2
      ? forgeCombine(slot1, slot2, {
          words,
          affixes: INITIAL_AFFIXES,
          creatures: nonBossCreatures,
        })
      : null;

  const handleStrikeAnvil = () => {
    if (!preview || !preview.ok || !preview.result) return;
    setIsStriking(true);
    juice.hit();
    setTimeout(() => juice.fanfare(), 220);

    setTimeout(() => {
      setIsStriking(false);
      if (preview.kind === 'creature-fusion') {
        const c = preview.result as Creature;
        commitCreature(c);
        setForgedCreatureIds((prev) => (prev.includes(c.id) ? prev : [c.id, ...prev]));
        setJustForgedBanner(`Forged Hybrid Companion: ${c.name}! (+25 XP)`);
        juice.speakWord(c.name);
      } else {
        const w = preview.result as Word;
        commitWord(w);
        updatePetLoadout(playerId, w.partOfSpeech, w.id);
        setForgedWordIds((prev) => (prev.includes(w.id) ? prev : [w.id, ...prev]));
        setJustForgedBanner(
          `Forged "${w.word}" (${w.partOfSpeech.toUpperCase()}) & Auto-Equipped! (+25 XP)`
        );
        juice.speakWord(w.word);
      }
      addRewards({ xp: 25, coins: 20, forgedItem: true });
      setSlot1(null);
      setSlot2(null);
    }, 450);
  };

  const renderTokenLabel = (token: ForgeToken | null) => {
    if (!token) return null;
    if (token.kind === 'affix') {
      const a = INITIAL_AFFIXES.find((x) => x.id === token.id);
      if (!a) return null;
      return {
        title: a.type === 'prefix' ? `${a.text}-` : `-${a.text}`,
        subtitle: `${a.type.toUpperCase()} · "${a.gloss}"`,
        badge: a.type === 'prefix' ? 'Prefix Rune' : 'Suffix Rune',
      };
    }
    if (token.kind === 'word') {
      const w = allWords.find((x) => x.id === token.id);
      if (!w) return null;
      return {
        title: w.word,
        subtitle: `${w.partOfSpeech.toUpperCase()} · ${w.element.toUpperCase()}`,
        badge: `Grade ${w.gradeTier || '3'}`,
      };
    }
    const c = nonBossCreatures.find((x) => x.id === token.id);
    if (!c) return null;
    return {
      title: c.name,
      subtitle: `${c.element.toUpperCase()} Companion`,
      badge: 'Beast Core',
    };
  };

  const slot1Info = renderTokenLabel(slot1);
  const slot2Info = renderTokenLabel(slot2);

  const filteredWords = allWords.filter((w) =>
    gradeFilter === 'all' ? true : (w.gradeTier || '3') === gradeFilter
  );

  return (
    <div className="h-full w-full overflow-y-auto bg-[#231208] p-2 sm:p-4 select-none">
      <div className="mx-auto max-w-[1240px] space-y-3 pb-8">
        {/* TOP WOODEN STORYBOOK HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-4 border-[#5a2e12] bg-gradient-to-r from-[#5a2410] via-[#7c2d12] to-[#5a2410] px-4 py-2.5 text-white shadow-[0_4px_0_#2a1006]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTab('hub')}
              className="flex items-center gap-1.5 rounded-xl border-2 border-[#ffce7a] bg-gradient-to-b from-[#fcd34d] to-[#f59e0b] px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#451a03] shadow-[0_3px_0_#92400e] hover:brightness-105 cursor-pointer"
            >
              <Map className="h-4 w-4" />
              <span>World Map</span>
            </button>
            <div>
              <h2 className="font-serif text-base sm:text-xl font-black text-[#fff3d1] flex items-center gap-2">
                <Hammer className="h-5 w-5 text-amber-400" />
                <span>Fireforge Anvil &amp; Morphology Crucible</span>
              </h2>
              <p className="text-[11px] font-bold text-amber-200/85">
                Fuse Prefixes, Suffixes, and K–8 Root Words on the blacksmith anvil to craft high-power vocabulary!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSlot1(null);
              setSlot2(null);
              setJustForgedBanner(null);
            }}
            className="flex items-center gap-1.5 rounded-xl border-2 border-amber-400/50 bg-black/30 hover:bg-black/50 px-3 py-1.5 text-xs font-black text-amber-200 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear Anvil</span>
          </button>
        </div>

        {justForgedBanner && (
          <div className="flex items-center justify-between rounded-2xl border-3 border-amber-400 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-4 py-2.5 text-slate-950 font-black text-sm shadow-lg">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {justForgedBanner}
            </span>
            <button
              type="button"
              onClick={() => setTab('battle')}
              className="rounded-xl bg-slate-950 px-3 py-1 text-xs font-black uppercase text-amber-300 cursor-pointer"
            >
              Test in Battle →
            </button>
          </div>
        )}

        {/* 3-COLUMN BLACKSMITH WORKSHOP */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          {/* LEFT 5 COLS: RUNE DRAWERS (Affixes, K-8 Base Words, Creatures) */}
          <div className="lg:col-span-5 rounded-3xl border-4 border-[#5a2e12] bg-[#fffaf2] p-4 shadow-[0_6px_0_#381b09] space-y-3">
            {/* Drawer Category Tabs */}
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-[#e5cca8] p-1">
              <button
                type="button"
                onClick={() => setDrawerTab('affixes')}
                className={`rounded-xl py-2 text-xs font-black uppercase transition cursor-pointer ${
                  drawerTab === 'affixes'
                    ? 'bg-[#5a2e12] text-amber-200 shadow'
                    : 'text-[#5a2e12] hover:bg-amber-100/60'
                }`}
              >
                1. Affix Runes ({INITIAL_AFFIXES.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('words')}
                className={`rounded-xl py-2 text-xs font-black uppercase transition cursor-pointer ${
                  drawerTab === 'words'
                    ? 'bg-[#5a2e12] text-amber-200 shadow'
                    : 'text-[#5a2e12] hover:bg-amber-100/60'
                }`}
              >
                2. K–8 Words ({allWords.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('creatures')}
                className={`rounded-xl py-2 text-xs font-black uppercase transition cursor-pointer ${
                  drawerTab === 'creatures'
                    ? 'bg-[#5a2e12] text-amber-200 shadow'
                    : 'text-[#5a2e12] hover:bg-amber-100/60'
                }`}
              >
                3. Beast Cores ({nonBossCreatures.length})
              </button>
            </div>

            {/* TAB 1: PREFIXES & SUFFIXES */}
            {drawerTab === 'affixes' && (
              <div className="space-y-2 max-h-[470px] overflow-y-auto pr-1">
                <p className="text-xs font-bold text-[#7c4a27]">
                  Select a <strong>Prefix</strong> (placed in Slot 1) or <strong>Suffix</strong> (placed in Slot 2) to transform a base word:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INITIAL_AFFIXES.map((affix) => {
                    const isSelected =
                      (slot1?.kind === 'affix' && slot1.id === affix.id) ||
                      (slot2?.kind === 'affix' && slot2.id === affix.id);
                    return (
                      <button
                        key={affix.id}
                        type="button"
                        onClick={() => handleSelectToken({ kind: 'affix', id: affix.id })}
                        className={`flex flex-col justify-between rounded-2xl border-2 p-3 text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-amber-600 bg-amber-100 ring-2 ring-amber-400'
                            : 'border-[#d6bfa3] bg-white hover:border-amber-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                              affix.type === 'prefix'
                                ? 'bg-purple-100 text-purple-900'
                                : 'bg-teal-100 text-teal-900'
                            }`}
                          >
                            {affix.type}
                          </span>
                          <span className="text-[10px] font-bold text-stone-500">
                            {affix.from.join('/')} → {affix.to}
                          </span>
                        </div>
                        <div className="font-serif text-xl font-black text-[#2a170b] my-1">
                          {affix.type === 'prefix' ? `${affix.text}-` : `-${affix.text}`}
                        </div>
                        <p className="text-xs font-bold text-[#6e3818]">
                          Meaning: “{affix.gloss}”
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: K-8 BASE WORDS */}
            {drawerTab === 'words' && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setGradeFilter('all')}
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase cursor-pointer ${
                      gradeFilter === 'all'
                        ? 'bg-[#5a2e12] text-white'
                        : 'bg-[#f7ebd9] text-[#5a2e12]'
                    }`}
                  >
                    All
                  </button>
                  {GRADE_TIERS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setGradeFilter(t.id)}
                      className={`rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase cursor-pointer ${
                        gradeFilter === t.id
                          ? 'bg-[#5a2e12] text-white border-[#5a2e12]'
                          : `${t.badgeBg} ${t.badgeText} ${t.badgeBorder}`
                      }`}
                    >
                      {t.shortLabel}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-[410px] overflow-y-auto pr-1">
                  {filteredWords.map((w) => {
                    const isSelected =
                      (slot1?.kind === 'word' && slot1.id === w.id) ||
                      (slot2?.kind === 'word' && slot2.id === w.id);
                    const tierMeta = getGradeTierMeta(w.gradeTier);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => handleSelectToken({ kind: 'word', id: w.id })}
                        className={`flex flex-col justify-between rounded-xl border-2 p-2.5 text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-amber-600 bg-amber-100 ring-2 ring-amber-400'
                            : 'border-[#d6bfa3] bg-white hover:border-amber-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase text-stone-500">
                            {w.partOfSpeech}
                          </span>
                          <span
                            className={`rounded px-1 text-[8px] font-black ${tierMeta.badgeBg} ${tierMeta.badgeText}`}
                          >
                            {tierMeta.shortLabel}
                          </span>
                        </div>
                        <div className="font-serif text-base font-black text-[#2a170b] my-0.5">
                          {w.word}
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-stone-600">
                          <span>
                            {ELEMENTS[w.element]?.icon} {w.element}
                          </span>
                          <span className="font-mono font-black text-emerald-700">
                            +{w.powerBonus ?? tierMeta.powerBonus}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: CREATURE FUSION CORES */}
            {drawerTab === 'creatures' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                {nonBossCreatures.map((c) => {
                  const isSelected =
                    (slot1?.kind === 'creature' && slot1.id === c.id) ||
                    (slot2?.kind === 'creature' && slot2.id === c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectToken({ kind: 'creature', id: c.id })}
                      className={`flex items-center gap-2.5 rounded-2xl border-2 p-2.5 text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-amber-600 bg-amber-100 ring-2 ring-amber-400'
                          : 'border-[#d6bfa3] bg-white hover:border-amber-500'
                      }`}
                    >
                      <CreatureSprite
                        creatureId={c.id}
                        stage={c.stage || 1}
                        element={c.element}
                        size="sm"
                      />
                      <div>
                        <span className="font-serif text-sm font-black text-[#2a170b] block">
                          {c.name}
                        </span>
                        <span className="text-[10px] font-bold text-[#7c4a27]">
                          {ELEMENTS[c.element]?.icon} {c.element.toUpperCase()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* CENTER 7 COLS: VISUAL BLACKSMITH ANVIL & MORPHOLOGY RULE SCROLL */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* THE ANVIL & CRUCIBLE STAGE */}
            <div className="relative overflow-hidden rounded-3xl border-4 border-[#5a2e12] bg-gradient-to-b from-[#3d1a0a] via-[#261005] to-[#170902] p-5 text-white shadow-[0_6px_0_#1a0903] space-y-4">
              {/* Glowing Forge Hearth Background */}
              <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-44 w-96 rounded-full bg-orange-500/25 blur-3xl" />

              <div className="relative z-10 flex items-center justify-between">
                <span className="flex items-center gap-1.5 rounded-xl border border-orange-400/50 bg-orange-950/70 px-3 py-1 text-xs font-black uppercase text-orange-300">
                  <Flame className="h-4 w-4 text-orange-400" />
                  Blacksmith Crucible
                </span>
                <span className="text-xs font-bold text-amber-200/80">
                  Try: [un- + frozen], [flame + -less], [bright + -ness], or [Emberfox + Rimepup]
                </span>
              </div>

              {/* 2 RUNE SLOTS ABOVE THE ANVIL */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-11 items-center gap-3">
                {/* SLOT 1 */}
                <div
                  onClick={() => setSlot1(null)}
                  className={`sm:col-span-5 flex flex-col items-center justify-center rounded-2xl border-3 p-4 min-h-[115px] text-center transition cursor-pointer ${
                    slot1Info
                      ? 'border-amber-400 bg-amber-950/70 shadow-[0_0_20px_rgba(251,191,36,0.25)]'
                      : 'border-dashed border-amber-700/70 bg-black/40 hover:border-amber-500'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Slot 1 · Modifier / Prefix
                  </span>
                  {slot1Info ? (
                    <>
                      <span className="font-serif text-2xl font-black text-white my-1">
                        {slot1Info.title}
                      </span>
                      <span className="text-[11px] font-bold text-amber-200">
                        {slot1Info.subtitle}
                      </span>
                    </>
                  ) : (
                    <span className="mt-2 text-xs font-bold text-amber-200/50">
                      Click an Affix, Word, or Pet on the left
                    </span>
                  )}
                </div>

                {/* PLUS / HAMMER ICON */}
                <div className="sm:col-span-1 flex items-center justify-center">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-400 bg-orange-600 font-black text-xl shadow-lg transition-transform ${
                      isStriking ? 'scale-150 rotate-45 bg-yellow-300 text-slate-950' : ''
                    }`}
                  >
                    +
                  </div>
                </div>

                {/* SLOT 2 */}
                <div
                  onClick={() => setSlot2(null)}
                  className={`sm:col-span-5 flex flex-col items-center justify-center rounded-2xl border-3 p-4 min-h-[115px] text-center transition cursor-pointer ${
                    slot2Info
                      ? 'border-amber-400 bg-amber-950/70 shadow-[0_0_20px_rgba(251,191,36,0.25)]'
                      : 'border-dashed border-amber-700/70 bg-black/40 hover:border-amber-500'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Slot 2 · Root Head / Suffix
                  </span>
                  {slot2Info ? (
                    <>
                      <span className="font-serif text-2xl font-black text-white my-1">
                        {slot2Info.title}
                      </span>
                      <span className="text-[11px] font-bold text-amber-200">
                        {slot2Info.subtitle}
                      </span>
                    </>
                  ) : (
                    <span className="mt-2 text-xs font-bold text-amber-200/50">
                      Click a second Rune to combine
                    </span>
                  )}
                </div>
              </div>

              {/* SVG BLACKSMITH ANVIL & RESULT PREVIEW */}
              <div className="relative z-10 rounded-2xl border-2 border-amber-500/40 bg-black/50 p-4 text-center space-y-3">
                {preview ? (
                  preview.ok && preview.result ? (
                    <div className="space-y-2">
                      <span className="rounded-lg bg-emerald-500/20 border border-emerald-400 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-300">
                        ✨ Valid {preview.kind} Recipe!
                      </span>
                      <div className="font-serif text-3xl font-black text-amber-300">
                        {'word' in preview.result ? preview.result.word : preview.result.name}
                      </div>
                      <p className="text-xs font-bold text-amber-100 max-w-lg mx-auto">
                        {preview.lesson || preview.reasons[0]}
                      </p>
                      <button
                        type="button"
                        onClick={handleStrikeAnvil}
                        className="mt-2 inline-flex items-center gap-2 rounded-2xl border-3 border-amber-200 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 px-8 py-3 text-sm sm:text-base font-black uppercase tracking-wider text-slate-950 shadow-[0_5px_0_#9a3412] hover:brightness-110 active:translate-y-1 transition cursor-pointer"
                      >
                        <Hammer className="h-5 w-5" />
                        <span>Strike Anvil &amp; Forge!</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 py-2">
                      <span className="text-xs font-black uppercase text-rose-400">
                        ⚠️ Incompatible Morphemes
                      </span>
                      <p className="text-xs font-bold text-amber-100/90">
                        {preview.reasons[0] ||
                          'Try pairing a Prefix + Base Word, Base Word + Suffix, or two Words/Pets!'}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="py-2 text-xs font-bold text-amber-200/70">
                    Place two runes on the anvil above to preview the morphological transformation and spelling rule!
                  </div>
                )}
              </div>
            </div>

            {/* MORPHOLOGY SCHOLAR'S RULEBOOK & RECENTLY FORGED ITEMS */}
            <div className="rounded-3xl border-4 border-[#5a2e12] bg-[#fffaf2] p-4 shadow-[0_6px_0_#381b09] space-y-3">
              <div className="flex items-center gap-2 border-b border-[#e5cca8] pb-2">
                <BookOpen className="h-4 w-4 text-[#6e3818]" />
                <h3 className="font-serif text-sm font-black uppercase tracking-wider text-[#3d1e0d]">
                  Morphology Spelling Rules &amp; Newly Forged Grimoire
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-2.5">
                  <span className="font-black text-[#5a2e12] block">1. Prefix Rule</span>
                  <p className="text-[11px] text-stone-700 mt-0.5">
                    Prefixes attach to the front (<strong>un- + frozen = unfrozen</strong>, <strong>re- + ignite = reignite</strong>) without changing the root spelling!
                  </p>
                </div>
                <div className="rounded-xl border border-sky-300 bg-sky-50 p-2.5">
                  <span className="font-black text-sky-950 block">2. Suffix Shift Rule</span>
                  <p className="text-[11px] text-stone-700 mt-0.5">
                    Adding <strong>-ness</strong> or <strong>-ly</strong> changes final <strong>y → i</strong> (<em>chilly + -ness = chilliness</em>), and <strong>-ling</strong> drops silent <strong>e</strong>!
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-2.5">
                  <span className="font-black text-emerald-950 block">3. Compound Head Rule</span>
                  <p className="text-[11px] text-stone-700 mt-0.5">
                    In English compounds, the <strong>second word (Head)</strong> sets the part of speech and core element!
                  </p>
                </div>
              </div>

              {(forgedWordIds.length > 0 || forgedCreatureIds.length > 0) && (
                <div className="pt-1 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                    ✨ Forged in This Session:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {forgedWordIds.map((id) => {
                      const w = allWords.find((x) => x.id === id);
                      if (!w) return null;
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-2 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-950"
                        >
                          <span>{w.word}</span>
                          <span className="rounded bg-emerald-200 px-1.5 py-0.5 font-mono text-[10px]">
                            +{w.powerBonus ?? w.forge?.powerBonus ?? 4} Pwr
                          </span>
                          <button
                            type="button"
                            onClick={() => juice.speakWord(w.word)}
                            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                    {forgedCreatureIds.map((id) => {
                      const c = creatures.find((x) => x.id === id);
                      if (!c) return null;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => useCreatureInBattle(c.id)}
                          className="flex items-center gap-2 rounded-xl border-2 border-amber-500 bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-950 cursor-pointer"
                        >
                          <Swords className="h-3.5 w-3.5" />
                          <span>Battle with {c.name}!</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
