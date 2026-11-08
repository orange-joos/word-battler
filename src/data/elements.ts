import type { ElementType } from '../types';

export const ELEMENTS: Record<
  ElementType,
  { name: string; icon: string; color: string; stat: 'hp' | 'attack' | 'defense' | 'speed' }
> = {
  fire: { name: 'Fire', icon: '🔥', color: '#f97316', stat: 'attack' },
  water: { name: 'Water', icon: '💧', color: '#0ea5e9', stat: 'defense' },
  ice: { name: 'Ice', icon: '❄️', color: '#38bdf8', stat: 'speed' },
  grass: { name: 'Grass', icon: '🌿', color: '#22c55e', stat: 'hp' },
  electric: { name: 'Electric', icon: '⚡', color: '#eab308', stat: 'speed' },
  shadow: { name: 'Shadow', icon: '🌑', color: '#7c3aed', stat: 'attack' },
  light: { name: 'Light', icon: '✨', color: '#facc15', stat: 'hp' },
  earth: { name: 'Earth', icon: '🪨', color: '#a16207', stat: 'defense' },
  air: { name: 'Air', icon: '🌬️', color: '#38bdf8', stat: 'speed' },
  nature: { name: 'Nature', icon: '🌿', color: '#22c55e', stat: 'hp' },
  cosmic: { name: 'Cosmic', icon: '✨', color: '#a855f7', stat: 'attack' },
};

export const ELEMENT_TYPES = Object.freeze(Object.keys(ELEMENTS) as ElementType[]);

export const OPPOSITE_ELEMENT: Record<ElementType, ElementType> = {
  fire: 'water',
  water: 'electric',
  ice: 'fire',
  grass: 'fire',
  electric: 'earth',
  shadow: 'light',
  light: 'shadow',
  earth: 'grass',
  air: 'ice',
  nature: 'fire',
  cosmic: 'shadow',
};

