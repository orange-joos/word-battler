import type { ElementType } from '../types';

export interface VocabSample {
  word: string;
  partOfSpeech: 'verb' | 'noun' | 'adjective' | 'adverb';
  element: ElementType;
  definition: string;
  morphologyNote: string;
}

export interface WorldTier {
  id: string;
  tierNumber: number;
  name: string;
  subtitle: string;
  gradeBand: string;
  theme: string;
  element: ElementType;
  color: string;
  borderColor: string;
  bgGradient: string;
  icon: string;
  bannerEmoji: string;
  lore: string;
  vocabConcept: string;
  keyRootsOrAffixes: string[];
  vocabSamples: VocabSample[];
  boss: {
    id: string;
    name: string;
    title: string;
    element: string;
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    spriteEmoji: string;
    description: string;
    weakness: string;
  };
  rewardCoins: number;
  rewardTokens: number;
}

const VOCABULARY_TIERS: WorldTier[] = [
  {
    id: 'root-village',
    tierNumber: 1,
    name: 'Root Village',
    subtitle: 'Foundation of Ancient Roots',
    gradeBand: 'Grade 3 Core',
    theme: 'Latin & Greek Root Words',
    element: 'grass',
    color: 'emerald',
    borderColor: 'border-emerald-500',
    bgGradient: 'from-emerald-400 via-teal-300 to-lime-400',
    icon: '🌱',
    bannerEmoji: '🏡',
    lore: 'A peaceful, sunlit glade where mossy monoliths hold the original linguistic seeds of the English language.',
    vocabConcept: 'Root words are base word parts that carry core meaning. Adding affixes transforms them into entire word families!',
    keyRootsOrAffixes: ['tract (pull)', 'port (carry)', 'rupt (break)', 'form (shape)', 'struct (build)'],
    vocabSamples: [
      {
        word: 'rupture',
        partOfSpeech: 'verb',
        element: 'fire',
        definition: 'To break suddenly or burst with energy.',
        morphologyNote: 'From root "rupt" (burst) — when magma ruptures, it breaks stone!',
      },
      {
        word: 'tractor',
        partOfSpeech: 'noun',
        element: 'grass',
        definition: 'A powerful machine built to pull heavy loads.',
        morphologyNote: 'From root "tract" (pull/drag) — pulls plows through fields.',
      },
      {
        word: 'portable',
        partOfSpeech: 'adjective',
        element: 'ice',
        definition: 'Light and easy to carry from place to place.',
        morphologyNote: 'From root "port" (carry) + "-able" (can be).',
      },
    ],
    boss: {
      id: 'boss_ruptor',
      name: 'Ruptor the Break-Beast',
      title: 'Guardian of the First Roots',
      element: 'grass',
      hp: 38,
      attack: 9,
      defense: 8,
      speed: 8,
      spriteEmoji: '🗿',
      description: 'An ancient mossy stone beast that tests young explorers on core Latin roots.',
      weakness: 'Fire adjectives and sharp action verbs crack its stone shield.',
    },
    rewardCoins: 80,
    rewardTokens: 2,
  },
  {
    id: 'prefix-path',
    tierNumber: 2,
    name: 'Prefix Path & Forest',
    subtitle: 'Canopy of Reversal & Direction',
    gradeBand: 'Grade 3–4 Expansion',
    theme: 'Negative & Directional Prefixes',
    element: 'ice',
    color: 'sky',
    borderColor: 'border-sky-500',
    bgGradient: 'from-sky-400 via-cyan-300 to-blue-400',
    icon: '🌲',
    bannerEmoji: '🧭',
    lore: 'Twisting enchanted crossroad woods where prefix runes float like will-o-wisps, reversing word meanings in midair!',
    vocabConcept: 'A prefix is attached to the BEGINNING of a base word to alter its meaning, direction, or polarity (e.g. un- = not, re- = again).',
    keyRootsOrAffixes: ['un- (opposite)', 're- (again / back)', 'dis- (apart / not)', 'pre- (before)', 'mis- (wrongly)'],
    vocabSamples: [
      {
        word: 'unfreeze',
        partOfSpeech: 'verb',
        element: 'fire',
        definition: 'To thaw or release from a state of ice.',
        morphologyNote: 'Prefix "un-" inverts the ice effect into flowing warmth!',
      },
      {
        word: 'reignite',
        partOfSpeech: 'verb',
        element: 'fire',
        definition: 'To set on fire again; to rekindle a fading flame.',
        morphologyNote: 'Prefix "re-" (repeat) brings spent sparks back to life.',
      },
      {
        word: 'disrupt',
        partOfSpeech: 'verb',
        element: 'ice',
        definition: 'To interrupt an event or activity by causing a disturbance.',
        morphologyNote: 'Prefix "dis-" (apart) + root "rupt" (break) = break apart.',
      },
    ],
    boss: {
      id: 'boss_dishornet',
      name: 'Dis-Hornet Swarm',
      title: 'Terror of the Crossroad Canopy',
      element: 'ice',
      hp: 44,
      attack: 11,
      defense: 10,
      speed: 12,
      spriteEmoji: '🐝',
      description: 'A swift frost swarm that flips positive status buffs with reversing prefix strikes.',
      weakness: 'Swift adverbs and counter-stance defenses disrupt its flight.',
    },
    rewardCoins: 110,
    rewardTokens: 3,
  },
  {
    id: 'suffix-steppes',
    tierNumber: 3,
    name: 'Suffix Steppes & Canyon',
    subtitle: 'Mesas of Part-of-Speech Shifting',
    gradeBand: 'Grade 4 Progression',
    theme: 'Transformative Suffixes',
    element: 'grass',
    color: 'amber',
    borderColor: 'border-amber-500',
    bgGradient: 'from-amber-400 via-yellow-300 to-orange-400',
    icon: '🏜️',
    bannerEmoji: '🦅',
    lore: 'Terraced sandstone cliffs echoing with syllable endings. Here, suffixes effortlessly convert heavy nouns into soaring adjectives!',
    vocabConcept: 'A suffix attaches to the END of a base word and often changes its Part of Speech (e.g., noun "fear" + suffix "-less" = adjective "fearless")!',
    keyRootsOrAffixes: ['-ful (full of)', '-less (without)', '-able (capable of)', '-ly (adverb/how)', '-ness (state of)'],
    vocabSamples: [
      {
        word: 'fearless',
        partOfSpeech: 'adjective',
        element: 'fire',
        definition: 'Bold and brave; without any fear in battle.',
        morphologyNote: 'Noun "fear" + "-less" = an adjective immune to intimidation debuffs.',
      },
      {
        word: 'fiercely',
        partOfSpeech: 'adverb',
        element: 'fire',
        definition: 'In a powerful, aggressive, or energetic manner.',
        morphologyNote: 'Adjective "fierce" + "-ly" creates a momentum-boosting adverb.',
      },
      {
        word: 'swiftness',
        partOfSpeech: 'noun',
        element: 'ice',
        definition: 'The quality of moving at extraordinary speed.',
        morphologyNote: 'Adjective "swift" + "-ness" turns speed into a tangible noun asset.',
      },
    ],
    boss: {
      id: 'boss_galecrest',
      name: 'Galecrest the Shift-Wyvern',
      title: 'High-Altitude Suffix Sovereign',
      element: 'grass',
      hp: 50,
      attack: 13,
      defense: 12,
      speed: 11,
      spriteEmoji: '🦅',
      description: 'A feathered canyon drake that shifts its battle stance whenever a suffix resolves.',
      weakness: 'Armor-piercing nouns and multi-turn regeneration withstand its wind gusts.',
    },
    rewardCoins: 150,
    rewardTokens: 4,
  },
  {
    id: 'compound-colosseum',
    tierNumber: 4,
    name: 'Compound Colosseum',
    subtitle: 'Crucible of Dual Word Fusion',
    gradeBand: 'Grade 4–5 Synergy',
    theme: 'Compound Morphology & Head/Modifier',
    element: 'fire',
    color: 'rose',
    borderColor: 'border-rose-500',
    bgGradient: 'from-rose-500 via-red-400 to-orange-500',
    icon: '🌋',
    bannerEmoji: '⚔️',
    lore: 'A glowing obsidian gladiatorial arena above bubbling magma pools. Explorers fuse two entire word roots to forge monumental hybrid strikes!',
    vocabConcept: 'In English compounds, the rightmost word is the HEAD (sets primary category), while the leftmost word is the MODIFIER (adds unique elemental spice)!',
    keyRootsOrAffixes: ['fire + storm', 'frost + bite', 'sun + burst', 'dragon + scale', 'shield + breaker'],
    vocabSamples: [
      {
        word: 'firestorm',
        partOfSpeech: 'noun',
        element: 'fire',
        definition: 'An intense, raging tempest of living embers and swirling flame.',
        morphologyNote: 'Modifier "fire" + Head "storm" = a devastating compound noun with +2 resonance!',
      },
      {
        word: 'frostbite',
        partOfSpeech: 'noun',
        element: 'ice',
        definition: 'Severe freezing cold that numbs and damages tissue.',
        morphologyNote: 'Modifier "frost" + Head "bite" = sharp physical impact + frostbite debuff.',
      },
      {
        word: 'sunburst',
        partOfSpeech: 'noun',
        element: 'fire',
        definition: 'A sudden brilliant explosion of golden solar light.',
        morphologyNote: 'Modifier "sun" + Head "burst" = blinds opponent accuracy by 30%.',
      },
    ],
    boss: {
      id: 'boss_pyrostorm',
      name: 'Pyrostorm Chimera',
      title: 'Colosseum Apex Champion',
      element: 'fire',
      hp: 58,
      attack: 15,
      defense: 12,
      speed: 13,
      spriteEmoji: '🦁',
      description: 'A twin-headed lion-dragon forged from burning compounds that channels double elemental fury.',
      weakness: 'Glacial freeze nouns and damage reduction barriers temper its blistering heat.',
    },
    rewardCoins: 200,
    rewardTokens: 6,
  },
  {
    id: 'syntax-spire',
    tierNumber: 5,
    name: 'Syntax Spire',
    subtitle: 'Pinnacle of Sentence Masterwork',
    gradeBand: 'Grade 5 Mastery',
    theme: '4x4 Matrix Rhetoric & Sentence Architecture',
    element: 'light',
    color: 'purple',
    borderColor: 'border-purple-500',
    bgGradient: 'from-purple-500 via-violet-400 to-indigo-600',
    icon: '🏰',
    bannerEmoji: '👑',
    lore: 'The floating crystalline citadel that pierces the aurora. Here, words obey the laws of grammar to command reality itself.',
    vocabConcept: 'Syntax is the arrangement of words into meaningful sentences. Master all 4 Move Categories (Attack, Defend, Buff, Debuff) with 2-word combos!',
    keyRootsOrAffixes: ['Adverb + Verb', 'Adjective + Noun', 'Status Constraints', 'Reflect Stances', 'Matrix Resonance'],
    vocabSamples: [
      {
        word: 'fiercely ignite',
        partOfSpeech: 'verb',
        element: 'fire',
        definition: 'A 2-word syntax masterpiece: Direct Strike amplified by critical strike momentum.',
        morphologyNote: 'Adverb "fiercely" (crit chance) + Verb "ignite" (heavy base damage).',
      },
      {
        word: 'swiftly fortify',
        partOfSpeech: 'noun',
        element: 'ice',
        definition: 'Constructs an impenetrable barrier before the opponent can strike.',
        morphologyNote: 'Adverb "swiftly" (priority/evasion) + Noun "fortify" (flat shield).',
      },
      {
        word: 'blazing catalyst',
        partOfSpeech: 'adjective',
        element: 'fire',
        definition: 'Infuses active pet with permanent elemental stat escalation.',
        morphologyNote: 'Adjective "blazing" (elemental synergy) + Noun "catalyst" (stat buff).',
      },
    ],
    boss: {
      id: 'boss_sovereign',
      name: 'The Syntax Sovereign',
      title: 'Grand Arbiter of Grammar',
      element: 'light',
      hp: 68,
      attack: 17,
      defense: 15,
      speed: 14,
      spriteEmoji: '👑',
      description: 'An astral entity of pure linguistic energy wielding all 4 parts of speech simultaneously.',
      weakness: 'Adaptable 4x4 matrix combos and strategic multi-turn buffs are required to prevail!',
    },
    rewardCoins: 350,
    rewardTokens: 10,
  },
];

const ELEMENTAL_AREAS: Array<{
  sourceTierIndex: number;
  name: string;
  subtitle: string;
  element: ElementType;
  icon: string;
  bannerEmoji: string;
  color: string;
  borderColor: string;
  bgGradient: string;
  lore: string;
  existingProgressId?: string;
}> = [
  {
    sourceTierIndex: 0,
    existingProgressId: 'root-village',
    name: 'Root Village',
    subtitle: 'The Greenway of Growing Words',
    element: 'grass',
    icon: '🌱',
    bannerEmoji: '🏡',
    color: 'emerald',
    borderColor: 'border-emerald-500',
    bgGradient: 'from-emerald-400 via-teal-300 to-lime-400',
    lore: 'A sunlit garden where new word roots grow beside ancient trees.',
  },
  {
    sourceTierIndex: 1,
    existingProgressId: 'prefix-path',
    name: 'Ripple Bay',
    subtitle: 'The Flowing Wordway',
    element: 'water',
    icon: '💧',
    bannerEmoji: '🌊',
    color: 'sky',
    borderColor: 'border-sky-500',
    bgGradient: 'from-sky-400 via-cyan-300 to-blue-400',
    lore: 'A sparkling shore where words and ideas travel with the current.',
  },
  {
    sourceTierIndex: 2,
    existingProgressId: 'suffix-steppes',
    name: 'Stoneward Canyon',
    subtitle: 'The Steady Path of Word Builders',
    element: 'earth',
    icon: '🪨',
    bannerEmoji: '🏜️',
    color: 'amber',
    borderColor: 'border-amber-600',
    bgGradient: 'from-amber-400 via-yellow-300 to-orange-400',
    lore: 'A sturdy canyon of sandstone bridges and word-building stones.',
  },
  {
    sourceTierIndex: 3,
    existingProgressId: 'compound-colosseum',
    name: 'Emberpeak',
    subtitle: 'The Bright Forge Frontier',
    element: 'fire',
    icon: '🔥',
    bannerEmoji: '🌋',
    color: 'rose',
    borderColor: 'border-rose-500',
    bgGradient: 'from-rose-500 via-red-400 to-orange-500',
    lore: 'A glowing volcanic ridge where brave explorers forge stronger words.',
  },
  {
    sourceTierIndex: 4,
    existingProgressId: 'syntax-spire',
    name: 'Frostveil Peaks',
    subtitle: 'The Clear and Quiet Heights',
    element: 'ice',
    icon: '❄️',
    bannerEmoji: '🏔️',
    color: 'cyan',
    borderColor: 'border-cyan-500',
    bgGradient: 'from-cyan-300 via-sky-300 to-blue-400',
    lore: 'A bright alpine trail where careful word choices shine through the snow.',
  },
  {
    sourceTierIndex: 0,
    name: 'Zephyr Heights',
    subtitle: 'The Open Skyway',
    element: 'air',
    icon: '🌬️',
    bannerEmoji: '🪁',
    color: 'sky',
    borderColor: 'border-sky-400',
    bgGradient: 'from-sky-300 via-cyan-200 to-indigo-300',
    lore: 'A breezy skyway where new vocabulary sails on every gust.',
  },
  {
    sourceTierIndex: 1,
    name: 'Sparkstep Plains',
    subtitle: 'The Lively Lightning Trail',
    element: 'electric',
    icon: '⚡',
    bannerEmoji: '🌩️',
    color: 'yellow',
    borderColor: 'border-yellow-500',
    bgGradient: 'from-yellow-300 via-amber-300 to-violet-400',
    lore: 'A lively plain full of bright ideas and energetic word discoveries.',
  },
  {
    sourceTierIndex: 2,
    name: 'Duskwood Glade',
    subtitle: 'The Hidden Wordway',
    element: 'shadow',
    icon: '🌑',
    bannerEmoji: '🌙',
    color: 'violet',
    borderColor: 'border-violet-500',
    bgGradient: 'from-violet-500 via-purple-400 to-indigo-600',
    lore: 'A gentle twilight forest where quiet clues reveal the meaning of words.',
  },
  {
    sourceTierIndex: 4,
    name: 'Sunspire Gardens',
    subtitle: 'The Radiant Wordway',
    element: 'light',
    icon: '✨',
    bannerEmoji: '🏰',
    color: 'amber',
    borderColor: 'border-amber-400',
    bgGradient: 'from-yellow-300 via-amber-300 to-orange-400',
    lore: 'A welcoming garden of light where every learned word adds a new spark.',
  },
];

export const WORLD_TIERS: WorldTier[] = ELEMENTAL_AREAS.map((area, index) => {
  const lesson = VOCABULARY_TIERS[area.sourceTierIndex];
  return {
    ...lesson,
    id: area.existingProgressId || `${area.element}-area`,
    tierNumber: index + 1,
    name: area.name,
    subtitle: area.subtitle,
    element: area.element,
    color: area.color,
    borderColor: area.borderColor,
    bgGradient: area.bgGradient,
    icon: area.icon,
    bannerEmoji: area.bannerEmoji,
    lore: area.lore,
  };
});
