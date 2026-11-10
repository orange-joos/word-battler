import type { Affix, CatalogWords, Creature, ElementType, GradeTier } from '../types.ts';
import { ELEMENT_TYPES } from '../data/elements.ts';
import { INITIAL_AFFIXES, INITIAL_CREATURES, INITIAL_WORDS } from '../data/initialData.ts';
import { createForge, FORGE_BLUEPRINTS, getAllWordsList } from '../engine/forge.ts';

export interface LinguistQaReport {
  passed: boolean;
  totalWords: number;
  wordsByElement: Record<ElementType, number>;
  wordsByGradeTier: Record<GradeTier, number>;
  validAffixFusions: number;
  validBlueprintCount: number;
  totalBlueprints: number;
  issues: string[];
}

/**
 * Curriculum & Morphology QA Agent:
 * Audits vocabulary coverage, creature loadouts, affix respelling rules, and forge blueprints.
 */
export function runLinguistQaAudit(
  words: CatalogWords = INITIAL_WORDS,
  creatures: Creature[] = INITIAL_CREATURES,
  affixes: Affix[] = INITIAL_AFFIXES
): LinguistQaReport {
  const issues: string[] = [];
  const allWords = getAllWordsList(words);
  const wordIds = new Set(allWords.map((w) => w.id));

  const wordsByElement = Object.fromEntries(ELEMENT_TYPES.map((el) => [el, 0])) as Record<
    ElementType,
    number
  >;
  const wordsByGradeTier: Record<GradeTier, number> = {
    K: 0,
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
    extender: 0,
  };

  for (const w of allWords) {
    if (w.element in wordsByElement) {
      wordsByElement[w.element] += 1;
    } else {
      issues.push(`Word "${w.id}" has unrecognized element "${w.element}".`);
    }
    const tier = w.gradeTier || '3';
    wordsByGradeTier[tier] = (wordsByGradeTier[tier] || 0) + 1;

    if (!w.definition || w.definition.trim().length < 5) {
      issues.push(`Word "${w.id}" has an empty or overly short definition.`);
    }
    if (!w.example || w.example.trim().length < 5) {
      issues.push(`Word "${w.id}" is missing an example sentence.`);
    }
  }

  for (const el of ELEMENT_TYPES) {
    if (wordsByElement[el] === 0) {
      issues.push(`Element "${el}" has 0 vocabulary words in the catalog.`);
    }
  }

  // Verify every creature's equipped loadout words exist in the catalog
  for (const c of creatures) {
    if (!c.loadout) continue;
    for (const [slot, wordId] of Object.entries(c.loadout)) {
      if (wordId && !wordIds.has(wordId)) {
        issues.push(`Creature "${c.id}" loadout slot "${slot}" references missing word "${wordId}".`);
      }
    }
  }

  // Test all Affix x Word combinations and verify respelling rules
  const forge = createForge({ creatures, words, affixes });
  let validAffixFusions = 0;

  for (const affix of affixes) {
    for (const w of allWords) {
      if (!affix.from.includes(w.partOfSpeech)) continue;
      const left = affix.type === 'prefix' ? { kind: 'affix' as const, id: affix.id } : { kind: 'word' as const, id: w.id };
      const right = affix.type === 'prefix' ? { kind: 'word' as const, id: w.id } : { kind: 'affix' as const, id: affix.id };
      const res = forge.fuse(left, right);
      if (res.ok && res.result && 'word' in res.result) {
        validAffixFusions += 1;
        if (affix.respell.includes('dropSilentE') && /^[aeiou]/i.test(affix.text) && w.word.endsWith('e')) {
          const expected = w.word.slice(0, -1) + affix.text;
          if (res.result.word !== expected) {
            issues.push(`Drop-Silent-E mismatch for ${w.word} + -${affix.text}: got ${res.result.word}`);
          }
        }
      } else {
        issues.push(`Expected valid affixation for ${w.word} + ${affix.id}, but failed: ${res.reasons.join('; ')}`);
      }
    }
  }

  // Verify all canonical Forge Blueprints succeed
  let validBlueprintCount = 0;
  for (const bp of FORGE_BLUEPRINTS) {
    const res = forge.fuse(bp.token1, bp.token2);
    if (res.ok && res.result) {
      validBlueprintCount += 1;
    } else {
      issues.push(`Forge Blueprint "${bp.id}" (${bp.title}) failed: ${res.reasons.join(', ')}`);
    }
  }

  return {
    passed: issues.length === 0,
    totalWords: allWords.length,
    wordsByElement,
    wordsByGradeTier,
    validAffixFusions,
    validBlueprintCount,
    totalBlueprints: FORGE_BLUEPRINTS.length,
    issues,
  };
}
