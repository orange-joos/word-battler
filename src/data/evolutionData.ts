import { Creature, EvolutionStage, CreatureStats } from '../types';

/**
 * Pre-defined evolution branches for the primary companion lines.
 */
export const PRESET_EVOLUTIONS: Record<string, EvolutionStage[]> = {
  emberfox: [
    {
      stage: 1,
      name: 'Emberfox',
      spriteEmoji: '🦊',
      minLevel: 1,
      title: 'Emberspark Pup',
      description: 'A nimble fox whose fur holds living embers. Fast and spirited.',
      statBoosts: { hp: 0, attack: 0, defense: 0, speed: 0 },
    },
    {
      stage: 2,
      name: 'Pyronix',
      spriteEmoji: '🦁🔥',
      minLevel: 10,
      title: 'Blazing Sun-Lion',
      description: 'A fearsome predator clothed in blazing solar fire. Its roar incinerates enemy barriers!',
      statBoosts: { hp: 20, attack: 8, defense: 4, speed: 5 },
    },
    {
      stage: 3,
      name: 'Solarynx Sovereign',
      spriteEmoji: '🐲🔥',
      minLevel: 20,
      title: 'Cosmic Flame Dragon',
      description: 'The celestial monarch of volcanic grammar. Commands linguistic coronal mass ejections!',
      statBoosts: { hp: 30, attack: 12, defense: 8, speed: 7 },
    },
  ],
  rimepup: [
    {
      stage: 1,
      name: 'Rimepup',
      spriteEmoji: '🐺',
      minLevel: 1,
      title: 'Frostmist Pup',
      description: 'A frost-coated pup that breathes pale mist. Chills opponents with icy adjectives.',
      statBoosts: { hp: 0, attack: 0, defense: 0, speed: 0 },
    },
    {
      stage: 2,
      name: 'Glacierhound',
      spriteEmoji: '❄️🐺',
      minLevel: 10,
      title: 'Permafrost Guardian',
      description: 'An arctic hound armored in unbreakable glacial crystal. Repels physical attacks with ease.',
      statBoosts: { hp: 24, attack: 5, defense: 10, speed: 4 },
    },
    {
      stage: 3,
      name: 'Blizzard Fenrir',
      spriteEmoji: '🐻‍❄️❄️',
      minLevel: 20,
      title: 'Eternal Winter Lord',
      description: 'The ancient titan of frost. Freezes enemy sentence structures solid in deep sub-zero stasis.',
      statBoosts: { hp: 32, attack: 9, defense: 14, speed: 6 },
    },
  ],
  verdantsprout: [
    {
      stage: 1,
      name: 'Verdantsprout',
      spriteEmoji: '🐱🍃',
      minLevel: 1,
      title: 'Sproutling Lynx',
      description: 'A curious kitten rooted with blossoming ivy. Channeling botanical adjectives and growth.',
      statBoosts: { hp: 0, attack: 0, defense: 0, speed: 0 },
    },
    {
      stage: 2,
      name: 'Floragryph',
      spriteEmoji: '🦅🌿',
      minLevel: 10,
      title: 'Thornbloom Gryphon',
      description: 'A soaring beast with emerald wings and vine talons. Ensnaring foes in morphological roots.',
      statBoosts: { hp: 22, attack: 7, defense: 7, speed: 6 },
    },
    {
      stage: 3,
      name: 'Yggdrasil Monarch',
      spriteEmoji: '🦌🌳',
      minLevel: 20,
      title: 'World-Tree Sovereign',
      description: 'The mythological lord of the forest canopy. Its antlers bloom with living vocabulary blossoms.',
      statBoosts: { hp: 36, attack: 11, defense: 11, speed: 8 },
    },
  ],
};

/**
 * Returns procedural evolution stages for any custom or forged creature.
 */
export function getProceduralEvolutionBranch(creature: Creature): EvolutionStage[] {
  const elem = creature.element || 'fire';
  const elemEmoji = elem === 'ice' ? '❄️' : elem === 'nature' ? '🌿' : '🔥';
  const baseName = creature.name.replace(/^(Alpha|Apex|Mega|Primal)\s+/, '');

  return [
    {
      stage: 1,
      name: baseName,
      spriteEmoji: creature.spriteEmoji || (elem === 'ice' ? '🐺' : elem === 'nature' ? '🐱' : '🦊'),
      minLevel: 1,
      title: 'Novice Beast',
      description: creature.description,
      statBoosts: { hp: 0, attack: 0, defense: 0, speed: 0 },
    },
    {
      stage: 2,
      name: `Alpha ${baseName}`,
      spriteEmoji: `${elemEmoji}🦁`,
      minLevel: 10,
      title: 'Battle-Forged Veteran',
      description: `An energized evolutionary form of ${baseName}, empowered with concentrated ${elem} resonance.`,
      statBoosts: { hp: 22, attack: 7, defense: 6, speed: 5 },
    },
    {
      stage: 3,
      name: `Apex ${baseName} Prime`,
      spriteEmoji: `${elemEmoji}🐲`,
      minLevel: 20,
      title: 'Mythic Sovereign',
      description: `The ultimate apex form of ${baseName}. Radiating boundless morphological mastery!`,
      statBoosts: { hp: 34, attack: 11, defense: 10, speed: 7 },
    },
  ];
}

/**
 * Get the full evolution branch for any creature
 */
export function getEvolutionBranch(creature: Creature): EvolutionStage[] {
  if (creature.evolutionBranch && creature.evolutionBranch.length > 0) {
    return creature.evolutionBranch;
  }
  const cleanId = creature.id.toLowerCase();
  if (PRESET_EVOLUTIONS[cleanId]) {
    return PRESET_EVOLUTIONS[cleanId];
  }
  // Check matching prefixes
  if (cleanId.includes('fox') || cleanId.includes('pyro')) {
    return PRESET_EVOLUTIONS.emberfox;
  }
  if (cleanId.includes('pup') || cleanId.includes('rime') || cleanId.includes('frost')) {
    return PRESET_EVOLUTIONS.rimepup;
  }
  if (cleanId.includes('sprout') || cleanId.includes('flora') || cleanId.includes('leaf')) {
    return PRESET_EVOLUTIONS.verdantsprout;
  }
  return getProceduralEvolutionBranch(creature);
}

/**
 * Get next evolution stage if available
 */
export function getNextEvolutionStage(creature: Creature): EvolutionStage | null {
  const branch = getEvolutionBranch(creature);
  const currentStageNum = creature.stage || 1;
  const next = branch.find((s) => s.stage === currentStageNum + 1);
  return next || null;
}

/**
 * Checks if a pet has met the level requirements to trigger evolution
 */
export function canPetEvolve(creature: Creature): boolean {
  const nextStage = getNextEvolutionStage(creature);
  if (!nextStage) return false;
  const petLevel = creature.level || 1;
  return petLevel >= nextStage.minLevel;
}

/**
 * Calculates current evolution stage data for a pet
 */
export function getCurrentStage(creature: Creature): EvolutionStage {
  const branch = getEvolutionBranch(creature);
  const currentStageNum = creature.stage || 1;
  return (
    branch.find((s) => s.stage === currentStageNum) ||
    branch[0] || {
      stage: 1,
      name: creature.name,
      spriteEmoji: creature.spriteEmoji || '🦊',
      minLevel: 1,
      title: 'Explorer Companion',
      description: creature.description,
      statBoosts: { hp: 0, attack: 0, defense: 0, speed: 0 },
    }
  );
}

/**
 * Applies evolution to a pet, calculating upgraded stats and new stage
 */
export function applyEvolution(creature: Creature): {
  evolvedCreature: Creature;
  previousStage: EvolutionStage;
  newStage: EvolutionStage;
} {
  const branch = getEvolutionBranch(creature);
  const currentStage = getCurrentStage(creature);
  const nextStage = getNextEvolutionStage(creature);

  if (!nextStage) {
    return {
      evolvedCreature: creature,
      previousStage: currentStage,
      newStage: currentStage,
    };
  }

  // Calculate new upgraded stats
  const baseStats = creature.stats;
  const newStats: CreatureStats = {
    hp: baseStats.hp + nextStage.statBoosts.hp,
    attack: baseStats.attack + nextStage.statBoosts.attack,
    defense: baseStats.defense + nextStage.statBoosts.defense,
    speed: baseStats.speed + nextStage.statBoosts.speed,
  };

  const evolvedCreature: Creature = {
    ...creature,
    name: nextStage.name,
    spriteEmoji: nextStage.spriteEmoji,
    stage: nextStage.stage,
    title: nextStage.title,
    description: nextStage.description,
    stats: newStats,
    maxHp: (creature.maxHp || baseStats.hp) + nextStage.statBoosts.hp,
    currentHp: (creature.maxHp || baseStats.hp) + nextStage.statBoosts.hp,
    evolvesAtLevel: nextStage.stage < 3 ? (nextStage.stage === 2 ? 20 : 30) : undefined,
    evolutionBranch: branch,
  };

  return {
    evolvedCreature,
    previousStage: currentStage,
    newStage: nextStage,
  };
}

/**
 * Calculate EXP requirement for a given level
 */
export function getRequiredExpForLevel(level: number): number {
  return Math.floor(60 + level * 25);
}
