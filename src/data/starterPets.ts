import type { Creature, ElementType, PartOfSpeech, Word } from '../types';
import { ELEMENTS } from './elements.ts';

export interface StarterPetOption {
  element: ElementType;
  name: string;
  emoji: string;
  description: string;
  stats: Creature['stats'];
}

export const STARTER_PETS: Record<ElementType, StarterPetOption> = {
  fire: {
    element: 'fire',
    name: 'Emberfox',
    emoji: '🦊',
    description: 'A quick-footed friend with a warm, brave heart.',
    stats: { hp: 42, attack: 14, defense: 8, speed: 12 },
  },
  water: {
    element: 'water',
    name: 'Aquafin',
    emoji: '🐬',
    description: 'A playful swimmer who loves helping the whole team.',
    stats: { hp: 48, attack: 11, defense: 13, speed: 11 },
  },
  ice: {
    element: 'ice',
    name: 'Rimepup',
    emoji: '🐺',
    description: 'A loyal frost pup with a keen eye for new words.',
    stats: { hp: 46, attack: 10, defense: 13, speed: 9 },
  },
  grass: {
    element: 'grass',
    name: 'Verdantsprout',
    emoji: '🐱🍃',
    description: 'A curious little explorer who grows stronger with every lesson.',
    stats: { hp: 44, attack: 12, defense: 10, speed: 11 },
  },
  electric: {
    element: 'electric',
    name: 'Voltwing',
    emoji: '🐝',
    description: 'A speedy spark-friend who is always ready to learn.',
    stats: { hp: 42, attack: 12, defense: 9, speed: 15 },
  },
  shadow: {
    element: 'shadow',
    name: 'Dusklynx',
    emoji: '🐈‍⬛',
    description: 'A gentle dusk prowler who protects friends from the shadows.',
    stats: { hp: 44, attack: 14, defense: 10, speed: 13 },
  },
  light: {
    element: 'light',
    name: 'Luminibun',
    emoji: '🐇',
    description: 'A bright-hearted bunny that makes every path feel sunny.',
    stats: { hp: 46, attack: 11, defense: 12, speed: 12 },
  },
  earth: {
    element: 'earth',
    name: 'Boulderling',
    emoji: '🐢',
    description: 'A steady stone-shell companion who never gives up.',
    stats: { hp: 52, attack: 10, defense: 15, speed: 7 },
  },
  air: {
    element: 'air',
    name: 'Zephyr Kite',
    emoji: '🪁',
    description: 'A breezy sky friend who carries curious minds to new heights.',
    stats: { hp: 40, attack: 11, defense: 9, speed: 16 },
  },
};

const WORD_SLOTS: PartOfSpeech[] = ['verb', 'noun', 'adjective', 'adverb'];

export function createStarterCreature(element: ElementType, words: Word[]): Creature {
  const starter = STARTER_PETS[element];
  const findWord = (partOfSpeech: PartOfSpeech) =>
    words.find((word) => word.element === element && word.partOfSpeech === partOfSpeech)
      || words.find((word) => word.partOfSpeech === partOfSpeech);

  const loadout = {
    verb: findWord('verb')?.id ?? null,
    noun: findWord('noun')?.id ?? null,
    adjective: findWord('adjective')?.id ?? null,
    adverb: findWord('adverb')?.id ?? null,
  };

  return {
    id: `starter-${element}`,
    name: starter.name,
    element,
    elementAffinity: element,
    spriteEmoji: starter.emoji,
    title: `${ELEMENTS[element].name} Companion`,
    description: starter.description,
    stats: { ...starter.stats },
    maxHp: starter.stats.hp,
    currentHp: starter.stats.hp,
    level: 1,
    exp: 0,
    maxExp: 100,
    stage: 1,
    evolvesAtLevel: 10,
    loadout,
    allowedWordTypes: WORD_SLOTS,
    allowedElements: [element],
  };
}
