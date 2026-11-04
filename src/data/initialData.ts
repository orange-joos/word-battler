import { Creature, CatalogWords, Affix } from '../types';

export const INITIAL_CREATURES: Creature[] = [
  {
    id: "emberfox",
    name: "Emberfox",
    element: "fire",
    elementAffinity: "fire",
    level: 8,
    exp: 110,
    maxExp: 160,
    stage: 1,
    evolvesAtLevel: 10,
    spriteEmoji: "🦊",
    title: "Emberspark Pup",
    loadout: {
      verb: "ignite",
      noun: "flame",
      adjective: "blazing",
      adverb: "fiercely"
    },
    description: "A nimble fox whose fur holds live embers. It attacks with heat adjectives, flame nouns, and fiery strikes.",
    stats: {
      hp: 42,
      attack: 14,
      defense: 8,
      speed: 12
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ["fire"]
  },
  {
    id: "rimepup",
    name: "Rimepup",
    element: "ice",
    elementAffinity: "ice",
    level: 10,
    exp: 180,
    maxExp: 180,
    stage: 1,
    evolvesAtLevel: 10,
    spriteEmoji: "🐺",
    title: "Frostmist Pup",
    loadout: {
      verb: "freeze",
      noun: "shard",
      adjective: "frozen",
      adverb: "coldly"
    },
    description: "A frost-coated pup that breathes pale mist. Chills opponents with cold adjectives and ice nouns. (Ready to Evolve!)",
    stats: {
      hp: 46,
      attack: 10,
      defense: 13,
      speed: 9
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ["ice"]
  },
  {
    id: "verdantsprout",
    name: "Verdantsprout",
    element: "nature",
    elementAffinity: "nature",
    level: 9,
    exp: 130,
    maxExp: 170,
    stage: 1,
    evolvesAtLevel: 10,
    spriteEmoji: "🐱🍃",
    title: "Sproutling Lynx",
    loadout: {
      verb: "strike",
      noun: "gust",
      adjective: "ancient",
      adverb: "fiercely"
    },
    description: "A playful kitten woven with flourishing vine roots. Channels botanical adjectives and growth.",
    stats: {
      hp: 44,
      attack: 12,
      defense: 10,
      speed: 11
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ["nature"]
  },
  {
    id: "boss_ruptor",
    name: "Ruptor the Break-Beast",
    element: "nature",
    elementAffinity: "nature",
    loadout: {
      verb: "ignite",
      noun: "boulder",
      adjective: "ancient",
      adverb: "fiercely"
    },
    description: "Guardian of Root Village. An ancient mossy stone beast that channels Greek and Latin root monoliths.",
    stats: {
      hp: 40,
      attack: 10,
      defense: 9,
      speed: 8
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ["nature", "fire"]
  },
  {
    id: "boss_dishornet",
    name: "Dis-Hornet Swarm",
    element: "ice",
    elementAffinity: "ice",
    loadout: {
      verb: "freeze",
      noun: "shard",
      adjective: "sharp",
      adverb: "coldly"
    },
    description: "Terror of Prefix Path. A frost-coated winged colony that reverses meanings with rapid prefix stings.",
    stats: {
      hp: 46,
      attack: 12,
      defense: 10,
      speed: 12
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ["ice"]
  },
  {
    id: "boss_galecrest",
    name: "Galecrest Wyvern",
    element: "nature",
    elementAffinity: "nature",
    loadout: {
      verb: "strike",
      noun: "gust",
      adjective: "swift",
      adverb: "fiercely"
    },
    description: "High-Altitude Suffix Sovereign. Shifts grammatical forms between noun and adjective mid-flight.",
    stats: {
      hp: 52,
      attack: 13,
      defense: 12,
      speed: 11
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ["nature", "ice"]
  },
  {
    id: "boss_pyrostorm",
    name: "Pyrostorm Chimera",
    element: "fire",
    elementAffinity: "fire",
    loadout: {
      verb: "ignite",
      noun: "flame",
      adjective: "blazing",
      adverb: "fiercely"
    },
    description: "Apex champion of the Compound Colosseum. Formed from fused magma and storm nouns with double power.",
    stats: {
      hp: 58,
      attack: 15,
      defense: 12,
      speed: 13
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ["fire"]
  },
  {
    id: "boss_sovereign",
    name: "The Syntax Sovereign",
    element: "cosmic",
    elementAffinity: "fire",
    loadout: {
      verb: "ignite",
      noun: "flame",
      adjective: "blazing",
      adverb: "fiercely"
    },
    description: "Grand Arbiter of Grammar at the peak of Syntax Spire. Commands the entire 4x4 Action Matrix.",
    stats: {
      hp: 68,
      attack: 17,
      defense: 15,
      speed: 15
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ["fire", "ice", "nature"]
  }
];

export const INITIAL_WORDS: CatalogWords = {
  adjectives: [
    {
      id: "blazing",
      word: "blazing",
      partOfSpeech: "adjective",
      element: "fire",
      definition: "Burning brightly and with great energy.",
      example: "A blazing lantern lit the path."
    },
    {
      id: "fierce",
      word: "fierce",
      partOfSpeech: "adjective",
      element: "fire",
      definition: "Intense, powerful, and aggressive.",
      example: "A fierce spark jumped from the logs."
    },
    {
      id: "frozen",
      word: "frozen",
      partOfSpeech: "adjective",
      element: "ice",
      definition: "Turned into ice or made very cold.",
      example: "The frozen pond held our footprints."
    },
    {
      id: "sharp",
      word: "sharp",
      partOfSpeech: "adjective",
      element: "ice",
      definition: "Having a thin edge or a sudden, biting quality.",
      example: "A sharp wind cut across the lake."
    }
  ],
  nouns: [
    {
      id: "flame",
      word: "flame",
      partOfSpeech: "noun",
      element: "fire",
      definition: "A hot, glowing tongue of fire.",
      example: "The flame danced on the candle."
    },
    {
      id: "ember",
      word: "ember",
      partOfSpeech: "noun",
      element: "fire",
      definition: "A small piece of glowing coal or wood in a fire.",
      example: "One ember still glowed in the ashes."
    },
    {
      id: "shard",
      word: "shard",
      partOfSpeech: "noun",
      element: "ice",
      definition: "A sharp, broken piece of something hard.",
      example: "An ice shard glittered on the step."
    },
    {
      id: "blizzard",
      word: "blizzard",
      partOfSpeech: "noun",
      element: "ice",
      definition: "A severe snowstorm with strong wind.",
      example: "The blizzard covered the trail overnight."
    }
  ],
  verbs: [
    {
      id: "ignite",
      word: "ignite",
      partOfSpeech: "verb",
      element: "fire",
      definition: "To catch fire or cause something to burst into flame.",
      example: "A tiny spark can ignite dry autumn leaves."
    },
    {
      id: "scorch",
      word: "scorch",
      partOfSpeech: "verb",
      element: "fire",
      definition: "To burn the surface of something with intense heat.",
      example: "Wild embers scorch the blackened stones."
    },
    {
      id: "flare",
      word: "flare",
      partOfSpeech: "verb",
      element: "fire",
      definition: "To burn with a sudden, unsteady bright flame.",
      example: "The torches flare brightly in the night wind."
    },
    {
      id: "freeze",
      word: "freeze",
      partOfSpeech: "verb",
      element: "ice",
      definition: "To turn into solid ice through extreme cold.",
      example: "Bitter winter gusts freeze the mountain brook."
    },
    {
      id: "crystallize",
      word: "crystallize",
      partOfSpeech: "verb",
      element: "ice",
      definition: "To form into glittering, sharp ice crystals.",
      example: "Frost patterns crystallize across the cold glass."
    },
    {
      id: "shiver",
      word: "shiver",
      partOfSpeech: "verb",
      element: "ice",
      definition: "To shake or tremble from intense freezing cold.",
      example: "Chill winds make the pine needles shiver."
    }
  ],
  adverbs: [
    {
      id: "fiercely",
      word: "fiercely",
      partOfSpeech: "adverb",
      element: "fire",
      definition: "In a powerful, aggressive, and blazing manner.",
      example: "The bonfire burned fiercely against the darkness."
    },
    {
      id: "blazingly",
      word: "blazingly",
      partOfSpeech: "adverb",
      element: "fire",
      definition: "With intense, dazzling heat and brilliant light.",
      example: "The sun shone blazingly over the desert sands."
    },
    {
      id: "sharply",
      word: "sharply",
      partOfSpeech: "adverb",
      element: "ice",
      definition: "In a sudden, piercing, or biting manner.",
      example: "A cold draft cut sharply through the frosty doorway."
    },
    {
      id: "coldly",
      word: "coldly",
      partOfSpeech: "adverb",
      element: "ice",
      definition: "Without warmth; in a freezing or chilling way.",
      example: "The northern star gleamed coldly in the icy sky."
    }
  ]
};

export const INITIAL_AFFIXES: Affix[] = [
  {
    id: "un",
    text: "un",
    type: "prefix",
    from: ["adjective", "verb"],
    to: "adjective",
    gloss: "not; the opposite of",
    definition: "not {base}",
    elementEffect: "invert",
    respell: []
  },
  {
    id: "less",
    text: "less",
    type: "suffix",
    from: ["noun"],
    to: "adjective",
    gloss: "without",
    definition: "without {base}",
    elementEffect: "invert",
    respell: []
  },
  {
    id: "like",
    text: "like",
    type: "suffix",
    from: ["noun"],
    to: "adjective",
    gloss: "resembling",
    definition: "resembling a {base}",
    elementEffect: "keep",
    respell: []
  },
  {
    id: "ness",
    text: "ness",
    type: "suffix",
    from: ["adjective"],
    to: "noun",
    gloss: "the state or quality of being",
    definition: "the quality of being {base}",
    elementEffect: "keep",
    respell: ["yToI"]
  },
  {
    id: "ling",
    text: "ling",
    type: "suffix",
    from: ["noun"],
    to: "noun",
    gloss: "small or young",
    definition: "a small {base}",
    elementEffect: "keep",
    respell: ["dropSilentE"]
  }
];

export const INITIAL_CREATURE_MORPHEMES: Record<string, { modifier: string; head: string }> = {
  emberfox: { modifier: "ember", head: "fox" },
  rimepup: { modifier: "rime", head: "pup" },
};
