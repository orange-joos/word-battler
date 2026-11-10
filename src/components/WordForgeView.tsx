import React, { useState } from 'react';
import {
  Hammer,
  Sparkles,
  Volume2,
  RotateCcw,
  Swords,
  Map,
  Flame,
  BookOpen,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { INITIAL_AFFIXES } from '../data/initialData';
import { ELEMENTS } from '../data/elements';
import { forgeCombine, FORGE_BLUEPRINTS, ForgeBlueprint, getAllWordsList } from '../engine/forge';
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
  const [drawerTab, setDrawerTab] = useState<'affixes' | 'words' | 'creatures' | 'blueprints'>(
    'blueprints'
  );
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

  const handleLoadBlueprint = (bp: ForgeBlueprint) => {
    juice.ding(780, 120);
    setSlot1(bp.token1);
    setSlot2(bp.token2);
  };

  const preview =
    slot1 && slot2
      ? forgeCombine(slot1, slot2, {
          words,
          affixes: INITIAL_AFFIXES,
          creatures: nonBossCreatures,
        })
      : null;

  // Improvement #7: Compute Live Step-by-Step Spelling Transformation Breakdown
  const getSpellingTransformationSteps = () => {
    if (!slot1 || !slot2 || !preview || !preview.ok || !preview.result) return null;
    if (!('word' in preview.result)) return null;

    const finalWord = preview.result.word;
    const w1 = slot1.kind === 'word' ? allWords.find((x) => x.id === slot1.id) : null;
    const w2 = slot2.kind === 'word' ? allWords.find((x) => x.id === slot2.id) : null;
    const a1 = slot1.kind === 'affix' ? INITIAL_AFFIXES.find((x) => x.id === slot1.id) : null;
    const a2 = slot2.kind === 'affix' ? INITIAL_AFFIXES.find((x) => x.id === slot2.id) : null;

    const baseWord = w1 || w2;
    const affix = a1 || a2;

    if (baseWord && affix) {
      if (affix.respell.includes('yToI') && /[^aeiou]y$/i.test(baseWord.word)) {
        const stem = baseWord.word.slice(0, -1);
        return {
          ruleBadge: 'Y → I Suffix Shift Rule',
          step1: `${baseWord.word} + -${affix.text}`,
          step2: `${stem}[y → i] + ${affix.text}`,
          step3: finalWord,
        };
      }
      if (affix.respell.includes('dropSilentE') && baseWord.word.endsWith('e')) {
        const stem = baseWord.word.slice(0, -1);
        return {
          ruleBadge: 'Drop Silent-E Rule',
          step1: `${baseWord.word} + -${affix.text}`,
          step2: `${stem}[drop -e] + ${affix.text}`,
          step3: finalWord,
        };
      }
      return {
        ruleBadge:
          affix.type === 'prefix' ? 'Clean Prefix Attachment' : 'Clean Suffix Attachment',
        step1:
          affix.type === 'prefix'
            ? `${affix.text}- + ${baseWord.word}`
            : `${baseWord.word} + -${affix.text}`,
        step2:
          affix.type === 'prefix'
            ? `[${affix.text}][${baseWord.word}]`
            : `[${baseWord.word}][${affix.text}]`,
        step3: finalWord,
      };
    }

    if (w1 && w2) {
      return {
        ruleBadge: 'Compound Word Fusion',
        step1: `${w1.word} (${w1.partOfSpeech})`,
        step2: `+ ${w2.word} (Head ${w2.partOfSpeech})`,
        step3: finalWord,
      };
    }

    return null;
  };

  const spellingSteps = getSpellingTransformationSteps();

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
          `Chiseled Word Tablet "${w.word}" (${w.partOfSpeech.toUpperCase()}) & Equipped! (+25 XP)`
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
        badge: a.type === 'prefix' ? 'Prefix Tablet' : 'Suffix Tablet',
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
    <div className="h-full w-full overflow-y-auto bg-[#1e140c] p-2 sm:p-4 select-none">
      <div className="mx-auto max-w-[1280px] space-y-3.5 pb-8">
        {/* ====================================================================
            TOP CEL-SHADED FOSSIL SPLICER & WORD FORGE BANNER (Improvement #5)
        ==================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border-[4px] border-[#1a162b] bg-gradient-to-r from-[#7c2d12] via-[#b45309] to-[#7c2d12] px-5 py-3 text-white shadow-[0_6px_0_#1a162b]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTab('hub')}
              className="flex items-center gap-1.5 rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-b from-[#fde047] to-[#f59e0b] px-3.5 py-2 text-xs font-display font-black uppercase tracking-wider text-[#1a162b] shadow-[0_3px_0_#1a162b] hover:brightness-105 cursor-pointer"
            >
              <Map className="h-4 w-4" />
              <span>Sanctuary Map</span>
            </button>
            <div>
              <h2 className="font-display text-lg sm:text-2xl font-black text-[#fef08a] drop-shadow-[0_2px_0_#1a162b] flex items-center gap-2">
                <Hammer className="h-5 w-5 text-[#fde047]" />
                <span>4. Word Forge — Stone Tablet Chisel &amp; Hybrid Splicer</span>
              </h2>
              <p className="text-xs font-bold text-amber-100">
                Combine Prefixes, Suffixes, K–8 Word Tablets, or Companion Cores using real morphology rules!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const randomBp =
                  FORGE_BLUEPRINTS[Math.floor(Math.random() * FORGE_BLUEPRINTS.length)];
                handleLoadBlueprint(randomBp);
              }}
              className="flex items-center gap-1.5 rounded-xl border-2 border-[#1a162b] bg-[#fde047] hover:bg-amber-300 px-3.5 py-2 text-xs font-display font-black text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
              title="Accessibility #11: Automatically load a valid morphology recipe onto the Anvil"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>✨ Pick a Recipe for Me</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSlot1(null);
                setSlot2(null);
                setJustForgedBanner(null);
              }}
              className="flex items-center gap-1.5 rounded-xl border-2 border-[#fde047] bg-[#1a162b] hover:bg-slate-800 px-3.5 py-2 text-xs font-display font-black text-[#fde047] cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Anvil</span>
            </button>
          </div>
        </div>

        {justForgedBanner && (
          <div className="flex items-center justify-between rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-r from-[#fde047] via-[#facc15] to-[#f59e0b] px-4 py-2.5 text-[#1a162b] font-display font-black text-sm shadow-[0_4px_0_#1a162b]">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {justForgedBanner}
            </span>
            <button
              type="button"
              onClick={() => setTab('battle')}
              className="rounded-xl border-2 border-[#1a162b] bg-[#1a162b] px-3.5 py-1 text-xs font-black uppercase text-[#fde047] cursor-pointer"
            >
              Test in Battle →
            </button>
          </div>
        )}

        {/* MAIN 12-COLUMN FORGE WORKSHOP */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT 5 COLS: 4-TAB TABLET & BLUEPRINT DRAWER (Includes Improvement #6) */}
          <div className="lg:col-span-5 rounded-3xl border-[4px] border-[#1a162b] bg-[#fff8e7] p-4 shadow-[0_7px_0_#1a162b] space-y-3">
            {/* 4 Drawer Category Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-2xl bg-[#e6d0a7] p-1.5 border-2 border-[#1a162b]">
              <button
                type="button"
                onClick={() => setDrawerTab('blueprints')}
                className={`rounded-xl py-2 text-[11px] font-display font-black uppercase transition cursor-pointer ${
                  drawerTab === 'blueprints'
                    ? 'bg-[#1a162b] text-[#fde047] shadow'
                    : 'text-[#1a162b] hover:bg-amber-100'
                }`}
              >
                📜 Blueprints
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('affixes')}
                className={`rounded-xl py-2 text-[11px] font-display font-black uppercase transition cursor-pointer ${
                  drawerTab === 'affixes'
                    ? 'bg-[#1a162b] text-[#fde047] shadow'
                    : 'text-[#1a162b] hover:bg-amber-100'
                }`}
              >
                1. Affixes ({INITIAL_AFFIXES.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('words')}
                className={`rounded-xl py-2 text-[11px] font-display font-black uppercase transition cursor-pointer ${
                  drawerTab === 'words'
                    ? 'bg-[#1a162b] text-[#fde047] shadow'
                    : 'text-[#1a162b] hover:bg-amber-100'
                }`}
              >
                2. Tablets ({allWords.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('creatures')}
                className={`rounded-xl py-2 text-[11px] font-display font-black uppercase transition cursor-pointer ${
                  drawerTab === 'creatures'
                    ? 'bg-[#1a162b] text-[#fde047] shadow'
                    : 'text-[#1a162b] hover:bg-amber-100'
                }`}
              >
                3. Pets ({nonBossCreatures.length})
              </button>
            </div>

            {/* IMPROVEMENT #6: RECIPE DISCOVERY BOOK ("FORGE BLUEPRINTS") */}
            {drawerTab === 'blueprints' && (
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                <div className="rounded-xl bg-amber-100 border-2 border-[#1a162b] p-2.5 text-xs font-bold text-[#451a03] flex items-center gap-2">
                  <Compass className="h-4 w-4 shrink-0 text-[#b45309]" />
                  <span>
                    Click any <strong>Forge Blueprint</strong> below to load both tablets directly onto the Anvil!
                  </span>
                </div>
                {FORGE_BLUEPRINTS.map((bp) => (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => handleLoadBlueprint(bp)}
                    className="w-full rounded-2xl border-[3px] border-[#1a162b] bg-white hover:bg-[#fef3c7] p-3 text-left shadow-[0_4px_0_#1a162b] transition-transform hover:-translate-y-0.5 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-[#1a162b] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-[#fde047]">
                        {bp.category}
                      </span>
                      <span className="text-[10px] font-black text-emerald-700">
                        Click to Load →
                      </span>
                    </div>
                    <div className="font-display text-sm sm:text-base font-black text-[#1a162b]">
                      {bp.title}
                    </div>
                    <p className="text-[11px] font-semibold text-[#5d4037]">{bp.ruleNote}</p>
                  </button>
                ))}
              </div>
            )}

            {/* TAB 1: PREFIXES & SUFFIXES */}
            {drawerTab === 'affixes' && (
              <div className="space-y-2 max-h-[470px] overflow-y-auto pr-1">
                <p className="text-xs font-bold text-[#5d4037]">
                  Select a <strong>Prefix</strong> (Slot 1) or <strong>Suffix</strong> (Slot 2) to chisel onto a Word Tablet:
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
                        className={`flex flex-col justify-between rounded-2xl border-[3px] p-3 text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-[#1a162b] bg-[#fde047] shadow-[0_4px_0_#1a162b]'
                            : 'border-[#1a162b] bg-white hover:bg-amber-50 shadow-[0_3px_0_#1a162b]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase border border-[#1a162b] ${
                              affix.type === 'prefix'
                                ? 'bg-purple-200 text-purple-950'
                                : 'bg-teal-200 text-teal-950'
                            }`}
                          >
                            {affix.type}
                          </span>
                          <span className="text-[10px] font-bold text-stone-600">
                            {affix.from.join('/')} → {affix.to}
                          </span>
                        </div>
                        <div className="font-display text-xl font-black text-[#1a162b] my-1">
                          {affix.type === 'prefix' ? `${affix.text}-` : `-${affix.text}`}
                        </div>
                        <p className="text-xs font-bold text-[#5d4037]">
                          Meaning: “{affix.gloss}”
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: K-8 WORD TABLETS */}
            {drawerTab === 'words' && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setGradeFilter('all')}
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase cursor-pointer ${
                      gradeFilter === 'all'
                        ? 'bg-[#1a162b] text-[#fde047]'
                        : 'bg-[#e6d0a7] text-[#1a162b]'
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
                          ? 'bg-[#1a162b] text-[#fde047] border-[#1a162b]'
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
                    const slot1Affix =
                      slot1?.kind === 'affix'
                        ? INITIAL_AFFIXES.find((a) => a.id === slot1.id)
                        : null;
                    const isCompatibleWithSlot1 = slot1Affix
                      ? slot1Affix.from.includes(w.partOfSpeech)
                      : true;

                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => handleSelectToken({ kind: 'word', id: w.id })}
                        className={`flex flex-col justify-between rounded-xl border-2 p-2.5 text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-[#1a162b] bg-[#fde047] shadow-[0_3px_0_#1a162b]'
                            : !isCompatibleWithSlot1
                            ? 'border-stone-300 bg-stone-100 opacity-50'
                            : slot1Affix && isCompatibleWithSlot1
                            ? 'border-emerald-600 bg-emerald-50 hover:bg-emerald-100 ring-2 ring-emerald-400'
                            : 'border-[#1a162b] bg-white hover:bg-amber-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase text-stone-600">
                            {w.partOfSpeech}
                          </span>
                          <span
                            className={`rounded px-1 text-[8px] font-black ${tierMeta.badgeBg} ${tierMeta.badgeText}`}
                          >
                            {tierMeta.shortLabel}
                          </span>
                        </div>
                        <div className="font-display text-base font-black text-[#1a162b] my-0.5">
                          {w.word}
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-stone-700">
                          <span>
                            {ELEMENTS[w.element]?.icon} {w.element}
                          </span>
                          <span className="font-mono font-black text-emerald-700">
                            {slot1Affix && isCompatibleWithSlot1
                              ? '✓ Fits Slot 1'
                              : `+${w.powerBonus ?? tierMeta.powerBonus}`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: COMPANION CORES */}
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
                      className={`flex items-center gap-2.5 rounded-2xl border-[3px] p-2.5 text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-[#1a162b] bg-[#fde047] shadow-[0_3px_0_#1a162b]'
                          : 'border-[#1a162b] bg-white hover:bg-amber-50'
                      }`}
                    >
                      <CreatureSprite
                        creatureId={c.forged?.sourceId || c.id}
                        stage={c.stage || 1}
                        element={c.element}
                        size="sm"
                      />
                      <div>
                        <span className="font-display text-sm font-black text-[#1a162b] block">
                          {c.name}
                        </span>
                        <span className="text-[10px] font-bold text-[#5d4037]">
                          {ELEMENTS[c.element]?.icon} {c.element.toUpperCase()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT 7 COLS: STONE TABLET CHISEL ANVIL & LIVE SPELLING ANIMATION */}
          <div className="lg:col-span-7 space-y-4">
            {/* THE ANVIL & CRUCIBLE STAGE */}
            <div className="relative overflow-hidden rounded-3xl border-[4px] border-[#1a162b] bg-gradient-to-b from-[#3d1a0a] via-[#261005] to-[#170902] p-5 text-white shadow-[0_7px_0_#1a162b] space-y-4">
              <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-44 w-96 rounded-full bg-orange-500/25 blur-3xl" />

              <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 rounded-xl border-2 border-[#fde047] bg-[#7c2d12] px-3 py-1 text-xs font-display font-black uppercase text-[#fde047]">
                  <Flame className="h-4 w-4 text-orange-300" />
                  Stone Tablet Chisel Anvil
                </span>
                <span className="text-xs font-bold text-amber-200">
                  Click any Blueprint on the left or pick 2 Tablets to splice!
                </span>
              </div>

              {/* 2 TABLET SLOTS ABOVE THE ANVIL */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-11 items-center gap-3">
                {/* SLOT 1 */}
                <div
                  onClick={() => setSlot1(null)}
                  className={`sm:col-span-5 flex flex-col items-center justify-center rounded-2xl border-[3px] p-4 min-h-[115px] text-center transition cursor-pointer ${
                    slot1Info
                      ? 'border-[#fde047] bg-amber-950/80 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                      : 'border-dashed border-amber-600/70 bg-black/40 hover:border-amber-400'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#fde047]">
                    Slot 1 · Prefix / Modifier
                  </span>
                  {slot1Info ? (
                    <>
                      <span className="font-display text-2xl font-black text-white my-1">
                        {slot1Info.title}
                      </span>
                      <span className="text-[11px] font-bold text-amber-200">
                        {slot1Info.subtitle}
                      </span>
                    </>
                  ) : (
                    <span className="mt-2 text-xs font-bold text-amber-200/60">
                      Select Slot 1 Tablet
                    </span>
                  )}
                </div>

                {/* PLUS / CHISEL ICON */}
                <div className="sm:col-span-1 flex items-center justify-center">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#1a162b] bg-[#fde047] font-black text-xl text-[#1a162b] shadow-lg transition-transform ${
                      isStriking ? 'scale-150 rotate-45 bg-emerald-400' : ''
                    }`}
                  >
                    +
                  </div>
                </div>

                {/* SLOT 2 */}
                <div
                  onClick={() => setSlot2(null)}
                  className={`sm:col-span-5 flex flex-col items-center justify-center rounded-2xl border-[3px] p-4 min-h-[115px] text-center transition cursor-pointer ${
                    slot2Info
                      ? 'border-[#fde047] bg-amber-950/80 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                      : 'border-dashed border-amber-600/70 bg-black/40 hover:border-amber-400'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#fde047]">
                    Slot 2 · Root Head / Suffix
                  </span>
                  {slot2Info ? (
                    <>
                      <span className="font-display text-2xl font-black text-white my-1">
                        {slot2Info.title}
                      </span>
                      <span className="text-[11px] font-bold text-amber-200">
                        {slot2Info.subtitle}
                      </span>
                    </>
                  ) : (
                    <span className="mt-2 text-xs font-bold text-amber-200/60">
                      Select Slot 2 Tablet
                    </span>
                  )}
                </div>
              </div>

              {/* IMPROVEMENT #7: LIVE STEP-BY-STEP SPELLING TRANSFORMATION ANIMATION */}
              {spellingSteps && (
                <div className="relative z-10 rounded-2xl border-2 border-[#fde047] bg-[#1a162b]/90 p-3 text-center space-y-2">
                  <span className="inline-block rounded-full bg-[#fde047] px-3 py-0.5 font-mono text-[10px] font-black uppercase text-[#1a162b]">
                    🔬 Live Spelling Transformation: {spellingSteps.ruleBadge}
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs sm:text-sm font-black">
                    <span className="rounded-xl bg-slate-800 border border-slate-600 px-3 py-1.5 text-amber-200">
                      {spellingSteps.step1}
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#fde047]" />
                    <span className="rounded-xl bg-amber-500/20 border-2 border-[#fde047] px-3 py-1.5 text-[#fde047] animate-pulse">
                      {spellingSteps.step2}
                    </span>
                    <ArrowRight className="h-4 w-4 text-emerald-400" />
                    <span className="rounded-xl bg-emerald-600 border-2 border-white px-3.5 py-1.5 text-white">
                      {spellingSteps.step3}
                    </span>
                  </div>
                </div>
              )}

              {/* RESULT PREVIEW & STRIKE BUTTON */}
              <div className="relative z-10 rounded-2xl border-2 border-amber-500/40 bg-black/50 p-4 text-center space-y-3">
                {preview ? (
                  preview.ok && preview.result ? (
                    <div className="space-y-2">
                      <span className="rounded-lg bg-emerald-500/20 border border-emerald-400 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-300">
                        ✨ Valid {preview.kind} Blueprint!
                      </span>
                      <div className="font-display text-3xl font-black text-[#fde047]">
                        {'word' in preview.result ? preview.result.word : preview.result.name}
                      </div>
                      <p className="text-xs font-bold text-amber-100 max-w-lg mx-auto">
                        {preview.lesson || preview.reasons[0]}
                      </p>
                      <button
                        type="button"
                        onClick={handleStrikeAnvil}
                        className="mt-2 inline-flex items-center gap-2 rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-b from-[#4ade80] to-[#16a34a] px-8 py-3 font-display text-sm sm:text-base font-black uppercase tracking-wider text-[#1a162b] shadow-[0_5px_0_#1a162b] hover:brightness-110 active:translate-y-1 transition cursor-pointer"
                      >
                        <Hammer className="h-5 w-5" />
                        <span>Chisel Word Tablet &amp; Equip!</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 py-2">
                      <span className="text-xs font-black uppercase text-rose-400">
                        ⚠️ Incompatible Morphemes
                      </span>
                      <p className="text-xs font-bold text-amber-100/90">
                        {preview.reasons[0] ||
                          'Try pairing a Prefix + Base Word, Base Word + Suffix, or click a Blueprint on the left!'}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="py-2 text-xs font-bold text-amber-200/70">
                    Place two tablets on the anvil above (or click a Blueprint on the left) to preview the spelling transformation!
                  </div>
                )}
              </div>
            </div>

            {/* MORPHOLOGY SCHOLAR'S RULEBOOK & RECENTLY FORGED TABLETS */}
            <div className="rounded-3xl border-[4px] border-[#1a162b] bg-[#fff8e7] p-4 shadow-[0_6px_0_#1a162b] space-y-3">
              <div className="flex items-center gap-2 border-b-2 border-[#e5cca8] pb-2">
                <BookOpen className="h-4 w-4 text-[#6e3818]" />
                <h3 className="font-display text-sm font-black uppercase tracking-wider text-[#1a162b]">
                  Morphology Spelling Rules &amp; Newly Chiseled Word Tablets
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl border-2 border-[#1a162b] bg-amber-50 p-2.5">
                  <span className="font-display font-black text-[#1a162b] block">
                    1. Prefix Rule
                  </span>
                  <p className="text-[11px] font-semibold text-stone-700 mt-0.5">
                    Prefixes attach to the front (<strong>un- + frozen = unfrozen</strong>,{' '}
                    <strong>re- + ignite = reignite</strong>) without changing the root spelling!
                  </p>
                </div>
                <div className="rounded-xl border-2 border-[#1a162b] bg-sky-50 p-2.5">
                  <span className="font-display font-black text-sky-950 block">
                    2. Suffix Shift Rule
                  </span>
                  <p className="text-[11px] font-semibold text-stone-700 mt-0.5">
                    Adding <strong>-ness</strong> or <strong>-ly</strong> changes final{' '}
                    <strong>y → i</strong> (<em>chilly + -ness = chilliness</em>), and{' '}
                    <strong>-ling</strong> drops silent <strong>e</strong>!
                  </p>
                </div>
                <div className="rounded-xl border-2 border-[#1a162b] bg-emerald-50 p-2.5">
                  <span className="font-display font-black text-emerald-950 block">
                    3. Compound Head Rule
                  </span>
                  <p className="text-[11px] font-semibold text-stone-700 mt-0.5">
                    In English compounds, the <strong>second word (Head)</strong> sets the part of
                    speech and core element!
                  </p>
                </div>
              </div>

              {/* Feature #11: Shades-of-Meaning Thermometer ("Intensity Scale" Mini-Game) */}
              <div className="rounded-2xl border-2 border-[#1a162b] bg-gradient-to-r from-[#fef3c7] via-[#fde68a] to-[#fca5a5] p-3.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="rounded-full bg-[#1a162b] px-2.5 py-0.5 font-display text-[10px] font-black uppercase text-[#fde047]">
                      🌡️ Feature #11 · Shades-of-Meaning Intensity Thermometer
                    </span>
                    <div className="font-display text-sm font-black text-[#1a162b] mt-1">
                      Tap Along the Intensity Scale to Temper Word Tablet Power (+3 → +8 Pwr)
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { deg: '1. Mild (+3 Pwr)', word: 'Chilly', elem: 'ice' as const, pwr: 3 },
                    { deg: '2. Moderate (+5 Pwr)', word: 'Cold', elem: 'ice' as const, pwr: 5 },
                    { deg: '3. Strong (+6 Pwr)', word: 'Freezing', elem: 'ice' as const, pwr: 6 },
                    { deg: '4. Apex (+8 Pwr!)', word: 'Glacial', elem: 'ice' as const, pwr: 8 },
                  ].map((step, idx) => (
                    <button
                      key={step.word}
                      type="button"
                      onClick={() => {
                        juice.ding(600 + idx * 110, 120);
                        juice.speakWord(`${step.word}. Intensity level ${idx + 1}.`);
                        if (idx === 3) {
                          const tempered: Word = {
                            id: 'tempered_glacial',
                            word: 'Glacial',
                            definition: 'Extremely freezing, like an ancient glacier (Apex Intensity).',
                            example: 'The glacial wind swept across Frostpeak.',
                            partOfSpeech: 'adjective',
                            element: 'ice',
                            gradeTier: '5',
                            powerBonus: 8,
                          };
                          commitWord(tempered);
                          setJustForgedBanner(
                            '🌡️ Tempered Apex Intensity Tablet: "Glacial" (+8 Power Bonus)!'
                          );
                          juice.fanfare();
                        }
                      }}
                      className="rounded-xl border-2 border-[#1a162b] bg-white/90 hover:bg-[#fde047] p-2 text-left transition cursor-pointer shadow-[0_2px_0_#1a162b]"
                    >
                      <div className="font-mono text-[9px] font-black uppercase text-rose-700">
                        {step.deg}
                      </div>
                      <div className="font-display text-sm font-black text-[#1a162b]">
                        {step.word}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {(forgedWordIds.length > 0 || forgedCreatureIds.length > 0) && (
                <div className="pt-1 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                    ✨ Chiseled in This Session:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {forgedWordIds.map((id) => {
                      const w = allWords.find((x) => x.id === id);
                      if (!w) return null;
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-2 rounded-xl border-2 border-[#1a162b] bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-950"
                        >
                          <span>{w.word}</span>
                          <span className="rounded bg-emerald-300 px-1.5 py-0.5 font-mono text-[10px]">
                            +{w.powerBonus ?? w.forge?.powerBonus ?? 4} Pwr
                          </span>
                          <button
                            type="button"
                            onClick={() => juice.speakWord(w.word)}
                            className="text-emerald-800 hover:text-emerald-950 cursor-pointer"
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
                          className="flex items-center gap-2 rounded-xl border-2 border-[#1a162b] bg-[#fde047] px-3 py-1.5 text-xs font-black text-[#1a162b] cursor-pointer"
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
export default WordForgeView;
