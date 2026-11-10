import type {
  CatalogWords,
  Creature,
  ElementType,
  GameState,
  PetLoadout,
  Word,
} from '../types.ts';
import { ELEMENTS, ELEMENT_TYPES, normalizeElement } from '../data/elements.ts';
import { INITIAL_CREATURES, INITIAL_WORDS } from '../data/initialData.ts';
import { buildMergedVocabularyCatalog } from '../data/vocabDatabase.ts';
import { getAllWordsList } from './forge.ts';

export const UNIFIED_SAVE_KEY = 'wb_unified_save_v3';

export interface UnifiedProfileSave {
  version: 3;
  playerId: string;
  supportCreatureId: string;
  preferredGradeBand: 'all' | 'k-2' | '3-5' | '6-8';
  petAccessories: Record<string, string>;
  petSpecializations: Record<string, 'vanguard' | 'bastion'>;
  awakenedFossils: Record<string, boolean>;
  petBonds: Record<string, number>;
  bountiesClaimed: Record<string, boolean>;
  dyslexiaFriendly: boolean;
  calmAnimations: boolean;
  mistakeWords: string[];
  sanctuaryTheme: 'classic' | 'autumn' | 'frostfall' | 'starlight';
  ancientAmber: number;
  zoneProgress: Record<string, { stars: number; cleared: boolean }>;
  nodeProgress: Record<string, { stars: number; cleared: boolean }>;
  claimedMilestones: string[];
  recruitedZones: string[];
}

export const DEFAULT_ZONE_PROGRESS: Record<string, { stars: number; cleared: boolean }> = {
  'area-grass': { stars: 3, cleared: true },
  'area-water': { stars: 2, cleared: true },
  'area-earth': { stars: 1, cleared: false },
  'area-fire': { stars: 0, cleared: false },
  'area-ice': { stars: 0, cleared: false },
  'area-air': { stars: 0, cleared: false },
  'area-electric': { stars: 0, cleared: false },
  'area-shadow': { stars: 0, cleared: false },
  'area-light': { stars: 0, cleared: false },
  'root-village': { stars: 3, cleared: true },
  'prefix-path': { stars: 2, cleared: true },
  'suffix-steppes': { stars: 1, cleared: false },
  'compound-colosseum': { stars: 0, cleared: false },
  'syntax-spire': { stars: 0, cleared: false },
};

export const DEFAULT_NODE_PROGRESS: Record<string, { stars: number; cleared: boolean }> = {
  '1-1': { stars: 3, cleared: true },
  '1-2': { stars: 3, cleared: true },
  '1-3': { stars: 2, cleared: true },
  '2-1': { stars: 3, cleared: true },
};

function readJson<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadUnifiedProfileSave(): UnifiedProfileSave {
  const v3 = readJson<Partial<UnifiedProfileSave>>(UNIFIED_SAVE_KEY, {});
  const v2 = readJson<Record<string, any>>('aetheria_unified_save_v2', {});

  const legacyGradeBand =
    typeof localStorage !== 'undefined' ? localStorage.getItem('wb_grade_band') : null;
  const resolvedGradeBand =
    v3.preferredGradeBand ||
    v2.preferredGradeBand ||
    (legacyGradeBand === 'k-2' || legacyGradeBand === '3-5' || legacyGradeBand === '6-8'
      ? legacyGradeBand
      : 'all');

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return {
    version: 3,
    playerId:
      v3.playerId ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('wb_active_player_id') : null) ||
      'emberfox',
    supportCreatureId: v3.supportCreatureId || v2.supportCreatureId || 'aquafin',
    preferredGradeBand: resolvedGradeBand,
    petAccessories:
      v3.petAccessories ||
      v2.petAccessories ||
      readJson('wb_pet_accessories', { emberfox: 'amber_fang' }),
    petSpecializations:
      v3.petSpecializations || v2.petSpecializations || readJson('wb_pet_specs', {}),
    awakenedFossils: v3.awakenedFossils || v2.awakenedFossils || {},
    petBonds: v3.petBonds || v2.petBonds || { emberfox: 4, aquafin: 3 },
    bountiesClaimed: v3.bountiesClaimed || v2.bountiesClaimed || {},
    dyslexiaFriendly: Boolean(v3.dyslexiaFriendly ?? v2.dyslexiaFriendly ?? false),
    calmAnimations: Boolean(v3.calmAnimations ?? prefersReducedMotion),
    mistakeWords: v3.mistakeWords ||
      v2.mistakeWords || ['Their / There', 'Affect / Effect', 'Ferocious'],
    sanctuaryTheme: v3.sanctuaryTheme || v2.sanctuaryTheme || 'classic',
    ancientAmber: v3.ancientAmber ?? v2.ancientAmber ?? 18,
    zoneProgress: v3.zoneProgress || readJson('wb_zone_progress', DEFAULT_ZONE_PROGRESS),
    nodeProgress: v3.nodeProgress || readJson('wb_node_progress', DEFAULT_NODE_PROGRESS),
    claimedMilestones: v3.claimedMilestones || readJson('wb_star_milestones', []),
    recruitedZones: v3.recruitedZones || readJson('wb_recruited_zones', []),
  };
}

export function saveUnifiedProfileSave(save: UnifiedProfileSave): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(UNIFIED_SAVE_KEY, JSON.stringify(save));
  } catch {}
}

export function initializeWordsCatalog(): CatalogWords {
  try {
    if (typeof localStorage === 'undefined') return INITIAL_WORDS;
    const saved = localStorage.getItem('wb_words');
    if (!saved) return INITIAL_WORDS;
    const parsed = JSON.parse(saved);
    const normalizeWord = (word: Word): Word => ({
      ...word,
      element: normalizeElement(word.element),
      combatCategory:
        word.partOfSpeech === 'adjective'
          ? word.combatCategory === 'DEBUFF'
            ? 'DEBUFF'
            : 'BUFF'
          : undefined,
    });

    const mergeList = (base: Word[] = [], extra: unknown): Word[] => {
      const merged = [...base];
      if (Array.isArray(extra)) {
        for (const item of extra.map(normalizeWord)) {
          if (!merged.some((existing) => existing.id === item.id)) {
            merged.push(item);
          }
        }
      }
      return merged;
    };

    return buildMergedVocabularyCatalog({
      adjectives: mergeList(INITIAL_WORDS.adjectives, parsed.adjectives),
      nouns: mergeList(INITIAL_WORDS.nouns, parsed.nouns),
      verbs: mergeList(INITIAL_WORDS.verbs, parsed.verbs),
      adverbs: mergeList(INITIAL_WORDS.adverbs, parsed.adverbs),
    });
  } catch {
    return INITIAL_WORDS;
  }
}

export function initializeCreaturesRoster(): Creature[] {
  try {
    if (typeof localStorage === 'undefined') return INITIAL_CREATURES;
    const saved = localStorage.getItem('wb_creatures');
    if (!saved) return INITIAL_CREATURES;
    const parsed: Creature[] = JSON.parse(saved);
    const allElements: ElementType[] = [...ELEMENT_TYPES];

    const updated: Creature[] = parsed.map((c) => {
      const existingTypes = new Set(c.allowedWordTypes || []);
      existingTypes.add('adjective');
      existingTypes.add('noun');
      existingTypes.add('verb');
      existingTypes.add('adverb');

      const initialMatch = INITIAL_CREATURES.find((init) => init.id === c.id);
      const element = normalizeElement(c.element);
      const elementAffinity =
        c.id === 'boss_sovereign' && element === 'light'
          ? 'light'
          : normalizeElement(c.elementAffinity || initialMatch?.elementAffinity || element);
      const loadout: PetLoadout =
        c.loadout && typeof c.loadout === 'object'
          ? {
              verb: c.loadout.verb ?? (initialMatch?.loadout?.verb || null),
              noun: c.loadout.noun ?? (initialMatch?.loadout?.noun || null),
              adjective: c.loadout.adjective ?? (initialMatch?.loadout?.adjective || null),
              adverb: c.loadout.adverb ?? (initialMatch?.loadout?.adverb || null),
            }
          : initialMatch?.loadout || { verb: null, noun: null, adjective: null, adverb: null };

      return {
        ...c,
        element,
        elementAffinity,
        allowedElements: allElements,
        // Reset base stats from initialMatch if available so legacy in-place mutations don't stack
        stats: initialMatch ? { ...initialMatch.stats } : { ...c.stats },
        level: c.level || initialMatch?.level || 8,
        exp: c.exp ?? (initialMatch?.exp ?? 100),
        maxExp: c.maxExp || initialMatch?.maxExp || 160,
        stage: c.stage || initialMatch?.stage || 1,
        evolvesAtLevel: c.evolvesAtLevel || initialMatch?.evolvesAtLevel || 10,
        spriteEmoji: c.spriteEmoji || initialMatch?.spriteEmoji || ELEMENTS[element].icon,
        title: c.title || initialMatch?.title || 'Companion Beast',
        loadout,
        allowedWordTypes: Array.from(existingTypes),
      };
    });

    for (const initC of INITIAL_CREATURES) {
      if (!updated.some((c) => c.id === initC.id)) {
        updated.push(initC);
      }
    }

    return updated;
  } catch {
    return INITIAL_CREATURES;
  }
}

export function initializeCoreGameState(): GameState {
  const saved = readJson<Partial<GameState>>('wb_game_state', {});
  const profile = readJson<{ lexiCoins?: number; fusionTokens?: number }>('wb_player_profile', {});
  return {
    activeScreen: 'auth',
    coins: typeof profile.lexiCoins === 'number' ? profile.lexiCoins : 0,
    fusionTokens: typeof profile.fusionTokens === 'number' ? profile.fusionTokens : 0,
    unlockedPetIds: Array.isArray(saved.unlockedPetIds)
      ? saved.unlockedPetIds
      : INITIAL_CREATURES.filter((creature) => !creature.id.startsWith('boss_')).map(
          (creature) => creature.id
        ),
    wordInventory: getAllWordsList(INITIAL_WORDS).map((word) => word.id),
  };
}
