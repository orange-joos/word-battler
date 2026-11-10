import type { CatalogWords, ComboEvaluation, GradeTier, Word } from '../types.ts';
import { getAllWordsList } from '../engine/forge.ts';

export type LinguisticErrorCategory =
  | 'word-order-adj-noun'
  | 'word-order-adv-verb'
  | 'standalone-adverb'
  | 'homophone-confusion'
  | 'morphology-affix'
  | 'general-vocabulary';

export interface TutorInsight {
  category: LinguisticErrorCategory;
  badgeLabel: string;
  coachTip: string;
  recommendedWords: Word[];
  nextDrillPrompt: string;
}

const BAND_TO_TIERS: Record<'all' | 'k-2' | '3-5' | '6-8', GradeTier[]> = {
  all: ['K', '1', '2', '3', '4', '5', 'extender'],
  'k-2': ['K', '1', '2'],
  '3-5': ['3', '4', '5'],
  '6-8': ['5', 'extender'],
};

/**
 * Classifies a student's invalid combo or mistake entry into a specific linguistic learning objective.
 */
export function classifyComboMistake(combo: ComboEvaluation): {
  category: LinguisticErrorCategory;
  mistakeLabel: string;
} | null {
  if (combo.valid) return null;
  const reason = (combo.reasons[0] || '').toLowerCase();

  if (reason.includes('adjective first and the noun second')) {
    return {
      category: 'word-order-adj-noun',
      mistakeLabel: `Order: ${combo.word2?.word || 'Adjective'} + ${combo.word1?.word || 'Noun'}`,
    };
  }
  if (reason.includes('adverb first and the verb second')) {
    return {
      category: 'word-order-adv-verb',
      mistakeLabel: `Order: ${combo.word2?.word || 'Adverb'} + ${combo.word1?.word || 'Verb'}`,
    };
  }
  if (reason.includes('adverbs modify verbs')) {
    return {
      category: 'standalone-adverb',
      mistakeLabel: `Adverb + Verb (${combo.word1?.word || 'fiercely'} + verb)`,
    };
  }
  return {
    category: 'general-vocabulary',
    mistakeLabel: combo.phrase !== '—' ? combo.phrase : 'Modifier + Head Combo',
  };
}

/**
 * Adaptive Tutor Agent:
 * Inspects the student's current mistake deck and grade band to surface personalized coaching and practice tablets.
 */
export function getAdaptiveTutorInsight(
  mistakeWords: string[],
  words: CatalogWords,
  preferredGradeBand: 'all' | 'k-2' | '3-5' | '6-8' = 'all'
): TutorInsight {
  const allWords = getAllWordsList(words);
  const allowedTiers = BAND_TO_TIERS[preferredGradeBand] || BAND_TO_TIERS.all;
  const gradePool = allWords.filter((w) => allowedTiers.includes(w.gradeTier || '3'));
  const pool = gradePool.length >= 4 ? gradePool : allWords;

  const latest = (mistakeWords[0] || '').toLowerCase();

  if (latest.includes('/') || latest.includes('their') || latest.includes('affect')) {
    const practice = pool.filter((w) => w.partOfSpeech === 'noun' || w.partOfSpeech === 'verb').slice(0, 3);
    return {
      category: 'homophone-confusion',
      badgeLabel: 'Homophone & Context Coach',
      coachTip:
        'Homophones sound identical but have different spellings and jobs! Check whether the sentence needs a Noun ("effect") or an Action Verb ("affect").',
      recommendedWords: practice,
      nextDrillPrompt: 'Try pairing an Adjective + Noun shield combo to lock in noun context!',
    };
  }

  if (latest.includes('adverb') || latest.includes('ly')) {
    const practice = [
      ...pool.filter((w) => w.partOfSpeech === 'adverb').slice(0, 2),
      ...pool.filter((w) => w.partOfSpeech === 'verb').slice(0, 1),
    ];
    return {
      category: 'standalone-adverb',
      badgeLabel: 'Adverbial Tempo Coach',
      coachTip:
        'Adverbs (often ending in "-ly") tell HOW an action happens. Always pair an Adverb in Slot 1 with a Verb in Slot 2 for a Critical Strike!',
      recommendedWords: practice,
      nextDrillPrompt: 'Select [Adverb] + [Verb] (e.g., "fiercely ignite") on your next turn!',
    };
  }

  if (latest.includes('order:')) {
    const practice = [
      ...pool.filter((w) => w.partOfSpeech === 'adjective').slice(0, 2),
      ...pool.filter((w) => w.partOfSpeech === 'noun').slice(0, 1),
    ];
    return {
      category: 'word-order-adj-noun',
      badgeLabel: 'English Syntax Coach',
      coachTip:
        'In English phrases, the descriptive modifier comes BEFORE the head word: [Adjective → Noun] for Shields, or [Adverb → Verb] for Strikes.',
      recommendedWords: practice,
      nextDrillPrompt: 'Weave a 2-word combo with the modifier first and the head word second!',
    };
  }

  const forgedOrTiered = pool.filter((w) => w.forge || (w.powerBonus && w.powerBonus >= 4)).slice(0, 3);
  return {
    category: 'general-vocabulary',
    badgeLabel: 'Morphology Mastery Coach',
    coachTip:
      mistakeWords.length > 0
        ? `Reviewing "${mistakeWords[0]}": try weaving it into a full 4-card sentence [Adjective + Noun + Verb + Adverb] for +6 Synergy!`
        : 'All Field Journal words mastered! Visit the Word Forge to chisel higher-tier prefix and suffix tablets.',
    recommendedWords: forgedOrTiered.length > 0 ? forgedOrTiered : pool.slice(0, 3),
    nextDrillPrompt: 'Cast a 4-Card Ultimate Sentence Weave to trigger Syntax Surge!',
  };
}
