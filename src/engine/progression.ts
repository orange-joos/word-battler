import type {
  CatalogWords,
  Creature,
  CreatureStats,
  ElementType,
  GradeTier,
  PartOfSpeech,
  PetLoadout,
} from '../types.ts';
import { createStarterCreature } from '../data/starterPets.ts';
import { getAllWordsList } from './forge.ts';

export interface RealmWeather {
  id: string;
  name: string;
  element: ElementType;
  icon: string;
  effectLabel: string;
}

export const REALM_WEATHERS: RealmWeather[] = [
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    element: 'fire',
    icon: '☀️',
    effectLabel: 'Fire & Light Tablets +25% Power',
  },
  {
    id: 'monsoon-tide',
    name: 'Monsoon Tide',
    element: 'water',
    icon: '🌊',
    effectLabel: 'Water & Grass Tablets +25% Power',
  },
  {
    id: 'crystal-blizzard',
    name: 'Crystal Blizzard',
    element: 'ice',
    icon: '🌨️',
    effectLabel: 'Ice & Air Tablets +25% Power',
  },
  {
    id: 'meteor-shower',
    name: 'Meteor Shower',
    element: 'earth',
    icon: '☄️',
    effectLabel: 'Earth & Shadow Tablets +25% Power',
  },
  {
    id: 'ion-tempest',
    name: 'Ion Tempest',
    element: 'electric',
    icon: '🌩️',
    effectLabel: 'Electric & Air Tablets +25% Power',
  },
];

export const PREHISTORIC_COMPANIONS: Record<
  ElementType,
  { name: string; title: string; emoji: string }
> = {
  fire: { name: 'Pyroraptor Rex', title: 'Ancient Magma Saurian', emoji: '🦖' },
  water: { name: 'Plesiocrest', title: 'Tidal Abyssal Fossil', emoji: '🦕' },
  grass: { name: 'Ferntops', title: 'Primeval Canopy Horn', emoji: '🌿' },
  earth: { name: 'Ankylostone', title: 'Bedrock Bastion Titan', emoji: '🪨' },
  ice: { name: 'Mammothfrost', title: 'Glacial Tusk Ancient', emoji: '🦣' },
  air: { name: 'Pterogale', title: 'Skycrest Wing Fossil', emoji: '🦅' },
  electric: { name: 'Voltadon', title: 'Amber Spark Crest', emoji: '⚡' },
  shadow: { name: 'Nyxosaurus', title: 'Twilight Obsidian Stalker', emoji: '🐉' },
  light: { name: 'Solarchaeon', title: 'Dawnfeather Relic', emoji: '✨' },
};

const ACCESSORY_BONUSES: Record<string, CreatureStats> = {
  root_crown: { hp: 4, attack: 1, defense: 1, speed: 1 },
  amber_fang: { hp: 1, attack: 3, defense: 1, speed: 1 },
  iron_shell: { hp: 1, attack: 1, defense: 3, speed: 1 },
  zephyr_band: { hp: 1, attack: 1, defense: 1, speed: 3 },
};

const SPECIALIZATION_BONUSES: Record<'vanguard' | 'bastion', CreatureStats> = {
  vanguard: { hp: 2, attack: 4, defense: 1, speed: 3 },
  bastion: { hp: 6, attack: 1, defense: 4, speed: 1 },
};

/**
 * Purely derives a creature's effective stats from its base stats + equipped accessory + specialization,
 * avoiding in-place stat mutation bugs when toggling gear or specializations.
 */
export function getEffectiveCreatureStats(
  baseStats: CreatureStats,
  accessoryId?: string,
  specialization?: 'vanguard' | 'bastion'
): CreatureStats {
  const acc = accessoryId ? ACCESSORY_BONUSES[accessoryId] : undefined;
  const spec = specialization ? SPECIALIZATION_BONUSES[specialization] : undefined;
  return {
    hp: baseStats.hp + (acc?.hp ?? 0) + (spec?.hp ?? 0),
    attack: baseStats.attack + (acc?.attack ?? 0) + (spec?.attack ?? 0),
    defense: baseStats.defense + (acc?.defense ?? 0) + (spec?.defense ?? 0),
    speed: baseStats.speed + (acc?.speed ?? 0) + (spec?.speed ?? 0),
    accuracy: baseStats.accuracy,
  };
}

export function applyDerivedGearToRoster(
  creatures: Creature[],
  accessories: Record<string, string>,
  specializations: Record<string, 'vanguard' | 'bastion'>
): Creature[] {
  return creatures.map((c) => {
    const acc = accessories[c.id];
    const spec = specializations[c.id];
    if (!acc && !spec) return c;
    const stats = getEffectiveCreatureStats(c.stats, acc, spec);
    const title =
      spec === 'vanguard'
        ? 'Vanguard Strike Form'
        : spec === 'bastion'
        ? 'Bastion Guardian Form'
        : c.title;
    return {
      ...c,
      title,
      stats,
      maxHp: stats.hp,
    };
  });
}

export function buildAwakenedFossilCreature(
  element: ElementType,
  words: CatalogWords
): Creature {
  const meta = PREHISTORIC_COMPANIONS[element] || PREHISTORIC_COMPANIONS.fire;
  const fossilId = `fossil_${element}`;
  const base = createStarterCreature(element, getAllWordsList(words));
  return {
    ...base,
    id: fossilId,
    name: meta.name,
    title: meta.title,
    spriteEmoji: meta.emoji,
    level: 12,
    stage: 2,
    stats: {
      hp: 115,
      attack: 22,
      defense: 19,
      speed: 17,
    },
    maxHp: 115,
    currentHp: 115,
  };
}

export function computeBestLoadoutForPet(
  pet: Creature,
  words: CatalogWords,
  preferredTier: GradeTier | 'all' = 'all'
): PetLoadout {
  const allWordsList = getAllWordsList(words);
  const petAffinity = pet.elementAffinity || pet.element;
  const slots: PartOfSpeech[] = ['verb', 'noun', 'adjective', 'adverb'];
  const newLoadout: PetLoadout = pet.loadout
    ? { ...pet.loadout }
    : { verb: null, noun: null, adjective: null, adverb: null };

  for (const slot of slots) {
    let candidates = allWordsList.filter((w) => w.partOfSpeech === slot);
    if (preferredTier !== 'all') {
      const tierFiltered = candidates.filter((w) => (w.gradeTier || '3') === preferredTier);
      if (tierFiltered.length > 0) candidates = tierFiltered;
    }
    candidates.sort((a, b) => {
      const aAffinity = a.element === petAffinity ? 1 : 0;
      const bAffinity = b.element === petAffinity ? 1 : 0;
      if (bAffinity !== aAffinity) return bAffinity - aAffinity;
      const aPwr = a.powerBonus ?? (a.forge?.powerBonus || 0);
      const bPwr = b.powerBonus ?? (b.forge?.powerBonus || 0);
      return bPwr - aPwr;
    });

    if (candidates.length > 0) {
      newLoadout[slot] = candidates[0].id;
    }
  }

  return newLoadout;
}
