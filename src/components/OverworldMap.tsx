import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  LogOut,
  Check,
  Sparkles,
  BookOpen,
  Swords,
  Compass,
  Flame,
  ShoppingBag,
  Egg,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { ELEMENTS } from '../data/elements';
import { getAllWordsList } from '../engine/forge';
import { juice } from '../engine/juice';
import { canPetEvolve, getEvolutionBranch } from '../data/evolutionData';
import { EvolutionSequenceModal } from './EvolutionSequenceModal';
import { CreatureSprite } from './CreatureSprite';
import { LexiDexModal } from './LexiDexModal';
import { ElementType, GradeTier, Word } from '../types';
import { getGradeTierMeta } from '../data/vocabDatabase';

type HubModalType =
  | null
  | 'word-world'
  | 'arena'
  | 'hatchery'
  | 'lexishop'
  | 'lexidex'
  | 'quests'
  | 'settings'
  | 'profile';

interface PrimaryHubNode {
  id: 'word-world' | 'arena' | 'hatchery' | 'forge' | 'lexishop';
  number: number;
  label: string;
  subtitle: string;
  badge: string;
  x: string;
  y: string;
  width: string;
  actionType: 'modal' | 'tab';
  modalTarget?: HubModalType;
  tabTarget?: 'loadout' | 'forge' | 'battle' | 'shop';
}

/**
 * Issue #11 + World Map Setup References (Bastion Sanctuary + Citadel Courtyard):
 * 5 Landmark Structures arranged around the central circular courtyard & golden sun-dial nexus:
 * 1. Word World Portal Monolith (Top-Center / 12 o'clock — 9 Elemental Adventure Realms)
 * 2. Word Forge Crucible & Red Crystal (Upper-Left / 10 o'clock — Morphology & Affix Fusion)
 * 3. Battle Arena Colosseum & Purple Banners (Lower-Left / 8 o'clock — Matchmaking & Boss Lobby)
 * 4. Pet Hatchery Sanctuary & Rooftop Pool (Upper-Right / 2 o'clock — Pet Arsenal, Stats & Eggs)
 * 5. Lexi-Shop Caravan & Timber Bazaar (Lower-Right / 4 o'clock — Storefront & Booster Packs)
 */
const PRIMARY_ISLAND_NODES: PrimaryHubNode[] = [
  {
    id: 'word-world',
    number: 1,
    label: 'Word World Portal',
    subtitle: 'Adventure Mode · 9 Elemental Areas',
    badge: '9 Realms',
    x: '50%',
    y: '27%',
    width: '23%',
    actionType: 'modal',
    modalTarget: 'word-world',
  },
  {
    id: 'forge',
    number: 4,
    label: 'Word Forge',
    subtitle: 'Blacksmith Furnace & Red Crystal',
    badge: 'Fusion Lab',
    x: '24%',
    y: '39%',
    width: '21%',
    actionType: 'tab',
    tabTarget: 'forge',
  },
  {
    id: 'arena',
    number: 2,
    label: 'Battle Arena',
    subtitle: 'Bannered Colosseum & Boss Pit',
    badge: 'Battle Mode',
    x: '20%',
    y: '64%',
    width: '22%',
    actionType: 'modal',
    modalTarget: 'arena',
  },
  {
    id: 'hatchery',
    number: 3,
    label: 'Pet Hatchery',
    subtitle: 'Rooftop Pool & Scroll Sanctuary',
    badge: 'Pets & Gear',
    x: '76%',
    y: '38%',
    width: '22%',
    actionType: 'modal',
    modalTarget: 'hatchery',
  },
  {
    id: 'lexishop',
    number: 5,
    label: 'Lexi-Shop Bazaar',
    subtitle: 'Merchant Wagon & Timber Lodge',
    badge: 'Storefront',
    x: '80%',
    y: '64%',
    width: '21%',
    actionType: 'modal',
    modalTarget: 'lexishop',
  },
];

interface ElementalAdventureArea {
  zoneId: string;
  order: number;
  name: string;
  element: ElementType;
  gradeBand: string;
  bossId: string;
  bossName: string;
  grammarFocus: string;
  color: string;
}

/**
 * 9 Linear / Node-Based Elemental Progression Areas inside Word World (Adventure Mode)
 */
const NINE_ELEMENTAL_AREAS: ElementalAdventureArea[] = [
  {
    zoneId: 'area-grass',
    order: 1,
    name: 'Emerald Grass Glade',
    element: 'grass',
    gradeBand: 'Kindergarten – Grade 1',
    bossId: 'boss_galecrest',
    bossName: 'Galecrest Wyvern',
    grammarFocus: 'Core Nouns & Action Verbs',
    color: '#4caf50',
  },
  {
    zoneId: 'area-water',
    order: 2,
    name: 'Azure Water Lagoon',
    element: 'water',
    gradeBand: 'Grade 1 – Grade 2',
    bossId: 'boss_leviathan',
    bossName: 'Tidal Leviathan',
    grammarFocus: 'Descriptive Adjectives & Shields',
    color: '#0288d1',
  },
  {
    zoneId: 'area-earth',
    order: 3,
    name: 'Sunfall Fossil Canyon',
    element: 'earth',
    gradeBand: 'Grade 2 – Grade 3',
    bossId: 'boss_ruptor',
    bossName: 'Ruptor the Break-Beast',
    grammarFocus: 'Compound Words & Root Foundations',
    color: '#8d6e63',
  },
  {
    zoneId: 'area-fire',
    order: 4,
    name: 'Fireforge Magma Caldera',
    element: 'fire',
    gradeBand: 'Grade 3',
    bossId: 'boss_pyrostorm',
    bossName: 'Pyrostorm Chimera',
    grammarFocus: 'Adverb + Verb Empowered Strikes',
    color: '#e53935',
  },
  {
    zoneId: 'area-ice',
    order: 5,
    name: 'Frostpeak Crystal Glacier',
    element: 'ice',
    gradeBand: 'Grade 3 – Grade 4',
    bossId: 'boss_dishornet',
    bossName: 'Dis-Hornet Swarm',
    grammarFocus: 'Prefixes (un-, re-, pre-, dis-)',
    color: '#00acc1',
  },
  {
    zoneId: 'area-air',
    order: 6,
    name: 'Tempest Sky Spire',
    element: 'air',
    gradeBand: 'Grade 4 – Grade 5',
    bossId: 'boss_zephyrlord',
    bossName: 'Tempest Griffin',
    grammarFocus: 'Suffixes (-ful, -less, -ly, -ness)',
    color: '#26a69a',
  },
  {
    zoneId: 'area-electric',
    order: 7,
    name: 'Volt-Rune Storm Citadel',
    element: 'electric',
    gradeBand: 'Grade 5',
    bossId: 'boss_voltarchon',
    bossName: 'Volt-Rune Dynamo',
    grammarFocus: 'High-Voltage 4-Card Sentence Weaving',
    color: '#ffb300',
  },
  {
    zoneId: 'area-shadow',
    order: 8,
    name: 'Shadowcrypt Golem Ruins',
    element: 'shadow',
    gradeBand: 'Grades 5 – 7 Extender',
    bossId: 'boss_umbralord',
    bossName: 'Umbra Golem Monarch',
    grammarFocus: 'Greek & Latin Morpheme Roots',
    color: '#5e35b1',
  },
  {
    zoneId: 'area-light',
    order: 9,
    name: 'Celestia Radiant Sanctum',
    element: 'light',
    gradeBand: 'Grades 6 – 8 High-Achiever',
    bossId: 'boss_sovereign',
    bossName: 'The Syntax Sovereign',
    grammarFocus: 'Mastery of All 4 Parts of Speech',
    color: '#fbc02d',
  },
];

interface OverworldMapProps {
  initialPanel?: 'shop' | 'hatchery' | null;
}

export const OverworldMap: React.FC<OverworldMapProps> = ({ initialPanel = null }) => {
  const {
    creatures,
    words,
    playerId,
    setPlayerId,
    isMuted,
    toggleMute,
    zoneProgress,
    startBattleInZone,
    setTab,
    restartBattle,
    levelUpPet,
    evolvePet,
    commitWord,
  } = useGame();
  const { currentUser, logout, setIsCustomizingAvatar, updateProfile, addRewards } = useAuth();

  const [selectedIslandId, setSelectedIslandId] = useState<PrimaryHubNode['id']>('word-world');
  const [activeModal, setActiveModal] = useState<HubModalType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [evolvingCreatureId, setEvolvingCreatureId] = useState<string | null>(null);

  // Arena Matchmaking Selection
  const [selectedArenaArea, setSelectedArenaArea] = useState<ElementalAdventureArea>(
    NINE_ELEMENTAL_AREAS[0]
  );

  // Interactive Claimable Quests State
  const [claimedQuestIds, setClaimedQuestIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wb_claimed_quests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Interactive 3-Tap Egg Incubator state
  const [eggTapCount, setEggTapCount] = useState<number>(0);
  const [hatchedReward, setHatchedReward] = useState<{
    petId: string;
    petName: string;
    bonusWord?: Word;
  } | null>(null);

  // 3-Card Booster Pack Opening state
  const [openedBoosterCards, setOpenedBoosterCards] = useState<Word[] | null>(null);
  const [flippedBoosterIndices, setFlippedBoosterIndices] = useState<number[]>([]);

  useEffect(() => {
    if (initialPanel === 'shop') {
      setActiveModal('lexishop');
    } else if (initialPanel === 'hatchery') {
      setActiveModal('hatchery');
    }
  }, [initialPanel]);

  const selectablePets = creatures.filter((c) => !c.id.startsWith('boss_'));
  const selectedPet = selectablePets.find((c) => c.id === playerId) || selectablePets[0];
  const allWords = getAllWordsList(words);

  const clearedAreasCount = NINE_ELEMENTAL_AREAS.filter(
    (a) => zoneProgress[a.zoneId]?.cleared
  ).length;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const handlePrimaryNodeClick = (node: PrimaryHubNode) => {
    setSelectedIslandId(node.id);
    juice.ding(680, 110);

    if (node.actionType === 'tab' && node.tabTarget) {
      setTab(node.tabTarget);
    } else if (node.actionType === 'modal' && node.modalTarget) {
      setActiveModal(node.modalTarget);
    }
  };

  const handleClaimQuest = (questId: string, coins: number, tokens: number) => {
    if (claimedQuestIds.includes(questId)) return;
    const next = [...claimedQuestIds, questId];
    setClaimedQuestIds(next);
    try {
      localStorage.setItem('wb_claimed_quests', JSON.stringify(next));
    } catch {}
    addRewards({ coins, tokens, xp: 35 });
    juice.fanfare();
    triggerToast(`Claimed Quest Reward: +${coins} 🪙 & +${tokens} 💎!`);
  };

  const handleTapIncubatorEgg = () => {
    const tokens = currentUser?.fusionTokens ?? 14;
    if (eggTapCount === 0 && tokens < 2) {
      triggerToast('Need at least 2 Fusion Gems to warm a Sky Egg!');
      return;
    }

    const nextTap = eggTapCount + 1;
    setEggTapCount(nextTap);
    juice.ding(520 + nextTap * 140, 120);

    if (nextTap >= 3) {
      if (currentUser) {
        updateProfile({
          fusionTokens: Math.max(0, tokens - 2),
          lexiCoins: (currentUser.lexiCoins || 0) + 50,
        });
      }
      const randomCompanion =
        selectablePets[Math.floor(Math.random() * selectablePets.length)] || selectedPet;
      levelUpPet(randomCompanion.id, 1);

      const extenderPool = allWords.filter((w) => w.gradeTier === 'extender' || w.gradeTier === '5');
      const bonusWord =
        extenderPool.length > 0
          ? extenderPool[Math.floor(Math.random() * extenderPool.length)]
          : allWords[0];

      setHatchedReward({
        petId: randomCompanion.id,
        petName: randomCompanion.name,
        bonusWord,
      });
      juice.fanfare();
      setEggTapCount(0);
    }
  };

  const handleBuyBoosterPack = (tierGroup: 'k-2' | '3-5' | 'extender', cost: number) => {
    const coins = currentUser?.lexiCoins ?? 450;
    if (coins < cost) {
      triggerToast(`Not enough Lexi-Coins! Need ${cost} coins.`);
      return;
    }

    const validTiers: GradeTier[] =
      tierGroup === 'k-2'
        ? ['K', '1', '2']
        : tierGroup === '3-5'
        ? ['3', '4', '5']
        : ['5', 'extender'];

    const pool = allWords.filter((w) => validTiers.includes(w.gradeTier || '3'));
    const chosen: Word[] = [];
    const copy = [...(pool.length >= 3 ? pool : allWords)];
    for (let i = 0; i < 3; i++) {
      if (copy.length === 0) break;
      const idx = Math.floor(Math.random() * copy.length);
      const picked = copy.splice(idx, 1)[0];
      const boostedWord: Word = {
        ...picked,
        powerBonus: (picked.powerBonus || 2) + (tierGroup === 'extender' ? 2 : 1),
      };
      commitWord(boostedWord);
      chosen.push(boostedWord);
    }

    if (currentUser) {
      updateProfile({
        lexiCoins: coins - cost,
      });
    }

    setOpenedBoosterCards(chosen);
    setFlippedBoosterIndices([]);
    juice.fanfare();
  };

  // Cel-Shaded JRPG Ribbon Signboard + Black-and-Gold Floor Rune Medallion
  const renderIslandNameplate = (node: PrimaryHubNode, isSelected: boolean) => (
    <div className="flex flex-col items-center -mt-2">
      <div
        className={`px-3 py-1 rounded-xl border-[3px] border-[#1a162b] font-display font-black text-xs sm:text-sm tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
          isSelected
            ? 'bg-gradient-to-b from-[#ffe57f] via-[#ffd54f] to-[#ffb300] text-[#1a162b] scale-105 shadow-[0_4px_0_#1a162b,0_0_18px_rgba(255,213,79,0.95)]'
            : 'bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#020617] text-[#fef08a] shadow-[0_4px_0_#1a162b]'
        }`}
      >
        {/* Black & Gold Circular Rune Medallion (Bastion Reference #1) */}
        <span className="w-5 h-5 rounded-full bg-[#1a162b] border-2 border-[#facc15] text-[#facc15] text-[10px] font-black flex items-center justify-center">
          {node.number}
        </span>
        <span>{node.label}</span>
        <span
          className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
            isSelected ? 'bg-[#1a162b] text-[#ffd54f]' : 'bg-[#facc15] text-[#1a162b]'
          }`}
        >
          {node.badge}
        </span>
      </div>
      <span className="mt-0.5 px-2.5 py-0.2 rounded-full bg-[#1a162b]/90 text-amber-100 font-bold text-[10px] border border-amber-400/30 shadow">
        {node.subtitle}
      </span>
    </div>
  );

  // Isometric Architectural Landmarks for the 5 Hub Areas (Bastion Ref #1 + Citadel Ref #2)
  const renderIslandArtwork = (id: PrimaryHubNode['id']) => {
    const ink = '#1a162b';
    switch (id) {
      case 'word-world':
        // 1. WORD WORLD PORTAL (12 o'clock) — Twin Rune-Carved Stone Monoliths + Glowing Blue Portal Vortex + Stepped Emerald Altar
        return (
          <svg viewBox="0 0 280 210" className="w-full h-auto drop-shadow-[0_12px_10px_rgba(15,23,42,0.65)] overflow-visible">
            <defs>
              <radialGradient id="portalVortex" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#38bdf8" />
                <stop offset="70%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Stepped Circular Stone & Emerald Altar Base */}
            <ellipse cx="140" cy="162" rx="112" ry="38" fill="#64748b" stroke={ink} strokeWidth="3.8" />
            <ellipse cx="140" cy="154" rx="96" ry="31" fill="#94a3b8" stroke={ink} strokeWidth="3.2" />
            <ellipse cx="140" cy="146" rx="76" ry="24" fill="#84cc16" stroke={ink} strokeWidth="3" />
            {/* Stepped Stone Stairs Leading Up */}
            <polygon points="112,166 168,166 178,194 102,194" fill="#cbd5e1" stroke={ink} strokeWidth="3" />
            <line x1="108" y1="175" x2="172" y2="175" stroke={ink} strokeWidth="2.5" />
            <line x1="105" y1="184" x2="175" y2="184" stroke={ink} strokeWidth="2.5" />

            {/* Left Carved Rune Monolith Pillar (Citadel Reference #2) */}
            <polygon
              points="58,150 48,48 76,20 98,52 94,150"
              fill="#475569"
              stroke={ink}
              strokeWidth="3.8"
              strokeLinejoin="round"
            />
            <path d="M56,64 L90,76 M54,96 L92,108 M60,126 L90,132" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />

            {/* Right Carved Rune Monolith Pillar */}
            <polygon
              points="186,150 182,52 204,20 232,48 222,150"
              fill="#475569"
              stroke={ink}
              strokeWidth="3.8"
              strokeLinejoin="round"
            />
            <path d="M224,64 L190,76 M226,96 L188,108 M220,126 L190,132" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />

            {/* Swirling Azure Portal Vortex Sphere in Center */}
            <circle cx="140" cy="98" r="54" fill="url(#portalVortex)" />
            <circle cx="140" cy="98" r="38" fill="none" stroke="#bae6fd" strokeWidth="3.5" strokeDasharray="10 6" />
            <circle cx="140" cy="98" r="22" fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" />

            {/* Floating Golden Crown Arch Above Portal */}
            <polygon points="116,28 140,8 164,28 152,36 128,36" fill="#facc15" stroke={ink} strokeWidth="3" />
          </svg>
        );

      case 'forge':
        // 4. WORD FORGE (10 o'clock) — Multi-Chimney Stone Furnace + Anvil + Glowing Crimson Crystal Obelisk (Refs #1 & #2)
        return (
          <svg viewBox="0 0 260 200" className="w-full h-auto drop-shadow-[0_11px_9px_rgba(15,23,42,0.65)] overflow-visible">
            {/* Isometric Cobblestone & Moss Terrace */}
            <polygon points="18,136 130,84 242,136 130,188" fill="#65a30d" stroke={ink} strokeWidth="3.8" strokeLinejoin="round" />
            <polygon points="44,134 130,94 216,134 130,174" fill="#78716c" stroke={ink} strokeWidth="3" />

            {/* Multi-Chimney Stone Blacksmith Workshop (Bastion Ref #1 Top-Left) */}
            <g stroke={ink} strokeWidth="3.5" strokeLinejoin="round">
              {/* Main Stone & Timber Forge Building */}
              <polygon points="74,136 74,64 136,42 184,64 184,136 136,156" fill="#57534e" />
              <polygon points="136,42 184,64 184,136 136,156" fill="#44403c" />
              {/* Slanted Timber Roof */}
              <polygon points="68,66 136,36 190,62 136,86" fill="#b45309" />
              {/* Twin Brick Chimneys Belching Warm Embers */}
              <rect x="86" y="20" width="22" height="42" fill="#78716c" />
              <rect x="82" y="14" width="30" height="8" fill="#a8a29e" />
              <rect x="116" y="10" width="24" height="42" fill="#78716c" />
              <rect x="112" y="4" width="32" height="8" fill="#a8a29e" />
              {/* Glowing Orange Furnace Archway */}
              <path d="M92,142 V104 Q112,88 132,104 V142 Z" fill="#ff6d00" />
              <path d="M98,142 V112 Q112,100 126,112 V142 Z" fill="#fde047" />
            </g>

            {/* Blacksmith Iron Anvil on Front Terrace */}
            <g stroke={ink} strokeWidth="3" strokeLinejoin="round">
              <rect x="144" y="136" width="28" height="12" fill="#334155" />
              <polygon points="136,124 180,124 170,136 146,136" fill="#64748b" />
            </g>

            {/* Glowing Red Forge Crystal Obelisk (Citadel Ref #2 Bottom-Left) */}
            <g stroke={ink} strokeWidth="3.2" strokeLinejoin="round">
              <ellipse cx="56" cy="148" rx="24" ry="10" fill="#475569" />
              <polygon points="44,146 38,92 56,68 72,94 68,146" fill="#ef4444" />
              <polygon points="56,68 72,94 68,146 56,146" fill="#b91c1c" />
              <ellipse cx="56" cy="122" rx="22" ry="7" fill="none" stroke="#facc15" strokeWidth="3" />
            </g>
          </svg>
        );

      case 'arena':
        // 2. BATTLE ARENA (8 o'clock) — Stepped Stone Colosseum Ring + Tall Royal Purple Banners + Crenellated Bastion (Refs #1 & #2)
        return (
          <svg viewBox="0 0 270 205" className="w-full h-auto drop-shadow-[0_11px_9px_rgba(15,23,42,0.65)] overflow-visible">
            {/* Stepped Circular Stone Arena Base */}
            <ellipse cx="135" cy="144" rx="108" ry="40" fill="#64748b" stroke={ink} strokeWidth="3.8" />
            <ellipse cx="135" cy="136" rx="90" ry="32" fill="#cbd5e1" stroke={ink} strokeWidth="3.4" />
            <ellipse cx="135" cy="130" rx="68" ry="23" fill="#475569" stroke="#facc15" strokeWidth="3.2" />

            {/* Crenellated Stone Bastion Wall & Tall Purple Combat Banners (Citadel Ref #2 Right) */}
            <g stroke={ink} strokeWidth="3.4" strokeLinejoin="round">
              {/* Stone Pillars */}
              <rect x="64" y="42" width="18" height="86" rx="3" fill="#94a3b8" />
              <rect x="104" y="30" width="18" height="92" rx="3" fill="#94a3b8" />
              <rect x="148" y="30" width="18" height="92" rx="3" fill="#94a3b8" />
              <rect x="188" y="42" width="18" height="86" rx="3" fill="#94a3b8" />

              {/* Hanging Royal Purple & Gold Pennant Banners */}
              <polygon points="67,50 79,50 79,112 73,120 67,112" fill="#7e22ce" stroke="#facc15" strokeWidth="2" />
              <polygon points="107,38 119,38 119,104 113,112 107,104" fill="#7e22ce" stroke="#facc15" strokeWidth="2" />
              <polygon points="151,38 163,38 163,104 157,112 151,104" fill="#7e22ce" stroke="#facc15" strokeWidth="2" />
              <polygon points="191,50 203,50 203,112 197,120 191,112" fill="#7e22ce" stroke="#facc15" strokeWidth="2" />
            </g>

            {/* Crossed Golden Greatswords & Flaming Braziers in the Arena Center */}
            <g stroke={ink} strokeWidth="3.2" strokeLinejoin="round">
              <circle cx="84" cy="134" r="10" fill="#f59e0b" />
              <circle cx="186" cy="134" r="10" fill="#f59e0b" />
              <polygon points="135,74 118,118 135,142 152,118" fill="#facc15" />
              <circle cx="135" cy="114" r="8" fill="#ef4444" />
            </g>
          </svg>
        );

      case 'hatchery':
        // 3. PET HATCHERY (2 o'clock) — Tiered Sanctuary Temple with Glowing Turquoise Rooftop Water Pool, Crimson Palm & Scroll Tower (Bastion Ref #1 Right)
        return (
          <svg viewBox="0 0 270 210" className="w-full h-auto drop-shadow-[0_11px_9px_rgba(15,23,42,0.65)] overflow-visible">
            {/* Lush Mossy Sanctuary Terrace */}
            <polygon points="20,142 135,90 250,142 135,194" fill="#84cc16" stroke={ink} strokeWidth="3.8" strokeLinejoin="round" />

            {/* Tall Parchment Scroll Tower on Back-Left (Bastion Ref #1 1 o'clock) */}
            <g stroke={ink} strokeWidth="3.4" strokeLinejoin="round">
              <rect x="64" y="24" width="38" height="96" fill="#d6d3d1" />
              <polygon points="58,26 83,8 108,26" fill="#0284c7" />
              {/* Giant Unfurling Parchment Scroll */}
              <rect x="88" y="42" width="26" height="52" rx="4" fill="#fef3c7" />
              <line x1="84" y1="42" x2="118" y2="42" stroke="#78350f" strokeWidth="4" />
            </g>

            {/* Tiered Timber & Stone Temple with Glowing Turquoise Rooftop Pool (Bastion Ref #1 2 o'clock) */}
            <g stroke={ink} strokeWidth="3.6" strokeLinejoin="round">
              <polygon points="84,142 84,84 152,58 216,84 216,142 152,172" fill="#b45309" />
              <polygon points="152,58 216,84 216,142 152,172" fill="#78350f" />
              {/* Glowing Turquoise Rooftop Incubation Pool */}
              <polygon points="92,84 152,60 208,84 152,108" fill="#fde68a" />
              <polygon points="106,84 152,66 194,84 152,102" fill="#22d3ee" />
              {/* Golden Companion Egg Nesting Beside Pool */}
              <ellipse cx="152" cy="82" rx="13" ry="17" fill="#facc15" />
            </g>

            {/* Exotic Crimson-and-Violet Palm Tree Rising Above Pool */}
            <g stroke={ink} strokeWidth="3" strokeLinejoin="round">
              <path d="M182,78 Q192,48 184,26" stroke="#78350f" strokeWidth="5" fill="none" />
              <path d="M184,26 Q156,16 152,34 Q170,32 184,26 Z" fill="#e11d48" />
              <path d="M184,26 Q212,14 216,32 Q198,32 184,26 Z" fill="#9333ea" />
              <path d="M184,26 Q184,4 202,12 Q194,24 184,26 Z" fill="#f43f5e" />
            </g>
          </svg>
        );

      case 'lexishop':
        // 5. LEXI-SHOP BAZAAR (4 o'clock) — Timber Merchant Lodge with Blue Lantern Flames + Green-Canopied Caravan Wagon (Refs #1 & #2)
        return (
          <svg viewBox="0 0 260 200" className="w-full h-auto drop-shadow-[0_11px_9px_rgba(15,23,42,0.65)] overflow-visible">
            {/* Cobblestone & Grass Bazaar Terrace */}
            <polygon points="18,136 130,84 242,136 130,188" fill="#84cc16" stroke={ink} strokeWidth="3.8" strokeLinejoin="round" />

            {/* Cozy Timber & White Canvas Merchant Lodge (Bastion Ref #1 4 o'clock) */}
            <g stroke={ink} strokeWidth="3.5" strokeLinejoin="round">
              <polygon points="108,138 108,74 166,48 218,74 218,138 166,162" fill="#92400e" />
              {/* Slanted White-and-Gold Canvas Awning Roof */}
              <polygon points="100,82 164,44 224,74 164,112" fill="#fef3c7" />
              <line x1="122" y1="69" x2="184" y2="100" stroke="#f59e0b" strokeWidth="4" />
              <line x1="144" y1="56" x2="204" y2="87" stroke="#ef4444" strokeWidth="4" />
              {/* Glowing Blue Magic Brazier on Rooftop */}
              <circle cx="164" cy="36" r="10" fill="#38bdf8" />
              <polygon points="156,36 164,16 172,36" fill="#bae6fd" />
            </g>

            {/* Green-Canopied Merchant Caravan Wagon on Front-Left (Citadel Ref #2 Bottom-Left) */}
            <g stroke={ink} strokeWidth="3.2" strokeLinejoin="round">
              <rect x="46" y="98" width="66" height="40" rx="10" fill="#65a30d" />
              <path d="M46,112 H112 M68,98 V138 M90,98 V138" stroke="#365314" strokeWidth="2.8" />
              {/* Wagon Wheels */}
              <circle cx="62" cy="142" r="11" fill="#78350f" />
              <circle cx="98" cy="142" r="11" fill="#78350f" />
              {/* Treasure Chest */}
              <rect x="118" y="132" width="24" height="18" rx="3" fill="#facc15" />
            </g>
          </svg>
        );
    }
  };

  const renderModalContent = () => {
    if (!activeModal) return null;

    return (
      <div
        className="fixed inset-0 z-50 bg-[#1a162b]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
        onClick={() => setActiveModal(null)}
      >
        <div
          className="relative w-full max-w-4xl bg-[#fff8e7] border-[5px] border-[#1a162b] rounded-3xl shadow-[0_12px_0_#1a162b,0_20px_50px_rgba(0,0,0,0.75)] overflow-hidden animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header — Monster-Tamer JRPG Banner */}
          <div className="bg-gradient-to-r from-[#283593] via-[#3949ab] to-[#1a237e] px-6 py-4 flex items-center justify-between border-b-[4px] border-[#1a162b]">
            <h2 className="font-display font-black text-xl sm:text-2xl text-[#ffd54f] tracking-wide drop-shadow-[0_2px_0_#1a162b] flex items-center gap-2.5">
              {activeModal === 'word-world' && '🌍 1. Word World — 9 Elemental Adventure Realms'}
              {activeModal === 'arena' && '⚔️ 2. Battle Arena — Matchmaking & Boss Lobby'}
              {activeModal === 'hatchery' && '🥚 3. Pet Hatchery — Arsenal, Stats & Training'}
              {activeModal === 'lexishop' && '🏪 5. Lexi-Shop — K–8 Booster Packs & Upgrades'}
              {activeModal === 'quests' && '📋 Explorer Guild Quests & Rewards'}
              {activeModal === 'settings' && '⚙️ Game Settings & Explorer Account'}
              {activeModal === 'profile' && '🛡️ Official Aetheria Tamer License'}
            </h2>
            <button
              onClick={() => setActiveModal(null)}
              className="w-9 h-9 rounded-xl bg-[#e53935] hover:bg-[#f44336] text-white font-black border-[3px] border-[#1a162b] shadow-[0_3px_0_#1a162b] active:translate-y-0.5 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 max-h-[78vh] overflow-y-auto space-y-5 text-[#1a162b]">
            {/* ===============================================================
                1. WORD WORLD (ADVENTURE MODE): 9 ELEMENTAL AREAS PROGRESSION
            ================================================================ */}
            {activeModal === 'word-world' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#e8eaf6] p-3.5 rounded-2xl border-[3px] border-[#1a162b]">
                  <div>
                    <div className="font-display font-black text-base text-[#1a162b]">
                      Elemental Campaign Progression ({clearedAreasCount} / 9 Areas Cleared)
                    </div>
                    <p className="text-xs font-bold text-[#3949ab]">
                      Progress through all 9 Elemental Areas from Kindergarten roots to Grades 6–8 High-Achiever Extenders!
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#1a162b] text-[#ffd54f] px-3 py-1.5 rounded-xl font-display font-black text-xs">
                    <span>Active Partner: {selectedPet.name}</span>
                    <span>· Lv.{selectedPet.level || 8}</span>
                  </div>
                </div>

                {/* 9-Node Elemental Progression Trail */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {NINE_ELEMENTAL_AREAS.map((area) => {
                    const prog = zoneProgress[area.zoneId] || { stars: 0, cleared: false };
                    const elemMeta = ELEMENTS[area.element] || ELEMENTS.fire;

                    return (
                      <div
                        key={area.zoneId}
                        className="flex flex-col justify-between rounded-2xl border-[3px] border-[#1a162b] bg-white p-3.5 shadow-[0_5px_0_#1a162b] hover:-translate-y-0.5 transition-transform"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className="px-2 py-0.5 rounded-md border-2 border-[#1a162b] font-display font-black text-[10px] text-white uppercase"
                              style={{ backgroundColor: area.color }}
                            >
                              Area {area.order} · {elemMeta.icon} {elemMeta.name}
                            </span>
                            <span className="font-mono text-xs font-black text-[#f57f17]">
                              {'★'.repeat(prog.stars)}
                              {'☆'.repeat(Math.max(0, 3 - prog.stars))}
                            </span>
                          </div>

                          <div className="mt-2.5 flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-[#f5ebd6] border-2 border-[#1a162b] flex items-center justify-center shrink-0">
                              <CreatureSprite
                                creatureId={area.bossId}
                                stage={3}
                                element={area.element}
                                size="sm"
                                animated={false}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-display font-black text-base text-[#1a162b] truncate">
                                {area.name}
                              </div>
                              <div className="text-[11px] font-extrabold text-[#d84315]">
                                Boss: {area.bossName}
                              </div>
                              <div className="text-[10px] font-bold text-[#5d4037]">
                                {area.gradeBand}
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 rounded-xl bg-[#fff8e7] border border-[#e6d0a7] px-2.5 py-1.5 text-[11px] font-bold text-[#4e342e]">
                            🎯 {area.grammarFocus}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setActiveModal(null);
                            startBattleInZone(area.zoneId, area.bossId);
                          }}
                          className="mt-3 w-full py-2 rounded-xl bg-gradient-to-b from-[#66bb6a] to-[#2e7d32] hover:brightness-110 text-white font-display font-black text-xs uppercase tracking-wider border-2 border-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
                        >
                          {prog.cleared ? 'Replay Area ★' : 'Enter Area Battle →'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===============================================================
                2. ARENA (BATTLE MODE): DEDICATED MATCHMAKING & BATTLE LOBBY
            ================================================================ */}
            {activeModal === 'arena' && (
              <div className="space-y-5">
                {/* Split Versus Matchmaking Card */}
                <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4 rounded-3xl border-[4px] border-[#1a162b] bg-gradient-to-r from-[#e3f2fd] via-[#fff8e1] to-[#fce4ec] p-5 shadow-[0_6px_0_#1a162b]">
                  {/* Player Side */}
                  <div className="md:col-span-5 flex flex-col items-center text-center bg-white/90 p-4 rounded-2xl border-[3px] border-[#1a162b]">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#2e7d32] text-white">
                      Your Active Challenger
                    </span>
                    <div className="my-2">
                      <CreatureSprite
                        creatureId={selectedPet.id}
                        stage={selectedPet.stage || 1}
                        element={selectedPet.element}
                        size="lg"
                      />
                    </div>
                    <div className="font-display font-black text-xl text-[#1a162b]">
                      {selectedPet.name}
                    </div>
                    <div className="text-xs font-bold text-[#5d4037]">
                      Lv.{selectedPet.level || 8} · {ELEMENTS[selectedPet.element]?.name} Affinity
                    </div>
                    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                      {selectablePets.map((pet) => (
                        <button
                          key={pet.id}
                          onClick={() => {
                            setPlayerId(pet.id);
                            restartBattle(pet.id);
                            juice.click();
                          }}
                          className={`px-2.5 py-1 rounded-lg border-2 border-[#1a162b] text-[10px] font-black cursor-pointer ${
                            pet.id === selectedPet.id
                              ? 'bg-[#ffd54f] text-[#1a162b]'
                              : 'bg-[#f5f5f5] text-[#5d4037] hover:bg-[#ffe082]'
                          }`}
                        >
                          {pet.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* VS Badge */}
                  <div className="md:col-span-1 flex justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-[#ffd54f] to-[#ff6f00] border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] flex items-center justify-center font-display font-black text-xl text-[#1a162b]">
                      VS
                    </div>
                  </div>

                  {/* Opponent Side */}
                  <div className="md:col-span-5 flex flex-col items-center text-center bg-white/90 p-4 rounded-2xl border-[3px] border-[#1a162b]">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#c62828] text-white">
                      Arena Champion · {selectedArenaArea.gradeBand}
                    </span>
                    <div className="my-2">
                      <CreatureSprite
                        creatureId={selectedArenaArea.bossId}
                        stage={3}
                        element={selectedArenaArea.element}
                        size="lg"
                      />
                    </div>
                    <div className="font-display font-black text-xl text-[#1a162b]">
                      {selectedArenaArea.bossName}
                    </div>
                    <div className="text-xs font-bold text-[#5d4037]">
                      {selectedArenaArea.name} · {ELEMENTS[selectedArenaArea.element]?.name} Type
                    </div>
                    <div className="mt-2 text-[11px] font-extrabold text-[#283593]">
                      Specialty: {selectedArenaArea.grammarFocus}
                    </div>
                  </div>
                </div>

                {/* Opponent Selector Strip */}
                <div>
                  <div className="font-display font-black text-sm text-[#1a162b] mb-2">
                    Select Arena Matchup Opponent:
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                    {NINE_ELEMENTAL_AREAS.map((area) => {
                      const active = selectedArenaArea.zoneId === area.zoneId;
                      return (
                        <button
                          key={area.zoneId}
                          onClick={() => {
                            setSelectedArenaArea(area);
                            juice.click();
                          }}
                          className={`p-2 rounded-xl border-2 border-[#1a162b] flex flex-col items-center text-center cursor-pointer transition-all ${
                            active
                              ? 'bg-[#ffd54f] scale-105 shadow-[0_3px_0_#1a162b]'
                              : 'bg-white hover:bg-[#fff8e1]'
                          }`}
                        >
                          <span className="text-base">{ELEMENTS[area.element]?.icon}</span>
                          <span className="font-display font-black text-[10px] truncate w-full mt-0.5">
                            {area.bossName.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Launch Arena Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      const randomArea =
                        NINE_ELEMENTAL_AREAS[
                          Math.floor(Math.random() * NINE_ELEMENTAL_AREAS.length)
                        ];
                      setActiveModal(null);
                      startBattleInZone(randomArea.zoneId, randomArea.bossId);
                    }}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-b from-[#4fc3f7] to-[#0288d1] text-white font-display font-black text-sm border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] cursor-pointer"
                  >
                    🎲 Quick Random Matchmaking
                  </button>
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      startBattleInZone(selectedArenaArea.zoneId, selectedArenaArea.bossId);
                    }}
                    className="px-7 py-3 rounded-2xl bg-gradient-to-b from-[#66bb6a] to-[#2e7d32] text-white font-display font-black text-base border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] cursor-pointer"
                  >
                    ⚔️ Start Arena Battle!
                  </button>
                </div>
              </div>
            )}

            {/* ===============================================================
                3. PET HATCHERY: EGG INCUBATOR, ROSTER, STATS & TRAINING
            ================================================================ */}
            {activeModal === 'hatchery' && (
              <div className="space-y-5">
                {/* Top Action Bar: Open Full Word Loadout Arsenal */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fff3e0] p-3.5 rounded-2xl border-[3px] border-[#1a162b]">
                  <div>
                    <div className="font-display font-black text-base text-[#1a162b]">
                      Companion Sanctuary, Stat Training &amp; Egg Incubator
                    </div>
                    <p className="text-xs font-bold text-[#5d4037]">
                      Hatch Sky Eggs, train companion levels, trigger 3-stage Evolutions, or equip K–8 Word Cards!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      setTab('loadout');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#4fc3f7] to-[#0288d1] text-white font-display font-black text-xs border-[3px] border-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
                  >
                    🎒 Equip Word Cards (Arsenal) →
                  </button>
                </div>

                {/* 3-Tap Sky Egg Incubator */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#e8f5e9] to-[#c8e6c9] border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleTapIncubatorEgg}
                      className={`relative w-24 h-28 flex items-center justify-center cursor-pointer transition-transform shrink-0 ${
                        eggTapCount === 1
                          ? 'rotate-[-6deg] scale-105'
                          : eggTapCount === 2
                          ? 'rotate-[8deg] scale-110'
                          : 'hover:scale-105'
                      }`}
                      title="Tap 3 times to hatch!"
                    >
                      <svg viewBox="0 0 120 140" className="w-full h-full overflow-visible drop-shadow">
                        <ellipse cx="60" cy="122" rx="44" ry="12" fill="#8d6e63" stroke="#1a162b" strokeWidth="3.5" />
                        <path
                          d="M60 14 C30 14 22 62 22 92 C22 116 38 126 60 126 C82 126 98 116 98 92 C98 62 90 14 60 14 Z"
                          fill="#ffd54f"
                          stroke="#1a162b"
                          strokeWidth="4"
                        />
                        <circle cx="45" cy="55" r="8" fill="#ffb300" />
                        <circle cx="74" cy="48" r="6" fill="#ffb300" />
                        <circle cx="65" cy="82" r="10" fill="#ffb300" />
                        {eggTapCount >= 1 && (
                          <path d="M42 66 L55 76 L48 88" stroke="#1a162b" strokeWidth="3.5" fill="none" />
                        )}
                        {eggTapCount >= 2 && (
                          <path d="M78 54 L62 72 L74 84 L58 98" stroke="#1a162b" strokeWidth="4" fill="none" />
                        )}
                      </svg>
                    </button>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#1b5e20] bg-[#a5d6a7] px-2.5 py-0.5 rounded-full border border-[#1a162b]">
                        3-Tap Sky Incubator · 2 💎 Fusion Gems
                      </span>
                      <h3 className="font-display font-black text-lg text-[#1b5e20] mt-1">
                        {eggTapCount === 0
                          ? 'Tap the Golden Egg 3 Times to Hatch!'
                          : `Cracking Egg... (${eggTapCount} / 3 Taps!)`}
                      </h3>
                      <p className="text-xs font-bold text-[#2e7d32]">
                        Grants +1 Companion Level, +50 Lexi-Coins, and a High-Achiever Word!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleTapIncubatorEgg}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#ffd54f] to-[#ffb300] text-[#1a162b] font-display font-black text-xs border-[3px] border-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer whitespace-nowrap"
                  >
                    Tap Egg ({eggTapCount}/3)
                  </button>
                </div>

                {hatchedReward && (
                  <div className="p-3.5 rounded-2xl bg-[#fffdf7] border-[3px] border-[#1a162b] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CreatureSprite
                        creatureId={hatchedReward.petId}
                        stage={creatures.find((c) => c.id === hatchedReward.petId)?.stage || 1}
                        element={creatures.find((c) => c.id === hatchedReward.petId)?.element || 'fire'}
                        size="sm"
                      />
                      <div>
                        <div className="font-display font-black text-sm text-[#1a162b]">
                          ✨ {hatchedReward.petName} gained +1 Level!
                        </div>
                        {hatchedReward.bonusWord && (
                          <div className="text-xs font-bold text-[#4e342e]">
                            Bonus Word: <strong>"{hatchedReward.bonusWord.word}"</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Companion Roster & Training Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {selectablePets.map((pet) => {
                    const isSelected = pet.id === playerId;
                    const petLevel = pet.level ?? 8;
                    const petStage = pet.stage ?? 1;
                    const readyToEvolve = canPetEvolve(pet);
                    const evoLine = getEvolutionBranch(pet);
                    const maxStage = evoLine.length;

                    return (
                      <div
                        key={pet.id}
                        onClick={() => {
                          setPlayerId(pet.id);
                          restartBattle(pet.id);
                          juice.ding(740, 120);
                          triggerToast(`${pet.name} is now your active companion!`);
                        }}
                        className={`flex flex-col justify-between p-3.5 rounded-2xl border-[3px] transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-b from-[#fff8e1] to-[#ffecb3] border-[#1a162b] shadow-[0_5px_0_#1a162b]'
                            : 'bg-white border-[#1a162b] hover:bg-[#fffdf7] shadow-[0_3px_0_#1a162b]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-[#f5e6c8] border-[3px] border-[#1a162b] flex items-center justify-center relative shrink-0">
                            <CreatureSprite
                              creatureId={pet.forged?.sourceId || pet.id}
                              stage={petStage}
                              element={pet.element}
                              size="sm"
                            />
                            <span className="absolute -bottom-1.5 -right-1.5 bg-[#1a162b] text-[#ffd54f] text-[10px] font-black px-1.5 py-0.5 rounded-md border border-[#ffd54f]">
                              Lv.{petLevel}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <div className="font-display font-black text-base text-[#1a162b] truncate">
                                {pet.name}
                              </div>
                              {isSelected && (
                                <span className="px-2 py-0.5 rounded-md bg-[#2e7d32] text-white text-[10px] font-black uppercase shrink-0">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-bold text-[#5d4037] uppercase">
                              {ELEMENTS[pet.element]?.name || pet.element} · Stage {petStage}/{maxStage}
                            </div>
                            <div className="text-[11px] font-extrabold text-[#1a162b] mt-1">
                              HP {pet.stats.hp} · ATK {pet.stats.attack} · DEF {pet.stats.defense}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t-2 border-[#e6d0a7] flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const coins = currentUser?.lexiCoins ?? 0;
                              if (coins < 50) {
                                triggerToast('Need 50 Lexi-Coins to train!');
                                return;
                              }
                              updateProfile({ lexiCoins: coins - 50 });
                              levelUpPet(pet.id, 1);
                              triggerToast(`${pet.name} trained to Lv.${petLevel + 1}!`);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-[#fff3e0] hover:bg-[#ffe0b2] border-2 border-[#1a162b] text-[#1a162b] font-display font-black text-[11px] shadow-[0_2px_0_#1a162b] cursor-pointer"
                          >
                            Train (+1 Lv · 50 🪙)
                          </button>

                          {readyToEvolve ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                juice.fanfare();
                                setEvolvingCreatureId(pet.id);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#ffca28] to-[#ff6f00] text-[#1a162b] font-display font-black text-xs border-2 border-[#1a162b] shadow-[0_2px_0_#1a162b] flex items-center gap-1 animate-bounce cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Evolve!
                            </button>
                          ) : petStage < maxStage ? (
                            <span className="text-[10px] font-black text-[#5d4037]">
                              Evolves at Lv.{pet.evolvesAtLevel || 10}
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-[#e65100]">
                              ★ Max Form
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===============================================================
                5. LEXI-SHOP: K-8 BOOSTER PACKS & EVOLUTION ELIXIRS
            ================================================================ */}
            {activeModal === 'lexishop' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-[#fff3e0] p-3.5 rounded-2xl border-[3px] border-[#1a162b]">
                  <span className="font-bold text-sm">
                    Your Purse:{' '}
                    <strong className="text-[#e65100] font-black">
                      {(currentUser?.lexiCoins ?? 450).toLocaleString()} Lexi-Coins
                    </strong>
                  </span>
                  <span className="text-xs font-extrabold text-[#5d4037]">
                    💎 {currentUser?.fusionTokens ?? 14} Fusion Gems
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#dcfce7] text-[#166534] border border-[#1a162b]">
                        Grades K–2
                      </span>
                      <div className="font-display font-black text-base mt-2">
                        🌱 Sprout Explorer Pack
                      </div>
                      <p className="text-xs text-[#5d4037] font-semibold mt-1">
                        Unlocks or boosts 3 Kindergarten to 2nd Grade core words (+1 Power).
                      </p>
                    </div>
                    <button
                      onClick={() => handleBuyBoosterPack('k-2', 75)}
                      className="mt-3 w-full py-2 rounded-xl bg-gradient-to-b from-[#ffd54f] to-[#ffb300] border-2 border-[#1a162b] font-display font-black text-xs text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
                    >
                      Open Pack · 75 🪙
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#dbeafe] text-[#1e40af] border border-[#1a162b]">
                        Grades 3–5
                      </span>
                      <div className="font-display font-black text-base mt-2">
                        ⚔️ Adventurer Rune Pack
                      </div>
                      <p className="text-xs text-[#5d4037] font-semibold mt-1">
                        Unlocks or boosts 3 Upper-Elementary academic vocabulary cards (+1 Power).
                      </p>
                    </div>
                    <button
                      onClick={() => handleBuyBoosterPack('3-5', 110)}
                      className="mt-3 w-full py-2 rounded-xl bg-gradient-to-b from-[#4fc3f7] to-[#0288d1] border-2 border-[#1a162b] font-display font-black text-xs text-white shadow-[0_3px_0_#1a162b] cursor-pointer"
                    >
                      Open Pack · 110 🪙
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#f3e8ff] text-[#6b21a8] border border-[#1a162b]">
                        Grades 6–8 Extender
                      </span>
                      <div className="font-display font-black text-base mt-2">
                        👑 High-Achiever Pack
                      </div>
                      <p className="text-xs text-[#5d4037] font-semibold mt-1">
                        Unlocks or supercharges 3 Middle-School Extender Challenge cards (+2 Power)!
                      </p>
                    </div>
                    <button
                      onClick={() => handleBuyBoosterPack('extender', 160)}
                      className="mt-3 w-full py-2 rounded-xl bg-gradient-to-b from-[#ab47bc] to-[#6a1b9a] border-2 border-[#1a162b] font-display font-black text-xs text-white shadow-[0_3px_0_#1a162b] cursor-pointer"
                    >
                      Open Pack · 160 🪙
                    </button>
                  </div>
                </div>

                {openedBoosterCards && (
                  <div className="p-4 rounded-2xl bg-[#1a162b] text-white border-[3px] border-[#ffd54f]">
                    <div className="text-xs font-black uppercase tracking-wider text-[#ffd54f] mb-3 text-center">
                      ✨ Click Cards to Flip &amp; Speak Aloud! ✨
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {openedBoosterCards.map((card, idx) => {
                        const isFlipped = flippedBoosterIndices.includes(idx);
                        const tierMeta = getGradeTierMeta(card.gradeTier);
                        return (
                          <div
                            key={`${card.id}-${idx}`}
                            onClick={() => {
                              if (!isFlipped) {
                                setFlippedBoosterIndices((prev) => [...prev, idx]);
                              }
                              juice.speakWord(card.word);
                            }}
                            className="p-3 rounded-xl bg-[#fff8e7] text-[#1a162b] border-2 border-[#ffd54f] cursor-pointer transition-transform hover:scale-105"
                          >
                            <div className="flex items-center justify-between text-[10px] font-black">
                              <span className="uppercase text-[#5d4037]">{card.partOfSpeech}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded border ${tierMeta.badgeBg} ${tierMeta.badgeText} ${tierMeta.badgeBorder}`}
                              >
                                {tierMeta.shortLabel}
                              </span>
                            </div>
                            <div className="font-display font-black text-lg text-[#1a162b] mt-1">
                              {card.word}
                            </div>
                            <div className="text-[11px] font-semibold text-[#5d4037] mt-0.5">
                              {card.definition}
                            </div>
                            <div className="mt-2 text-[11px] font-black text-[#2e7d32]">
                              +{card.powerBonus || 2} Combat Power
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===============================================================
                INTERACTIVE CLAIMABLE QUESTS (Issue #5 Fix)
            ================================================================ */}
            {activeModal === 'quests' && (
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
                    title: 'Unlock 50+ K–8 Vocabulary Words in Your Grimoire',
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
                          onClick={() => handleClaimQuest(q.id, q.coins, q.tokens)}
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
              </div>
            )}

            {activeModal === 'profile' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] flex items-center gap-4">
                  <CreatureSprite
                    creatureId={selectedPet.forged?.sourceId || selectedPet.id}
                    stage={selectedPet.stage || 1}
                    element={selectedPet.element}
                    size="md"
                  />
                  <div>
                    <div className="text-xs font-black uppercase text-[#283593]">
                      Aetheria Official Tamer License
                    </div>
                    <div className="font-display font-black text-xl">
                      {currentUser?.displayName || 'Aris'} &amp; {selectedPet.name}
                    </div>
                    <div className="text-xs font-bold text-[#5d4037] mt-1">
                      Elemental Areas Cleared: <strong>{clearedAreasCount} / 9</strong> · Vocabulary Catalog: <strong>{allWords.length} Words</strong>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      setIsCustomizingAvatar(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#ffd54f] to-[#ffb300] border-[3px] border-[#1a162b] font-display font-black text-xs text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
                  >
                    Customize Explorer Avatar
                  </button>
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      setTab('loadout');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#4fc3f7] to-[#0288d1] border-[3px] border-[#1a162b] font-display font-black text-xs text-white shadow-[0_3px_0_#1a162b] cursor-pointer"
                  >
                    Open Word Arsenal
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'settings' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white border-[3px] border-[#1a162b]">
                  <div>
                    <div className="font-display font-black text-base">
                      Voice Read-Aloud &amp; Sound FX
                    </div>
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
                      setActiveModal(null);
                      logout();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#e53935] text-white border-2 border-[#1a162b] font-black text-xs cursor-pointer"
                  >
                    Log Out Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const evolvingPet = creatures.find((c) => c.id === evolvingCreatureId) || null;
  const avatarSkin = '#fff8e7';
  const avatarOutfit = currentUser?.avatarConfig?.colorTheme || '#3949ab';
  const avatarEmoji = currentUser?.avatarConfig?.emoji || currentUser?.avatarEmoji || '🦊';

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-gradient-to-b from-[#fef3c7] via-[#fde68a] to-[#d97706]">
      {/* =====================================================================
          UNIFIED ISOMETRIC SKY-SANCTUARY & CITADEL COURTYARD HUB
          Inspired by Reference #1 (Bastion Sky-Sanctuary) & Reference #2 (Citadel Courtyard)
      ====================================================================== */}
      <svg
        viewBox="0 0 1600 950"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <defs>
          <linearGradient id="valleySky" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d9f99d" />
            <stop offset="45%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <radialGradient id="sanctuaryTurf" cx="50%" cy="52%" r="48%">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="65%" stopColor="#65a30d" />
            <stop offset="100%" stopColor="#3f6212" />
          </radialGradient>
        </defs>

        {/* Distant Sunlit Canyon, Forest Canopy & Cascading Waterfalls (Bastion Ref #1 Background) */}
        <rect width="1600" height="950" fill="url(#valleySky)" />

        {/* Top-Left Deep Forest Canopy & Misty Waterfall Cliff */}
        <path
          d="M0,0 L620,0 L420,380 L180,680 L0,760 Z"
          fill="#365314"
          opacity="0.55"
        />
        <path
          d="M0,520 Q160,540 280,680 L280,950 L0,950 Z"
          fill="#4d7c0f"
          opacity="0.45"
        />
        {/* Cascading Misty Waterfalls on Bottom-Left */}
        <path
          d="M110,640 V950 M155,660 V950 M205,690 V950"
          stroke="#e0f2fe"
          strokeWidth="18"
          opacity="0.55"
          strokeLinecap="round"
        />

        {/* Right Golden Terraced Canyon Valley (Bastion Ref #1 Right Side) */}
        <path
          d="M1140,0 L1600,0 L1600,950 L980,950 L1220,520 Z"
          fill="#d97706"
          opacity="0.35"
        />
        <path
          d="M1120,620 Q1360,590 1600,680 M1080,710 Q1340,680 1600,770 M1040,800 Q1320,770 1600,860"
          stroke="#b45309"
          strokeWidth="5"
          fill="none"
          opacity="0.45"
        />

        {/* ===================================================================
            CANTILEVERED WOODEN AIRSHIP DOCKS & PIERS ON LOWER RIM (Bastion Ref #1)
        ==================================================================== */}
        <g stroke="#1a162b" strokeWidth="4" fill="#78350f" strokeLinejoin="round">
          {/* Left Wooden Piers */}
          <polygon points="360,670 460,640 490,695 385,730" />
          <polygon points="480,725 565,690 595,755 505,795" />
          <polygon points="620,765 690,745 675,855 600,840" />
          {/* Right Wooden Piers */}
          <polygon points="1240,670 1140,640 1110,695 1215,730" />
          <polygon points="1120,725 1035,690 1005,755 1095,795" />
          <polygon points="980,765 910,745 925,855 1000,840" />
        </g>

        {/* ===================================================================
            GRAND FLOATING SKY-SANCTUARY CONTINENT & CLIFF UNDERSIDE
        ==================================================================== */}
        {/* Deep Jagged Stone Cliff Underside */}
        <polygon
          points="190,515 260,645 450,745 680,810 800,845 920,810 1150,745 1340,645 1410,515 800,620"
          fill="#332922"
          stroke="#1a162b"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <polygon
          points="215,495 310,610 510,705 800,775 1090,705 1290,610 1385,495 800,560"
          fill="#57473c"
          stroke="#1a162b"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Main Lush Isometric Sanctuary Lawn & Moss Continent */}
        <polygon
          points="800,150 1160,220 1410,485 1260,675 940,760 660,760 340,675 190,485 440,220"
          fill="url(#sanctuaryTurf)"
          stroke="#1a162b"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* ===================================================================
            RADIAL STONE COURTYARD WALKWAYS & STEPPED PATHS (Citadel Ref #2)
        ==================================================================== */}
        <g stroke="#1a162b" strokeWidth="3.5" strokeLinejoin="round">
          {/* Path to 12 o'clock Word World Portal */}
          <polygon points="745,250 855,250 875,490 725,490" fill="#a3e635" />
          {/* Stepped Stone Slabs along North Path */}
          <rect x="760" y="310" width="80" height="14" rx="4" fill="#94a3b8" />
          <rect x="755" y="340" width="90" height="14" rx="4" fill="#94a3b8" />
          <rect x="750" y="370" width="100" height="14" rx="4" fill="#94a3b8" />

          {/* Cobblestone Avenue to 10 o'clock Word Forge */}
          <polygon points="390,375 445,335 760,515 710,560" fill="#94a3b8" />
          {/* Cobblestone Avenue to 8 o'clock Battle Arena */}
          <polygon points="340,615 390,665 755,585 715,535" fill="#94a3b8" />
          {/* Cobblestone Avenue to 2 o'clock Pet Hatchery */}
          <polygon points="1210,375 1155,335 840,515 890,560" fill="#94a3b8" />
          {/* Cobblestone Avenue to 4 o'clock Lexi-Shop */}
          <polygon points="1260,615 1210,665 845,585 885,535" fill="#94a3b8" />
        </g>

        {/* ===================================================================
            CENTRAL CIRCULAR COURTYARD RING & GOLDEN SUN-DIAL FOUNTAIN
            (Bastion Ref #1 Center Ring + Citadel Ref #2 Golden Sun-Dial)
        ==================================================================== */}
        <g stroke="#1a162b" strokeWidth="4">
          {/* Outer Sandstone Courtyard Ring */}
          <ellipse cx="800" cy="560" rx="215" ry="96" fill="#d6c59a" />
          {/* Inner Emerald Lawn Ring */}
          <ellipse cx="800" cy="560" rx="150" ry="66" fill="#84cc16" />
          {/* Courtyard Segment Lines */}
          <line x1="600" y1="530" x2="660" y2="540" stroke="#1a162b" strokeWidth="3" />
          <line x1="1000" y1="530" x2="940" y2="540" stroke="#1a162b" strokeWidth="3" />
          <line x1="690" y1="640" x2="725" y2="615" stroke="#1a162b" strokeWidth="3" />
          <line x1="910" y1="640" x2="875" y2="615" stroke="#1a162b" strokeWidth="3" />

          {/* Central Golden Sun-Dial & Azure Crystal Fountain */}
          <ellipse cx="800" cy="560" rx="68" ry="30" fill="#f59e0b" />
          <ellipse cx="800" cy="556" rx="52" ry="22" fill="#fde047" />
          <ellipse cx="800" cy="554" rx="34" ry="14" fill="#38bdf8" />
          <polygon points="800,518 784,552 800,564 816,552" fill="#22d3ee" stroke="#1a162b" strokeWidth="3" />
        </g>

        {/* ===================================================================
            5 BLACK-AND-GOLD CIRCULAR FLOOR RUNE MEDALLIONS (Bastion Ref #1)
        ==================================================================== */}
        {[
          { cx: 800, cy: 425 }, // 1. Word World North Rune
          { cx: 615, cy: 465 }, // 4. Word Forge Upper-Left Rune
          { cx: 560, cy: 590 }, // 2. Battle Arena Lower-Left Rune
          { cx: 985, cy: 465 }, // 3. Pet Hatchery Upper-Right Rune
          { cx: 1040, cy: 590 }, // 5. Lexi-Shop Lower-Right Rune
        ].map((rune, i) => (
          <g key={i}>
            <ellipse
              cx={rune.cx}
              cy={rune.cy}
              rx="32"
              ry="15"
              fill="#0f172a"
              stroke="#fde047"
              strokeWidth="4"
            />
            <ellipse
              cx={rune.cx}
              cy={rune.cy}
              rx="18"
              ry="8"
              fill="#f59e0b"
            />
          </g>
        ))}

        {/* ===================================================================
            6 O'CLOCK CHECKERBOARD STONE CAUSEWAY & TWIN DRAGON BANNERS (Ref #1)
        ==================================================================== */}
        <g stroke="#1a162b" strokeWidth="3.5" strokeLinejoin="round">
          <polygon points="710,730 890,730 935,950 665,950" fill="#65a30d" />
          {/* Checkerboard Diamond Tiles */}
          {[755, 795, 835, 875, 915].map((yPos, rIdx) => (
            <g key={rIdx}>
              <polygon
                points={`760,${yPos} 785,${yPos - 12} 810,${yPos} 785,${yPos + 12}`}
                fill={rIdx % 2 === 0 ? '#d9f99d' : '#84cc16'}
              />
              <polygon
                points={`815,${yPos} 840,${yPos - 12} 865,${yPos} 840,${yPos + 12}`}
                fill={rIdx % 2 === 1 ? '#d9f99d' : '#84cc16'}
              />
            </g>
          ))}
          {/* Twin Carved Stone Guardian Pillars & Crimson Pennants */}
          <rect x="682" y="745" width="34" height="75" rx="4" fill="#64748b" />
          <polygon points="685,780 713,780 713,855 699,875 685,855" fill="#dc2626" stroke="#facc15" strokeWidth="2.5" />
          <rect x="884" y="745" width="34" height="75" rx="4" fill="#64748b" />
          <polygon points="887,780 915,780 915,855 901,875 887,855" fill="#dc2626" stroke="#facc15" strokeWidth="2.5" />
        </g>
      </svg>

      {/* =====================================================================
          TOP-LEFT HUD — LIVE CUSTOM AVATAR, HP, LEXI-DEX MASTERY & ACTIVE PET
      ====================================================================== */}
      <div className="absolute top-3 left-3 z-30 flex flex-col gap-2">
        <div className="flex items-start gap-2.5 bg-[#1a162b]/85 backdrop-blur-md p-2.5 rounded-2xl border-[3px] border-[#1a162b] shadow-[0_5px_0_#1a162b]">
          {/* Live Customized Explorer Portrait (Issue #4 Fix) */}
          <div
            onClick={() => setIsCustomizingAvatar(true)}
            title="Click to customize Explorer"
            className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-b from-[#ffe082] to-[#ffb300] p-1 border-[3px] border-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer group shrink-0"
          >
            <div
              className="w-full h-full rounded-xl flex items-center justify-center overflow-hidden border-2 border-[#1a162b] relative"
              style={{ backgroundColor: avatarOutfit }}
            >
              <div
                className="w-11 h-11 rounded-full border-2 border-[#1a162b] flex items-center justify-center text-2xl shadow-inner"
                style={{ backgroundColor: avatarSkin }}
              >
                {avatarEmoji}
              </div>
              {currentUser?.avatarConfig?.headgearEmoji && (
                <span className="absolute top-0 right-0.5 text-xs drop-shadow">
                  {currentUser.avatarConfig.headgearEmoji}
                </span>
              )}
            </div>
            {/* Level Star Badge */}
            <div className="absolute -bottom-1.5 -left-1.5 w-7 h-7 rounded-full bg-gradient-to-b from-[#ffee58] to-[#fbc02d] border-2 border-[#1a162b] flex items-center justify-center font-display font-black text-[11px] text-[#1a162b] shadow">
              {currentUser?.level ?? 8}
            </div>
            {/* Name Plate */}
            <div className="absolute -bottom-2 right-0 left-5 bg-[#ffb300] border-2 border-[#1a162b] rounded-md px-1.5 py-0.2 text-center">
              <span className="font-display font-black text-[10px] text-[#1a162b] truncate block">
                {currentUser?.displayName || 'Explorer'}
              </span>
            </div>
          </div>

          {/* HP & Real Campaign / Lexi-Dex Mastery Bars */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-[11px] text-[#ffca28] w-8">
                HP
              </span>
              <div className="relative w-28 sm:w-36 h-4.5 rounded-full bg-[#0d0b18] border-2 border-[#1a162b] overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-[#d32f2f] via-[#f44336] to-[#ff7961] rounded-full" />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white tabular-nums drop-shadow-[0_1px_1px_#000]">
                  {selectedPet.stats.hp} / {selectedPet.stats.hp}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-[10px] text-[#4fc3f7] w-8">
                DEX
              </span>
              <div className="relative w-28 sm:w-36 h-4.5 rounded-full bg-[#0d0b18] border-2 border-[#1a162b] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0288d1] via-[#29b6f6] to-[#81d4fa] rounded-full"
                  style={{ width: `${Math.min(100, Math.round((allWords.length / 95) * 100))}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white tabular-nums drop-shadow-[0_1px_1px_#000]">
                  {allWords.length} Words
                </span>
              </div>
            </div>

            {/* Coins & Gems */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <div className="flex items-center gap-1 bg-[#263238] border-2 border-[#1a162b] rounded-full px-2.5 py-0.5 text-white font-black text-[11px] tabular-nums">
                <span>🪙</span>
                <span>{(currentUser?.lexiCoins ?? 450).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 bg-[#263238] border-2 border-[#1a162b] rounded-full px-2.5 py-0.5 text-white font-black text-[11px] tabular-nums">
                <span>💎</span>
                <span>{(currentUser?.fusionTokens ?? 14).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Companion Selector Pill */}
        <button
          onClick={() => setActiveModal('hatchery')}
          className="flex items-center gap-2 bg-[#fff8e7] hover:bg-[#ffe082] border-[3px] border-[#1a162b] rounded-2xl px-3 py-1 shadow-[0_4px_0_#1a162b] cursor-pointer transition-transform hover:scale-105 w-fit"
        >
          <CreatureSprite
            creatureId={selectedPet.forged?.sourceId || selectedPet.id}
            stage={selectedPet.stage || 1}
            element={selectedPet.element}
            size="xs"
            animated={false}
          />
          <div className="text-left leading-tight">
            <div className="text-[9px] font-black uppercase text-[#5d4037]">
              Partner · Lv.{selectedPet.level || 8}
            </div>
            <div className="font-display font-black text-xs text-[#1a162b]">
              {selectedPet.name} ▾
            </div>
          </div>
        </button>
      </div>

      {/* =====================================================================
          TOP-CENTER FACETED CRYSTAL CREST ("Aetheria Sanctuary")
      ====================================================================== */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
        <div className="relative px-7 sm:px-10 py-1.5 rounded-2xl bg-gradient-to-b from-[#334155] via-[#1e293b] to-[#0f172a] border-[4px] border-[#facc15] shadow-[0_5px_0_#1a162b] flex items-center gap-3">
          <div className="w-3 h-3 rotate-45 bg-[#38bdf8] border-2 border-[#1a162b]" />
          <h1 className="font-display font-black text-base sm:text-xl md:text-2xl text-[#fde047] tracking-wide drop-shadow-[0_2px_0_#1a162b] whitespace-nowrap">
            Aetheria Sky-Sanctuary
          </h1>
          <div className="w-3 h-3 rotate-45 bg-[#38bdf8] border-2 border-[#1a162b]" />
        </div>
      </div>

      {/* =====================================================================
          TOP-RIGHT HUD — QUESTS, LEXI-DEX, AUDIO & LOG OUT
      ====================================================================== */}
      <div className="absolute top-3 right-3 z-30 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveModal('quests')}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-[#fff8e7] to-[#ffe082] border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
              📋
            </div>
            <span className="font-display font-black text-[10px] text-white drop-shadow-[0_2px_1px_#1a162b] mt-0.5">
              Quests
            </span>
          </button>

          <button
            onClick={() => setActiveModal('lexidex')}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-b from-[#ce93d8] to-[#8e24aa] border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 px-1 rounded bg-[#ffd600] text-[#1a162b] font-black text-[8px] border border-[#1a162b]">
                K–8
              </span>
            </div>
            <span className="font-display font-black text-[10px] text-white drop-shadow-[0_2px_1px_#1a162b] mt-0.5">
              Lexi-Dex
            </span>
          </button>

          <button
            onClick={toggleMute}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-[#cfd8dc] to-[#90a4ae] border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] flex items-center justify-center text-[#1a162b] group-hover:scale-105 transition-transform">
              {isMuted ? <VolumeX className="w-5 h-5 text-[#d32f2f]" /> : <Volume2 className="w-5 h-5" />}
            </div>
            <span className="font-display font-black text-[10px] text-white drop-shadow-[0_2px_1px_#1a162b] mt-0.5">
              {isMuted ? 'Muted' : 'Audio'}
            </span>
          </button>

          <button
            onClick={() => {
              juice.boing();
              logout();
            }}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-[#ef5350] to-[#c62828] border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-display font-black text-[10px] text-white drop-shadow-[0_2px_1px_#1a162b] mt-0.5">
              Log Out
            </span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          CENTRAL COURTYARD NEXUS: EXPLORER TAMER & ACTIVE COMPANION
          Standing at the Golden Sun-Dial Fountain in the Center of the Plaza!
      ====================================================================== */}
      <div
        onClick={() => setActiveModal('word-world')}
        title="Click to Enter Word World (9 Elemental Areas)"
        style={{ left: '50%', top: '56%' }}
        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-pointer group"
      >
        <div className="flex items-end gap-1.5">
          {/* Explorer Tamer Character */}
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl border-[3px] border-[#1a162b] text-xl shadow-[0_4px_0_#1a162b]"
            style={{ backgroundColor: avatarOutfit }}
          >
            {avatarEmoji}
          </div>
          {/* Active Companion Sprite */}
          <CreatureSprite
            creatureId={selectedPet.forged?.sourceId || selectedPet.id}
            stage={selectedPet.stage || 1}
            element={selectedPet.element}
            size="sm"
          />
        </div>
        <div className="mt-1 rounded-full border-2 border-[#facc15] bg-[#0f172a]/90 px-3 py-0.5 font-display text-[10px] font-black text-[#fde047] shadow">
          ★ Sanctuary Courtyard ({clearedAreasCount}/9 Areas)
        </div>
      </div>

      {/* =====================================================================
          5 PRIMARY SANCTUARY LANDMARK BUILDINGS AROUND THE COURTYARD RING
      ====================================================================== */}
      <div className="relative w-full h-full z-10">
        {PRIMARY_ISLAND_NODES.map((node) => {
          const isSelected = selectedIslandId === node.id;

          return (
            <button
              key={node.id}
              onClick={() => handlePrimaryNodeClick(node)}
              onMouseEnter={() => setSelectedIslandId(node.id)}
              style={{
                left: node.x,
                top: node.y,
                width: node.width,
              }}
              className={`group absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center focus:outline-none cursor-pointer transition-all duration-200 ${
                isSelected ? 'scale-105 z-20' : 'hover:scale-105 z-10'
              }`}
            >
              {/* Isometric Architectural Landmark */}
              <div className="w-full pointer-events-none">{renderIslandArtwork(node.id)}</div>

              {/* Cel-Shaded Signboard Ribbon */}
              {renderIslandNameplate(node, isSelected)}
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          BOTTOM 5-TAB PRIMARY NAVIGATION DOCK (MATCHES THE 5 WORLD MAP AREAS)
      ====================================================================== */}
      <div className="absolute bottom-3 inset-x-3 z-30 flex items-center justify-center pointer-events-none">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-[#1a162b]/90 backdrop-blur-md px-3.5 py-2.5 rounded-3xl border-[4px] border-[#1a162b] shadow-[0_6px_0_#1a162b] pointer-events-auto">
          <button
            onClick={() => setActiveModal('word-world')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-b from-[#9ccc65] via-[#66bb6a] to-[#2e7d32] hover:brightness-110 text-white border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] cursor-pointer transition-transform hover:scale-105"
          >
            <Compass className="w-5 h-5" />
            <div className="text-left leading-tight">
              <div className="text-[9px] font-black uppercase text-emerald-100">1. Adventure</div>
              <div className="font-display font-black text-xs sm:text-sm">Word World (9)</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModal('arena')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-b from-[#ffd54f] via-[#ffb300] to-[#f57c00] hover:brightness-110 text-[#1a162b] border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] cursor-pointer transition-transform hover:scale-105"
          >
            <Swords className="w-5 h-5" />
            <div className="text-left leading-tight">
              <div className="text-[9px] font-black uppercase text-[#4e342e]">2. Battle Mode</div>
              <div className="font-display font-black text-xs sm:text-sm">Battle Arena</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModal('hatchery')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-b from-[#4fc3f7] via-[#29b6f6] to-[#0288d1] hover:brightness-110 text-white border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] cursor-pointer transition-transform hover:scale-105"
          >
            <Egg className="w-5 h-5" />
            <div className="text-left leading-tight">
              <div className="text-[9px] font-black uppercase text-sky-100">3. Pets &amp; Gear</div>
              <div className="font-display font-black text-xs sm:text-sm">Pet Hatchery</div>
            </div>
          </button>

          <button
            onClick={() => setTab('forge')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-b from-[#ff8a65] via-[#f4511e] to-[#bf360c] hover:brightness-110 text-white border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] cursor-pointer transition-transform hover:scale-105"
          >
            <Flame className="w-5 h-5" />
            <div className="text-left leading-tight">
              <div className="text-[9px] font-black uppercase text-orange-100">4. Fusion Lab</div>
              <div className="font-display font-black text-xs sm:text-sm">Word Forge</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModal('lexishop')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-b from-[#ce93d8] via-[#ab47bc] to-[#6a1b9a] hover:brightness-110 text-white border-[3px] border-[#1a162b] shadow-[0_4px_0_#1a162b] cursor-pointer transition-transform hover:scale-105"
          >
            <ShoppingBag className="w-5 h-5" />
            <div className="text-left leading-tight">
              <div className="text-[9px] font-black uppercase text-purple-100">5. Storefront</div>
              <div className="font-display font-black text-xs sm:text-sm">Lexi-Shop</div>
            </div>
          </button>
        </div>
      </div>

      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1a162b] text-[#ffd54f] font-display font-black text-sm px-5 py-2.5 rounded-2xl border-[3px] border-[#ffd54f] shadow-2xl animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Hub Modals */}
      {activeModal === 'lexidex' ? (
        <LexiDexModal isOpen={true} onClose={() => setActiveModal(null)} />
      ) : (
        renderModalContent()
      )}

      {/* Evolution Sequence Modal */}
      {evolvingPet && (
        <EvolutionSequenceModal
          creature={evolvingPet}
          onComplete={() => {
            evolvePet(evolvingPet.id);
            setEvolvingCreatureId(null);
            triggerToast(`🎉 ${evolvingPet.name} evolved to Stage ${(evolvingPet.stage || 1) + 1}!`);
          }}
          onClose={() => setEvolvingCreatureId(null)}
        />
      )}
    </div>
  );
};
