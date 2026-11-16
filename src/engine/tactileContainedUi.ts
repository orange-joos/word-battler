/**
 * Priorities #21–#35: Tactile Materiality, Dual-Tier Typography, Strict Semantic Color Coding,
 * Reactive Combat Lighting & Vignettes, Board-Linked Enemy Telegraphs, Spring-Physics & 2.5D Tilt,
 * Paced Left-to-Right Scoring Cascade, Cut-Free Scene Transitions, Inline Post-Combat Loot Drops,
 * Instant Validity & Affix Ligatures, Ghost HP & Lethal Shatter Preview, Anticipatory Relic Rail,
 * Simultaneous Keyboard+Mouse Harmony, Slide-Out Tile Bag Odds Drawer, and Chained Keyword Tooltips.
 */

import type { RackTile, SmartTileBagState } from './smartTileBag.ts';
import { isVowelOrWildcardTile } from './smartTileBag.ts';
import { evaluateWordEconomy, evaluateWordPropertySynergies } from './lexiconTrie.ts';
import { ROGUELIKE_RELICS, type EnemyBoardModifier } from './roguelikeLoop.ts';

// ============================================================================
// #21 TACTILE TILE MATERIALITY
// ============================================================================

export type TileMaterialId =
  | 'weighted-ivory'
  | 'carved-bone'
  | 'etched-slate'
  | 'gilded-wood'
  | 'glowing-amber'
  | 'cracked-obsidian'
  | 'frost-rimmed-stone';

export interface TileMaterialDescriptor {
  id: TileMaterialId;
  name: string;
  cssClass: string;
  surfaceNote: string;
  bevelShadow: string;
}

export const TILE_MATERIALS: Record<TileMaterialId, TileMaterialDescriptor> = Object.freeze({
  'weighted-ivory': {
    id: 'weighted-ivory',
    name: 'Weighted Ivory',
    cssClass: 'tile-mat-ivory',
    surfaceNote: 'Smooth warm ivory with chamfered bevels',
    bevelShadow: 'inset 0 2px 0 rgba(255,255,255,0.85), inset 0 -3px 0 rgba(180,145,95,0.35), 0 4px 0 #1a162b',
  },
  'carved-bone': {
    id: 'carved-bone',
    name: 'Carved Bone',
    cssClass: 'tile-mat-bone',
    surfaceNote: 'Fossilized bone grain with chiseled notches',
    bevelShadow: 'inset 0 2px 0 rgba(255,252,240,0.9), inset 0 -3px 0 rgba(120,95,70,0.4), 0 4px 0 #1a162b',
  },
  'etched-slate': {
    id: 'etched-slate',
    name: 'Etched Slate',
    cssClass: 'tile-mat-slate',
    surfaceNote: 'Deep quarry slate with silver rune inlay',
    bevelShadow: 'inset 0 2px 0 rgba(148,163,184,0.45), inset 0 -3px 0 rgba(15,23,42,0.7), 0 4px 0 #090714',
  },
  'gilded-wood': {
    id: 'gilded-wood',
    name: 'Gilded Heartwood',
    cssClass: 'tile-mat-gilded',
    surfaceNote: 'Gold-leaf filigree over polished heartwood',
    bevelShadow: 'inset 0 2px 0 rgba(254,240,138,0.95), inset 0 -3px 0 rgba(180,83,9,0.5), 0 4px 0 #1a162b',
  },
  'glowing-amber': {
    id: 'glowing-amber',
    name: 'Glowing Amber Resin',
    cssClass: 'tile-mat-amber',
    surfaceNote: 'Translucent prehistoric amber with inner luminescence',
    bevelShadow: 'inset 0 2px 6px rgba(253,224,71,0.85), 0 0 12px rgba(245,158,11,0.45), 0 4px 0 #1a162b',
  },
  'cracked-obsidian': {
    id: 'cracked-obsidian',
    name: 'Cracked Obsidian',
    cssClass: 'tile-mat-obsidian',
    surfaceNote: 'Volcanic glass veined with volatile crimson fissures',
    bevelShadow: 'inset 0 1px 0 rgba(244,63,94,0.6), inset 0 -3px 0 rgba(0,0,0,0.85), 0 4px 0 #090714',
  },
  'frost-rimmed-stone': {
    id: 'frost-rimmed-stone',
    name: 'Frost-Rimmed Stone',
    cssClass: 'tile-mat-frost',
    surfaceNote: 'Glacial rime encasing an ancient rune tablet',
    bevelShadow: 'inset 0 2px 4px rgba(186,230,253,0.9), inset 0 -3px 0 rgba(2,132,199,0.45), 0 4px 0 #0c4a6e',
  },
});

/**
 * Determines the physical material of a tile or word tablet based on its upgrade stamp, hazard state, and letter tier (#21).
 */
export function getTactileTileMaterial(params: {
  word?: string;
  stamp?: RackTile['stamp'];
  hazard?: RackTile['hazard'];
  category?: RackTile['category'];
  isLockedByEnemy?: boolean;
}): TileMaterialDescriptor {
  const { word = '', stamp = 'none', hazard = 'none', category = 'consonant', isLockedByEnemy = false } = params;

  if (hazard === 'time-bomb' || hazard === 'poisoned') {
    return TILE_MATERIALS['cracked-obsidian'];
  }
  if (hazard === 'locked' || isLockedByEnemy) {
    return TILE_MATERIALS['frost-rimmed-stone'];
  }
  if (stamp === 'gilded') {
    return TILE_MATERIALS['gilded-wood'];
  }
  if (stamp === 'lifesteal' || stamp === 'arcane-crit' || category === 'compound' || category === 'wildcard') {
    return TILE_MATERIALS['glowing-amber'];
  }
  if (word) {
    const econ = evaluateWordEconomy(word);
    if (econ.highTierLetters.length > 0) {
      return TILE_MATERIALS['glowing-amber'];
    }
    if (word.length >= 7) {
      return TILE_MATERIALS['gilded-wood'];
    }
    if (word.length >= 5) {
      return TILE_MATERIALS['carved-bone'];
    }
  }
  return TILE_MATERIALS['weighted-ivory'];
}

// ============================================================================
// #22 DUAL-TIER TYPOGRAPHY SYSTEM
// ============================================================================

export function getDualTierTypographyClasses(role: 'tile-face' | 'boss-banner'): string {
  if (role === 'tile-face') {
    return 'font-tile-face tracking-wider tabular-nums select-none';
  }
  return 'font-boss-serif tracking-tight';
}

// ============================================================================
// #23 STRICT SEMANTIC COLOR CODING
// ============================================================================

export type SemanticCategory = 'multiplier' | 'block' | 'vowel-heal' | 'hex-poison' | 'raw-attack';

export interface SemanticColorToken {
  category: SemanticCategory;
  label: string;
  hex: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
}

export const SEMANTIC_COLOR_GRAMMAR: Record<SemanticCategory, SemanticColorToken> = Object.freeze({
  multiplier: {
    category: 'multiplier',
    label: 'Amber · Multiplier',
    hex: '#f59e0b',
    badgeBg: 'bg-amber-400',
    badgeText: 'text-[#1a162b]',
    borderClass: 'border-amber-500',
  },
  block: {
    category: 'block',
    label: 'Cyan · Block & Freeze',
    hex: '#06b6d4',
    badgeBg: 'bg-cyan-400',
    badgeText: 'text-[#1a162b]',
    borderClass: 'border-cyan-400',
  },
  'vowel-heal': {
    category: 'vowel-heal',
    label: 'Emerald · Vowel & Heal',
    hex: '#10b981',
    badgeBg: 'bg-emerald-400',
    badgeText: 'text-[#1a162b]',
    borderClass: 'border-emerald-400',
  },
  'hex-poison': {
    category: 'hex-poison',
    label: 'Violet · Hex & Rule Shift',
    hex: '#8b5cf6',
    badgeBg: 'bg-violet-500',
    badgeText: 'text-white',
    borderClass: 'border-violet-400',
  },
  'raw-attack': {
    category: 'raw-attack',
    label: 'Crimson · Raw Strike & Bleed',
    hex: '#e11d48',
    badgeBg: 'bg-rose-600',
    badgeText: 'text-white',
    borderClass: 'border-rose-500',
  },
});

export function getSemanticColorToken(category: SemanticCategory): SemanticColorToken {
  return SEMANTIC_COLOR_GRAMMAR[category];
}

// ============================================================================
// #24 REACTIVE COMBAT LIGHTING & VIGNETTES
// ============================================================================

export interface ReactiveLightingState {
  totalLettersPlaced: number;
  spotlightActive: boolean;
  ambientDimOpacity: number;
  lowHpVignetteActive: boolean;
  playerHpPct: number;
}

export function computeReactiveLightingState(params: {
  placedWords: string[];
  playerHp: number;
  playerMaxHp: number;
}): ReactiveLightingState {
  const { placedWords, playerHp, playerMaxHp } = params;
  const totalLettersPlaced = placedWords.reduce((sum, w) => sum + w.trim().length, 0);
  const maxSingleWordLen = placedWords.reduce((max, w) => Math.max(max, w.trim().length), 0);
  const spotlightActive = maxSingleWordLen >= 6 || totalLettersPlaced >= 12 || placedWords.length >= 3;
  const ambientDimOpacity = spotlightActive ? 0.28 : 0;
  const playerHpPct = Math.max(0, Math.min(100, Math.round((playerHp / Math.max(1, playerMaxHp)) * 100)));
  const lowHpVignetteActive = playerHpPct > 0 && playerHpPct <= 25;

  return {
    totalLettersPlaced,
    spotlightActive,
    ambientDimOpacity,
    lowHpVignetteActive,
    playerHpPct,
  };
}

// ============================================================================
// #25 BOARD-LINKED ENEMY TELEGRAPHS
// ============================================================================

export interface RackSlotTelegraph {
  slotIndex: number;
  threatActive: boolean;
  icon: string;
  shortLabel: string;
  semanticCategory: SemanticCategory;
  tooltip: string;
}

/**
 * Projects enemy board modifiers & phase rules directly onto the player's 4 rack word cards (#25).
 */
export function computeBoardLinkedTelegraphs(params: {
  rackWords: Array<string | null>;
  enemyModifier: EnemyBoardModifier;
  bannedVowel?: string;
}): RackSlotTelegraph[] {
  const { rackWords, enemyModifier, bannedVowel } = params;

  return rackWords.map((rawWord, slotIndex) => {
    const word = (rawWord || '').trim();
    if (!word) {
      return {
        slotIndex,
        threatActive: false,
        icon: '',
        shortLabel: '',
        semanticCategory: 'hex-poison',
        tooltip: '',
      };
    }

    const upper = word.toUpperCase();
    const vowelCount = (word.match(/[aeiou]/gi) || []).length;

    // Check Phase 2 Banned Vowel seal first
    if (bannedVowel && upper.includes(bannedVowel.toUpperCase())) {
      return {
        slotIndex,
        threatActive: true,
        icon: '⛓️',
        shortLabel: `Seal "${bannedVowel}"`,
        semanticCategory: 'hex-poison',
        tooltip: `Boss Phase 2 Vowel Seal: "${word}" contains "${bannedVowel}". Bypass with a word lacking "${bannedVowel}" for +6 Power!`,
      };
    }

    if (enemyModifier.id === 'vowel-devourer' && vowelCount <= 2) {
      return {
        slotIndex,
        threatActive: true,
        icon: '🕳️',
        shortLabel: 'Vowel Drain',
        semanticCategory: 'hex-poison',
        tooltip: `${enemyModifier.name}: Words with ≤2 vowels lose 2 Power. Pair with a 3+ vowel word!`,
      };
    }

    if (enemyModifier.id === 'word-length-cap' && word.length <= 4) {
      return {
        slotIndex,
        threatActive: true,
        icon: '📏',
        shortLabel: 'Short Dampen',
        semanticCategory: 'hex-poison',
        tooltip: `${enemyModifier.name}: Short words (≤4 letters) miss the 5–7 letter tempo bonus!`,
      };
    }

    if (enemyModifier.id === 'locked-consonants' && !/[jqxzkv]/i.test(word) && word.length < 6) {
      return {
        slotIndex,
        threatActive: true,
        icon: '🔒',
        shortLabel: 'Rime Lock',
        semanticCategory: 'block',
        tooltip: `${enemyModifier.name}: Use a rare consonant (J, Q, X, Z, K, V) or 6+ letter word to shatter the lock!`,
      };
    }

    if (enemyModifier.id === 'letter-corruption' && word.length <= 4) {
      return {
        slotIndex,
        threatActive: true,
        icon: '☣️',
        shortLabel: 'Corrupted',
        semanticCategory: 'hex-poison',
        tooltip: `${enemyModifier.name}: Single short words suffer -3 Power; chain 2+ words to cleanse!`,
      };
    }

    return {
      slotIndex,
      threatActive: false,
      icon: '✨',
      shortLabel: 'Counters Boss',
      semanticCategory: 'vowel-heal',
      tooltip: `"${word}" cleanly bypasses ${enemyModifier.name} for bonus counterplay power!`,
    };
  });
}

// ============================================================================
// #26 SPRING-PHYSICS TILE MOVEMENT & 2.5D CURSOR TILT
// ============================================================================

export const SPRING_PHYSICS_PRESETS = Object.freeze({
  criticallyDampedCss: 'cubic-bezier(0.22, 1.35, 0.36, 1)',
  stiffness: 340,
  damping: 24,
  mass: 0.9,
});

export function computeTileBankTilt(offsetXRatio: number, offsetYRatio: number): {
  rotateXDeg: number;
  rotateYDeg: number;
  scale: number;
  cssTransform: string;
} {
  const clampedX = Math.max(-1, Math.min(1, offsetXRatio));
  const clampedY = Math.max(-1, Math.min(1, offsetYRatio));
  const rotateYDeg = Number((clampedX * 11).toFixed(2));
  const rotateXDeg = Number((-clampedY * 8).toFixed(2));
  const scale = 1.04;
  return {
    rotateXDeg,
    rotateYDeg,
    scale,
    cssTransform: `perspective(600px) rotateX(${rotateXDeg}deg) rotateY(${rotateYDeg}deg) scale(${scale})`,
  };
}

// ============================================================================
// #27 PACED LEFT-TO-RIGHT SCORING CASCADE
// ============================================================================

export interface ScoringCascadeStep {
  stepIndex: number;
  word: string;
  tilePoints: number;
  runningMultiplier: number;
  triggeredRelicId: string | null;
  delayMs: number;
  pitchSemitoneIndex: number;
}

/**
 * Builds a choreographed left-to-right scoring cascade sequence that automatically accelerates on long chains (#27).
 */
export function buildScoringCascadeSteps(words: string[]): ScoringCascadeStep[] {
  const cleaned = words.map((w) => w.trim()).filter(Boolean);
  if (cleaned.length === 0) return [];

  // Accelerate per-step interval on longer chains so total cascade stays snappy (90ms-140ms per step)
  const baseStepMs = cleaned.length >= 4 ? 85 : cleaned.length === 3 ? 105 : 125;
  let runningMult = 1;

  return cleaned.map((word, idx) => {
    const econ = evaluateWordEconomy(word);
    runningMult = Number(Math.max(runningMult, econ.lengthMultiplier).toFixed(2));

    let triggeredRelicId: string | null = null;
    if (econ.highTierLetters.length > 0) {
      triggeredRelicId = ROGUELIKE_RELICS[0].id;
    } else if (word.length >= 6) {
      triggeredRelicId = ROGUELIKE_RELICS[2].id;
    } else if (idx === 3) {
      triggeredRelicId = ROGUELIKE_RELICS[3].id;
    }

    return {
      stepIndex: idx,
      word,
      tilePoints: econ.rawLetterPoints,
      runningMultiplier: runningMult,
      triggeredRelicId,
      delayMs: idx * baseStepMs,
      pitchSemitoneIndex: idx * 2,
    };
  });
}

// ============================================================================
// #29 INLINE POST-COMBAT LOOT DROPS
// ============================================================================

export interface InlineLootDropItem {
  id: string;
  type: 'gold-pouch' | 'tile-stamp' | 'relic-boon';
  icon: string;
  title: string;
  subtitle: string;
  semanticCategory: SemanticCategory;
  claimed: boolean;
}

export function generateInlineLootDrops(stageLabel: string, companionName: string): InlineLootDropItem[] {
  return [
    {
      id: 'loot-gold-pouch',
      type: 'gold-pouch',
      icon: '🪙',
      title: '+65 Lexi-Coins & +1 Gem',
      subtitle: `Stage ${stageLabel} Treasury Drop`,
      semanticCategory: 'multiplier',
      claimed: false,
    },
    {
      id: 'loot-tile-stamp',
      type: 'tile-stamp',
      icon: '✨',
      title: 'Gilded / Lifesteal Tile Stamp',
      subtitle: 'Inscribe a permanent bonus onto your Letter Bag',
      semanticCategory: 'vowel-heal',
      claimed: false,
    },
    {
      id: 'loot-relic-boon',
      type: 'relic-boon',
      icon: '🏺',
      title: `${companionName}'s Relic Blessing`,
      subtitle: '+1 Pet Level & +4 Bonus Shield Next Battle',
      semanticCategory: 'block',
      claimed: false,
    },
  ];
}

// ============================================================================
// #30 INSTANT VALIDITY & AFFIX LIGATURES
// ============================================================================

export interface AffixLigatureMatch {
  word: string;
  prefix: string | null;
  stem: string;
  suffix: string | null;
  formattedWithBrackets: string;
  hasAffix: boolean;
}

const RECOGNIZED_PREFIXES = ['RE', 'UN', 'PRE', 'DIS', 'MIS', 'OVER', 'OUT', 'SUB', 'INTER', 'TRANS', 'SUPER', 'BIO'];
const RECOGNIZED_SUFFIXES = ['ING', 'TION', 'SION', 'NESS', 'LESS', 'FUL', 'MENT', 'ABLE', 'IBLE', 'OUS', 'IVELY', 'LY', 'ED', 'ER', 'EST'];

/**
 * Detects morphological prefixes & suffixes and formats bracketed ligature segments (#30).
 */
export function detectAffixLigatures(word: string): AffixLigatureMatch {
  const clean = word.trim();
  const upper = clean.toUpperCase();
  if (clean.length < 4) {
    return {
      word: clean,
      prefix: null,
      stem: clean,
      suffix: null,
      formattedWithBrackets: clean,
      hasAffix: false,
    };
  }

  let detectedPrefix: string | null = null;
  let detectedSuffix: string | null = null;
  let startIdx = 0;
  let endIdx = clean.length;

  for (const pre of RECOGNIZED_PREFIXES) {
    if (upper.startsWith(pre) && clean.length - pre.length >= 3) {
      detectedPrefix = clean.slice(0, pre.length);
      startIdx = pre.length;
      break;
    }
  }

  for (const suf of RECOGNIZED_SUFFIXES) {
    if (upper.endsWith(suf) && endIdx - startIdx - suf.length >= 3) {
      detectedSuffix = clean.slice(clean.length - suf.length);
      endIdx = clean.length - suf.length;
      break;
    }
  }

  const stem = clean.slice(startIdx, endIdx);
  const parts: string[] = [];
  if (detectedPrefix) parts.push(`[${detectedPrefix}-]`);
  parts.push(stem);
  if (detectedSuffix) parts.push(`[-${detectedSuffix}]`);

  return {
    word: clean,
    prefix: detectedPrefix,
    stem,
    suffix: detectedSuffix,
    formattedWithBrackets: parts.join(''),
    hasAffix: Boolean(detectedPrefix || detectedSuffix),
  };
}

// ============================================================================
// #32 ANTICIPATORY RELIC RAIL
// ============================================================================

export type RelicAnticipationState = 'idle' | 'arming' | 'flaring';

export interface AnticipatoryRelicStatus {
  id: string;
  name: string;
  icon: string;
  description: string;
  state: RelicAnticipationState;
  progressLabel: string;
  semanticCategory: SemanticCategory;
}

/**
 * Computes real-time anticipatory states ('idle' | 'arming' | 'flaring') for the Relic Rail
 * while the player is constructing their sentence (#32).
 */
export function computeAnticipatoryRelicStates(placedWords: string[]): AnticipatoryRelicStatus[] {
  const cleaned = placedWords.map((w) => w.trim()).filter(Boolean);
  const joinedUpper = cleaned.join('').toUpperCase();
  const maxLen = cleaned.reduce((m, w) => Math.max(m, w.length), 0);
  const totalVowels = (joinedUpper.match(/[AEIOU]/g) || []).length;
  const synergies = evaluateWordPropertySynergies(cleaned);

  return [
    {
      id: ROGUELIKE_RELICS[0].id,
      name: ROGUELIKE_RELICS[0].name,
      icon: ROGUELIKE_RELICS[0].icon,
      description: ROGUELIKE_RELICS[0].description,
      state: /[JQXZK]/.test(joinedUpper)
        ? 'flaring'
        : /[VFWY]/.test(joinedUpper)
        ? 'arming'
        : 'idle',
      progressLabel: /[JQXZK]/.test(joinedUpper) ? '⚡ +5 DMG Active!' : 'Play J/Q/X/Z/K',
      semanticCategory: 'multiplier',
    },
    {
      id: ROGUELIKE_RELICS[1].id,
      name: ROGUELIKE_RELICS[1].name,
      icon: ROGUELIKE_RELICS[1].icon,
      description: ROGUELIKE_RELICS[1].description,
      state: synergies.some((s) => s.id === 'vowel-freeze')
        ? 'flaring'
        : totalVowels >= 2
        ? 'arming'
        : 'idle',
      progressLabel: synergies.some((s) => s.id === 'vowel-freeze')
        ? '❄️ +4 Shield Active!'
        : `${Math.min(3, totalVowels)}/3 Vowels`,
      semanticCategory: 'block',
    },
    {
      id: ROGUELIKE_RELICS[2].id,
      name: ROGUELIKE_RELICS[2].name,
      icon: ROGUELIKE_RELICS[2].icon,
      description: ROGUELIKE_RELICS[2].description,
      state: maxLen >= 6 ? 'flaring' : maxLen >= 4 ? 'arming' : 'idle',
      progressLabel: maxLen >= 6 ? '⏳ +4 Amp Active!' : `${maxLen}/6 Letters`,
      semanticCategory: 'multiplier',
    },
    {
      id: ROGUELIKE_RELICS[3].id,
      name: ROGUELIKE_RELICS[3].name,
      icon: ROGUELIKE_RELICS[3].icon,
      description: ROGUELIKE_RELICS[3].description,
      state: cleaned.length >= 4 ? 'flaring' : cleaned.length === 3 ? 'arming' : 'idle',
      progressLabel: cleaned.length >= 4 ? '🪶 +6 Heal Active!' : `${cleaned.length}/4 Tablets`,
      semanticCategory: 'vowel-heal',
    },
  ];
}

// ============================================================================
// #33 SIMULTANEOUS KEYBOARD + MOUSE HARMONY (HIGHEST-SCORING DUPLICATE PLUCK)
// ============================================================================

/**
 * Given a typed prefix buffer and candidate words, sorts matching candidates by highest letter-economy score
 * and allows cycling which duplicate candidate is plucked via `cycleOffset` (`Tab`) (#33).
 */
export function selectBestMatchingTileFromRack<T extends { id: string; word: string; powerBonus?: number }>(
  candidates: readonly T[],
  prefixBuffer: string,
  alreadySelectedIds: readonly string[],
  cycleOffset = 0
): {
  bestMatch: T | null;
  allMatchesSorted: T[];
  duplicateCount: number;
} {
  const cleanPrefix = prefixBuffer.trim().toLowerCase();
  if (!cleanPrefix) {
    return { bestMatch: null, allMatchesSorted: [], duplicateCount: 0 };
  }

  const available = candidates.filter(
    (c) => !alreadySelectedIds.includes(c.id) && c.word.toLowerCase().startsWith(cleanPrefix)
  );

  const sorted = [...available].sort((a, b) => {
    const econA = evaluateWordEconomy(a.word);
    const econB = evaluateWordEconomy(b.word);
    const scoreA = econA.rawLetterPoints + econA.bonusDamage + (a.powerBonus ?? 0);
    const scoreB = econB.rawLetterPoints + econB.bonusDamage + (b.powerBonus ?? 0);
    return scoreB - scoreA;
  });

  if (sorted.length === 0) {
    return { bestMatch: null, allMatchesSorted: [], duplicateCount: 0 };
  }

  const index = ((cycleOffset % sorted.length) + sorted.length) % sorted.length;
  return {
    bestMatch: sorted[index],
    allMatchesSorted: sorted,
    duplicateCount: sorted.length,
  };
}

// ============================================================================
// #34 SLIDE-OUT TACTILE TILE BAG DRAWER & LIVE NEXT-TURN DRAW ODDS
// ============================================================================

export interface NextTurnDrawOdds {
  totalRemaining: number;
  vowelTiles: RackTile[];
  consonantTiles: RackTile[];
  specialTiles: RackTile[];
  nextDrawVowelPct: number;
  nextDrawConsonantPct: number;
  nextDrawSpecialPct: number;
  nextDrawStampedPct: number;
  specificLetterOdds: Record<string, number>;
}

/**
 * Computes stacked remaining tile groups (Vowels, Consonants, Special/Compound) and exact next-turn draw percentages (#34).
 */
export function computeNextTurnDrawOdds(bag: SmartTileBagState): NextTurnDrawOdds {
  const pool = bag.remainingPool.length > 0 ? bag.remainingPool : [...bag.discardPile];
  const total = Math.max(1, pool.length);

  const vowelTiles = pool.filter((t) => t.category === 'vowel');
  const consonantTiles = pool.filter((t) => t.category === 'consonant');
  const specialTiles = pool.filter((t) => t.category === 'compound' || t.category === 'wildcard');
  const stampedCount = pool.filter((t) => t.stamp !== 'none').length;

  const specificLetterOdds: Record<string, number> = {};
  const countsByLetter: Record<string, number> = {};
  for (const t of pool) {
    countsByLetter[t.letters] = (countsByLetter[t.letters] || 0) + 1;
  }
  for (const [letters, count] of Object.entries(countsByLetter)) {
    specificLetterOdds[letters] = Math.min(100, Math.round((count / total) * 100));
  }

  // Because of the #11 Vowel Pity Timer, probability of drawing at least 1 vowel in an 8-tile hand is 100%
  const rawVowelPct = Math.round(((vowelTiles.length + specialTiles.filter(isVowelOrWildcardTile).length) / total) * 100);

  return {
    totalRemaining: pool.length,
    vowelTiles,
    consonantTiles,
    specialTiles,
    nextDrawVowelPct: Math.max(25, rawVowelPct),
    nextDrawConsonantPct: Math.round((consonantTiles.length / total) * 100),
    nextDrawSpecialPct: Math.round((specialTiles.length / total) * 100),
    nextDrawStampedPct: Math.round((stampedCount / total) * 100),
    specificLetterOdds,
  };
}

// ============================================================================
// #35 CHAINED KEYWORD TOOLTIPS & HOVER-LOCK
// ============================================================================

export interface KeywordTooltipCard {
  id: string;
  term: string;
  icon: string;
  semanticCategory: SemanticCategory;
  summary: string;
}

export const KEYWORD_GLOSSARY: Record<string, KeywordTooltipCard> = Object.freeze({
  Freeze: {
    id: 'Freeze',
    term: 'Freeze (Cryo-Vowel)',
    icon: '❄️',
    semanticCategory: 'block',
    summary: 'Triggered by words with ≥3 vowels. Chills the boss for 2 turns and grants +4 Cryo Shield.',
  },
  Bleed: {
    id: 'Bleed',
    term: 'Bleed (Mirror-Edge)',
    icon: '🩸',
    semanticCategory: 'raw-attack',
    summary: 'Triggered by palindromes or repeated-letter symmetry. Inflicts +6 Bleed damage over 2 turns.',
  },
  Shield: {
    id: 'Shield',
    term: 'Aegis Shield',
    icon: '🛡️',
    semanticCategory: 'block',
    summary: 'Absorbs incoming boss damage before your Companion HP is reduced.',
  },
  'Time-Bomb': {
    id: 'Time-Bomb',
    term: 'Time-Bomb Tile',
    icon: '💣',
    semanticCategory: 'raw-attack',
    summary: 'Volatile afflicted tile! Use its letter within 2 turns to defuse and hurl +8 Blast Damage at the boss.',
  },
  Gilded: {
    id: 'Gilded',
    term: 'Gilded Stamp',
    icon: '✨',
    semanticCategory: 'multiplier',
    summary: 'Permanent gold-leaf stamp on a letter tile. Grants +4 Bonus Damage and +15 Lexi-Coins when cast.',
  },
  Lifesteal: {
    id: 'Lifesteal',
    term: 'Lifesteal Stamp',
    icon: '🧛',
    semanticCategory: 'vowel-heal',
    summary: 'Permanent vampiric stamp on a letter tile. Restores +5 Companion HP whenever cast.',
  },
  'Vowel Seal': {
    id: 'Vowel Seal',
    term: 'Phase 2 · Vowel Seal',
    icon: '🚫',
    semanticCategory: 'hex-poison',
    summary: 'Boss Phase 2 rule shift banning 1 rotating vowel. Cast a word without that vowel for +6 Bypass Power!',
  },
});

/**
 * Extracts all chained keyword tooltip mini-cards relevant to the current board/word state (#35).
 */
export function extractChainedKeywords(termsOrText: string[]): KeywordTooltipCard[] {
  const joined = termsOrText.join(' ').toLowerCase();
  const matched: KeywordTooltipCard[] = [];

  for (const card of Object.values(KEYWORD_GLOSSARY)) {
    if (
      joined.includes(card.id.toLowerCase()) ||
      joined.includes(card.term.toLowerCase())
    ) {
      matched.push(card);
    }
  }

  if (matched.length === 0) {
    return [KEYWORD_GLOSSARY.Freeze, KEYWORD_GLOSSARY.Gilded, KEYWORD_GLOSSARY['Time-Bomb']];
  }
  return matched;
}
