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

  /* Process 2: Compounding */
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

    const closed = modifier.word + head.word;
    const compoundWord = closedCompounds.has(closed) ? closed : `${modifier.word}-${head.word}`;
    const resonance = modifier.element === head.element;

    const definition =
      modifier.partOfSpeech === 'adjective'
        ? `a ${head.word} that is ${modifier.word}`
        : resultPos === 'adjective'
        ? `${head.word} in the manner of ${modifier.word}`
        : `a kind of ${head.word} imbued with ${modifier.word}`;

    const result: Word = {
      id: slug(compoundWord),
      word: compoundWord,
      partOfSpeech: resultPos,
      element: head.element,
      powerBonus: COMPOUND_BONUS + (resonance ? RESONANCE_BONUS : 0),
      fusionDepth: Math.max(depthOf(modifier), depthOf(head)) + 1,
      definition: capitalize(definition) + '.',
      example:
        resultPos === 'noun'
          ? `The ${compoundWord} glowed with immense elemental energy.`
          : `Her ${compoundWord} presence altered the battlefield.`,
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

    const elementNote = resonance
      ? `Both words share ${head.element} affinity, granting a +${RESONANCE_BONUS} Elemental Resonance bonus!`
      : `The head "${head.word}" dictates the element (${head.element}); the modifier provides nuance.`;

    return {
      ok: true,
      kind: 'compound',
      result,
      lesson: `In English compounds, the right-hand word is the head: a "${compoundWord}" is fundamentally a kind of ${head.word}. ${elementNote}`,
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

