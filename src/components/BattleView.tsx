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
import { evaluateCombo } from '../engine/combat';
import { getAllWordsList } from '../engine/forge';
import { Word, PartOfSpeech, GradeTier } from '../types';
import { juice } from '../engine/juice';
import { canPetEvolve } from '../data/evolutionData';
import { EvolutionSequenceModal } from './EvolutionSequenceModal';
import { CreatureSprite } from './CreatureSprite';
import { GRADE_TIERS, getGradeTierMeta, getPartOfSpeechMeta } from '../data/vocabDatabase';
import { ZONE_BIOMES } from '../data/realms';
import { AdaptiveTutorCoachBar } from './battle/BattleMiniGames';

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
    setActiveNodeId,
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
  } = useGame();
  const { currentUser, addRewards } = useAuth();

  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [showReserveDrawer, setShowReserveDrawer] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<GradeTier | 'all'>('all');
  const [projectileBurst, setProjectileBurst] = useState<boolean>(false);
  const [tagTeamComboActive, setTagTeamComboActive] = useState<boolean>(false);

  // On-Demand Tutor Coach & Next-Slot Highlight (#2, #4)
  const [showCoachHint, setShowCoachHint] = useState<boolean>(false);
  const [highlightedSlotIdx, setHighlightedSlotIdx] = useState<number | null>(null);

  // Karaoke-Style Word Highlighting index during TTS Read-Aloud
  const [karaokeWordIdx, setKaraokeWordIdx] = useState<number | null>(null);
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);

  // Elemental Terrain state
  const [activeTerrain, setActiveTerrain] = useState<{
    name: string;
    effect: string;
    turnsLeft: number;
  } | null>(null);

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

  // Player's reserve companions for party pips & Support Tag-Team
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
    setShowCoachHint(false);
  }, [playerId, activeZoneId, enemy.id]);

  // Reward & Pet EXP on Victory + Companion Bond Increase
  useEffect(() => {
    if (isBattleOver && winner === player.id && !rewardClaimed) {
      setRewardClaimed(true);
      addRewards({ coins: 65, tokens: 1, xp: 45, wonBattle: true });
      levelUpPet(player.id, 1);
      increasePetBond(player.id, 1);
    }
  }, [isBattleOver, winner, player.id, rewardClaimed, addRewards, levelUpPet, increasePetBond]);

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
  }, [battleState.events, enemy.id, player.id]);

  const handleToggleWordCard = (word: Word) => {
    if (isBattleOver) return;
    juice.click();
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
    if (selectedWords.length === 4) {
      setSidekickAnim('lunge');
      setTagTeamComboActive(true);
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

  // Keyboard Navigation (1-4 to toggle tablets, Space/Enter to Cast, Esc to clear/close)
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
        if (showReserveDrawer) setShowReserveDrawer(false);
        else if (showCoachHint) setShowCoachHint(false);
        else if (selectedWordIds.length > 0) setSelectedWordIds([]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const displayEnemyName = activeEnemyName || enemy.name;
  const displayEnemyStage: 1 | 2 | 3 = activeEnemyStage || 3;
  const enemyStageBadge =
    displayEnemyStage === 1
      ? '★ Vanguard 12'
      : displayEnemyStage === 2
      ? '★★ Mid-Boss 20'
      : '★★★ Guardian 30';

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

                {/* Single Clean Player Health Plate (#1) */}
                <div className="w-52 sm:w-60 rounded-2xl border-[3px] border-[#1a162b] bg-[#1e293b]/95 p-2 text-white shadow-[0_4px_0_#1a162b]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span>{playerElem.icon}</span>
                      <span className="font-display text-xs sm:text-sm font-black text-[#fde047] truncate">
                        {player.name}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-black text-emerald-300">
                      Lv.{fullPlayerCreature.level || 8}
                    </span>
                  </div>
                  <div className="relative h-5 w-full overflow-hidden rounded-lg border-2 border-[#1a162b] bg-slate-950">
                    <div
                      className="h-full bg-gradient-to-r from-[#22c55e] via-[#4ade80] to-[#86efac] transition-all duration-500"
                      style={{ width: `${playerHpPct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-black text-white drop-shadow-[0_1px_1px_#000]">
                      {player.currentHp ?? player.stats.hp} / {player.maxHp ?? player.stats.hp} HP
                      {(player.shield ?? 0) > 0 ? ` (+🛡️${player.shield})` : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* TOP-CENTER: CLEAN STAGE & TURN BANNER ONLY (#3) */}
            <div className="relative flex flex-col items-center">
              <div className="flex w-44 justify-between px-6 -mb-1">
                <div className="h-3 w-2 bg-[#78350f] border border-[#1a162b]" />
                <div className="h-3 w-2 bg-[#78350f] border border-[#1a162b]" />
              </div>
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
            </div>

            {/* TOP-RIGHT: SINGLE CLEAN BOSS HEALTH PLATE (#1) */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <div className="w-52 sm:w-60 rounded-2xl border-[3px] border-[#1a162b] bg-[#1e293b]/95 p-2 text-white shadow-[0_4px_0_#1a162b]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span>{enemyElem.icon}</span>
                      <span className="font-display text-xs sm:text-sm font-black text-rose-300 truncate">
                        {displayEnemyName}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-black text-amber-300">
                      {enemyStageBadge}
                    </span>
                  </div>
                  <div className="relative h-5 w-full overflow-hidden rounded-lg border-2 border-[#1a162b] bg-slate-950">
                    <div
                      className="h-full bg-gradient-to-r from-[#e11d48] via-[#f43f5e] to-[#fb7185] transition-all duration-500"
                      style={{ width: `${enemyHpPct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-black text-white drop-shadow-[0_1px_1px_#000]">
                      {enemy.currentHp ?? enemy.stats.hp} / {enemy.maxHp ?? enemy.stats.hp} HP
                      {(enemy.shield ?? 0) > 0 ? ` (+🛡️${enemy.shield})` : ''}
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
          </div>

          {/* ==================================================================
              MAIN ARENA STAGE (#1 No Under-Sprite HP Cards; #2 On-Demand Coach):
          =================================================================== */}
          <div className="relative z-20 grid grid-cols-1 md:grid-cols-12 items-end gap-2 px-3 pb-4 pt-2 sm:px-6">
            {/* LEFT 4 COLS: PLAYER SQUAD ON STEPPED STONE PEDESTALS */}
            <div className="md:col-span-4 relative flex items-end justify-center gap-3 min-h-[210px]">
              {/* Rear Left: Explorer Tamer Avatar + Sidekick Companion */}
              <div className="hidden sm:flex flex-col items-center gap-2 pb-2 opacity-95">
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
                  </button>
                )}
              </div>

              {/* Forward Main Caster: Clean Active Companion Sprite Only (#1) */}
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
                  size="xl"
                  facing="right"
                  isAttacking={playerAnim === 'lunge'}
                  isHit={playerAnim === 'hit'}
                />
              </div>
            </div>

            {/* CENTER 4 COLS: SPACIOUS ARENA CENTER WITH ON-DEMAND COACH (#2) */}
            <div className="md:col-span-4 flex flex-col items-center justify-end my-1 gap-2">
              {battleState.lastPlayerResolution && !isCoachVisible && (
                <div className="w-full max-w-xs rounded-2xl border-[3px] border-[#1a162b] bg-[#fff8e7]/95 px-4 py-2 text-center shadow-[0_4px_0_#1a162b]">
                  <div className="text-xs font-bold text-[#5d4037]">Last Spoken Cast:</div>
                  <span className="font-display text-sm sm:text-base font-black text-[#1a162b] block truncate">
                    “{battleState.lastPlayerResolution.combo.phrase}”
                  </span>
                </div>
              )}

              {activeTerrain && !isCoachVisible && (
                <div className="w-full max-w-xs rounded-xl border-2 border-emerald-300 bg-emerald-950/90 px-3 py-1.5 text-center text-xs font-black text-emerald-200">
                  <div>
                    {activeTerrain.name} ({activeTerrain.turnsLeft}t)
                  </div>
                </div>
              )}

              {/* Adaptive Tutor Coach Bar — On-Demand Only (#2: slides in when 💡 Help is clicked or on sentence-order mistake) */}
              {isCoachVisible && (
                <div className="w-full max-w-xs rounded-2xl border-[3px] border-[#1a162b] bg-[#1e293b]/95 p-3 text-white shadow-[0_5px_0_#1a162b] space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-xs font-black text-[#fde047]">
                      💡 {hasGrammarMistake ? 'Grammar Order Tip' : tutorInsight.badgeLabel}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          juice.speakWord(
                            hasGrammarMistake
                              ? previewCombo.reasons[0] || 'Try Adjective, Noun, Verb, then Adverb!'
                              : tutorInsight.coachTip
                          )
                        }
                        className="flex items-center gap-1 rounded-lg border border-[#1a162b] bg-[#fde047] hover:bg-white px-2 py-0.5 text-xs font-black text-[#1a162b] cursor-pointer"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>Listen</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCoachHint(false)}
                        className="rounded-lg bg-white/15 hover:bg-rose-500 px-2 py-0.5 text-xs font-black text-white cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {hasGrammarMistake ? (
                    <div className="rounded-xl bg-amber-500/20 border border-amber-300/60 p-2 text-xs font-bold text-amber-100 space-y-1.5">
                      <p>{previewCombo.reasons[0] || 'Try Adjective → Noun → Verb → Adverb!'}</p>
                      <button
                        type="button"
                        onClick={handleFixGrammarOrder}
                        className="w-full rounded-lg border border-[#1a162b] bg-[#fde047] py-1 font-display text-xs font-black text-[#1a162b] cursor-pointer"
                      >
                        ⇄ Auto-Fix Grammar Order
                      </button>
                    </div>
                  ) : (
                    <AdaptiveTutorCoachBar insight={tutorInsight} />
                  )}
                </div>
              )}
            </div>

            {/* RIGHT 4 COLS: GUARDIAN BOSS SPRITE ONLY (#1 No Under-Sprite HP Card) */}
            <div className="md:col-span-4 relative flex items-end justify-center gap-2 min-h-[210px]">
              <div className="relative flex flex-col items-center pb-2">
                {!isBattleOver && (
                  <div
                    className={`mb-2 flex items-center justify-between gap-2 rounded-2xl border-2 bg-gradient-to-r ${enemyIntent.color} px-3 py-1 text-white shadow-[0_3px_0_#1a162b] max-w-[250px]`}
                  >
                    <div className="text-left leading-tight">
                      <div className="font-display text-xs font-black uppercase tracking-wide flex items-center gap-1">
                        <span>{enemyIntent.icon}</span>
                        <span>{enemyIntent.title}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={enemyIntent.onCounter}
                      className="shrink-0 rounded-lg border border-[#1a162b] bg-[#fde047] hover:bg-white px-2 py-0.5 font-display text-xs font-black uppercase text-[#1a162b] shadow cursor-pointer"
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
            2. STREAMLINED SENTENCE BUILDER TRAY & 4 WORD TABLET CARDS (#4, #5, #6)
           ==================================================================== */}
        <div className="rounded-3xl border-[4px] border-[#1a162b] bg-[#1e293b] p-3 text-white shadow-[0_7px_0_#090714] space-y-3">
          {/* TOP ROW: VISUAL 4-SLOT SENTENCE TRAY + ONLY 2 HELPER BUTTONS (🔊 Read Aloud & 💡 Help) (#4) */}
          <div className="rounded-2xl border-[3px] border-[#1a162b] bg-[#fef9c3] p-2.5 text-[#1a162b] shadow-inner space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-[#1a162b] px-2.5 py-1 font-display text-xs font-black uppercase text-[#fde047]">
                  ✨ Sentence Tray
                </span>
                <span className="text-xs sm:text-sm font-black text-[#451a03]">
                  {selectedWords.length > 0
                    ? `“${previewCombo.phrase}”`
                    : 'Tap Word Cards below (or press keys 1–4) to build your spell!'}
                </span>
              </div>

              {/* Collapsed Helper Buttons: Single 🔊 Read Aloud + Single 💡 Help (#4) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleKaraokeReadSentence}
                  className={`rounded-xl border-2 border-[#1a162b] px-3 py-1 text-xs font-display font-black shadow-[0_2px_0_#1a162b] cursor-pointer ${
                    karaokeWordIdx !== null || isListeningVoice
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-sky-200 hover:bg-sky-300 text-[#1a162b]'
                  }`}
                  title="Read your sentence aloud with word-by-word highlighting"
                >
                  🔊 Read Aloud
                </button>

                <button
                  type="button"
                  onClick={handleHelpButton}
                  className={`rounded-xl border-2 border-[#1a162b] px-3 py-1 text-xs font-display font-black shadow-[0_2px_0_#1a162b] cursor-pointer ${
                    showCoachHint || highlightedSlotIdx !== null
                      ? 'bg-[#fde047] text-[#1a162b]'
                      : 'bg-amber-200 hover:bg-amber-300 text-[#1a162b]'
                  }`}
                  title="Highlight the next slot needed and open the Tutor Coach hint"
                >
                  💡 Help
                </button>
              </div>
            </div>

            {/* 4 Numbered Visual Grammar Slots */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['adjective', 'noun', 'verb', 'adverb'] as PartOfSpeech[]).map((pos, idx) => {
                const posMeta = getPartOfSpeechMeta(pos);
                const wordAtSlot = selectedWords[idx] || null;
                const isKaraokeActive = karaokeWordIdx === idx;
                const isNextSlotHighlighted = highlightedSlotIdx === idx;
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
                        : isNextSlotHighlighted
                        ? 'border-[#1a162b] bg-[#fde047] ring-4 ring-amber-400 scale-105 animate-pulse'
                        : wordAtSlot
                        ? 'border-[#1a162b] bg-white shadow-[0_3px_0_#1a162b]'
                        : 'border-dashed border-[#1a162b]/40 bg-amber-50/70 hover:bg-amber-100/80'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-xs font-black uppercase text-[#5d4037]">
                        <span>
                          {idx + 1}. {wordMeta.shape} {wordMeta.icon} {wordMeta.label}
                        </span>
                      </div>
                      <div className="font-display text-sm sm:text-base font-black text-[#1a162b] truncate">
                        {wordAtSlot ? (
                          wordAtSlot.word
                        ) : (
                          <span className="text-stone-400 font-bold">
                            + {posMeta.helperLabel}
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

          {/* MAIN ROW: 4 SIMPLIFIED 2-DATA-POINT WORD CARDS (#5) + STREAMLINED CAST PANEL (#6) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            {/* 4 Simplified Word Tablet Cards (8 Cols) — Only Word + Color-Coded Role Badge + 🔊 Speaker Icon (#5) */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {runeSlots.map(({ pos, word }, idx) => {
                if (!word) return null;
                const slotIndex = selectedWordIds.indexOf(word.id);
                const isSelected = slotIndex !== -1;
                const isKaraokeActive = isSelected && karaokeWordIdx === slotIndex;
                const isNextSlotHighlighted = !isSelected && highlightedSlotIdx === idx;
                const posMeta = getPartOfSpeechMeta(pos);

                return (
                  <div
                    key={pos}
                    onClick={() => handleToggleWordCard(word)}
                    title={`${word.word} (${posMeta.label}): ${word.definition}`}
                    className={`relative flex flex-col justify-between rounded-2xl border-[3px] p-3 transition-all cursor-pointer ${posMeta.cardBg} ${
                      isKaraokeActive
                        ? 'ring-4 ring-rose-500 scale-105 border-[#1a162b] shadow-[0_7px_0_#1a162b]'
                        : isNextSlotHighlighted
                        ? 'ring-4 ring-amber-400 scale-105 border-[#1a162b] shadow-[0_7px_0_#1a162b]'
                        : isSelected
                        ? 'ring-4 ring-[#fde047] -translate-y-1.5 border-[#1a162b] shadow-[0_7px_0_#1a162b]'
                        : 'border-[#1a162b] hover:-translate-y-1 shadow-[0_4px_0_#1a162b]'
                    }`}
                  >
                    {/* Data Point 1: Color-Coded Role Badge + 🔊 Speaker Button */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`rounded-lg border px-2 py-0.5 font-display text-xs font-black ${posMeta.pillBg} ${posMeta.pillText} ${posMeta.cardBorder}`}
                      >
                        {posMeta.shape} {posMeta.icon} {posMeta.label}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          juice.speakWord(`${word.word}. ${word.definition}`);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#1a162b] bg-white text-[#1a162b] hover:bg-[#fde047] shadow-[0_2px_0_#1a162b] cursor-pointer"
                        title={`Hear "${word.word}" and its meaning`}
                        aria-label={`Hear ${word.word}`}
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Data Point 2: Bold Word Centerpiece */}
                    <div className="my-2 flex flex-col items-center justify-center rounded-xl border-2 border-[#1a162b]/20 bg-white/95 py-4 px-2 text-center shadow-inner">
                      <span className="font-display text-lg sm:text-xl font-black text-[#1a162b] break-words leading-tight">
                        {word.word}
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

            {/* RIGHT 4 COLS: STREAMLINED ACTION PANEL (#6) — Giant ⚡ CAST SPELL Button + Small Pet Skill & Clear Buttons */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-2.5 rounded-2xl border-[3px] border-[#2dd4bf] bg-[#fef9c3] p-3 text-[#1a162b] shadow-[0_5px_0_#0f766e]">
              {/* Big, Unmistakable ⚡ CAST SPELL Button */}
              <button
                type="button"
                disabled={!previewCombo.valid || isBattleOver}
                onClick={handleLaunchWordStrike}
                className={`flex-1 flex items-center justify-center gap-2.5 rounded-2xl border-[3px] px-5 py-4 font-display text-base sm:text-lg font-black uppercase tracking-wider transition ${
                  previewCombo.valid && !isBattleOver
                    ? 'border-[#1a162b] bg-gradient-to-b from-[#4ade80] to-[#16a34a] text-[#1a162b] shadow-[0_5px_0_#1a162b] hover:brightness-105 cursor-pointer'
                    : 'border-slate-400 bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Zap className="h-6 w-6 fill-current" />
                <span>⚡ CAST SPELL</span>
              </button>

              {/* Small Pet Skill, Swap Words, & Clear Buttons */}
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
                  className="flex-1 rounded-xl border-2 border-[#1a162b] bg-purple-200 hover:bg-purple-300 px-3 py-1.5 font-display text-xs font-black uppercase text-purple-950 shadow-[0_2px_0_#1a162b] cursor-pointer"
                  title="Use Companion Pet Skill (4-Word Ultimate Weave or Evolve)"
                >
                  {isPlayerReadyToEvolve ? '★ Evolve Pet' : '🐾 Pet Skill'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowReserveDrawer((prev) => !prev)}
                  className="rounded-xl border-2 border-[#1a162b] bg-amber-200 hover:bg-amber-300 px-3 py-1.5 font-display text-xs font-black uppercase text-[#1a162b] shadow-[0_2px_0_#1a162b] cursor-pointer"
                  title="Open Lexicon Field Guide to swap equipped words"
                >
                  {showReserveDrawer ? 'Close' : '📖 Words'}
                </button>

                <button
                  type="button"
                  disabled={selectedWords.length === 0}
                  onClick={() => setSelectedWordIds([])}
                  className={`rounded-xl border-2 px-3 py-1.5 font-display text-xs font-black uppercase transition ${
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
                <button
                  type="button"
                  onClick={() => setGradeFilter('all')}
                  className={`rounded-lg px-2 py-0.5 text-xs font-black uppercase cursor-pointer border border-[#1a162b] ${
                    gradeFilter === 'all'
                      ? 'bg-[#2e7d32] text-white'
                      : 'bg-emerald-100 text-[#1a162b]'
                  }`}
                >
                  All Tiers
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