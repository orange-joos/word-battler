import type { Creature, CatalogWords, Affix, ElementType } from '../types.ts';
import { buildMergedVocabularyCatalog } from './vocabDatabase.ts';

const ALL_ELEMENTS: ElementType[] = [
  'fire',
  'water',
  'ice',
  'grass',
  'electric',
  'shadow',
  'light',
  'earth',
  'air',
];

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
    description: "A nimble fox whose fur holds live embers. Gains bonus Elemental Synergy when casting Fire words!",
    stats: {
      hp: 46,
      attack: 14,
      defense: 9,
      speed: 12
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
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
    description: "A frost-coated pup that breathes pale mist. Chills opponents with icy adjectives and crystalline nouns. (Ready to Evolve!)",
    stats: {
      hp: 50,
      attack: 11,
      defense: 13,
      speed: 10
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
  },
  {
    id: "verdantsprout",
    name: "Verdantsprout",
    element: "grass",
    elementAffinity: "grass",
    level: 9,
    exp: 130,
    maxExp: 170,
    stage: 1,
    evolvesAtLevel: 10,
    spriteEmoji: "🐱🍃",
    title: "Sproutling Lynx",
    loadout: {
      verb: "grow",
      noun: "root",
      adjective: "ancient",
      adverb: "steadily"
    },
    description: "A playful lynx woven with flourishing vine roots. Channels botanical adjectives and steady growth.",
    stats: {
      hp: 48,
      attack: 12,
      defense: 11,
      speed: 11
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
  },
  {
    id: "voltowl",
    name: "Voltowl",
    element: "electric",
    elementAffinity: "electric",
    level: 9,
    exp: 140,
    maxExp: 170,
    stage: 1,
    evolvesAtLevel: 10,
    spriteEmoji: "🦉⚡",
    title: "Stormfeather Owlet",
    loadout: {
      verb: "spark",
      noun: "charge",
      adjective: "charged",
      adverb: "rapidly"
    },
    description: "A wise storm-feathered owlet hatched in the Treetop Canopy. Strikes with high-voltage verbs and lightning adverbs.",
    stats: {
      hp: 44,
      attack: 14,
      defense: 10,
      speed: 15
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
  },
  {
    id: "terraturtle",
    name: "Terraturtle",
    element: "earth",
    elementAffinity: "earth",
    level: 9,
    exp: 135,
    maxExp: 170,
    stage: 1,
    evolvesAtLevel: 10,
    spriteEmoji: "🐢🪨",
    title: "Crystal-Shell Tortoise",
    loadout: {
      verb: "fortify",
      noun: "boulder",
      adjective: "sturdy",
      adverb: "heavily"
    },
    description: "An ancient tortoise carrying emerald crystals and mountain stone on its shell. Excels at impenetrable noun shields.",
    stats: {
      hp: 56,
      attack: 11,
      defense: 16,
      speed: 8
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
  },
  {
    id: "zephyrkit",
    name: "Zephyrkit",
    element: "air",
    elementAffinity: "air",
    level: 9,
    exp: 145,
    maxExp: 170,
    stage: 1,
    evolvesAtLevel: 10,
    spriteEmoji: "🦊🌬️",
    title: "Cloud-Runner Kit",
    loadout: {
      verb: "soar",
      noun: "breeze",
      adjective: "buoyant",
      adverb: "gracefully"
    },
    description: "A sky-dancing cloud kit with feathered ears that rides gentle updrafts between the floating islands.",
    stats: {
      hp: 45,
      attack: 12,
      defense: 10,
      speed: 16
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
  },
  {
    id: "glimmerfae",
    name: "Glimmerfae",
    element: "light",
    elementAffinity: "light",
    level: 10,
    exp: 180,
    maxExp: 180,
    stage: 1,
    evolvesAtLevel: 10,
    spriteEmoji: "🦋✨",
    title: "Starlight Sprite",
    loadout: {
      verb: "illuminate",
      noun: "glow",
      adjective: "radiant",
      adverb: "brightly"
    },
    description: "A radiant celestial sprite born from Celestia's fountain. Channels luminous academic vocabulary! (Ready to Evolve!)",
    stats: {
      hp: 47,
      attack: 15,
      defense: 11,
      speed: 14
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
  },
  {
    id: "boss_ruptor",
    name: "Ruptor the Break-Beast",
    element: "earth",
    elementAffinity: "earth",
    loadout: {
      verb: "ignite",
      noun: "boulder",
      adjective: "sturdy",
      adverb: "fiercely"
    },
    description: "Guardian of Root Village. An ancient mossy stone beast that channels Greek and Latin root monoliths.",
    stats: {
      hp: 42,
      attack: 10,
      defense: 9,
      speed: 8
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
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
      hp: 48,
      attack: 12,
      defense: 10,
      speed: 12
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
  },
  {
    id: "boss_galecrest",
    name: "Galecrest Wyvern",
    element: "grass",
    elementAffinity: "grass",
    loadout: {
      verb: "grow",
      noun: "root",
      adjective: "swift",
      adverb: "steadily"
    },
    description: "High-Altitude Suffix Sovereign. Shifts grammatical forms between noun and adjective mid-flight.",
    stats: {
      hp: 54,
      attack: 13,
      defense: 12,
      speed: 11
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
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
      hp: 60,
      attack: 15,
      defense: 12,
      speed: 13
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
  },
  {
    id: "boss_sovereign",
    name: "The Syntax Sovereign",
    element: "light",
    elementAffinity: "light",
    loadout: {
      verb: "shine",
      noun: "glow",
      adjective: "radiant",
      adverb: "brightly"
    },
    description: "Grand Arbiter of Grammar at the peak of Syntax Spire. Commands the entire 4x4 Action Matrix.",
    stats: {
      hp: 70,
      attack: 17,
      defense: 15,
      speed: 15
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
  },
  {
    id: "boss_leviathan",
    name: "Tidal Leviathan",
    element: "water",
    elementAffinity: "water",
    loadout: {
      verb: "splash",
      noun: "current",
      adjective: "flowing",
      adverb: "swiftly"
    },
    description: "Guardian of the Azure Water Lagoon. Summons tidal shields and cascading verb waves.",
    stats: {
      hp: 46,
      attack: 11,
      defense: 12,
      speed: 10
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
  },
  {
    id: "boss_zephyrlord",
    name: "Tempest Griffin",
    element: "air",
    elementAffinity: "air",
    loadout: {
      verb: "soar",
      noun: "breeze",
      adjective: "swift",
      adverb: "rapidly"
    },
    description: "Sovereign of the Tempest Sky Spire. Rides high-velocity adverbial updrafts.",
    stats: {
      hp: 52,
      attack: 14,
      defense: 11,
      speed: 16
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
  },
  {
    id: "boss_voltarchon",
    name: "Volt-Rune Dynamo",
    element: "electric",
    elementAffinity: "electric",
    loadout: {
      verb: "spark",
      noun: "charge",
      adjective: "charged",
      adverb: "fiercely"
    },
    description: "Sentinel of the Storm Citadel. Channels supercharged suffixes and high-voltage roots.",
    stats: {
      hp: 56,
      attack: 15,
      defense: 12,
      speed: 15
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
  },
  {
    id: "boss_umbralord",
    name: "Umbra Golem Monarch",
    element: "shadow",
    elementAffinity: "shadow",
    loadout: {
      verb: "cloak",
      noun: "shade",
      adjective: "hidden",
      adverb: "quietly"
    },
    description: "Ancient keeper of Shadowcrypt Golem Ruins. Tests scholars with cryptic prefixes and extender roots.",
    stats: {
      hp: 64,
      attack: 16,
      defense: 14,
      speed: 13
    },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
  },
  {
    id: "aquafin",
    name: "Aquafin",
    element: "water",
    elementAffinity: "water",
    level: 8,
    exp: 110,
    maxExp: 160,
    stage: 1,
    evolvesAtLevel: 10,
    spriteEmoji: "🐬",
    title: "Tidecrest Dolphin",
    loadout: { verb: "splash", noun: "current", adjective: "flowing", adverb: "swiftly" },
    description: "A playful river companion that rides curling waves and guards its friends.",
    stats: { hp: 48, attack: 11, defense: 13, speed: 11 },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
  },
  {
    id: "voltwing",
    name: "Voltwing",
    element: "electric",
    elementAffinity: "electric",
    level: 8,
    exp: 110,
    maxExp: 160,
    stage: 1,
    evolvesAtLevel: 10,
    spriteEmoji: "🐝",
    title: "Sparkwing Stinger",
    loadout: { verb: "spark", noun: "charge", adjective: "charged", adverb: "rapidly" },
    description: "A nimble winged companion that crackles with lively electric energy.",
    stats: { hp: 44, attack: 13, defense: 9, speed: 15 },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
  },
  {
    id: "dusklynx",
    name: "Dusklynx",
    element: "shadow",
    elementAffinity: "shadow",
    level: 8,
    exp: 110,
    maxExp: 160,
    stage: 1,
    evolvesAtLevel: 10,
    spriteEmoji: "🐈‍⬛",
    title: "Twilight Prowler",
    loadout: { verb: "cloak", noun: "shade", adjective: "hidden", adverb: "quietly" },
    description: "A gentle dusk prowler that slips through shadows to protect its team.",
    stats: { hp: 45, attack: 14, defense: 10, speed: 13 },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
  },
  {
    id: "zephyrfinch",
    name: "Zephyrfinch",
    element: "air",
    elementAffinity: "air",
    level: 8,
    exp: 110,
    maxExp: 160,
    stage: 1,
    evolvesAtLevel: 10,
    spriteEmoji: "🪶",
    title: "Skysong Finch",
    loadout: { verb: "soar", noun: "breeze", adjective: "buoyant", adverb: "lightly" },
    description: "A bright-feathered companion that rides gentle updrafts and darts between the clouds.",
    stats: { hp: 44, attack: 12, defense: 10, speed: 15 },
    allowedWordTypes: ["adjective", "noun", "verb", "adverb"],
    allowedElements: ALL_ELEMENTS
  }
];

const BASE_INITIAL_WORDS: CatalogWords = {
  adjectives: [
    {
      id: "blazing",
      word: "blazing",
      partOfSpeech: "adjective",
      element: "fire",
      combatCategory: "BUFF",
      definition: "Burning brightly and with great energy.",
      example: "A blazing lantern lit the path."
    },
    {
      id: "fierce",
      word: "fierce",
      partOfSpeech: "adjective",
      element: "fire",
      combatCategory: "BUFF",
      definition: "Intense, powerful, and aggressive.",
      example: "A fierce spark jumped from the logs."
    },
    {
      id: "frozen",
      word: "frozen",
      partOfSpeech: "adjective",
      element: "ice",
      combatCategory: "DEBUFF",
      definition: "Turned into ice or made very cold.",
      example: "The frozen pond held our footprints."
    },
    {
      id: "sharp",
      word: "sharp",
      partOfSpeech: "adjective",
      element: "ice",
      combatCategory: "BUFF",
      definition: "Having a thin edge or a sudden, biting quality.",
      example: "A sharp wind cut across the lake."
    },
    {
      id: "flowing",
      word: "flowing",
      partOfSpeech: "adjective",
      element: "water",
      combatCategory: "BUFF",
      definition: "Moving smoothly and continuously like water.",
      example: "Flowing streams traced bright lines through the valley."
    },
    {
      id: "charged",
      word: "charged",
      partOfSpeech: "adjective",
      element: "electric",
      combatCategory: "BUFF",
      definition: "Filled with electrical energy and ready to act.",
      example: "The charged crystal hummed with energy."
    },
    {
      id: "hidden",
      word: "hidden",
      partOfSpeech: "adjective",
      element: "shadow",
      combatCategory: "DEBUFF",
      definition: "Kept out of sight or difficult to notice.",
      example: "A hidden path wound beneath the trees."
    },
    {
      id: "radiant",
      word: "radiant",
      partOfSpeech: "adjective",
      element: "light",
      combatCategory: "BUFF",
      definition: "Shining brightly with warmth and joy.",
      example: "A radiant lantern welcomed the travelers."
    },
    {
      id: "sturdy",
      word: "sturdy",
      partOfSpeech: "adjective",
      element: "earth",
      combatCategory: "BUFF",
      definition: "Strongly built and able to withstand pressure.",
      example: "The sturdy bridge held firm above the gorge."
    },
    {
      id: "buoyant",
      word: "buoyant",
      partOfSpeech: "adjective",
      element: "air",
      combatCategory: "BUFF",
      definition: "Able to float or rise easily through the air.",
      example: "The buoyant kite lifted above the breezy hill."
    },
    {
      id: "ancient",
      word: "ancient",
      partOfSpeech: "adjective",
      element: "grass",
      combatCategory: "BUFF",
      definition: "Belonging to a very distant time in the past.",
      example: "Ancient roots held the hillside together."
    },
    {
      id: "swift",
      word: "swift",
      partOfSpeech: "adjective",
      element: "grass",
      combatCategory: "BUFF",
      definition: "Moving quickly and lightly.",
      example: "A swift hare darted between the ferns."
    },
    {
      id: "breezy",
      word: "breezy",
      partOfSpeech: "adjective",
      element: "air",
      combatCategory: "BUFF",
      definition: "Pleasantly fresh and windy.",
      example: "A breezy morning carried the kites above the park."
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
    },
    {
      id: "current",
      word: "current",
      partOfSpeech: "noun",
      element: "water",
      definition: "A steady movement of water in a particular direction.",
      example: "The current carried the leaf downstream."
    },
    {
      id: "charge",
      word: "charge",
      partOfSpeech: "noun",
      element: "electric",
      definition: "A supply of electrical energy.",
      example: "The battery held enough charge to light the lamp."
    },
    {
      id: "shade",
      word: "shade",
      partOfSpeech: "noun",
      element: "shadow",
      definition: "An area of darkness sheltered from light.",
      example: "The cat rested in the cool shade."
    },
    {
      id: "glow",
      word: "glow",
      partOfSpeech: "noun",
      element: "light",
      definition: "A steady, soft light.",
      example: "A warm glow filled the quiet room."
    },
    {
      id: "boulder",
      word: "boulder",
      partOfSpeech: "noun",
      element: "earth",
      definition: "A very large rock.",
      example: "A round boulder rested beside the trail."
    },
    {
      id: "root",
      word: "root",
      partOfSpeech: "noun",
      element: "grass",
      definition: "The part of a plant that grows underground.",
      example: "A root held the young tree in place."
    },
    {
      id: "breeze",
      word: "breeze",
      partOfSpeech: "noun",
      element: "air",
      definition: "A gentle movement of air.",
      example: "A cool breeze fluttered the pages of the book."
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
    },
    {
      id: "splash",
      word: "splash",
      partOfSpeech: "verb",
      element: "water",
      definition: "To send water scattering in drops.",
      example: "The playful otter splashed in the river."
    },
    {
      id: "spark",
      word: "spark",
      partOfSpeech: "verb",
      element: "electric",
      definition: "To give off a small flash of electricity or light.",
      example: "The wire sparked when it touched the metal."
    },
    {
      id: "cloak",
      word: "cloak",
      partOfSpeech: "verb",
      element: "shadow",
      definition: "To cover or hide something.",
      example: "Clouds cloak the mountain at dusk."
    },
    {
      id: "shine",
      word: "shine",
      partOfSpeech: "verb",
      element: "light",
      definition: "To give out or reflect light.",
      example: "The stars shine above the quiet lake."
    },
    {
      id: "grow",
      word: "grow",
      partOfSpeech: "verb",
      element: "grass",
      definition: "To develop or increase in size.",
      example: "Wildflowers grow along the sunny path."
    },
    {
      id: "crumble",
      word: "crumble",
      partOfSpeech: "verb",
      element: "earth",
      definition: "To break into small pieces.",
      example: "Dry soil can crumble between your fingers."
    },
    {
      id: "glide",
      word: "glide",
      partOfSpeech: "verb",
      element: "air",
      definition: "To move smoothly and easily through the air.",
      example: "The paper plane glided across the classroom."
    },
    {
      id: "soar",
      word: "soar",
      partOfSpeech: "verb",
      element: "air",
      definition: "To fly high through the air.",
      example: "The young finch soared above the forest canopy."
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
    },
    {
      id: "swiftly",
      word: "swiftly",
      partOfSpeech: "adverb",
      element: "water",
      definition: "In a quick and smooth manner.",
      example: "The stream moved swiftly after the rain."
    },
    {
      id: "rapidly",
      word: "rapidly",
      partOfSpeech: "adverb",
      element: "electric",
      definition: "At a fast rate or pace.",
      example: "The bright signal flashed rapidly."
    },
    {
      id: "quietly",
      word: "quietly",
      partOfSpeech: "adverb",
      element: "shadow",
      definition: "In a way that makes very little sound.",
      example: "The owl flew quietly through the night."
    },
    {
      id: "brightly",
      word: "brightly",
      partOfSpeech: "adverb",
      element: "light",
      definition: "With a strong or cheerful light.",
      example: "The lantern shone brightly in the dark."
    },
    {
      id: "steadily",
      word: "steadily",
      partOfSpeech: "adverb",
      element: "grass",
      definition: "In a firm, even, and continuous way.",
      example: "The young plant grew steadily through spring."
    },
    {
      id: "heavily",
      word: "heavily",
      partOfSpeech: "adverb",
      element: "earth",
      definition: "With great weight or force.",
      example: "Rain fell heavily on the rocky ground."
    },
    {
      id: "lightly",
      word: "lightly",
      partOfSpeech: "adverb",
      element: "air",
      definition: "With little weight or force.",
      example: "A feather floated lightly on the breeze."
    }
  ]
};

export const INITIAL_WORDS: CatalogWords = buildMergedVocabularyCatalog(BASE_INITIAL_WORDS);

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
    id: "re",
    text: "re",
    type: "prefix",
    from: ["verb"],
    to: "verb",
    gloss: "again; anew",
    definition: "to {base} again with double energy",
    elementEffect: "keep",
    respell: []
  },
  {
    id: "super",
    text: "super",
    type: "prefix",
    from: ["adjective", "noun", "verb"],
    to: "adjective",
    gloss: "above; beyond ordinary",
    definition: "extraordinarily {base}",
    elementEffect: "keep",
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
    id: "ful",
    text: "ful",
    type: "suffix",
    from: ["noun"],
    to: "adjective",
    gloss: "full of; rich in",
    definition: "full of {base}",
    elementEffect: "keep",
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
  },
  {
    id: "ly",
    text: "ly",
    type: "suffix",
    from: ["adjective"],
    to: "adverb",
    gloss: "in a manner that is",
    definition: "in a {base} manner",
    elementEffect: "keep",
    respell: ["yToI"]
  }
];

export const INITIAL_CREATURE_MORPHEMES: Record<string, { modifier: string; head: string }> = {
  emberfox: { modifier: "ember", head: "fox" },
  rimepup: { modifier: "rime", head: "pup" },
  verdantsprout: { modifier: "verdant", head: "sprout" },
  voltowl: { modifier: "volt", head: "owl" },
  terraturtle: { modifier: "terra", head: "turtle" },
  zephyrkit: { modifier: "zephyr", head: "kit" },
  glimmerfae: { modifier: "glimmer", head: "fae" },
};

