import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  RotateCcw,
  Swords,
  Heart,
  Zap,
  Award,
  Map,
  FastForward,
  Target,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { ELEMENTS, OPPOSITE_ELEMENT } from '../data/elements';
import { evaluateCombo } from '../engine/combat';
import { getAllWordsList } from '../engine/forge';
import { Word, PartOfSpeech, GradeTier } from '../types';
import { juice } from '../engine/juice';
import { canPetEvolve } from '../data/evolutionData';
import { EvolutionSequenceModal } from './EvolutionSequenceModal';
import { CreatureSprite } from './CreatureSprite';
import { GRADE_TIERS, getGradeTierMeta, getPartOfSpeechMeta } from '../data/vocabDatabase';
import { ZONE_BIOMES } from '../data/realms';
import {
  PASSIVE_TRAITS,
  ACCESSORY_LABELS,
  BattleMiniGameControls,
  AdaptiveTutorCoachBar,
} from './battle/BattleMiniGames';

export const BattleView: React.FC = () => {
  const {
    creatures,
    words,
    playerId,
    setPlayerId,
    battleState,
    submitCombo,
    restartBattle,
    goToLoadout,
    activeZoneId,
    activeNodeId,
    setActiveNodeId,
    setReturnToWordWorldMap,
    setTab,
    levelUpPet,
    evolvePet,
    updatePetLoadout,
    activeEnemyName,
    activeEnemyStage,
    preferredGradeBand,
    setPreferredGradeBand,
    activeWeather,
    cycleRealmWeather,
    petAccessories,
    supportCreatureId,
    petBonds,
    increasePetBond,
    addMistakeWord,
    advanceToNextNode,
    tutorInsight,
    dyslexiaFriendly,
    setDyslexiaFriendly,
    calmAnimations,
    setCalmAnimations,
  } = useGame();
  const { currentUser, addRewards } = useAuth();

  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [showReserveDrawer, setShowReserveDrawer] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<GradeTier | 'all'>('all');
  const [fastMode, setFastMode] = useState(false);
  const [projectileBurst, setProjectileBurst] = useState<boolean>(false);
  const [tagTeamComboActive, setTagTeamComboActive] = useState<boolean>(false);

  // Accessibility #3 & #2: Consolidated Battle Options Popover & Turn-Triggered Mini-Game Drawer
  const [showBattleOptions, setShowBattleOptions] = useState<boolean>(false);
  const [showMiniGameModal, setShowMiniGameModal] = useState<boolean>(false);

  // Accessibility #13: Karaoke-Style Word Highlighting index during TTS Read-Aloud
  const [karaokeWordIdx, setKaraokeWordIdx] = useState<number | null>(null);

  // Feature #2: Live Prefix & Suffix Combat Modifiers
  const [activeAffixChip, setActiveAffixChip] = useState<string | null>(null);

  // Feature #9: Timed 12s Speed-Scribe Challenge Mode
  const [speedScribeActive, setSpeedScribeActive] = useState<boolean>(false);
  const [speedScribeSeconds, setSpeedScribeSeconds] = useState<number>(12);

  // Feature #17: Voice Read-Along Pronunciation Check state
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  // Efficiency #4: Simplified Collapsible HUD Traits Drawer
  const [showCompactTraits, setShowCompactTraits] = useState<boolean>(false);

  // Feature #7: Elemental Terrain & Field Hazards state
  const [activeTerrain, setActiveTerrain] = useState<{
    name: string;
    effect: string;
    turnsLeft: number;
  } | null>(null);

  // Feature #13: Phonetics & Syllable Clapper Breakdown toggle
  const [showSyllables, setShowSyllables] = useState<boolean>(false);

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

  // Player's reserve companions for party pips & Support Tag-Team (Feature #5)
  const unlockedPets = creatures.filter((c) => !c.id.startsWith('boss_'));
  const sidekickPet =
    unlockedPets.find((c) => c.id === supportCreatureId && c.id !== player.id) ||
    unlockedPets.find((c) => c.id !== player.id) ||
    unlockedPets[0];

  // Equipped words for the 4 parts of speech
  const playerLoadout = fullPlayerCreature.loadout || {
    adjective: 'blazing',
    noun: 'flame',
    verb: 'ignite',
    adverb: 'fiercely',
  };

  const getEquippedWord = (pos: PartOfSpeech): Word | null => {
    const id = playerLoadout[pos];
    if (id) {
      const found = allWords.find((w) => w.id === id);
      if (found) return found;
    }
    return allWords.find((w) => w.partOfSpeech === pos) || null;
  };

  const equippedAdj = getEquippedWord('adjective');
  const equippedNoun = getEquippedWord('noun');
  const equippedVerb = getEquippedWord('verb');
  const equippedAdv = getEquippedWord('adverb');

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

  // Round counter derived from battle log
  const roundNumber = Math.max(1, Math.ceil((log?.length || 0) / 2) + 1);

  // Clear selections on battle change
  useEffect(() => {
    setSelectedWordIds([]);
    setRewardClaimed(false);
  }, [playerId, activeZoneId, enemy.id]);

  // Reward & Pet EXP on Victory + Companion Bond Increase (#13)
  useEffect(() => {
    if (isBattleOver && winner === player.id && !rewardClaimed) {
      setRewardClaimed(true);
      addRewards({ coins: 65, tokens: 1, xp: 45, wonBattle: true });
      levelUpPet(player.id, 1);
      increasePetBond(player.id, 1);
    }
  }, [isBattleOver, winner, player.id, rewardClaimed, addRewards, levelUpPet, increasePetBond]);

  // Feature #9: 12-Second Speed-Scribe Countdown Timer
  useEffect(() => {
    if (!speedScribeActive || isBattleOver) return;
    if (speedScribeSeconds <= 0) {
      setSpeedScribeSeconds(12);
      return;
    }
    const timer = setTimeout(() => setSpeedScribeSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [speedScribeActive, speedScribeSeconds, isBattleOver]);

  // Combat event animations + TTS
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
          setTimeout(() => setEnemyAnim('hit'), fastMode ? 80 : 160);
          setTimeout(() => {
            setPlayerAnim('idle');
            setEnemyAnim('idle');
            setProjectileBurst(false);
          }, fastMode ? 320 : 600);
        } else {
          setEnemyAnim('lunge');
          setTimeout(() => setPlayerAnim('hit'), fastMode ? 80 : 160);
          setTimeout(() => {
            setEnemyAnim('idle');
            setPlayerAnim('idle');
          }, fastMode ? 320 : 600);
        }

        const fId = ++floatSeq.current;
        setFloatingNumbers((prev) => [
          ...prev,
          {
            id: fId,
            target: isEnemyTarget ? 'enemy' : 'player',
            text: `-${ev.amount} HP`,
            color: 'text-red-600 border-[#1a162b] bg-[#fff8e7]',
          },
        ]);
        setTimeout(() => {
          setFloatingNumbers((prev) => prev.filter((item) => item.id !== fId));
        }, 1200);
      } else if (ev.type === 'SHIELD' && ev.amount) {
        const isPlayerTarget = ev.attackerId === player.id;
        const fId = ++floatSeq.current;
        setFloatingNumbers((prev) => [
          ...prev,
          {
            id: fId,
            target: isPlayerTarget ? 'player' : 'enemy',
            text: `+${ev.amount} SHIELD`,
            color: 'text-sky-600 border-[#1a162b] bg-[#fff8e7]',
          },
        ]);
        setTimeout(() => {
          setFloatingNumbers((prev) => prev.filter((item) => item.id !== fId));
        }, 1200);
      }
    });
  }, [battleState.events, enemy.id, player.id, fastMode]);

  const handleToggleWordCard = (word: Word) => {
    if (isBattleOver) return;
    juice.click();
    juice.speakWord(word.word);

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

  const handleQuick2WordStrike = () => {
    if (isBattleOver) return;
    if (equippedAdv && equippedVerb) {
      juice.click();
      setSelectedWordIds([equippedAdv.id, equippedVerb.id]);
    }
  };

  const handleQuick2WordShield = () => {
    if (isBattleOver) return;
    if (equippedAdj && equippedNoun) {
      juice.click();
      setSelectedWordIds([equippedAdj.id, equippedNoun.id]);
    }
  };

  const handleFixGrammarOrder = () => {
    if (selectedWords.length < 2) return;
    juice.ding(780, 120);
    // If 2 words (Adverb + Verb), sort Adverb first then Verb
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
    // Otherwise sort into canonical [adjective, noun, verb, adverb] sentence order
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

  // Accessibility #13: Karaoke-style word-by-word highlighting during TTS read-aloud
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
    setVoiceFeedback('🔊 Reading sentence aloud with word tracking...');

    wordsToRead.forEach((_, idx) => {
      setTimeout(() => {
        setKaraokeWordIdx(idx);
      }, idx * 420);
    });

    setTimeout(() => {
      setKaraokeWordIdx(null);
      setIsListeningVoice(false);
      setVoiceFeedback('🌟 Great sentence rhythm! +15 🪙');
      addRewards({ coins: 15, tokens: 0, xp: 10 });
    }, wordsToRead.length * 420 + 250);
  };

  const handleLaunchWordStrike = () => {
    if (isBattleOver || !previewCombo.valid || selectedWords.length === 0) return;
    if (selectedWords.length === 4) {
      setSidekickAnim('lunge');
      setTagTeamComboActive(true);
      // Feature #7: Transform Battlefield into Elemental Terrain on 4-Word Ultimate
      const elemName = ELEMENTS[player.element]?.name || 'Elemental';
      setActiveTerrain({
        name: `${ELEMENTS[player.element]?.icon || '✨'} ${elemName} Sanctum Turf`,
        effect: `${elemName} Tablets +4 Power & +3 Regen`,
        turnsLeft: 3,
      });
      setTimeout(() => {
        setSidekickAnim('idle');
        setTagTeamComboActive(false);
      }, 900);
    } else if (activeTerrain) {
      setActiveTerrain((prev) =>
        prev && prev.turnsLeft > 1 ? { ...prev, turnsLeft: prev.turnsLeft - 1 } : null
      );
    }
    if (speedScribeActive && speedScribeSeconds > 0) {
      addRewards({ coins: 30, tokens: 1, xp: 20 });
      setSpeedScribeSeconds(12);
    }
    increasePetBond(player.id, 1);
    submitCombo(
      selectedWords[0].id,
      selectedWords[1]?.id || null,
      selectedWords[2]?.id || null,
      selectedWords[3]?.id || null
    );
    setSelectedWordIds([]);
    setActiveAffixChip(null);
  };

  // Accessibility #15: Keyboard Navigation (1-4 to toggle tablets, Space/Enter to Cast, Esc to clear/close)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === '1' && equippedAdj) {
        e.preventDefault();
        handleToggleWordCard(equippedAdj);
      } else if (e.key === '2' && equippedNoun) {
        e.preventDefault();
        handleToggleWordCard(equippedNoun);
      } else if (e.key === '3' && equippedVerb) {
        e.preventDefault();
        handleToggleWordCard(equippedVerb);
      } else if (e.key === '4' && equippedAdv) {
        e.preventDefault();
        handleToggleWordCard(equippedAdv);
      } else if ((e.key === ' ' || e.key === 'Enter') && previewCombo.valid && selectedWords.length > 0 && !isBattleOver) {
        e.preventDefault();
        handleLaunchWordStrike();
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        if (showBattleOptions) setShowBattleOptions(false);
        else if (showMiniGameModal) setShowMiniGameModal(false);
        else if (showReserveDrawer) setShowReserveDrawer(false);
        else if (selectedWordIds.length > 0) setSelectedWordIds([]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // Feature #5: Dual-Companion Elemental Cross-Combo Name
  const crossComboName =
    sidekickPet && sidekickPet.element !== player.element
      ? `${ELEMENTS[player.element]?.icon}${ELEMENTS[sidekickPet.element]?.icon} ${ELEMENTS[player.element]?.name}-${ELEMENTS[sidekickPet.element]?.name} Cross-Burst`
      : '⚡ Twin-Element Resonance';

  // Efficiency #5: Auto-Advance Sentence Slot Cursor (Adj -> Noun -> Verb -> Adverb)
  const nextRecommendedPos: PartOfSpeech =
    selectedWords.length === 0
      ? 'adjective'
      : selectedWords.length === 1
      ? 'noun'
      : selectedWords.length === 2
      ? 'verb'
      : 'adverb';

  // Feature #8 & #10: Companion Passive Trait & Equipped Accessory Badge
  const companionTrait = PASSIVE_TRAITS[player.element] || PASSIVE_TRAITS.fire;
  const equippedAccId = petAccessories[player.id] || 'amber_fang';
  const equippedAccLabel = ACCESSORY_LABELS[equippedAccId] || ACCESSORY_LABELS.amber_fang;

  const displayEnemyName = activeEnemyName || enemy.name;
  const displayEnemyStage: 1 | 2 | 3 = activeEnemyStage || 3;
  const enemyStageBadge =
    displayEnemyStage === 1
      ? '★ Vanguard 12'
      : displayEnemyStage === 2
      ? '★★ Mid-Boss 20'
      : '★★★ Guardian 30';

  // Improvement #8: Tactical Enemy Intent & Telegraph Bubble
  const enemyIntent =
    roundNumber % 3 === 1
      ? {
          icon: '⚔️',
          title: 'Heavy Crush Incoming',
          hint: 'Counter: Build a 2-Word Shield (Adj + Noun)!',
          actionLabel: 'Auto-Guard',
          onCounter: handleQuick2WordShield,
          color: 'from-amber-500 to-orange-600 border-amber-200',
        }
      : roundNumber % 3 === 2
      ? {
          icon: '🛡️',
          title: 'Iron Guard Stance',
          hint: 'Counter: Pierce with a 2-Word Strike (Adv + Verb)!',
          actionLabel: 'Auto-Pierce',
          onCounter: handleQuick2WordStrike,
          color: 'from-sky-500 to-blue-600 border-sky-200',
        }
      : {
          icon: '⚡',
          title: 'Elemental Surge Charging',
          hint: 'Counter: Weave a 4-Word Tag-Team Ultimate!',
          actionLabel: 'Weave 4-Word',
          onCounter: handleWeaveFullSentence,
          color: 'from-purple-600 to-rose-600 border-yellow-300',
        };

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
  const playerWeakElem = ELEMENTS[OPPOSITE_ELEMENT[player.element] || 'water'] || ELEMENTS.water;
  const enemyWeakElem = ELEMENTS[OPPOSITE_ELEMENT[enemy.element] || 'fire'] || ELEMENTS.fire;

  const filteredReserveWords = allWords.filter((w) => {
    const tier = w.gradeTier || '3';
    if (gradeFilter !== 'all') return tier === gradeFilter;
    if (preferredGradeBand === 'k-2') return ['K', '1', '2'].includes(tier);
    if (preferredGradeBand === '3-5') return ['3', '4', '5'].includes(tier);
    if (preferredGradeBand === '6-8') return ['5', 'extender'].includes(tier);
    return true;
  });

  // Power Pip Bar (Prodigy "Power: ■■■■□" style)
  const powerFilledPips = Math.min(
    5,
    Math.max(1, Math.ceil(((previewCombo.power || 0) + (previewCombo.shieldGain || 0)) / 12))
  );

  const runeSlots = [
    { pos: 'adjective' as PartOfSpeech, short: 'ADJ', label: 'Adjective', word: equippedAdj, color: '#f59e0b', bg: 'from-amber-400 to-orange-500' },
    { pos: 'noun' as PartOfSpeech, short: 'NOUN', label: 'Noun', word: equippedNoun, color: '#0ea5e9', bg: 'from-sky-400 to-blue-600' },
    { pos: 'verb' as PartOfSpeech, short: 'VERB', label: 'Verb', word: equippedVerb, color: '#ef4444', bg: 'from-rose-500 to-red-600' },
    { pos: 'adverb' as PartOfSpeech, short: 'ADV', label: 'Adverb', word: equippedAdv, color: '#a855f7', bg: 'from-purple-500 to-indigo-600' },
  ];

  return (
    <div className="h-full w-full overflow-y-auto bg-[#120e24] p-1.5 sm:p-2.5 select-none">
      <div className="mx-auto max-w-[1320px] space-y-2 pb-4">
        {/* ====================================================================
            1. PANORAMIC 2.5D BATTLE ARENA CANVAS
               Combines:
               - Prodigy Painterly Lawn, Ocean Horizon, Mushrooms & Floating Inline HP Bars
               - Dragon Quest Monsters Diamond Ranks, Round Counter & Fast Toggle
               - Pokémon Skewed Status Plates & Party Pips
               - Head-to-Head Hanging Wooden Turn Sign & Center Glowing 2x2 Rune Grid
           ==================================================================== */}
        <div className="relative overflow-hidden rounded-3xl border-[4px] border-[#1a162b] shadow-[0_8px_0_#090714] min-h-[430px] sm:min-h-[460px] flex flex-col justify-between">
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

            {/* Sky Backdrop */}
            <rect width="1280" height="500" fill={`url(#sky-${activeZoneId})`} />

            {/* Distant Fluffy Clouds & Pine Silhouette Hills (Head-to-Head + Prodigy style) */}
            <g opacity="0.35" fill={biome.horizonColor}>
              <circle cx="140" cy="180" r="70" />
              <circle cx="230" cy="190" r="55" />
              <circle cx="1050" cy="175" r="75" />
              <circle cx="1150" cy="190" r="60" />
            </g>

            {/* Shimmering Ocean / Elemental Horizon Band (Prodigy Reference #3) */}
            <rect x="0" y="165" width="1280" height="90" fill="url(#oceanHorizon)" opacity="0.75" />
            <path
              d="M80,190 H320 M480,205 H790 M920,188 H1180 M210,220 H540"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.55"
            />

            {/* Rolling Storybook Meadow & Arena Lawn */}
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

            {/* Pokémon Stadium / Champions Court Lines on the Turf (Reference #2) */}
            <g stroke="#ffffff" strokeWidth="3" opacity="0.45" fill="none">
              <ellipse cx="640" cy="390" rx="520" ry="95" />
              <ellipse cx="640" cy="390" rx="135" ry="42" />
              <line x1="640" y1="295" x2="640" y2="485" />
            </g>

            {/* Left Storybook Props: Pastel Trees & Spotted Red Mushroom (Prodigy Reference #3) */}
            <g stroke="#1a162b" strokeWidth="3" strokeLinejoin="round">
              {/* Trunk */}
              <path d="M55,255 L42,155 L82,155 L70,255 Z" fill="#7c4dff" opacity="0.85" />
              {/* Pastel Turquoise & Pink Canopy */}
              <ellipse cx="45" cy="145" rx="48" ry="34" fill="#2dd4bf" />
              <ellipse cx="95" cy="130" rx="52" ry="36" fill="#f472b6" />
              {/* Spotted Toadstool Mushroom */}
              <path d="M148,268 Q145,242 155,242 L175,242 Q185,242 182,268 Z" fill="#fef3c7" />
              <path d="M122,246 Q165,195 208,246 Z" fill="#ef4444" />
              <circle cx="150" cy="228" r="7" fill="#fef3c7" stroke="none" />
              <circle cx="178" cy="233" r="5.5" fill="#fef3c7" stroke="none" />
              <circle cx="165" cy="218" r="4.5" fill="#fef3c7" stroke="none" />
            </g>

            {/* Right Storybook Props: Carved Tree Stump & Crystal Spire (Prodigy Reference #3) */}
            <g stroke="#1a162b" strokeWidth="3" strokeLinejoin="round">
              <path d="M1135,260 L1150,215 L1215,215 L1232,260 Z" fill="#8d6e63" />
              <ellipse cx="1182" cy="215" rx="32" ry="11" fill="#d7ccc8" />
              <ellipse cx="1182" cy="215" rx="18" ry="6" fill="none" stroke="#5d4037" strokeWidth="2" />
            </g>

            {/* Stepped 3D Stone Pedestals for Left Squad (Reference #5) */}
            <g stroke="#1a162b" strokeWidth="3.5" strokeLinejoin="round">
              {/* Tamer Rear Stone Platform */}
              <ellipse cx="145" cy="348" rx="62" ry="20" fill="#78716c" />
              <ellipse cx="145" cy="340" rx="58" ry="17" fill="#a8a29e" />
              {/* Sidekick Lower Stone Platform */}
              <ellipse cx="120" cy="435" rx="58" ry="19" fill="#78716c" />
              <ellipse cx="120" cy="427" rx="54" ry="16" fill="#a8a29e" />
              {/* Active Companion Main Forward Stone Pedestal + Glowing Cyan Caster Ring (Reference #3) */}
              <ellipse cx="330" cy="395" rx="95" ry="30" fill="#57534e" />
              <ellipse cx="330" cy="385" rx="90" ry="26" fill="#a8a29e" />
              <ellipse
                cx="330"
                cy="383"
                rx="78"
                ry="21"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="5"
              />
            </g>

            {/* Stepped 3D Stone Pedestals for Right Boss & Minion (Reference #5) */}
            <g stroke="#1a162b" strokeWidth="3.5" strokeLinejoin="round">
              {/* Boss Main Stone Platform */}
              <ellipse cx="950" cy="395" rx="102" ry="32" fill="#44403c" />
              <ellipse cx="950" cy="385" rx="96" ry="27" fill="#78716c" />
              <ellipse
                cx="950"
                cy="383"
                rx="84"
                ry="22"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="5"
              />
              {/* Boss Sentinel / Minion Rear Platform */}
              <ellipse cx="1135" cy="350" rx="60" ry="19" fill="#57534e" />
              <ellipse cx="1135" cy="342" rx="56" ry="16" fill="#a8a29e" />
            </g>

            {/* Word Strike Starburst Projectile Trail + 2-Pet Tag-Team Beam on Attack */}
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

          {/* ==================================================================
              TOP ARENA HUD OVERLAY:
              - Left: Skewed Pokémon/Head-to-Head Player Plate + 3 Hearts + Party Pips
              - Center: Hanging Wooden Turn Signboard + DQM Diamond Enemy Roster
              - Right: Skewed Boss Status Plate + Round Diamond + World Map Exit
          =================================================================== */}
          <div className="relative z-20 flex flex-wrap items-start justify-between gap-2 px-3 pt-2.5 sm:px-5">
            {/* TOP-LEFT: SKEWED PLAYER TAMER & PARTY PLATE (References #2 & #5) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTab('hub')}
                  className="flex items-center gap-1 rounded-xl border-[3px] border-[#1a162b] bg-[#fff8e7] hover:bg-[#ffd54f] px-2.5 py-1.5 text-xs font-black uppercase text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
                  title="Return to Overworld Map"
                >
                  <Map className="h-3.5 w-3.5" />
                  <span>Map</span>
                </button>

                {/* Skewed Parallelogram Nameplate */}
                <div className="-skew-x-12 rounded-xl border-[3px] border-[#1a162b] bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#16a34a] px-4 py-1 shadow-[0_4px_0_#9d174d]">
                  <div className="skew-x-12 flex items-center gap-2">
                    <span className="text-base">{currentUser?.avatarConfig?.emoji || '🦊'}</span>
                    <span className="font-display text-xs sm:text-sm font-black text-white drop-shadow-[0_1.5px_0_#1a162b]">
                      {currentUser?.displayName || 'Explorer'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hearts & Companion Party Pips (References #2 & #5) */}
              <div className="flex items-center gap-3 pl-1">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((heartIdx) => (
                    <Heart
                      key={heartIdx}
                      className={`h-4 w-4 ${
                        playerHpPct >= heartIdx * 25
                          ? 'fill-[#ef4444] text-[#991b1b]'
                          : 'fill-slate-700 text-slate-900'
                      } drop-shadow`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1 rounded-full bg-[#1a162b]/80 px-2 py-0.5 border border-white/20">
                  {unlockedPets.slice(0, 5).map((pet) => (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => {
                        setPlayerId(pet.id);
                        restartBattle(pet.id);
                      }}
                      title={`Switch to ${pet.name}`}
                      className={`h-2.5 w-2.5 rounded-full border border-[#1a162b] transition cursor-pointer ${
                        pet.id === player.id
                          ? 'bg-[#4ade80] scale-125 ring-2 ring-white'
                          : 'bg-[#fde047] hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* TOP-CENTER: HANGING WOODEN TURN BANNER & AGE-TIERED MODE BAR (#3, #5) */}
            <div className="relative flex flex-col items-center">
              {/* Wooden Hanging Rope Posts */}
              <div className="flex w-44 justify-between px-6 -mb-1">
                <div className="h-3 w-2 bg-[#78350f] border border-[#1a162b]" />
                <div className="h-3 w-2 bg-[#78350f] border border-[#1a162b]" />
              </div>
              {/* Carved Wooden Turn Sign */}
              <div className="relative rounded-2xl border-[3px] border-[#451a03] bg-gradient-to-b from-[#b45309] via-[#92400e] to-[#78350f] px-6 py-1.5 text-center shadow-[0_5px_0_#270e02]">
                <span className="absolute -left-2.5 -top-1 text-base select-none">🌿</span>
                <span className="absolute -right-2.5 -top-1 text-base select-none">🌿</span>
                <div className="font-display text-sm sm:text-base font-black text-white drop-shadow-[0_1.5px_0_#1a162b]">
                  {isBattleOver
                    ? winner === player.id
                      ? '🏆 Realm Cleared!'
                      : '⚡ Battle Complete'
                    : `${player.name}'s Turn · Round ${roundNumber}`}
                </div>
                <div className="text-xs font-black text-[#fde047]">
                  Stage {activeNodeId} · {biome.title}
                </div>
              </div>

              {/* Accessibility #3 & #5: Streamlined Sub-Bar with Grade Mode & Single Options Button */}
              <div className="-mt-1 flex flex-wrap items-center justify-center gap-1.5 rounded-xl border-2 border-[#451a03] bg-[#78350f] px-3 py-1 text-xs font-black text-white shadow">
                {(
                  [
                    { id: 'k-2', label: '🌱 K–2' },
                    { id: '3-5', label: '🧭 3–5' },
                    { id: '6-8', label: '🏛️ 6–8' },
                  ] as const
                ).map((band) => (
                  <button
                    key={band.id}
                    type="button"
                    onClick={() => {
                      juice.click();
                      setPreferredGradeBand(band.id);
                    }}
                    className={`rounded-lg px-2 py-0.5 text-xs font-black cursor-pointer transition ${
                      preferredGradeBand === band.id
                        ? 'bg-[#fde047] text-[#1a162b] shadow-xs'
                        : 'bg-black/25 text-amber-100 hover:bg-black/40'
                    }`}
                    title="Switch Age-Tiered UI Mode & Vocabulary Level"
                  >
                    {band.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    juice.click();
                    setShowBattleOptions((v) => !v);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-amber-300/60 bg-[#1a162b] hover:bg-slate-800 px-2.5 py-0.5 text-xs font-black text-[#fde047] cursor-pointer"
                  title="Open Battle & Accessibility Options"
                >
                  <span>⚙️ Options</span>
                </button>
              </div>

              {/* Consolidated Battle Options Popover (#3) */}
              {showBattleOptions && (
                <div className="absolute top-24 z-40 w-72 rounded-2xl border-[3px] border-[#1a162b] bg-[#1e293b] p-3 text-white shadow-2xl space-y-2">
                  <div className="flex items-center justify-between border-b border-white/15 pb-1.5">
                    <span className="font-display text-xs font-black text-[#fde047]">
                      ⚙️ Battle &amp; Accessibility Options
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowBattleOptions(false)}
                      className="rounded bg-white/15 px-2 py-0.5 text-xs font-black hover:bg-rose-500 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setShowSyllables((s) => !s)}
                      className={`rounded-xl border border-white/20 p-2 text-left cursor-pointer ${
                        showSyllables ? 'bg-sky-400 text-[#1a162b] font-black' : 'bg-white/10'
                      }`}
                    >
                      👏 Syllables: {showSyllables ? 'ON' : 'OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDyslexiaFriendly(!dyslexiaFriendly)}
                      className={`rounded-xl border border-white/20 p-2 text-left cursor-pointer ${
                        dyslexiaFriendly ? 'bg-emerald-400 text-[#1a162b] font-black' : 'bg-white/10'
                      }`}
                    >
                      📖 Dyslexia Font: {dyslexiaFriendly ? 'ON' : 'OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalmAnimations(!calmAnimations)}
                      className={`rounded-xl border border-white/20 p-2 text-left cursor-pointer ${
                        calmAnimations ? 'bg-emerald-400 text-[#1a162b] font-black' : 'bg-white/10'
                      }`}
                    >
                      🌿 Calm Motion: {calmAnimations ? 'ON' : 'OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFastMode((f) => !f)}
                      className={`rounded-xl border border-white/20 p-2 text-left cursor-pointer ${
                        fastMode ? 'bg-[#fde047] text-[#1a162b] font-black' : 'bg-white/10'
                      }`}
                    >
                      <FastForward className="inline h-3.5 w-3.5 mr-1" />
                      Fast Anim: {fastMode ? 'ON' : 'OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSpeedScribeActive((s) => !s);
                        setSpeedScribeSeconds(12);
                      }}
                      className={`rounded-xl border border-white/20 p-2 text-left cursor-pointer ${
                        speedScribeActive ? 'bg-amber-400 text-[#1a162b] font-black' : 'bg-white/10'
                      }`}
                    >
                      ⚡ 12s Timer: {speedScribeActive ? `${speedScribeSeconds}s` : 'OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={cycleRealmWeather}
                      className="rounded-xl border border-white/20 bg-white/10 p-2 text-left cursor-pointer truncate"
                    >
                      {activeWeather.icon} {activeWeather.name}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowBattleOptions(false);
                      setShowMiniGameModal((m) => !m);
                    }}
                    className="w-full rounded-xl border-2 border-[#1a162b] bg-gradient-to-r from-[#fde047] to-[#f59e0b] py-1.5 font-display text-xs font-black text-[#1a162b] cursor-pointer"
                  >
                    {showMiniGameModal ? 'Hide Boss Clash Drills' : '⚔️ Open Word Duel & Homophone Drill'}
                  </button>
                </div>
              )}
            </div>

            {/* TOP-RIGHT: SKEWED BOSS PLATE + ROUND DIAMOND */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <div className="-skew-x-12 rounded-xl border-[3px] border-[#1a162b] bg-gradient-to-r from-[#e11d48] via-[#be123c] to-[#881337] px-4 py-1 shadow-[0_4px_0_#1a162b]">
                  <div className="skew-x-12 flex items-center gap-2">
                    <span className="text-base">{enemyElem.icon}</span>
                    <span className="font-display text-xs sm:text-sm font-black text-white drop-shadow-[0_1.5px_0_#1a162b]">
                      {displayEnemyName}
                    </span>
                    <span className="rounded bg-[#1a162b] px-1.5 py-0.5 font-mono text-xs font-black text-[#4ade80]">
                      {enemyHpPct}%
                    </span>
                  </div>
                </div>

                {/* DQM Diamond Round Badge */}
                <div className="flex h-9 w-9 rotate-45 items-center justify-center rounded-lg border-[3px] border-[#1a162b] bg-gradient-to-b from-[#312e81] to-[#1e1b4b] text-white shadow-[0_3px_0_#1a162b]">
                  <span className="-rotate-45 font-mono text-xs font-black text-[#fde047]">
                    R{roundNumber}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pr-1">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((heartIdx) => (
                    <Heart
                      key={heartIdx}
                      className={`h-4 w-4 ${
                        enemyHpPct >= heartIdx * 25
                          ? 'fill-[#ef4444] text-[#991b1b]'
                          : 'fill-slate-700 text-slate-900'
                      } drop-shadow`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => restartBattle()}
                  className="flex items-center gap-1 rounded-lg border border-white/30 bg-[#1a162b]/80 hover:bg-[#1a162b] px-2.5 py-1 text-xs font-black text-amber-200 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* ==================================================================
              MAIN ARENA STAGE (#1 De-Cluttered Center Arena):
              - Left: Explorer Avatar + Sidekick + Active Companion
              - Center: Spacious Visual Breathing Room + Spoken Phrase & Turn Clash Event
              - Right: Guardian Boss + Tactical Intent Bubble
          =================================================================== */}
          <div className="relative z-20 grid grid-cols-1 md:grid-cols-12 items-end gap-2 px-3 pb-3 pt-2 sm:px-6">
            {/* LEFT 4 COLS: PLAYER SQUAD ON STEPPED STONE PEDESTALS */}
            <div className="md:col-span-4 relative flex items-end justify-center gap-2 min-h-[230px]">
              {/* Rear Left: Explorer Tamer Avatar + Sidekick Companion */}
              <div className="hidden sm:flex flex-col items-center gap-2 pb-4 opacity-95">
                <div className="flex flex-col items-center">
                  <div
                    className="relative flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-[#1a162b] text-3xl shadow-[0_4px_0_#1a162b]"
                    style={{ backgroundColor: currentUser?.avatarConfig?.colorTheme || '#3b82f6' }}
                  >
                    <span>{currentUser?.avatarConfig?.emoji || '🦊'}</span>
                    {currentUser?.avatarConfig?.headgearEmoji && (
                      <span className="absolute -top-2.5 right-0 text-sm">
                        {currentUser.avatarConfig.headgearEmoji}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 rounded-md border border-[#1a162b] bg-[#1e293b]/90 px-2 py-0.5 text-xs font-black text-white">
                    ★ Lv.{currentUser?.level || 8} Tamer
                  </div>
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
                    {tagTeamComboActive && (
                      <span className="absolute -top-5 whitespace-nowrap rounded-full border-2 border-[#1a162b] bg-[#fde047] px-2 py-0.5 font-display text-xs font-black text-[#1a162b] shadow animate-bounce">
                        ⚡ Tag-Team Assist!
                      </span>
                    )}
                    <CreatureSprite
                      creatureId={sidekickPet.forged?.sourceId || sidekickPet.id}
                      stage={sidekickPet.stage || 1}
                      element={sidekickPet.element}
                      size="sm"
                      facing="right"
                      isAttacking={sidekickAnim === 'lunge'}
                    />
                    <div className="rounded-md border border-[#1a162b] bg-emerald-950/90 px-2 py-0.5 text-xs font-black text-emerald-300">
                      Swap: {sidekickPet.name}
                    </div>
                  </button>
                )}
              </div>

              {/* Forward Main Caster: Active Companion + Inline Floating HP Bar */}
              <div className="relative flex flex-col items-center">
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
                  size="xl"
                  facing="right"
                  isAttacking={playerAnim === 'lunge'}
                  isHit={playerAnim === 'hit'}
                />

                <div className="-mt-2 w-56 rounded-xl border-[3px] border-[#1a162b] bg-[#1e293b]/95 p-2 text-white shadow-[0_4px_0_#1a162b]">
                  <div className="flex items-center justify-between text-xs font-black mb-1">
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-sky-200 border border-white/15">
                      Weak to {playerWeakElem.icon}
                    </span>
                    <span className="font-display text-sm text-[#fde047] truncate">
                      {player.name}
                    </span>
                  </div>
                  <div className="relative h-5 w-full overflow-hidden rounded-md border-2 border-[#1a162b] bg-slate-950">
                    <div
                      className="h-full bg-gradient-to-r from-[#22c55e] via-[#4ade80] to-[#86efac] transition-all duration-500"
                      style={{ width: `${playerHpPct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-black text-white drop-shadow-[0_1px_1px_#000]">
                      {player.currentHp ?? player.stats.hp} / {player.maxHp ?? player.stats.hp}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="rounded bg-[#0f172a] border border-amber-400/50 px-1.5 py-0.5 font-mono text-xs font-black text-[#fde047]">
                      ★ Lv.{fullPlayerCreature.level || 8} · ❤️ {petBonds[player.id] || 3}
                    </span>
                    <div className="flex items-center gap-1">
                      {(player.shield ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5 rounded bg-sky-500 px-1.5 py-0.5 font-mono text-xs font-black text-slate-950">
                          🛡️ {player.shield}
                        </span>
                      )}
                      {preferredGradeBand !== 'k-2' && (
                        <button
                          type="button"
                          onClick={() => setShowCompactTraits((v) => !v)}
                          className="rounded bg-white/15 hover:bg-white/25 px-2 py-0.5 text-xs font-black text-amber-200 cursor-pointer"
                          title="Toggle Passive Trait, Support Combo & Armor Details"
                        >
                          {showCompactTraits ? 'Hide' : 'ℹ️ Buffs'}
                        </button>
                      )}
                    </div>
                  </div>
                  {showCompactTraits && (
                    <div className="mt-1 pt-1 border-t border-white/15 space-y-0.5 text-xs font-black text-emerald-300">
                      <div className="flex items-center justify-between">
                        <span className="truncate">{companionTrait}</span>
                        <span className="text-amber-200">{equippedAccLabel.split(' ')[0]}</span>
                      </div>
                      <div className="text-sky-200 truncate">{crossComboName}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CENTER 4 COLS: SPACIOUS ARENA CENTER WITH SPOKEN PHRASE & TURN-EVENT CLASH (#1, #2, #13) */}
            <div className="md:col-span-4 flex flex-col items-center justify-end my-1 gap-2">
              {battleState.lastPlayerResolution && (
                <div className="w-full max-w-xs rounded-2xl border-[3px] border-[#1a162b] bg-[#fff8e7]/95 px-4 py-2 text-center shadow-[0_4px_0_#1a162b]">
                  <div className="text-xs font-bold text-[#5d4037]">Last Spoken Cast:</div>
                  <span className="font-display text-sm sm:text-base font-black text-[#1a162b] block truncate">
                    “{battleState.lastPlayerResolution.combo.phrase}”
                  </span>
                </div>
              )}

              {activeTerrain && (
                <div className="w-full max-w-xs rounded-xl border-2 border-emerald-300 bg-emerald-950/90 px-3 py-1.5 text-center text-xs font-black text-emerald-200">
                  <div>
                    {activeTerrain.name} ({activeTerrain.turnsLeft}t)
                  </div>
                  <div className="text-xs text-[#fde047]">{activeTerrain.effect}</div>
                </div>
              )}

              {/* Adaptive Tutor Coach Bar + Dedicated Read-Hint Audio Button (#13) */}
              <div className="w-full max-w-xs rounded-2xl border-[3px] border-[#1a162b] bg-[#1e293b]/95 p-2.5 text-white shadow-[0_4px_0_#1a162b] space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-xs font-black text-[#fde047]">
                    🤖 {preferredGradeBand === 'k-2' ? 'Explorer Helper' : tutorInsight.badgeLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      juice.speakWord(
                        preferredGradeBand === 'k-2'
                          ? 'Tap one Action Word card below, or pair two cards, then press Cast!'
                          : tutorInsight.coachTip
                      )
                    }
                    className="flex items-center gap-1 rounded-lg border border-[#1a162b] bg-[#fde047] hover:bg-white px-2.5 py-1 text-xs font-black text-[#1a162b] cursor-pointer"
                    title="Read Coach Hint Aloud"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Read Hint</span>
                  </button>
                </div>
                <AdaptiveTutorCoachBar insight={tutorInsight} />

                {/* Turn-Triggered Boss Clash Event (every 3rd round or when opened via Options) (#2) */}
                {(roundNumber % 3 === 0 || showMiniGameModal) && (
                  <div className="pt-1 border-t border-white/15">
                    <BattleMiniGameControls
                      showSyllables={showSyllables}
                      onToggleSyllables={() => setShowSyllables((s) => !s)}
                      onTriggerBurst={() => {
                        setProjectileBurst(true);
                        setTimeout(() => setProjectileBurst(false), 600);
                      }}
                      onAddRewards={addRewards}
                      onAddMistakeWord={addMistakeWord}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT 4 COLS: GUARDIAN BOSS + SENTINEL ON STEPPED STONE PEDESTALS */}
            <div className="md:col-span-4 relative flex items-end justify-center gap-2 min-h-[230px]">
              {/* Main Guardian Boss + Enemy Intent Telegraph (#8) + Distinct Stage (#10) */}
              <div className="relative flex flex-col items-center">
                {/* Improvement #8: Tactical Enemy Intent Telegraph Bubble */}
                {!isBattleOver && (
                  <div
                    className={`mb-1.5 flex items-center justify-between gap-2 rounded-2xl border-2 bg-gradient-to-r ${enemyIntent.color} px-3 py-1 text-white shadow-[0_3px_0_#1a162b] max-w-[250px]`}
                  >
                    <div className="text-left leading-tight">
                      <div className="font-display text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
                        <span>{enemyIntent.icon}</span>
                        <span>{enemyIntent.title}</span>
                      </div>
                      <div className="text-[9px] font-bold text-white/95">
                        {enemyIntent.hint}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={enemyIntent.onCounter}
                      className="shrink-0 rounded-lg border border-[#1a162b] bg-[#fde047] hover:bg-white px-2 py-0.5 font-display text-[9px] font-black uppercase text-[#1a162b] shadow cursor-pointer"
                    >
                      {enemyIntent.actionLabel}
                    </button>
                  </div>
                )}

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

                {/* PRODIGY-STYLE INLINE FLOATING BOSS HUD BAR (Reference #3) */}
                <div className="-mt-2 w-52 rounded-xl border-[3px] border-[#1a162b] bg-[#1e293b]/95 p-1.5 text-white shadow-[0_4px_0_#1a162b]">
                  <div className="flex items-center justify-between text-[10px] font-black mb-1">
                    <span className="rounded bg-slate-800 px-1.5 py-0.2 text-amber-300 border border-white/15">
                      Weak to {enemyWeakElem.icon}
                    </span>
                    <span className="font-display text-xs text-rose-300 truncate">
                      {displayEnemyName}
                    </span>
                  </div>
                  <div className="relative h-4 w-full overflow-hidden rounded-md border-2 border-[#1a162b] bg-slate-950">
                    <div
                      className="h-full bg-gradient-to-r from-[#e11d48] via-[#f43f5e] to-[#fb7185] transition-all duration-500"
                      style={{ width: `${enemyHpPct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-black text-white drop-shadow-[0_1px_1px_#000]">
                      {enemy.currentHp ?? enemy.stats.hp} / {enemy.maxHp ?? enemy.stats.hp}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="rounded bg-[#0f172a] border border-rose-400/50 px-1.5 py-0.2 font-mono text-[10px] font-black text-rose-300">
                      {enemyStageBadge}
                    </span>
                    <div className="flex items-center gap-1">
                      {(enemy.shield ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5 rounded bg-sky-500 px-1.5 py-0.2 font-mono text-[10px] font-black text-slate-950">
                          🛡️ {enemy.shield}
                        </span>
                      )}
                      <span className="flex h-4 w-4 items-center justify-center rounded bg-rose-500/30 border border-rose-400 text-[9px]">
                        {enemyElem.icon}
                      </span>
                    </div>
                  </div>
                  {/* Feature #4: Boss Phase Transition & Grammar Shield Weakness */}
                  {enemyHpPct <= 60 && !isBattleOver && (
                    <div className="mt-1 rounded bg-rose-950/90 border border-rose-400/60 px-1.5 py-0.5 text-[9px] font-black text-amber-200 text-center">
                      🛡️ Grammar Barrier: Use an Adverb or 4-Word Sentence to Shatter!
                    </div>
                  )}
                </div>
              </div>

              {/* Rear Right: Elemental Sentinel Totem on Stepped Pedestal (Reference #5) */}
              <div className="hidden sm:flex flex-col items-center pb-5 opacity-90">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-b from-purple-900 to-slate-950 text-2xl shadow-[0_4px_0_#1a162b]">
                  {enemyElem.icon}
                </div>
                <span className="mt-1 rounded bg-[#1e293b]/90 border border-[#1a162b] px-2 py-0.5 text-[9px] font-black text-purple-200">
                  {enemyElem.name} Totem
                </span>
              </div>
            </div>
          </div>

          {/* VICTORY / DEFEAT OVERLAY MODAL */}
          {isBattleOver && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#1a162b]/85 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-3xl border-[4px] border-[#1a162b] bg-[#fff8e7] p-6 text-center shadow-[0_10px_0_#1a162b] space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-[#1a162b] bg-[#ffd54f]">
                  <Award className="h-10 w-10 text-[#1a162b]" />
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-black text-[#1a162b]">
                  {winner === player.id ? '🎉 The Monsters Are Defeated!' : '⚡ Try Again, Tamer!'}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-[#4e342e]">
                  {winner === player.id
                    ? `${player.name} cleared Stage ${activeNodeId} in ${biome.title}! Earned ★ Stars, +65 Lexi-Coins, +1 Fusion Gem, and +1 Pet Level!`
                    : `${enemy.name} held Stage ${activeNodeId} this time. Weave a 4-Tablet Ultimate Sentence or exploit its ${enemyWeakElem.name} weakness!`}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {/* Efficiency #9: One-Tap Fight Next Stage directly from Victory Banner */}
                  {winner === player.id && (
                    <button
                      type="button"
                      onClick={() => {
                        juice.fanfare();
                        advanceToNextNode();
                      }}
                      className="rounded-xl border-[3px] border-[#1a162b] bg-gradient-to-b from-[#4ade80] to-[#16a34a] hover:brightness-110 px-4 py-2.5 text-xs font-black uppercase text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
                    >
                      ⚔️ Fight Next Stage →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => restartBattle()}
                    className="rounded-xl border-[3px] border-[#1a162b] bg-[#ffd54f] hover:bg-[#ffca28] px-3.5 py-2.5 text-xs font-black uppercase text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
                  >
                    Replay
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const parts = activeNodeId.split('-');
                      const zNum = Number(parts[0] || 1);
                      const sNum = Number(parts[1] || 1);
                      if (winner === player.id && sNum < 10) {
                        setActiveNodeId(`${zNum}-${sNum + 1}`);
                      }
                      setReturnToWordWorldMap(true);
                      setTab('hub');
                    }}
                    className="rounded-xl border-[3px] border-[#1a162b] bg-gradient-to-b from-[#38bdf8] to-[#0284c7] hover:brightness-110 px-3.5 py-2.5 text-xs font-black uppercase text-white shadow-[0_3px_0_#1a162b] cursor-pointer"
                  >
                    🗺️ Node Map
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('hub')}
                    className="rounded-xl border-[3px] border-[#1a162b] bg-[#4caf50] hover:bg-[#66bb6a] px-3.5 py-2.5 text-xs font-black uppercase text-white shadow-[0_3px_0_#1a162b] cursor-pointer"
                  >
                    Hub
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ====================================================================
            2. UNIFIED SINGLE-INPUT SENTENCE BUILDER TRAY & 4 WORD TABLET CARDS
               (Accessibility #1, #4, #5, #9, #13, #15)
           ==================================================================== */}
        <div className="rounded-3xl border-[4px] border-[#1a162b] bg-[#1e293b] p-3 text-white shadow-[0_7px_0_#090714] space-y-3">
          {/* TOP ROW: VISUAL 4-SLOT SENTENCE BUILDER TRAY (#4) + KARAOKE HIGHLIGHT (#13) */}
          <div className="rounded-2xl border-[3px] border-[#1a162b] bg-[#fef9c3] p-2.5 text-[#1a162b] shadow-inner space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-[#1a162b] px-2.5 py-1 font-display text-xs font-black uppercase text-[#fde047]">
                  ✨ Sentence Builder Tray
                </span>
                <span className="text-xs font-bold text-[#5d4037]">
                  {selectedWords.length > 0
                    ? `“${activeAffixChip ? `[${activeAffixChip}] ` : ''}${previewCombo.phrase}”`
                    : 'Tap 1, 2, or 4 Word Tablets below (or press keys 1–4) to build your spell!'}
                </span>
              </div>

              {/* Quick Helper Actions: Fix Grammar Order (#4), Karaoke Read Aloud (#13), Auto-Weave, Clear */}
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedWords.length >= 2 && (
                  <button
                    type="button"
                    onClick={handleFixGrammarOrder}
                    className="rounded-xl border-2 border-[#1a162b] bg-amber-300 hover:bg-amber-400 px-2.5 py-1 text-xs font-display font-black text-[#1a162b] shadow-[0_2px_0_#1a162b] cursor-pointer"
                    title="Accessibility #4: Automatically sort your chosen words into natural English grammar order"
                  >
                    ⇄ Fix Grammar Order
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleKaraokeReadSentence}
                  className={`rounded-xl border-2 border-[#1a162b] px-2.5 py-1 text-xs font-display font-black shadow-[0_2px_0_#1a162b] cursor-pointer ${
                    karaokeWordIdx !== null || isListeningVoice
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-sky-200 hover:bg-sky-300 text-[#1a162b]'
                  }`}
                  title="Accessibility #13: Karaoke word-by-word read-aloud"
                >
                  🔊 Read Sentence
                </button>

                <button
                  type="button"
                  onClick={handleWeaveFullSentence}
                  className="rounded-xl border-2 border-[#1a162b] bg-purple-200 hover:bg-purple-300 px-2.5 py-1 text-xs font-display font-black text-purple-950 shadow-[0_2px_0_#1a162b] cursor-pointer"
                  title="Fill all 4 sentence slots automatically"
                >
                  ✨ Weave 4-Word
                </button>

                {selectedWords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedWordIds([])}
                    className="rounded-xl border-2 border-[#1a162b] bg-white hover:bg-rose-100 px-2.5 py-1 text-xs font-display font-black text-rose-700 cursor-pointer"
                  >
                    ✕ Clear [Esc]
                  </button>
                )}
              </div>
            </div>

            {/* 4 Numbered Visual Grammar Slots (#4 & #9) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['adjective', 'noun', 'verb', 'adverb'] as PartOfSpeech[]).map((pos, idx) => {
                const posMeta = getPartOfSpeechMeta(pos);
                const wordAtSlot = selectedWords[idx] || null;
                const isKaraokeActive = karaokeWordIdx === idx;
                const wordMeta = wordAtSlot ? getPartOfSpeechMeta(wordAtSlot.partOfSpeech) : posMeta;

                return (
                  <div
                    key={pos}
                    onClick={() => {
                      if (wordAtSlot) {
                        handleToggleWordCard(wordAtSlot);
                      } else {
                        const eq = runeSlots.find((r) => r.pos === pos)?.word;
                        if (eq) handleToggleWordCard(eq);
                      }
                    }}
                    className={`flex items-center justify-between rounded-xl border-2 px-3 py-2 transition cursor-pointer ${
                      isKaraokeActive
                        ? 'border-[#1a162b] bg-[#fde047] ring-4 ring-rose-500 scale-105'
                        : wordAtSlot
                        ? 'border-[#1a162b] bg-white shadow-[0_3px_0_#1a162b]'
                        : 'border-dashed border-[#1a162b]/40 bg-amber-50/70 hover:bg-amber-100/80'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-xs font-black uppercase text-[#5d4037]">
                        <span>Slot {idx + 1}:</span>
                        <span>
                          {wordMeta.shape} {wordMeta.icon} {wordMeta.label}
                        </span>
                      </div>
                      <div className="font-display text-sm sm:text-base font-black text-[#1a162b] truncate">
                        {wordAtSlot ? (
                          showSyllables ? (
                            juice.splitIntoSyllables(wordAtSlot.word)
                          ) : (
                            wordAtSlot.word
                          )
                        ) : (
                          <span className="text-stone-400 font-bold">
                            + Tap {posMeta.label} ({posMeta.helperLabel})
                          </span>
                        )}
                      </div>
                    </div>
                    {wordAtSlot && (
                      <span className="ml-1 shrink-0 rounded-full bg-[#fde047] border border-[#1a162b] px-2 py-0.5 font-mono text-xs font-black text-[#1a162b]">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* MAIN ROW: 4 LARGE COLORBLIND-SAFE WORD TABLET CARDS (#9, #13, #15) + CAST ACTION COLUMN */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            {/* 4 Large Word Tablet Cards (8 Cols) */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {runeSlots.map(({ pos, word }, idx) => {
                if (!word) return null;
                const slotIndex = selectedWordIds.indexOf(word.id);
                const isSelected = slotIndex !== -1;
                const isKaraokeActive = isSelected && karaokeWordIdx === slotIndex;
                const tierMeta = getGradeTierMeta(word.gradeTier);
                const elemInfo = ELEMENTS[word.element] || ELEMENTS.fire;
                const posMeta = getPartOfSpeechMeta(pos);
                const pwr = word.powerBonus ?? word.forge?.powerBonus ?? tierMeta.powerBonus;

                return (
                  <div
                    key={pos}
                    onClick={() => handleToggleWordCard(word)}
                    className={`relative flex flex-col justify-between rounded-2xl border-[3px] p-3 transition-all cursor-pointer ${posMeta.cardBg} ${
                      isKaraokeActive
                        ? 'ring-4 ring-rose-500 scale-105 border-[#1a162b] shadow-[0_7px_0_#1a162b]'
                        : isSelected
                        ? 'ring-4 ring-[#fde047] -translate-y-1.5 border-[#1a162b] shadow-[0_7px_0_#1a162b]'
                        : 'border-[#1a162b] hover:-translate-y-1 shadow-[0_4px_0_#1a162b]'
                    }`}
                  >
                    {/* Top Bar: Colorblind Shape + Icon + Role (#9) & Keyboard Keycap Badge (#15) */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`rounded-lg border px-2 py-0.5 font-display text-xs font-black ${posMeta.pillBg} ${posMeta.pillText} ${posMeta.cardBorder}`}
                      >
                        {posMeta.shape} {posMeta.icon} {posMeta.label}
                      </span>
                      <span
                        className="rounded-md border-2 border-[#1a162b] bg-white px-1.5 py-0.5 font-mono text-xs font-black text-[#1a162b] shadow-2xs"
                        title={`Press keyboard key ${idx + 1} to toggle`}
                      >
                        [{idx + 1}]
                      </span>
                    </div>

                    {/* Plain-English Grammar Role Helper Subtitle (#9) */}
                    <div className="mt-1 text-xs font-extrabold text-[#451a03]">
                      Role: {posMeta.helperLabel}
                    </div>

                    {/* Central Word Display + Element Icon */}
                    <div className="my-2 flex flex-col items-center justify-center rounded-xl border-2 border-[#1a162b]/25 bg-white/90 py-2.5 px-2 text-center shadow-inner">
                      <span className="text-2xl drop-shadow">{elemInfo.icon}</span>
                      <span className="font-display text-base sm:text-lg font-black text-[#1a162b] break-words leading-tight mt-0.5">
                        {showSyllables ? juice.splitIntoSyllables(word.word) : word.word}
                      </span>
                      {preferredGradeBand !== 'k-2' && (
                        <span className="text-xs font-semibold text-stone-600 line-clamp-1 mt-0.5">
                          “{word.definition}”
                        </span>
                      )}
                    </div>

                    {/* Bottom Bar: Enlarged 36x36px Audio Buttons (#13) + Grade & Power */}
                    <div className="flex items-center justify-between gap-1 pt-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            juice.speakSlow(word.word);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#1a162b] bg-sky-100 text-sm font-black text-[#1a162b] hover:bg-[#fde047] shadow-[0_2px_0_#1a162b] cursor-pointer"
                          title="Slow Phonetics Read-Aloud (🐢)"
                          aria-label={`Read ${word.word} slowly`}
                        >
                          🐢
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            juice.speakWord(`${word.word}. ${word.definition}`);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#1a162b] bg-white text-[#1a162b] hover:bg-[#fde047] shadow-[0_2px_0_#1a162b] cursor-pointer"
                          title="Hear Word & Meaning (🔊)"
                          aria-label={`Hear ${word.word} and its definition`}
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex flex-col items-end">
                        <span
                          className={`rounded px-1.5 py-0.5 border border-[#1a162b] text-xs font-black ${tierMeta.badgeBg} ${tierMeta.badgeText}`}
                        >
                          {tierMeta.shortLabel}
                        </span>
                        <span className="font-mono text-xs font-black text-[#1a162b] mt-0.5">
                          +{pwr} PWR
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border-2 border-[#1a162b] bg-[#fde047] px-2.5 py-0.5 font-mono text-xs font-black text-[#1a162b] shadow">
                        Slot #{slotIndex + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* RIGHT 4 COLS: SPELL POWER SUMMARY, FIELD GUIDE BUTTON & GIANT CAST BUTTON */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-2 rounded-2xl border-[3px] border-[#2dd4bf] bg-[#fef9c3] p-3 text-[#1a162b] shadow-[0_5px_0_#0f766e]">
              <div className="space-y-1.5">
                {/* Age-Tiered Affix Surge Chips (Hidden in K-2 Explorer Mode for simplicity - #5) */}
                {preferredGradeBand !== 'k-2' && (
                  <div className="flex flex-wrap items-center gap-1 border-b border-amber-300 pb-1.5">
                    <span className="text-xs font-black uppercase text-[#451a03]">Affix Boost:</span>
                    {['un-', 're-', 'hyper-', '-ful', '-less', '-ly'].map((affix) => (
                      <button
                        key={affix}
                        type="button"
                        onClick={() => {
                          juice.click();
                          setActiveAffixChip((prev) => (prev === affix ? null : affix));
                        }}
                        className={`rounded-lg px-2 py-0.5 font-mono text-xs font-black border border-[#1a162b] cursor-pointer ${
                          activeAffixChip === affix
                            ? 'bg-[#fde047] text-[#1a162b]'
                            : 'bg-white text-[#5d4037] hover:bg-amber-100'
                        }`}
                      >
                        {affix}
                      </button>
                    ))}
                  </div>
                )}

                {/* Power Pips & Effect Summary */}
                <div className="space-y-1 text-xs font-bold">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-black">
                      <Swords className="h-4 w-4 text-[#1a162b]" />
                      Spell Power:
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((pip) => (
                        <span
                          key={pip}
                          className={`h-3.5 w-4 rounded-xs border border-[#1a162b] ${
                            selectedWords.length > 0 && pip <= powerFilledPips
                              ? 'bg-[#1a162b]'
                              : 'bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-black">
                      <Zap className="h-4 w-4 text-[#1a162b]" />
                      Combo:
                    </span>
                    <span className="font-black text-emerald-800 truncate">
                      {voiceFeedback
                        ? voiceFeedback
                        : selectedWords.length === 4
                        ? `Ultimate 4-Word + ${crossComboName}`
                        : selectedWords.length >= 2
                        ? `⚡ ${previewCombo.effectName} (1.5x)`
                        : selectedWords.length === 1
                        ? previewCombo.effectName
                        : `Next: ${nextRecommendedPos.toUpperCase()}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row: Field Guide Drawer + Loadout + Giant CAST Button */}
              <div className="flex items-stretch gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowReserveDrawer((prev) => !prev)}
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-[#1a162b] bg-[#b45309] hover:bg-[#92400e] px-3 py-2 text-white shadow-[0_3px_0_#1a162b] cursor-pointer"
                  title="Swap equipped Word Tablets from your Lexicon Field Guide"
                >
                  <span className="text-base">🦴</span>
                  <span className="font-display text-xs font-black uppercase text-[#fef3c7]">
                    {showReserveDrawer ? 'Close' : 'Swap Words'}
                  </span>
                </button>

                {isPlayerReadyToEvolve && (
                  <button
                    type="button"
                    onClick={() => setEvolvingCreatureId(fullPlayerCreature.id)}
                    className="rounded-xl border-2 border-[#1a162b] bg-[#fde047] px-2.5 py-2 font-display text-xs font-black uppercase text-[#1a162b] animate-pulse cursor-pointer"
                  >
                    ★ Evolve
                  </button>
                )}

                <button
                  type="button"
                  disabled={!previewCombo.valid || isBattleOver}
                  onClick={handleLaunchWordStrike}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl border-[3px] px-4 py-3 font-display text-sm sm:text-base font-black uppercase tracking-wider transition ${
                    previewCombo.valid && !isBattleOver
                      ? 'border-[#1a162b] bg-gradient-to-b from-[#4ade80] to-[#16a34a] text-[#1a162b] shadow-[0_4px_0_#1a162b] hover:brightness-105 cursor-pointer'
                      : 'border-slate-400 bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Swords className="h-5 w-5" />
                  <span>CAST SPELL! [Space]</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================
            3. COLLAPSIBLE K–8 LEXICON FIELD GUIDE DRAWER
           ==================================================================== */}
        {showReserveDrawer && (
          <div className="rounded-2xl border-[3px] border-[#1a162b] bg-[#fff8e7] p-3 shadow-[0_5px_0_#1a162b] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-display text-xs sm:text-sm font-black text-[#1a162b]">
                📖 K–8 Lexicon Field Guide — Click Any Word Tablet to Equip &amp; Slot into Battle
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {(
                  [
                    { id: 'all', label: 'All K–8' },
                    { id: 'k-2', label: 'Grades K–2' },
                    { id: '3-5', label: 'Grades 3–5' },
                    { id: '6-8', label: 'Grades 6–8' },
                  ] as const
                ).map((band) => (
                  <button
                    key={band.id}
                    type="button"
                    onClick={() => {
                      setPreferredGradeBand(band.id);
                      setGradeFilter('all');
                    }}
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase cursor-pointer border border-[#1a162b] ${
                      preferredGradeBand === band.id && gradeFilter === 'all'
                        ? 'bg-[#2e7d32] text-white'
                        : 'bg-emerald-100 text-[#1a162b]'
                    }`}
                  >
                    {band.label}
                  </button>
                ))}
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
                    <div className="my-0.5 font-serif text-sm font-black text-[#2b1d12]">
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