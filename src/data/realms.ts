import type { ElementType } from '../types.ts';

export interface ElementalAdventureArea {
  zoneId: string;
  order: number;
  name: string;
  element: ElementType;
  gradeBand: string;
  bossId: string;
  bossName: string;
  grammarFocus: string;
  color: string;
}

export interface ZoneBiomePalette {
  title: string;
  subtitle: string;
  skyFrom: string;
  skyTo: string;
  horizonColor: string;
  groundColor: string;
  accentColor: string;
  badge: string;
}

/**
 * Single source of truth for the 9 canonical Elemental Adventure Areas.
 */
export const NINE_ELEMENTAL_AREAS: ElementalAdventureArea[] = [
  {
    zoneId: 'area-grass',
    order: 1,
    name: 'Emerald Grass Glade',
    element: 'grass',
    gradeBand: 'Kindergarten – Grade 1',
    bossId: 'boss_galecrest',
    bossName: 'Galecrest Wyvern',
    grammarFocus: 'Core Nouns & Action Verbs',
    color: '#4caf50',
  },
  {
    zoneId: 'area-water',
    order: 2,
    name: 'Azure Water Lagoon',
    element: 'water',
    gradeBand: 'Grade 1 – Grade 2',
    bossId: 'boss_leviathan',
    bossName: 'Tidal Leviathan',
    grammarFocus: 'Descriptive Adjectives & Shields',
    color: '#0288d1',
  },
  {
    zoneId: 'area-earth',
    order: 3,
    name: 'Sunfall Fossil Canyon',
    element: 'earth',
    gradeBand: 'Grade 2 – Grade 3',
    bossId: 'boss_ruptor',
    bossName: 'Ruptor the Break-Beast',
    grammarFocus: 'Compound Words & Root Foundations',
    color: '#8d6e63',
  },
  {
    zoneId: 'area-fire',
    order: 4,
    name: 'Fireforge Magma Caldera',
    element: 'fire',
    gradeBand: 'Grade 3',
    bossId: 'boss_pyrostorm',
    bossName: 'Pyrostorm Chimera',
    grammarFocus: 'Adverb + Verb Empowered Strikes',
    color: '#e53935',
  },
  {
    zoneId: 'area-ice',
    order: 5,
    name: 'Frostpeak Crystal Glacier',
    element: 'ice',
    gradeBand: 'Grade 3 – Grade 4',
    bossId: 'boss_dishornet',
    bossName: 'Dis-Hornet Swarm',
    grammarFocus: 'Prefixes (un-, re-, pre-, dis-)',
    color: '#00acc1',
  },
  {
    zoneId: 'area-air',
    order: 6,
    name: 'Tempest Sky Spire',
    element: 'air',
    gradeBand: 'Grade 4 – Grade 5',
    bossId: 'boss_zephyrlord',
    bossName: 'Tempest Griffin',
    grammarFocus: 'Suffixes (-ful, -less, -ly, -ness)',
    color: '#26a69a',
  },
  {
    zoneId: 'area-electric',
    order: 7,
    name: 'Volt-Rune Storm Citadel',
    element: 'electric',
    gradeBand: 'Grade 5',
    bossId: 'boss_voltarchon',
    bossName: 'Volt-Rune Dynamo',
    grammarFocus: 'High-Voltage 4-Card Sentence Weaving',
    color: '#ffb300',
  },
  {
    zoneId: 'area-shadow',
    order: 8,
    name: 'Shadowcrypt Golem Ruins',
    element: 'shadow',
    gradeBand: 'Grades 5 – 7 Extender',
    bossId: 'boss_umbralord',
    bossName: 'Umbra Golem Monarch',
    grammarFocus: 'Greek & Latin Morpheme Roots',
    color: '#5e35b1',
  },
  {
    zoneId: 'area-light',
    order: 9,
    name: 'Celestia Radiant Sanctum',
    element: 'light',
    gradeBand: 'Grades 6 – 8 High-Achiever',
    bossId: 'boss_sovereign',
    bossName: 'The Syntax Sovereign',
    grammarFocus: 'Mastery of All 4 Parts of Speech',
    color: '#fbc02d',
  },
];

export const ZONE_TO_BOSS: Record<string, string> = {
  'area-grass': 'boss_galecrest',
  'area-water': 'boss_leviathan',
  'area-earth': 'boss_ruptor',
  'area-fire': 'boss_pyrostorm',
  'area-ice': 'boss_dishornet',
  'area-air': 'boss_zephyrlord',
  'area-electric': 'boss_voltarchon',
  'area-shadow': 'boss_umbralord',
  'area-light': 'boss_sovereign',
  // Legacy & Island aliases
  'root-village': 'boss_ruptor',
  'prefix-path': 'boss_dishornet',
  'prefix-peaks': 'boss_dishornet',
  'suffix-steppes': 'boss_galecrest',
  'sunfall-dunes': 'boss_ruptor',
  'compound-colosseum': 'boss_pyrostorm',
  'fireforge': 'boss_pyrostorm',
  'syntax-spire': 'boss_sovereign',
  'celestia': 'boss_sovereign',
};

export const ZONE_ELEMENT_MAP: Record<string, ElementType> = Object.fromEntries(
  NINE_ELEMENTAL_AREAS.map((area) => [area.zoneId, area.element])
) as Record<string, ElementType>;

export const ZONE_BIOMES: Record<string, ZoneBiomePalette> = {
  'area-grass': {
    title: 'Emerald Grass Glade',
    subtitle: 'Area 1 · Grass Realm (Grades K–1 Roots)',
    skyFrom: '#38bdf8',
    skyTo: '#bae6fd',
    horizonColor: '#0284c7',
    groundColor: '#65d654',
    accentColor: '#228b22',
    badge: '🌿 Grass Area',
  },
  'area-water': {
    title: 'Azure Water Lagoon',
    subtitle: 'Area 2 · Water Realm (Grades 1–2 Verbs & Nouns)',
    skyFrom: '#0284c7',
    skyTo: '#7dd3fc',
    horizonColor: '#0369a1',
    groundColor: '#38bdf8',
    accentColor: '#0284c7',
    badge: '💧 Water Area',
  },
  'area-earth': {
    title: 'Sunfall Fossil Canyon',
    subtitle: 'Area 3 · Earth Realm (Grades 2–3 Compounds)',
    skyFrom: '#f59e0b',
    skyTo: '#fef3c7',
    horizonColor: '#d97706',
    groundColor: '#eab308',
    accentColor: '#a16207',
    badge: '🪨 Earth Area',
  },
  'area-fire': {
    title: 'Fireforge Magma Caldera',
    subtitle: 'Area 4 · Fire Realm (Grades 3–4 Action Matrix)',
    skyFrom: '#7c2d12',
    skyTo: '#fb923c',
    horizonColor: '#9a3412',
    groundColor: '#78716c',
    accentColor: '#ea580c',
    badge: '🔥 Fire Area',
  },
  'area-ice': {
    title: 'Frostpeak Crystal Glacier',
    subtitle: 'Area 5 · Ice Realm (Grades 3–4 Prefixes)',
    skyFrom: '#0369a1',
    skyTo: '#e0f2fe',
    horizonColor: '#0284c7',
    groundColor: '#7dd3fc',
    accentColor: '#0369a1',
    badge: '❄️ Ice Area',
  },
  'area-air': {
    title: 'Tempest Sky Spire',
    subtitle: 'Area 6 · Air Realm (Grades 4–5 Suffixes & Adverbs)',
    skyFrom: '#0d9488',
    skyTo: '#ccfbf1',
    horizonColor: '#0f766e',
    groundColor: '#5eead4',
    accentColor: '#0f766e',
    badge: '🌬️ Air Area',
  },
  'area-electric': {
    title: 'Volt-Rune Storm Citadel',
    subtitle: 'Area 7 · Electric Realm (Grade 5 High-Voltage Syntax)',
    skyFrom: '#1e1b4b',
    skyTo: '#4338ca',
    horizonColor: '#312e81',
    groundColor: '#eab308',
    accentColor: '#ca8a04',
    badge: '⚡ Electric Area',
  },
  'area-shadow': {
    title: 'Shadowcrypt Golem Ruins',
    subtitle: 'Area 8 · Shadow Realm (Grades 5–8 Cryptic Morphemes)',
    skyFrom: '#1e1b4b',
    skyTo: '#581c87',
    horizonColor: '#3b0764',
    groundColor: '#64748b',
    accentColor: '#7e22ce',
    badge: '🌑 Shadow Area',
  },
  'area-light': {
    title: 'Celestia Radiant Sanctum',
    subtitle: 'Area 9 · Light Realm (Grades 6–8 Extender Summit)',
    skyFrom: '#3b0764',
    skyTo: '#a855f7',
    horizonColor: '#6b21a8',
    groundColor: '#fde047',
    accentColor: '#ca8a04',
    badge: '✨ Light Area',
  },
  'root-village': {
    title: 'Harmony Village Meadow',
    subtitle: 'Zone 1 · Root Word Sanctuary',
    skyFrom: '#38bdf8',
    skyTo: '#bae6fd',
    horizonColor: '#0284c7',
    groundColor: '#65d654',
    accentColor: '#15803d',
    badge: '🌿 Meadow Stage',
  },
  'prefix-path': {
    title: 'Frostpeak Glacial Pass',
    subtitle: 'Zone 2 · Prefix Peaks',
    skyFrom: '#0284c7',
    skyTo: '#e0f2fe',
    horizonColor: '#0369a1',
    groundColor: '#bae6fd',
    accentColor: '#0369a1',
    badge: '❄️ Glacier Stage',
  },
  'prefix-peaks': {
    title: 'Frostpeak Glacial Pass',
    subtitle: 'Zone 2 · Prefix Peaks',
    skyFrom: '#0284c7',
    skyTo: '#e0f2fe',
    horizonColor: '#0369a1',
    groundColor: '#bae6fd',
    accentColor: '#0369a1',
    badge: '❄️ Glacier Stage',
  },
  'suffix-steppes': {
    title: 'Sunfall Oasis & Sky Steppes',
    subtitle: 'Zone 3 · Suffix Steppes',
    skyFrom: '#f59e0b',
    skyTo: '#fef3c7',
    horizonColor: '#d97706',
    groundColor: '#fcd34d',
    accentColor: '#b45309',
    badge: '🏜️ Oasis Stage',
  },
  'sunfall-dunes': {
    title: 'Sunfall Fossil Canyon',
    subtitle: 'Zone 3 · Prehistoric Dig & Suffix Steppes',
    skyFrom: '#f59e0b',
    skyTo: '#fef3c7',
    horizonColor: '#d97706',
    groundColor: '#fcd34d',
    accentColor: '#b45309',
    badge: '🦴 Fossil Stage',
  },
  'compound-colosseum': {
    title: 'Fireforge Magma Caldera',
    subtitle: 'Zone 4 · Compound Colosseum',
    skyFrom: '#7c2d12',
    skyTo: '#ea580c',
    horizonColor: '#9a3412',
    groundColor: '#57534e',
    accentColor: '#f97316',
    badge: '🌋 Volcano Stage',
  },
  'syntax-spire': {
    title: 'Celestia Astral Sanctum',
    subtitle: 'Zone 5 · Peak of the Syntax Spire',
    skyFrom: '#3b0764',
    skyTo: '#a855f7',
    horizonColor: '#581c87',
    groundColor: '#fef08a',
    accentColor: '#ca8a04',
    badge: '👑 Astral Stage',
  },
  celestia: {
    title: 'Celestia Astral Sanctum',
    subtitle: 'Zone 5 · Peak of the Syntax Spire',
    skyFrom: '#3b0764',
    skyTo: '#a855f7',
    horizonColor: '#581c87',
    groundColor: '#fef08a',
    accentColor: '#ca8a04',
    badge: '👑 Astral Stage',
  },
};
