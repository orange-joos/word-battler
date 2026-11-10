import type { Creature, PartOfSpeech, Word } from '../types.ts';

export interface BossTacticalDecision {
  words: [Word, Word | null, Word | null, Word | null];
  tacticName: string;
  rationale: string;
}

export interface BossTacticalProfile {
  bossId: string;
  archetype: string;
  grammarLesson: string;
  preferredCombo: 'adj+noun' | 'adv+verb' | 'debuff' | 'sentence' | 'balanced';
  comboProbability: number;
}

export const BOSS_TACTICAL_PROFILES: Record<string, BossTacticalProfile> = {
  boss_galecrest: {
    bossId: 'boss_galecrest',
    archetype: 'Root & Suffix Striker',
    grammarLesson: 'Uses crisp Noun shields and direct Verb strikes.',
    preferredCombo: 'balanced',
    comboProbability: 0.45,
  },
  boss_leviathan: {
    bossId: 'boss_leviathan',
    archetype: 'Tidal Bastion',
    grammarLesson: 'Pairs Descriptive Adjectives + Nouns to raise Fortification shields.',
    preferredCombo: 'adj+noun',
    comboProbability: 0.65,
  },
  boss_ruptor: {
    bossId: 'boss_ruptor',
    archetype: 'Bedrock Breaker',
    grammarLesson: 'Channels heavy Noun armor-piercing impacts and Earth fortifications.',
    preferredCombo: 'adj+noun',
    comboProbability: 0.5,
  },
  boss_pyrostorm: {
    bossId: 'boss_pyrostorm',
    archetype: 'Blazing Tempo Striker',
    grammarLesson: 'Chains Adverb + Verb combos for high-tempo critical strikes.',
    preferredCombo: 'adv+verb',
    comboProbability: 0.7,
  },
  boss_dishornet: {
    bossId: 'boss_dishornet',
    archetype: 'Prefix Disruptor',
    grammarLesson: 'Inflicts status debuffs and inversion adjectives to disrupt rhythm.',
    preferredCombo: 'debuff',
    comboProbability: 0.55,
  },
  boss_zephyrlord: {
    bossId: 'boss_zephyrlord',
    archetype: 'Skywind Acrobat',
    grammarLesson: 'Uses swift Adverbs and Suffix-forged words for critical tempo.',
    preferredCombo: 'adv+verb',
    comboProbability: 0.65,
  },
  boss_voltarchon: {
    bossId: 'boss_voltarchon',
    archetype: 'High-Voltage Weaver',
    grammarLesson: 'Weaves multi-word syntax chains when supercharged.',
    preferredCombo: 'sentence',
    comboProbability: 0.75,
  },
  boss_umbralord: {
    bossId: 'boss_umbralord',
    archetype: 'Shadow Crypt Tactician',
    grammarLesson: 'Alternates between Affliction debuffs and armor-piercing strikes.',
    preferredCombo: 'debuff',
    comboProbability: 0.65,
  },
  boss_sovereign: {
    bossId: 'boss_sovereign',
    archetype: 'Grand Arbiter of Grammar',
    grammarLesson: 'Masters all 4 Parts of Speech and weaves 4-card sentences under pressure.',
    preferredCombo: 'sentence',
    comboProbability: 0.8,
  },
};

function pickBestWord(candidates: Word[], affinity: string): Word | null {
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) => {
    const aMatch = a.element === affinity ? 1 : 0;
    const bMatch = b.element === affinity ? 1 : 0;
    if (bMatch !== aMatch) return bMatch - aMatch;
    const aPwr = a.powerBonus ?? a.forge?.powerBonus ?? 0;
    const bPwr = b.powerBonus ?? b.forge?.powerBonus ?? 0;
    return bPwr - aPwr;
  });
  const topPool = sorted.slice(0, Math.min(3, sorted.length));
  return topPool[Math.floor(Math.random() * topPool.length)] || sorted[0];
}

/**
 * Smart Boss AI Tactician Agent:
 * Selects grammatical moves aligned with each boss's realm curriculum focus and combat state.
 */
export function selectBossTacticalMove(
  enemy: Creature,
  player: Creature,
  allWords: Word[],
  combosBlocked: boolean
): BossTacticalDecision | null {
  const allowedPool = allWords.filter((w) => enemy.allowedElements.includes(w.element));
  const pool = allowedPool.length > 0 ? allowedPool : allWords;
  if (pool.length === 0) return null;

  const affinity = enemy.elementAffinity || enemy.element;
  const profile = BOSS_TACTICAL_PROFILES[enemy.id] || {
    bossId: enemy.id,
    archetype: 'Elemental Challenger',
    grammarLesson: 'Combines elemental modifiers with head words.',
    preferredCombo: 'balanced',
    comboProbability: 0.45,
  };

  const byPos = (pos: PartOfSpeech) => pool.filter((w) => w.partOfSpeech === pos);
  const adjectives = byPos('adjective');
  const nouns = byPos('noun');
  const verbs = byPos('verb');
  const adverbs = byPos('adverb');

  const hpRatio = (enemy.currentHp ?? enemy.stats.hp) / Math.max(1, enemy.maxHp ?? enemy.stats.hp);
  const needsShield = hpRatio < 0.45 && (enemy.shield ?? 0) === 0;

  // 1. High-rank bosses (Syntax Sovereign / Voltarchon) can weave a 4-word sentence when below 50% HP
  if (
    !combosBlocked &&
    profile.preferredCombo === 'sentence' &&
    hpRatio <= 0.5 &&
    adjectives.length > 0 &&
    nouns.length > 0 &&
    verbs.length > 0 &&
    adverbs.length > 0 &&
    Math.random() < 0.35
  ) {
    const adj = pickBestWord(adjectives, affinity)!;
    const noun = pickBestWord(nouns, affinity)!;
    const verb = pickBestWord(verbs, affinity)!;
    const adv = pickBestWord(adverbs, affinity)!;
    return {
      words: [adj, noun, verb, adv],
      tacticName: `${profile.archetype}: Ultimate Sentence Weave`,
      rationale: `${enemy.name} weaves [Adjective + Noun + Verb + Adverb] to teach complete sentence structure!`,
    };
  }

  // 2. Defensive Fortification Combo (Adjective + Noun) when low HP or Bastion archetype
  if (
    !combosBlocked &&
    (needsShield || (profile.preferredCombo === 'adj+noun' && Math.random() < profile.comboProbability)) &&
    adjectives.length > 0 &&
    nouns.length > 0
  ) {
    const adj = pickBestWord(adjectives, affinity)!;
    const noun = pickBestWord(nouns, affinity)!;
    return {
      words: [adj, noun, null, null],
      tacticName: `${profile.archetype}: Fortified Noun Phrase`,
      rationale: `${enemy.name} pairs "${adj.word} ${noun.word}" (Adjective + Noun) for shield & damage mitigation.`,
    };
  }

  // 3. Offensive Tempo Strike Combo (Adverb + Verb)
  if (
    !combosBlocked &&
    (profile.preferredCombo === 'adv+verb' || Math.random() < profile.comboProbability) &&
    adverbs.length > 0 &&
    verbs.length > 0
  ) {
    const adv = pickBestWord(adverbs, affinity)!;
    const verb = pickBestWord(verbs, affinity)!;
    return {
      words: [adv, verb, null, null],
      tacticName: `${profile.archetype}: Adverbial Strike`,
      rationale: `${enemy.name} pairs "${adv.word} ${verb.word}" (Adverb + Verb) for a high-crit strike.`,
    };
  }

  // 4. Debuff / Disruption Specialist
  if (profile.preferredCombo === 'debuff' && adjectives.length > 0 && (player.statuses?.length || 0) < 2) {
    const debuffAdjs = adjectives.filter((w) => w.combatCategory === 'DEBUFF');
    const chosen = pickBestWord(debuffAdjs.length > 0 ? debuffAdjs : adjectives, affinity)!;
    return {
      words: [chosen, null, null, null],
      tacticName: `${profile.archetype}: Affliction Modifier`,
      rationale: `${enemy.name} casts "${chosen.word}" to demonstrate descriptive modifier effects.`,
    };
  }

  // 5. Fallback single-word action (non-adverb)
  const usableSingle = pool.filter((w) => w.partOfSpeech !== 'adverb');
  const chosen = pickBestWord(usableSingle.length > 0 ? usableSingle : pool, affinity) || pool[0];
  return {
    words: [chosen, null, null, null],
    tacticName: `${profile.archetype}: Direct Word Cast`,
    rationale: `${enemy.name} invokes "${chosen.word}" (${chosen.partOfSpeech}).`,
  };
}
