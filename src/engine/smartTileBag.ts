/**
 * Priority #11: Smart Tile Bag & Vowel Pity Timer (weighted bag draw guaranteeing >=2 vowels or wildcard per 7-9 tile hand)
 * Priority #12: Live Combat Preview & Damage Breakdown (validity, base tile points, length multiplier, relic triggers, projected HP drop)
 * Priority #13: Special, Dual-Letter & Afflicted Tiles (Blank/Wildcard ★, Compound QU/TH/ING, Locked/Poisoned/Time-Bomb N-turn hazard tiles)
 * Priority #14: Multi-Phase Bosses with Rule Modifiers (mid-battle phase shift: banned vowel for 1 turn, even-length rule, word-chain link)
 * Priority #15: In-Run Letter Bag Customization (purge weak letters, duplicate high-tier tiles, permanent stamps Gilded S / Lifesteal V, Remaining vs. Discarded viewer)
 */

import { SeededRng } from './seededRng.ts';
import { LETTER_TIER_VALUES, evaluateWordEconomy, evaluateWordPropertySynergies } from './lexiconTrie.ts';
import { ROGUELIKE_RELICS } from './roguelikeLoop.ts';

export type TileCategory = 'vowel' | 'consonant' | 'wildcard' | 'compound';
export type TileHazardType = 'none' | 'locked' | 'poisoned' | 'time-bomb';
export type TileStampType = 'none' | 'gilded' | 'lifesteal' | 'arcane-crit';

export interface RackTile {
  id: string;
  letters: string; // e.g. 'A', 'E', 'Q', 'QU', 'TH', 'ING', '★'
  category: TileCategory;
  basePoints: number;
  weight: number;
  hazard: TileHazardType;
  hazardTurnsLeft?: number;
  stamp: TileStampType;
}

export interface SmartTileBagState {
  seed: string;
  remainingPool: RackTile[];
  discardPile: RackTile[];
  currentHand: RackTile[];
  pityCounter: number;
  pityTriggersCount: number;
  purgedCount: number;
  duplicatedCount: number;
  stampedCount: number;
}

const DEFAULT_BAG_DISTRIBUTION: ReadonlyArray<{
  letters: string;
  category: TileCategory;
  count: number;
  points: number;
  weight: number;
}> = Object.freeze([
  // Vowels
  { letters: 'E', category: 'vowel', count: 5, points: 1, weight: 1.4 },
  { letters: 'A', category: 'vowel', count: 4, points: 1, weight: 1.35 },
  { letters: 'I', category: 'vowel', count: 4, points: 1, weight: 1.3 },
  { letters: 'O', category: 'vowel', count: 4, points: 1, weight: 1.3 },
  { letters: 'U', category: 'vowel', count: 3, points: 1, weight: 1.2 },
  // Common & Mid Consonants
  { letters: 'R', category: 'consonant', count: 3, points: 1, weight: 1.1 },
  { letters: 'S', category: 'consonant', count: 3, points: 1, weight: 1.15 },
  { letters: 'T', category: 'consonant', count: 3, points: 1, weight: 1.1 },
  { letters: 'L', category: 'consonant', count: 3, points: 1, weight: 1.1 },
  { letters: 'N', category: 'consonant', count: 3, points: 1, weight: 1.1 },
  { letters: 'D', category: 'consonant', count: 2, points: 2, weight: 1.0 },
  { letters: 'G', category: 'consonant', count: 2, points: 2, weight: 1.0 },
  { letters: 'C', category: 'consonant', count: 2, points: 3, weight: 0.95 },
  { letters: 'M', category: 'consonant', count: 2, points: 3, weight: 0.95 },
  { letters: 'P', category: 'consonant', count: 2, points: 3, weight: 0.95 },
  { letters: 'F', category: 'consonant', count: 2, points: 4, weight: 0.9 },
  { letters: 'V', category: 'consonant', count: 2, points: 4, weight: 0.9 },
  { letters: 'K', category: 'consonant', count: 1, points: 5, weight: 0.85 },
  // High-Tier Rare Letters (#2)
  { letters: 'J', category: 'consonant', count: 1, points: 8, weight: 0.75 },
  { letters: 'X', category: 'consonant', count: 1, points: 8, weight: 0.75 },
  { letters: 'Q', category: 'consonant', count: 1, points: 10, weight: 0.7 },
  { letters: 'Z', category: 'consonant', count: 1, points: 10, weight: 0.7 },
  // Priority #13: Compound Digraph/Trigraph Tiles & Blank Wildcard Tiles
  { letters: 'QU', category: 'compound', count: 1, points: 11, weight: 0.85 },
  { letters: 'TH', category: 'compound', count: 2, points: 5, weight: 0.95 },
  { letters: 'ING', category: 'compound', count: 2, points: 6, weight: 0.95 },
  { letters: '★', category: 'wildcard', count: 2, points: 4, weight: 0.9 },
]);

export function isVowelOrWildcardTile(tile: RackTile): boolean {
  if (tile.category === 'vowel' || tile.category === 'wildcard') return true;
  if (tile.category === 'compound') {
    return /[AEIOU]/i.test(tile.letters);
  }
  return /^[AEIOU]$/i.test(tile.letters);
}

/**
 * Creates a fresh SmartTileBagState with pre-stamped signature tiles (Gilded S & Lifesteal V) (#11, #13, #15).
 */
export function createDefaultSmartTileBag(seed = 'AETHERIA-BAG-2026'): SmartTileBagState {
  const pool: RackTile[] = [];
  let seq = 1;
  let gildedApplied = false;
  let lifestealApplied = false;

  for (const spec of DEFAULT_BAG_DISTRIBUTION) {
    for (let i = 0; i < spec.count; i++) {
      let stamp: TileStampType = 'none';
      if (spec.letters === 'S' && !gildedApplied) {
        stamp = 'gilded';
        gildedApplied = true;
      } else if (spec.letters === 'V' && !lifestealApplied) {
        stamp = 'lifesteal';
        lifestealApplied = true;
      }
      pool.push({
        id: `tile_${spec.letters}_${seq++}`,
        letters: spec.letters,
        category: spec.category,
        basePoints: spec.points,
        weight: spec.weight,
        hazard: 'none',
        stamp,
      });
    }
  }

  return {
    seed,
    remainingPool: pool,
    discardPile: [],
    currentHand: [],
    pityCounter: 0,
    pityTriggersCount: 0,
    purgedCount: 0,
    duplicatedCount: 0,
    stampedCount: 2,
  };
}

/**
 * Priority #11: Draws a hand of 7-9 tiles using weighted selection + dynamic Vowel Pity Timer
 * guaranteeing every hand contains at least 2 vowels (or a wildcard ★).
 * Also supports injecting an optional enemy-inflicted hazard tile (#13).
 */
export function drawSmartTileHand(
  bag: SmartTileBagState,
  handSize = 8,
  roundNumber = 1,
  inflictHazard: TileHazardType = 'none'
): SmartTileBagState {
  const clampedSize = Math.max(7, Math.min(9, handSize));
  const rng = new SeededRng(`${bag.seed}-r${roundNumber}-d${bag.discardPile.length}`);

  let remaining = [...bag.remainingPool];
  let discarded = [...bag.discardPile, ...bag.currentHand];

  // Reshuffle discard pile into remaining pool if running low
  if (remaining.length < clampedSize) {
    remaining = [...remaining, ...rng.shuffle(discarded)];
    discarded = [];
  }

  const drawn: RackTile[] = [];
  for (let i = 0; i < clampedSize && remaining.length > 0; i++) {
    const picked = rng.pickWeighted(remaining, (t) => t.weight);
    remaining = remaining.filter((t) => t.id !== picked.id);
    drawn.push({ ...picked, hazard: 'none', hazardTurnsLeft: undefined });
  }

  // Priority #11: Vowel Pity Timer check — ensure at least 2 vowels (or wildcard ★) in every 7-9 tile hand
  let vowelOrWildCount = drawn.filter(isVowelOrWildcardTile).length;
  let pityTriggersCount = bag.pityTriggersCount;
  let pityCounter = bag.pityCounter;

  if (vowelOrWildCount < 2) {
    pityCounter += 1;
    pityTriggersCount += 1;

    const needed = 2 - vowelOrWildCount;
    for (let n = 0; n < needed; n++) {
      // Find a consonant in `drawn` to swap out
      const consonantIdx = drawn.findIndex((t) => !isVowelOrWildcardTile(t));
      if (consonantIdx === -1) break;

      // Find a vowel or wildcard in `remaining` (or synthesize a fallback vowel if pool was custom-purged)
      const vowelInPoolIdx = remaining.findIndex(isVowelOrWildcardTile);
      const removedConsonant = drawn[consonantIdx];

      if (vowelInPoolIdx !== -1) {
        const replacementVowel = remaining[vowelInPoolIdx];
        remaining.splice(vowelInPoolIdx, 1, removedConsonant);
        drawn[consonantIdx] = { ...replacementVowel, hazard: 'none' };
      } else {
        const fallbackVowelLetter = ['E', 'A', 'I', 'O', 'U'][(roundNumber + n) % 5];
        drawn[consonantIdx] = {
          id: `pity_vowel_${roundNumber}_${n}`,
          letters: fallbackVowelLetter,
          category: 'vowel',
          basePoints: LETTER_TIER_VALUES[fallbackVowelLetter.toLowerCase()] ?? 1,
          weight: 1.3,
          hazard: 'none',
          stamp: 'none',
        };
      }
    }
    vowelOrWildCount = drawn.filter(isVowelOrWildcardTile).length;
  } else {
    pityCounter = 0;
  }

  // Priority #13: Apply enemy-inflicted hazard tile on 1 tile in the hand if requested
  if (inflictHazard !== 'none' && drawn.length > 0) {
    const targetIdx = rng.nextInt(0, drawn.length - 1);
    drawn[targetIdx] = {
      ...drawn[targetIdx],
      hazard: inflictHazard,
      hazardTurnsLeft: inflictHazard === 'time-bomb' ? 2 : 1,
    };
  }

  return {
    ...bag,
    remainingPool: remaining,
    discardPile: discarded,
    currentHand: drawn,
    pityCounter,
    pityTriggersCount,
  };
}

// ============================================================================
// PRIORITY #15: IN-RUN LETTER BAG CUSTOMIZATION (PURGE, DUPLICATE, STAMPS & VIEWER)
// ============================================================================

export function purgeTileFromBag(bag: SmartTileBagState, tileId: string): SmartTileBagState {
  const inRemaining = bag.remainingPool.some((t) => t.id === tileId);
  const inHand = bag.currentHand.some((t) => t.id === tileId);
  if (!inRemaining && !inHand) return bag;

  return {
    ...bag,
    remainingPool: bag.remainingPool.filter((t) => t.id !== tileId),
    currentHand: bag.currentHand.filter((t) => t.id !== tileId),
    purgedCount: bag.purgedCount + 1,
  };
}

export function duplicateHighTierTileInBag(
  bag: SmartTileBagState,
  letters: 'Q' | 'Z' | 'X' | 'J' | 'QU' | 'TH' | 'ING' | '★'
): SmartTileBagState {
  const category: TileCategory =
    letters === '★'
      ? 'wildcard'
      : letters.length > 1
      ? 'compound'
      : 'consonant';
  const basePoints =
    letters === 'QU'
      ? 11
      : letters === 'Q' || letters === 'Z'
      ? 10
      : letters === 'X' || letters === 'J'
      ? 8
      : letters === 'ING'
      ? 6
      : 5;

  const newTile: RackTile = {
    id: `dup_${letters}_${Date.now()}_${bag.duplicatedCount + 1}`,
    letters,
    category,
    basePoints,
    weight: 1.15,
    hazard: 'none',
    stamp: 'arcane-crit',
  };

  return {
    ...bag,
    remainingPool: [newTile, ...bag.remainingPool],
    duplicatedCount: bag.duplicatedCount + 1,
    stampedCount: bag.stampedCount + 1,
  };
}

export function applyPermanentStampToTile(
  bag: SmartTileBagState,
  tileId: string,
  stamp: Exclude<TileStampType, 'none'>
): SmartTileBagState {
  const updateList = (list: RackTile[]) =>
    list.map((t) => (t.id === tileId ? { ...t, stamp } : t));

  return {
    ...bag,
    remainingPool: updateList(bag.remainingPool),
    currentHand: updateList(bag.currentHand),
    discardPile: updateList(bag.discardPile),
    stampedCount: bag.stampedCount + 1,
  };
}

export interface BagViewerSummary {
  remainingCount: number;
  discardedCount: number;
  handCount: number;
  vowelCountInRemaining: number;
  vowelPercentage: number;
  compoundAndWildcardCount: number;
  stampedTiles: RackTile[];
}

export function getBagViewerSummary(bag: SmartTileBagState): BagViewerSummary {
  const allActive = [...bag.remainingPool, ...bag.currentHand];
  const vowelCountInRemaining = allActive.filter(isVowelOrWildcardTile).length;
  const vowelPercentage =
    allActive.length > 0 ? Math.round((vowelCountInRemaining / allActive.length) * 100) : 0;
  const compoundAndWildcardCount = allActive.filter(
    (t) => t.category === 'compound' || t.category === 'wildcard'
  ).length;
  const stampedTiles = [...allActive, ...bag.discardPile].filter((t) => t.stamp !== 'none');

  return {
    remainingCount: bag.remainingPool.length,
    discardedCount: bag.discardPile.length,
    handCount: bag.currentHand.length,
    vowelCountInRemaining,
    vowelPercentage,
    compoundAndWildcardCount,
    stampedTiles,
  };
}

// ============================================================================
// PRIORITY #14: MULTI-PHASE BOSSES WITH RULE MODIFIERS
// ============================================================================

export type BossPhaseRuleType =
  | 'standard-phase1'
  | 'ban-vowel-turn'
  | 'even-length-word'
  | 'word-chain-link';

export interface MultiPhaseBossConstraint {
  phase: 1 | 2;
  ruleType: BossPhaseRuleType;
  badgeLabel: string;
  icon: string;
  bannedVowel?: 'A' | 'E' | 'I' | 'O' | 'U';
  description: string;
  bonusPowerOnComply: number;
  penaltyOnViolate: number;
}

/**
 * Computes the active Boss Phase & dynamic spelling rule modifier based on Boss HP % and round (#14).
 * When Boss HP drops to <= 60% (or Round >= 2), Boss enters Phase 2 and shifts spelling rules!
 */
export function getMultiPhaseBossConstraint(
  enemyId: string,
  enemyHp: number,
  enemyMaxHp: number,
  roundNumber: number
): MultiPhaseBossConstraint {
  const hpRatio = enemyHp / Math.max(1, enemyMaxHp);
  const isPhase2 = hpRatio <= 0.65 || roundNumber >= 2;

  if (!isPhase2) {
    return {
      phase: 1,
      ruleType: 'standard-phase1',
      badgeLabel: 'Phase 1 · Guardian Stance',
      icon: '🛡️',
      description: 'Phase 1: Build 2–4 word combos or 6+ letter vocabulary before the Boss shifts rules at 65% HP!',
      bonusPowerOnComply: 2,
      penaltyOnViolate: 0,
    };
  }

  // Deterministic rotation among the 3 Phase-2 spelling rule shifts (#14)
  const hash = enemyId.split('').reduce((acc, c) => acc + c.charCodeAt(0), roundNumber);
  const modeIdx = hash % 3;

  if (modeIdx === 0) {
    const vowels: Array<'A' | 'E' | 'I' | 'O' | 'U'> = ['O', 'U', 'A', 'I', 'E'];
    const bannedVowel = vowels[roundNumber % vowels.length];
    return {
      phase: 2,
      ruleType: 'ban-vowel-turn',
      badgeLabel: `Phase 2 · Vowel Seal (${bannedVowel})`,
      icon: '🚫',
      bannedVowel,
      description: `Phase 2 Shift: Avoid letter "${bannedVowel}" in at least one word for +6 Bypass Power!`,
      bonusPowerOnComply: 6,
      penaltyOnViolate: -2,
    };
  }

  if (modeIdx === 1) {
    return {
      phase: 2,
      ruleType: 'even-length-word',
      badgeLabel: 'Phase 2 · Even-Length Symmetry',
      icon: '⚖️',
      description: 'Phase 2 Shift: Include an even-length word (4, 6, or 8 letters) for +6 Symmetry Power!',
      bonusPowerOnComply: 6,
      penaltyOnViolate: -1,
    };
  }

  return {
    phase: 2,
    ruleType: 'word-chain-link',
    badgeLabel: 'Phase 2 · Word-Chain Resonance',
    icon: '🔗',
    description:
      'Phase 2 Shift: Chain words that share a boundary letter (or 3+ word sentence) for +7 Chain Surge!',
    bonusPowerOnComply: 7,
    penaltyOnViolate: 0,
  };
}

export function evaluateBossPhaseConstraint(
  constraint: MultiPhaseBossConstraint,
  rawWords: string[]
): { complied: boolean; powerDelta: number; statusNote: string } {
  const cleaned = rawWords
    .map((w) => w.trim().toUpperCase().replace(/[^A-Z]/g, ''))
    .filter(Boolean);
  if (cleaned.length === 0) {
    return { complied: false, powerDelta: 0, statusNote: constraint.description };
  }

  switch (constraint.ruleType) {
    case 'standard-phase1':
      return {
        complied: true,
        powerDelta: constraint.bonusPowerOnComply,
        statusNote: '✓ Phase 1 Stance Active (+2 Power)',
      };
    case 'ban-vowel-turn': {
      const banned = constraint.bannedVowel || 'O';
      const hasCleanWord = cleaned.some((w) => !w.includes(banned));
      if (hasCleanWord) {
        return {
          complied: true,
          powerDelta: constraint.bonusPowerOnComply,
          statusNote: `✓ Bypassed Vowel Seal "${banned}" (+${constraint.bonusPowerOnComply} Power)!`,
        };
      }
      return {
        complied: false,
        powerDelta: constraint.penaltyOnViolate,
        statusNote: `⚠️ Vowel Seal "${banned}" dampened cast (${constraint.penaltyOnViolate} Power)`,
      };
    }
    case 'even-length-word': {
      const hasEvenWord = cleaned.some((w) => w.length % 2 === 0);
      if (hasEvenWord) {
        return {
          complied: true,
          powerDelta: constraint.bonusPowerOnComply,
          statusNote: `✓ Even-Length Symmetry satisfied (+${constraint.bonusPowerOnComply} Power)!`,
        };
      }
      return {
        complied: false,
        powerDelta: constraint.penaltyOnViolate,
        statusNote: `⚠️ Odd-length words only (${constraint.penaltyOnViolate} Power)`,
      };
    }
    case 'word-chain-link': {
      let hasChainLink = cleaned.length >= 3;
      for (let i = 0; i < cleaned.length - 1; i++) {
        const lastChar = cleaned[i][cleaned[i].length - 1];
        const nextFirst = cleaned[i + 1][0];
        if (lastChar === nextFirst || cleaned[i + 1].includes(lastChar)) {
          hasChainLink = true;
          break;
        }
      }
      if (hasChainLink) {
        return {
          complied: true,
          powerDelta: constraint.bonusPowerOnComply,
          statusNote: `✓ Word-Chain Resonance linked (+${constraint.bonusPowerOnComply} Power)!`,
        };
      }
      return {
        complied: false,
        powerDelta: 0,
        statusNote: '🔗 Tip: Link boundary letters or 3+ words for +7 Chain Surge!',
      };
    }
  }
}

// ============================================================================
// PRIORITY #12: LIVE COMBAT PREVIEW & DAMAGE BREAKDOWN BEFORE SUBMITTING
// ============================================================================

export interface LiveCombatPreviewBreakdown {
  isValid: boolean;
  wordCount: number;
  baseTilePoints: number;
  maxLengthMultiplier: number;
  synergyBonusDamage: number;
  synergyBonusShield: number;
  activeRelicTriggers: Array<{ id: string; name: string; icon: string; bonusText: string }>;
  specialTileBonuses: Array<{ label: string; bonusDamage: number; bonusHeal: number }>;
  bossPhaseDelta: number;
  bossPhaseNote: string;
  projectedDamage: number;
  projectedShield: number;
  projectedHeal: number;
  projectedEnemyHpAfter: number;
  projectedEnemyHpAfterPct: number;
  projectedEnemyHpDropPct: number;
  wouldDefeatEnemy: boolean;
}

/**
 * Computes a real-time combat preview showing base tile points, length multiplier,
 * active relic triggers, special tile stamps/hazards, and projected enemy HP bar drop (#12).
 */
export function computeLiveCombatPreview(params: {
  words: string[];
  validGrammar: boolean;
  baseComboPower: number;
  playerAttack: number;
  enemyDefense: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyShield: number;
  handTiles?: RackTile[];
  bossConstraint?: MultiPhaseBossConstraint;
}): LiveCombatPreviewBreakdown {
  const {
    words,
    validGrammar,
    baseComboPower,
    playerAttack,
    enemyDefense,
    enemyHp,
    enemyMaxHp,
    enemyShield,
    handTiles = [],
    bossConstraint,
  } = params;

  const cleaned = words.map((w) => w.trim()).filter(Boolean);
  if (cleaned.length === 0 || !validGrammar) {
    const currentPct = Math.max(0, Math.min(100, Math.round((enemyHp / Math.max(1, enemyMaxHp)) * 100)));
    return {
      isValid: false,
      wordCount: cleaned.length,
      baseTilePoints: 0,
      maxLengthMultiplier: 1,
      synergyBonusDamage: 0,
      synergyBonusShield: 0,
      activeRelicTriggers: [],
      specialTileBonuses: [],
      bossPhaseDelta: 0,
      bossPhaseNote: bossConstraint?.description || '',
      projectedDamage: 0,
      projectedShield: 0,
      projectedHeal: 0,
      projectedEnemyHpAfter: enemyHp,
      projectedEnemyHpAfterPct: currentPct,
      projectedEnemyHpDropPct: 0,
      wouldDefeatEnemy: false,
    };
  }

  const economies = cleaned.map((w) => evaluateWordEconomy(w));
  const baseTilePoints = economies.reduce((sum, e) => sum + e.rawLetterPoints, 0);
  const maxLengthMultiplier = economies.reduce((max, e) => Math.max(max, e.lengthMultiplier), 1);
  const synergies = evaluateWordPropertySynergies(cleaned);

  // Check active Roguelike Relic triggers (#5, #12)
  const joinedUpper = cleaned.join('').toUpperCase();
  const activeRelicTriggers: LiveCombatPreviewBreakdown['activeRelicTriggers'] = [];
  let relicBonusDamage = 0;
  let relicBonusShield = 0;
  let relicBonusHeal = 0;

  if (/[JQXZK]/.test(joinedUpper)) {
    const r = ROGUELIKE_RELICS[0];
    activeRelicTriggers.push({ id: r.id, name: r.name, icon: r.icon, bonusText: '+5 Rare-Letter DMG' });
    relicBonusDamage += 5;
  }
  if (synergies.some((s) => s.id === 'vowel-freeze')) {
    const r = ROGUELIKE_RELICS[1];
    activeRelicTriggers.push({ id: r.id, name: r.name, icon: r.icon, bonusText: '+4 Vowel Shield' });
    relicBonusShield += 4;
  }
  if (cleaned.some((w) => w.length >= 6)) {
    const r = ROGUELIKE_RELICS[2];
    activeRelicTriggers.push({ id: r.id, name: r.name, icon: r.icon, bonusText: '+4 Long-Word Amp' });
    relicBonusDamage += 4;
  }
  if (cleaned.length === 4) {
    const r = ROGUELIKE_RELICS[3];
    activeRelicTriggers.push({ id: r.id, name: r.name, icon: r.icon, bonusText: '+6 Phoenix Heal' });
    relicBonusHeal += 6;
  }

  // Check special compound / stamped / defused Time-Bomb tiles in hand (#13, #15)
  const specialTileBonuses: LiveCombatPreviewBreakdown['specialTileBonuses'] = [];
  let specialDamage = 0;
  let specialHeal = 0;

  for (const tile of handTiles) {
    const token = tile.letters === '★' ? '' : tile.letters.toUpperCase();
    const isMatchedInCast = tile.letters === '★' || (token && joinedUpper.includes(token));
    if (!isMatchedInCast) continue;

    if (tile.category === 'compound') {
      specialDamage += 4;
      specialTileBonuses.push({ label: `🔤 Compound ${tile.letters} (+4 DMG)`, bonusDamage: 4, bonusHeal: 0 });
    }
    if (tile.stamp === 'gilded') {
      specialDamage += 4;
      specialTileBonuses.push({ label: `✨ Gilded ${tile.letters} (+4 DMG & +15 🪙)`, bonusDamage: 4, bonusHeal: 0 });
    } else if (tile.stamp === 'lifesteal') {
      specialHeal += 5;
      specialTileBonuses.push({ label: `🧛 Lifesteal ${tile.letters} (+5 HP)`, bonusDamage: 0, bonusHeal: 5 });
    }
    if (tile.hazard === 'time-bomb') {
      specialDamage += 8;
      specialTileBonuses.push({ label: `💣 Defused Time-Bomb (+8 Blast DMG!)`, bonusDamage: 8, bonusHeal: 0 });
    }
  }

  const bossEval = bossConstraint
    ? evaluateBossPhaseConstraint(bossConstraint, cleaned)
    : { complied: true, powerDelta: 0, statusNote: '' };

  const synergyBonusShield =
    synergies.reduce((s, syn) => s + (syn.bonusShield ?? 0), 0) + relicBonusShield;
  const rawStrikePower =
    baseComboPower +
    relicBonusDamage +
    specialDamage +
    bossEval.powerDelta +
    Math.round(playerAttack * 0.65) -
    Math.round(enemyDefense * 0.35);

  const projectedDamage = Math.max(4, rawStrikePower);
  const damagePastShield = Math.max(0, projectedDamage - enemyShield);
  const projectedEnemyHpAfter = Math.max(0, enemyHp - damagePastShield);

  const currentHpPct = Math.max(0, Math.min(100, Math.round((enemyHp / Math.max(1, enemyMaxHp)) * 100)));
  const projectedEnemyHpAfterPct = Math.max(
    0,
    Math.min(100, Math.round((projectedEnemyHpAfter / Math.max(1, enemyMaxHp)) * 100))
  );
  const projectedEnemyHpDropPct = Math.max(0, currentHpPct - projectedEnemyHpAfterPct);

  return {
    isValid: true,
    wordCount: cleaned.length,
    baseTilePoints,
    maxLengthMultiplier,
    synergyBonusDamage: relicBonusDamage + specialDamage,
    synergyBonusShield,
    activeRelicTriggers,
    specialTileBonuses,
    bossPhaseDelta: bossEval.powerDelta,
    bossPhaseNote: bossEval.statusNote,
    projectedDamage,
    projectedShield: synergyBonusShield + (cleaned.length >= 2 ? 4 : 0),
    projectedHeal: relicBonusHeal + specialHeal,
    projectedEnemyHpAfter,
    projectedEnemyHpAfterPct,
    projectedEnemyHpDropPct,
    wouldDefeatEnemy: projectedEnemyHpAfter === 0,
  };
}
