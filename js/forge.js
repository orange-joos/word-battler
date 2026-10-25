/**
 * Word Forge — Morphology Fusion Engine (Layer 2: Word Relationships)
 * Vanilla JavaScript ES6 Module with complete morphology rules and JSDoc annotations.
 *
 * Implements:
 * 1. Affixation (prefix + base or base + suffix)
 * 2. Compounding (modifier + head word)
 * 3. Creature Fusion (modifier word + creature token -> hybrid pet)
 *
 * @module forge
 */

export const MAX_FORGE_DEPTH = 2;
const OPPOSITE_ELEMENT = Object.freeze({ fire: 'ice', ice: 'fire' });

const AFFIXATION_BONUS = 1;
const COMPOUND_BONUS = 2;
const RESONANCE_BONUS = 2;

export const DEFAULT_AFFIXES = Object.freeze([
  {
    id: 'un',
    text: 'un',
    type: 'prefix',
    from: ['adjective', 'verb'],
    to: 'adjective',
    gloss: 'not; the opposite of',
    definition: 'not {base}',
    elementEffect: 'invert',
    respell: [],
  },
  {
    id: 'less',
    text: 'less',
    type: 'suffix',
    from: ['noun'],
    to: 'adjective',
    gloss: 'without',
    definition: 'without {base}',
    elementEffect: 'invert',
    respell: [],
  },
  {
    id: 'like',
    text: 'like',
    type: 'suffix',
    from: ['noun'],
    to: 'adjective',
    gloss: 'resembling',
    definition: 'resembling a {base}',
    elementEffect: 'keep',
    respell: [],
  },
  {
    id: 'ness',
    text: 'ness',
    type: 'suffix',
    from: ['adjective'],
    to: 'noun',
    gloss: 'the state or quality of being',
    definition: 'the quality of being {base}',
    elementEffect: 'keep',
    respell: ['yToI'],
  },
  {
    id: 'ling',
    text: 'ling',
    type: 'suffix',
    from: ['noun'],
    to: 'noun',
    gloss: 'small or young',
    definition: 'a small {base}',
    elementEffect: 'keep',
    respell: ['dropSilentE'],
  },
]);

export const DEFAULT_CREATURE_MORPHEMES = Object.freeze({
  emberfox: { modifier: 'ember', head: 'fox' },
  rimepup: { modifier: 'rime', head: 'pup' },
});

export const wordToken = (id) => ({ kind: 'word', id });
export const affixToken = (id) => ({ kind: 'affix', id });
export const creatureToken = (id) => ({ kind: 'creature', id });

const fail = (...reasons) => ({ ok: false, kind: null, result: null, lesson: null, reasons });
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const depthOf = (entry) => entry?.forge?.depth ?? entry?.forged?.depth ?? 0;

function invertElement(element) {
  return OPPOSITE_ELEMENT[element] ?? element;
}

function attachAffix(base, affix) {
  if (affix.type === 'prefix') {
    return affix.text + base;
  }

  let stem = base;
  const startsWithVowel = /^[aeiou]/i.test(affix.text);

  if (affix.respell?.includes('dropSilentE') && startsWithVowel && stem.endsWith('e')) {
    stem = stem.slice(0, -1);
  }
  if (affix.respell?.includes('yToI') && /[^aeiou]y$/i.test(stem)) {
    stem = `${stem.slice(0, -1)}i`;
  }
  return stem + affix.text;
}

function pluralize(parts) {
  return parts.map((p) => `${p}s`).join(' or ');
}

function allWords(catalog) {
  return [
    ...(catalog.adjectives || []),
    ...(catalog.nouns || []),
    ...(catalog.verbs || []),
    ...(catalog.adverbs || []),
  ];
}

/**
 * Creates a Word Forge instance to resolve morphological combinations.
 * @param {Object} options
 * @param {Array} options.creatures
 * @param {Object} options.words
 * @param {Array} [options.affixes]
 * @param {Object} [options.creatureMorphemes]
 * @param {Set} [options.closedCompounds]
 */
export function createForge(options = {}) {
  const creatures = options.creatures || [];
  const words = options.words || { adjectives: [], nouns: [], verbs: [], adverbs: [] };
  const affixes = options.affixes || DEFAULT_AFFIXES;
  const morphemes = options.creatureMorphemes || DEFAULT_CREATURE_MORPHEMES;
  const closedCompounds = options.closedCompounds || new Set();

  function resolve(token) {
    if (!token || !token.kind || !token.id) {
      return { error: 'Each forge slot needs a token: word, affix, or creature.' };
    }

    if (token.kind === 'word') {
      const found = allWords(words).find(
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

  function forgeAffixation(affixSlot, wordSlot, affixFirst) {
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
      return fail(`"${base.word}" has been forged too many times to combine again.`);
    }

    const word = attachAffix(base.word, affix);
    const element = affix.elementEffect === 'invert' ? invertElement(base.element) : base.element;
    const definitionTemplate = affix.definition.replace('{base}', base.word);

    const result = {
      id: slug(word),
      word,
      partOfSpeech: affix.to,
      element,
      definition: capitalize(definitionTemplate) + '.',
      example:
        affix.to === 'noun'
          ? `The ${word} filled the room with wonder.`
          : `It was a ${word} moment on the battlefield.`,
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
      element !== base.element
        ? ` It flips the element from ${base.element} to ${element} because its meaning was inverted!`
        : '';

    return {
      ok: true,
      kind: 'affixation',
      result,
      lesson: `"${label}" means "${affix.gloss}". Combining ${base.word} (${base.partOfSpeech}) + ${label} makes "${word}", an elemental ${affix.to}.${flipped}`,
      reasons: [`${label} + ${base.word} → ${word}`],
    };
  }

  function forgeCompound(modifier, head) {
    if (modifier.id === head.id) {
      return fail('A compound needs two distinct words.');
    }

    const pair = `${modifier.partOfSpeech}+${head.partOfSpeech}`;
    const resultPosMap = {
      'noun+noun': 'noun',
      'adjective+noun': 'noun',
      'noun+adjective': 'adjective',
      'adverb+verb': 'verb',
    };
    const resultPos = resultPosMap[pair];
    if (!resultPos) {
      return fail(
        `${modifier.partOfSpeech} + ${head.partOfSpeech} is not a valid compound pattern here. Try noun + noun, adjective + noun, or adverb + verb.`
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

    const result = {
      id: slug(compoundWord),
      word: compoundWord,
      partOfSpeech: resultPos,
      element: head.element,
      definition: capitalize(definition) + '.',
      example:
        resultPos === 'noun'
          ? `The ${compoundWord} glowed with immense arcane energy.`
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
      : `The head "${head.word}" dictates the element (${head.element}); the modifier provides flavor.`;

    return {
      ok: true,
      kind: 'compound',
      result,
      lesson: `In English compounds, the right-hand word is the head: a "${compoundWord}" is fundamentally a kind of ${head.word}. ${elementNote}`,
      reasons: [`${modifier.word} + ${head.word} → ${compoundWord}`],
    };
  }

  function forgeCreature(modifier, creature) {
    const depth = creature.forged?.depth ?? 0;
    if (depth >= MAX_FORGE_DEPTH) {
      return fail(`${creature.name} has undergone the maximum number of fusions.`);
    }
    if (depthOf(modifier) >= MAX_FORGE_DEPTH) {
      return fail(`"${modifier.word}" has reached maximum forge depth and cannot be infused.`);
    }

    const head = creature.forged?.head ?? morphemes[creature.id]?.head ?? creature.name.toLowerCase();
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

    const allowedElements = Array.from(new Set([...(creature.allowedElements || []), modifier.element]));

    const result = {
      ...creature,
      id: slug(hybridName),
      name: hybridName,
      element: modifier.element,
      description: `${creature.name} fused with "${modifier.word}": a hybrid ${head} shaped by primal ${modifier.element} power.`,
      stats,
      currentHp: stats.hp,
      maxHp: stats.hp,
      allowedWordTypes: [...(creature.allowedWordTypes || ['adjective', 'noun', 'verb', 'adverb'])],
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
        ? ` ${hybridName} is a Dual-Element pet and can now harness both ${allowedElements.join(' and ')} vocabulary!`
        : '';

    return {
      ok: true,
      kind: 'creature-fusion',
      result,
      lesson: `"${hybridName}" is a morphological compound: modifier "${modifierText}" + creature head "${head}".${dualMessage}`,
      reasons: [`${modifier.word} + ${creature.name} → ${hybridName}`],
    };
  }

  function fuse(left, right) {
    const a = resolve(left);
    const b = resolve(right);
    if (a.error || b.error) {
      return fail(a.error || b.error || 'Invalid tokens');
    }

    const pair = `${a.kind}+${b.kind}`;
    switch (pair) {
      case 'affix+word':
        return forgeAffixation(a, b, true);
      case 'word+affix':
        return forgeAffixation(b, a, false);
      case 'word+word':
        return forgeCompound(a.entry, b.entry);
      case 'word+creature':
        return forgeCreature(a.entry, b.entry);
      case 'creature+word':
        return fail(
          `In English compounds the head goes last. Place the modifier word first and ${b.entry.name} second.`
        );
      case 'affix+affix':
        return fail('Affixes cannot attach to affixes; they require a base word.');
      case 'creature+creature':
        return fail('Two creature heads cannot share one body. Fuse a word token with a creature.');
      default:
        return fail('Combine an affix with a word, two words, or a word with a creature.');
    }
  }

  return {
    fuse,
    listAffixes: () => affixes.map((a) => ({ ...a })),
  };
}

/**
 * Checks a fusion between two tokens.
 * @param {Object} leftToken
 * @param {Object} rightToken
 * @param {Object} options
 * @returns {Object} Fusion result { ok, kind, result, lesson, reasons }
 */
export function checkFusion(leftToken, rightToken, options = {}) {
  const forge = options.forge || createForge(options);
  return forge.fuse(leftToken, rightToken);
}

/**
 * Add forged word to catalog.
 * @param {Object} catalog
 * @param {Object} entry
 */
export function addForgedWord(catalog, entry) {
  const bucket =
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

/**
 * Add forged creature to creatures roster.
 * @param {Array} creatures
 * @param {Object} entry
 */
export function addForgedCreature(creatures, entry) {
  if (creatures.some((c) => c.id === entry.id)) {
    return creatures;
  }
  return [...creatures, entry];
}
