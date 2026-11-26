/**
 * Word Forge — morphology fusion engine for Word Battler (Layer 2 - Word Relationships)
 */

import type { Word, Creature, Affix, ForgeToken, ForgeResult, CatalogWords, ElementType } from '../types.ts';
import { OPPOSITE_ELEMENT } from '../data/elements.ts';
import { INITIAL_AFFIXES, INITIAL_CREATURE_MORPHEMES } from '../data/initialData.ts';

export const MAX_FORGE_DEPTH = 2;

const AFFIXATION_BONUS = 1;
const COMPOUND_BONUS = 2;
const RESONANCE_BONUS = 2;

const fail = (...reasons: string[]): ForgeResult => ({
  ok: false,
  kind: null,
  result: null,
  lesson: null,
  reasons,
});

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const depthOf = (entry: Word | Creature | null | undefined) => {
  if (!entry) return 0;
  if ('forge' in entry && entry.forge) return entry.forge.depth ?? 0;
  if ('forged' in entry && entry.forged) return entry.forged.depth ?? 0;
  return 0;
};

export function invertElement(element: ElementType): ElementType {
  return OPPOSITE_ELEMENT[element] ?? element;
}

export function attachAffix(base: string, affix: Affix): string {
  if (affix.type === 'prefix') {
    return affix.text + base;
  }

  let stem = base;
  const startsWithVowel = /^[aeiou]/i.test(affix.text);

  if (affix.respell.includes('dropSilentE') && startsWithVowel && stem.endsWith('e')) {
    stem = stem.slice(0, -1);
  }
  if (affix.respell.includes('yToI') && /[^aeiou]y$/i.test(stem)) {
    stem = `${stem.slice(0, -1)}i`;
  }
  return stem + affix.text;
}

function pluralize(parts: string[]): string {
  return parts.map((p) => `${p}s`).join(' or ');
}

const wordListCache = new WeakMap<CatalogWords, Word[]>();
const wordMapCache = new WeakMap<CatalogWords, Map<string, Word>>();

export function getAllWordsList(words: CatalogWords): Word[] {
  const cached = wordListCache.get(words);
  if (cached) return cached;
  const list = [
    ...(words.adjectives || []),
    ...(words.nouns || []),
    ...(words.verbs || []),
    ...(words.adverbs || []),
  ];
  wordListCache.set(words, list);
  return list;
}

export function getWordById(words: CatalogWords, id: string | null | undefined): Word | null {
  if (!id) return null;
  let map = wordMapCache.get(words);
  if (!map) {
    map = new Map<string, Word>();
    for (const w of getAllWordsList(words)) {
      map.set(w.id, w);
    }
    wordMapCache.set(words, map);
  }
  return map.get(id) || null;
}

export function createForge(options: {
  creatures: Creature[];
  words: CatalogWords;
  affixes?: Affix[];
  creatureMorphemes?: Record<string, { modifier: string; head: string }>;
  closedCompounds?: Set<string>;
}) {
  const {
    creatures,
    words,
    affixes = INITIAL_AFFIXES,
    creatureMorphemes = INITIAL_CREATURE_MORPHEMES,
    closedCompounds = new Set<string>(),
  } = options;

  function resolveToken(token: ForgeToken | null): {
    kind?: 'word' | 'affix' | 'creature';
    entry?: any;
    error?: string;
  } {
    if (!token || !token.kind || !token.id) {
      return { error: 'Each forge slot needs a token: word, affix, or creature.' };
    }

    if (token.kind === 'word') {
      const found = getAllWordsList(words).find(
        (w) => w.id === token.id || w.word.toLowerCase() === token.id.toLowerCase()
      );
      if (!found) return { error: `Unknown word token: ${token.id}` };
      return { kind: 'word', entry: found };
    }

    if (token.kind === 'creature') {
      const found = creatures.find((c) => c.id === token.id);
      if (!found) return { error: `Unknown creature token: ${token.id}` };
      return { kind: 'creature', entry: found };
    }

    if (token.kind === 'affix') {
      const found = affixes.find((a) => a.id === token.id);
      if (!found) return { error: `Unknown affix token: ${token.id}` };
      return { kind: 'affix', entry: found };
    }

    return { error: `Unknown token kind: ${token.kind}` };
  }

  /* Process 1: Affixation */
  function forgeAffixation(
    affixSlot: { entry: Affix },
    wordSlot: { entry: Word },
    affixFirst: boolean
  ): ForgeResult {
    const affix = affixSlot.entry;
    const base = wordSlot.entry;
    const label = affix.type === 'prefix' ? `${affix.text}-` : `-${affix.text}`;

    if (affix.type === 'prefix' && !affixFirst) {
      return fail(`"${label}" is a prefix, so it goes BEFORE the base word in English.`);
    }
    if (affix.type === 'suffix' && affixFirst) {
      return fail(`"${label}" is a suffix, so it goes AFTER the base word in English.`);
    }
    if (!affix.from.includes(base.partOfSpeech)) {
      return fail(
        `"${label}" attaches to ${pluralize(affix.from)}, but "${base.word}" is a ${base.partOfSpeech}.`
      );
    }
    if (depthOf(base) >= MAX_FORGE_DEPTH) {
      return fail(`"${base.word}" has reached maximum forge depth (${MAX_FORGE_DEPTH}) and cannot change again.`);
    }

    const newWordText = attachAffix(base.word, affix);
    const newElement =
      affix.elementEffect === 'invert' ? invertElement(base.element) : base.element;
    const definitionTemplate = affix.definition.replace('{base}', base.word);

    const result: Word = {
      id: slug(newWordText),
      word: newWordText,
      partOfSpeech: affix.to,
      element: newElement,
      powerBonus: AFFIXATION_BONUS,
      fusionDepth: depthOf(base) + 1,
      definition: capitalize(definitionTemplate) + '.',
      example:
        affix.to === 'noun'
          ? `The ${newWordText} filled the room with wonder.`
          : `It was a ${newWordText} moment on the battlefield.`,
      forge: {
        layer: 2,
        process: 'affixation',
        affixId: affix.id,
        parts: [affix.type === 'prefix' ? label : base.word, affix.type === 'prefix' ? base.word : label],
        baseId: base.id,
        depth: depthOf(base) + 1,
        powerBonus: AFFIXATION_BONUS,
      },
    };

    const flipped =
      newElement !== base.element
        ? ` It inverts the element from ${base.element} to ${newElement} because its meaning is reversed!`
        : '';

    return {
      ok: true,
      kind: 'affixation',
      result,
      lesson: `"${label}" means "${affix.gloss}". Combining ${base.word} (${base.partOfSpeech}) + ${label} makes "${newWordText}", an elemental ${affix.to}.${flipped}`,
      reasons: [`${label} + ${base.word} → ${newWordText}`],
    };
  }

  /* Process 2: Compounding — Real English Compound Words */
  const REAL_COMPOUND_BY_ELEMENT: Record<
    ElementType,
    { word: string; definition: string; example: string }[]
  > = {
    fire: [
      {
        word: 'wildfire',
        definition: 'A sweeping, fast-moving fire that spreads rapidly across dry land.',
        example: 'Emberfox leaped over the blazing wildfire.',
      },
      {
        word: 'firestorm',
        definition: 'An intense burst of swirling flames and rising heat.',
        example: 'A roaring firestorm lit up the volcanic arena.',
      },
    ],
    ice: [
      {
        word: 'snowstorm',
        definition: 'A heavy storm of swirling snow and freezing wind.',
        example: 'Rimepup tracked footprints through the winter snowstorm.',
      },
      {
        word: 'frostbite',
        definition: 'Biting, freezing cold that turns water and stone to ice.',
        example: 'The icy wind carried a sharp chill of frostbite.',
      },
    ],
    water: [
      {
        word: 'whirlpool',
        definition: 'A powerful, spinning current of water that pulls things toward its center.',
        example: 'Aquafin dove gracefully through the swirling whirlpool.',
      },
      {
        word: 'waterfall',
        definition: 'A cascade of rushing water dropping over a steep rocky cliff.',
        example: 'Cool mist rose from the thundering waterfall.',
      },
    ],
    electric: [
      {
        word: 'thunderbolt',
        definition: 'A blinding flash of lightning paired with a crash of thunder.',
        example: 'Voltowl launched a golden thunderbolt from the clouds.',
      },
      {
        word: 'stormcloud',
        definition: 'A dark, heavy cloud charged with rain and lightning.',
        example: 'Sparks danced inside the rumbling stormcloud.',
      },
    ],
    earth: [
      {
        word: 'earthquake',
        definition: 'A sudden, powerful shaking of the rocky ground.',
        example: 'Terraturtle stood firm during the rumbling earthquake.',
      },
      {
        word: 'rockslide',
        definition: 'A fast cascade of boulders and stones tumbling down a slope.',
        example: 'The heavy rockslide blocked the canyon pass.',
      },
    ],
    grass: [
      {
        word: 'wildflower',
        definition: 'A hardy, colorful flower that grows naturally in meadows and forests.',
        example: 'Sunlight warmed every wildflower in the green valley.',
      },
      {
        word: 'rainforest',
        definition: 'A lush, dense forest with tall trees and abundant rainfall.',
        example: 'Verdantsprout climbed high into the green rainforest canopy.',
      },
    ],
    air: [
      {
        word: 'windstorm',
        definition: 'A powerful storm with high-speed gusts of wind.',
        example: 'Zephyrkit rode the gusts of the roaring windstorm.',
      },
      {
        word: 'whirlwind',
        definition: 'A tall, spinning column of air moving rapidly across the sky.',
        example: 'Leaves danced inside the sudden whirlwind.',
      },
    ],
    light: [
      {
        word: 'starlight',
        definition: 'The bright, gentle glow that shines down from the stars at night.',
        example: 'Silver starlight guided the explorers across the bridge.',
      },
      {
        word: 'sunbeam',
        definition: 'A warm, golden ray of light streaming from the sun.',
        example: 'A bright sunbeam broke through the morning clouds.',
      },
    ],
    shadow: [
      {
        word: 'nightfall',
        definition: 'The quiet time of evening when daylight fades into night.',
        example: 'Dusklynx prowled silently through the woods at nightfall.',
      },
      {
        word: 'moonshadow',
        definition: 'A dark silhouette cast on the ground by the light of the moon.',
        example: 'The panther vanished into the cool moonshadow.',
      },
    ],
  };

  function forgeCompound(modifier: Word, head: Word): ForgeResult {
    if (modifier.id === head.id) {
      return fail('A compound needs two distinct words.');
    }

    const pair = `${modifier.partOfSpeech}+${head.partOfSpeech}`;
    const resultPosMap: Record<string, 'noun' | 'adjective'> = {
      'noun+noun': 'noun',
      'adjective+noun': 'noun',
      'noun+adjective': 'adjective',
    };
    const resultPos = resultPosMap[pair];
    if (!resultPos) {
      return fail(
        `${modifier.partOfSpeech} + ${head.partOfSpeech} is not a standard compound pattern here. Try noun + noun, adjective + noun, or noun + adjective.`
      );
    }

    if (Math.max(depthOf(modifier), depthOf(head)) >= MAX_FORGE_DEPTH) {
      return fail('That word has been forged too many times to combine again.');
    }

    const resonance = modifier.element === head.element;
    const elemPool = REAL_COMPOUND_BY_ELEMENT[head.element] || REAL_COMPOUND_BY_ELEMENT.fire;
    const pickedCompound = resonance ? elemPool[0] : elemPool[1] || elemPool[0];
    const compoundWord = pickedCompound.word;

    const result: Word = {
      id: slug(compoundWord),
      word: compoundWord,
      partOfSpeech: resultPos,
      element: head.element,
      powerBonus: COMPOUND_BONUS + (resonance ? RESONANCE_BONUS : 0),
      fusionDepth: Math.max(depthOf(modifier), depthOf(head)) + 1,
      definition: pickedCompound.definition,
      example: pickedCompound.example,
      forge: {
        layer: 2,
        process: 'compounding',
        parts: [modifier.word, head.word],
        modifierId: modifier.id,
        headId: head.id,
        modifierElement: modifier.element,
        depth: Math.max(depthOf(modifier), depthOf(head)) + 1,
        resonance,
        powerBonus: COMPOUND_BONUS + (resonance ? RESONANCE_BONUS : 0),
      },
    };

    return {
      ok: true,
      kind: 'compound',
      result,
      lesson: `Combining "${modifier.word}" + "${head.word}" forges the real English compound word "${compoundWord}": ${pickedCompound.definition}`,
      reasons: [`${modifier.word} + ${head.word} → ${compoundWord}`],
    };
  }

  /* Process 3: Creature Fusion */
  function forgeCreature(modifier: Word, creature: Creature): ForgeResult {
    const depth = creature.forged?.depth ?? 0;
    if (depth >= MAX_FORGE_DEPTH) {
      return fail(`${creature.name} has undergone the maximum number of fusions.`);
    }
    if (depthOf(modifier) >= MAX_FORGE_DEPTH) {
      return fail(`"${modifier.word}" has reached maximum forge depth and cannot be infused.`);
    }

    const head = creature.forged?.head ?? creatureMorphemes[creature.id]?.head ?? creature.name.toLowerCase();
    const modifierText = modifier.word.replace(/-/g, '');
    const hybridName = capitalize(modifierText) + head;
    const resonance = modifier.element === creature.element;
    const stats = { ...creature.stats };

    if (modifier.partOfSpeech === 'noun') {
      stats.attack += 4;
    } else {
      stats.defense += 3;
      stats.hp += 6;
    }
    if (resonance) {
      stats.hp += 6;
    }

    const allowedElements = Array.from(new Set([...creature.allowedElements, modifier.element]));

    const result: Creature = {
      ...creature,
      id: slug(hybridName),
      name: hybridName,
      element: modifier.element,
      elementAffinity: modifier.element,
      loadout: creature.loadout
        ? { ...creature.loadout }
        : {
            verb: null,
            noun: null,
            adjective: null,
            adverb: null,
          },
      description: `${creature.name} fused with "${modifier.word}": a hybrid ${head} shaped by primal ${modifier.element} power.`,
      stats,
      currentHp: stats.hp,
      maxHp: stats.hp,
      allowedWordTypes: [...creature.allowedWordTypes],
      allowedElements,
      forged: {
        layer: 2,
        process: 'creature-compounding',
        modifier: modifierText,
        head,
        sourceId: creature.forged?.sourceId ?? creature.id,
        depth: depth + 1,
        resonance,
      },
    };

    const dualMessage =
      allowedElements.length > 1
        ? ` ${hybridName} is a Dual-Element creature and can now harness both ${allowedElements.join(' and ')} vocabulary!`
        : '';

    return {
      ok: true,
      kind: 'creature-fusion',
      result,
      lesson: `"${hybridName}" is a morphological compound: modifier "${modifierText}" + creature head "${head}".${dualMessage}`,
      reasons: [`${modifier.word} + ${creature.name} → ${hybridName}`],
    };
  }

  /* Process 4: Dual-Companion Morpheme Splicing (e.g., Emberfox + Rimepup -> Emberpup) */
  function forgeCreaturePair(modCreature: Creature, headCreature: Creature): ForgeResult {
    if (modCreature.id === headCreature.id) {
      return fail('Choose two distinct companions to splice their morpheme cores.');
    }
    const depth = Math.max(modCreature.forged?.depth ?? 0, headCreature.forged?.depth ?? 0);
    if (depth >= MAX_FORGE_DEPTH) {
      return fail('One of these companions has already reached maximum fusion depth.');
    }

    const modifierText =
      modCreature.forged?.modifier ??
      creatureMorphemes[modCreature.id]?.modifier ??
      modCreature.name.slice(0, Math.min(5, modCreature.name.length)).toLowerCase();
    const head =
      headCreature.forged?.head ??
      creatureMorphemes[headCreature.id]?.head ??
      headCreature.name.slice(-3).toLowerCase();

    const hybridName = capitalize(modifierText) + head;
    const resonance = modCreature.element === headCreature.element;
    const stats = {
      hp: Math.max(modCreature.stats.hp, headCreature.stats.hp) + (resonance ? 10 : 6),
      attack: Math.max(modCreature.stats.attack, headCreature.stats.attack) + 3,
      defense: Math.max(modCreature.stats.defense, headCreature.stats.defense) + 3,
      speed: Math.max(modCreature.stats.speed, headCreature.stats.speed) + 2,
    };

    const allowedElements = Array.from(
      new Set([
        ...(modCreature.allowedElements || [modCreature.element]),
        ...(headCreature.allowedElements || [headCreature.element]),
        modCreature.element,
        headCreature.element,
      ])
    );

    const result: Creature = {
      ...headCreature,
      id: slug(hybridName),
      name: hybridName,
      element: modCreature.element,
      elementAffinity: headCreature.element,
      loadout: headCreature.loadout
        ? { ...headCreature.loadout }
        : { verb: null, noun: null, adjective: null, adverb: null },
      description: `A dual-core hybrid spliced from ${modCreature.name} ("${modifierText}-") and ${headCreature.name} ("-${head}").`,
      stats,
      currentHp: stats.hp,
      maxHp: stats.hp,
      allowedWordTypes: ['adjective', 'noun', 'verb', 'adverb'],
      allowedElements,
      forged: {
        layer: 2,
        process: 'creature-compounding',
        modifier: modifierText,
        head,
        sourceId: headCreature.id,
        depth: depth + 1,
        resonance,
      },
    };

    return {
      ok: true,
      kind: 'creature-fusion',
      result,
      lesson: `"${hybridName}" splices modifier morpheme "${modifierText}-" (${modCreature.name}) onto head morpheme "-${head}" (${headCreature.name}), creating a Dual-Element ${modCreature.element}/${headCreature.element} companion!`,
      reasons: [`${modCreature.name} + ${headCreature.name} → ${hybridName}`],
    };
  }

  function fuse(left: ForgeToken | null, right: ForgeToken | null): ForgeResult {
    const a = resolveToken(left);
    const b = resolveToken(right);
    if (a.error || b.error) {
      return fail(a.error || b.error || 'Invalid tokens');
    }

    const pair = `${a.kind}+${b.kind}`;
    switch (pair) {
      case 'affix+word':
        return forgeAffixation(a as { entry: Affix }, b as { entry: Word }, true);
      case 'word+affix':
        return forgeAffixation(b as { entry: Affix }, a as { entry: Word }, false);
      case 'word+word':
        return forgeCompound(a.entry as Word, b.entry as Word);
      case 'word+creature':
        return forgeCreature(a.entry as Word, b.entry as Creature);
      case 'creature+word':
        return fail(
          `In English compounds the head goes last. Place the modifier word first and ${b.entry.name} second.`
        );
      case 'affix+affix':
        return fail('Affixes cannot attach to affixes; they require a root or base word.');
      case 'creature+creature':
        return forgeCreaturePair(a.entry as Creature, b.entry as Creature);
      default:
        return fail('Combine an affix with a word, two words, or a word/companion with a creature.');
    }
  }

  return {
    fuse,
    listAffixes: () => affixes.map((a) => ({ ...a })),
  };
}

export function forgeCombine(
  left: ForgeToken | null,
  right: ForgeToken | null,
  options: {
    creatures: Creature[];
    words: CatalogWords;
    affixes?: Affix[];
  }
): ForgeResult {
  return createForge(options).fuse(left, right);
}

export function addForgedWord(catalog: CatalogWords, entry: Word): CatalogWords {
  const bucket: keyof CatalogWords =
    entry.partOfSpeech === 'adjective'
      ? 'adjectives'
      : entry.partOfSpeech === 'verb'
      ? 'verbs'
      : entry.partOfSpeech === 'adverb'
      ? 'adverbs'
      : 'nouns';
  const existingList = catalog[bucket] || [];
  if (existingList.some((w) => w.id === entry.id)) {
    return catalog;
  }
  return {
    ...catalog,
    [bucket]: [...existingList, entry],
  };
}

export function addForgedCreature(creatures: Creature[], entry: Creature): Creature[] {
  if (creatures.some((c) => c.id === entry.id)) {
    return creatures;
  }
  return [...creatures, entry];
}

export interface ForgeBlueprint {
  id: string;
  title: string;
  category: 'Prefix Tablet' | 'Suffix Shift' | 'Compound Word' | 'Hybrid Companion';
  ruleNote: string;
  token1: ForgeToken;
  token2: ForgeToken;
}

export const FORGE_BLUEPRINTS: ForgeBlueprint[] = [
  {
    id: 'bp-unfrozen',
    title: 'un- + frozen → unfrozen',
    category: 'Prefix Tablet',
    ruleNote: 'Prefix Rule: Attach "un-" to the front without changing the root spelling!',
    token1: { kind: 'affix', id: 'un' },
    token2: { kind: 'word', id: 'frozen' },
  },
  {
    id: 'bp-reignite',
    title: 're- + ignite → reignite',
    category: 'Prefix Tablet',
    ruleNote: 'Prefix Rule: "re-" means again—to ignite a second time!',
    token1: { kind: 'affix', id: 're' },
    token2: { kind: 'word', id: 'ignite' },
  },
  {
    id: 'bp-chilliness',
    title: 'chilly + -ness → chilliness',
    category: 'Suffix Shift',
    ruleNote: 'Y-to-I Rule: Final consonant + Y changes to I before adding "-ness"!',
    token1: { kind: 'word', id: 'chilly' },
    token2: { kind: 'affix', id: 'ness' },
  },
  {
    id: 'bp-flameling',
    title: 'flame + -ling → flameling',
    category: 'Suffix Shift',
    ruleNote: 'Drop-Silent-E Rule: Drop silent E on "flame" before adding "-ling"!',
    token1: { kind: 'word', id: 'flame' },
    token2: { kind: 'affix', id: 'ling' },
  },
  {
    id: 'bp-flameless',
    title: 'flame + -less → flameless',
    category: 'Suffix Shift',
    ruleNote: 'Suffix "-less" means "without" and inverts the elemental polarity!',
    token1: { kind: 'word', id: 'flame' },
    token2: { kind: 'affix', id: 'less' },
  },
  {
    id: 'bp-compound',
    title: 'blazing + flame → blazingflame',
    category: 'Compound Word',
    ruleNote: 'Compound Head Rule: Second word ("flame") sets the Noun part of speech!',
    token1: { kind: 'word', id: 'blazing' },
    token2: { kind: 'word', id: 'flame' },
  },
  {
    id: 'bp-hybrid-pet',
    title: 'Emberfox + Rimepup → Emberpup',
    category: 'Hybrid Companion',
    ruleNote: 'Splices two companion cores into a dual-morpheme hybrid creature!',
    token1: { kind: 'creature', id: 'emberfox' },
    token2: { kind: 'creature', id: 'rimepup' },
  },
];

