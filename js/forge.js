/**
 * Word Forge — fusion system for Word Battler.
 *
 * Architecture: this is LAYER 2 (Word Relationships) — affixes, roots and
 * compound words. It sits between Layer 1 (word knowledge in words.json) and
 * Layer 3 (adjective + noun sentence construction in combat.js).
 *
 * The forge is PURE: fuse() never mutates its inputs, so it doubles as a
 * "preview" (show the player what a fusion would make before they commit).
 * Use addForgedWord() / addForgedCreature() to commit a result to a catalog.
 *
 * Three fusion processes, each mapped to a real English morphology rule:
 *
 *   1. AFFIXATION      affix + word   ->  derived word
 *        un- + frozen   = unfrozen    (prefix: "not"; element inverts)
 *        flame + -less  = flameless   (suffix: "without"; element inverts)
 *
 *   2. COMPOUNDING     word + word    ->  compound word
 *        The RIGHT-hand word is the HEAD (sets part of speech + element);
 *        the LEFT-hand word is the MODIFIER (narrows the meaning).
 *        flame + shard = flame-shard  (a kind of shard)
 *
 *   3. CREATURE FUSION word + creature token -> hybrid creature
 *        blizzard + fox = Blizzardfox (a kind of fox; takes on ice)
 *
 * Results are shaped like words.json / creatures.json entries, so they work
 * with combat.js unchanged. Each carries a `forge` block describing how it was
 * made; forgeComboBonus() exposes that for combat to use later.
 */

import { findCreature, findWord } from "../combat.js";

/* ------------------------------------------------------------------ */
/* Constants & default data                                            */
/* ------------------------------------------------------------------ */

export const MAX_FORGE_DEPTH = 2;

const OPPOSITE_ELEMENT = Object.freeze({ fire: "ice", ice: "fire" });

const AFFIXATION_BONUS = 1;
const COMPOUND_BONUS = 2;
const RESONANCE_BONUS = 2; // compound whose modifier and head share an element

/**
 * Affix schema (JSON-friendly, so it can move to affixes.json later):
 *  id, text, type ("prefix"|"suffix"), from (parts of speech accepted),
 *  to (resulting part of speech), gloss (what the affix means),
 *  definition (template; {base} = base word), elementEffect ("keep"|"invert"),
 *  respell (spelling rules applied when attaching).
 */
export const DEFAULT_AFFIXES = Object.freeze([
  {
    id: "un",
    text: "un",
    type: "prefix",
    from: ["adjective"],
    to: "adjective",
    gloss: "not; the opposite of",
    definition: "not {base}",
    elementEffect: "invert",
    respell: [],
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
    respell: [],
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
    respell: [],
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
    respell: ["yToI"],
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
    respell: ["dropSilentE"],
  },
]);

/**
 * Creatures are compounds themselves: Emberfox = ember (modifier) + fox (head).
 * Creature tokens expose the head so a new modifier can replace the old one.
 */
export const DEFAULT_CREATURE_MORPHEMES = Object.freeze({
  emberfox: { modifier: "ember", head: "fox" },
  rimepup: { modifier: "rime", head: "pup" },
});

/** Compounds that English writes as one word. Anything else is hyphenated. */
export const DEFAULT_CLOSED_COMPOUNDS = Object.freeze(new Set());

/* ------------------------------------------------------------------ */
/* Ingredient tokens                                                   */
/* ------------------------------------------------------------------ */

export const wordToken = (id) => ({ kind: "word", id });
export const affixToken = (id) => ({ kind: "affix", id });
export const creatureToken = (id) => ({ kind: "creature", id });

/**
 * Combat hook (not yet wired into combat.js): morphology bonus power a forged
 * word should add to a combo. Plain vocabulary words return 0.
 */
export function forgeComboBonus(word) {
  return word?.forge?.powerBonus ?? 0;
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const fail = (...reasons) => ({ ok: false, kind: null, result: null, lesson: null, reasons });

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const depthOf = (entry) => entry?.forge?.depth ?? 0;

function invertElement(element) {
  return OPPOSITE_ELEMENT[element] ?? element;
}

function attachAffix(base, affix) {
  if (affix.type === "prefix") {
    return affix.text + base;
  }

  let stem = base;
  const startsWithVowel = /^[aeiou]/.test(affix.text);

  if (affix.respell.includes("dropSilentE") && startsWithVowel && stem.endsWith("e")) {
    stem = stem.slice(0, -1);
  }
  if (affix.respell.includes("yToI") && /[^aeiou]y$/.test(stem)) {
    stem = `${stem.slice(0, -1)}i`;
  }
  return stem + affix.text;
}

function pluralize(partsOfSpeech) {
  return partsOfSpeech.map((pos) => `${pos}s`).join(" or ");
}

/* ------------------------------------------------------------------ */
/* Forge factory                                                       */
/* ------------------------------------------------------------------ */

export function createForge(options = {}) {
  if (!options.creatures || !options.words) {
    throw new Error("createForge requires creatures and words data.");
  }

  const creatures = options.creatures;
  const words = options.words;
  const affixes = options.affixes || DEFAULT_AFFIXES;
  const morphemes = options.creatureMorphemes || DEFAULT_CREATURE_MORPHEMES;
  const closedCompounds = options.closedCompounds || DEFAULT_CLOSED_COMPOUNDS;

  function resolve(token) {
    if (!token || !token.kind || !token.id) {
      return { error: "Each forge slot needs a token: word, affix, or creature." };
    }
    try {
      if (token.kind === "word") {
        return { kind: "word", entry: findWord(token.id, words) };
      }
      if (token.kind === "creature") {
        return { kind: "creature", entry: findCreature(token.id, creatures) };
      }
      if (token.kind === "affix") {
        const entry = affixes.find((affix) => affix.id === token.id);
        if (!entry) {
          throw new Error(`Unknown affix: ${token.id}`);
        }
        return { kind: "affix", entry };
      }
      return { error: `Unknown token kind: ${token.kind}` };
    } catch (error) {
      return { error: error.message };
    }
  }

  /* ---- Process 1: affixation ------------------------------------- */

  function forgeAffixation(affixSlot, wordSlot, affixFirst) {
    const affix = affixSlot.entry;
    const base = wordSlot.entry;
    const label = affix.type === "prefix" ? `${affix.text}-` : `-${affix.text}`;

    if (affix.type === "prefix" && !affixFirst) {
      return fail(`"${label}" is a prefix, so it goes BEFORE the base word.`);
    }
    if (affix.type === "suffix" && affixFirst) {
      return fail(`"${label}" is a suffix, so it goes AFTER the base word.`);
    }
    if (!affix.from.includes(base.partOfSpeech)) {
      return fail(
        `"${label}" attaches to ${pluralize(affix.from)}, but "${base.word}" is a ${base.partOfSpeech}.`
      );
    }
    if (depthOf(base) >= MAX_FORGE_DEPTH) {
      return fail(`"${base.word}" has been forged too many times to change again.`);
    }

    const word = attachAffix(base.word, affix);
    const element =
      affix.elementEffect === "invert" ? invertElement(base.element) : base.element;
    const definition = affix.definition.replace("{base}", base.word);

    const result = {
      id: slug(word),
      word,
      partOfSpeech: affix.to,
      element,
      definition: definition.charAt(0).toUpperCase() + definition.slice(1) + ".",
      example:
        affix.to === "noun"
          ? `The ${word} filled the room.`
          : `It was a ${word} sort of day.`,
      forge: {
        layer: 2,
        process: "affixation",
        affixId: affix.id,
        parts: [affix.type === "prefix" ? label : base.word, affix.type === "prefix" ? base.word : label],
        baseId: base.id,
        depth: depthOf(base) + 1,
        powerBonus: AFFIXATION_BONUS,
      },
    };

    const flipped =
      element !== base.element
        ? ` It also flips the element from ${base.element} to ${element}, because the meaning is reversed.`
        : "";

    return {
      ok: true,
      kind: "affixation",
      result,
      lesson:
        `"${label}" means "${affix.gloss}". ${base.word} (${base.partOfSpeech}) + ${label} ` +
        `makes "${word}", a ${affix.to}.${flipped}`,
      reasons: [`${label} + ${base.word} → ${word}`],
    };
  }

  /* ---- Process 2: compounding ------------------------------------ */

  function forgeCompound(modifier, head) {
    if (modifier.id === head.id) {
      return fail("A compound needs two different words.");
    }

    const pair = `${modifier.partOfSpeech}+${head.partOfSpeech}`;
    const resultPos = { "noun+noun": "noun", "adjective+noun": "noun", "noun+adjective": "adjective" }[pair];
    if (!resultPos) {
      return fail(
        `${modifier.partOfSpeech} + ${head.partOfSpeech} is not a compound pattern here. ` +
          `Try noun + noun, adjective + noun, or noun + adjective.`
      );
    }
    if (Math.max(depthOf(modifier), depthOf(head)) >= MAX_FORGE_DEPTH) {
      return fail("That word has been forged too many times to combine again.");
    }

    const closed = modifier.word + head.word;
    const word = closedCompounds.has(closed) ? closed : `${modifier.word}-${head.word}`;
    const resonance = modifier.element === head.element;
    const definition =
      modifier.partOfSpeech === "adjective"
        ? `a ${head.word} that is ${modifier.word}`
        : resultPos === "adjective"
          ? `${head.word} in the way of ${modifier.word}`
          : `a kind of ${head.word} connected to ${modifier.word}`;

    const result = {
      id: slug(word),
      word,
      partOfSpeech: resultPos,
      element: head.element,
      definition: capitalize(definition) + ".",
      example:
        resultPos === "noun"
          ? `The ${word} gleamed in the dark.`
          : `Her ${word} stare froze the room.`,
      forge: {
        layer: 2,
        process: "compounding",
        parts: [modifier.word, head.word],
        modifierId: modifier.id,
        headId: head.id,
        modifierElement: modifier.element,
        depth: Math.max(depthOf(modifier), depthOf(head)) + 1,
        resonance,
        powerBonus: COMPOUND_BONUS + (resonance ? RESONANCE_BONUS : 0),
      },
    };

    const closure = closedCompounds.has(closed)
      ? "Established compounds are written as one word."
      : "A newly coined compound is written with a hyphen.";
    const elementNote = resonance
      ? `Both words are ${head.element}, so the compound resonates for bonus power.`
      : `The head "${head.word}" decides the element (${head.element}); ` +
        `the modifier's ${modifier.element} is only a flavor.`;

    return {
      ok: true,
      kind: "compound",
      result,
      lesson:
        `In a compound the right-hand word is the head: a ${word} is a kind of ${head.word}, ` +
        `not a kind of ${modifier.word}. It is a ${resultPos}. ${closure} ${elementNote}`,
      reasons: [`${modifier.word} + ${head.word} → ${word}`],
    };
  }

  /* ---- Process 3: creature fusion -------------------------------- */

  function forgeCreature(modifier, creature) {
    const depth = creature.forged?.depth ?? 0;
    if (depth >= MAX_FORGE_DEPTH) {
      return fail(`${creature.name} has been fused too many times to change again.`);
    }
    if (depthOf(modifier) >= MAX_FORGE_DEPTH) {
      return fail(`"${modifier.word}" has been forged too many times to use here.`);
    }

    const head = creature.forged?.head ?? morphemes[creature.id]?.head ?? creature.name.toLowerCase();
    const modifierText = modifier.word.replace(/-/g, "");
    const name = capitalize(modifierText) + head;
    const resonance = modifier.element === creature.element;
    const stats = { ...creature.stats };

    // Nouns say what a thing is made of (offense); adjectives say how it is (defense).
    if (modifier.partOfSpeech === "noun") {
      stats.attack += 3;
    } else {
      stats.defense += 2;
      stats.hp += 4;
    }
    if (resonance) {
      stats.hp += 4;
    }

    const allowedElements = [...new Set([...creature.allowedElements, modifier.element])];

    const result = {
      ...creature,
      id: slug(name),
      name,
      element: modifier.element,
      description:
        `${creature.name} fused with "${modifier.word}": a kind of ${head} ` +
        `shaped by ${modifier.element}.`,
      stats,
      allowedWordTypes: [...creature.allowedWordTypes],
      allowedElements,
      forged: {
        layer: 2,
        process: "creature-compounding",
        modifier: modifierText,
        head,
        sourceId: creature.forged?.sourceId ?? creature.id,
        depth: depth + 1,
        resonance,
      },
    };

    const dual =
      allowedElements.length > 1
        ? ` ${name} can now speak ${allowedElements.join(" and ")} words.`
        : "";

    return {
      ok: true,
      kind: "creature-fusion",
      result,
      lesson:
        `"${name}" is a compound: modifier "${modifierText}" + head "${head}". ` +
        `The head says what it is (a ${head}); the modifier says what kind.${dual}`,
      reasons: [`${modifier.word} + ${creature.name} → ${name}`],
    };
  }

  /* ---- Public: fuse ----------------------------------------------- */

  /**
   * Combine two tokens in order (left, right). Order matters in morphology.
   * Returns { ok, kind, result, lesson, reasons }.
   */
  function fuse(left, right) {
    const a = resolve(left);
    const b = resolve(right);
    if (a.error || b.error) {
      return fail(a.error || b.error);
    }

    const pair = `${a.kind}+${b.kind}`;
    switch (pair) {
      case "affix+word":
        return forgeAffixation(a, b, true);
      case "word+affix":
        return forgeAffixation(b, a, false);
      case "word+word":
        return forgeCompound(a.entry, b.entry);
      case "word+creature":
        return forgeCreature(a.entry, b.entry);
      case "creature+word":
        return fail(
          `The head goes last in English compounds. Try "${b.entry.word}" + ${a.entry.name} ` +
            `to make a kind of ${morphemes[a.entry.id]?.head ?? a.entry.name.toLowerCase()}.`
        );
      case "affix+affix":
        return fail("Affixes need a base word to attach to.");
      case "creature+creature":
        return fail("Two creature heads can't share one body. Fuse a word into a creature instead.");
      default:
        return fail("Affixes attach to words, and words can fuse with words or creatures.");
    }
  }

  return {
    fuse,
    listAffixes: () => affixes.map((affix) => ({ ...affix })),
  };
}

/* ------------------------------------------------------------------ */
/* Committing results to catalogs (immutable)                          */
/* ------------------------------------------------------------------ */

/** Returns a new words catalog that includes the forged word (no duplicates). */
export function addForgedWord(words, entry) {
  const bucket = entry.partOfSpeech === "adjective" ? "adjectives" : "nouns";
  const exists = [...words.adjectives, ...words.nouns].some((word) => word.id === entry.id);
  if (exists) {
    return words;
  }
  return { ...words, [bucket]: [...words[bucket], entry] };
}

/** Returns a new creatures array that includes the forged creature (no duplicates). */
export function addForgedCreature(creatures, creature) {
  return creatures.some((entry) => entry.id === creature.id)
    ? creatures
    : [...creatures, creature];
}
