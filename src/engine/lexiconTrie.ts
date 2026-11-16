/**
 * Priority #1: Deterministic Trie / DAWG Lexicon Lookup + Profanity Filter + Offline CSW/TWL Fallback
 * Priority #2: Calibrated Letter Economy Tier Values (Q, Z, X, J) & Exponential Length Multipliers (6+ letters)
 * Priority #3: Word Affixes & Orthographic Status Synergies (Freeze on >=3 vowels, Bleed on palindromes, Shielding on anagrams)
 */

import { INITIAL_WORDS } from '../data/initialData.ts';
import { getAllWordsList } from './forge.ts';

interface TrieNode {
  c: Record<string, TrieNode>;
  end?: boolean;
}

// Blocked profanity / slur stems for K-8 classroom & general safety (#1)
const BLOCKED_PROFANITY_STEMS: readonly string[] = Object.freeze([
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'cunt',
  'dick',
  'piss',
  'slut',
  'whore',
  'nigger',
  'nigga',
  'faggot',
  'retard',
  'kike',
  'spic',
  'chink',
]);

// Core Scrabble TWL / CSW offline fallback vocabulary (including palindromes, anagrams, high-tier Q/Z/X/J words)
const OFFLINE_TWL_CSW_FALLBACK: readonly string[] = Object.freeze([
  // Palindromes (trigger Bleed synergy #3)
  'civic',
  'radar',
  'level',
  'rotor',
  'kayak',
  'reviver',
  'deified',
  'stats',
  'tenet',
  'madam',
  'refer',
  // High-tier Q, Z, X, J words (trigger Letter Economy #2)
  'quartz',
  'zephyr',
  'zenith',
  'vortex',
  'phoenix',
  'jolt',
  'jovian',
  'quasar',
  'quench',
  'quiver',
  'dazzle',
  'blizzard',
  'onyx',
  'apex',
  'galvanize',
  'oxidize',
  'juxtapose',
  // Common anagram families (trigger Shielding synergy #3)
  'silent',
  'listen',
  'enlist',
  'tinsel',
  'earth',
  'heart',
  'hater',
  'stone',
  'tones',
  'notes',
  'onset',
  'flare',
  'feral',
  'spear',
  'parse',
  'spare',
  'reaps',
  'stream',
  'master',
  'tamers',
  // Common K-8 & Scrabble action/nature words
  'blaze',
  'blazing',
  'inferno',
  'glacier',
  'glacial',
  'frost',
  'frozen',
  'thunder',
  'lightning',
  'tempest',
  'torrent',
  'verdant',
  'radiant',
  'luminous',
  'shadow',
  'eclipse',
  'boulder',
  'seismic',
  'cyclone',
  'whirlwind',
  'shield',
  'bastion',
  'fortress',
  'strike',
  'vanquish',
  'shatter',
  'illuminate',
  'fiercely',
  'swiftly',
  'boldly',
  'brightly',
]);

/**
 * Deterministic Trie with prefix sharing for O(L) zero-allocation word & prefix lookup (#1).
 */
export class LexiconTrie {
  private root: TrieNode = { c: Object.create(null) };
  private wordCount = 0;
  private anagramBuckets: Map<string, Set<string>> = new Map();

  public insert(rawWord: string): boolean {
    const clean = rawWord.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length < 2 || isProfaneOrSlur(clean)) return false;

    let node = this.root;
    for (let i = 0; i < clean.length; i++) {
      const ch = clean[i];
      let next = node.c[ch];
      if (!next) {
        next = { c: Object.create(null) };
        node.c[ch] = next;
      }
      node = next;
    }
    if (!node.end) {
      node.end = true;
      this.wordCount++;
    }

    const sig = clean.split('').sort().join('');
    let bucket = this.anagramBuckets.get(sig);
    if (!bucket) {
      bucket = new Set();
      this.anagramBuckets.set(sig, bucket);
    }
    bucket.add(clean);
    return true;
  }

  public hasWord(rawWord: string): boolean {
    const clean = rawWord.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length < 2 || isProfaneOrSlur(clean)) return false;
    let node: TrieNode | undefined = this.root;
    for (let i = 0; i < clean.length; i++) {
      node = node.c[clean[i]];
      if (!node) return false;
    }
    return Boolean(node.end);
  }

  public hasPrefix(rawPrefix: string): boolean {
    const clean = rawPrefix.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (!clean) return false;
    let node: TrieNode | undefined = this.root;
    for (let i = 0; i < clean.length; i++) {
      node = node.c[clean[i]];
      if (!node) return false;
    }
    return true;
  }

  public getPrefixCompletions(rawPrefix: string, limit = 6): string[] {
    const clean = rawPrefix.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (!clean) return [];
    let node: TrieNode | undefined = this.root;
    for (let i = 0; i < clean.length; i++) {
      node = node.c[clean[i]];
      if (!node) return [];
    }
    const results: string[] = [];
    const dfs = (curr: TrieNode, path: string) => {
      if (results.length >= limit) return;
      if (curr.end) results.push(path);
      const keys = Object.keys(curr.c).sort();
      for (const k of keys) {
        if (results.length >= limit) return;
        dfs(curr.c[k], path + k);
      }
    };
    dfs(node, clean);
    return results;
  }

  public getAnagramsFor(rawWord: string): string[] {
    const clean = rawWord.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length < 3) return [];
    const sig = clean.split('').sort().join('');
    const bucket = this.anagramBuckets.get(sig);
    if (!bucket) return [];
    return Array.from(bucket).filter((w) => w !== clean);
  }

  public size(): number {
    return this.wordCount;
  }
}

/**
 * Profanity & slur check (#1).
 */
export function isProfaneOrSlur(rawText: string): boolean {
  const normalized = rawText.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (!normalized) return false;
  return BLOCKED_PROFANITY_STEMS.some((stem) => normalized.includes(stem));
}

// Singleton pre-indexed LexiconTrie with INITIAL_WORDS + TWL/CSW offline fallback
let globalLexiconTrie: LexiconTrie | null = null;

export function getGlobalLexiconTrie(): LexiconTrie {
  if (!globalLexiconTrie) {
    const trie = new LexiconTrie();
    const catalogWords = getAllWordsList(INITIAL_WORDS);
    for (const w of catalogWords) {
      trie.insert(w.word);
    }
    for (const fallbackWord of OFFLINE_TWL_CSW_FALLBACK) {
      trie.insert(fallbackWord);
    }
    globalLexiconTrie = trie;
  }
  return globalLexiconTrie;
}

/**
 * Benchmarks deterministic Trie lookups across N iterations (#1).
 */
export function benchmarkTrieLookup(iterations = 10000): {
  iterations: number;
  lexiconSize: number;
  elapsedMs: number;
  avgMicrosecondsPerLookup: number;
} {
  const trie = getGlobalLexiconTrie();
  const sampleQueries = [
    'blazing',
    'glacial',
    'quartz',
    'kayak',
    'silent',
    'nonexistentwordxyz',
    'zephyr',
    'phoenix',
  ];
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  let hits = 0;
  for (let i = 0; i < iterations; i++) {
    const q = sampleQueries[i & 7];
    if (trie.hasWord(q)) hits++;
  }
  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const elapsedMs = Math.max(0.01, Number((t1 - t0).toFixed(3)));
  const avgMicrosecondsPerLookup = Number(((elapsedMs * 1000) / iterations).toFixed(4));
  // Ensure `hits` is used so V8 doesn't dead-code-eliminate the loop
  if (hits < 0) console.log(hits);
  return {
    iterations,
    lexiconSize: trie.size(),
    elapsedMs,
    avgMicrosecondsPerLookup,
  };
}

// ============================================================================
// PRIORITY #2: LETTER ECONOMY & EXPONENTIAL LENGTH DAMAGE SCALING
// ============================================================================

export const LETTER_TIER_VALUES: Readonly<Record<string, number>> = Object.freeze({
  a: 1,
  e: 1,
  i: 1,
  o: 1,
  u: 1,
  l: 1,
  n: 1,
  s: 1,
  t: 1,
  r: 1,
  d: 2,
  g: 2,
  b: 3,
  c: 3,
  m: 3,
  p: 3,
  f: 4,
  h: 4,
  v: 4,
  w: 4,
  y: 4,
  k: 5,
  j: 8,
  x: 8,
  q: 10,
  z: 10,
});

export interface WordEconomyBreakdown {
  word: string;
  cleanLength: number;
  rawLetterPoints: number;
  highTierLetters: string[];
  lengthMultiplier: number;
  bonusDamage: number;
  tierBadge: 'Standard' | 'Skilled (6+)' | 'Master (8+)' | 'Mythic Rare';
}

/**
 * Calibrates letter tier values (Q, Z, X, J = 8-10 pts) and exponential length multipliers
 * for 6+ letter words to reward rich vocabulary over 3-letter spam (#2).
 */
export function evaluateWordEconomy(rawWord: string): WordEconomyBreakdown {
  const clean = rawWord.trim().toLowerCase().replace(/[^a-z]/g, '');
  let rawLetterPoints = 0;
  const highTierLetters: string[] = [];

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const pts = LETTER_TIER_VALUES[ch] ?? 1;
    rawLetterPoints += pts;
    if (pts >= 8 && !highTierLetters.includes(ch.toUpperCase())) {
      highTierLetters.push(ch.toUpperCase());
    }
  }

  // Exponential length multiplier curve (penalizes 3-letter spam, rewards 6+ letter vocabulary)
  const len = clean.length;
  let lengthMultiplier = 1.0;
  if (len <= 3) {
    lengthMultiplier = 0.85;
  } else if (len === 4) {
    lengthMultiplier = 1.0;
  } else if (len === 5) {
    lengthMultiplier = 1.2;
  } else if (len === 6) {
    lengthMultiplier = 1.45;
  } else if (len === 7) {
    lengthMultiplier = 1.75;
  } else if (len >= 8) {
    lengthMultiplier = 2.15;
  }

  const rareBonus = highTierLetters.length * 3;
  const bonusDamage = Math.max(
    0,
    Math.round((rawLetterPoints * 0.35 + rareBonus) * lengthMultiplier - 2)
  );

  const tierBadge: WordEconomyBreakdown['tierBadge'] =
    highTierLetters.length > 0
      ? 'Mythic Rare'
      : len >= 8
      ? 'Master (8+)'
      : len >= 6
      ? 'Skilled (6+)'
      : 'Standard';

  return {
    word: rawWord,
    cleanLength: len,
    rawLetterPoints,
    highTierLetters,
    lengthMultiplier,
    bonusDamage,
    tierBadge,
  };
}

// ============================================================================
// PRIORITY #3: WORD AFFIXES & ORTHOGRAPHIC STATUS SYNERGIES
// - Freeze on words with >= 3 vowels
// - Bleed on palindromes (or symmetric stems)
// - Shielding on anagrams (or alliterative pairs)
// ============================================================================

export interface WordPropertySynergy {
  id: 'vowel-freeze' | 'palindrome-bleed' | 'anagram-shield' | 'rare-letter-crit';
  name: string;
  icon: string;
  description: string;
  statusToApply?: {
    name: 'Freeze' | 'Bleed';
    type: 'debuff';
    duration: number;
    amount: number;
  };
  bonusShield?: number;
  guaranteedCrit?: boolean;
}

export function countVowels(rawWord: string): number {
  const clean = rawWord.trim().toLowerCase().replace(/[^a-z]/g, '');
  let count = 0;
  for (let i = 0; i < clean.length; i++) {
    if ('aeiou'.includes(clean[i])) count++;
  }
  return count;
}

export function isPalindromeWord(rawWord: string): boolean {
  const clean = rawWord.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length < 3) return false;
  for (let i = 0, j = clean.length - 1; i < j; i++, j--) {
    if (clean[i] !== clean[j]) return false;
  }
  return true;
}

export function areAnagrams(wordA: string, wordB: string): boolean {
  const a = wordA.trim().toLowerCase().replace(/[^a-z]/g, '');
  const b = wordB.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (a.length < 3 || a === b || a.length !== b.length) return false;
  return a.split('').sort().join('') === b.split('').sort().join('');
}

/**
 * Evaluates orthographic & morphological word properties to trigger tactical status synergies (#3).
 */
export function evaluateWordPropertySynergies(rawWords: string[]): WordPropertySynergy[] {
  const synergies: WordPropertySynergy[] = [];
  const trie = getGlobalLexiconTrie();
  const cleaned = rawWords
    .map((w) => w.trim().toLowerCase().replace(/[^a-z]/g, ''))
    .filter(Boolean);

  if (cleaned.length === 0) return synergies;

  // 1. Freeze on words with >= 3 vowels
  const threeVowelWord = cleaned.find((w) => countVowels(w) >= 3);
  if (threeVowelWord) {
    synergies.push({
      id: 'vowel-freeze',
      name: '❄️ Glacial Vowel Resonance',
      icon: '❄️',
      description: `“${threeVowelWord}” has ≥3 vowels → Inflicts Freeze (3 DMG/turn & chills enemy)!`,
      statusToApply: {
        name: 'Freeze',
        type: 'debuff',
        duration: 2,
        amount: 3,
      },
    });
  }

  // 2. Bleed on palindromes (e.g., kayak, radar, level, rotor, civic)
  const palindromeMatch = cleaned.find((w) => isPalindromeWord(w));
  if (palindromeMatch) {
    synergies.push({
      id: 'palindrome-bleed',
      name: '🩸 Palindrome Mirror-Edge',
      icon: '🩸',
      description: `Palindrome “${palindromeMatch}” reads the same both ways → Inflicts Bleed (4 DMG/turn)!`,
      statusToApply: {
        name: 'Bleed',
        type: 'debuff',
        duration: 3,
        amount: 4,
      },
    });
  }

  // 3. Shielding on Anagrams (either two placed words are anagrams of each other, or word has a known lexicon anagram)
  let anagramExplanation: string | null = null;
  for (let i = 0; i < cleaned.length; i++) {
    for (let j = i + 1; j < cleaned.length; j++) {
      if (areAnagrams(cleaned[i], cleaned[j])) {
        anagramExplanation = `Anagram pair “${cleaned[i]}” ↔ “${cleaned[j]}”`;
        break;
      }
    }
    if (!anagramExplanation) {
      const knownAnagrams = trie.getAnagramsFor(cleaned[i]);
      if (knownAnagrams.length > 0) {
        anagramExplanation = `“${cleaned[i]}” resonates with its anagram “${knownAnagrams[0]}”`;
      }
    }
  }

  if (anagramExplanation) {
    synergies.push({
      id: 'anagram-shield',
      name: '🛡️ Anagram Ward Shield',
      icon: '🛡️',
      description: `${anagramExplanation} → Raises +6 Bonus Shield!`,
      bonusShield: 6,
    });
  }

  // 4. High-Tier Letter (Q, Z, X, J) Arcane Critical
  const rareWord = cleaned.find((w) => /[qzxj]/.test(w));
  if (rareWord) {
    synergies.push({
      id: 'rare-letter-crit',
      name: '⚡ High-Tier Letter Surge',
      icon: '⚡',
      description: `Rare letter (Q/Z/X/J) in “${rareWord}” → Triggers Guaranteed Critical Strike!`,
      guaranteedCrit: true,
    });
  }

  return synergies;
}
