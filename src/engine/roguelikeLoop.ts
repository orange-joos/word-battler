/**
 * Priority #4: Enemy Variety & Encounter Modifiers (Letter Corruption, Locked Consonants, Vowel Devourer, Word-Length Cap)
 * Priority #5: Run Structure & Meta-Progression (Branching Route Nodes, Passive Relics/Artifacts, Persistent Unlock Tracks)
 * Priority #8: Atomic Run State Serialization & Crash Recovery (Checksummed dual-buffer persistence per combat round)
 * Priority #10: Release & Distribution Polish (Steamworks/Platform Achievements, Steam Deck Controller Profile, Cloud Save & 3-Min Tutorial)
 */

import { countVowels } from './lexiconTrie.ts';

// ============================================================================
// PRIORITY #4: ENEMY VARIETY & BOARD-STATE ENCOUNTER MODIFIERS
// ============================================================================

export type EnemyModifierId =
  | 'vowel-devourer'
  | 'locked-consonants'
  | 'letter-corruption'
  | 'word-length-cap';

export interface EnemyBoardModifier {
  id: EnemyModifierId;
  name: string;
  icon: string;
  shortRule: string;
  counterplayTip: string;
}

export const ENEMY_BOARD_MODIFIERS: Readonly<Record<EnemyModifierId, EnemyBoardModifier>> =
  Object.freeze({
    'vowel-devourer': {
      id: 'vowel-devourer',
      name: 'Vowel Devourer',
      icon: '🌀',
      shortRule: '1-vowel words lose -2 Power; words with ≥3 vowels shatter the ward for +5 Power!',
      counterplayTip: 'Weave vowel-rich words (3+ vowels) to overload the Devourer!',
    },
    'locked-consonants': {
      id: 'locked-consonants',
      name: 'Locked Consonants',
      icon: '🔒',
      shortRule: 'Short words (<5 letters) are dampened (-2 Power); 6+ letter words break the lock (+5 Power)!',
      counterplayTip: 'Cast 6+ letter vocabulary to shatter the Consonant Lock!',
    },
    'letter-corruption': {
      id: 'letter-corruption',
      name: 'Letter Corruption',
      icon: '☣️',
      shortRule: 'Single-word casts suffer -3 Power from corruption; 2+ word combos cleanse & gain +4 Power!',
      counterplayTip: 'Chain at least 2 words together to cleanse the corrupted tiles!',
    },
    'word-length-cap': {
      id: 'word-length-cap',
      name: 'Compression Ward',
      icon: '📏',
      shortRule: 'Precision 5–7 letter words gain +4 Tempo Power; 4-card sentences pierce 100% of shields!',
      counterplayTip: 'Use crisp 5–7 letter words or a full 4-word sentence to pierce the ward!',
    },
  });

export function getEnemyModifierForBoss(enemyId: string): EnemyBoardModifier {
  const hash = enemyId
    .split('')
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const keys: EnemyModifierId[] = [
    'vowel-devourer',
    'locked-consonants',
    'letter-corruption',
    'word-length-cap',
  ];
  return ENEMY_BOARD_MODIFIERS[keys[hash % keys.length]];
}

export function evaluateEnemyModifierImpact(
  modifier: EnemyBoardModifier,
  words: string[]
): { powerDelta: number; note: string | null } {
  const cleaned = words
    .map((w) => w.trim().toLowerCase().replace(/[^a-z]/g, ''))
    .filter(Boolean);
  if (cleaned.length === 0) return { powerDelta: 0, note: null };

  switch (modifier.id) {
    case 'vowel-devourer': {
      const hasRichVowels = cleaned.some((w) => countVowels(w) >= 3);
      if (hasRichVowels) {
        return {
          powerDelta: 5,
          note: `${modifier.icon} Countered ${modifier.name} with ≥3 vowels (+5 Power)!`,
        };
      }
      const allLowVowels = cleaned.every((w) => countVowels(w) <= 1);
      if (allLowVowels) {
        return {
          powerDelta: -2,
          note: `${modifier.icon} ${modifier.name} drained 1-vowel word (-2 Power).`,
        };
      }
      return { powerDelta: 0, note: null };
    }
    case 'locked-consonants': {
      const hasLongWord = cleaned.some((w) => w.length >= 6);
      if (hasLongWord) {
        return {
          powerDelta: 5,
          note: `${modifier.icon} Shattered ${modifier.name} with 6+ letter word (+5 Power)!`,
        };
      }
      if (cleaned.every((w) => w.length < 5)) {
        return {
          powerDelta: -2,
          note: `${modifier.icon} ${modifier.name} dampened short word (-2 Power).`,
        };
      }
      return { powerDelta: 0, note: null };
    }
    case 'letter-corruption': {
      if (cleaned.length >= 2) {
        return {
          powerDelta: 4,
          note: `${modifier.icon} Multi-word combo cleansed ${modifier.name} (+4 Power)!`,
        };
      }
      return {
        powerDelta: -3,
        note: `${modifier.icon} Single-word cast hit by ${modifier.name} (-3 Power).`,
      };
    }
    case 'word-length-cap': {
      if (cleaned.some((w) => w.length >= 5 && w.length <= 7)) {
        return {
          powerDelta: 4,
          note: `${modifier.icon} Precision 5–7 letter word resonated with ${modifier.name} (+4 Power)!`,
        };
      }
      return { powerDelta: 0, note: null };
    }
  }
}

// ============================================================================
// PRIORITY #5: ROGUELIKE RUN STRUCTURE, RELICS & PERSISTENT UNLOCK TRACKS
// ============================================================================

export interface RoguelikeRelic {
  id: string;
  name: string;
  icon: string;
  description: string;
  effectType: 'rare-letter-boost' | 'vowel-shield' | 'long-word-amp' | 'round-regen';
  bonusValue: number;
}

export const ROGUELIKE_RELICS: readonly RoguelikeRelic[] = Object.freeze([
  {
    id: 'relic-scrabble-quartz',
    name: 'Scrabble Quartz Prism',
    icon: '💎',
    description: 'Words containing high-tier letters (J, Q, X, Z, K) deal +5 bonus damage.',
    effectType: 'rare-letter-boost',
    bonusValue: 5,
  },
  {
    id: 'relic-vowel-chalice',
    name: 'Chalice of Five Vowels',
    icon: '🏆',
    description: 'Words with ≥3 vowels grant +4 extra Fortification Shield on cast.',
    effectType: 'vowel-shield',
    bonusValue: 4,
  },
  {
    id: 'relic-syntax-hourglass',
    name: 'Syntax Hourglass',
    icon: '⏳',
    description: '6+ letter words gain an additional +4 Scholarly Power.',
    effectType: 'long-word-amp',
    bonusValue: 4,
  },
  {
    id: 'relic-phoenix-feather',
    name: 'Phoenix Quill Bookmark',
    icon: '🪶',
    description: 'Restores +6 Companion HP whenever you weave a 4-word Ultimate Sentence.',
    effectType: 'round-regen',
    bonusValue: 6,
  },
]);

export interface StarterDeckUnlockTrack {
  id: string;
  name: string;
  icon: string;
  requiredStars: number;
  description: string;
  bonusTrait: string;
}

export const STARTER_DECK_UNLOCK_TRACKS: readonly StarterDeckUnlockTrack[] = Object.freeze([
  {
    id: 'deck-vanguard-scribe',
    name: 'Vanguard Scribe Deck',
    icon: '📜',
    requiredStars: 0,
    description: 'Balanced K–8 Adjective + Noun + Verb + Adverb starter tablet deck.',
    bonusTrait: '+2 Base Combo Power',
  },
  {
    id: 'deck-palindrome-blade',
    name: 'Mirror-Symmetry Deck',
    icon: '🗡️',
    requiredStars: 6,
    description: 'Unlocks Palindrome & Anagram specialist tiles that inflict Bleed and Shield.',
    bonusTrait: '+4 Bleed & Anagram Shield',
  },
  {
    id: 'deck-grand-lexicon',
    name: 'Grand Lexicon Master Deck',
    icon: '👑',
    requiredStars: 15,
    description: 'High-tier Q/Z/X/J & 7+ letter scholarly tablets with 2.15x length scaling.',
    bonusTrait: '+25% High-Tier Letter Scaling',
  },
]);

// ============================================================================
// PRIORITY #8: ATOMIC RUN STATE SERIALIZATION & CRASH RECOVERY
// ============================================================================

const ATOMIC_SNAPSHOT_PRIMARY_KEY = 'wb_atomic_combat_snapshot_v1';
const ATOMIC_SNAPSHOT_BACKUP_KEY = 'wb_atomic_combat_snapshot_backup_v1';

export interface AtomicCombatSnapshot {
  schemaVersion: 1;
  timestamp: number;
  roundNumber: number;
  zoneId: string;
  nodeId: string;
  playerId: string;
  enemyId: string;
  playerHp: number;
  playerMaxHp: number;
  playerShield: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyShield: number;
  selectedWordIds: string[];
  checksum: string;
}

/**
 * Deterministic FNV-1a 32-bit checksum for atomic save-state integrity (#8).
 */
export function computeSnapshotChecksum(payloadWithoutChecksum: Omit<AtomicCombatSnapshot, 'checksum'>): string {
  const json = JSON.stringify(payloadWithoutChecksum);
  let hash = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Atomically persists combat round state with dual-slot backup & checksum (#8).
 */
export function saveAtomicCombatSnapshot(
  data: Omit<AtomicCombatSnapshot, 'schemaVersion' | 'timestamp' | 'checksum'>
): AtomicCombatSnapshot {
  const basePayload: Omit<AtomicCombatSnapshot, 'checksum'> = {
    schemaVersion: 1,
    timestamp: Date.now(),
    ...data,
  };
  const checksum = computeSnapshotChecksum(basePayload);
  const fullSnapshot: AtomicCombatSnapshot = {
    ...basePayload,
    checksum,
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const existing = window.localStorage.getItem(ATOMIC_SNAPSHOT_PRIMARY_KEY);
      if (existing) {
        window.localStorage.setItem(ATOMIC_SNAPSHOT_BACKUP_KEY, existing);
      }
      window.localStorage.setItem(ATOMIC_SNAPSHOT_PRIMARY_KEY, JSON.stringify(fullSnapshot));
    } catch {
      // Ignore quota errors in restricted sandboxes
    }
  }
  return fullSnapshot;
}

/**
 * Loads and verifies the most recent atomic combat snapshot, falling back to backup if corrupted (#8).
 */
export function loadAtomicCombatSnapshot(): AtomicCombatSnapshot | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  const tryParseAndVerify = (raw: string | null): AtomicCombatSnapshot | null => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as AtomicCombatSnapshot;
      if (!parsed || parsed.schemaVersion !== 1 || typeof parsed.checksum !== 'string') {
        return null;
      }
      const { checksum, ...rest } = parsed;
      const expected = computeSnapshotChecksum(rest);
      return checksum === expected ? parsed : null;
    } catch {
      return null;
    }
  };

  const primary = tryParseAndVerify(window.localStorage.getItem(ATOMIC_SNAPSHOT_PRIMARY_KEY));
  if (primary) return primary;
  return tryParseAndVerify(window.localStorage.getItem(ATOMIC_SNAPSHOT_BACKUP_KEY));
}

export function clearAtomicCombatSnapshot(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(ATOMIC_SNAPSHOT_PRIMARY_KEY);
    window.localStorage.removeItem(ATOMIC_SNAPSHOT_BACKUP_KEY);
  } catch {
    // Ignore storage removal errors
  }
}

// ============================================================================
// PRIORITY #10: STEAMWORKS / PLATFORM ACHIEVEMENTS, CLOUD SAVE & 3-MIN TUTORIAL
// ============================================================================

export interface PlatformAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  steamApiKey: string;
}

export const PLATFORM_ACHIEVEMENTS: readonly PlatformAchievement[] = Object.freeze([
  {
    id: 'ach_first_sentence',
    title: 'Syntax Weaver',
    description: 'Cast a complete 4-word sentence (Adjective + Noun + Verb + Adverb) in combat.',
    icon: '⚡',
    steamApiKey: 'ACH_SYNTAX_WEAVER',
  },
  {
    id: 'ach_high_tier_lexicon',
    title: 'Grand Lexicographer',
    description: 'Play a 6+ letter word or rare Q/Z/X/J tablet for exponential damage.',
    icon: '📚',
    steamApiKey: 'ACH_GRAND_LEXICOGRAPHER',
  },
  {
    id: 'ach_word_alchemist',
    title: 'Morphology Smith',
    description: 'Chisel a new prefixed, suffixed, or compound word on the Word Forge Anvil.',
    icon: '🔨',
    steamApiKey: 'ACH_MORPHOLOGY_SMITH',
  },
  {
    id: 'ach_realm_conqueror',
    title: 'Sovereign of Nine Realms',
    description: 'Earn stars across the Elemental Realms in the Word World Atlas.',
    icon: '👑',
    steamApiKey: 'ACH_REALM_CONQUEROR',
  },
]);

export interface TutorialStep {
  step: number;
  title: string;
  durationLabel: string;
  badge: string;
  body: string;
  interactivePrompt: string;
}

export const TUTORIAL_STEPS_3MIN: readonly TutorialStep[] = Object.freeze([
  {
    step: 1,
    title: '1. Tap or Type Word Tablets',
    durationLabel: '0:45',
    badge: 'Multi-Modal Input (#6)',
    body: 'Click Word Cards at the bottom, drag them into the 4 sentence slots, or type the word directly on your keyboard! Longer 6+ letter words and rare letters (Q, Z, X, J) deal exponential bonus damage.',
    interactivePrompt: 'Try clicking or typing any Word Tablet during battle!',
  },
  {
    step: 2,
    title: '2. Build the 4-Part Sentence Order',
    durationLabel: '0:45',
    badge: 'Grammar Power',
    body: 'Match the color-coded shapes: ◆ Adjective → ■ Noun → ▲ Verb → ● Adverb. Weaving all 4 slots unleashes a 2.0x Syntax Surge Ultimate!',
    interactivePrompt: 'Click 💡 Help in battle anytime to highlight the next slot needed.',
  },
  {
    step: 3,
    title: '3. Trigger Word Synergies & Counter Boss Wards',
    durationLabel: '0:45',
    badge: 'Synergies (#3 & #4)',
    body: 'Words with ≥3 vowels inflict ❄️ Freeze, palindromes inflict 🩸 Bleed, and anagrams grant 🛡️ Shield! Watch the top-right Boss HUD for active Enemy Modifiers.',
    interactivePrompt: 'Hover over any Word Card to inspect its definition and synergy.',
  },
  {
    step: 4,
    title: '4. Forge New Words & Collect Relics',
    durationLabel: '0:45',
    badge: 'Meta-Progression (#5)',
    body: 'Visit the Word Forge to fuse Prefixes + Roots + Suffixes, and open your 🎒 Explorer Pack to equip passive Relics, toggle High-Contrast / OpenDyslexic mode, or export Cloud Saves!',
    interactivePrompt: 'Ready to begin! You can replay or skip this tutorial anytime.',
  },
]);
