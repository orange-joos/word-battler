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
import { GRADE_TIERS, getGradeTierMeta } from '../data/vocabDatabase';

const ZONE_BIOMES: Record<
  string,
  {
    title: string;
    subtitle: string;
    skyFrom: string;
    skyTo: string;
    horizonColor: string;
    groundColor: string;
    accentColor: string;
    badge: string;
  }
> = {
  'area-grass': {
    title: 'Emerald Grass Glade',
    subtitle: 'Area 1 · Grass Realm (Grades K–1 Roots)',
    skyFrom: '#38bdf8',
    skyTo: '#bae6fd',
    horizonColor: '#0284c7',
    groundColor: '#65d654',
    accentColor: '#228b22',
    badge: '🌿 Grass Area',
  },
  'area-water': {
    title: 'Azure Water Lagoon',
    subtitle: 'Area 2 · Water Realm (Grades 1–2 Verbs & Nouns)',
    skyFrom: '#0284c7',
    skyTo: '#7dd3fc',
    horizonColor: '#0369a1',
    groundColor: '#38bdf8',
    accentColor: '#0284c7',
    badge: '💧 Water Area',
  },
  'area-earth': {
    title: 'Sunfall Fossil Canyon',
    subtitle: 'Area 3 · Earth Realm (Grades 2–3 Compounds)',
    skyFrom: '#f59e0b',
    skyTo: '#fef3c7',
    horizonColor: '#d97706',
    groundColor: '#eab308',
    accentColor: '#a16207',
    badge: '🪨 Earth Area',
  },
  'area-fire': {
    title: 'Fireforge Magma Caldera',
    subtitle: 'Area 4 · Fire Realm (Grades 3–4 Action Matrix)',
    skyFrom: '#7c2d12',
    skyTo: '#fb923c',
    horizonColor: '#9a3412',
    groundColor: '#78716c',
    accentColor: '#ea580c',
    badge: '🔥 Fire Area',
  },
  'area-ice': {
    title: 'Frostpeak Crystal Glacier',
    subtitle: 'Area 5 · Ice Realm (Grades 3–4 Prefixes)',
    skyFrom: '#0369a1',
    skyTo: '#e0f2fe',
    horizonColor: '#0284c7',
    groundColor: '#7dd3fc',
    accentColor: '#0369a1',
    badge: '❄️ Ice Area',
  },
  'area-air': {
    title: 'Tempest Sky Spire',
    subtitle: 'Area 6 · Air Realm (Grades 4–5 Suffixes & Adverbs)',
    skyFrom: '#0d9488',
    skyTo: '#ccfbf1',
    horizonColor: '#0f766e',
    groundColor: '#5eead4',
    accentColor: '#0f766e',
    badge: '🌬️ Air Area',
  },
  'area-electric': {
    title: 'Volt-Rune Storm Citadel',
    subtitle: 'Area 7 · Electric Realm (Grade 5 High-Voltage Syntax)',
    skyFrom: '#1e1b4b',
    skyTo: '#4338ca',
    horizonColor: '#312e81',
    groundColor: '#eab308',
    accentColor: '#ca8a04',
    badge: '⚡ Electric Area',
  },
  'area-shadow': {
    title: 'Shadowcrypt Golem Ruins',
    subtitle: 'Area 8 · Shadow Realm (Grades 5–8 Cryptic Morphemes)',
    skyFrom: '#1e1b4b',
    skyTo: '#581c87',
    horizonColor: '#3b0764',
    groundColor: '#64748b',
    accentColor: '#7e22ce',
    badge: '🌑 Shadow Area',
  },
  'area-light': {
    title: 'Celestia Radiant Sanctum',
    subtitle: 'Area 9 · Light Realm (Grades 6–8 Extender Summit)',
    skyFrom: '#3b0764',
    skyTo: '#a855f7',
    horizonColor: '#6b21a8',
    groundColor: '#fde047',
    accentColor: '#ca8a04',
    badge: '✨ Light Area',
  },
  'root-village': {
    title: 'Harmony Village Meadow',
    subtitle: 'Zone 1 · Root Word Sanctuary',
    skyFrom: '#38bdf8',
    skyTo: '#bae6fd',
    horizonColor: '#0284c7',
    groundColor: '#65d654',
    accentColor: '#15803d',
    badge: '🌿 Meadow Stage',
  },
  'prefix-path': {
    title: 'Frostpeak Glacial Pass',
    subtitle: 'Zone 2 · Prefix Peaks',
    skyFrom: '#0284c7',
    skyTo: '#e0f2fe',
    horizonColor: '#0369a1',
    groundColor: '#bae6fd',
    accentColor: '#0369a1',
    badge: '❄️ Glacier Stage',
  },
  'prefix-peaks': {
    title: 'Frostpeak Glacial Pass',
    subtitle: 'Zone 2 · Prefix Peaks',
    skyFrom: '#0284c7',
    skyTo: '#e0f2fe',
    horizonColor: '#0369a1',
    groundColor: '#bae6fd',
    accentColor: '#0369a1',
    badge: '❄️ Glacier Stage',
  },
  'suffix-steppes': {
    title: 'Sunfall Oasis & Sky Steppes',
    subtitle: 'Zone 3 · Suffix Steppes',
    skyFrom: '#f59e0b',
    skyTo: '#fef3c7',
    horizonColor: '#d97706',
    groundColor: '#fcd34d',
    accentColor: '#b45309',
    badge: '🏜️ Oasis Stage',
  },
  'sunfall-dunes': {
    title: 'Sunfall Fossil Canyon',
    subtitle: 'Zone 3 · Prehistoric Dig & Suffix Steppes',
    skyFrom: '#f59e0b',
    skyTo: '#fef3c7',
    horizonColor: '#d97706',
    groundColor: '#fcd34d',
    accentColor: '#b45309',
    badge: '🦴 Fossil Stage',
  },
  'compound-colosseum': {
    title: 'Fireforge Magma Caldera',
    subtitle: 'Zone 4 · Compound Colosseum',
    skyFrom: '#7c2d12',
    skyTo: '#ea580c',
    horizonColor: '#9a3412',
    groundColor: '#57534e',
    accentColor: '#f97316',
    badge: '🌋 Volcano Stage',
  },
  'syntax-spire': {
    title: 'Celestia Astral Sanctum',
    subtitle: 'Zone 5 · Peak of the Syntax Spire',
    skyFrom: '#3b0764',
    skyTo: '#a855f7',
    horizonColor: '#581c87',
    groundColor: '#fef08a',
    accentColor: '#ca8a04',
    badge: '👑 Astral Stage',
  },
  celestia: {
    title: 'Celestia Astral Sanctum',
    subtitle: 'Zone 5 · Peak of the Syntax Spire',
    skyFrom: '#3b0764',
    skyTo: '#a855f7',
    horizonColor: '#581c87',
    groundColor: '#fef08a',
    accentColor: '#ca8a04',
    badge: '👑 Astral Stage',
  },
};

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
  } = useGame();
  const { currentUser, addRewards } = useAuth();

  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [showReserveDrawer, setShowReserveDrawer] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<GradeTier | 'all'>('all');
  const [fastMode, setFastMode] = useState(false);
  const [hoveredCmd, setHoveredCmd] = useState<string>('ultimate');
  const [projectileBurst, setProjectileBurst] = useState<boolean>(false);
  const [tagTeamComboActive, setTagTeamComboActive] = useState<boolean>(false);

  // Feature #5: Synonym & Antonym Word Duel Counter-Clash state
  const [showWordDuel, setShowWordDuel] = useState<boolean>(false);
  const [duelIndex, setDuelIndex] = useState<number>(0);
  const [duelBanner, setDuelBanner] = useState<string | null>(null);

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

  // Player's reserve companions for party pips & sidekick display
  const unlockedPets = creatures.filter((c) => !c.id.startsWith('boss_'));
  const sidekickPet = unlockedPets.find((c) => c.id !== player.id) || unlockedPets[0];

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

  // Reward & Pet EXP on Victory
  useEffect(() => {
    if (isBattleOver && winner === player.id && !rewardClaimed) {
      setRewardClaimed(true);
      addRewards({ coins: 65, tokens: 1, xp: 45, wonBattle: true });
      levelUpPet(player.id, 1);
    }
  }, [isBattleOver, winner, player.id, rewardClaimed, addRewards, levelUpPet]);

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

  const handleSingleWordAction = (word: Word | null) => {
    if (isBattleOver || !word) return;
    juice.click();
    setSelectedWordIds([word.id]);
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
    submitCombo(
      selectedWords[0].id,
      selectedWords[1]?.id || null,
      selectedWords[2]?.id || null,
      selectedWords[3]?.id || null
    );
    setSelectedWordIds([]);
  };

  // Feature #5: Synonym & Antonym Word Duel Prompts
  const WORD_DUEL_CHALLENGES = [
    {
      bossMove: 'COLOSSAL CRUSH',
      prompt: 'Pick the ANTONYM Tablet of "COLOSSAL" to deflect!',
      options: ['MINUSCULE', 'GIGANTIC', 'FIERCE'],
      correctIndex: 0,
    },
    {
      bossMove: 'FRIGID GALE',
      prompt: 'Pick the ANTONYM Tablet of "FRIGID" to deflect!',
      options: ['ICY', 'SCORCHING', 'SILENT'],
      correctIndex: 1,
    },
    {
      bossMove: 'RAPID BARRAGE',
      prompt: 'Pick the SYNONYM Tablet of "RAPID" to parry!',
      options: ['SLUGGISH', 'SWIFT', 'HEAVY'],
      correctIndex: 1,
    },
  ];
  const currentDuel = WORD_DUEL_CHALLENGES[duelIndex % WORD_DUEL_CHALLENGES.length];

  // Feature #8 & #10: Companion Passive Trait & Equipped Accessory Badge
  const PASSIVE_TRAITS: Record<string, string> = {
    fire: '🔥 Blaze Verb Mastery (+3 Verb Pwr)',
    water: '💧 Tidal Bastion (+4 Noun Shield)',
    grass: '🌿 Rootweaver (+3 Adj Pwr)',
    electric: '⚡ Swift Syntax (+3 Adv Pwr)',
    ice: '❄️ Permafrost Ward (+3 DEF)',
    earth: '🪨 Granite Stance (+4 HP/Shield)',
    air: '🌬️ Gale Tailwind (+4 SPD)',
    shadow: '🌑 Umbra Echo (+3 Morpheme Pwr)',
    light: '✨ Radiant Harmony (+3 All Pwr)',
  };
  const companionTrait = PASSIVE_TRAITS[player.element] || PASSIVE_TRAITS.fire;
  const equippedAccId = petAccessories[player.id] || 'amber_fang';
  const ACCESSORY_LABELS: Record<string, string> = {
    amber_fang: '🦴 Amber Fang (+ATK)',
    iron_shell: '🛡️ Iron Shell (+DEF)',
    zephyr_band: '🪶 Zephyr Band (+SPD)',
    root_crown: '👑 Root Crown (+HP)',
  };
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

  // Center 2x2 Elemental Rune Board coordinates for glowing energy link lines
  const runeCoords: Record<number, { x: number; y: number }> = {
    0: { x: 42, y: 42 },
    1: { x: 138, y: 42 },
    2: { x: 42, y: 128 },
    3: { x: 138, y: 128 },
  };

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

            {/* TOP-CENTER: HANGING WOODEN TURN BANNER & DQM ENEMY DIAMONDS (References #1 & #5) */}
            <div className="flex flex-col items-center">
              {/* Wooden Hanging Rope Posts */}
              <div className="flex w-44 justify-between px-6 -mb-1">
                <div className="h-3 w-2 bg-[#78350f] border border-[#1a162b]" />
                <div className="h-3 w-2 bg-[#78350f] border border-[#1a162b]" />
              </div>
              {/* Carved Wooden Turn Sign */}
              <div className="relative rounded-2xl border-[3px] border-[#451a03] bg-gradient-to-b from-[#b45309] via-[#92400e] to-[#78350f] px-6 py-1.5 text-center shadow-[0_5px_0_#270e02]">
                {/* Leafy Vine Accents */}
                <span className="absolute -left-2.5 -top-1 text-base select-none">🌿</span>
                <span className="absolute -right-2.5 -top-1 text-base select-none">🌿</span>
                <div className="font-display text-xs sm:text-sm font-black text-white drop-shadow-[0_1.5px_0_#1a162b]">
                  {isBattleOver
                    ? winner === player.id
                      ? '🏆 Realm Cleared!'
                      : '⚡ Battle Complete'
                    : `${player.name}'s Turn!`}
                </div>
                <div className="text-[10px] font-black uppercase tracking-wider text-[#fde047]">
                  Stage {activeNodeId} · {biome.title}
                </div>
              </div>

              {/* Lower Wooden Sub-Sign with Round, Weather Tide Shift (#4) & Fast Mode Toggle */}
              <div className="-mt-1 flex flex-wrap items-center justify-center gap-2 rounded-xl border-2 border-[#451a03] bg-[#78350f] px-3 py-0.5 text-[10px] font-black text-white shadow">
                <span>⏱️ Round {roundNumber}</span>
                <span>·</span>
                <button
                  type="button"
                  onClick={cycleRealmWeather}
                  title={activeWeather.effectLabel}
                  className="flex items-center gap-1 rounded bg-cyan-950/90 px-1.5 py-0.2 text-cyan-200 border border-cyan-400/40 cursor-pointer"
                >
                  <span>{activeWeather.icon}</span>
                  <span>{activeWeather.name}</span>
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setFastMode((f) => !f)}
                  className={`flex items-center gap-0.5 rounded px-1.5 py-0.2 cursor-pointer ${
                    fastMode ? 'bg-[#fde047] text-[#1a162b]' : 'text-amber-200 hover:text-white'
                  }`}
                >
                  <FastForward className="h-3 w-3" />
                  <span>Fast</span>
                </button>
              </div>
            </div>

            {/* TOP-RIGHT: SKEWED BOSS PLATE + ROUND DIAMOND (References #1, #2, #5) */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <div className="-skew-x-12 rounded-xl border-[3px] border-[#1a162b] bg-gradient-to-r from-[#e11d48] via-[#be123c] to-[#881337] px-4 py-1 shadow-[0_4px_0_#1a162b]">
                  <div className="skew-x-12 flex items-center gap-2">
                    <span className="text-base">{enemyElem.icon}</span>
                    <span className="font-display text-xs sm:text-sm font-black text-white drop-shadow-[0_1.5px_0_#1a162b]">
                      {displayEnemyName}
                    </span>
                    <span className="rounded bg-[#1a162b] px-1.5 py-0.2 font-mono text-[10px] font-black text-[#4ade80]">
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
                  className="flex items-center gap-1 rounded-lg border border-white/30 bg-[#1a162b]/80 hover:bg-[#1a162b] px-2 py-0.5 text-[10px] font-black text-amber-200 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* ==================================================================
              MAIN ARENA STAGE:
              - Left: Explorer Avatar + Sidekick + Active Companion with Prodigy Floating HP Bar
              - Center: Interactive 2x2 Elemental Word-Rune Grid with Glowing Energy Links
              - Right: Guardian Boss + Elemental Sentinel with Prodigy Floating HP Bar
          =================================================================== */}
          <div className="relative z-20 grid grid-cols-1 md:grid-cols-12 items-end gap-2 px-3 pb-3 pt-2 sm:px-6">
            {/* LEFT 4 COLS: PLAYER SQUAD ON STEPPED STONE PEDESTALS */}
            <div className="md:col-span-4 relative flex items-end justify-center gap-2 min-h-[230px]">
              {/* Rear Left: Explorer Tamer Avatar + Sidekick Companion (References #1, #3, #5) */}
              <div className="hidden sm:flex flex-col items-center gap-2 pb-4 opacity-95">
                {/* Explorer Tamer Character */}
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
                  <div className="mt-1 rounded-md border border-[#1a162b] bg-[#1e293b]/90 px-2 py-0.5 text-[9px] font-black text-white">
                    ★ Lv.{currentUser?.level || 8} Tamer
                  </div>
                </div>

                {/* Reserve Sidekick Companion (with Improvement #9 Tag-Team Combo Lunge) */}
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
                      <span className="absolute -top-5 whitespace-nowrap rounded-full border-2 border-[#1a162b] bg-[#fde047] px-2 py-0.5 font-display text-[9px] font-black uppercase text-[#1a162b] shadow animate-bounce">
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
                    <div className="rounded-md border border-[#1a162b] bg-emerald-950/90 px-2 py-0.5 text-[9px] font-black text-emerald-300">
                      Swap: {sidekickPet.name}
                    </div>
                  </button>
                )}
              </div>

              {/* Forward Main Caster: Active Companion + Prodigy Inline Floating HP Bar (Reference #3) */}
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

                {/* PRODIGY-STYLE INLINE FLOATING UNIT HUD BAR (Reference #3) */}
                <div className="-mt-2 w-52 rounded-xl border-[3px] border-[#1a162b] bg-[#1e293b]/95 p-1.5 text-white shadow-[0_4px_0_#1a162b]">
                  <div className="flex items-center justify-between text-[10px] font-black mb-1">
                    <span className="rounded bg-slate-800 px-1.5 py-0.2 text-sky-200 border border-white/15">
                      Weak to {playerWeakElem.icon}
                    </span>
                    <span className="font-display text-xs text-[#fde047] truncate">
                      {player.name}
                    </span>
                  </div>
                  {/* Segmented HP Bar */}
                  <div className="relative h-4 w-full overflow-hidden rounded-md border-2 border-[#1a162b] bg-slate-950">
                    <div
                      className="h-full bg-gradient-to-r from-[#22c55e] via-[#4ade80] to-[#86efac] transition-all duration-500"
                      style={{ width: `${playerHpPct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-black text-white drop-shadow-[0_1px_1px_#000]">
                      {player.currentHp ?? player.stats.hp} / {player.maxHp ?? player.stats.hp}
                    </span>
                  </div>
                  {/* Bottom Star Level & Status Pips + Passive Trait (#8) & Armor (#10) */}
                  <div className="mt-1 flex items-center justify-between">
                    <span className="rounded bg-[#0f172a] border border-amber-400/50 px-1.5 py-0.2 font-mono text-[10px] font-black text-[#fde047]">
                      ★ {fullPlayerCreature.level || 8}
                    </span>
                    <div className="flex items-center gap-1">
                      {(player.shield ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5 rounded bg-sky-500 px-1.5 py-0.2 font-mono text-[10px] font-black text-slate-950">
                          🛡️ {player.shield}
                        </span>
                      )}
                      <span className="flex h-4 w-4 items-center justify-center rounded bg-cyan-500/30 border border-cyan-400 text-[9px]">
                        {playerElem.icon}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 pt-1 border-t border-white/15 flex items-center justify-between gap-1 text-[9px] font-black text-emerald-300">
                    <span className="truncate" title={companionTrait}>
                      {companionTrait}
                    </span>
                    <span className="shrink-0 rounded bg-amber-500/20 border border-amber-400/40 px-1 text-amber-200">
                      {equippedAccLabel.split(' ')[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER 4 COLS: HEAD-TO-HEAD ELEMENTAL RUNE BOARD WITH GLOWING LINK BEAM (Reference #5) */}
            <div className="md:col-span-4 flex flex-col items-center justify-center my-1">
              <div className="relative rounded-2xl border-[4px] border-[#451a03] bg-[#5c3a21] p-2.5 shadow-[0_6px_0_#271306]">
                <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
                  <span className="font-display text-[11px] font-black uppercase tracking-wider text-[#fde047]">
                    🦴 Word Tablet Matrix
                  </span>
                  <span className="rounded bg-[#271306] px-1.5 py-0.5 font-mono text-[10px] font-black text-amber-200">
                    {selectedWords.length}/4 Linked
                  </span>
                </div>

                {/* 2x2 Stone Checkerboard with Glowing Golden Energy Path */}
                <div className="relative grid grid-cols-2 gap-2.5 rounded-xl bg-[#3e2723] p-2.5 border-2 border-[#271306]">
                  {/* Glowing Golden Energy Line Connecting Selected Runes in Order */}
                  <svg
                    viewBox="0 0 180 170"
                    className="pointer-events-none absolute inset-0 h-full w-full z-10"
                  >
                    {selectedWordIds.length > 1 &&
                      selectedWordIds.map((id, idx) => {
                        if (idx === 0) return null;
                        const prevId = selectedWordIds[idx - 1];
                        const prevSlotIdx = runeSlots.findIndex((r) => r.word?.id === prevId);
                        const currSlotIdx = runeSlots.findIndex((r) => r.word?.id === id);
                        if (prevSlotIdx === -1 || currSlotIdx === -1) return null;
                        const p1 = runeCoords[prevSlotIdx];
                        const p2 = runeCoords[currSlotIdx];
                        return (
                          <g key={`${prevId}-${id}`}>
                            <line
                              x1={p1.x}
                              y1={p1.y}
                              x2={p2.x}
                              y2={p2.y}
                              stroke="#fef08a"
                              strokeWidth="10"
                              strokeLinecap="round"
                              opacity="0.45"
                            />
                            <line
                              x1={p1.x}
                              y1={p1.y}
                              x2={p2.x}
                              y2={p2.y}
                              stroke="#facc15"
                              strokeWidth="4.5"
                              strokeLinecap="round"
                            />
                          </g>
                        );
                      })}
                  </svg>

                  {runeSlots.map((slot) => {
                    const word = slot.word;
                    if (!word) return null;
                    const orderIdx = selectedWordIds.indexOf(word.id);
                    const isLinked = orderIdx !== -1;
                    const elem = ELEMENTS[word.element] || ELEMENTS.fire;

                    return (
                      <button
                        key={slot.pos}
                        type="button"
                        onClick={() => handleToggleWordCard(word)}
                        className={`relative z-20 flex flex-col items-center justify-center rounded-xl border-[3px] px-3 py-2 transition-all cursor-pointer min-w-[78px] ${
                          isLinked
                            ? `bg-gradient-to-b ${slot.bg} border-[#fef08a] scale-105 shadow-[0_0_16px_rgba(250,204,21,0.85)] text-white`
                            : 'bg-[#78553a] hover:bg-[#8c6446] border-[#271306] text-[#fff8e7]'
                        }`}
                      >
                        <div className="flex items-center gap-1 text-base">
                          <span>{elem.icon}</span>
                          <span className="font-mono text-[10px] font-black uppercase opacity-90">
                            {slot.short}
                          </span>
                        </div>
                        <span className="font-display text-xs font-black tracking-wide truncate max-w-[80px]">
                          {word.word}
                        </span>
                        {isLinked && (
                          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#1a162b] bg-[#fde047] font-mono text-[10px] font-black text-[#1a162b]">
                            {orderIdx + 1}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Live Spoken Combo Callout Ribbon */}
                {battleState.lastPlayerResolution && (
                  <div className="mt-1.5 rounded-lg border-2 border-[#1a162b] bg-[#fff8e7] px-2.5 py-1 text-center">
                    <span className="font-display text-[11px] font-black text-[#1a162b] block truncate">
                      “{battleState.lastPlayerResolution.combo.phrase}”
                    </span>
                  </div>
                )}

                {/* Feature #7: Active Elemental Terrain Badge */}
                {activeTerrain && (
                  <div className="mt-1.5 rounded-lg border-2 border-emerald-300 bg-emerald-950/90 px-2.5 py-1 text-center text-[10px] font-black text-emerald-200">
                    <div>
                      {activeTerrain.name} ({activeTerrain.turnsLeft}t)
                    </div>
                    <div className="text-[9px] text-[#fde047]">{activeTerrain.effect}</div>
                  </div>
                )}

                {/* Feature #5: Synonym & Antonym Counter-Clash ("Word Duel") */}
                <div className="mt-1.5 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      juice.click();
                      setShowWordDuel((prev) => !prev);
                      setDuelBanner(null);
                    }}
                    className="flex-1 rounded-lg border-2 border-[#1a162b] bg-gradient-to-r from-[#fde047] to-[#f59e0b] px-2 py-1 font-display text-[10px] font-black uppercase text-[#1a162b] shadow cursor-pointer"
                  >
                    ⚔️ {showWordDuel ? 'Hide Word Duel' : 'Word Duel Clash'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      juice.click();
                      setShowSyllables((s) => !s);
                    }}
                    className={`rounded-lg border-2 border-[#1a162b] px-2 py-1 font-display text-[10px] font-black uppercase cursor-pointer ${
                      showSyllables ? 'bg-sky-400 text-[#1a162b]' : 'bg-[#271306] text-amber-200'
                    }`}
                    title="Toggle Phonetics & Syllable Clapper Breakdown"
                  >
                    👏 Syllables
                  </button>
                </div>

                {showWordDuel && (
                  <div className="mt-1.5 rounded-xl border-2 border-[#fde047] bg-[#1e1b4b] p-2 text-white space-y-1.5">
                    <div className="text-[10px] font-black text-[#fde047]">
                      ⚡ {currentDuel.bossMove}: {currentDuel.prompt}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {currentDuel.options.map((opt, idx) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (idx === currentDuel.correctIndex) {
                              juice.fanfare();
                              juice.speakWord(opt);
                              setProjectileBurst(true);
                              setTimeout(() => setProjectileBurst(false), 600);
                              addRewards({ coins: 20, tokens: 0, xp: 15 });
                              setDuelBanner(`✨ Deflected with "${opt}"! +20 🪙!`);
                              setDuelIndex((i) => i + 1);
                            } else {
                              juice.boing();
                              setDuelBanner('Try again! Look for the exact match.');
                            }
                          }}
                          className="rounded-lg border border-[#fde047] bg-indigo-900 hover:bg-[#fde047] hover:text-[#1a162b] py-1 font-display text-[10px] font-black cursor-pointer transition"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {duelBanner && (
                      <div className="text-center font-display text-[10px] font-black text-emerald-300">
                        {duelBanner}
                      </div>
                    )}
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
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => restartBattle()}
                    className="rounded-xl border-[3px] border-[#1a162b] bg-[#ffd54f] hover:bg-[#ffca28] px-4 py-2.5 text-xs font-black uppercase text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
                  >
                    Battle Again
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
                    className="rounded-xl border-[3px] border-[#1a162b] bg-gradient-to-b from-[#38bdf8] to-[#0284c7] hover:brightness-110 px-4 py-2.5 text-xs font-black uppercase text-white shadow-[0_3px_0_#1a162b] cursor-pointer"
                  >
                    🗺️ Next Stage on Node Map →
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('hub')}
                    className="rounded-xl border-[3px] border-[#1a162b] bg-[#4caf50] hover:bg-[#66bb6a] px-4 py-2.5 text-xs font-black uppercase text-white shadow-[0_3px_0_#1a162b] cursor-pointer"
                  >
                    Sanctuary Hub
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ====================================================================
            2. BOTTOM HYBRID COMMAND DOCK:
               - Left: Classic Final Fantasy IV Royal-Blue Bevelled Command Menu with Glove Cursor (Reference #4)
               - Center: Prodigy Spellbook Button + 4 Vertical Spell Cards with Corner Badges (Reference #3)
               - Right: Prodigy "Spell Inspector" Card (Power Pips, Aim, Effect) + CAST Button (Reference #3)
           ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
          {/* LEFT 3 COLS: FINAL FANTASY IV ROYAL-BLUE COMMAND WINDOW (Reference #4) */}
          <div className="lg:col-span-3 rounded-2xl border-[3px] border-[#e2e8f0] bg-gradient-to-b from-[#1e3a8a] via-[#172554] to-[#0f172a] p-3 text-white shadow-[inset_0_0_0_2px_#1e293b,0_5px_0_#090714] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-blue-300/30 pb-1.5 mb-1.5">
              <span className="font-mono text-[11px] font-black uppercase tracking-widest text-sky-300">
                COMMAND · {player.name}
              </span>
              {isPlayerReadyToEvolve && (
                <button
                  type="button"
                  onClick={() => setEvolvingCreatureId(fullPlayerCreature.id)}
                  className="rounded bg-[#fde047] px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-950 animate-pulse cursor-pointer"
                >
                  ★ Evolve
                </button>
              )}
            </div>

            <div className="space-y-1 font-mono text-xs sm:text-sm font-bold">
              {[
                {
                  id: 'attack',
                  label: 'Attack (Verb)',
                  action: () => handleSingleWordAction(equippedVerb),
                },
                {
                  id: 'strike2',
                  label: 'W.Strike (Adv+Verb)',
                  action: handleQuick2WordStrike,
                },
                {
                  id: 'shield2',
                  label: 'B.Guard (Adj+Noun)',
                  action: handleQuick2WordShield,
                },
                {
                  id: 'ultimate',
                  label: 'Recall 4-Word Ult',
                  action: handleWeaveFullSentence,
                },
                {
                  id: 'arsenal',
                  label: 'Items / Loadout',
                  action: goToLoadout,
                },
              ].map((cmd) => {
                const isActive = hoveredCmd === cmd.id;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onMouseEnter={() => setHoveredCmd(cmd.id)}
                    onClick={() => {
                      setHoveredCmd(cmd.id);
                      cmd.action();
                    }}
                    className={`w-full flex items-center gap-2 rounded-lg px-2 py-1 text-left transition cursor-pointer ${
                      isActive ? 'bg-blue-500/30 text-[#fde047]' : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="w-4 text-sm">{isActive ? '👉' : ''}</span>
                    <span className="drop-shadow-[1px_1px_0_#000]">{cmd.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CENTER 5 COLS: LEXICON FIELD GUIDE + 4 VERTICAL WORD TABLET CARDS (Reference #3) */}
          <div className="lg:col-span-5 flex items-stretch gap-2">
            {/* Chunky Leather Lexicon Field Guide Toggle Button */}
            <button
              type="button"
              onClick={() => setShowReserveDrawer((prev) => !prev)}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-b from-[#b45309] via-[#92400e] to-[#5c2d0c] px-3 py-2 text-white shadow-[0_5px_0_#1a162b] hover:brightness-110 cursor-pointer shrink-0 w-20"
              title="Open K–8 Lexicon Field Guide"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#fde68a] bg-[#fef3c7] text-2xl text-[#92400e] shadow-inner">
                🦴
              </div>
              <span className="font-display text-[10px] font-black uppercase tracking-wider text-[#fef3c7] text-center leading-tight">
                {showReserveDrawer ? 'Close Guide' : 'Field Guide'}
              </span>
              <span className="font-mono text-[9px] font-bold text-amber-200">
                {allWords.length} Tablets
              </span>
            </button>

            {/* 4 Vertical Word Tablet Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
              {runeSlots.map(({ pos, label, word }) => {
                if (!word) return null;
                const slotIndex = selectedWordIds.indexOf(word.id);
                const isSelected = slotIndex !== -1;
                const tierMeta = getGradeTierMeta(word.gradeTier);
                const elemInfo = ELEMENTS[word.element] || ELEMENTS.fire;
                const pwr = word.powerBonus ?? word.forge?.powerBonus ?? tierMeta.powerBonus;

                const cardPalette =
                  pos === 'adjective'
                    ? 'bg-[#fef3c7] border-[#f59e0b]'
                    : pos === 'noun'
                    ? 'bg-[#e0f2fe] border-[#0284c7]'
                    : pos === 'verb'
                    ? 'bg-[#ffe4e6] border-[#e11d48]'
                    : 'bg-[#f3e8ff] border-[#9333ea]';

                return (
                  <div
                    key={pos}
                    onClick={() => handleToggleWordCard(word)}
                    className={`relative flex flex-col justify-between rounded-2xl border-[3px] p-2.5 transition-all cursor-pointer ${cardPalette} ${
                      isSelected
                        ? 'ring-4 ring-[#fde047] -translate-y-1.5 shadow-[0_7px_0_#1a162b]'
                        : 'border-[#1a162b] hover:-translate-y-1 shadow-[0_4px_0_#1a162b]'
                    }`}
                  >
                    {/* Top Folded Page Corner & Grade Tier + Slow Phonetics (#13) */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[9px] font-black uppercase text-[#1a162b]/80">
                        {label}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            juice.speakSlow(word.word);
                          }}
                          className="flex h-6 px-1 items-center justify-center rounded-lg border border-[#1a162b] bg-sky-100 text-[9px] font-black text-[#1a162b] hover:bg-[#fde047] cursor-pointer"
                          title="Slow Phonetics Read-Aloud"
                        >
                          🐢
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            juice.speakWord(`${word.word}. ${word.definition}`);
                          }}
                          className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#1a162b] bg-white/90 text-[#1a162b] hover:bg-[#fde047] cursor-pointer"
                          title="Hear Word & Definition"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Central Word Tablet Icon Illustration + Syllable Clapper (#13) */}
                    <div className="my-1.5 flex flex-col items-center justify-center rounded-xl border-2 border-[#1a162b]/20 bg-white/75 py-2 text-center">
                      <span className="text-2xl drop-shadow">{elemInfo.icon}</span>
                      <span className="font-display text-sm font-black text-[#1a162b] truncate max-w-full px-1">
                        {showSyllables ? juice.splitIntoSyllables(word.word) : word.word}
                      </span>
                    </div>

                    {/* Bottom Corner Badge */}
                    <div className="flex items-center justify-between text-[10px] font-black">
                      <span
                        className={`rounded px-1 py-0.2 border border-[#1a162b] ${tierMeta.badgeBg} ${tierMeta.badgeText}`}
                      >
                        {tierMeta.shortLabel}
                      </span>
                      <span className="font-mono text-[#1a162b]">+{pwr}</span>
                    </div>

                    {isSelected && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border-2 border-[#1a162b] bg-[#fde047] px-2 py-0.2 font-mono text-[9px] font-black text-[#1a162b] shadow">
                        #{slotIndex + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT 4 COLS: WORD TABLET INSPECTOR CARD & STRIKE BUTTON */}
          <div className="lg:col-span-4 flex items-stretch gap-2 rounded-2xl border-[3px] border-[#2dd4bf] bg-[#fef9c3] p-3 text-[#1a162b] shadow-[0_5px_0_#0f766e]">
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1 border-b-2 border-[#eab308]/40 pb-1">
                  <span className="font-display text-sm sm:text-base font-black text-[#1a162b] truncate">
                    {selectedWords.length > 0
                      ? `“${previewCombo.phrase}”`
                      : 'Tap Word Tablets or Command to Weave'}
                  </span>
                </div>

                {/* Power Pips, Syntax, and Effect Rows */}
                <div className="mt-1.5 space-y-1 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <Swords className="h-3.5 w-3.5 text-[#1a162b]" />
                    <span className="w-14 font-black">Power:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((pip) => (
                        <span
                          key={pip}
                          className={`h-3 w-3.5 rounded-xs border border-[#1a162b] ${
                            selectedWords.length > 0 && pip <= powerFilledPips
                              ? 'bg-[#1a162b]'
                              : 'bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-[#1a162b]" />
                    <span className="w-14 font-black">Syntax:</span>
                    <span className="font-black text-emerald-800">
                      {selectedWords.length === 4
                        ? 'Ultimate 4-Word (2.0x!)'
                        : selectedWords.length === 2
                        ? 'Excellent Combo'
                        : selectedWords.length === 1
                        ? 'Single Strike'
                        : 'Ready'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-[#1a162b]" />
                    <span className="w-14 font-black">Effect:</span>
                    <span className="truncate font-semibold text-[#451a03]">
                      {selectedWords.length > 0
                        ? previewCombo.effectName
                        : 'Select 1, 2, or 4 Word Tablets'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strike & Clear Action Column */}
            <div className="flex flex-col justify-between gap-1.5 shrink-0">
              <button
                type="button"
                disabled={!previewCombo.valid || isBattleOver}
                onClick={handleLaunchWordStrike}
                className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border-[3px] px-4 py-2 font-display text-xs sm:text-sm font-black uppercase tracking-wider transition ${
                  previewCombo.valid && !isBattleOver
                    ? 'border-[#1a162b] bg-gradient-to-b from-[#4ade80] to-[#16a34a] text-[#1a162b] shadow-[0_4px_0_#1a162b] hover:brightness-105 cursor-pointer'
                    : 'border-slate-400 bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Swords className="h-5 w-5" />
                <span>STRIKE</span>
              </button>

              {selectedWords.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedWordIds([])}
                  className="rounded-lg border-2 border-[#1a162b] bg-white hover:bg-amber-100 px-2 py-1 text-[10px] font-black uppercase text-[#1a162b] cursor-pointer"
                >
                  Clear
                </button>
              )}
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