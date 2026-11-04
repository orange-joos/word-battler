import type { ElementType } from '../types';

export interface AvatarConfig {
  archetype: 'fox' | 'wolf' | 'lion' | 'owl' | 'panda' | 'drake' | 'steed' | 'dino' | 'sylph';
  emoji: string;
  headgear: 'none' | 'crown' | 'wizard' | 'helm' | 'cap' | 'goggles' | 'garland' | 'headband' | 'horns' | 'halo';
  headgearEmoji: string;
  outfit: 'tunic' | 'armor' | 'robe' | 'cape' | 'coat' | 'vest';
  aura: ElementType;
  title: string;
  favoriteElement: ElementType;
  colorTheme: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  passwordHash?: string;
  avatarConfig: AvatarConfig;
  avatarEmoji: string;
  lexiCoins: number;
  fusionTokens: number;
  streak: number;
  level: number;
  createdAt: string;
  lastLoginAt: string;
}

export const ARCHETYPE_OPTIONS = [
  { id: 'fox', name: 'Emberfox', emoji: '🦊', element: 'fire', desc: 'Swift & cunning flame spirit' },
  { id: 'wolf', name: 'Rimepup', emoji: '🐺', element: 'ice', desc: 'Loyal & sharp frost hunter' },
  { id: 'lion', name: 'River Lion', emoji: '🦁', element: 'water', desc: 'Brave & noble guardian of rushing rivers' },
  { id: 'owl', name: 'Wisdom Owl', emoji: '🦉', element: 'grass', desc: 'Ancient keeper of runes & grammar' },
  { id: 'panda', name: 'Bamboo Brawler', emoji: '🐼', element: 'earth', desc: 'Calm & mighty earth guardian' },
  { id: 'drake', name: 'Spark Drake', emoji: '🐲', element: 'electric', desc: 'Electrifying dragon of momentum' },
  { id: 'steed', name: 'Astral Steed', emoji: '🦄', element: 'light', desc: 'Radiant runner across the night sky' },
  { id: 'dino', name: 'Rex Scholar', emoji: '🦖', element: 'shadow', desc: 'Prehistoric titan of vocabulary' },
  { id: 'sylph', name: 'Zephyr Sprite', emoji: '🧚', element: 'air', desc: 'Nimble spirit riding every breeze' },
] as const;

export const HEADGEAR_OPTIONS = [
  { id: 'none', name: 'Natural / None', emoji: '✖️' },
  { id: 'crown', name: 'Crown of Syntax', emoji: '👑' },
  { id: 'wizard', name: 'Rune Wizard Hat', emoji: '🧙‍♂️' },
  { id: 'helm', name: 'Valor Knight Helm', emoji: '🪖' },
  { id: 'cap', name: 'Explorer Cap', emoji: '🧢' },
  { id: 'goggles', name: 'Forge Goggles', emoji: '🥽' },
  { id: 'garland', name: 'Flora Garland', emoji: '🌸' },
  { id: 'headband', name: 'Focus Headband', emoji: '🥋' },
  { id: 'horns', name: 'Blaze Horns', emoji: '🔥' },
  { id: 'halo', name: 'Stardust Halo', emoji: '✨' },
] as const;

export const OUTFIT_OPTIONS = [
  { id: 'tunic', name: "Adventurer's Tunic", icon: '🥋', desc: 'Light & swift for overworld journeys' },
  { id: 'armor', name: 'Dragonplate Armor', icon: '🛡️', desc: 'Sturdy protection in heated arena duels' },
  { id: 'robe', name: 'Mystic Scholar Robe', icon: '👘', desc: 'Woven with morphology enchantments' },
  { id: 'cape', name: 'Heroic Royal Cape', icon: '🦹', desc: 'Fluttering silk of vocabulary champions' },
  { id: 'coat', name: 'Alchemist Lab Coat', icon: '🥼', desc: 'Stain-resistant for word forge experiments' },
  { id: 'vest', name: 'Field Explorer Vest', icon: '🎽', desc: 'Packed with pockets for word cards' },
] as const;

export const AURA_OPTIONS = [
  { id: 'fire', name: 'Blazing Embers', icon: '🔥', glow: 'from-orange-500/40 via-amber-400/30 to-red-500/40', border: 'border-orange-400' },
  { id: 'water', name: 'River Gleam', icon: '💧', glow: 'from-sky-500/40 via-cyan-400/30 to-blue-500/40', border: 'border-sky-400' },
  { id: 'ice', name: 'Glacial Shards', icon: '❄️', glow: 'from-sky-400/40 via-cyan-300/30 to-blue-500/40', border: 'border-sky-400' },
  { id: 'grass', name: 'Forest Bloom', icon: '🌿', glow: 'from-emerald-400/40 via-lime-300/30 to-green-500/40', border: 'border-emerald-400' },
  { id: 'electric', name: 'Storm Voltage', icon: '⚡', glow: 'from-yellow-400/40 via-amber-300/30 to-violet-500/40', border: 'border-yellow-400' },
  { id: 'shadow', name: 'Quiet Gloom', icon: '🌑', glow: 'from-purple-500/40 via-fuchsia-400/30 to-indigo-500/40', border: 'border-purple-400' },
  { id: 'light', name: 'Golden Radiance', icon: '✨', glow: 'from-yellow-300/50 via-amber-400/40 to-yellow-500/50', border: 'border-amber-400' },
  { id: 'earth', name: 'Stoneheart', icon: '🪨', glow: 'from-amber-700/40 via-orange-400/30 to-yellow-700/40', border: 'border-amber-700' },
  { id: 'air', name: 'Zephyr Breeze', icon: '🌬️', glow: 'from-sky-300/50 via-cyan-200/40 to-blue-400/50', border: 'border-sky-400' },
] as const;

export const TITLE_OPTIONS = [
  'Word Wizard',
  'Grammar Knight',
  'Morphology Master',
  'Root Explorer',
  'Vocabulary Champion',
  'Lexicon Scholar',
  'Syntax Sentinel',
  'Lexi Adventurer',
] as const;

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  archetype: 'fox',
  emoji: '🦊',
  headgear: 'cap',
  headgearEmoji: '🧢',
  outfit: 'tunic',
  aura: 'fire',
  title: 'Word Wizard',
  favoriteElement: 'fire',
  colorTheme: '#f97316',
};
