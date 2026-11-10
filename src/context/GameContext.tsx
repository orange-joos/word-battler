import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type {
  Creature,
  Word,
  CatalogWords,
  BattleState,
  TabType,
  PartOfSpeech,
  ElementType,
  GameScreen,
  GameState,
  GradeTier,
} from '../types.ts';
import { INITIAL_CREATURES, INITIAL_WORDS } from '../data/initialData.ts';
import { ZONE_ELEMENT_MAP, ZONE_TO_BOSS } from '../data/realms.ts';
import { createBattle } from '../engine/combat.ts';
import { addForgedCreature, addForgedWord, getAllWordsList } from '../engine/forge.ts';
import { juice } from '../engine/juice.ts';
import { applyEvolution } from '../data/evolutionData.ts';
import { createStarterCreature } from '../data/starterPets.ts';
import {
  applyDerivedGearToRoster,
  buildAwakenedFossilCreature,
  computeBestLoadoutForPet,
  REALM_WEATHERS,
  type RealmWeather,
} from '../engine/progression.ts';
import {
  DEFAULT_NODE_PROGRESS,
  DEFAULT_ZONE_PROGRESS,
  initializeCoreGameState,
  initializeCreaturesRoster,
  initializeWordsCatalog,
  loadUnifiedProfileSave,
  saveUnifiedProfileSave,
} from '../engine/storage.ts';
import {
  classifyComboMistake,
  getAdaptiveTutorInsight,
  type TutorInsight,
} from '../agents/adaptiveTutorAgent.ts';
import { useAuth } from './AuthContext';

export interface GameContextType {
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
  activeWeather: RealmWeather;
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
  calmAnimations: boolean;
  setCalmAnimations: (val: boolean) => void;
  mistakeWords: string[];
  addMistakeWord: (word: string) => void;
  masterMistakeWord: (word: string) => void;
  tutorInsight: TutorInsight;
  sanctuaryTheme: 'classic' | 'autumn' | 'frostfall' | 'starlight';
  setSanctuaryTheme: (theme: 'classic' | 'autumn' | 'frostfall' | 'starlight') => void;
  ancientAmber: number;
  addAncientAmber: (delta: number) => void;
  claimedMilestones: string[];
  claimStarMilestone: (milestoneKey: string) => void;
  recruitedZones: string[];
  markZoneRecruited: (zoneId: string) => void;
  advanceToNextNode: () => { zoneId: string; nextNodeId: string } | null;
  resetAll: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, addRewards } = useAuth();
  const initialSave = useMemo(() => loadUnifiedProfileSave(), []);

  const [gameState, setGameState] = useState<GameState>(initializeCoreGameState);
  const [tab, setTab] = useState<TabType>('hub');
  const [baseCreatures, setBaseCreatures] = useState<Creature[]>(initializeCreaturesRoster);
  const [words, setWords] = useState<CatalogWords>(initializeWordsCatalog);
  const [playerId, setPlayerIdState] = useState<string>(initialSave.playerId);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const [activeZoneId, setActiveZoneId] = useState<string>('area-grass');
  const [activeNodeId, setActiveNodeId] = useState<string>('1-1');
  const [activeEnemyName, setActiveEnemyName] = useState<string | null>(null);
  const [activeEnemyStage, setActiveEnemyStage] = useState<1 | 2 | 3>(3);
  const [returnToWordWorldMap, setReturnToWordWorldMap] = useState<boolean>(false);
  const [enemyId, setEnemyId] = useState<string>('boss_galecrest');

  // Unified profile state slices (Item #4 & #6)
  const [preferredGradeBand, setPreferredGradeBand] = useState<'all' | 'k-2' | '3-5' | '6-8'>(
    initialSave.preferredGradeBand
  );
  const [weatherIndex, setWeatherIndex] = useState<number>(0);
  const activeWeather = REALM_WEATHERS[weatherIndex % REALM_WEATHERS.length];

  const [petAccessories, setPetAccessories] = useState<Record<string, string>>(
    initialSave.petAccessories
  );
  const [petSpecializations, setPetSpecializations] = useState<
    Record<string, 'vanguard' | 'bastion'>
  >(initialSave.petSpecializations);
  const [supportCreatureId, setSupportCreatureId] = useState<string>(
    initialSave.supportCreatureId
  );
  const [awakenedFossils, setAwakenedFossils] = useState<Record<string, boolean>>(
    initialSave.awakenedFossils
  );
  const [petBonds, setPetBonds] = useState<Record<string, number>>(initialSave.petBonds);
  const [bountiesClaimed, setBountiesClaimed] = useState<Record<string, boolean>>(
    initialSave.bountiesClaimed
  );
  const [dyslexiaFriendly, setDyslexiaFriendly] = useState<boolean>(
    initialSave.dyslexiaFriendly
  );
  const [calmAnimations, setCalmAnimations] = useState<boolean>(
    initialSave.calmAnimations
  );
  const [mistakeWords, setMistakeWords] = useState<string[]>(initialSave.mistakeWords);
  const [sanctuaryTheme, setSanctuaryTheme] = useState<
    'classic' | 'autumn' | 'frostfall' | 'starlight'
  >(initialSave.sanctuaryTheme);
  const [ancientAmber, setAncientAmber] = useState<number>(initialSave.ancientAmber);
  const [zoneProgress, setZoneProgress] = useState<
    Record<string, { stars: number; cleared: boolean }>
  >(initialSave.zoneProgress);
  const [nodeProgress, setNodeProgress] = useState<
    Record<string, { stars: number; cleared: boolean }>
  >(initialSave.nodeProgress);
  const [claimedMilestones, setClaimedMilestones] = useState<string[]>(
    initialSave.claimedMilestones
  );
  const [recruitedZones, setRecruitedZones] = useState<string[]>(initialSave.recruitedZones);

  // Item #7: Purely derive effective stats from baseCreatures + accessories + specializations
  const creatures = useMemo(
    () => applyDerivedGearToRoster(baseCreatures, petAccessories, petSpecializations),
    [baseCreatures, petAccessories, petSpecializations]
  );

  // Adaptive Tutor Agent insight derived from current mistakes & grade band
  const tutorInsight = useMemo(
    () => getAdaptiveTutorInsight(mistakeWords, words, preferredGradeBand),
    [mistakeWords, words, preferredGradeBand]
  );

  const setActiveScreen = (activeScreen: GameScreen) => {
    setGameState((previous) => ({ ...previous, activeScreen }));
  };

  const setPlayerId = (id: string) => {
    setPlayerIdState(id);
  };

  const selectStarterPet = (element: ElementType) => {
    const starterPet =
      creatures.find(
        (creature) => creature.element === element && !creature.id.startsWith('boss_')
      ) || createStarterCreature(element, getAllWordsList(words));

    if (!baseCreatures.some((creature) => creature.id === starterPet.id)) {
      setBaseCreatures((previous) => [...previous, starterPet]);
    }

    setPlayerId(starterPet.id);
    setGameState((previous) => ({
      ...previous,
      activeScreen: 'tutorial',
      unlockedPetIds: Array.from(new Set([...previous.unlockedPetIds, starterPet.id])),
    }));
  };

  // Sync currency from AuthContext (Item #5)
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

  // Persist core rosters & unified save v3 (Item #4)
  useEffect(() => {
    try {
      localStorage.setItem('wb_game_state', JSON.stringify(gameState));
    } catch {}
  }, [gameState]);

  useEffect(() => {
    try {
      localStorage.setItem('wb_creatures', JSON.stringify(baseCreatures));
    } catch {}
  }, [baseCreatures]);

  useEffect(() => {
    try {
      localStorage.setItem('wb_words', JSON.stringify(words));
    } catch {}
  }, [words]);

  useEffect(() => {
    saveUnifiedProfileSave({
      version: 3,
      playerId,
      supportCreatureId,
      preferredGradeBand,
      petAccessories,
      petSpecializations,
      awakenedFossils,
      petBonds,
      bountiesClaimed,
      dyslexiaFriendly,
      calmAnimations,
      mistakeWords,
      sanctuaryTheme,
      ancientAmber,
      zoneProgress,
      nodeProgress,
      claimedMilestones,
      recruitedZones,
    });
  }, [
    playerId,
    supportCreatureId,
    preferredGradeBand,
    petAccessories,
    petSpecializations,
    awakenedFossils,
    petBonds,
    bountiesClaimed,
    dyslexiaFriendly,
    calmAnimations,
    mistakeWords,
    sanctuaryTheme,
    ancientAmber,
    zoneProgress,
    nodeProgress,
    claimedMilestones,
    recruitedZones,
  ]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    juice.setMuted(next);
  };

  const cycleRealmWeather = () => {
    setWeatherIndex((prev) => (prev + 1) % REALM_WEATHERS.length);
    juice.ding(740, 120);
  };

  // Item #7: Equip accessory without mutating base stats in-place
  const equipPetAccessory = (petId: string, accessoryId: string) => {
    setPetAccessories((prev) => ({ ...prev, [petId]: accessoryId }));
    juice.ding(920, 130);
  };

  // Item #7: Set specialization without mutating base stats in-place
  const setPetSpecialization = (petId: string, branch: 'vanguard' | 'bastion') => {
    setPetSpecializations((prev) => ({ ...prev, [petId]: branch }));
    juice.fanfare();
  };

  const awakenPrehistoricCompanion = (element: ElementType): Creature => {
    const fossilId = `fossil_${element}`;
    setAwakenedFossils((prev) => ({ ...prev, [element]: true }));

    const existing = creatures.find((c) => c.id === fossilId);
    if (existing) {
      levelUpPet(fossilId, 2);
      return existing;
    }

    const awakened = buildAwakenedFossilCreature(element, words);
    setBaseCreatures((prev) => [...prev, awakened]);
    setGameState((prev) => ({
      ...prev,
      unlockedPetIds: Array.from(new Set([...prev.unlockedPetIds, fossilId])),
    }));
    juice.fanfare();
    return awakened;
  };

  const increasePetBond = (petId: string, amount = 1) => {
    setPetBonds((prev) => ({
      ...prev,
      [petId]: Math.min(10, (prev[petId] || 1) + amount),
    }));
  };

  const claimBounty = (bountyId: string) => {
    setBountiesClaimed((prev) => ({ ...prev, [bountyId]: true }));
    juice.fanfare();
  };

  const addMistakeWord = (word: string) => {
    setMistakeWords((prev) => (prev.includes(word) ? prev : [word, ...prev].slice(0, 12)));
  };

  const masterMistakeWord = (word: string) => {
    setMistakeWords((prev) => prev.filter((w) => w !== word));
    juice.fanfare();
  };

  const addAncientAmber = (delta: number) => {
    setAncientAmber((prev) => Math.max(0, prev + delta));
  };

  const claimStarMilestone = (milestoneKey: string) => {
    setClaimedMilestones((prev) =>
      prev.includes(milestoneKey) ? prev : [...prev, milestoneKey]
    );
  };

  const markZoneRecruited = (zoneId: string) => {
    setRecruitedZones((prev) => (prev.includes(zoneId) ? prev : [...prev, zoneId]));
  };

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

  // Item #13: Only recreate battleEngine when playerId or enemyId changes; sync catalog in-place otherwise!
  const battleEngine = useMemo(() => {
    return createBattle({
      playerId,
      enemyId,
      creatures,
      words,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, enemyId]);

  useEffect(() => {
    battleEngine.syncCatalog(words, creatures);
  }, [battleEngine, words, creatures]);

  const [battleState, setBattleState] = useState<BattleState>(() => battleEngine.getState());

  useEffect(() => {
    setBattleState(battleEngine.getState());
  }, [battleEngine]);

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
    const scaledMaxHp = Math.max(
      36,
      Math.round((baseState.enemy.maxHp || baseState.enemy.stats.hp) * hpScale)
    );

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

    // Adaptive Tutor Agent: record any syntax/order fizzle into the student's mistake deck
    const fizzleEvent = nextState.events.find((e) => e.type === 'FIZZLE');
    if (fizzleEvent && fizzleEvent.phrase) {
      addMistakeWord(fizzleEvent.phrase);
    } else if (nextState.lastPlayerResolution && !nextState.lastPlayerResolution.combo.valid) {
      const classified = classifyComboMistake(nextState.lastPlayerResolution.combo);
      if (classified) addMistakeWord(classified.mistakeLabel);
    }

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

    if (nextState.phase === 'BATTLE_END' && nextState.winner === battleState.player.id) {
      const remainingRatio =
        (nextState.player.currentHp ?? nextState.player.stats.hp) /
        Math.max(1, nextState.player.maxHp ?? nextState.player.stats.hp);
      const earnedStars = remainingRatio >= 0.6 ? 3 : remainingRatio >= 0.3 ? 2 : 1;
      completeMapNode(activeZoneId, activeNodeId, earnedStars);
      completeZone(activeZoneId, earnedStars);
      setTimeout(() => juice.fanfare(), 600);
    }
  };

  const commitWord = (word: Word) => {
    setWords((prev) => addForgedWord(prev, word));
  };

  const commitCreature = (creature: Creature) => {
    setBaseCreatures((prev) => addForgedCreature(prev, creature));
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
    setBaseCreatures((prev) =>
      prev.map((c) => {
        if (c.id !== petId) return c;
        const currentLoadout = c.loadout
          ? { ...c.loadout }
          : { verb: null, noun: null, adjective: null, adverb: null };
        currentLoadout[slot] = wordId;
        return { ...c, loadout: currentLoadout };
      })
    );
    setBattleState((prev) => {
      if (prev.player.id !== petId) return prev;
      const currentLoadout = prev.player.loadout
        ? { ...prev.player.loadout }
        : { verb: null, noun: null, adjective: null, adverb: null };
      currentLoadout[slot] = wordId;
      return {
        ...prev,
        player: { ...prev.player, loadout: currentLoadout },
      };
    });
  };

  const autoEquipBestLoadout = (petId: string, preferredTier: GradeTier | 'all' = 'all') => {
    const pet = creatures.find((c) => c.id === petId);
    if (!pet) return;
    const newLoadout = computeBestLoadoutForPet(pet, words, preferredTier);
    setBaseCreatures((prev) =>
      prev.map((c) => (c.id === petId ? { ...c, loadout: newLoadout } : c))
    );
    juice.ding(880, 100);
  };

  const levelUpPet = (petId: string, levels = 1) => {
    setBaseCreatures((prev) =>
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
    setBaseCreatures((prev) =>
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
    const elem = ZONE_ELEMENT_MAP[zoneId] || 'grass';
    const existing = creatures.find((c) => !c.id.startsWith('boss_') && c.element === elem);
    if (existing) {
      levelUpPet(existing.id, 1);
      return existing;
    }
    const wildPet = createStarterCreature(elem, getAllWordsList(words));
    setBaseCreatures((prev) => [...prev, wildPet]);
    setGameState((prev) => ({
      ...prev,
      unlockedPetIds: Array.from(new Set([...prev.unlockedPetIds, wildPet.id])),
    }));
    juice.fanfare();
    return wildPet;
  };

  // Item #5: Unified currency check & deduction via AuthContext.addRewards
  const trainPetWithCoins = (petId: string, coinCost = 50): { success: boolean; error?: string } => {
    const availableCoins = currentUser?.lexiCoins ?? gameState.coins ?? 0;
    if (availableCoins < coinCost) {
      return { success: false, error: `Need ${coinCost} Lexi-Coins! Win battles to earn more.` };
    }
    addRewards({ coins: -coinCost });
    levelUpPet(petId, 1);
    return { success: true };
  };

  const evolvePet = (petId: string): { success: boolean; evolvedCreature: Creature } => {
    const pet = baseCreatures.find((c) => c.id === petId);
    if (!pet) return { success: false, evolvedCreature: {} as Creature };
    const { evolvedCreature } = applyEvolution(pet);
    setBaseCreatures((prev) => prev.map((c) => (c.id === petId ? evolvedCreature : c)));
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
    setBaseCreatures(INITIAL_CREATURES);
    setWords(INITIAL_WORDS);
    setPlayerId('emberfox');
    setZoneProgress(DEFAULT_ZONE_PROGRESS);
    setNodeProgress(DEFAULT_NODE_PROGRESS);
    setGameState((previous) => ({
      ...previous,
      unlockedPetIds: INITIAL_CREATURES.filter((creature) => !creature.id.startsWith('boss_')).map(
        (creature) => creature.id
      ),
      wordInventory: getAllWordsList(INITIAL_WORDS).map((word) => word.id),
    }));
    restartBattle('emberfox');
  };

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
        calmAnimations,
        setCalmAnimations,
        mistakeWords,
        addMistakeWord,
        masterMistakeWord,
        tutorInsight,
        sanctuaryTheme,
        setSanctuaryTheme,
        ancientAmber,
        addAncientAmber,
        claimedMilestones,
        claimStarMilestone,
        recruitedZones,
        markZoneRecruited,
        advanceToNextNode,
        resetAll,
      }}
    >
      <div
        className={`${dyslexiaFriendly ? 'dyslexia-friendly tracking-wider leading-relaxed font-sans' : ''} ${
          calmAnimations ? 'calm-animations' : ''
        }`}
      >
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

/**
 * Focused domain selector hooks (Item #6)
 */
export const useRoster = () => {
  const ctx = useGame();
  return {
    creatures: ctx.creatures,
    words: ctx.words,
    playerId: ctx.playerId,
    setPlayerId: ctx.setPlayerId,
    updatePetLoadout: ctx.updatePetLoadout,
    autoEquipBestLoadout: ctx.autoEquipBestLoadout,
    levelUpPet: ctx.levelUpPet,
    trainPetWithCoins: ctx.trainPetWithCoins,
    evolvePet: ctx.evolvePet,
    petAccessories: ctx.petAccessories,
    equipPetAccessory: ctx.equipPetAccessory,
    petSpecializations: ctx.petSpecializations,
    setPetSpecialization: ctx.setPetSpecialization,
  };
};

export const useBattleSession = () => {
  const ctx = useGame();
  return {
    battleState: ctx.battleState,
    submitCombo: ctx.submitCombo,
    restartBattle: ctx.restartBattle,
    tutorInsight: ctx.tutorInsight,
  };
};
