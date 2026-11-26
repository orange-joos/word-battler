import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  RotateCcw,
  Zap,
  Award,
  Map,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { ELEMENTS, OPPOSITE_ELEMENT } from '../data/elements';
import { evaluateCombo, estimateCombatDamage } from '../engine/combat';
import { getAllWordsList } from '../engine/forge';
import { Word, PartOfSpeech, GradeTier } from '../types';
import { juice } from '../engine/juice';
import { canPetEvolve } from '../data/evolutionData';
import { EvolutionSequenceModal } from './EvolutionSequenceModal';
import { CreatureSprite } from './CreatureSprite';
import { GRADE_TIERS, getGradeTierMeta, getPartOfSpeechMeta } from '../data/vocabDatabase';
import { ZONE_BIOMES } from '../data/realms';
import { AdaptiveTutorCoachBar } from './battle/BattleMiniGames';
import {
  saveAtomicCombatSnapshot,
  clearAtomicCombatSnapshot,
} from '../engine/roguelikeLoop';
import {
  createDefaultSmartTileBag,
  drawSmartTileHand,
  applyPermanentStampToTile,
  type SmartTileBagState,
} from '../engine/smartTileBag';
import {
  loadLexiconCompendium,
  recordCastInCompendium,
} from '../engine/compendiumAndSim';
import { floatingNumberPool } from '../engine/objectPool';
import {
  getTactileTileMaterial,
  getDualTierTypographyClasses,
  SEMANTIC_COLOR_GRAMMAR,
  computeReactiveLightingState,
  buildScoringCascadeSteps,
  generateInlineLootDrops,
  type InlineLootDropItem,
} from '../engine/tactileContainedUi';

export const BattleView: React.FC = () => {
  const {
    creatures,
    words,
    playerId,
    setPlayerId,
    battleState,
    submitCombo,
    restartBattle,
    activeZoneId,
    activeNodeId,
    setReturnToWordWorldMap,
    setTab,
    levelUpPet,
    evolvePet,
    updatePetLoadout,
    activeEnemyName,
    activeEnemyStage,
    preferredGradeBand,
    supportCreatureId,
    increasePetBond,
    advanceToNextNode,
    tutorInsight,
    petAccessories,
    petBonds,
  } = useGame();
  const { currentUser, addRewards } = useAuth();

  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [showReserveDrawer, setShowReserveDrawer] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<GradeTier | 'all'>('all');
  const [projectileBurst, setProjectileBurst] = useState<boolean>(false);
  const [tagTeamComboActive, setTagTeamComboActive] = useState<boolean>(false);

  // On-Demand Tutor Coach & Next-Slot Highlight
  const [showCoachHint, setShowCoachHint] = useState<boolean>(false);
  const [highlightedSlotIdx, setHighlightedSlotIdx] = useState<number | null>(null);

  // Drag-and-Drop + Crit Screen Shake + Adaptive Music
  const [draggedWordId, setDraggedWordId] = useState<string | null>(null);
  const [isCritShaking, setIsCritShaking] = useState<boolean>(false);
  const [combatMusicOn, setCombatMusicOn] = useState<boolean>(() => juice.isCombatMusicPlaying());

  // Under-the-hood Smart Tile Bag & Scoring Cascade
  const [tileBag, setTileBag] = useState<SmartTileBagState>(() =>
    drawSmartTileHand(createDefaultSmartTileBag(), 8, 1, 'time-bomb')
  );
  const [activeCascadeIdx, setActiveCascadeIdx] = useState<number | null>(null);
  const [inlineLootDrops, setInlineLootDrops] = useState<InlineLootDropItem[]>([]);

  // Karaoke-Style Word Highlighting index during TTS Read-Aloud
  const [karaokeWordIdx, setKaraokeWordIdx] = useState<number | null>(null);
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);

  const [playerAnim, setPlayerAnim] = useState<'idle' | 'lunge' | 'hit'>('idle');
  const [sidekickAnim, setSidekickAnim] = useState<'idle' | 'lunge'>('idle');
  const [enemyAnim, setEnemyAnim] = useState<'idle' | 'lunge' | 'hit'>('idle');
  const [floatingNumbers, setFloatingNumbers] = useState<
    { id: number; target: 'player' | 'enemy'; text: string; color: string }[]
  >([]);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [evolvingCreatureId, setEvolvingCreatureId] = useState<string | null>(null);
  const floatSeq = useRef(0);

  const allWords = getAllWordsList(words);
  const { player, enemy, phase, winner, log } = battleState;
  const isBattleOver = phase === 'BATTLE_END';
  const biome = ZONE_BIOMES[activeZoneId] || ZONE_BIOMES['area-grass'];

  const fullPlayerCreature = creatures.find((c) => c.id === player.id) || player;
  const isPlayerReadyToEvolve = canPetEvolve(fullPlayerCreature);

  // Player's reserve companions for Support Tag-Team
  const unlockedPets = creatures.filter((c) => !c.id.startsWith('boss_'));
  const sidekickPet =
    unlockedPets.find((c) => c.id === supportCreatureId && c.id !== player.id) ||
    unlockedPets.find((c) => c.id !== player.id) ||
    unlockedPets[0];

  // Round counter derived from battle log
  const roundNumber = Math.max(1, Math.ceil((log?.length || 0) / 2) + 1);

  // Equipped words on Round 1, rotating fresh elemental/grade words on Round 2+ so every turn is a fresh sentence puzzle
  const playerLoadout = fullPlayerCreature.loadout || {
    adjective: 'blazing',
    noun: 'flame',
    verb: 'ignite',
    adverb: 'fiercely',
  };

  const getRoundWord = (pos: PartOfSpeech): Word | null => {
    const posWords = allWords.filter((w) => w.partOfSpeech === pos);
    if (posWords.length === 0) return null;

    const equippedId = playerLoadout[pos];
    const equippedFound = equippedId ? posWords.find((w) => w.id === equippedId) : null;

    if (roundNumber === 1 && equippedFound) {
      return equippedFound;
    }

    // Prefer words matching pet element or grade band, rotating deterministically by roundNumber
    const elementMatches = posWords.filter((w) => w.element === player.element);
    const pool = elementMatches.length >= 2 ? elementMatches : posWords;
    return pool[(roundNumber - 1) % pool.length] || equippedFound || posWords[0];
  };

  const equippedAdj = getRoundWord('adjective');
  const equippedNoun = getRoundWord('noun');
  const equippedVerb = getRoundWord('verb');
  const equippedAdv = getRoundWord('adverb');

  const selectedWords = selectedWordIds
    .map((id) => allWords.find((w) => w.id === id) || null)
    .filter((w): w is Word => Boolean(w));

  const previewCombo = evaluateCombo(
    player,
    selectedWords[0] || null,
    selectedWords[1] || null,
    selectedWords[2] || null,
    selectedWords[3] || null
  );

  // Unified Damage Preview Math: matches combat.ts damageTarget formula
  const exactProjectedDamage = estimateCombatDamage(player, enemy, previewCombo);
  const currentEnemyHp = enemy.currentHp ?? enemy.stats.hp;
  const maxEnemyHp = Math.max(1, enemy.maxHp ?? enemy.stats.hp);
  const effectiveEnemyHp = currentEnemyHp + (enemy.shield ?? 0);
  const projectedHpAfter = Math.max(0, currentEnemyHp - Math.max(0, exactProjectedDamage - (enemy.shield ?? 0)));
  const livePreview = {
    isValid: previewCombo.valid,
    projectedDamage: exactProjectedDamage,
    projectedEnemyHpDropPct: Math.round(((currentEnemyHp - projectedHpAfter) / maxEnemyHp) * 100),
    projectedEnemyHpAfterPct: Math.round((projectedHpAfter / maxEnemyHp) * 100),
    wouldDefeatEnemy: previewCombo.valid && exactProjectedDamage >= effectiveEnemyHp,
  };

  // Reactive Combat Lighting
  const reactiveLighting = computeReactiveLightingState({
    placedWords: selectedWords.map((w) => w.word),
    playerHp: player.currentHp ?? player.stats.hp,
    playerMaxHp: player.maxHp ?? player.stats.hp,
  });

  // Clear selections on battle change
  useEffect(() => {
    setSelectedWordIds([]);
    setRewardClaimed(false);
    setShowCoachHint(false);
    setInlineLootDrops(generateInlineLootDrops(activeNodeId, player.name));
    setTileBag((prev) => drawSmartTileHand(prev, 8, 1, 'time-bomb'));
  }, [playerId, activeZoneId, enemy.id, activeNodeId, player.name]);

  // Draw fresh Vowel-Pity-Guaranteed hand on each new round under the hood
  useEffect(() => {
    if (roundNumber > 1 && !isBattleOver) {
      setTileBag((prev) =>
        drawSmartTileHand(prev, 8, roundNumber, roundNumber % 2 === 0 ? 'time-bomb' : 'poisoned')
      );
    }
  }, [roundNumber, isBattleOver]);

  // Atomic Combat State Serialization & Auto-Save at the start of each combat round
  useEffect(() => {
    if (isBattleOver) {
      clearAtomicCombatSnapshot();
      return;
    }
    saveAtomicCombatSnapshot({
      zoneId: activeZoneId,
      nodeId: activeNodeId,
      playerId: player.id,
      enemyId: enemy.id,
      roundNumber,
      playerHp: player.currentHp ?? player.stats.hp,
      playerMaxHp: player.maxHp ?? player.stats.hp,
      playerShield: player.shield ?? 0,
      enemyHp: enemy.currentHp ?? enemy.stats.hp,
      enemyMaxHp: enemy.maxHp ?? enemy.stats.hp,
      enemyShield: enemy.shield ?? 0,
      selectedWordIds,
    });
    const eHpRatio = (enemy.currentHp ?? enemy.stats.hp) / Math.max(1, enemy.maxHp ?? enemy.stats.hp);
    juice.setCombatMusicIntensity(eHpRatio <= 0.45 || roundNumber >= 3);
  }, [
    roundNumber,
    isBattleOver,
    activeZoneId,
    activeNodeId,
    player.id,
    player.currentHp,
    player.maxHp,
    player.shield,
    player.stats.hp,
    enemy.id,
    enemy.currentHp,
    enemy.maxHp,
    enemy.shield,
    enemy.stats.hp,
    selectedWordIds,
  ]);

  // Reward & Pet EXP on Victory + Companion Bond Increase
  useEffect(() => {
    if (isBattleOver && winner === player.id && !rewardClaimed) {
      setRewardClaimed(true);
      addRewards({ coins: 65, tokens: 1, xp: 45, wonBattle: true });
      levelUpPet(player.id, 1);
      increasePetBond(player.id, 1);
    }
  }, [isBattleOver, winner, player.id, rewardClaimed, addRewards, levelUpPet, increasePetBond]);

  // Combat event animations + TTS + Object-Pooled Floating Numbers
  useEffect(() => {
    if (!battleState.events || battleState.events.length === 0) return;

    battleState.events.forEach((ev) => {
      if (ev.type === 'SPEAK' && ev.phrase) {
        juice.speakWord(ev.phrase);
      }
      if (ev.type === 'DAMAGE' && ev.amount) {
        const isEnemyTarget = ev.targetId === enemy.id;
        if (isEnemyTarget) {
          setPlayerAnim('lunge');
          setProjectileBurst(true);
          setTimeout(() => setEnemyAnim('hit'), 150);
          setTimeout(() => {
            setPlayerAnim('idle');
            setEnemyAnim('idle');
            setProjectileBurst(false);
          }, 550);
        } else {
          setEnemyAnim('lunge');
          setTimeout(() => setPlayerAnim('hit'), 150);
          setTimeout(() => {
            setEnemyAnim('idle');
            setPlayerAnim('idle');
          }, 550);
        }

        const pooled = floatingNumberPool.acquire();
        pooled.id = ++floatSeq.current;
        pooled.target = isEnemyTarget ? 'enemy' : 'player';
        pooled.text = `-${ev.amount} HP`;
        pooled.color = 'text-red-600 border-[#1a162b] bg-[#fff8e7]';

        setFloatingNumbers((prev) => [
          ...prev,
          {
            id: pooled.id,
            target: pooled.target,
            text: pooled.text,
            color: pooled.color,
          },
        ]);
        setTimeout(() => {
          setFloatingNumbers((prev) => prev.filter((item) => item.id !== pooled.id));
          floatingNumberPool.release(pooled);
        }, 1200);
      } else if (ev.type === 'SHIELD' && ev.amount) {
        const isPlayerTarget = ev.attackerId === player.id;
        const pooled = floatingNumberPool.acquire();
        pooled.id = ++floatSeq.current;
        pooled.target = isPlayerTarget ? 'player' : 'enemy';
        pooled.text = `+${ev.amount} SHIELD`;
        pooled.color = 'text-sky-600 border-[#1a162b] bg-[#fff8e7]';

        setFloatingNumbers((prev) => [
          ...prev,
          {
            id: pooled.id,
            target: pooled.target,
            text: pooled.text,
            color: pooled.color,
          },
        ]);
        setTimeout(() => {
          setFloatingNumbers((prev) => prev.filter((item) => item.id !== pooled.id));
          floatingNumberPool.release(pooled);
        }, 1200);
      }
    });
  }, [battleState.events, enemy.id, player.id]);

  const handleToggleWordCard = (word: Word) => {
    if (isBattleOver) return;
    const isRemoving = selectedWordIds.includes(word.id);
    if (isRemoving) {
      juice.click();
    } else {
      juice.playLetterPitch(selectedWordIds.length);
    }
    juice.speakWord(word.word);
    setHighlightedSlotIdx(null);

    setSelectedWordIds((prev) => {
      if (prev.includes(word.id)) {
        return prev.filter((id) => id !== word.id);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), word.id];
      }
      return [...prev, word.id];
    });
  };

  const handleWeaveFullSentence = () => {
    if (isBattleOver) return;
    const ids = [
      equippedAdj?.id,
      equippedNoun?.id,
      equippedVerb?.id,
      equippedAdv?.id,
    ].filter((id): id is string => Boolean(id));

    if (ids.length === 4) {
      juice.ding(920, 140);
      setSelectedWordIds(ids);
    }
  };

  const handleFixGrammarOrder = () => {
    if (selectedWords.length < 2) return;
    juice.ding(780, 120);
    if (
      selectedWords.length === 2 &&
      selectedWords.some((w) => w.partOfSpeech === 'adverb') &&
      selectedWords.some((w) => w.partOfSpeech === 'verb')
    ) {
      const adv = selectedWords.find((w) => w.partOfSpeech === 'adverb')!;
      const verb = selectedWords.find((w) => w.partOfSpeech === 'verb')!;
      setSelectedWordIds([adv.id, verb.id]);
      return;
    }
    const orderMap: Record<PartOfSpeech, number> = {
      adjective: 0,
      noun: 1,
      verb: 2,
      adverb: 3,
    };
    const sorted = [...selectedWords].sort(
      (a, b) => orderMap[a.partOfSpeech] - orderMap[b.partOfSpeech]
    );
    setSelectedWordIds(sorted.map((w) => w.id));
  };

  // Single 💡 Help Button: toggles on-demand Tutor Coach, fixes out-of-order grammar, & highlights next slot needed
  const handleHelpButton = () => {
    juice.click();
    setShowCoachHint((prev) => !prev);
    if (selectedWords.length >= 2 && !previewCombo.valid) {
      handleFixGrammarOrder();
    }
    const nextIdx = Math.min(3, selectedWords.length);
    setHighlightedSlotIdx(nextIdx);
    setTimeout(() => setHighlightedSlotIdx(null), 2400);
  };

  // Karaoke-style word-by-word highlighting during TTS read-aloud
  const handleKaraokeReadSentence = () => {
    const wordsToRead =
      selectedWords.length > 0
        ? selectedWords
        : [equippedAdj, equippedNoun, equippedVerb, equippedAdv].filter(
            (w): w is Word => Boolean(w)
          );
    if (wordsToRead.length === 0) return;

    const fullPhrase = wordsToRead.map((w) => w.word).join(' ');
    juice.speakWord(fullPhrase);
    setIsListeningVoice(true);

    wordsToRead.forEach((_, idx) => {
      setTimeout(() => {
        setKaraokeWordIdx(idx);
      }, idx * 420);
    });

    setTimeout(() => {
      setKaraokeWordIdx(null);
      setIsListeningVoice(false);
      addRewards({ coins: 15, tokens: 0, xp: 10 });
    }, wordsToRead.length * 420 + 250);
  };

  const handleLaunchWordStrike = () => {
    if (isBattleOver || !previewCombo.valid || selectedWords.length === 0) return;
    const isCritStrike = selectedWords.length === 4;

    // Choreograph Paced Left-to-Right Scoring Cascade across placed tiles
    const cascadeSteps = buildScoringCascadeSteps(selectedWords.map((w) => w.word));
    cascadeSteps.forEach((step) => {
      setTimeout(() => {
        setActiveCascadeIdx(step.stepIndex);
        juice.playLetterPitch(step.pitchSemitoneIndex);
      }, step.delayMs);
    });
    const totalCascadeDuration =
      cascadeSteps.length > 0 ? cascadeSteps[cascadeSteps.length - 1].delayMs + 140 : 120;
    setTimeout(() => {
      setActiveCascadeIdx(null);
    }, totalCascadeDuration);

    // Record cast in lifetime Lexicon Compendium
    recordCastInCompendium(
      loadLexiconCompendium(),
      selectedWords.map((w) => w.word),
      previewCombo.phrase,
      livePreview.projectedDamage
    );

    // Satisfying low-end sub-bass thud + screen shake on 3-4 word combos
    juice.playSubmitThud(isCritStrike);
    if (isCritStrike || selectedWords.length >= 3) {
      setIsCritShaking(true);
      setTimeout(() => setIsCritShaking(false), 420);
    }

    if (selectedWords.length === 4) {
      setSidekickAnim('lunge');
      setTagTeamComboActive(true);
      setTimeout(() => {
        setSidekickAnim('idle');
        setTagTeamComboActive(false);
      }, 900);
    }
    increasePetBond(player.id, 1);
    submitCombo(
      selectedWords[0].id,
      selectedWords[1]?.id || null,
      selectedWords[2]?.id || null,
      selectedWords[3]?.id || null
    );
    setSelectedWordIds([]);
    setShowCoachHint(false);
  };

  const displayEnemyName = activeEnemyName || enemy.name;
  const displayEnemyStage: 1 | 2 | 3 = activeEnemyStage || 3;

  const playerHpPct = Math.max(
    0,
    Math.min(100, Math.round(((player.currentHp ?? player.stats.hp) / (player.maxHp ?? player.stats.hp)) * 100))
  );
  const enemyHpPct = Math.max(
    0,
    Math.min(100, Math.round(((enemy.currentHp ?? enemy.stats.hp) / (enemy.maxHp ?? enemy.stats.hp)) * 100))
  );

  const playerElem = ELEMENTS[player.element] || ELEMENTS.fire;
  const enemyElem = ELEMENTS[enemy.element] || ELEMENTS.earth;
  const enemyWeakElem = ELEMENTS[OPPOSITE_ELEMENT[enemy.element] || 'fire'] || ELEMENTS.fire;

  const filteredReserveWords = allWords.filter((w) => {
    const tier = w.gradeTier || '3';
    if (gradeFilter !== 'all') return tier === gradeFilter;
    if (preferredGradeBand === 'k-2') return ['K', '1', '2'].includes(tier);
    if (preferredGradeBand === '3-5') return ['3', '4', '5'].includes(tier);
    if (preferredGradeBand === '6-8') return ['5', 'extender'].includes(tier);
    return true;
  });

  // Show Tutor Coach only when requested via 💡 Help or when player makes a sentence-order mistake
  const hasGrammarMistake = selectedWords.length > 0 && !previewCombo.valid;
  const isCoachVisible = showCoachHint || hasGrammarMistake;

  const runeSlots = [
    {
      pos: 'adjective' as PartOfSpeech,
      short: 'ADJ',
      label: 'Adjective',
      word: equippedAdj,
      slotBg: 'bg-amber-100 border-amber-500 text-amber-950',
      slotActiveBg: 'bg-amber-300 border-[#1a162b] text-[#1a162b]',
    },
    {
      pos: 'noun' as PartOfSpeech,
      short: 'NOUN',
      label: 'Noun',
      word: equippedNoun,
      slotBg: 'bg-sky-100 border-sky-500 text-sky-950',
      slotActiveBg: 'bg-sky-300 border-[#1a162b] text-[#1a162b]',
    },
    {
      pos: 'verb' as PartOfSpeech,
      short: 'VERB',
      label: 'Verb',
      word: equippedVerb,
      slotBg: 'bg-rose-100 border-rose-500 text-rose-950',
      slotActiveBg: 'bg-rose-300 border-[#1a162b] text-[#1a162b]',
    },
    {
      pos: 'adverb' as PartOfSpeech,
      short: 'ADV',
      label: 'Adverb',
      word: equippedAdv,
      slotBg: 'bg-purple-100 border-purple-500 text-purple-950',
      slotActiveBg: 'bg-purple-300 border-[#1a162b] text-[#1a162b]',
    },
  ];

  return (
    <div className="h-full w-full overflow-y-auto bg-[#120e24] p-2 sm:p-3 select-none">
      <div className="mx-auto max-w-[1260px] space-y-2.5 pb-4">
        {/* ====================================================================
            ZONE 1: TOP ARENA
            Pet vs. Boss Pet with 1 clean HP bar (with Ghost HP glow) and 1 Element badge each.
           ==================================================================== */}
        <div
          className={`relative overflow-hidden rounded-3xl border-[4px] border-[#1a162b] shadow-[0_8px_0_#090714] min-h-[390px] sm:min-h-[420px] flex flex-col justify-between transition-transform ${
            isCritShaking ? 'translate-x-1 -translate-y-0.5 ring-4 ring-[#fde047]' : ''
          } ${reactiveLighting.lowHpVignetteActive ? 'crimson-low-hp-vignette' : ''}`}
        >
          {/* Dynamic 2.5D Storybook + Stadium SVG Backdrop */}
          <svg
            viewBox="0 0 1280 500"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full pointer-events-none"
          >
            <defs>
              <linearGradient id={`sky-${activeZoneId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={biome.skyFrom} />
                <stop offset="60%" stopColor={biome.skyTo} />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
              <linearGradient id="oceanHorizon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={biome.horizonColor} />
                <stop offset="100%" stopColor={biome.skyTo} />
              </linearGradient>
              <radialGradient id="starBurst" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor="#7dd3fc" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect width="1280" height="500" fill={`url(#sky-${activeZoneId})`} />

            <g opacity="0.35" fill={biome.horizonColor}>
              <circle cx="140" cy="180" r="70" />
              <circle cx="230" cy="190" r="55" />
              <circle cx="1050" cy="175" r="75" />
              <circle cx="1150" cy="190" r="60" />
            </g>

            <rect x="0" y="165" width="1280" height="90" fill="url(#oceanHorizon)" opacity="0.75" />
            <path
              d="M80,190 H320 M480,205 H790 M920,188 H1180 M210,220 H540"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.55"
            />

            <path
              d="M0,245 Q340,205 640,235 T1280,225 L1280,500 L0,500 Z"
              fill={biome.groundColor}
              stroke="#1a162b"
              strokeWidth="3.5"
            />
            <path
              d="M0,295 Q640,255 1280,295 L1280,500 L0,500 Z"
              fill={biome.accentColor}
              opacity="0.28"
            />

            <g stroke="#ffffff" strokeWidth="3" opacity="0.45" fill="none">
              <ellipse cx="640" cy="390" rx="520" ry="95" />
              <ellipse cx="640" cy="390" rx="135" ry="42" />
              <line x1="640" y1="295" x2="640" y2="485" />
            </g>

            {/* Left Storybook Props */}
            <g stroke="#1a162b" strokeWidth="3" strokeLinejoin="round">
              <path d="M55,255 L42,155 L82,155 L70,255 Z" fill="#7c4dff" opacity="0.85" />
              <ellipse cx="45" cy="145" rx="48" ry="34" fill="#2dd4bf" />
              <ellipse cx="95" cy="130" rx="52" ry="36" fill="#f472b6" />
              <path d="M148,268 Q145,242 155,242 L175,242 Q185,242 182,268 Z" fill="#fef3c7" />
              <path d="M122,246 Q165,195 208,246 Z" fill="#ef4444" />
              <circle cx="150" cy="228" r="7" fill="#fef3c7" stroke="none" />
              <circle cx="178" cy="233" r="5.5" fill="#fef3c7" stroke="none" />
              <circle cx="165" cy="218" r="4.5" fill="#fef3c7" stroke="none" />
            </g>

            {/* Right Storybook Props */}
            <g stroke="#1a162b" strokeWidth="3" strokeLinejoin="round">
              <path d="M1135,260 L1150,215 L1215,215 L1232,260 Z" fill="#8d6e63" />
              <ellipse cx="1182" cy="215" rx="32" ry="11" fill="#d7ccc8" />
              <ellipse cx="1182" cy="215" rx="18" ry="6" fill="none" stroke="#5d4037" strokeWidth="2" />
            </g>

            {/* Left Stone Pedestals */}
            <g stroke="#1a162b" strokeWidth="3.5" strokeLinejoin="round">
              <ellipse cx="145" cy="348" rx="62" ry="20" fill="#78716c" />
              <ellipse cx="145" cy="340" rx="58" ry="17" fill="#a8a29e" />
              <ellipse cx="120" cy="435" rx="58" ry="19" fill="#78716c" />
              <ellipse cx="120" cy="427" rx="54" ry="16" fill="#a8a29e" />
              <ellipse cx="330" cy="395" rx="95" ry="30" fill="#57534e" />
              <ellipse cx="330" cy="385" rx="90" ry="26" fill="#a8a29e" />
              <ellipse cx="330" cy="383" rx="78" ry="21" fill="none" stroke="#22d3ee" strokeWidth="5" />
            </g>

            {/* Right Stone Pedestal */}
            <g stroke="#1a162b" strokeWidth="3.5" strokeLinejoin="round">
              <ellipse cx="950" cy="395" rx="102" ry="32" fill="#44403c" />
              <ellipse cx="950" cy="385" rx="96" ry="27" fill="#78716c" />
              <ellipse cx="950" cy="383" rx="84" ry="22" fill="none" stroke="#f59e0b" strokeWidth="5" />
            </g>

            {/* Projectile Burst Trail */}
            {projectileBurst && (
              <g>
                <line
                  x1="390"
                  y1="320"
                  x2="880"
                  y2="320"
                  stroke="#67e8f9"
                  strokeWidth="12"
                  strokeLinecap="round"
                  opacity="0.75"
                />
                {tagTeamComboActive && (
                  <line
                    x1="160"
                    y1="390"
                    x2="880"
                    y2="320"
                    stroke="#facc15"
                    strokeWidth="10"
                    strokeDasharray="14 6"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                )}
                <circle cx="720" cy="320" r="45" fill="url(#starBurst)" />
                <polygon
                  points="720,285 730,308 755,310 735,326 742,350 720,336 698,350 705,326 685,310 710,308"
                  fill="#ffffff"
                  stroke="#22d3ee"
                  strokeWidth="2.5"
                />
              </g>
            )}
          </svg>

          {/* TOP ARENA HEADER: 1 Clean HP Bar + 1 Element Badge Each */}
          <div className="relative z-20 flex flex-wrap items-start justify-between gap-2 px-3 pt-2.5 sm:px-5">
            {/* TOP-LEFT: PLAYER PET HP BAR + 1 ELEMENT BADGE */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTab('hub')}
                className="flex items-center gap-1 rounded-xl border-[3px] border-[#1a162b] bg-[#fff8e7] hover:bg-[#ffd54f] px-2.5 py-2 text-xs font-black uppercase text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
                title="Back to World Hub"
              >
                <Map className="h-3.5 w-3.5" />
                <span>Hub</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const playing = juice.toggleCombatMusic();
                  setCombatMusicOn(playing);
                }}
                className={`flex items-center justify-center rounded-xl border-[3px] border-[#1a162b] px-2.5 py-2 text-xs font-black shadow-[0_3px_0_#1a162b] cursor-pointer ${
                  combatMusicOn
                    ? 'bg-[#fde047] text-[#1a162b]'
                    : 'bg-[#1e293b]/90 text-slate-300 hover:bg-slate-800'
                }`}
                title="Toggle Battle Music"
              >
                {combatMusicOn ? '🎵 On' : '🎵'}
              </button>

              <div className="w-56 sm:w-64 rounded-2xl border-[3px] border-[#1a162b] bg-[#1e293b]/95 p-2.5 text-white shadow-[0_4px_0_#1a162b]">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-display text-sm sm:text-base font-black text-[#fde047] truncate">
                    {player.name}
                  </span>
                  {/* 1 Clean Element Badge */}
                  <span className="shrink-0 rounded-full border border-[#1a162b] bg-white/95 px-2.5 py-0.5 font-display text-xs font-black text-[#1a162b] shadow-xs">
                    {playerElem.icon} {playerElem.name}
                  </span>
                </div>
                <div className="relative h-6 w-full overflow-hidden rounded-xl border-2 border-[#1a162b] bg-slate-950">
                  <div
                    className="h-full bg-gradient-to-r from-[#22c55e] via-[#4ade80] to-[#86efac] transition-all duration-500"
                    style={{ width: `${playerHpPct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-black text-white drop-shadow-[0_1px_1px_#000]">
                    ❤️ {player.currentHp ?? player.stats.hp} / {player.maxHp ?? player.stats.hp} HP
                    {(player.shield ?? 0) > 0 ? ` (+🛡️${player.shield})` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* TOP-CENTER: SIMPLE TURN SIGNBOARD */}
            <div className="relative hidden md:flex flex-col items-center">
              <div className="rounded-2xl border-[3px] border-[#451a03] bg-gradient-to-b from-[#b45309] via-[#92400e] to-[#78350f] px-5 py-1.5 text-center shadow-[0_4px_0_#270e02]">
                <div className="font-display text-sm sm:text-base font-black text-white drop-shadow-[0_1.5px_0_#1a162b]">
                  {isBattleOver
                    ? winner === player.id
                      ? '🏆 You Won!'
                      : '⚡ Battle Over'
                    : `Your Turn!`}
                </div>
                <div className="text-[11px] font-black text-[#fde047]">
                  Stage {activeNodeId}
                </div>
              </div>
            </div>

            {/* TOP-RIGHT: BOSS PET HP BAR (WITH GHOST HP GLOW) + 1 ELEMENT BADGE */}
            <div className="flex items-center gap-2">
              <div className="w-56 sm:w-64 rounded-2xl border-[3px] border-[#1a162b] bg-[#1e293b]/95 p-2.5 text-white shadow-[0_4px_0_#1a162b]">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-display text-sm sm:text-base font-black text-rose-300 truncate">
                    {displayEnemyName}
                  </span>
                  {/* 1 Clean Element Badge */}
                  <span className="shrink-0 rounded-full border border-[#1a162b] bg-white/95 px-2.5 py-0.5 font-display text-xs font-black text-[#1a162b] shadow-xs">
                    {enemyElem.icon} {enemyElem.name}
                  </span>
                </div>
                <div
                  className={`relative h-6 w-full overflow-hidden rounded-xl border-2 border-[#1a162b] bg-slate-950 transition-all ${
                    livePreview.wouldDefeatEnemy ? 'lethal-shatter-bar' : ''
                  }`}
                >
                  {/* Pulsing Ghost HP Glow showing projected damage before casting */}
                  <div
                    className={`absolute inset-y-0 left-0 bg-amber-400/85 transition-all duration-300 ${
                      livePreview.isValid && livePreview.projectedDamage > 0 ? 'animate-pulse' : ''
                    }`}
                    style={{ width: `${enemyHpPct}%` }}
                  />
                  <div
                    className="relative h-full bg-gradient-to-r from-[#e11d48] via-[#f43f5e] to-[#fb7185] transition-all duration-300"
                    style={{
                      width: `${
                        livePreview.isValid && livePreview.projectedEnemyHpDropPct > 0
                          ? livePreview.projectedEnemyHpAfterPct
                          : enemyHpPct
                      }%`,
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-black text-white drop-shadow-[0_1px_1px_#000]">
                    ❤️ {enemy.currentHp ?? enemy.stats.hp} / {enemy.maxHp ?? enemy.stats.hp} HP
                    {livePreview.isValid && livePreview.projectedDamage > 0
                      ? ` (−${livePreview.projectedDamage})`
                      : ''}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => restartBattle()}
                className="flex items-center gap-1 rounded-xl border-[3px] border-[#1a162b] bg-[#1a162b]/90 hover:bg-slate-800 px-2.5 py-2 text-xs font-black text-amber-200 shadow-[0_3px_0_#090714] cursor-pointer"
                title="Restart Battle"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* MAIN ARENA STAGE: PET VS. BOSS PET */}
          <div className="relative z-20 grid grid-cols-1 md:grid-cols-12 items-end gap-2 px-3 pb-4 pt-2 sm:px-6">
            {/* LEFT 4 COLS: PLAYER SQUAD */}
            <div className="md:col-span-4 relative flex items-end justify-center gap-3 min-h-[195px]">
              <div className="hidden sm:flex flex-col items-center gap-2 pb-2 opacity-95">
                <div
                  className="relative flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-[#1a162b] text-2xl shadow-[0_4px_0_#1a162b]"
                  style={{ backgroundColor: currentUser?.avatarConfig?.colorTheme || '#3b82f6' }}
                >
                  <span>{currentUser?.avatarConfig?.emoji || '🦊'}</span>
                </div>

                {sidekickPet && (
                  <button
                    type="button"
                    onClick={() => {
                      setPlayerId(sidekickPet.id);
                      restartBattle(sidekickPet.id);
                    }}
                    title={`Tag in ${sidekickPet.name}`}
                    className={`group relative flex flex-col items-center cursor-pointer transition-transform ${
                      sidekickAnim === 'lunge'
                        ? 'translate-x-8 -translate-y-3 scale-115'
                        : 'hover:scale-105'
                    }`}
                  >
                    <CreatureSprite
                      creatureId={sidekickPet.forged?.sourceId || sidekickPet.id}
                      stage={sidekickPet.stage || 1}
                      element={sidekickPet.element}
                      secondaryElement={sidekickPet.infusionElement}
                      accessoryId={petAccessories[sidekickPet.id]}
                      isPrismatic={(petBonds[sidekickPet.id] || 1) >= 5}
                      mood={tagTeamComboActive ? 'happy' : 'idle'}
                      size="sm"
                      facing="right"
                      isAttacking={sidekickAnim === 'lunge'}
                    />
                  </button>
                )}
              </div>

              <div className="relative flex flex-col items-center pb-2">
                {floatingNumbers
                  .filter((f) => f.target === 'player')
                  .map((f) => (
                    <div
                      key={f.id}
                      className={`pointer-events-none absolute -top-8 z-30 rounded-xl border-[3px] px-3 py-1 font-mono text-sm font-black shadow-lg animate-bounce ${f.color}`}
                    >
                      {f.text}
                    </div>
                  ))}

                <CreatureSprite
                  creatureId={fullPlayerCreature.forged?.sourceId || player.id}
                  stage={fullPlayerCreature.stage || 1}
                  element={player.element}
                  secondaryElement={
                    fullPlayerCreature.infusionElement || fullPlayerCreature.allowedElements?.[1]
                  }
                  accessoryId={petAccessories[player.id]}
                  isPrismatic={(petBonds[player.id] || 1) >= 5}
                  mood={
                    isBattleOver && winner === player.id
                      ? 'happy'
                      : hasGrammarMistake
                      ? 'dizzy'
                      : selectedWords.length > 0 && previewCombo.valid
                      ? 'charging'
                      : (player.shield ?? 0) > 0
                      ? 'shielded'
                      : 'idle'
                  }
                  size="xl"
                  facing="right"
                  isAttacking={playerAnim === 'lunge'}
                  isHit={playerAnim === 'hit'}
                />
              </div>
            </div>

            {/* CENTER 4 COLS: ON-DEMAND HELP HINT / LAST SPOKEN SENTENCE */}
            <div className="md:col-span-4 flex flex-col items-center justify-end my-1 gap-2">
              {battleState.lastPlayerResolution && !isCoachVisible && (
                <div className="w-full max-w-xs rounded-2xl border-[3px] border-[#1a162b] bg-[#fff8e7]/95 px-4 py-2 text-center shadow-[0_4px_0_#1a162b]">
                  <div className="text-xs font-bold text-[#5d4037]">Last Spell Cast:</div>
                  <span className="font-display text-sm sm:text-base font-black text-[#1a162b] block truncate">
                    “{battleState.lastPlayerResolution.combo.phrase}”
                  </span>
                </div>
              )}

              {isCoachVisible && (
                <div className="w-full max-w-xs rounded-2xl border-[3px] border-[#1a162b] bg-[#1e293b]/95 p-3 text-white shadow-[0_5px_0_#1a162b] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-xs font-black text-[#fde047]">
                      💡 {hasGrammarMistake ? 'Word Order Tip' : 'Sentence Helper'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCoachHint(false)}
                      className="rounded-lg bg-white/15 hover:bg-rose-500 px-2 py-0.5 text-xs font-black text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  {hasGrammarMistake ? (
                    <div className="rounded-xl bg-amber-500/20 border border-amber-300/60 p-2 text-xs font-bold text-amber-100 space-y-1.5">
                      <p>{previewCombo.reasons[0] || 'Put your words in order: Adjective → Noun → Verb → Adverb!'}</p>
                      <button
                        type="button"
                        onClick={handleFixGrammarOrder}
                        className="w-full rounded-lg border border-[#1a162b] bg-[#fde047] py-1 font-display text-xs font-black text-[#1a162b] cursor-pointer"
                      >
                        ⇄ Fix Word Order for Me!
                      </button>
                    </div>
                  ) : (
                    <AdaptiveTutorCoachBar insight={tutorInsight} />
                  )}
                </div>
              )}
            </div>

            {/* RIGHT 4 COLS: BOSS PET SPRITE */}
            <div className="md:col-span-4 relative flex items-end justify-center gap-2 min-h-[195px]">
              <div className="relative flex flex-col items-center pb-2">
                {floatingNumbers
                  .filter((f) => f.target === 'enemy')
                  .map((f) => (
                    <div
                      key={f.id}
                      className={`pointer-events-none absolute -top-8 z-30 rounded-xl border-[3px] px-3 py-1 font-mono text-sm font-black shadow-lg animate-bounce ${f.color}`}
                    >
                      {f.text}
                    </div>
                  ))}

                <CreatureSprite
                  creatureId={enemy.id}
                  stage={displayEnemyStage}
                  element={enemy.element}
                  size={displayEnemyStage === 1 ? 'lg' : 'xl'}
                  facing="left"
                  isAttacking={enemyAnim === 'lunge'}
                  isHit={enemyAnim === 'hit'}
                />
              </div>
            </div>
          </div>

          {/* DEFEAT OVERLAY */}
          {isBattleOver && winner !== player.id && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#1a162b]/85 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-3xl border-[4px] border-[#1a162b] bg-[#fff8e7] p-6 text-center shadow-[0_10px_0_#1a162b] space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-[#1a162b] bg-[#ffd54f]">
                  <Award className="h-10 w-10 text-[#1a162b]" />
                </div>
                <h3 className={`${getDualTierTypographyClasses('boss-banner')} text-2xl sm:text-3xl font-black text-[#1a162b]`}>
                  ⚡ Try Again!
                </h3>
                <p className="text-xs sm:text-sm font-bold text-[#4e342e]">
                  {`Build a full 4-word sentence or use ${enemyWeakElem.name} words to beat ${enemy.name}!`}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => restartBattle()}
                    className="rounded-xl border-[3px] border-[#1a162b] bg-[#ffd54f] hover:bg-[#ffca28] px-4 py-2.5 text-xs font-black uppercase text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('hub')}
                    className="rounded-xl border-[3px] border-[#1a162b] bg-[#4caf50] hover:bg-[#66bb6a] px-4 py-2.5 text-xs font-black uppercase text-white shadow-[0_3px_0_#1a162b] cursor-pointer"
                  >
                    Back to Hub
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ====================================================================
            ZONE 2 & ZONE 3 CONTAINER:
            - Zone 2: Center Sentence Tray (4 colored slots + 🔊 Read Aloud + 💡 Help)
            - Zone 3: Bottom Rack (4 clean Word Cards) + Action Dock (⚡ CAST SPELL + Pet Skill + Clear)
           ==================================================================== */}
        <div className="rounded-3xl border-[4px] border-[#1a162b] bg-[#1e293b] p-3 text-white shadow-[0_7px_0_#090714] space-y-3">
          {/* VICTORY BANNER & LOOT */}
          {isBattleOver && winner === player.id ? (
            <div className="rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-r from-[#fef9c3] via-[#fde68a] to-[#fcd34d] p-4 text-[#1a162b] shadow-[0_5px_0_#1a162b] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="rounded-lg bg-[#1a162b] px-2.5 py-0.5 font-display text-xs font-black uppercase text-[#fde047]">
                    🏆 Stage {activeNodeId} Victory!
                  </span>
                  <h3 className="font-display text-lg sm:text-xl font-black text-[#1a162b] mt-1">
                    🎉 You defeated {enemy.name}! Tap your rewards below:
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      juice.fanfare();
                      advanceToNextNode();
                    }}
                    className="rounded-xl border-[3px] border-[#1a162b] bg-gradient-to-b from-[#4ade80] to-[#16a34a] hover:brightness-110 px-4 py-2 text-xs font-black uppercase text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
                  >
                    ⚔️ Next Battle →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnToWordWorldMap(true);
                      setTab('hub');
                    }}
                    className="rounded-xl border-[3px] border-[#1a162b] bg-gradient-to-b from-[#38bdf8] to-[#0284c7] hover:brightness-110 px-3.5 py-2 text-xs font-black uppercase text-white shadow-[0_3px_0_#1a162b] cursor-pointer"
                  >
                    🗺️ Map
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {inlineLootDrops.map((loot) => {
                  const sem = SEMANTIC_COLOR_GRAMMAR[loot.semanticCategory];
                  return (
                    <button
                      key={loot.id}
                      type="button"
                      onClick={() => {
                        if (loot.claimed) return;
                        setInlineLootDrops((prev) =>
                          prev.map((item) => (item.id === loot.id ? { ...item, claimed: true } : item))
                        );
                        if (loot.type === 'gold-pouch') {
                          addRewards({ coins: 35, tokens: 1, xp: 20 });
                        } else if (loot.type === 'tile-stamp') {
                          setTileBag((prev) => {
                            const target = prev.remainingPool[0] || prev.currentHand[0];
                            return target ? applyPermanentStampToTile(prev, target.id, 'gilded') : prev;
                          });
                        } else {
                          increasePetBond(player.id, 1);
                        }
                        juice.fanfare();
                      }}
                      className={`spring-tile-motion flex items-center justify-between rounded-2xl border-[3px] border-[#1a162b] p-3 text-left cursor-pointer ${
                        loot.claimed ? 'bg-emerald-200 opacity-85' : 'tile-mat-ivory hover:-translate-y-1'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{loot.icon}</span>
                        <div>
                          <div className="font-display text-xs sm:text-sm font-black text-[#1a162b]">
                            {loot.title}
                          </div>
                          <div className="text-[11px] font-bold text-[#5d4037]">{loot.subtitle}</div>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg border border-[#1a162b] px-2 py-0.5 text-[10px] font-black uppercase ${
                          loot.claimed ? 'bg-emerald-600 text-white' : `${sem.badgeBg} ${sem.badgeText}`
                        }`}
                      >
                        {loot.claimed ? '✓ Got It!' : 'Tap!'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* ==================================================================
              ZONE 2: CENTER SENTENCE TRAY
              Only the 4 colored sentence slots (Adjective, Noun, Verb, Adverb)
              + 🔊 Read Aloud + 💡 Help.
             ================================================================== */}
          <div
            className={`rounded-2xl border-[3px] border-[#1a162b] p-3 text-[#1a162b] transition-all space-y-2.5 ${
              previewCombo.valid ? 'valid-ligature-tray' : 'bg-[#fef9c3]/95 shadow-inner'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-xl bg-[#1a162b] px-3 py-1 font-display text-xs font-black uppercase text-[#fde047]">
                  {previewCombo.valid ? '✨ Spell Ready!' : '🧩 Build Your Sentence'}
                </span>
                <span className="text-sm sm:text-base font-black text-[#451a03]">
                  {selectedWords.length > 0
                    ? `“${previewCombo.phrase}”`
                    : 'Tap the Word Cards below to build your spell!'}
                </span>
              </div>

              {/* Only 🔊 Read Aloud + 💡 Help */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleKaraokeReadSentence}
                  className={`rounded-xl border-2 border-[#1a162b] px-3.5 py-1.5 text-xs sm:text-sm font-display font-black shadow-[0_2px_0_#1a162b] cursor-pointer ${
                    karaokeWordIdx !== null || isListeningVoice
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-sky-200 hover:bg-sky-300 text-[#1a162b]'
                  }`}
                  title="Read your sentence aloud"
                >
                  🔊 Read Aloud
                </button>

                <button
                  type="button"
                  onClick={handleHelpButton}
                  className={`rounded-xl border-2 border-[#1a162b] px-3.5 py-1.5 text-xs sm:text-sm font-display font-black shadow-[0_2px_0_#1a162b] cursor-pointer ${
                    showCoachHint || highlightedSlotIdx !== null
                      ? 'bg-[#fde047] text-[#1a162b]'
                      : 'bg-amber-200 hover:bg-amber-300 text-[#1a162b]'
                  }`}
                  title="Get a helpful hint"
                >
                  💡 Help
                </button>
              </div>
            </div>

            {/* 4 Colored Sentence Slots (Adjective, Noun, Verb, Adverb) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {runeSlots.map((slotConfig, idx) => {
                const { pos } = slotConfig;
                const posMeta = getPartOfSpeechMeta(pos);
                const wordAtSlot = selectedWords[idx] || null;
                const isKaraokeActive = karaokeWordIdx === idx;
                const isCascadePopping = activeCascadeIdx === idx;
                const isNextSlotHighlighted = highlightedSlotIdx === idx;
                const wordMeta = wordAtSlot ? getPartOfSpeechMeta(wordAtSlot.partOfSpeech) : posMeta;

                return (
                  <div
                    key={pos}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const droppedId = draggedWordId || e.dataTransfer.getData('text/plain');
                      const foundWord = allWords.find((w) => w.id === droppedId);
                      if (foundWord && !selectedWordIds.includes(foundWord.id)) {
                        handleToggleWordCard(foundWord);
                      }
                      setDraggedWordId(null);
                    }}
                    onClick={() => {
                      if (wordAtSlot) {
                        handleToggleWordCard(wordAtSlot);
                      } else if (slotConfig.word) {
                        handleToggleWordCard(slotConfig.word);
                      }
                    }}
                    className={`spring-tile-motion flex flex-col justify-center rounded-2xl border-[3px] px-3.5 py-2.5 cursor-pointer transition-all ${
                      isCascadePopping
                        ? 'border-[#1a162b] bg-[#fde047] -translate-y-1.5 scale-105 ring-4 ring-emerald-400'
                        : isKaraokeActive
                        ? 'border-[#1a162b] bg-[#fde047] ring-4 ring-rose-500 scale-105'
                        : isNextSlotHighlighted
                        ? 'border-[#1a162b] bg-[#fde047] ring-4 ring-amber-400 scale-105 animate-pulse'
                        : wordAtSlot
                        ? slotConfig.slotActiveBg
                        : `${slotConfig.slotBg} border-dashed hover:brightness-95`
                    }`}
                  >
                    <div className="flex items-center gap-1 text-xs font-black uppercase opacity-85">
                      <span>
                        {idx + 1}. {wordMeta.icon} {wordMeta.label}
                      </span>
                    </div>
                    <div className={`${getDualTierTypographyClasses('tile-face')} text-base sm:text-lg font-black text-[#1a162b] truncate mt-0.5`}>
                      {wordAtSlot ? (
                        wordAtSlot.word
                      ) : (
                        <span className="opacity-55 font-bold text-sm">
                          + Tap {posMeta.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ==================================================================
              ZONE 3: BOTTOM RACK + ACTION DOCK
              Only the 4 clean Word Cards (Word + color-coded Role Pill + 🔊)
              and 1 big ⚡ CAST SPELL button (plus Pet Skill and Clear).
             ================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            {/* 4 Clean Word Cards (8 Cols) */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {runeSlots.map((slot, origIdx) => {
                if (!slot.word) return null;
                const { pos, word } = slot;
                const slotIndex = selectedWordIds.indexOf(word.id);
                const isSelected = slotIndex !== -1;
                const isKaraokeActive = isSelected && karaokeWordIdx === slotIndex;
                const isNextSlotHighlighted = !isSelected && highlightedSlotIdx === origIdx;
                const posMeta = getPartOfSpeechMeta(pos);
                const material = getTactileTileMaterial({ word: word.word });

                return (
                  <div
                    key={pos}
                    draggable={!isBattleOver}
                    onDragStart={(e) => {
                      setDraggedWordId(word.id);
                      e.dataTransfer.setData('text/plain', word.id);
                    }}
                    onDragEnd={() => setDraggedWordId(null)}
                    onClick={() => handleToggleWordCard(word)}
                    title={`${word.word} (${posMeta.label}): ${word.definition}`}
                    className={`spring-tile-motion relative flex flex-col justify-between rounded-2xl border-[3px] p-3 cursor-pointer ${material.cssClass} ${
                      isKaraokeActive
                        ? 'ring-4 ring-rose-500 scale-105 border-[#1a162b]'
                        : isNextSlotHighlighted
                        ? 'ring-4 ring-amber-400 scale-105 border-[#1a162b]'
                        : isSelected
                        ? 'ring-4 ring-[#fde047] -translate-y-1.5 border-[#1a162b]'
                        : 'border-[#1a162b] hover:-translate-y-1'
                    }`}
                  >
                    {/* Color-Coded Role Pill + 🔊 Speaker Button */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`rounded-xl border-2 px-2.5 py-0.5 font-display text-xs font-black ${posMeta.pillBg} ${posMeta.pillText} ${posMeta.cardBorder}`}
                      >
                        {posMeta.icon} {posMeta.label}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          juice.speakWord(`${word.word}. ${word.definition}`);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#1a162b] bg-white text-[#1a162b] hover:bg-[#fde047] shadow-[0_2px_0_#1a162b] cursor-pointer"
                        title={`Hear "${word.word}"`}
                        aria-label={`Hear ${word.word}`}
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Clean Word Centerpiece + Kid-Friendly Meaning */}
                    <div className="my-2 flex flex-col items-center justify-center rounded-xl border-2 border-[#1a162b]/20 bg-white/95 py-2.5 px-2 text-center shadow-inner">
                      <span className={`${getDualTierTypographyClasses('tile-face')} text-xl sm:text-2xl font-black text-[#1a162b] break-words leading-tight`}>
                        {word.word}
                      </span>
                      <span className="mt-1 text-[11px] font-bold text-slate-600 line-clamp-1">
                        {word.definition}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border-2 border-[#1a162b] bg-[#fde047] px-2.5 py-0.5 font-mono text-xs font-black text-[#1a162b] shadow">
                        #{slotIndex + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Dock: 1 Big ⚡ CAST SPELL Button + Pet Skill + Clear (4 Cols) */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-2.5 rounded-2xl border-[3px] border-[#2dd4bf] bg-[#fef9c3] p-3 text-[#1a162b] shadow-[0_5px_0_#0f766e]">
              <button
                type="button"
                disabled={!previewCombo.valid || isBattleOver}
                onClick={handleLaunchWordStrike}
                className={`spring-tile-motion flex-1 flex items-center justify-center gap-2.5 rounded-2xl border-[3px] px-5 py-4 font-display text-lg sm:text-xl font-black uppercase tracking-wider ${
                  previewCombo.valid && !isBattleOver
                    ? 'border-[#1a162b] bg-gradient-to-b from-[#4ade80] to-[#16a34a] text-[#1a162b] shadow-[0_5px_0_#1a162b] hover:brightness-105 cursor-pointer'
                    : 'border-slate-400 bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Zap className="h-6 w-6 fill-current" />
                <span>⚡ CAST SPELL</span>
              </button>

              {/* Pet Skill & Clear Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isPlayerReadyToEvolve) {
                      setEvolvingCreatureId(fullPlayerCreature.id);
                    } else {
                      handleWeaveFullSentence();
                    }
                  }}
                  className="flex-1 rounded-xl border-2 border-[#1a162b] bg-purple-200 hover:bg-purple-300 px-3 py-2 font-display text-xs sm:text-sm font-black uppercase text-purple-950 shadow-[0_2px_0_#1a162b] cursor-pointer"
                  title="Use Pet Skill (Auto-build 4-Word Sentence or Evolve)"
                >
                  {isPlayerReadyToEvolve ? '★ Evolve Pet' : '🐾 Pet Skill'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowReserveDrawer((prev) => !prev)}
                  className="rounded-xl border-2 border-[#1a162b] bg-amber-200 hover:bg-amber-300 px-3 py-2 font-display text-xs sm:text-sm font-black uppercase text-[#1a162b] shadow-[0_2px_0_#1a162b] cursor-pointer"
                  title="Swap Word Cards"
                >
                  {showReserveDrawer ? 'Close' : '📖 Words'}
                </button>

                <button
                  type="button"
                  disabled={selectedWords.length === 0}
                  onClick={() => setSelectedWordIds([])}
                  className={`rounded-xl border-2 px-3.5 py-2 font-display text-xs sm:text-sm font-black uppercase transition ${
                    selectedWords.length > 0
                      ? 'border-[#1a162b] bg-white hover:bg-rose-100 text-rose-700 shadow-[0_2px_0_#1a162b] cursor-pointer'
                      : 'border-stone-300 bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  ✕ Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* OPTIONAL WORD SWAP DRAWER */}
        {showReserveDrawer && (
          <div className="rounded-2xl border-[3px] border-[#1a162b] bg-[#fff8e7] p-3 shadow-[0_5px_0_#1a162b] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-display text-xs sm:text-sm font-black text-[#1a162b]">
                📖 Pick Any Word Card to Swap into Your Deck
              </span>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setGradeFilter('all')}
                  className={`rounded-lg px-2 py-0.5 text-xs font-black uppercase cursor-pointer border border-[#1a162b] ${
                    gradeFilter === 'all'
                      ? 'bg-[#2e7d32] text-white'
                      : 'bg-emerald-100 text-[#1a162b]'
                  }`}
                >
                  All
                </button>
                {GRADE_TIERS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setGradeFilter(t.id)}
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase cursor-pointer ${
                      gradeFilter === t.id
                        ? 'bg-[#1a162b] text-[#fde047]'
                        : 'bg-amber-200/70 text-[#1a162b]'
                    }`}
                  >
                    {t.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredReserveWords.map((w) => {
                const tMeta = getGradeTierMeta(w.gradeTier);
                const el = ELEMENTS[w.element] || ELEMENTS.fire;
                const isEquipped = playerLoadout[w.partOfSpeech] === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      updatePetLoadout(fullPlayerCreature.id, w.partOfSpeech, w.id);
                      handleToggleWordCard(w);
                    }}
                    className={`flex flex-col justify-between rounded-xl border-2 p-2 text-left transition cursor-pointer ${
                      isEquipped
                        ? 'border-amber-600 bg-amber-100/90 shadow-xs'
                        : 'border-[#d7c097] bg-white hover:border-amber-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-black uppercase text-[#7a4b2a]">
                        {w.partOfSpeech}
                      </span>
                      <span
                        className={`rounded px-1 py-0.2 text-[8px] font-black ${tMeta.badgeBg} ${tMeta.badgeText}`}
                      >
                        {tMeta.shortLabel}
                      </span>
                    </div>
                    <div className="my-0.5 font-display text-sm font-black text-[#2b1d12]">
                      {el.icon} {w.word}
                    </div>
                    <div className="text-[10px] text-[#6b4423] line-clamp-1">{w.definition}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* EVOLUTION MODAL */}
      {evolvingCreatureId && (
        <EvolutionSequenceModal
          creature={fullPlayerCreature}
          onComplete={() => {
            evolvePet(fullPlayerCreature.id);
            setEvolvingCreatureId(null);
          }}
          onClose={() => setEvolvingCreatureId(null)}
        />
      )}
    </div>
  );
};
export default BattleView;