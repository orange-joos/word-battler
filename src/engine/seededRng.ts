/**
 * Priority #16: Deterministic Seeding & Daily Challenge Mode
 * Routes all RNG (tile draws, map generation, enemy intents, shop offerings) through a shareable seed string,
 * and provides a Daily Run mode with 1-2 rotating global modifiers.
 */

export class SeededRng {
  private state: number;
  public readonly seedString: string;

  constructor(seedInput: string | number = 'AETHERIA-DEFAULT-SEED') {
    this.seedString = String(seedInput).trim() || 'AETHERIA-DEFAULT-SEED';
    this.state = SeededRng.hashSeedString(this.seedString);
  }

  /**
   * Deterministic FNV-1a + Murmur3 avalanche hash from seed string to 32-bit unsigned int.
   */
  public static hashSeedString(str: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) || 0x1337beef;
  }

  /**
   * Mulberry32 deterministic PRNG returning float in [0, 1).
   */
  public nextFloat(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns deterministic integer in [min, max] inclusive.
   */
  public nextInt(min: number, max: number): number {
    if (max <= min) return min;
    return min + Math.floor(this.nextFloat() * (max - min + 1));
  }

  /**
   * Deterministically shuffles an array copy using Fisher-Yates.
   */
  public shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  /**
   * Picks a weighted item deterministically.
   */
  public pickWeighted<T>(items: readonly T[], getWeight: (item: T) => number): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty weighted list');
    }
    const weights = items.map((it) => Math.max(0.001, getWeight(it)));
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = this.nextFloat() * total;
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return items[i];
    }
    return items[items.length - 1];
  }
}

export interface DailyChallengeModifier {
  id: string;
  name: string;
  icon: string;
  description: string;
  scoreMultiplier: number;
}

export const DAILY_GLOBAL_MODIFIERS: readonly DailyChallengeModifier[] = Object.freeze([
  {
    id: 'mod-digraph-surge',
    name: 'Compound Digraph Surge',
    icon: '🔤',
    description: 'Compound tiles (QU, TH, ING) appear 2x more often and grant +5 bonus damage.',
    scoreMultiplier: 1.25,
  },
  {
    id: 'mod-palindrome-festival',
    name: 'Mirror-Edge Festival',
    icon: '🪞',
    description: 'Palindromes and Anagrams trigger double Bleed & Shield values.',
    scoreMultiplier: 1.3,
  },
  {
    id: 'mod-scholar-marathon',
    name: 'Scholar Marathon',
    icon: '🏛️',
    description: '6+ letter words deal +35% extra damage; 3-letter words deal -25% damage.',
    scoreMultiplier: 1.35,
  },
  {
    id: 'mod-volatile-rack',
    name: 'Volatile Time-Bomb Rack',
    icon: '💣',
    description: 'Every hand includes 1 Time-Bomb tile that hurls +8 Explosive Damage when defused!',
    scoreMultiplier: 1.4,
  },
  {
    id: 'mod-gilded-bazaar',
    name: 'Gilded Stamp Bonanza',
    icon: '✨',
    description: 'Start the run with 2 Gilded and Lifesteal stamped tiles in your bag.',
    scoreMultiplier: 1.2,
  },
]);

export interface DailyChallengeConfig {
  dateKey: string;
  seedString: string;
  modifiers: [DailyChallengeModifier, DailyChallengeModifier];
  featuredRealmIndex: number;
}

/**
 * Generates a deterministic Daily Challenge configuration for a given YYYY-MM-DD date (#16).
 */
export function getDailyChallengeConfig(dateOverride?: string): DailyChallengeConfig {
  const dateKey =
    dateOverride ||
    new Date().toISOString().slice(0, 10);
  const seedString = `DAILY-${dateKey}`;
  const rng = new SeededRng(seedString);
  const shuffledMods = rng.shuffle(DAILY_GLOBAL_MODIFIERS);
  const featuredRealmIndex = rng.nextInt(0, 8);

  return {
    dateKey,
    seedString,
    modifiers: [shuffledMods[0], shuffledMods[1]],
    featuredRealmIndex,
  };
}
