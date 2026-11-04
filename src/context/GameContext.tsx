import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Creature, Word, CatalogWords, BattleState, TabType, PartOfSpeech, PetLoadout, ElementType } from '../types';
import { INITIAL_CREATURES, INITIAL_WORDS } from '../data/initialData';
import { ELEMENTS } from '../data/elements';
import { createBattle } from '../engine/combat';
import { addForgedCreature, addForgedWord, getAllWordsList } from '../engine/forge';
import { juice } from '../engine/juice';
import { applyEvolution } from '../data/evolutionData';

interface GameContextType {
  tab: TabType;
  setTab: (tab: TabType) => void;
  creatures: Creature[];
  words: CatalogWords;
  playerId: string;
  setPlayerId: (id: string) => void;
  isMuted: boolean;
  toggleMute: () => void;
  battleState: BattleState;
  submitCombo: (word1Id: string, word2Id: string | null) => void;
  restartBattle: (newPlayerId?: string) => void;
  commitWord: (word: Word) => void;
  commitCreature: (creature: Creature) => void;
  goToBattle: () => void;
  goToLoadout: () => void;
  useCreatureInBattle: (id: string) => void;
  updatePetLoadout: (petId: string, slot: PartOfSpeech, wordId: string | null) => void;
  autoEquipBestLoadout: (petId: string) => void;
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

    // Merge verbs
    const baseVerbs = INITIAL_WORDS.verbs || [];
    const savedVerbs = Array.isArray(parsed.verbs) ? parsed.verbs.map(normalizeWord) : [];
    const mergedVerbs = [...baseVerbs];
    for (const v of savedVerbs) {
      if (!mergedVerbs.some((existing) => existing.id === v.id)) {
        mergedVerbs.push(v);
      }
    }

    // Merge adverbs
    const baseAdverbs = INITIAL_WORDS.adverbs || [];
    const savedAdverbs = Array.isArray(parsed.adverbs) ? parsed.adverbs.map(normalizeWord) : [];
    const mergedAdverbs = [...baseAdverbs];
    for (const a of savedAdverbs) {
      if (!mergedAdverbs.some((existing) => existing.id === a.id)) {
        mergedAdverbs.push(a);
      }
    }

    // Merge adjectives
    const baseAdj = INITIAL_WORDS.adjectives || [];
    const savedAdj = Array.isArray(parsed.adjectives) ? parsed.adjectives.map(normalizeWord) : [];
    const mergedAdj = [...baseAdj];
    for (const adj of savedAdj) {
      if (!mergedAdj.some((existing) => existing.id === adj.id)) {
        mergedAdj.push(adj);
      }
    }

    // Merge nouns
    const baseNouns = INITIAL_WORDS.nouns || [];
    const savedNouns = Array.isArray(parsed.nouns) ? parsed.nouns.map(normalizeWord) : [];
    const mergedNouns = [...baseNouns];
    for (const n of savedNouns) {
      if (!mergedNouns.some((existing) => existing.id === n.id)) {
        mergedNouns.push(n);
      }
    }

    return {
      adjectives: mergedAdj,
      nouns: mergedNouns,
      verbs: mergedVerbs,
      adverbs: mergedAdverbs,
    };
  } catch {
    return INITIAL_WORDS;
  }
}

function normalizeElement(element: string): ElementType {
  if (element === 'nature') return 'grass';
  if (element === 'cosmic') return 'light';
  return element in ELEMENTS ? element as ElementType : 'fire';
}

function initializeCreatures(): Creature[] {
  try {
    const saved = localStorage.getItem('wb_creatures');
    if (!saved) return INITIAL_CREATURES;
    const parsed: Creature[] = JSON.parse(saved);

    // Ensure all creatures have full parts of speech allowed and valid loadout + elementAffinity
    const updated: Creature[] = parsed.map((c) => {
      const existingTypes = new Set(c.allowedWordTypes || []);
      existingTypes.add('adjective');
      existingTypes.add('noun');
      existingTypes.add('verb');
      existingTypes.add('adverb');

      const initialMatch = INITIAL_CREATURES.find((init) => init.id === c.id);
      const element = normalizeElement(c.element);
      const elementAffinity = c.id === 'boss_sovereign' && element === 'light'
        ? 'light'
        : normalizeElement(c.elementAffinity || initialMatch?.elementAffinity || element);
      const loadout: PetLoadout = c.loadout && typeof c.loadout === 'object'
        ? {
            verb: c.loadout.verb ?? (initialMatch?.loadout?.verb || null),
            noun: c.loadout.noun ?? (initialMatch?.loadout?.noun || null),
            adjective: c.loadout.adjective ?? (initialMatch?.loadout?.adjective || null),
            adverb: c.loadout.adverb ?? (initialMatch?.loadout?.adverb || null),
          }
        : (initialMatch?.loadout || { verb: null, noun: null, adjective: null, adverb: null });

      return {
        ...c,
        element,
        elementAffinity,
        allowedElements: c.id === 'boss_sovereign'
          ? [...(initialMatch?.allowedElements || [])]
          : (c.allowedElements?.length ? c.allowedElements : initialMatch?.allowedElements || [element]).map(normalizeElement),
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

    // Make sure initial starter creatures exist
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

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tab, setTab] = useState<TabType>('hub');
  const [creatures, setCreatures] = useState<Creature[]>(initializeCreatures);
  const [words, setWords] = useState<CatalogWords>(initializeWords);
  const [playerId, setPlayerId] = useState<string>('emberfox');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Sync with localStorage
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

  const [activeZoneId, setActiveZoneId] = useState<string>('root-village');
  const [enemyId, setEnemyId] = useState<string>('boss_ruptor');
  const [zoneProgress, setZoneProgress] = useState<Record<string, { stars: number; cleared: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('wb_zone_progress');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
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

  const startBattleInZone = (zoneId: string, customEnemyId?: string) => {
    setActiveZoneId(zoneId);
    const chosenEnemy =
      customEnemyId ||
      (zoneId === 'root-village'
        ? 'boss_ruptor'
        : zoneId === 'prefix-path'
        ? 'boss_dishornet'
        : zoneId === 'suffix-steppes'
        ? 'boss_galecrest'
        : zoneId === 'compound-colosseum'
        ? 'boss_pyrostorm'
        : zoneId === 'syntax-spire'
        ? 'boss_sovereign'
        : 'boss_ruptor');

    setEnemyId(chosenEnemy);
    juice.fanfare();
    setTab('battle');
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

  useEffect(() => {
    setBattleState(battleEngine.getState());
  }, [battleEngine]);

  const restartBattle = (newPlayerId?: string) => {
    const nextPlayerId = newPlayerId || playerId;
    if (newPlayerId) {
      setPlayerId(nextPlayerId);
    }
    const nextState = battleEngine.restart(nextPlayerId);
    setBattleState(nextState);
  };

  const submitCombo = (word1Id: string, word2Id: string | null) => {
    const nextState = battleEngine.submitCombo(word1Id, word2Id);
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
  };

  const goToBattle = () => {
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
  };

  const autoEquipBestLoadout = (petId: string) => {
    const pet = creatures.find((c) => c.id === petId);
    if (!pet) return;

    const allWordsList = getAllWordsList(words);
    const petAffinity = pet.elementAffinity || pet.element;

    const slots: PartOfSpeech[] = ['verb', 'noun', 'adjective', 'adverb'];
    const newLoadout: PetLoadout = pet.loadout ? { ...pet.loadout } : { verb: null, noun: null, adjective: null, adverb: null };

    slots.forEach((slot) => {
      const candidates = allWordsList.filter((w) => w.partOfSpeech === slot);
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
    restartBattle('emberfox');
  };

  return (
    <GameContext.Provider
      value={{
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
