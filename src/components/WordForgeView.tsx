import React, { useState } from 'react';
import {
  Hammer,
  Sparkles,
  Volume2,
  RotateCcw,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { INITIAL_AFFIXES } from '../data/initialData';
import { ELEMENTS } from '../data/elements';
import { forgeCombine, FORGE_BLUEPRINTS, ForgeBlueprint, getAllWordsList } from '../engine/forge';
import { ForgeToken, Word, Creature } from '../types';
import { juice } from '../engine/juice';
import { CreatureSprite } from './CreatureSprite';
import { getPartOfSpeechMeta } from '../data/vocabDatabase';

export const WordForgeView: React.FC = () => {
  const {
    creatures,
    words,
    commitWord,
    commitCreature,
    setTab,
    updatePetLoadout,
    playerId,
  } = useGame();
  const { addRewards } = useAuth();

  const [slot1, setSlot1] = useState<ForgeToken | null>(null);
  const [slot2, setSlot2] = useState<ForgeToken | null>(null);
  const [drawerTab, setDrawerTab] = useState<'affixes' | 'words' | 'creatures'>('affixes');
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
    } else if (token.kind === 'creature') {
      const c = nonBossCreatures.find((x) => x.id === token.id);
      if (c) juice.speakWord(c.name);
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

  const handleMerge = () => {
    if (!preview || !preview.ok || !preview.result) return;
    setIsStriking(true);
    juice.hit();
    setTimeout(() => juice.fanfare(), 220);

    setTimeout(() => {
      setIsStriking(false);
      if (preview.kind === 'creature-fusion') {
        const c = preview.result as Creature;
        commitCreature(c);
        setJustForgedBanner(`🎉 Merged New Hybrid Buddy: ${c.name}! (+25 XP)`);
        juice.speakWord(c.name);
      } else {
        const w = preview.result as Word;
        commitWord(w);
        updatePetLoadout(playerId, w.partOfSpeech, w.id);
        setJustForgedBanner(
          `🎉 Merged New Word Card "${w.word}" & Equipped! (+25 XP)`
        );
        juice.speakWord(w.word);
      }
      addRewards({ xp: 25, coins: 20, forgedItem: true });
      setSlot1(null);
      setSlot2(null);
    }, 420);
  };

  const renderSlotVisual = (token: ForgeToken | null) => {
    if (!token) return null;
    if (token.kind === 'affix') {
      const a = INITIAL_AFFIXES.find((x) => x.id === token.id);
      if (!a) return null;
      return {
        kind: 'affix' as const,
        title: a.type === 'prefix' ? `${a.text}-` : `-${a.text}`,
        subtitle: `Means “${a.gloss}”`,
        pill: a.type === 'prefix' ? '🧩 Prefix' : '🧩 Suffix',
      };
    }
    if (token.kind === 'word') {
      const w = allWords.find((x) => x.id === token.id);
      if (!w) return null;
      const el = ELEMENTS[w.element] || ELEMENTS.fire;
      return {
        kind: 'word' as const,
        title: w.word,
        subtitle: `${el.icon} ${el.name} · ${w.partOfSpeech.toUpperCase()}`,
        pill: '🔤 Word Card',
      };
    }
    const c = nonBossCreatures.find((x) => x.id === token.id);
    if (!c) return null;
    const el = ELEMENTS[c.element] || ELEMENTS.fire;
    return {
      kind: 'creature' as const,
      title: c.name,
      subtitle: `${el.icon} ${el.name} Buddy`,
      pill: '🐾 Buddy',
      creature: c,
    };
  };

  const slot1Info = renderSlotVisual(slot1);
  const slot2Info = renderSlotVisual(slot2);

  return (
    <div className="h-full w-full overflow-y-auto bg-gradient-to-b from-[#fed7aa] via-[#fef3c7] to-[#fde68a] p-2 sm:p-4 select-none">
      <div className="mx-auto max-w-[1260px] space-y-4 pb-8">
        {/* TOP HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border-[4px] border-[#1a162b] bg-gradient-to-r from-[#ea580c] via-[#d97706] to-[#b45309] px-5 py-3 text-white shadow-[0_6px_0_#1a162b]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTab('hub')}
              className="flex items-center gap-1.5 rounded-full border-[3px] border-[#1a162b] bg-[#fde047] hover:bg-white px-4 py-1.5 text-xs sm:text-sm font-display font-black uppercase text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
            >
              <span>◀ Back to Map</span>
            </button>
            <div>
              <h2 className="font-display text-lg sm:text-2xl font-black text-[#fef08a] drop-shadow-[0_2px_0_#1a162b] flex items-center gap-2">
                <Hammer className="h-5 w-5 text-[#fde047]" />
                <span>Word Forge — Slot A + Slot B → Merge!</span>
              </h2>
              <p className="text-xs font-bold text-amber-100">
                Pick 2 cards below to merge into a super word or hybrid buddy!
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
              className="flex items-center gap-1.5 rounded-2xl border-[3px] border-[#1a162b] bg-[#fde047] hover:bg-white px-4 py-2 text-xs font-display font-black uppercase text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>✨ Surprise Combo!</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSlot1(null);
                setSlot2(null);
                setJustForgedBanner(null);
              }}
              className="flex items-center gap-1.5 rounded-2xl border-[3px] border-[#1a162b] bg-white hover:bg-amber-100 px-3.5 py-2 text-xs font-display font-black uppercase text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {justForgedBanner && (
          <div className="flex items-center justify-between rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-r from-[#4ade80] to-[#22c55e] px-4 py-2.5 text-[#1a162b] font-display font-black text-sm shadow-[0_4px_0_#1a162b]">
            <span>{justForgedBanner}</span>
            <button
              type="button"
              onClick={() => setTab('battle')}
              className="rounded-xl border-2 border-[#1a162b] bg-[#1a162b] px-3.5 py-1 text-xs font-black uppercase text-[#fde047] cursor-pointer"
            >
              Try in Battle →
            </button>
          </div>
        )}

        {/* ====================================================================
            TOP MERGE STAGE: SLOT A + SLOT B -> MERGE!
           ==================================================================== */}
        <div className="rounded-3xl border-[4px] border-[#1a162b] bg-gradient-to-b from-[#3d1a0a] via-[#261005] to-[#170902] p-5 text-white shadow-[0_7px_0_#1a162b]">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-4">
            {/* SLOT A */}
            <div
              onClick={() => setSlot1(null)}
              className={`lg:col-span-3 flex flex-col items-center justify-center rounded-3xl border-[3px] p-4 min-h-[160px] text-center transition cursor-pointer ${
                slot1Info
                  ? 'border-[#fde047] bg-[#fff8e7] text-[#1a162b] shadow-[0_5px_0_#1a162b]'
                  : 'border-dashed border-amber-400/70 bg-black/40 hover:border-amber-300'
              }`}
            >
              <span className="rounded-full bg-[#1a162b] px-3 py-0.5 text-[11px] font-display font-black uppercase text-[#fde047]">
                Slot A
              </span>
              {slot1Info ? (
                <>
                  {slot1Info.creature && (
                    <div className="my-1">
                      <CreatureSprite
                        creatureId={slot1Info.creature.forged?.sourceId || slot1Info.creature.id}
                        stage={slot1Info.creature.stage || 1}
                        element={slot1Info.creature.element}
                        size="sm"
                      />
                    </div>
                  )}
                  <span className="font-display text-2xl sm:text-3xl font-black text-[#1a162b] my-1">
                    {slot1Info.title}
                  </span>
                  <span className="text-xs font-bold text-[#5d4037]">
                    {slot1Info.subtitle}
                  </span>
                  <span className="mt-1 text-[10px] font-black text-rose-600">
                    Tap to remove
                  </span>
                </>
              ) : (
                <span className="mt-3 font-display text-sm font-black text-amber-200">
                  1. Tap a Card Below
                </span>
              )}
            </div>

            {/* PLUS */}
            <div className="lg:col-span-1 flex items-center justify-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#1a162b] bg-[#fde047] font-black text-2xl text-[#1a162b] shadow-lg transition-transform ${
                  isStriking ? 'scale-150 rotate-45 bg-emerald-400' : ''
                }`}
              >
                +
              </div>
            </div>

            {/* SLOT B */}
            <div
              onClick={() => setSlot2(null)}
              className={`lg:col-span-3 flex flex-col items-center justify-center rounded-3xl border-[3px] p-4 min-h-[160px] text-center transition cursor-pointer ${
                slot2Info
                  ? 'border-[#fde047] bg-[#fff8e7] text-[#1a162b] shadow-[0_5px_0_#1a162b]'
                  : 'border-dashed border-amber-400/70 bg-black/40 hover:border-amber-300'
              }`}
            >
              <span className="rounded-full bg-[#1a162b] px-3 py-0.5 text-[11px] font-display font-black uppercase text-[#fde047]">
                Slot B
              </span>
              {slot2Info ? (
                <>
                  {slot2Info.creature && (
                    <div className="my-1">
                      <CreatureSprite
                        creatureId={slot2Info.creature.forged?.sourceId || slot2Info.creature.id}
                        stage={slot2Info.creature.stage || 1}
                        element={slot2Info.creature.element}
                        size="sm"
                      />
                    </div>
                  )}
                  <span className="font-display text-2xl sm:text-3xl font-black text-[#1a162b] my-1">
                    {slot2Info.title}
                  </span>
                  <span className="text-xs font-bold text-[#5d4037]">
                    {slot2Info.subtitle}
                  </span>
                  <span className="mt-1 text-[10px] font-black text-rose-600">
                    Tap to remove
                  </span>
                </>
              ) : (
                <span className="mt-3 font-display text-sm font-black text-amber-200">
                  2. Tap a Second Card
                </span>
              )}
            </div>

            {/* ARROW */}
            <div className="lg:col-span-1 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#1a162b] bg-emerald-400 font-black text-2xl text-[#1a162b] shadow-lg">
                →
              </div>
            </div>

            {/* MERGE RESULT & BIG MERGE! BUTTON */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center rounded-3xl border-[3px] border-[#fde047] bg-black/55 p-4 min-h-[160px] text-center">
              {preview ? (
                preview.ok && preview.result ? (
                  <div className="space-y-2 w-full">
                    {preview.kind === 'creature-fusion' && 'stats' in preview.result && (
                      <div className="flex justify-center">
                        <CreatureSprite
                          creatureId={preview.result.forged?.sourceId || preview.result.id}
                          stage={preview.result.stage || 2}
                          element={preview.result.element}
                          secondaryElement={preview.result.infusionElement || preview.result.allowedElements?.[1]}
                          isPrismatic
                          mood="happy"
                          size="md"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-display text-2xl sm:text-3xl font-black text-[#fde047]">
                        {'word' in preview.result ? preview.result.word : preview.result.name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          juice.speakWord(
                            'word' in preview.result!
                              ? `${preview.result.word}. ${preview.result.definition}`
                              : preview.result!.name
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#1a162b] bg-[#fde047] text-[#1a162b] cursor-pointer"
                        title="Hear Result"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs font-bold text-amber-100 leading-snug px-1">
                      {'word' in preview.result ? preview.result.definition : preview.result.description}
                    </p>
                    <button
                      type="button"
                      onClick={handleMerge}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-b from-[#4ade80] to-[#16a34a] px-6 py-3 font-display text-base sm:text-lg font-black uppercase tracking-wider text-[#1a162b] shadow-[0_5px_0_#1a162b] hover:brightness-110 active:translate-y-1 transition cursor-pointer"
                    >
                      <Hammer className="h-5 w-5" />
                      <span>⚡ MERGE!</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    <span className="font-display text-sm font-black uppercase text-amber-300">
                      🤔 Try a Different Pair!
                    </span>
                    <p className="text-xs font-bold text-amber-100/90">
                      {preview.reasons?.[0] || 'Pair a Word Part + Word, two Words, or two Buddies!'}
                    </p>
                  </div>
                )
              ) : (
                <div className="space-y-1 py-2">
                  <span className="font-display text-base font-black text-[#fde047]">
                    Ready to Merge!
                  </span>
                  <p className="text-xs font-bold text-amber-200/80">
                    Fill Slot A and Slot B or tap a Popular Combo below!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ====================================================================
            BOTTOM FRIENDLY CARD PICKER (3 Big Tabs: Word Parts, Words, Buddies)
           ==================================================================== */}
        <div className="rounded-3xl border-[4px] border-[#1a162b] bg-[#fff8e7] p-4 sm:p-5 shadow-[0_7px_0_#1a162b] space-y-4">
          {/* 1-Tap Popular Real-Word Combos Bar */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-[#1a162b] bg-amber-100/80 px-3 py-2">
            <span className="text-[11px] font-display font-black uppercase text-[#1a162b]">
              ✨ 1-Tap Real-Word Recipes:
            </span>
            {FORGE_BLUEPRINTS.map((bp) => (
              <button
                key={bp.id}
                type="button"
                onClick={() => handleLoadBlueprint(bp)}
                className="rounded-xl border-2 border-[#1a162b] bg-white hover:bg-[#fde047] px-2.5 py-1 text-xs font-display font-black text-[#1a162b] shadow-[0_2px_0_#1a162b] transition cursor-pointer"
                title={bp.ruleNote}
              >
                {bp.title}
              </button>
            ))}
          </div>

          {/* 3 Big Category Tabs */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#e6d0a7] p-1.5 border-2 border-[#1a162b]">
            <button
              type="button"
              onClick={() => setDrawerTab('affixes')}
              className={`rounded-xl py-2.5 text-xs sm:text-sm font-display font-black uppercase transition cursor-pointer ${
                drawerTab === 'affixes'
                  ? 'bg-[#1a162b] text-[#fde047] shadow'
                  : 'text-[#1a162b] hover:bg-amber-100'
              }`}
            >
              🧩 1. Word Parts ({INITIAL_AFFIXES.length})
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab('words')}
              className={`rounded-xl py-2.5 text-xs sm:text-sm font-display font-black uppercase transition cursor-pointer ${
                drawerTab === 'words'
                  ? 'bg-[#1a162b] text-[#fde047] shadow'
                  : 'text-[#1a162b] hover:bg-amber-100'
              }`}
            >
              🔤 2. Words ({allWords.length})
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab('creatures')}
              className={`rounded-xl py-2.5 text-xs sm:text-sm font-display font-black uppercase transition cursor-pointer ${
                drawerTab === 'creatures'
                  ? 'bg-[#1a162b] text-[#fde047] shadow'
                  : 'text-[#1a162b] hover:bg-amber-100'
              }`}
            >
              🐾 3. Buddies ({nonBossCreatures.length})
            </button>
          </div>

          {/* TAB 1: WORD PARTS (PREFIXES & SUFFIXES) */}
          {drawerTab === 'affixes' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {INITIAL_AFFIXES.map((affix) => {
                const isSelected =
                  (slot1?.kind === 'affix' && slot1.id === affix.id) ||
                  (slot2?.kind === 'affix' && slot2.id === affix.id);
                return (
                  <button
                    key={affix.id}
                    type="button"
                    onClick={() => handleSelectToken({ kind: 'affix', id: affix.id })}
                    className={`flex flex-col items-center justify-between rounded-2xl border-[3px] p-4 text-center transition cursor-pointer ${
                      isSelected
                        ? 'border-[#1a162b] bg-[#fde047] shadow-[0_4px_0_#1a162b] -translate-y-1'
                        : 'border-[#1a162b] bg-white hover:bg-amber-50 shadow-[0_3px_0_#1a162b]'
                    }`}
                  >
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase border border-[#1a162b] ${
                        affix.type === 'prefix'
                          ? 'bg-purple-200 text-purple-950'
                          : 'bg-teal-200 text-teal-950'
                      }`}
                    >
                      {affix.type === 'prefix' ? 'Start (Prefix)' : 'End (Suffix)'}
                    </span>
                    <div className="font-display text-2xl sm:text-3xl font-black text-[#1a162b] my-2">
                      {affix.type === 'prefix' ? `${affix.text}-` : `-${affix.text}`}
                    </div>
                    <p className="text-xs font-bold text-[#5d4037]">
                      “{affix.gloss}”
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 2: WORDS */}
          {drawerTab === 'words' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {allWords.map((w) => {
                const isSelected =
                  (slot1?.kind === 'word' && slot1.id === w.id) ||
                  (slot2?.kind === 'word' && slot2.id === w.id);
                const posMeta = getPartOfSpeechMeta(w.partOfSpeech);
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
                    className={`flex flex-col items-center justify-between rounded-2xl border-[3px] p-3 text-center transition cursor-pointer ${
                      isSelected
                        ? 'border-[#1a162b] bg-[#fde047] shadow-[0_4px_0_#1a162b] -translate-y-1'
                        : !isCompatibleWithSlot1
                        ? 'border-stone-300 bg-stone-100 opacity-45'
                        : slot1Affix && isCompatibleWithSlot1
                        ? 'border-emerald-600 bg-emerald-50 hover:bg-emerald-100 ring-2 ring-emerald-400'
                        : 'border-[#1a162b] bg-white hover:bg-amber-50 shadow-[0_3px_0_#1a162b]'
                    }`}
                  >
                    <span
                      className={`rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase ${posMeta.pillBg} ${posMeta.pillText} ${posMeta.cardBorder}`}
                    >
                      {posMeta.icon} {posMeta.label}
                    </span>
                    <div className="font-display text-lg sm:text-xl font-black text-[#1a162b] my-1.5">
                      {w.word}
                    </div>
                    <div className="text-xs font-bold text-stone-700">
                      {slot1Affix && isCompatibleWithSlot1 ? (
                        <span className="text-emerald-700 font-black">✓ Matches Slot A!</span>
                      ) : (
                        <span>
                          {ELEMENTS[w.element]?.icon} {ELEMENTS[w.element]?.name}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 3: BUDDIES */}
          {drawerTab === 'creatures' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
              {nonBossCreatures.map((c) => {
                const isSelected =
                  (slot1?.kind === 'creature' && slot1.id === c.id) ||
                  (slot2?.kind === 'creature' && slot2.id === c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectToken({ kind: 'creature', id: c.id })}
                    className={`flex flex-col items-center justify-between rounded-2xl border-[3px] p-3.5 text-center transition cursor-pointer ${
                      isSelected
                        ? 'border-[#1a162b] bg-[#fde047] shadow-[0_4px_0_#1a162b] -translate-y-1'
                        : 'border-[#1a162b] bg-white hover:bg-amber-50 shadow-[0_3px_0_#1a162b]'
                    }`}
                  >
                    <CreatureSprite
                      creatureId={c.forged?.sourceId || c.id}
                      stage={c.stage || 1}
                      element={c.element}
                      size="sm"
                    />
                    <span className="font-display text-base font-black text-[#1a162b] mt-2">
                      {c.name}
                    </span>
                    <span className="text-xs font-bold text-[#5d4037]">
                      {ELEMENTS[c.element]?.icon} {ELEMENTS[c.element]?.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default WordForgeView;
