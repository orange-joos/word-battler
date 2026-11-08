import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Creature, Word, CatalogWords, BattleState, TabType, PartOfSpeech, PetLoadout, ElementType, GameScreen, GameState, GradeTier } from '../types';
import { INITIAL_CREATURES, INITIAL_WORDS } from '../data/initialData';
import { ELEMENTS } from '../data/elements';
import { createBattle } from '../engine/combat';
import { addForgedCreature, addForgedWord, getAllWordsList } from '../engine/forge';
import { juice } from '../engine/juice';
import { applyEvolution } from '../data/evolutionData';
import { createStarterCreature } from '../data/starterPets';
import { buildMergedVocabularyCatalog } from '../data/vocabDatabase';
import { useAuth } from './AuthContext';

interface GameContextType {
  gameState: GameState;
  setActiveScreen: (screen: GameScreen) => void;
  selectStarterPet: (element: ElementType) => void;
  tab: TabType;
  setTab: (tab: TabType) => void;
  creatures: Creature[];
  words: CatalogWords;
  playerId: string;
  setPlayerId: (id: string) => void;
  isMuted: boolean;
  toggleMute: () => void;
  battleState: BattleState;
  submitCombo: (
    word1Id: string,
    word2Id?: string | null,
    word3Id?: string | null,
    word4Id?: string | null
  ) => void;
  restartBattle: (newPlayerId?: string) => void;
  commitWord: (word: Word) => void;
  commitCreature: (creature: Creature) => void;
  goToBattle: () => void;
  goToLoadout: () => void;
  useCreatureInBattle: (id: string) => void;
  updatePetLoadout: (petId: string, slot: PartOfSpeech, wordId: string | null) => void;
  autoEquipBestLoadout: (petId: string, preferredTier?: GradeTier | 'all') => void;
  levelUpPet: (petId: string, levels?: number) => void;
  feedPetStatTreat: (petId: string, stat: 'hp' | 'attack' | 'defense' | 'speed') => void;
  recruitWildCompanion: (zoneId: string) => Creature | null;
  trainPetWithCoins: (petId: string, coinCost?: number) => { success: boolean; error?: string };
  evolvePet: (petId: string) => { success: boolean; evolvedCreature: Creature };
  activeZoneId: string;
  setActiveZoneId: (zoneId: string) => void;
  activeNodeId: string;
  setActiveNodeId: (nodeId: string) => void;
  activeEnemyName: string | null;
  activeEnemyStage: 1 | 2 | 3;
  enemyId: string;
  setEnemyId: (id: string) => void;
  zoneProgress: Record<string, { stars: number; cleared: boolean }>;
  nodeProgress: Record<string, { stars: number; cleared: boolean }>;
  startBattleInZone: (zoneId: string, customEnemyId?: string) => void;
  startBattleAtNode: (
    zoneId: string,
    nodeId: string,
    customEnemyId?: string,
    customEnemyName?: string,
    customStage?: 1 | 2 | 3
  ) => void;
  completeZone: (zoneId: string, stars?: number) => void;
  completeMapNode: (zoneId: string, nodeId: string, stars?: number) => void;
  returnToWordWorldMap: boolean;
  setReturnToWordWorldMap: (val: boolean) => void;
  preferredGradeBand: 'all' | 'k-2' | '3-5' | '6-8';
  setPreferredGradeBand: (band: 'all' | 'k-2' | '3-5' | '6-8') => void;
  activeWeather: {
    id: string;
    name: string;
    element: ElementType;
    icon: string;
    effectLabel: string;
  };
  cycleRealmWeather: () => void;
  petAccessories: Record<string, string>;
  equipPetAccessory: (petId: string, accessoryId: string) => void;
  petSpecializations: Record<string, 'vanguard' | 'bastion'>;
  setPetSpecialization: (petId: string, branch: 'vanguard' | 'bastion') => void;
  supportCreatureId: string;
  setSupportCreatureId: (id: string) => void;
  awakenedFossils: Record<string, boolean>;
  awakenPrehistoricCompanion: (element: ElementType) => Creature;
  petBonds: Record<string, number>;
  increasePetBond: (petId: string, amount?: number) => void;
  bountiesClaimed: Record<string, boolean>;
  claimBounty: (bountyId: string) => void;
  dyslexiaFriendly: boolean;
  setDyslexiaFriendly: (val: boolean) => void;
  mistakeWords: string[];
  addMistakeWord: (word: string) => void;
  masterMistakeWord: (word: string) => void;
  sanctuaryTheme: 'classic' | 'autumn' | 'frostfall' | 'starlight';
  setSanctuaryTheme: (theme: 'classic' | 'autumn' | 'frostfall' | 'starlight') => void;
  ancientAmber: number;
  addAncientAmber: (delta: number) => void;
  advanceToNextNode: () => { zoneId: string; nextNodeId: string } | null;
  resetAll: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

function initializeWords(): CatalogWords {
  try {
    const saved = localStorage.getItem('wb_words');
    if (!saved) return INITIAL_WORDS;
    const parsed = JSON.parse(saved);
    const normalizeWord = (word: Word): Word => ({
      ...word,
      element: normalizeElement(word.element),
      combatCategory:
        word.partOfSpeech === 'adjective'
          ? word.combatCategory === 'DEBUFF' ? 'DEBUFF' : 'BUFF'
          : undefined,
    });

    const baseVerbs = INITIAL_WORDS.verbs || [];
    const savedVerbs = Array.isArray(parsed.verbs) ? parsed.verbs.map(normalizeWord) : [];
    const mergedVerbs = [...baseVerbs];
    for (const v of savedVerbs) {
      if (!mergedVerbs.some((existing) => existing.id === v.id)) {
        mergedVerbs.push(v);
      }
    }

    const baseAdverbs = INITIAL_WORDS.adverbs || [];
    const savedAdverbs = Array.isArray(parsed.adverbs) ? parsed.adverbs.map(normalizeWord) : [];
    const mergedAdverbs = [...baseAdverbs];
    for (const a of savedAdverbs) {
      if (!mergedAdverbs.some((existing) => existing.id === a.id)) {
        mergedAdverbs.push(a);
      }
    }

    const baseAdj = INITIAL_WORDS.adjectives || [];
    const savedAdj = Array.isArray(parsed.adjectives) ? parsed.adjectives.map(normalizeWord) : [];
    const mergedAdj = [...baseAdj];
    for (const adj of savedAdj) {
      if (!mergedAdj.some((existing) => existing.id === adj.id)) {
        mergedAdj.push(adj);
      }
    }

    const baseNouns = INITIAL_WORDS.nouns || [];
    const savedNouns = Array.isArray(parsed.nouns) ? parsed.nouns.map(normalizeWord) : [];
    const mergedNouns = [...baseNouns];
    for (const n of savedNouns) {
      if (!mergedNouns.some((existing) => existing.id === n.id)) {
        mergedNouns.push(n);
      }
    }

    return buildMergedVocabularyCatalog({
      adjectives: mergedAdj,
      nouns: mergedNouns,
      verbs: mergedVerbs,
      adverbs: mergedAdverbs,
    });
  } catch {
    return INITIAL_WORDS;
  }
}

function normalizeElement(element: string): ElementType {
  if (element === 'nature') return 'grass';
  if (element === 'cosmic') return 'light';
  return element in ELEMENTS ? (element as ElementType) : 'fire';
}

function initializeCreatures(): Creature[] {
  try {
    const saved = localStorage.getItem('wb_creatures');
    if (!saved) return INITIAL_CREATURES;
    const parsed: Creature[] = JSON.parse(saved);

    const allElements: ElementType[] = [
      'fire',
      'water',
      'ice',
      'grass',
      'electric',
      'shadow',
      'light',
      'earth',
      'air',
      'nature',
      'cosmic',
    ];

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

function initializeGameState(): GameState {
  try {
    const saved = JSON.parse(localStorage.getItem('wb_game_state') || '{}');
    const profile = JSON.parse(localStorage.getItem('wb_player_profile') || '{}');
    return {
      activeScreen: 'auth',
      coins: typeof profile.lexiCoins === 'number' ? profile.lexiCoins : 0,
      fusionTokens: typeof profile.fusionTokens === 'number' ? profile.fusionTokens : 0,
      unlockedPetIds: Array.isArray(saved.unlockedPetIds)
        ? saved.unlockedPetIds
        : INITIAL_CREATURES.filter((creature) => !creature.id.startsWith('boss_')).map((creature) => creature.id),
      wordInventory: getAllWordsList(INITIAL_WORDS).map((word) => word.id),
    };
  } catch {
    return {
      activeScreen: 'auth',
      coins: 0,
      fusionTokens: 0,
      unlockedPetIds: INITIAL_CREATURES.filter((creature) => !creature.id.startsWith('boss_')).map((creature) => creature.id),
      wordInventory: getAllWordsList(INITIAL_WORDS).map((word) => word.id),
    };
  }
}

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [gameState, setGameState] = useState<GameState>(initializeGameState);
  const [tab, setTab] = useState<TabType>('hub');
  const [creatures, setCreatures] = useState<Creature[]>(initializeCreatures);
  const [words, setWords] = useState<CatalogWords>(initializeWords);
  const [playerId, setPlayerIdState] = useState<string>(() => {
    try {
      return localStorage.getItem('wb_active_player_id') || 'emberfox';
    } catch {
      return 'emberfox';
    }
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const setActiveScreen = (activeScreen: GameScreen) => {
    setGameState((previous) => ({ ...previous, activeScreen }));
  };

  const setPlayerId = (id: string) => {
    setPlayerIdState(id);
    try {
      localStorage.setItem('wb_active_player_id', id);
    } catch {}
  };

  const selectStarterPet = (element: ElementType) => {
    const starterPet =
      creatures.find(
        (creature) => creature.element === element && !creature.id.startsWith('boss_')
      ) || createStarterCreature(element, getAllWordsList(words));

    if (!creatures.some((creature) => creature.id === starterPet.id)) {
      setCreatures((previous) => [...previous, starterPet]);
    }

    setPlayerId(starterPet.id);
    setGameState((previous) => ({
      ...previous,
      activeScreen: 'tutorial',
      unlockedPetIds: Array.from(new Set([...previous.unlockedPetIds, starterPet.id])),
    }));
  };

  useEffect(() => {
    setGameState((previous) => ({
      ...previous,
      coins: currentUser?.lexiCoins ?? 0,
      fusionTokens: currentUser?.fusionTokens ?? 0,
    }));
  }, [currentUser?.id, currentUser?.lexiCoins, currentUser?.fusionTokens]);

  useEffect(() => {
    setGameState((previous) => ({
      ...previous,
      wordInventory: getAllWordsList(words).map((word) => word.id),
    }));
  }, [words]);

  useEffect(() => {
    try {
      localStorage.setItem('wb_game_state', JSON.stringify(gameState));
    } catch {}
  }, [gameState]);

  useEffect(() => {
    try {
      localStorage.setItem('wb_creatures', JSON.stringify(creatures));
    } catch {}
  }, [creatures]);

  useEffect(() => {
    try {
      localStorage.setItem('wb_words', JSON.stringify(words));
    } catch {}
  }, [words]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    juice.setMuted(next);
  };

  const [activeZoneId, setActiveZoneId] = useState<string>('area-grass');
  const [activeNodeId, setActiveNodeId] = useState<string>('1-1');
  const [activeEnemyName, setActiveEnemyName] = useState<string | null>(null);
  const [activeEnemyStage, setActiveEnemyStage] = useState<1 | 2 | 3>(3);
  const [returnToWordWorldMap, setReturnToWordWorldMap] = useState<boolean>(false);
  const [preferredGradeBand, setPreferredGradeBandState] = useState<'all' | 'k-2' | '3-5' | '6-8'>(() => {
    try {
      const saved = localStorage.getItem('wb_grade_band');
      if (saved === 'k-2' || saved === '3-5' || saved === '6-8') return saved;
    } catch {}
    return 'all';
  });

  const setPreferredGradeBand = (band: 'all' | 'k-2' | '3-5' | '6-8') => {
    setPreferredGradeBandState(band);
    try {
      localStorage.setItem('wb_grade_band', band);
    } catch {}
  };

  // Feature #4: Rotating Realm Weather & Elemental Tide Shifts
  const REALM_WEATHERS: {
    id: string;
    name: string;
    element: ElementType;
    icon: string;
    effectLabel: string;
  }[] = [
    {
      id: 'solar-flare',
      name: 'Solar Flare',
      element: 'fire',
      icon: '☀️',
      effectLabel: 'Fire & Light Tablets +25% Power',
    },
    {
      id: 'monsoon-tide',
      name: 'Monsoon Tide',
      element: 'water',
      icon: '🌊',
      effectLabel: 'Water & Grass Tablets +25% Power',
    },
    {
      id: 'crystal-blizzard',
      name: 'Crystal Blizzard',
      element: 'ice',
      icon: '🌨️',
      effectLabel: 'Ice & Air Tablets +25% Power',
    },
    {
      id: 'meteor-shower',
      name: 'Meteor Shower',
      element: 'earth',
      icon: '☄️',
      effectLabel: 'Earth & Shadow Tablets +25% Power',
    },
    {
      id: 'ion-tempest',
      name: 'Ion Tempest',
      element: 'electric',
      icon: '🌩️',
      effectLabel: 'Electric & Air Tablets +25% Power',
    },
  ];
  const [weatherIndex, setWeatherIndex] = useState<number>(0);
  const activeWeather = REALM_WEATHERS[weatherIndex % REALM_WEATHERS.length];

  const cycleRealmWeather = () => {
    setWeatherIndex((prev) => (prev + 1) % REALM_WEATHERS.length);
    juice.ding(740, 120);
  };

  // Feature #10: Companion Accessories & Battle Armor Slots
  const [petAccessories, setPetAccessories] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('wb_pet_accessories');
      return saved ? JSON.parse(saved) : { emberfox: 'amber_fang' };
    } catch {
      return { emberfox: 'amber_fang' };
    }
  });

  const equipPetAccessory = (petId: string, accessoryId: string) => {
    setPetAccessories((prev) => {
      const next = { ...prev, [petId]: accessoryId };
      try {
        localStorage.setItem('wb_pet_accessories', JSON.stringify(next));
      } catch {}
      return next;
    });
    // Also grant a small permanent stat boost when equipping new armor
    setCreatures((prev) =>
      prev.map((c) => {
        if (c.id !== petId) return c;
        return {
          ...c,
          stats: {
            hp: c.stats.hp + (accessoryId === 'root_crown' ? 4 : 1),
            attack: c.stats.attack + (accessoryId === 'amber_fang' ? 3 : 1),
            defense: c.stats.defense + (accessoryId === 'iron_shell' ? 3 : 1),
            speed: c.stats.speed + (accessoryId === 'zephyr_band' ? 3 : 1),
          },
        };
      })
    );
    juice.ding(920, 130);
  };

  // Feature #11: Branching Stage-3 Evolution Paths (Vanguard Power vs. Bastion Wisdom)
  const [petSpecializations, setPetSpecializations] = useState<
    Record<string, 'vanguard' | 'bastion'>
  >(() => {
    try {
      const saved = localStorage.getItem('wb_pet_specs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const setPetSpecialization = (petId: string, branch: 'vanguard' | 'bastion') => {
    setPetSpecializations((prev) => {
      const next = { ...prev, [petId]: branch };
      try {
        localStorage.setItem('wb_pet_specs', JSON.stringify(next));
      } catch {}
      return next;
    });
    setCreatures((prev) =>
      prev.map((c) => {
        if (c.id !== petId) return c;
        return {
          ...c,
          title: branch === 'vanguard' ? 'Vanguard Strike Form' : 'Bastion Guardian Form',
          stats: {
            hp: c.stats.hp + (branch === 'bastion' ? 6 : 2),
            attack: c.stats.attack + (branch === 'vanguard' ? 4 : 1),
            defense: c.stats.defense + (branch === 'bastion' ? 4 : 1),
            speed: c.stats.speed + (branch === 'vanguard' ? 3 : 1),
          },
        };
      })
    );
    juice.fanfare();
  };

  // Efficiency #8: Unified Profile State Loader
  const unifiedInitial = useMemo(() => {
    try {
      const raw = localStorage.getItem('aetheria_unified_save_v2');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  // Feature #5: Dual-Companion Tag-Team Support Slot
  const [supportCreatureId, setSupportCreatureId] = useState<string>(
    () => unifiedInitial.supportCreatureId || 'aquafin'
  );

  // Feature #12: Fossil Awakening (Prehistoric Companion Revival)
  const [awakenedFossils, setAwakenedFossils] = useState<Record<string, boolean>>(
    () => unifiedInitial.awakenedFossils || {}
  );

  const awakenPrehistoricCompanion = (element: ElementType): Creature => {
    const PREHISTORIC_NAMES: Record<string, { name: string; title: string; emoji: string }> = {
      fire: { name: 'Pyroraptor Rex', title: 'Ancient Magma Saurian', emoji: '🦖' },
      water: { name: 'Plesiocrest', title: 'Tidal Abyssal Fossil', emoji: '🦕' },
      grass: { name: 'Ferntops', title: 'Primeval Canopy Horn', emoji: '🌿' },
      earth: { name: 'Ankylostone', title: 'Bedrock Bastion Titan', emoji: '🪨' },
      ice: { name: 'Mammothfrost', title: 'Glacial Tusk Ancient', emoji: '🦣' },
      air: { name: 'Pterogale', title: 'Skycrest Wing Fossil', emoji: '🦅' },
      electric: { name: 'Voltadon', title: 'Amber Spark Crest', emoji: '⚡' },
      shadow: { name: 'Nyxosaurus', title: 'Twilight Obsidian Stalker', emoji: '🐉' },
      light: { name: 'Solarchaeon', title: 'Dawnfeather Relic', emoji: '✨' },
    };
    const meta = PREHISTORIC_NAMES[element] || PREHISTORIC_NAMES.fire;
    const fossilId = `fossil_${element}`;
    setAwakenedFossils((prev) => ({ ...prev, [element]: true }));

    const existing = creatures.find((c) => c.id === fossilId);
    if (existing) {
      levelUpPet(fossilId, 2);
      return existing;
    }

    const base = createStarterCreature(element, getAllWordsList(words));
    const awakened: Creature = {
      ...base,
      id: fossilId,
      name: meta.name,
      title: meta.title,
      spriteEmoji: meta.emoji,
      level: 12,
      stage: 2,
      stats: {
        hp: 115,
        attack: 22,
        defense: 19,
        speed: 17,
      },
    };
    setCreatures((prev) => [...prev, awakened]);
    setGameState((prev) => ({
      ...prev,
      unlockedPetIds: Array.from(new Set([...prev.unlockedPetIds, fossilId])),
    }));
    juice.fanfare();
    return awakened;
  };

  // Feature #13: Companion Bond & Mood Meter
  const [petBonds, setPetBonds] = useState<Record<string, number>>(
    () => unifiedInitial.petBonds || { emberfox: 4, aquafin: 3 }
  );

  const increasePetBond = (petId: string, amount = 1) => {
    setPetBonds((prev) => ({
      ...prev,
      [petId]: Math.min(10, (prev[petId] || 1) + amount),
    }));
  };

  // Feature #15: Daily Expedition Bounty Board
  const [bountiesClaimed, setBountiesClaimed] = useState<Record<string, boolean>>(
    () => unifiedInitial.bountiesClaimed || {}
  );

  const claimBounty = (bountyId: string) => {
    setBountiesClaimed((prev) => ({ ...prev, [bountyId]: true }));
    juice.fanfare();
  };

  // Feature #18: Dyslexia-Friendly Typography & High-Contrast Toggle
  const [dyslexiaFriendly, setDyslexiaFriendly] = useState<boolean>(
    () => Boolean(unifiedInitial.dyslexiaFriendly)
  );

  // Feature #19: Mistake Review "Field Journal" Deck
  const [mistakeWords, setMistakeWords] = useState<string[]>(
    () => unifiedInitial.mistakeWords || ['Their / There', 'Affect / Effect', 'Ferocious']
  );

  const addMistakeWord = (word: string) => {
    setMistakeWords((prev) => (prev.includes(word) ? prev : [word, ...prev].slice(0, 12)));
  };

  const masterMistakeWord = (word: string) => {
    setMistakeWords((prev) => prev.filter((w) => w !== word));
    juice.fanfare();
  };

  // Feature #20: Seasonal & Holiday Sanctuary Themes
  const [sanctuaryTheme, setSanctuaryTheme] = useState<'classic' | 'autumn' | 'frostfall' | 'starlight'>(
    () => unifiedInitial.sanctuaryTheme || 'classic'
  );

  // Efficiency #10: Universal Ancient Amber currency
  const [ancientAmber, setAncientAmber] = useState<number>(
    () => unifiedInitial.ancientAmber ?? 18
  );

  const addAncientAmber = (delta: number) => {
    setAncientAmber((prev) => Math.max(0, prev + delta));
  };

  // Efficiency #8: Consolidate persistence into single unified save key
  useEffect(() => {
    try {
      localStorage.setItem(
        'aetheria_unified_save_v2',
        JSON.stringify({
          supportCreatureId,
          awakenedFossils,
          petBonds,
          bountiesClaimed,
          dyslexiaFriendly,
          mistakeWords,
          sanctuaryTheme,
          ancientAmber,
          petAccessories,
          petSpecializations,
          preferredGradeBand,
        })
      );
    } catch {}
  }, [
    supportCreatureId,
    awakenedFossils,
    petBonds,
    bountiesClaimed,
    dyslexiaFriendly,
    mistakeWords,
    sanctuaryTheme,
    ancientAmber,
    petAccessories,
    petSpecializations,
    preferredGradeBand,
  ]);

  const [enemyId, setEnemyId] = useState<string>('boss_galecrest');
  const [zoneProgress, setZoneProgress] = useState<Record<string, { stars: number; cleared: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('wb_zone_progress');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
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
  });

  const [nodeProgress, setNodeProgress] = useState<Record<string, { stars: number; cleared: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('wb_node_progress');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      '1-1': { stars: 3, cleared: true },
      '1-2': { stars: 3, cleared: true },
      '1-3': { stars: 2, cleared: true },
      '2-1': { stars: 3, cleared: true },
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('wb_zone_progress', JSON.stringify(zoneProgress));
    } catch {}
  }, [zoneProgress]);

  useEffect(() => {
    try {
      localStorage.setItem('wb_node_progress', JSON.stringify(nodeProgress));
    } catch {}
  }, [nodeProgress]);

  const completeZone = (zoneId: string, stars = 3) => {
    setZoneProgress((prev) => {
      const current = prev[zoneId] || { stars: 0, cleared: false };
      return {
        ...prev,
        [zoneId]: {
          stars: Math.max(current.stars, stars),
          cleared: true,
        },
      };
    });
  };

  const completeMapNode = (zoneId: string, nodeId: string, stars = 3) => {
    setNodeProgress((prev) => {
      const current = prev[nodeId] || { stars: 0, cleared: false };
      return {
        ...prev,
        [nodeId]: {
          stars: Math.max(current.stars, Math.min(3, Math.max(1, stars))),
          cleared: true,
        },
      };
    });

    const stageNum = Number(nodeId.split('-')[1] || 1);
    if (stageNum >= 10) {
      completeZone(zoneId, stars);
    } else {
      setZoneProgress((prev) => {
        const current = prev[zoneId] || { stars: 0, cleared: false };
        return {
          ...prev,
          [zoneId]: {
            stars: Math.max(current.stars, Math.min(3, stars)),
            cleared: current.cleared,
          },
        };
      });
    }
  };

  // Combat Engine Instance
  const battleEngine = useMemo(() => {
    return createBattle({
      playerId,
      enemyId,
      creatures,
      words,
    });
  }, [playerId, enemyId, creatures, words]);

  const [battleState, setBattleState] = useState<BattleState>(() => battleEngine.getState());

  // Sync battleState ONLY when playerId or enemyId changes so mid-battle loadout edits do not reset HP!
  useEffect(() => {
    setBattleState(battleEngine.getState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, enemyId]);

  const ZONE_TO_BOSS: Record<string, string> = {
    'area-grass': 'boss_galecrest',
    'area-water': 'boss_leviathan',
    'area-earth': 'boss_ruptor',
    'area-fire': 'boss_pyrostorm',
    'area-ice': 'boss_dishornet',
    'area-air': 'boss_zephyrlord',
    'area-electric': 'boss_voltarchon',
    'area-shadow': 'boss_umbralord',
    'area-light': 'boss_sovereign',
    // Legacy & Island aliases
    'root-village': 'boss_ruptor',
    'prefix-path': 'boss_dishornet',
    'prefix-peaks': 'boss_dishornet',
    'suffix-steppes': 'boss_galecrest',
    'sunfall-dunes': 'boss_ruptor',
    'compound-colosseum': 'boss_pyrostorm',
    'fireforge': 'boss_pyrostorm',
    'syntax-spire': 'boss_sovereign',
    'celestia': 'boss_sovereign',
  };

  const startBattleInZone = (zoneId: string, customEnemyId?: string) => {
    setActiveZoneId(zoneId);
    setActiveEnemyName(null);
    setActiveEnemyStage(3);
    const chosenEnemy = customEnemyId || ZONE_TO_BOSS[zoneId] || 'boss_ruptor';

    setEnemyId(chosenEnemy);
    const freshBattle = createBattle({
      playerId,
      enemyId: chosenEnemy,
      creatures,
      words,
    });
    setBattleState(freshBattle.getState());
    juice.fanfare();
    setTab('battle');
  };

  const startBattleAtNode = (
    zoneId: string,
    nodeId: string,
    customEnemyId?: string,
    customEnemyName?: string,
    customStage?: 1 | 2 | 3
  ) => {
    setActiveZoneId(zoneId);
    setActiveNodeId(nodeId);
    setReturnToWordWorldMap(true);
    const chosenEnemy = customEnemyId || ZONE_TO_BOSS[zoneId] || 'boss_galecrest';
    const stageNum = Number(nodeId.split('-')[1] || 10);
    const resolvedStage: 1 | 2 | 3 =
      customStage || (stageNum >= 10 ? 3 : stageNum === 5 ? 2 : 1);

    setActiveEnemyName(customEnemyName || null);
    setActiveEnemyStage(resolvedStage);
    setEnemyId(chosenEnemy);
    const freshBattle = createBattle({
      playerId,
      enemyId: chosenEnemy,
      creatures,
      words,
    });

    const baseState = freshBattle.getState();
    const hpScale = stageNum >= 10 ? 1.0 : stageNum === 5 ? 0.8 : 0.65;
    const scaledMaxHp = Math.max(36, Math.round((baseState.enemy.maxHp || baseState.enemy.stats.hp) * hpScale));

    setBattleState({
      ...baseState,
      enemy: {
        ...baseState.enemy,
        name: customEnemyName || baseState.enemy.name,
        stage: resolvedStage,
        currentHp: scaledMaxHp,
        maxHp: scaledMaxHp,
      },
    });
    juice.fanfare();
    setTab('battle');
  };

  const restartBattle = (newPlayerId?: string) => {
    const nextPlayerId = newPlayerId || playerId;
    if (newPlayerId) {
      setPlayerId(nextPlayerId);
    }
    const nextState = battleEngine.restart(nextPlayerId);
    setBattleState({ ...nextState });
  };

  const submitCombo = (
    word1Id: string,
    word2Id: string | null = null,
    word3Id: string | null = null,
    word4Id: string | null = null
  ) => {
    const nextState = battleEngine.submitCombo(word1Id, word2Id, word3Id, word4Id);
    setBattleState({ ...nextState });

    if (nextState.events.some((event) => event.type === 'DAMAGE' && event.amount)) {
      juice.hit();
    } else if (nextState.events.some((event) => event.type === 'SHIELD')) {
      juice.ding(750, 180);
    } else if (nextState.events.some((event) => event.type === 'BUFF' || event.type === 'HEAL')) {
      juice.ding(880, 150);
      setTimeout(() => juice.ding(1100, 150), 100);
    } else if (nextState.events.some((event) => event.type === 'DEBUFF' || event.type === 'FIZZLE')) {
      juice.boing();
    }

    if (nextState.phase === 'BATTLE_END') {
      if (nextState.winner === battleState.player.id) {
        const remainingRatio =
          (nextState.player.currentHp ?? nextState.player.stats.hp) /
          Math.max(1, nextState.player.maxHp ?? nextState.player.stats.hp);
        const earnedStars = remainingRatio >= 0.6 ? 3 : remainingRatio >= 0.3 ? 2 : 1;
        completeMapNode(activeZoneId, activeNodeId, earnedStars);
        completeZone(activeZoneId, earnedStars);
        setTimeout(() => juice.fanfare(), 600);
      }
    }
  };

  const commitWord = (word: Word) => {
    setWords((prev) => addForgedWord(prev, word));
  };

  const commitCreature = (creature: Creature) => {
    setCreatures((prev) => addForgedCreature(prev, creature));
    setGameState((prev) => ({
      ...prev,
      unlockedPetIds: Array.from(new Set([...prev.unlockedPetIds, creature.id])),
    }));
  };

  const goToBattle = () => {
    restartBattle(playerId);
    setTab('battle');
  };

  const goToLoadout = () => {
    setTab('loadout');
  };

  const updatePetLoadout = (petId: string, slot: PartOfSpeech, wordId: string | null) => {
    setCreatures((prev) =>
      prev.map((c) => {
        if (c.id !== petId) return c;
        const currentLoadout = c.loadout ? { ...c.loadout } : { verb: null, noun: null, adjective: null, adverb: null };
        currentLoadout[slot] = wordId;
        return {
          ...c,
          loadout: currentLoadout,
        };
      })
    );
    // Sync active battle player loadout in-place without resetting HP
    setBattleState((prev) => {
      if (prev.player.id !== petId) return prev;
      const currentLoadout = prev.player.loadout
        ? { ...prev.player.loadout }
        : { verb: null, noun: null, adjective: null, adverb: null };
      currentLoadout[slot] = wordId;
      return {
        ...prev,
        player: {
          ...prev.player,
          loadout: currentLoadout,
        },
      };
    });
  };

  const autoEquipBestLoadout = (petId: string, preferredTier: GradeTier | 'all' = 'all') => {
    const pet = creatures.find((c) => c.id === petId);
    if (!pet) return;

    const allWordsList = getAllWordsList(words);
    const petAffinity = pet.elementAffinity || pet.element;

    const slots: PartOfSpeech[] = ['verb', 'noun', 'adjective', 'adverb'];
    const newLoadout: PetLoadout = pet.loadout ? { ...pet.loadout } : { verb: null, noun: null, adjective: null, adverb: null };

    slots.forEach((slot) => {
      let candidates = allWordsList.filter((w) => w.partOfSpeech === slot);
      if (preferredTier !== 'all') {
        const tierFiltered = candidates.filter((w) => (w.gradeTier || '3') === preferredTier);
        if (tierFiltered.length > 0) candidates = tierFiltered;
      }
      candidates.sort((a, b) => {
        const aAffinity = a.element === petAffinity ? 1 : 0;
        const bAffinity = b.element === petAffinity ? 1 : 0;
        if (bAffinity !== aAffinity) return bAffinity - aAffinity;
        const aPwr = a.powerBonus ?? (a.forge?.powerBonus || 0);
        const bPwr = b.powerBonus ?? (b.forge?.powerBonus || 0);
        return bPwr - aPwr;
      });

      if (candidates.length > 0) {
        newLoadout[slot] = candidates[0].id;
      }
    });

    setCreatures((prev) =>
      prev.map((c) => (c.id === petId ? { ...c, loadout: newLoadout } : c))
    );
    juice.ding(880, 100);
  };

  const levelUpPet = (petId: string, levels = 1) => {
    setCreatures((prev) =>
      prev.map((c) => {
        if (c.id !== petId) return c;
        const newLevel = (c.level || 8) + levels;
        return {
          ...c,
          level: newLevel,
          stats: {
            hp: c.stats.hp + 2 * levels,
            attack: c.stats.attack + 1 * levels,
            defense: c.stats.defense + 1 * levels,
            speed: c.stats.speed + 1 * levels,
          },
          maxHp: (c.maxHp || c.stats.hp) + 2 * levels,
        };
      })
    );
    juice.ding(880, 150);
  };

  const feedPetStatTreat = (petId: string, stat: 'hp' | 'attack' | 'defense' | 'speed') => {
    setCreatures((prev) =>
      prev.map((c) => {
        if (c.id !== petId) return c;
        const nextHp = stat === 'hp' ? c.stats.hp + 4 : c.stats.hp;
        return {
          ...c,
          stats: {
            hp: nextHp,
            attack: stat === 'attack' ? c.stats.attack + 2 : c.stats.attack,
            defense: stat === 'defense' ? c.stats.defense + 2 : c.stats.defense,
            speed: stat === 'speed' ? c.stats.speed + 2 : c.stats.speed,
          },
          maxHp: stat === 'hp' ? (c.maxHp || c.stats.hp) + 4 : c.maxHp || c.stats.hp,
        };
      })
    );
    juice.ding(960, 140);
  };

  const recruitWildCompanion = (zoneId: string): Creature | null => {
    const ZONE_ELEMENT_MAP: Record<string, ElementType> = {
      'area-grass': 'grass',
      'area-water': 'water',
      'area-earth': 'earth',
      'area-fire': 'fire',
      'area-ice': 'ice',
      'area-air': 'air',
      'area-electric': 'electric',
      'area-shadow': 'shadow',
      'area-light': 'light',
    };
    const elem = ZONE_ELEMENT_MAP[zoneId] || 'grass';
    const existing = creatures.find((c) => !c.id.startsWith('boss_') && c.element === elem);
    if (existing) {
      levelUpPet(existing.id, 1);
      return existing;
    }
    const wildPet = createStarterCreature(elem, getAllWordsList(words));
    setCreatures((prev) => [...prev, wildPet]);
    setGameState((prev) => ({
      ...prev,
      unlockedPetIds: Array.from(new Set([...prev.unlockedPetIds, wildPet.id])),
    }));
    juice.fanfare();
    return wildPet;
  };

  const trainPetWithCoins = (petId: string, coinCost = 50): { success: boolean; error?: string } => {
    try {
      const rawUser = localStorage.getItem('wb_player_profile');
      let coins = 450;
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed.lexiCoins !== undefined) coins = parsed.lexiCoins;
      }
      if (coins < coinCost) {
        return { success: false, error: `Need ${coinCost} Lexi-Coins to train!` };
      }
      levelUpPet(petId, 1);
      return { success: true };
    } catch {
      levelUpPet(petId, 1);
      return { success: true };
    }
  };

  const evolvePet = (petId: string): { success: boolean; evolvedCreature: Creature } => {
    const pet = creatures.find((c) => c.id === petId);
    if (!pet) return { success: false, evolvedCreature: {} as Creature };
    const { evolvedCreature } = applyEvolution(pet);
    setCreatures((prev) => prev.map((c) => (c.id === petId ? evolvedCreature : c)));
    if (playerId === petId) {
      restartBattle(evolvedCreature.id);
    }
    return { success: true, evolvedCreature };
  };

  const useCreatureInBattle = (id: string) => {
    setPlayerId(id);
    restartBattle(id);
    setTab('battle');
  };

  const resetAll = () => {
    localStorage.removeItem('wb_creatures');
    localStorage.removeItem('wb_words');
    setCreatures(INITIAL_CREATURES);
    setWords(INITIAL_WORDS);
    setPlayerId('emberfox');
    setGameState((previous) => ({
      ...previous,
      unlockedPetIds: INITIAL_CREATURES.filter((creature) => !creature.id.startsWith('boss_')).map((creature) => creature.id),
      wordInventory: getAllWordsList(INITIAL_WORDS).map((word) => word.id),
    }));
    restartBattle('emberfox');
  };

  // Efficiency #9: Quick-Replay / Next Node Launcher from Battle Victory Banner
  const advanceToNextNode = (): { zoneId: string; nextNodeId: string } | null => {
    const parts = activeNodeId.split('-');
    const worldNum = Number(parts[0] || 1);
    const stageNum = Number(parts[1] || 1);
    const nextStage = Math.min(10, stageNum + 1);
    const nextNodeId = `${worldNum}-${nextStage}`;
    setActiveNodeId(nextNodeId);
    const stageRank: 1 | 2 | 3 = nextStage >= 10 ? 3 : nextStage >= 5 ? 2 : 1;
    startBattleAtNode(
      activeZoneId,
      nextNodeId,
      undefined,
      `Stage ${nextNodeId} Challenger`,
      stageRank
    );
    return { zoneId: activeZoneId, nextNodeId };
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        setActiveScreen,
        selectStarterPet,
        tab,
        setTab,
        creatures,
        words,
        playerId,
        setPlayerId,
        isMuted,
        toggleMute,
        battleState,
        submitCombo,
        restartBattle,
        commitWord,
        commitCreature,
        goToBattle,
        goToLoadout,
        useCreatureInBattle,
        updatePetLoadout,
        autoEquipBestLoadout,
        levelUpPet,
        feedPetStatTreat,
        recruitWildCompanion,
        trainPetWithCoins,
        evolvePet,
        activeZoneId,
        setActiveZoneId,
        activeNodeId,
        setActiveNodeId,
        activeEnemyName,
        activeEnemyStage,
        enemyId,
        setEnemyId,
        zoneProgress,
        nodeProgress,
        startBattleInZone,
        startBattleAtNode,
        completeZone,
        completeMapNode,
        returnToWordWorldMap,
        setReturnToWordWorldMap,
        preferredGradeBand,
        setPreferredGradeBand,
        activeWeather,
        cycleRealmWeather,
        petAccessories,
        equipPetAccessory,
        petSpecializations,
        setPetSpecialization,
        supportCreatureId,
        setSupportCreatureId,
        awakenedFossils,
        awakenPrehistoricCompanion,
        petBonds,
        increasePetBond,
        bountiesClaimed,
        claimBounty,
        dyslexiaFriendly,
        setDyslexiaFriendly,
        mistakeWords,
        addMistakeWord,
        masterMistakeWord,
        sanctuaryTheme,
        setSanctuaryTheme,
        ancientAmber,
        addAncientAmber,
        advanceToNextNode,
        resetAll,
      }}
    >
      <div className={dyslexiaFriendly ? 'tracking-wider leading-relaxed font-sans' : ''}>
        {children}
      </div>
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
