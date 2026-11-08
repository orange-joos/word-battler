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
  trainPetWithCoins: (petId: string, coinCost?: number) => { success: boolean; error?: string };
  evolvePet: (petId: string) => { success: boolean; evolvedCreature: Creature };
  activeZoneId: string;
  setActiveZoneId: (zoneId: string) => void;
  enemyId: string;
  setEnemyId: (id: string) => void;
  zoneProgress: Record<string, { stars: number; cleared: boolean }>;
  startBattleInZone: (zoneId: string, customEnemyId?: string) => void;
  completeZone: (zoneId: string, stars?: number) => void;
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

  useEffect(() => {
    try {
      localStorage.setItem('wb_zone_progress', JSON.stringify(zoneProgress));
    } catch {}
  }, [zoneProgress]);

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
        completeZone(activeZoneId, 3);
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
        trainPetWithCoins,
        evolvePet,
        activeZoneId,
        setActiveZoneId,
        enemyId,
        setEnemyId,
        zoneProgress,
        startBattleInZone,
        completeZone,
        resetAll,
      }}
    >
      {children}
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
