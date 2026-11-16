import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { ELEMENTS } from '../../data/elements';
import { ELEMENTAL_ADVENTURE_BIOMES } from '../../data/adventureNodesData';
import { CreatureSprite } from '../CreatureSprite';
import { juice } from '../../engine/juice';
import type { Creature, ElementType, PartOfSpeech, Word } from '../../types';
import { benchmarkTrieLookup } from '../../engine/lexiconTrie';
import {
  ROGUELIKE_RELICS,
  STARTER_DECK_UNLOCK_TRACKS,
  PLATFORM_ACHIEVEMENTS,
  TUTORIAL_STEPS_3MIN,
  loadAtomicCombatSnapshot,
} from '../../engine/roguelikeLoop';

export type SecondaryModalType = 'quests' | 'museum' | 'profile' | 'settings';

interface HubSecondaryModalBodyProps {
  activeModal: SecondaryModalType;
  selectedPet: Creature;
  selectablePets: Creature[];
  allWords: Word[];
  clearedAreasCount: number;
  claimedQuestIds: string[];
  onClaimQuest: (questId: string, coins: number, tokens: number) => void;
  onCloseModal: () => void;
  onTriggerToast: (msg: string) => void;
}

export const HubSecondaryModalBody: React.FC<HubSecondaryModalBodyProps> = ({
  activeModal,
  selectedPet,
  selectablePets,
  allWords,
  clearedAreasCount,
  claimedQuestIds,
  onClaimQuest,
  onCloseModal,
  onTriggerToast,
}) => {
  const {
    words,
    nodeProgress,
    setTab,
    isMuted,
    toggleMute,
    preferredGradeBand,
    setPreferredGradeBand,
    commitWord,
    bountiesClaimed,
    claimBounty,
    ancientAmber,
    addAncientAmber,
    awakenedFossils,
    awakenPrehistoricCompanion,
    mistakeWords,
    masterMistakeWord,
    dyslexiaFriendly,
    setDyslexiaFriendly,
    calmAnimations,
    setCalmAnimations,
    sanctuaryTheme,
    setSanctuaryTheme,
    tutorInsight,
  } = useGame();
  const { currentUser, logout, setIsCustomizingAvatar, addRewards } = useAuth();

  const [museumBonusClaimed, setMuseumBonusClaimed] = useState(false);
  const [customSpellingWord, setCustomSpellingWord] = useState('');
  const [customSpellingDef, setCustomSpellingDef] = useState('');
  const [customSpellingPos, setCustomSpellingPos] = useState<PartOfSpeech>('adjective');
  const [customSpellingElem] = useState<ElementType>('fire');

  // #1 Trie Benchmark, #9 High-Contrast & UI Scale, #10 Interactive 3-Minute Tutorial
  const [trieBenchmarkResult, setTrieBenchmarkResult] = useState<{
    iterations: number;
    lexiconSize: number;
    elapsedMs: number;
    avgMicrosecondsPerLookup: number;
  } | null>(null);
  const [highContrastMode, setHighContrastMode] = useState<boolean>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('contrast-125')
  );
  const [uiScalePct, setUiScalePct] = useState<number>(100);
  const [tutorialStepIdx, setTutorialStepIdx] = useState<number>(0);
  const [tutorialSkipped, setTutorialSkipped] = useState<boolean>(false);
  const savedCombatSnapshot = loadAtomicCombatSnapshot();

  if (activeModal === 'quests') {
    return (
      <div className="space-y-3">
        {[
          {
            id: 'quest-1',
            title: 'Explore Word World & Clear an Elemental Area',
            coins: 120,
            tokens: 2,
            ready: clearedAreasCount >= 1,
          },
          {
            id: 'quest-2',
            title: 'Unlock 50+ K–8 Word Tablets in Your Lexicon Field Guide',
            coins: 150,
            tokens: 3,
            ready: allWords.length >= 50,
          },
          {
            id: 'quest-3',
            title: 'Train a Companion Pet to Level 9 or Higher',
            coins: 180,
            tokens: 3,
            ready: selectablePets.some((p) => (p.level || 8) >= 9),
          },
          {
            id: 'quest-4',
            title: 'Reach Level 10 Ready-to-Evolve Milestone',
            coins: 250,
            tokens: 5,
            ready: selectablePets.some((p) => (p.level || 8) >= 10),
          },
        ].map((q) => {
          const isClaimed = claimedQuestIds.includes(q.id);
          return (
            <div
              key={q.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white border-[3px] border-[#1a162b] shadow-[0_3px_0_#1a162b]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-black border-2 border-[#1a162b] ${
                    isClaimed
                      ? 'bg-[#4caf50] text-white'
                      : q.ready
                      ? 'bg-[#ffd54f] text-[#1a162b]'
                      : 'bg-[#e0e0e0] text-[#757575]'
                  }`}
                >
                  {isClaimed ? <Check className="w-4 h-4" /> : '★'}
                </div>
                <div>
                  <div className="font-bold text-sm text-[#1a162b]">{q.title}</div>
                  <div className="text-xs font-extrabold text-[#e65100]">
                    Reward: +{q.coins} 🪙 &amp; +{q.tokens} 💎
                  </div>
                </div>
              </div>

              {isClaimed ? (
                <span className="px-3 py-1.5 rounded-xl bg-[#e8f5e9] border-2 border-[#1a162b] font-black text-xs text-[#2e7d32]">
                  ✓ Claimed
                </span>
              ) : q.ready ? (
                <button
                  onClick={() => onClaimQuest(q.id, q.coins, q.tokens)}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-b from-[#ffd54f] to-[#ffb300] border-2 border-[#1a162b] font-display font-black text-xs text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer animate-pulse"
                >
                  Claim Reward!
                </button>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-stone-100 border-2 border-[#1a162b] font-bold text-xs text-stone-500">
                  In Progress
                </span>
              )}
            </div>
          );
        })}

        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#fef3c7] to-[#fde68a] border-[3px] border-[#1a162b] space-y-2.5 shadow-[0_4px_0_#1a162b]">
          <div className="font-display font-black text-sm uppercase text-[#1a162b]">
            📌 Feature #15 · Daily Expedition Bounty Board (+🦴 Ancient Amber)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'bounty-amber', label: 'Excavate 1 Fossil Dig Site', amber: 3, coins: 60 },
              { id: 'bounty-adverb', label: 'Weave a 4-Word Sentence', amber: 4, coins: 75 },
              { id: 'bounty-bond', label: 'Train or Bond with a Companion', amber: 3, coins: 55 },
            ].map((b) => {
              const done = Boolean(bountiesClaimed[b.id]);
              return (
                <div
                  key={b.id}
                  className="rounded-xl border-2 border-[#1a162b] bg-white p-2.5 flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="font-display font-black text-xs text-[#1a162b]">{b.label}</div>
                    <div className="text-[10px] font-bold text-amber-800">
                      +{b.coins} 🪙 · +{b.amber} 🦴 Amber
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={done}
                    onClick={() => {
                      claimBounty(b.id);
                      addAncientAmber(b.amber);
                      addRewards({ coins: b.coins, tokens: 1, xp: 30 });
                      onTriggerToast(`Claimed Bounty: +${b.coins} 🪙 & +${b.amber} 🦴 Amber!`);
                    }}
                    className={`w-full py-1.5 rounded-lg border-2 border-[#1a162b] font-display font-black text-[10px] uppercase cursor-pointer ${
                      done
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#fde047] hover:bg-amber-300 text-[#1a162b]'
                    }`}
                  >
                    {done ? '✓ Claimed' : 'Claim Bounty'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (activeModal === 'museum') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#fef3c7] via-[#fde68a] to-[#fcd34d] border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b]">
          <div>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#78350f] text-[#fde047]">
              🏛️ Grand Paleontology Hall · 🦴 {ancientAmber} Ancient Amber
            </span>
            <h3 className="font-display font-black text-lg text-[#1a162b] mt-1">
              Excavated Stone Word Tablets &amp; Prehistoric Companion Awakening
            </h3>
            <p className="text-xs font-bold text-[#5d4037]">
              Display excavated tablets and revive ancient Prehistoric Companions for your Sanctuary squad!
            </p>
          </div>
          <button
            type="button"
            disabled={museumBonusClaimed}
            onClick={() => {
              if (museumBonusClaimed) return;
              setMuseumBonusClaimed(true);
              addAncientAmber(5);
              addRewards({ coins: 180, tokens: 3, xp: 80 });
              juice.fanfare();
              onTriggerToast('Claimed Curator Grant: +180 🪙, +3 💎 & +5 🦴 Amber!');
            }}
            className={`px-4 py-2.5 rounded-xl border-[3px] border-[#1a162b] font-display font-black text-xs cursor-pointer ${
              museumBonusClaimed
                ? 'bg-emerald-700 text-white'
                : 'bg-[#1a162b] text-[#fde047] hover:bg-slate-800'
            }`}
          >
            {museumBonusClaimed ? '✓ Curator Grant Claimed' : '🏆 Claim Curator Grant (+180 🪙)'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ELEMENTAL_ADVENTURE_BIOMES.map((biome) => {
            const digNode = biome.nodes.find((n) => n.type === 'digsite');
            const tablet = digNode?.digSiteTablet;
            const isExcavated =
              Boolean(digNode && nodeProgress[digNode.nodeId]?.cleared) ||
              allWords.some((w) => w.id === tablet?.id);
            const isAwakened = Boolean(awakenedFossils[biome.element]);

            return (
              <div
                key={biome.zoneId}
                onClick={() => {
                  if (tablet) {
                    juice.speakWord(`${tablet.word}. ${tablet.definition}`);
                  }
                }}
                className={`p-3.5 rounded-2xl border-[3px] border-[#1a162b] flex flex-col justify-between transition cursor-pointer ${
                  isExcavated ? 'bg-white shadow-[0_4px_0_#1a162b]' : 'bg-stone-200/80 opacity-85'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-black">
                    <span className="uppercase text-[#78350f]">
                      {ELEMENTS[biome.element]?.icon} {biome.name}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        isExcavated
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-700'
                          : 'bg-stone-300 text-stone-700'
                      }`}
                    >
                      {isExcavated ? '★ Displayed' : `Stage ${biome.order}-4`}
                    </span>
                  </div>
                  <div className="font-display font-black text-base text-[#1a162b] mt-1.5">
                    🦴 {tablet?.word || 'Ancient Tablet'}
                  </div>
                  <p className="text-[11px] font-semibold text-[#5d4037] mt-0.5">
                    {tablet?.definition}
                  </p>
                  <div className="mt-1.5 text-[10px] font-black text-amber-800">
                    🔬 {tablet?.morphologyNote}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const pet = awakenPrehistoricCompanion(biome.element);
                    onTriggerToast(`🦖 Awakened Prehistoric Companion: ${pet.name}!`);
                  }}
                  className={`mt-2.5 w-full py-1.5 rounded-xl border-2 border-[#1a162b] font-display font-black text-[10px] uppercase cursor-pointer ${
                    isAwakened
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-[#fde047] to-[#f59e0b] text-[#1a162b]'
                  }`}
                >
                  {isAwakened ? '🦖 Fossil Companion Active (+Lv)' : '🦖 Awaken Fossil Companion'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeModal === 'profile') {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-white border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <CreatureSprite
              creatureId={selectedPet.forged?.sourceId || selectedPet.id}
              stage={selectedPet.stage || 1}
              element={selectedPet.element}
              size="md"
            />
            <div>
              <div className="text-xs font-black uppercase text-[#283593]">
                Aetheria Official Tamer License &amp; Literacy Report Card
              </div>
              <div className="font-display font-black text-xl">
                {currentUser?.displayName || 'Aris'} &amp; {selectedPet.name}
              </div>
              <div className="text-xs font-bold text-[#5d4037] mt-1">
                Elemental Areas Cleared: <strong>{clearedAreasCount} / 9</strong> · Vocabulary Catalog:{' '}
                <strong>{allWords.length} Word Tablets</strong>
              </div>
              <div className="text-[11px] font-black text-emerald-700 mt-0.5">
                🤖 Adaptive Tutor: {tutorInsight.coachTip}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-[#1a162b] text-[#fde047] font-display font-black text-xs border-2 border-[#1a162b] cursor-pointer"
          >
            🖨️ Print Field Report
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-[#fff8e7] border-[3px] border-[#1a162b] space-y-3">
          <div className="font-display font-black text-sm text-[#1a162b]">
            🏅 Explorer Achievement Badge Cabinet
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: '🦴', title: 'Fossil Ranger', desc: 'Excavated Stone Tablets', unlocked: true },
              { icon: '🔨', title: 'Tablet Chisel Master', desc: 'Forged Morpheme Words', unlocked: allWords.length >= 45 },
              { icon: '🌍', title: 'Realm Trailblazer', desc: 'Cleared Elemental Realms', unlocked: clearedAreasCount >= 1 },
              { icon: '👑', title: 'Syntax Sovereign', desc: 'Mastered K–8 Vocabulary', unlocked: allWords.length >= 60 },
            ].map((badge) => (
              <div
                key={badge.title}
                className={`p-2.5 rounded-xl border-2 border-[#1a162b] text-center ${
                  badge.unlocked ? 'bg-[#fde047]/40' : 'bg-stone-200 opacity-60'
                }`}
              >
                <div className="text-2xl">{badge.icon}</div>
                <div className="font-display font-black text-xs text-[#1a162b] mt-0.5">
                  {badge.title}
                </div>
                <div className="text-[10px] font-bold text-[#5d4037]">{badge.desc}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {(
              [
                { label: 'Adjectives', count: words.adjectives.length, color: 'bg-amber-200' },
                { label: 'Nouns', count: words.nouns.length, color: 'bg-sky-200' },
                { label: 'Verbs', count: (words.verbs ?? []).length, color: 'bg-rose-200' },
                { label: 'Adverbs', count: (words.adverbs ?? []).length, color: 'bg-purple-200' },
              ] as const
            ).map((stat) => (
              <div
                key={stat.label}
                className={`rounded-xl border-2 border-[#1a162b] ${stat.color} p-2 text-center`}
              >
                <div className="font-mono text-sm font-black text-[#1a162b]">
                  {stat.count} Tablets
                </div>
                <div className="text-[10px] font-black uppercase text-[#1a162b]/80">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border-[3px] border-[#1a162b] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="font-display font-black text-sm text-[#1a162b]">
              📓 Feature #19 · Mistake Review &amp; Field Journal Practice Deck
            </div>
            <span className="text-[10px] font-black text-emerald-700">+20 🪙 per Mastered Word</span>
          </div>
          {mistakeWords.length === 0 ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-2.5 text-xs font-bold text-emerald-800">
              ✨ All Field Journal review words have been mastered!
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {mistakeWords.map((mw) => (
                <button
                  key={mw}
                  type="button"
                  onClick={() => {
                    juice.speakWord(mw);
                    masterMistakeWord(mw);
                    addRewards({ coins: 20, tokens: 0, xp: 15 });
                    onTriggerToast(`Mastered "${mw}" in Field Journal! +20 🪙`);
                  }}
                  className="flex items-center gap-2 rounded-xl border-2 border-[#1a162b] bg-[#fff8e7] hover:bg-[#fde047] px-3 py-1.5 text-xs font-black text-[#1a162b] cursor-pointer"
                >
                  <span>🔊 Practice &amp; Master: "{mw}"</span>
                  <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] text-white">
                    +20 🪙
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* #5 Roguelike Relics & Persistent Starter Deck Unlock Tracks */}
        <div className="p-4 rounded-2xl bg-[#fff8e7] border-[3px] border-[#1a162b] space-y-3">
          <div className="font-display font-black text-sm text-[#1a162b]">
            🏺 Roguelike Run Relics &amp; Persistent Starter Deck Unlocks (#5)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {ROGUELIKE_RELICS.slice(0, 6).map((relic, rIdx) => {
              const unlocked = clearedAreasCount >= Math.floor(rIdx / 2);
              return (
                <div
                  key={relic.id}
                  className={`rounded-xl border-2 border-[#1a162b] p-2.5 ${
                    unlocked ? 'bg-white' : 'bg-stone-200 opacity-65'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black text-[#1a162b]">
                    <span>
                      {relic.icon} {relic.name}
                    </span>
                    <span className="uppercase text-[10px] text-amber-800">{relic.effectType}</span>
                  </div>
                  <div className="text-[11px] font-bold text-[#5d4037] mt-0.5">
                    {relic.description}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {STARTER_DECK_UNLOCK_TRACKS.map((deck) => {
              const isDeckUnlocked = clearedAreasCount * 3 >= deck.requiredStars;
              return (
                <div
                  key={deck.id}
                  className={`rounded-xl border-2 border-[#1a162b] p-2.5 flex items-center justify-between gap-2 ${
                    isDeckUnlocked ? 'bg-emerald-50' : 'bg-stone-100 opacity-75'
                  }`}
                >
                  <div>
                    <div className="font-display text-xs font-black text-[#1a162b]">
                      {deck.icon} {deck.name}
                    </div>
                    <div className="text-[10px] font-bold text-[#5d4037]">
                      {deck.bonusTrait} · {deck.description}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-black border border-[#1a162b] ${
                      isDeckUnlocked ? 'bg-[#4ade80] text-[#1a162b]' : 'bg-stone-300 text-stone-700'
                    }`}
                  >
                    {isDeckUnlocked ? '✓ Unlocked' : `${deck.requiredStars} ★ Required`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* #8 Atomic Combat State Serialization & #10 Steamworks / Platform Achievements & Cloud Save */}
        <div className="p-4 rounded-2xl bg-white border-[3px] border-[#1a162b] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-display font-black text-sm text-[#1a162b]">
                🎮 Steamworks / Platform Achievements &amp; Atomic Cloud Save (#8, #10)
              </div>
              <div className="text-xs font-bold text-[#5d4037]">
                Steam Deck Native (1280×800) · Atomic FNV-1a Checksum Save Protection
              </div>
            </div>
            <div className="flex items-center gap-2">
              {savedCombatSnapshot && (
                <button
                  type="button"
                  onClick={() => {
                    onCloseModal();
                    setTab('battle');
                  }}
                  className="rounded-xl border-2 border-[#1a162b] bg-[#fde047] hover:bg-amber-300 px-3 py-1.5 font-display text-xs font-black text-[#1a162b] cursor-pointer"
                >
                  ⚡ Resume Saved Round {savedCombatSnapshot.roundNumber} (CRC:{' '}
                  {savedCombatSnapshot.checksum})
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const payload = JSON.stringify(
                    {
                      exportedAt: new Date().toISOString(),
                      explorer: currentUser?.displayName || 'Aris',
                      clearedAreasCount,
                      vocabCount: allWords.length,
                      atomicCombatSnapshot: savedCombatSnapshot,
                    },
                    null,
                    2
                  );
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(payload).catch(() => {});
                  }
                  juice.fanfare();
                  onTriggerToast('☁️ Cloud Save JSON copied to clipboard with FNV-1a checksum!');
                }}
                className="rounded-xl border-2 border-[#1a162b] bg-[#1a162b] text-[#fde047] px-3 py-1.5 font-display text-xs font-black cursor-pointer"
              >
                ☁️ Export Cloud Save
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PLATFORM_ACHIEVEMENTS.map((ach) => (
              <div
                key={ach.id}
                className="rounded-xl border-2 border-[#1a162b] bg-amber-50/70 p-2 flex items-start gap-2"
              >
                <span className="text-xl">{ach.icon}</span>
                <div>
                  <div className="font-display text-xs font-black text-[#1a162b]">
                    {ach.title}
                  </div>
                  <div className="text-[10px] font-bold text-[#5d4037]">{ach.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              onCloseModal();
              setIsCustomizingAvatar(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#ffd54f] to-[#ffb300] border-[3px] border-[#1a162b] font-display font-black text-xs text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
          >
            Customize Explorer Avatar
          </button>
          <button
            onClick={() => {
              onCloseModal();
              setTab('loadout');
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#4fc3f7] to-[#0288d1] border-[3px] border-[#1a162b] font-display font-black text-xs text-white shadow-[0_3px_0_#1a162b] cursor-pointer"
          >
            Open Word Arsenal
          </button>
        </div>
      </div>
    );
  }

  const currentTutorial = TUTORIAL_STEPS_3MIN[tutorialStepIdx] || TUTORIAL_STEPS_3MIN[0];

  return (
    <div className="space-y-4">
      {/* #10 Interactive, Skippable 3-Minute Onboarding Tutorial */}
      {!tutorialSkipped && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#fef9c3] via-[#fde68a] to-[#fcd34d] border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-[#1a162b] px-2.5 py-1 font-display text-xs font-black uppercase text-[#fde047]">
                🎓 3-Minute Interactive Tutorial ({tutorialStepIdx + 1}/{TUTORIAL_STEPS_3MIN.length})
              </span>
              <span className="font-mono text-xs font-black text-[#451a03]">
                ⏱️ {currentTutorial.durationLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTutorialSkipped(true)}
              className="rounded-lg border border-[#1a162b] bg-white/80 hover:bg-white px-2.5 py-1 text-xs font-black text-[#1a162b] cursor-pointer"
            >
              Skip Tutorial ✕
            </button>
          </div>
          <div className="rounded-xl border-2 border-[#1a162b] bg-white p-3 space-y-1.5">
            <div className="font-display text-sm sm:text-base font-black text-[#1a162b]">
              {currentTutorial.title}
            </div>
            <p className="text-xs font-bold text-[#4e342e]">{currentTutorial.body}</p>
            <div className="text-xs font-black text-emerald-800">
              🎯 Goal: {currentTutorial.interactivePrompt}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  juice.speakWord(`${currentTutorial.title}. ${currentTutorial.body}`)
                }
                className="rounded-xl border-2 border-[#1a162b] bg-sky-200 hover:bg-sky-300 px-3 py-1.5 font-display text-xs font-black text-[#1a162b] cursor-pointer"
              >
                🔊 Read Step Aloud
              </button>
              <button
                type="button"
                onClick={() => {
                  onCloseModal();
                  setTab('battle');
                }}
                className="rounded-xl border-2 border-[#1a162b] bg-[#4ade80] hover:bg-emerald-400 px-3 py-1.5 font-display text-xs font-black text-[#1a162b] cursor-pointer"
              >
                ⚔️ Practice in Arena
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={tutorialStepIdx === 0}
                onClick={() => setTutorialStepIdx((i) => Math.max(0, i - 1))}
                className="rounded-xl border-2 border-[#1a162b] bg-white px-3 py-1.5 font-display text-xs font-black text-[#1a162b] disabled:opacity-40 cursor-pointer"
              >
                ◀ Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setTutorialStepIdx((i) => (i + 1) % TUTORIAL_STEPS_3MIN.length)
                }
                className="rounded-xl border-2 border-[#1a162b] bg-[#1a162b] text-[#fde047] px-3 py-1.5 font-display text-xs font-black cursor-pointer"
              >
                Next Step ▶
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-white border-[3px] border-[#1a162b] space-y-2.5">
        <div>
          <div className="font-display font-black text-base text-[#1a162b]">
            🎓 Adaptive K–8 Vocabulary Grade Band
          </div>
          <div className="text-xs font-semibold text-[#5d4037]">
            Filter default Word Tablets in battle and tailor your Explorer experience
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              { id: 'all', label: 'All K–8 Tiers', desc: 'Complete Catalog' },
              { id: 'k-2', label: 'Grades K–2', desc: 'Sprout Foundations' },
              { id: '3-5', label: 'Grades 3–5', desc: 'Core Elementary' },
              { id: '6-8', label: 'Grades 6–8', desc: 'High-Achiever Extender' },
            ] as const
          ).map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setPreferredGradeBand(b.id);
                juice.click();
                onTriggerToast(`Grade Band set to ${b.label}!`);
              }}
              className={`p-2.5 rounded-xl border-2 border-[#1a162b] text-left cursor-pointer transition ${
                preferredGradeBand === b.id
                  ? 'bg-[#ffd54f] text-[#1a162b] shadow-[0_3px_0_#1a162b]'
                  : 'bg-[#fff8e7] hover:bg-[#ffe082] text-[#1a162b]'
              }`}
            >
              <div className="font-display font-black text-xs">{b.label}</div>
              <div className="text-[10px] font-bold text-[#5d4037]">{b.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#fff8e7] border-[3px] border-[#1a162b] space-y-3">
        <div>
          <div className="font-display font-black text-base text-[#1a162b]">
            📝 Custom Spelling Word &amp; Tablet Importer (Parent / Teacher Studio)
          </div>
          <p className="text-xs font-semibold text-[#5d4037]">
            Type any weekly school vocabulary word below to chisel it into a playable Stone Word Tablet!
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            value={customSpellingWord}
            onChange={(e) => setCustomSpellingWord(e.target.value)}
            placeholder="Word (e.g. Luminous)"
            className="rounded-xl border-2 border-[#1a162b] bg-white px-3 py-2 text-xs font-bold text-[#1a162b]"
          />
          <input
            type="text"
            value={customSpellingDef}
            onChange={(e) => setCustomSpellingDef(e.target.value)}
            placeholder="Short definition..."
            className="rounded-xl border-2 border-[#1a162b] bg-white px-3 py-2 text-xs font-bold text-[#1a162b]"
          />
          <div className="flex gap-1.5">
            <select
              value={customSpellingPos}
              onChange={(e) => setCustomSpellingPos(e.target.value as PartOfSpeech)}
              className="flex-1 rounded-xl border-2 border-[#1a162b] bg-white px-2 py-2 text-xs font-black text-[#1a162b]"
            >
              <option value="adjective">Adjective</option>
              <option value="noun">Noun</option>
              <option value="verb">Verb</option>
              <option value="adverb">Adverb</option>
            </select>
            <button
              type="button"
              onClick={() => {
                const clean = customSpellingWord.trim();
                if (!clean) {
                  onTriggerToast('Enter a vocabulary word first!');
                  return;
                }
                const newTablet: Word = {
                  id: `custom_${clean.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
                  word: clean,
                  definition:
                    customSpellingDef.trim() ||
                    `Custom Explorer Word Tablet (${customSpellingPos}).`,
                  example: `The explorer used the ${clean.toLowerCase()} tablet on the trail.`,
                  partOfSpeech: customSpellingPos,
                  element: customSpellingElem,
                  gradeTier: '4',
                  powerBonus: 5,
                };
                commitWord(newTablet);
                setCustomSpellingWord('');
                setCustomSpellingDef('');
                juice.fanfare();
                juice.speakWord(clean);
                onTriggerToast(`Chiseled Custom Word Tablet: "${clean}"!`);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-b from-[#4ade80] to-[#16a34a] border-2 border-[#1a162b] font-display font-black text-xs text-[#1a162b] cursor-pointer shrink-0"
            >
              + Add Tablet
            </button>
          </div>
        </div>
      </div>

      {/* #9 Accessibility & Readability: Dyslexia Font, High-Contrast Palette, Calm Animations & UI Scaling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border-[3px] border-[#1a162b]">
          <div>
            <div className="font-display font-black text-xs text-[#1a162b]">
              📖 Dyslexia-Friendly Font (#9)
            </div>
            <div className="text-[11px] font-semibold text-[#5d4037]">
              Wider letter spacing
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setDyslexiaFriendly(!dyslexiaFriendly);
              juice.click();
            }}
            className={`px-3 py-1.5 rounded-xl border-2 border-[#1a162b] font-black text-xs cursor-pointer shrink-0 ${
              dyslexiaFriendly ? 'bg-emerald-500 text-white' : 'bg-[#ffd54f] text-[#1a162b]'
            }`}
          >
            {dyslexiaFriendly ? '✓ Active' : 'Enable'}
          </button>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border-[3px] border-[#1a162b]">
          <div>
            <div className="font-display font-black text-xs text-[#1a162b]">
              👁️ High-Contrast Palette (#9)
            </div>
            <div className="text-[11px] font-semibold text-[#5d4037]">
              Sharper borders &amp; contrast
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !highContrastMode;
              setHighContrastMode(next);
              if (typeof document !== 'undefined') {
                document.documentElement.classList.toggle('contrast-125', next);
              }
              juice.click();
            }}
            className={`px-3 py-1.5 rounded-xl border-2 border-[#1a162b] font-black text-xs cursor-pointer shrink-0 ${
              highContrastMode ? 'bg-emerald-500 text-white' : 'bg-[#ffd54f] text-[#1a162b]'
            }`}
          >
            {highContrastMode ? '✓ Active' : 'Enable'}
          </button>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border-[3px] border-[#1a162b]">
          <div>
            <div className="font-display font-black text-xs text-[#1a162b]">
              🌿 Calm Animations (#9)
            </div>
            <div className="text-[11px] font-semibold text-[#5d4037]">
              Reduces motion &amp; bounce
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setCalmAnimations(!calmAnimations);
              juice.click();
            }}
            className={`px-3 py-1.5 rounded-xl border-2 border-[#1a162b] font-black text-xs cursor-pointer shrink-0 ${
              calmAnimations ? 'bg-emerald-500 text-white' : 'bg-[#ffd54f] text-[#1a162b]'
            }`}
          >
            {calmAnimations ? '✓ Active' : 'Enable'}
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border-[3px] border-[#1a162b] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-display font-black text-xs text-[#1a162b]">
              🔍 UI Scaling (#9)
            </span>
            <span className="font-mono text-xs font-black text-emerald-700">{uiScalePct}%</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[95, 100, 108, 115].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => {
                  setUiScalePct(pct);
                  if (typeof document !== 'undefined') {
                    document.documentElement.style.fontSize = `${pct}%`;
                  }
                  juice.click();
                }}
                className={`py-1 rounded-lg border border-[#1a162b] font-mono text-xs font-black cursor-pointer ${
                  uiScalePct === pct
                    ? 'bg-[#1a162b] text-[#fde047]'
                    : 'bg-amber-50 text-[#1a162b]'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* #1 Deterministic Trie Lexicon Lookup Benchmark + Sanctuary Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-white border-[3px] border-[#1a162b] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-display font-black text-sm text-[#1a162b]">
                ⚡ Deterministic Trie Lexicon Benchmark (#1)
              </div>
              <div className="text-xs font-semibold text-[#5d4037]">
                CSW/TWL + K–8 Offline Fallback &amp; Profanity Guard
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const res = benchmarkTrieLookup(10000);
                setTrieBenchmarkResult(res);
                juice.ding(880, 100);
              }}
              className="rounded-xl border-2 border-[#1a162b] bg-[#fde047] hover:bg-amber-300 px-3 py-1.5 font-display text-xs font-black text-[#1a162b] cursor-pointer shrink-0"
            >
              Run 10k Lookups
            </button>
          </div>
          {trieBenchmarkResult && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-400 px-3 py-1.5 font-mono text-xs font-black text-emerald-900">
              ✓ {trieBenchmarkResult.iterations.toLocaleString()} queries in{' '}
              {trieBenchmarkResult.elapsedMs}ms ({trieBenchmarkResult.avgMicrosecondsPerLookup}µs/word ·{' '}
              {trieBenchmarkResult.lexiconSize} words indexed)
            </div>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-white border-[3px] border-[#1a162b] space-y-1.5">
          <div className="font-display font-black text-sm text-[#1a162b]">
            🍂 Sanctuary Theme
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { id: 'classic', label: '🌿 Summer' },
                { id: 'autumn', label: '🍁 Autumn' },
                { id: 'frostfall', label: '❄️ Frostfall' },
                { id: 'starlight', label: '✨ Starlight' },
              ] as const
            ).map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => {
                  setSanctuaryTheme(th.id);
                  juice.click();
                }}
                className={`px-2 py-1 rounded-lg border border-[#1a162b] text-xs font-black cursor-pointer ${
                  sanctuaryTheme === th.id
                    ? 'bg-[#1a162b] text-[#fde047]'
                    : 'bg-amber-50 text-[#1a162b]'
                }`}
              >
                {th.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-2xl bg-white border-[3px] border-[#1a162b]">
        <div>
          <div className="font-display font-black text-base">Voice Read-Aloud &amp; Sound FX</div>
          <div className="text-xs font-semibold text-[#5d4037]">
            Toggle speech synthesis and RPG sound effects
          </div>
        </div>
        <button
          onClick={toggleMute}
          className="px-4 py-2 rounded-xl bg-[#ffd54f] border-2 border-[#1a162b] font-black text-xs cursor-pointer"
        >
          {isMuted ? '🔇 Muted' : '🔊 Sound On'}
        </button>
      </div>
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#ffebee] border-[3px] border-[#1a162b]">
        <div>
          <div className="font-display font-black text-base text-[#c62828]">
            Switch Explorer / Log Out
          </div>
          <div className="text-xs font-semibold text-[#b71c1c]">
            Return to the Explorer Login &amp; Sign-Up Portal
          </div>
        </div>
        <button
          onClick={() => {
            onCloseModal();
            logout();
          }}
          className="px-4 py-2 rounded-xl bg-[#e53935] text-white border-2 border-[#1a162b] font-black text-xs cursor-pointer"
        >
          Log Out Now
        </button>
      </div>
    </div>
  );
};
