import type { ElementType, GradeTier, PartOfSpeech } from '../types.ts';

export type NodeEncounterType = 'combat' | 'quiz' | 'digsite' | 'midboss' | 'chest' | 'boss';

export interface MiniQuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  focusWord: string;
}

export interface DigSiteTabletReward {
  id: string;
  word: string;
  partOfSpeech: PartOfSpeech;
  element: ElementType;
  gradeTier: GradeTier;
  powerBonus: number;
  definition: string;
  example: string;
  morphologyNote: string;
}

export interface AdventureStageNode {
  nodeId: string; // e.g., '1-1' .. '9-10'
  stageNumber: number; // 1 .. 10
  code: string; // '1-1'
  title: string;
  subtitle: string;
  type: NodeEncounterType;
  xPct: number; // Horizontal position (18..82) along the winding S-curve
  yPct: number; // Vertical position (8..92) from bottom (stage 1) to top (stage 10)
  enemyId?: string;
  enemyName?: string;
  enemyLevel?: number;
  rewardCoins: number;
  rewardGems: number;
  quizQuestions?: MiniQuizQuestion[];
  digSiteTablet?: DigSiteTabletReward;
}

export interface ElementalBiomeTheme {
  zoneId: string;
  order: number;
  name: string;
  shortName: string;
  element: ElementType;
  gradeBand: string;
  grammarFocus: string;
  bossId: string;
  bossName: string;
  midBossId: string;
  midBossName: string;
  vanguardId: string;
  vanguardName: string;
  // Visual Palette inspired by Reference #1 & Reference #2
  bgGradientFrom: string;
  bgGradientVia: string;
  bgGradientTo: string;
  roadStrokeColor: string;
  roadBorderColor: string;
  steppingStoneColor: string;
  steppingStoneBorder: string;
  nodeBtnTop: string;
  nodeBtnBottom: string;
  nodeBtnRing: string;
  accentPropType:
    | 'meadow'
    | 'lagoon'
    | 'canyon'
    | 'caldera'
    | 'glacier'
    | 'skyspire'
    | 'storm'
    | 'twilight'
    | 'solar';
  nodes: AdventureStageNode[];
}

// S-Curve coordinates from bottom (Stage 1 at y=90%) winding up to top (Stage 10 at y=9%)
const S_CURVE_COORDS: { xPct: number; yPct: number }[] = [
  { xPct: 48, yPct: 91 }, // X-1: Starting Spiral Threshold
  { xPct: 72, yPct: 82 }, // X-2: Right Bend
  { xPct: 34, yPct: 73 }, // X-3: Left Bend
  { xPct: 24, yPct: 63 }, // X-4: Fossil Excavation Dig Site Outcrop
  { xPct: 52, yPct: 54 }, // X-5: Central Ammonite Spiral Mid-Boss Gate
  { xPct: 76, yPct: 45 }, // X-6: Upper-Right Ridge
  { xPct: 62, yPct: 35 }, // X-7: Bridge Crossing
  { xPct: 26, yPct: 27 }, // X-8: Supply Chest Overlook
  { xPct: 36, yPct: 17 }, // X-9: Pre-Summit Gauntlet
  { xPct: 56, yPct: 8 },  // X-10: Realm Guardian Summit
];

interface ZoneSeed {
  zoneId: string;
  order: number;
  name: string;
  shortName: string;
  element: ElementType;
  gradeBand: string;
  gradeTier: GradeTier;
  grammarFocus: string;
  bossId: string;
  bossName: string;
  midBossId: string;
  midBossName: string;
  vanguardId: string;
  vanguardName: string;
  bgGradientFrom: string;
  bgGradientVia: string;
  bgGradientTo: string;
  roadStrokeColor: string;
  roadBorderColor: string;
  steppingStoneColor: string;
  steppingStoneBorder: string;
  nodeBtnTop: string;
  nodeBtnBottom: string;
  nodeBtnRing: string;
  accentPropType: ElementalBiomeTheme['accentPropType'];
  digTablet: DigSiteTabletReward;
  quizzes: [MiniQuizQuestion[], MiniQuizQuestion[], MiniQuizQuestion[]];
}

const ZONE_SEEDS: ZoneSeed[] = [
  {
    zoneId: 'area-grass',
    order: 1,
    name: 'Emerald Grass Glade',
    shortName: '1. Grass Glade',
    element: 'grass',
    gradeBand: 'Kindergarten – Grade 1',
    gradeTier: 'K',
    grammarFocus: 'Core Nouns & Action Verbs',
    bossId: 'boss_galecrest',
    bossName: 'Galecrest Wyvern',
    midBossId: 'sproutling',
    midBossName: 'Brambleback Alpha',
    vanguardId: 'mossling',
    vanguardName: 'Meadow Mossling',
    // Matches Reference #2 Left Panel (Lime-Green Meadow + Warm Sandy Trail + Amber-Gold Buttons)
    bgGradientFrom: '#84cc16',
    bgGradientVia: '#65d654',
    bgGradientTo: '#4d7c0f',
    roadStrokeColor: '#f6ad55',
    roadBorderColor: '#dd6b20',
    steppingStoneColor: '#fbd38d',
    steppingStoneBorder: '#9c4221',
    nodeBtnTop: '#fbbf24',
    nodeBtnBottom: '#d97706',
    nodeBtnRing: '#78350f',
    accentPropType: 'meadow',
    digTablet: {
      id: 'tablet_sprout_1',
      word: 'flourish',
      partOfSpeech: 'verb',
      element: 'grass',
      gradeTier: '1',
      powerBonus: 5,
      definition: 'To grow strong, healthy, and leafy in a sunny habitat.',
      example: 'Wild ferns flourish along the emerald meadow stream.',
      morphologyNote: 'Action Verb: Powers a direct botanical strike in combat!',
    },
    quizzes: [
      [
        {
          prompt: 'Which word is an ACTION VERB that a Grass companion can do?',
          options: ['sprout', 'green', 'meadow', 'softly'],
          correctIndex: 0,
          explanation: '"Sprout" is an action verb showing what a plant or seed does!',
          focusWord: 'sprout',
        },
        {
          prompt: 'Which word is a NOUN (a person, place, or thing)?',
          options: ['forest', 'swiftly', 'leap', 'bright'],
          correctIndex: 0,
          explanation: '"Forest" is a noun because it names a place full of trees.',
          focusWord: 'forest',
        },
        {
          prompt: 'Combine an Adjective + Noun to build a shield: "______ vine"',
          options: ['sturdy', 'run', 'quickly', 'jump'],
          correctIndex: 0,
          explanation: '"Sturdy" is an adjective that describes the noun "vine"!',
          focusWord: 'sturdy',
        },
      ],
      [
        {
          prompt: 'What part of speech is the word "blossom" in "The bright blossom opened"?',
          options: ['Noun', 'Adverb', 'Prefix', 'Pronoun'],
          correctIndex: 0,
          explanation: 'Here "blossom" names a thing (a flower), making it a Noun.',
          focusWord: 'blossom',
        },
        {
          prompt: 'Pick the word that means "a thick, shady group of trees":',
          options: ['grove', 'pebble', 'spark', 'icicle'],
          correctIndex: 0,
          explanation: 'A "grove" is a group of trees growing close together.',
          focusWord: 'grove',
        },
        {
          prompt: 'Which pair forms a valid 2-Word Action Strike (Adverb + Verb)?',
          options: ['boldly charge', 'tall tree', 'green leaf', 'soft moss'],
          correctIndex: 0,
          explanation: '"Boldly" (adverb) + "charge" (verb) powers an Adverb+Verb strike!',
          focusWord: 'charge',
        },
      ],
      [
        {
          prompt: 'Complete the 4-Word Ultimate Sentence: "Mighty roots ______ deeply."',
          options: ['anchor', 'leafy', 'acorn', 'smooth'],
          correctIndex: 0,
          explanation: 'Every complete sentence needs a Verb! "Anchor" completes Adj + Noun + Verb + Adv.',
          focusWord: 'anchor',
        },
        {
          prompt: 'Which word describes HOW an action happens (Adverb)?',
          options: ['wildly', 'branch', 'thorn', 'mossy'],
          correctIndex: 0,
          explanation: 'Words ending in "-ly" like "wildly" tell how an action is performed.',
          focusWord: 'wildly',
        },
        {
          prompt: 'Galecrest Wyvern is a Grass boss. Which element is Grass strongest against?',
          options: ['Water & Earth', 'Fire', 'Ice', 'Shadow'],
          correctIndex: 0,
          explanation: 'Grass roots absorb Water and split Earth stone!',
          focusWord: 'roots',
        },
      ],
    ],
  },
  {
    zoneId: 'area-water',
    order: 2,
    name: 'Azure Water Lagoon',
    shortName: '2. Water Lagoon',
    element: 'water',
    gradeBand: 'Grade 1 – Grade 2',
    gradeTier: '1',
    grammarFocus: 'Descriptive Adjectives & Tidal Shields',
    bossId: 'boss_leviathan',
    bossName: 'Tidal Leviathan',
    midBossId: 'aquafin',
    midBossName: 'Coralback Guardian',
    vanguardId: 'tidepup',
    vanguardName: 'Lagoon Tidepup',
    bgGradientFrom: '#38bdf8',
    bgGradientVia: '#0ea5e9',
    bgGradientTo: '#0369a1',
    roadStrokeColor: '#fde68a',
    roadBorderColor: '#d97706',
    steppingStoneColor: '#fef3c7',
    steppingStoneBorder: '#b45309',
    nodeBtnTop: '#38bdf8',
    nodeBtnBottom: '#0284c7',
    nodeBtnRing: '#0c4a6e',
    accentPropType: 'lagoon',
    digTablet: {
      id: 'tablet_cascade_2',
      word: 'cascade',
      partOfSpeech: 'verb',
      element: 'water',
      gradeTier: '2',
      powerBonus: 6,
      definition: 'To pour downward rapidly in a rushing waterfall.',
      example: 'Crystal waves cascade over the limestone reef.',
      morphologyNote: 'Water Action Tablet: Deals bonus splash damage against Fire foes!',
    },
    quizzes: [
      [
        {
          prompt: 'Which word is a descriptive ADJECTIVE for ocean water?',
          options: ['shimmering', 'swim', 'dolphin', 'splash'],
          correctIndex: 0,
          explanation: '"Shimmering" describes how the water looks, so it is an Adjective.',
          focusWord: 'shimmering',
        },
        {
          prompt: 'What does the word "current" mean in a river or ocean?',
          options: ['A steady flow of water', 'A dry desert rock', 'A mountain peak', 'A tree branch'],
          correctIndex: 0,
          explanation: 'An ocean or river current is water moving steadily in one direction.',
          focusWord: 'current',
        },
        {
          prompt: 'Which combination builds a Barrier Shield in battle?',
          options: ['Adjective + Noun', 'Verb + Verb', 'Adverb + Adverb', 'Noun + Verb'],
          correctIndex: 0,
          explanation: 'Pairing an Adjective + Noun (like "Crystal Shell") fortifies your shield!',
          focusWord: 'crystal',
        },
      ],
      [
        {
          prompt: 'Choose the best adjective to complete: "The ______ wave crashed ashore."',
          options: ['colossal', 'dive', 'quickly', 'harbor'],
          correctIndex: 0,
          explanation: '"Colossal" means huge or giant—an adjective describing the noun "wave".',
          focusWord: 'colossal',
        },
        {
          prompt: 'Which word is the opposite (antonym) of "shallow"?',
          options: ['deep', 'warm', 'calm', 'salty'],
          correctIndex: 0,
          explanation: '"Deep" is the opposite of "shallow".',
          focusWord: 'deep',
        },
        {
          prompt: 'Which action verb means "to go underwater"?',
          options: ['submerge', 'float', 'bask', 'soar'],
          correctIndex: 0,
          explanation: '"Submerge" means to descend below the surface of the water.',
          focusWord: 'submerge',
        },
      ],
      [
        {
          prompt: 'Identify the ADVERB in: "The sea turtle glided gracefully."',
          options: ['gracefully', 'turtle', 'glided', 'sea'],
          correctIndex: 0,
          explanation: '"Gracefully" tells HOW the turtle glided.',
          focusWord: 'gracefully',
        },
        {
          prompt: 'What does "aquatic" mean?',
          options: ['Living or growing in water', 'Made of hot lava', 'Flying in the clouds', 'Buried in sand'],
          correctIndex: 0,
          explanation: '"Aqua-" comes from the root for water, so aquatic means living in water.',
          focusWord: 'aquatic',
        },
        {
          prompt: 'Which 2-word combo triggers an Empowered Water Strike?',
          options: ['swiftly deluge', 'blue coral', 'calm lagoon', 'deep shell'],
          correctIndex: 0,
          explanation: '"Swiftly" (Adverb) + "deluge" (Verb) triggers an Empowered Strike!',
          focusWord: 'deluge',
        },
      ],
    ],
  },
  {
    zoneId: 'area-earth',
    order: 3,
    name: 'Sunfall Fossil Canyon',
    shortName: '3. Earth Canyon',
    element: 'earth',
    gradeBand: 'Grade 2 – Grade 3',
    gradeTier: '2',
    grammarFocus: 'Compound Words & Root Foundations',
    bossId: 'boss_ruptor',
    bossName: 'Ruptor the Break-Beast',
    midBossId: 'terrathorn',
    midBossName: 'Ankylos Rock-Crusher',
    vanguardId: 'pebblepup',
    vanguardName: 'Canyon Pebblepup',
    // Matches Reference #1 Middle Section (Autumnal Harvest Orange/Gold Canyon + Brown Cobblestones)
    bgGradientFrom: '#f59e0b',
    bgGradientVia: '#d97706',
    bgGradientTo: '#92400e',
    roadStrokeColor: '#9c4221',
    roadBorderColor: '#451a03',
    steppingStoneColor: '#b45309',
    steppingStoneBorder: '#451a03',
    nodeBtnTop: '#fb923c',
    nodeBtnBottom: '#c2410c',
    nodeBtnRing: '#431407',
    accentPropType: 'canyon',
    digTablet: {
      id: 'tablet_earthquake_3',
      word: 'bedrock',
      partOfSpeech: 'noun',
      element: 'earth',
      gradeTier: '3',
      powerBonus: 7,
      definition: 'Solid, unbroken rock lying beneath loose soil and canyon sand.',
      example: 'The fossilized dinosaur ribs were preserved in ancient bedrock.',
      morphologyNote: 'Compound Noun (bed + rock): Grants massive fortification shields!',
    },
    quizzes: [
      [
        {
          prompt: 'Which word is a COMPOUND WORD made of two smaller words?',
          options: ['sandstone', 'canyon', 'boulder', 'pebble'],
          correctIndex: 0,
          explanation: '"Sand" + "stone" join together to form the compound word "sandstone"!',
          focusWord: 'sandstone',
        },
        {
          prompt: 'Combine "earth" + "quake" to name a shaking of the ground:',
          options: ['earthquake', 'earthshake', 'quakerock', 'groundfall'],
          correctIndex: 0,
          explanation: '"Earthquake" is a compound noun made from earth + quake.',
          focusWord: 'earthquake',
        },
        {
          prompt: 'What does a paleontologist excavate at a canyon dig site?',
          options: ['Ancient fossils', 'Rain clouds', 'Ocean waves', 'Lightning bolts'],
          correctIndex: 0,
          explanation: 'Fossils are preserved remains or traces of ancient creatures in rock!',
          focusWord: 'fossil',
        },
      ],
      [
        {
          prompt: 'What does the Latin root "rupt" (as in Ruptor or erupt) mean?',
          options: ['To break or burst', 'To sleep quietly', 'To freeze solid', 'To Whisper'],
          correctIndex: 0,
          explanation: 'The root "rupt" means to break or burst through rock!',
          focusWord: 'erupt',
        },
        {
          prompt: 'Which compound word means "a slide of rocks and earth down a cliff"?',
          options: ['landslide', 'waterfall', 'sunshine', 'windmilling'],
          correctIndex: 0,
          explanation: '"Land" + "slide" = landslide!',
          focusWord: 'landslide',
        },
        {
          prompt: 'Pick the adjective that best describes heavy canyon granite:',
          options: ['unbreakable', 'feathery', 'liquid', 'breezy'],
          correctIndex: 0,
          explanation: '"Unbreakable" (un + break + able) describes tough canyon stone.',
          focusWord: 'unbreakable',
        },
      ],
      [
        {
          prompt: 'What does the root "terra" mean in words like "terrain" and "terracotta"?',
          options: ['Earth or land', 'Sky or air', 'Deep ocean', 'Starlight'],
          correctIndex: 0,
          explanation: '"Terra" is the Latin root for earth or land!',
          focusWord: 'terrain',
        },
        {
          prompt: 'Break the compound word "foothills" into its two root words:',
          options: ['foot + hills', 'foo + thills', 'footh + ills', 'for + hills'],
          correctIndex: 0,
          explanation: 'Foothills are the low hills at the foot (base) of a mountain range.',
          focusWord: 'foothills',
        },
        {
          prompt: 'Which sentence uses all 4 parts of speech (Adj + Noun + Verb + Adv)?',
          options: [
            'Colossal boulders rumble loudly.',
            'Big rocks and sand.',
            'Quickly run down.',
            'The canyon is very red.',
          ],
          correctIndex: 0,
          explanation: 'Colossal (Adj) + boulders (Noun) + rumble (Verb) + loudly (Adv)!',
          focusWord: 'boulders',
        },
      ],
    ],
  },
  {
    zoneId: 'area-fire',
    order: 4,
    name: 'Fireforge Magma Caldera',
    shortName: '4. Fire Caldera',
    element: 'fire',
    gradeBand: 'Grade 3',
    gradeTier: '3',
    grammarFocus: 'Adverb + Verb Empowered Word Strikes',
    bossId: 'boss_pyrostorm',
    bossName: 'Pyrostorm Chimera',
    midBossId: 'emberfox',
    midBossName: 'Cinderclaw Drake',
    vanguardId: 'sparkkit',
    vanguardName: 'Caldera Sparkkit',
    bgGradientFrom: '#7c2d12',
    bgGradientVia: '#9a3412',
    bgGradientTo: '#431407',
    roadStrokeColor: '#f97316',
    roadBorderColor: '#451a03',
    steppingStoneColor: '#57534e',
    steppingStoneBorder: '#ea580c',
    nodeBtnTop: '#f43f5e',
    nodeBtnBottom: '#be123c',
    nodeBtnRing: '#4c0519',
    accentPropType: 'caldera',
    digTablet: {
      id: 'tablet_incinerate_4',
      word: 'combust',
      partOfSpeech: 'verb',
      element: 'fire',
      gradeTier: '3',
      powerBonus: 8,
      definition: 'To catch fire and burst into high-energy flames.',
      example: 'Dry volcanic timber can combust near a magma vent.',
      morphologyNote: 'High-Heat Verb Tablet: Combines with Adverbs for 1.5x Strike Power!',
    },
    quizzes: [
      [
        {
          prompt: 'How do you turn the adjective "fierce" into an ADVERB?',
          options: ['Add -ly to make "fiercely"', 'Add un- to make "unfierce"', 'Add -s', 'Add -ing'],
          correctIndex: 0,
          explanation: 'Adding the suffix "-ly" turns an adjective ("fierce") into an adverb ("fiercely")!',
          focusWord: 'fiercely',
        },
        {
          prompt: 'Which word is a vivid synonym for "burn" or "set on fire"?',
          options: ['ignite', 'freeze', 'whisper', 'dampen'],
          correctIndex: 0,
          explanation: '"Ignite" is a strong Grade 3 action verb meaning to catch fire.',
          focusWord: 'ignite',
        },
        {
          prompt: 'What does "molten" rock (magma) mean?',
          options: ['Melted into liquid by intense heat', 'Frozen into solid ice', 'Covered in green moss', 'Carved by wind'],
          correctIndex: 0,
          explanation: '"Molten" describes rock or metal liquefied by extreme heat.',
          focusWord: 'molten',
        },
      ],
      [
        {
          prompt: 'Pick the strongest Adverb + Verb combo for a Fire Word Strike:',
          options: ['intensely blaze', 'red ember', 'hot volcano', 'warm ash'],
          correctIndex: 0,
          explanation: '"Intensely" (Adverb) + "blaze" (Verb) forms an Empowered Word Strike!',
          focusWord: 'blaze',
        },
        {
          prompt: 'What happens when you add the prefix "re-" to "ignite" ("reignite")?',
          options: ['It means to ignite again', 'It means not ignited', 'It means before igniting', 'It means without fire'],
          correctIndex: 0,
          explanation: 'The prefix "re-" means "again"!',
          focusWord: 'reignite',
        },
        {
          prompt: 'Which noun names the bowl-shaped crater at the top of a volcano?',
          options: ['caldera', 'glacier', 'meadow', 'lagoon'],
          correctIndex: 0,
          explanation: 'A "caldera" is a large volcanic crater formed by magma eruptions.',
          focusWord: 'caldera',
        },
      ],
      [
        {
          prompt: 'What does the Greek root "pyro" (as in Pyrostorm) mean?',
          options: ['Fire or heat', 'Deep water', 'Cold ice', 'Dark shadow'],
          correctIndex: 0,
          explanation: '"Pyro" comes from the Greek word for fire!',
          focusWord: 'pyro',
        },
        {
          prompt: 'Choose the adjective that means "glowing white or red with intense heat":',
          options: ['incandescent', 'subzero', 'shady', 'breezy'],
          correctIndex: 0,
          explanation: '"Incandescent" means emitting bright light as a result of being heated.',
          focusWord: 'incandescent',
        },
        {
          prompt: 'Pyrostorm Chimera is weak to which opposite elemental affinity?',
          options: ['Water / Ice', 'Grass', 'Air', 'Light'],
          correctIndex: 0,
          explanation: 'Water and Ice douse volcanic Fire!',
          focusWord: 'quench',
        },
      ],
    ],
  },
  {
    zoneId: 'area-ice',
    order: 5,
    name: 'Frostpeak Crystal Glacier',
    shortName: '5. Ice Glacier',
    element: 'ice',
    gradeBand: 'Grade 3 – Grade 4',
    gradeTier: '4',
    grammarFocus: 'Prefixes (un-, re-, pre-, dis-, sub-)',
    bossId: 'boss_dishornet',
    bossName: 'Dis-Hornet Swarm',
    midBossId: 'frostfang',
    midBossName: 'Cryo-Saber Wolf',
    vanguardId: 'glaciowl',
    vanguardName: 'Snowcrest Owlet',
    // Matches Reference #2 Right Panel (Sparkling Snowfield + Icy Blue Trail + Crimson-Orange Buttons)
    bgGradientFrom: '#e0f2fe',
    bgGradientVia: '#bae6fd',
    bgGradientTo: '#7dd3fc',
    roadStrokeColor: '#93c5fd',
    roadBorderColor: '#0284c7',
    steppingStoneColor: '#e0f2fe',
    steppingStoneBorder: '#0369a1',
    nodeBtnTop: '#f97316',
    nodeBtnBottom: '#c2410c',
    nodeBtnRing: '#7c2d12',
    accentPropType: 'glacier',
    digTablet: {
      id: 'tablet_permafrost_5',
      word: 'permafrost',
      partOfSpeech: 'noun',
      element: 'ice',
      gradeTier: '4',
      powerBonus: 9,
      definition: 'A thick subsurface layer of soil that remains frozen throughout the year.',
      example: 'Woolly mammoth tusks were unearthed from the arctic permafrost.',
      morphologyNote: 'Prefix "perma-" (permanent) + "frost": Unlocks glacial armor!',
    },
    quizzes: [
      [
        {
          prompt: 'What does the prefix "sub-" mean in "subzero temperatures"?',
          options: ['Under or below', 'Above or over', 'After or later', 'Twice as much'],
          correctIndex: 0,
          explanation: '"Sub-" means under or below—so "subzero" means below zero degrees!',
          focusWord: 'subzero',
        },
        {
          prompt: 'Add a prefix to "frozen" to mean "NOT frozen":',
          options: ['unfrozen', 'refrozen', 'prefrozen', 'fullfrozen'],
          correctIndex: 0,
          explanation: 'The prefix "un-" means "not" or the opposite of!',
          focusWord: 'unfrozen',
        },
        {
          prompt: 'What does the prefix "dis-" (as in Dis-Hornet or disappear) do to a root word?',
          options: ['Gives it the opposite or negative meaning', 'Makes it plural', 'Turns it into a noun', 'Makes it past tense'],
          correctIndex: 0,
          explanation: '"Dis-" means "not" or "away", reversing the action of the root word.',
          focusWord: 'disappear',
        },
      ],
      [
        {
          prompt: 'If a glacier "refreezes", what happened?',
          options: ['It froze again', 'It never froze', 'It melted forever', 'It froze before winter'],
          correctIndex: 0,
          explanation: '"Re-" means "again", so "refreeze" means to freeze again!',
          focusWord: 'refreeze',
        },
        {
          prompt: 'What does "prehistoric" (pre + historic) mean when describing an Ice Age fossil?',
          options: ['Before written history', 'After modern history', 'Against history', 'Without any rocks'],
          correctIndex: 0,
          explanation: 'The prefix "pre-" means "before"!',
          focusWord: 'prehistoric',
        },
        {
          prompt: 'Which word means "to Crystallize into solid ice"?',
          options: ['crystallize', 'evaporate', 'scorch', 'wilt'],
          correctIndex: 0,
          explanation: '"Crystallize" means to form into geometric ice or mineral crystals.',
          focusWord: 'crystallize',
        },
      ],
      [
        {
          prompt: 'When attaching a prefix like "un-", "dis-", or "re-" to a root word, how does the root spelling change?',
          options: ['The root word spelling stays exactly the same!', 'Drop the last vowel', 'Double every consonant', 'Reverse the letters'],
          correctIndex: 0,
          explanation: 'Prefixes attach cleanly to the front without changing the root word spelling!',
          focusWord: 'unshaken',
        },
        {
          prompt: 'What does the Greek root "cryo" mean?',
          options: ['Icy cold or frost', 'Bright flame', 'Loud thunder', 'Dense forest'],
          correctIndex: 0,
          explanation: '"Cryo" means icy cold or frost!',
          focusWord: 'cryogenic',
        },
        {
          prompt: 'Choose the complete 4-word sentence with a prefixed adjective:',
          options: [
            'Unbroken glaciers glisten brightly.',
            'Ice snow cold wind.',
            'Quickly slide down.',
            'Very cold winter.',
          ],
          correctIndex: 0,
          explanation: 'Unbroken (Adj) + glaciers (Noun) + glisten (Verb) + brightly (Adv)!',
          focusWord: 'unbroken',
        },
      ],
    ],
  },
  {
    zoneId: 'area-air',
    order: 6,
    name: 'Tempest Sky Spire',
    shortName: '6. Air Spire',
    element: 'air',
    gradeBand: 'Grade 4 – Grade 5',
    gradeTier: '4',
    grammarFocus: 'Suffixes (-ful, -less, -ly, -ness, -able)',
    bossId: 'boss_zephyrlord',
    bossName: 'Tempest Griffin',
    midBossId: 'zephyrbird',
    midBossName: 'Galewing Falcon',
    vanguardId: 'breezekit',
    vanguardName: 'Cloudtop Breezekit',
    bgGradientFrom: '#5eead4',
    bgGradientVia: '#2dd4bf',
    bgGradientTo: '#0d9488',
    roadStrokeColor: '#fef3c7',
    roadBorderColor: '#0f766e',
    steppingStoneColor: '#ffffff',
    steppingStoneBorder: '#0d9488',
    nodeBtnTop: '#14b8a6',
    nodeBtnBottom: '#0f766e',
    nodeBtnRing: '#134e4a',
    accentPropType: 'skyspire',
    digTablet: {
      id: 'tablet_turbulence_6',
      word: 'weightless',
      partOfSpeech: 'adjective',
      element: 'air',
      gradeTier: '4',
      powerBonus: 9,
      definition: 'Having no weight; floating freely like a cloud in the upper atmosphere.',
      example: 'Floating sky-stones appear weightless above the Tempest Spire.',
      morphologyNote: 'Root "weight" + Suffix "-less" (without): Boosts evasion & speed!',
    },
    quizzes: [
      [
        {
          prompt: 'What does the suffix "-less" mean in "weightless" and "cloudless"?',
          options: ['Without', 'Full of', 'Able to be', 'In the past'],
          correctIndex: 0,
          explanation: 'The suffix "-less" means "without" (cloudless = without clouds)!',
          focusWord: 'cloudless',
        },
        {
          prompt: 'What does the suffix "-ful" mean in "powerful" and "graceful"?',
          options: ['Full of or having', 'Without any', 'Before', 'Underneath'],
          correctIndex: 0,
          explanation: 'The suffix "-ful" means "full of" (powerful = full of power)!',
          focusWord: 'powerful',
        },
        {
          prompt: 'How do you spell "happy" + "-ness" using the Y-to-I spelling rule?',
          options: ['happiness', 'happyness', 'happines', 'hapiness'],
          correctIndex: 0,
          explanation: 'When a word ends in consonant + Y, change Y to I before adding "-ness"!',
          focusWord: 'happiness',
        },
      ],
      [
        {
          prompt: 'What part of speech does a word usually become when you add "-ness" (like "swiftness")?',
          options: ['Noun', 'Verb', 'Adverb', 'Preposition'],
          correctIndex: 0,
          explanation: 'The suffix "-ness" turns an adjective ("swift") into a Noun ("swiftness")!',
          focusWord: 'swiftness',
        },
        {
          prompt: 'What does a "zephyr" mean?',
          options: ['A gentle, mild breeze', 'A volcanic eruption', 'A deep ocean trench', 'A heavy boulder'],
          correctIndex: 0,
          explanation: 'A "zephyr" is a soft, gentle west wind.',
          focusWord: 'zephyr',
        },
        {
          prompt: 'Apply the Drop-Silent-E rule: "believe" + "-able" =',
          options: ['believable', 'believeable', 'believible', 'belivable'],
          correctIndex: 0,
          explanation: 'Drop the silent E at the end of "believe" before adding a vowel suffix like "-able"!',
          focusWord: 'believable',
        },
      ],
      [
        {
          prompt: 'Which word contains BOTH a prefix and a suffix?',
          options: ['unpredictable', 'whirlwind', 'breezy', 'gust'],
          correctIndex: 0,
          explanation: '"Un-" (prefix) + "predict" (root) + "-able" (suffix) = unpredictable!',
          focusWord: 'unpredictable',
        },
        {
          prompt: 'What does "ascend" mean when riding an updraft at the Sky Spire?',
          options: ['To rise or climb upward', 'To sink to the bottom', 'To sleep in a cave', 'To crumble into dust'],
          correctIndex: 0,
          explanation: '"Ascend" means to go up or climb higher into the sky.',
          focusWord: 'ascend',
        },
        {
          prompt: 'Which Adverb + Verb combo launches a high-speed Air Strike?',
          options: ['effortlessly soar', 'calm cloud', 'tall spire', 'white feather'],
          correctIndex: 0,
          explanation: '"Effortlessly" (Adverb) + "soar" (Verb) unleashes an Empowered Air Strike!',
          focusWord: 'soar',
        },
      ],
    ],
  },
  {
    zoneId: 'area-electric',
    order: 7,
    name: 'Volt-Rune Storm Citadel',
    shortName: '7. Electric Citadel',
    element: 'electric',
    gradeBand: 'Grade 5',
    gradeTier: '5',
    grammarFocus: 'High-Voltage 4-Card Sentence Weaving',
    bossId: 'boss_voltarchon',
    bossName: 'Volt-Rune Dynamo',
    midBossId: 'voltlynx',
    midBossName: 'Thunderclaw Lynx',
    vanguardId: 'zapling',
    vanguardName: 'Static Zapling',
    bgGradientFrom: '#312e81',
    bgGradientVia: '#1e1b4b',
    bgGradientTo: '#0f172a',
    roadStrokeColor: '#facc15',
    roadBorderColor: '#a16207',
    steppingStoneColor: '#fde047',
    steppingStoneBorder: '#ca8a04',
    nodeBtnTop: '#facc15',
    nodeBtnBottom: '#ca8a04',
    nodeBtnRing: '#422006',
    accentPropType: 'storm',
    digTablet: {
      id: 'tablet_galvanize_7',
      word: 'galvanize',
      partOfSpeech: 'verb',
      element: 'electric',
      gradeTier: '5',
      powerBonus: 10,
      definition: 'To shock or excite into sudden, high-energy action.',
      example: 'A flash of lightning galvanized the storm guardians into action.',
      morphologyNote: 'Grade 5 Precision Verb Tablet: Supercharges 4-Word Combos!',
    },
    quizzes: [
      [
        {
          prompt: 'What is the multiplier bonus for weaving a full 4-Word Sentence (Adj + Noun + Verb + Adv)?',
          options: ['2.0x Ultimate Sentence Multiplier!', '0.5x Penalty', 'No bonus', 'Only heals the enemy'],
          correctIndex: 0,
          explanation: 'Linking all 4 parts of speech in grammatical order unleashes a 2.0x Ultimate Strike!',
          focusWord: 'voltage',
        },
        {
          prompt: 'In "Radiant lightning illuminates instantly", which word is the NOUN?',
          options: ['lightning', 'radiant', 'illuminates', 'instantly'],
          correctIndex: 0,
          explanation: '"Lightning" is the subject noun performing the action "illuminates".',
          focusWord: 'lightning',
        },
        {
          prompt: 'What does "kinetic" energy mean?',
          options: ['Energy of motion and movement', 'Sleeping underground', 'Frozen ice crystals', 'Silent darkness'],
          correctIndex: 0,
          explanation: '"Kinetic" comes from the Greek word for motion!',
          focusWord: 'kinetic',
        },
      ],
      [
        {
          prompt: 'In "Charged dynamos hummed continuously", which word is the ADJECTIVE?',
          options: ['Charged', 'dynamos', 'hummed', 'continuously'],
          correctIndex: 0,
          explanation: '"Charged" modifies the noun "dynamos", making it an Adjective.',
          focusWord: 'charged',
        },
        {
          prompt: 'What does the word "conduit" mean in the Storm Citadel?',
          options: ['A channel or pipe that carries electric current or water', 'A broken wooden wheel', 'A sleepy forest', 'A soft pillow'],
          correctIndex: 0,
          explanation: 'A "conduit" conducts or channels energy from one place to another.',
          focusWord: 'conduit',
        },
        {
          prompt: 'Which word means "happening at the exact same time"?',
          options: ['simultaneous', 'ancient', 'gradual', 'invisible'],
          correctIndex: 0,
          explanation: '"Simultaneous" describes two events occurring at the exact same moment.',
          focusWord: 'simultaneous',
        },
      ],
      [
        {
          prompt: 'Arrange these 4 Word Tablets into Adj + Noun + Verb + Adv order:',
          options: [
            'Blinding thunderbolts strike relentlessly.',
            'Strike relentlessly thunderbolts blinding.',
            'Thunderbolts blinding relentlessly strike.',
            'Relentlessly blinding strike thunderbolts.',
          ],
          correctIndex: 0,
          explanation: 'Blinding (Adj) + thunderbolts (Noun) + strike (Verb) + relentlessly (Adv)!',
          focusWord: 'relentlessly',
        },
        {
          prompt: 'What does the Latin root "lum / luc" (as in luminous) mean?',
          options: ['Light or shine', 'Heavy rock', 'Deep shadow', 'Bitter cold'],
          correctIndex: 0,
          explanation: '"Lum" means light—so "luminous" means radiating bright light!',
          focusWord: 'luminous',
        },
        {
          prompt: 'Which element resists Electric strikes by grounding the current?',
          options: ['Earth', 'Water', 'Air', 'Ice'],
          correctIndex: 0,
          explanation: 'Earth grounds electrical current, making Earth the natural counter to Electric!',
          focusWord: 'ground',
        },
      ],
    ],
  },
  {
    zoneId: 'area-shadow',
    order: 8,
    name: 'Shadowcrypt Golem Ruins',
    shortName: '8. Shadow Ruins',
    element: 'shadow',
    gradeBand: 'Grades 5 – 7 Extender',
    gradeTier: 'extender',
    grammarFocus: 'Greek & Latin Morpheme Roots',
    bossId: 'boss_umbralord',
    bossName: 'Umbra Golem Monarch',
    midBossId: 'umbrawolf',
    midBossName: 'Obsidian Gargoyle',
    vanguardId: 'shadelit',
    vanguardName: 'Twilight Shadelit',
    // Matches Reference #1 Top Section (Twilight Violet Forest + Dark Slate Stepping Stones + Cyan Ponds)
    bgGradientFrom: '#581c87',
    bgGradientVia: '#4c1d95',
    bgGradientTo: '#2e1065',
    roadStrokeColor: '#7e22ce',
    roadBorderColor: '#1e1b4b',
    steppingStoneColor: '#6b21a8',
    steppingStoneBorder: '#3b0764',
    nodeBtnTop: '#a855f7',
    nodeBtnBottom: '#6b21a8',
    nodeBtnRing: '#2e1065',
    accentPropType: 'twilight',
    digTablet: {
      id: 'tablet_enigmatic_8',
      word: 'enigmatic',
      partOfSpeech: 'adjective',
      element: 'shadow',
      gradeTier: 'extender',
      powerBonus: 12,
      definition: 'Mysterious, puzzling, and difficult to interpret without careful study.',
      example: 'The archaeologist decoded the enigmatic carvings on the obsidian tablet.',
      morphologyNote: 'Greek Root "ainigma" (riddle): High-Achiever Extender Tablet (+12 Power)!',
    },
    quizzes: [
      [
        {
          prompt: 'What does the Latin root "umbra" (as in umbrella and Umbra Monarch) mean?',
          options: ['Shadow or shade', 'Burning sun', 'Flowing river', 'Loud echo'],
          correctIndex: 0,
          explanation: '"Umbra" means shadow or shade!',
          focusWord: 'umbra',
        },
        {
          prompt: 'What does the Greek root "crypt" (as in cryptic or crypt) mean?',
          options: ['Hidden or secret', 'Loud or noisy', 'Soft or gentle', 'Fast or swift'],
          correctIndex: 0,
          explanation: '"Crypt" means hidden—so a "cryptic" clue has a hidden meaning!',
          focusWord: 'cryptic',
        },
        {
          prompt: 'What does "nocturnal" mean when describing a twilight creature?',
          options: ['Active at night', 'Active only at noon', 'Living underwater', 'Eating only rocks'],
          correctIndex: 0,
          explanation: 'From the Latin root "noct-" (night), nocturnal creatures are active at night.',
          focusWord: 'nocturnal',
        },
      ],
      [
        {
          prompt: 'What does the Greek root "morph" (as in morphology and metamorphosis) mean?',
          options: ['Form or shape', 'Sound or voice', 'Distance', 'Heat'],
          correctIndex: 0,
          explanation: '"Morph" means form or shape—morphology is the study of how word forms are built!',
          focusWord: 'metamorphosis',
        },
        {
          prompt: 'Choose the word that means "faint, dim, or barely visible in the dusk":',
          options: ['obscure', 'blinding', ' deafening', 'tropical'],
          correctIndex: 0,
          explanation: '"Obscure" means not clearly seen or hard to make out in dim light.',
          focusWord: 'obscure',
        },
        {
          prompt: 'What does the prefix "omni-" (as in omnidirectional) mean?',
          options: ['All or everywhere', 'None or zero', 'Half', 'Tiny'],
          correctIndex: 0,
          explanation: '"Omni-" is the Latin root meaning "all"!',
          focusWord: 'omnipresent',
        },
      ],
      [
        {
          prompt: 'What does "reverberate" mean inside a deep stone cavern?',
          options: ['To echo repeatedly off the walls', 'To melt into lava', 'To bloom with flowers', 'To freeze solid'],
          correctIndex: 0,
          explanation: '"Reverberate" means for a sound to echo back and forth repeatedly.',
          focusWord: 'reverberate',
        },
        {
          prompt: 'Break "bioluminescent" into its meaningful roots:',
          options: ['bio (life) + lumin (light) + escent (glowing)', 'bi (two) + olum (rock)', 'bio (water) + lum (dark)', 'biol (tree) + min (small)'],
          correctIndex: 0,
          explanation: 'Bioluminescent mushrooms in the Twilight Forest produce living light!',
          focusWord: 'bioluminescent',
        },
        {
          prompt: 'Which element is the direct opposite counter to Shadow?',
          options: ['Light', 'Earth', 'Grass', 'Water'],
          correctIndex: 0,
          explanation: 'Radiant Light pierces through Shadow!',
          focusWord: 'illuminate',
        },
      ],
    ],
  },
  {
    zoneId: 'area-light',
    order: 9,
    name: 'Celestia Radiant Sanctum',
    shortName: '9. Light Sanctum',
    element: 'light',
    gradeBand: 'Grades 6 – 8 High-Achiever',
    gradeTier: 'extender',
    grammarFocus: 'Mastery of All 4 Parts of Speech & Academic Roots',
    bossId: 'boss_sovereign',
    bossName: 'The Syntax Sovereign',
    midBossId: 'solaris',
    midBossName: 'Solaris Prism-Keeper',
    vanguardId: 'luxkit',
    vanguardName: 'Sunbeam Luxkit',
    bgGradientFrom: '#fef08a',
    bgGradientVia: '#facc15',
    bgGradientTo: '#ca8a04',
    roadStrokeColor: '#ffffff',
    roadBorderColor: '#b45309',
    steppingStoneColor: '#fef9c3',
    steppingStoneBorder: '#a16207',
    nodeBtnTop: '#f59e0b',
    nodeBtnBottom: '#b45309',
    nodeBtnRing: '#451a03',
    accentPropType: 'solar',
    digTablet: {
      id: 'tablet_resplendent_9',
      word: 'resplendent',
      partOfSpeech: 'adjective',
      element: 'light',
      gradeTier: 'extender',
      powerBonus: 14,
      definition: 'Shining brilliantly; gleaming with impressive splendor and color.',
      example: 'The Syntax Sovereign stood atop the resplendent solar prism.',
      morphologyNote: 'Latin Root "splendere" (to shine): Ultimate Grade 6–8 Extender Tablet (+14 Power)!',
    },
    quizzes: [
      [
        {
          prompt: 'What does the Greek root "photo / phos" (as in photon and photosynthesis) mean?',
          options: ['Light', 'Weight', 'Earth', 'Time'],
          correctIndex: 0,
          explanation: '"Photo" means light!',
          focusWord: 'photon',
        },
        {
          prompt: 'What does "resplendent" mean?',
          options: ['Shining brilliantly with great splendor', 'Dark and gloomy', 'Slow and clumsy', 'Cold and icy'],
          correctIndex: 0,
          explanation: '"Resplendent" comes from the Latin root meaning to shine brightly!',
          focusWord: 'resplendent',
        },
        {
          prompt: 'Identify the part of speech of "transcend" in "True scholars transcend every obstacle":',
          options: ['Verb', 'Adjective', 'Adverb', 'Conjunction'],
          correctIndex: 0,
          explanation: '"Transcend" (to rise above or go beyond limits) is the action Verb of the sentence!',
          focusWord: 'transcend',
        },
      ],
      [
        {
          prompt: 'What does the prefix "trans-" (as in translucent and transform) mean?',
          options: ['Across, through, or beyond', 'Underneath', 'Backwards', 'Without'],
          correctIndex: 0,
          explanation: '"Trans-" means across or through—translucent crystal lets light pass through!',
          focusWord: 'translucent',
        },
        {
          prompt: 'What is the difference between "opaque" and "transparent"?',
          options: [
            'Opaque blocks light; transparent lets light pass clearly through',
            'They mean the exact same thing',
            'Opaque means liquid; transparent means solid',
            'Opaque is a verb; transparent is a noun',
          ],
          correctIndex: 0,
          explanation: 'Opaque materials block light, while transparent materials let light through!',
          focusWord: 'transparent',
        },
        {
          prompt: 'Which word means "supreme ruler or highest authority"?',
          options: ['sovereign', 'apprentice', 'pebble', 'breeze'],
          correctIndex: 0,
          explanation: 'A "sovereign" is a supreme ruler—like The Syntax Sovereign!',
          focusWord: 'sovereign',
        },
      ],
      [
        {
          prompt: 'Select the flawless Grade 6–8 Ultimate Sentence (Adj + Noun + Verb + Adv):',
          options: [
            'Resplendent prisms radiate brilliantly.',
            'Brilliantly radiate prisms resplendent.',
            'Prisms resplendent brilliantly radiate.',
            'Radiate resplendent prisms brilliantly.',
          ],
          correctIndex: 0,
          explanation: 'Resplendent (Adj) + prisms (Noun) + radiate (Verb) + brilliantly (Adv)!',
          focusWord: 'brilliantly',
        },
        {
          prompt: 'What does the Greek word "syntax" mean in linguistics?',
          options: [
            'The arrangement of words and phrases to create well-formed sentences',
            'A type of volcanic rock',
            'A frozen glacier',
            'A merchant wagon',
          ],
          correctIndex: 0,
          explanation: '"Syntax" comes from Greek "syntaxis" meaning "putting together in order"!',
          focusWord: 'syntax',
        },
        {
          prompt: 'How do you deal maximum damage to The Syntax Sovereign in Stage 9-10?',
          options: [
            'Weave a 4-Word Ultimate Sentence using high-tier Word Tablets!',
            'Skip your turn',
            'Use only 1-letter words',
            'Unequip all Word Tablets',
          ],
          correctIndex: 0,
          explanation: 'Weaving a 4-Word Ultimate Sentence triggers the 2.0x Syntax Mastery multiplier!',
          focusWord: 'mastery',
        },
      ],
    ],
  },
];

function buildZoneNodes(seed: ZoneSeed): AdventureStageNode[] {
  const z = seed.order;
  return S_CURVE_COORDS.map((coord, idx) => {
    const stageNumber = idx + 1;
    const code = `${z}-${stageNumber}`;

    if (stageNumber === 1) {
      return {
        nodeId: code,
        stageNumber,
        code,
        title: `Stage ${code}: Trailhead Vanguard`,
        subtitle: `Opening ${seed.shortName} Skirmish`,
        type: 'combat',
        xPct: coord.xPct,
        yPct: coord.yPct,
        enemyId: seed.bossId,
        enemyName: `${seed.vanguardName} (Scout)`,
        enemyLevel: z * 2 + 1,
        rewardCoins: 45,
        rewardGems: 1,
      };
    }

    if (stageNumber === 2) {
      return {
        nodeId: code,
        stageNumber,
        code,
        title: `Stage ${code}: Field Checkpoint I`,
        subtitle: `3-Question ${seed.grammarFocus} Quiz`,
        type: 'quiz',
        xPct: coord.xPct,
        yPct: coord.yPct,
        rewardCoins: 50,
        rewardGems: 1,
        quizQuestions: seed.quizzes[0],
      };
    }

    if (stageNumber === 3) {
      return {
        nodeId: code,
        stageNumber,
        code,
        title: `Stage ${code}: Canyon Outpost Battle`,
        subtitle: `Elemental Combo Test`,
        type: 'combat',
        xPct: coord.xPct,
        yPct: coord.yPct,
        enemyId: seed.bossId,
        enemyName: `${seed.vanguardName} Pack`,
        enemyLevel: z * 2 + 2,
        rewardCoins: 55,
        rewardGems: 1,
      };
    }

    if (stageNumber === 4) {
      return {
        nodeId: code,
        stageNumber,
        code,
        title: `Stage ${code}: Fossil Excavation Dig Site`,
        subtitle: `Unearth Buried Word Tablet: "${seed.digTablet.word.toUpperCase()}"`,
        type: 'digsite',
        xPct: coord.xPct,
        yPct: coord.yPct,
        rewardCoins: 60,
        rewardGems: 2,
        digSiteTablet: seed.digTablet,
      };
    }

    if (stageNumber === 5) {
      return {
        nodeId: code,
        stageNumber,
        code,
        title: `Stage ${code}: Ammonite Gate Mid-Boss`,
        subtitle: `Mid-Zone Gatekeeper: ${seed.midBossName}`,
        type: 'midboss',
        xPct: coord.xPct,
        yPct: coord.yPct,
        enemyId: seed.bossId,
        enemyName: `${seed.midBossName} (Mid-Boss)`,
        enemyLevel: z * 3 + 2,
        rewardCoins: 80,
        rewardGems: 2,
      };
    }

    if (stageNumber === 6) {
      return {
        nodeId: code,
        stageNumber,
        code,
        title: `Stage ${code}: Morphology Field Trial`,
        subtitle: `3-Question Word Structure Challenge`,
        type: 'quiz',
        xPct: coord.xPct,
        yPct: coord.yPct,
        rewardCoins: 65,
        rewardGems: 1,
        quizQuestions: seed.quizzes[1],
      };
    }

    if (stageNumber === 7) {
      return {
        nodeId: code,
        stageNumber,
        code,
        title: `Stage ${code}: Upper Ridge Sentinel`,
        subtitle: `Elite ${seed.element.toUpperCase()} Sentinel Battle`,
        type: 'combat',
        xPct: coord.xPct,
        yPct: coord.yPct,
        enemyId: seed.bossId,
        enemyName: `Elite ${seed.vanguardName}`,
        enemyLevel: z * 3 + 4,
        rewardCoins: 70,
        rewardGems: 1,
      };
    }

    if (stageNumber === 8) {
      return {
        nodeId: code,
        stageNumber,
        code,
        title: `Stage ${code}: Expedition Supply Chest`,
        subtitle: `Claim Coins, Gems & Companion EXP Cache`,
        type: 'chest',
        xPct: coord.xPct,
        yPct: coord.yPct,
        rewardCoins: 90,
        rewardGems: 2,
      };
    }

    if (stageNumber === 9) {
      return {
        nodeId: code,
        stageNumber,
        code,
        title: `Stage ${code}: Pre-Summit Syntax Gauntlet`,
        subtitle: `Final Grammar Trial Before the Guardian`,
        type: 'quiz',
        xPct: coord.xPct,
        yPct: coord.yPct,
        rewardCoins: 85,
        rewardGems: 2,
        quizQuestions: seed.quizzes[2],
      };
    }

    // stageNumber === 10
    return {
      nodeId: code,
      stageNumber,
      code,
      title: `Stage ${code}: Realm Guardian Finale`,
      subtitle: `Boss Showdown: ${seed.bossName}`,
      type: 'boss',
      xPct: coord.xPct,
      yPct: coord.yPct,
      enemyId: seed.bossId,
      enemyName: seed.bossName,
      enemyLevel: z * 4 + 5,
      rewardCoins: 140,
      rewardGems: 3,
    };
  });
}

export const ELEMENTAL_ADVENTURE_BIOMES: ElementalBiomeTheme[] = ZONE_SEEDS.map((seed) => ({
  zoneId: seed.zoneId,
  order: seed.order,
  name: seed.name,
  shortName: seed.shortName,
  element: seed.element,
  gradeBand: seed.gradeBand,
  grammarFocus: seed.grammarFocus,
  bossId: seed.bossId,
  bossName: seed.bossName,
  midBossId: seed.midBossId,
  midBossName: seed.midBossName,
  vanguardId: seed.vanguardId,
  vanguardName: seed.vanguardName,
  bgGradientFrom: seed.bgGradientFrom,
  bgGradientVia: seed.bgGradientVia,
  bgGradientTo: seed.bgGradientTo,
  roadStrokeColor: seed.roadStrokeColor,
  roadBorderColor: seed.roadBorderColor,
  steppingStoneColor: seed.steppingStoneColor,
  steppingStoneBorder: seed.steppingStoneBorder,
  nodeBtnTop: seed.nodeBtnTop,
  nodeBtnBottom: seed.nodeBtnBottom,
  nodeBtnRing: seed.nodeBtnRing,
  accentPropType: seed.accentPropType,
  nodes: buildZoneNodes(seed),
}));

export function getBiomeByZoneId(zoneId: string): ElementalBiomeTheme {
  return (
    ELEMENTAL_ADVENTURE_BIOMES.find((b) => b.zoneId === zoneId) ||
    ELEMENTAL_ADVENTURE_BIOMES[0]
  );
}

export function getNodeByCode(zoneId: string, nodeCode: string): AdventureStageNode {
  const biome = getBiomeByZoneId(zoneId);
  return biome.nodes.find((n) => n.nodeId === nodeCode) || biome.nodes[0];
}
