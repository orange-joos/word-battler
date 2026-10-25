import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Creature, Word, CatalogWords, BattleState, MoveCategory, TabType, PartOfSpeech, PetLoadout } from '../types';
import { INITIAL_CREATURES, INITIAL_WORDS } from '../data/initialData';
import { createBattle } from '../engine/combat';
import { addForgedCreature, addForgedWord, getAllWordsList } from '../engine/forge';
import { juice } from '../engine/juice';

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
  submitCombo: (word1Id: string, word2Id: string | null, category: MoveCategory) => void;
  restartBattle: (newPlayerId?: string) => void;
  commitWord: (word: Word) => void;
  commitCreature: (creature: Creature) => void;
  goToBattle: () => void;
  goToLoadout: () => void;
  useCreatureInBattle: (id: string) => void;
  updatePetLoadout: (petId: string, slot: PartOfSpeech, wordId: string | null) => void;
  autoEquipBestLoadout: (petId: string) => void;
  resetAll: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

function initializeWords(): CatalogWords {
  try {
    const saved = localStorage.getItem('wb_words');
    if (!saved) return INITIAL_WORDS;
    const parsed = JSON.parse(saved);

    // Merge verbs
    const baseVerbs = INITIAL_WORDS.verbs || [];
    const savedVerbs = Array.isArray(parsed.verbs) ? parsed.verbs : [];
    const mergedVerbs = [...baseVerbs];
    for (const v of savedVerbs) {
      if (!mergedVerbs.some((existing) => existing.id === v.id)) {
        mergedVerbs.push(v);
      }
    }

    // Merge adverbs
    const baseAdverbs = INITIAL_WORDS.adverbs || [];
    const savedAdverbs = Array.isArray(parsed.adverbs) ? parsed.adverbs : [];
    const mergedAdverbs = [...baseAdverbs];
    for (const a of savedAdverbs) {
      if (!mergedAdverbs.some((existing) => existing.id === a.id)) {
        mergedAdverbs.push(a);
      }
    }

    // Merge adjectives
    const baseAdj = INITIAL_WORDS.adjectives || [];
    const savedAdj = Array.isArray(parsed.adjectives) ? parsed.adjectives : [];
    const mergedAdj = [...baseAdj];
    for (const adj of savedAdj) {
      if (!mergedAdj.some((existing) => existing.id === adj.id)) {
        mergedAdj.push(adj);
      }
    }

    // Merge nouns
    const baseNouns = INITIAL_WORDS.nouns || [];
    const savedNouns = Array.isArray(parsed.nouns) ? parsed.nouns : [];
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
        elementAffinity: c.elementAffinity || initialMatch?.elementAffinity || c.element,
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

  // Combat Engine Instance
  const battleEngine = useMemo(() => {
    return createBattle({
      playerId,
      enemyId: 'rimepup',
      creatures,
      words,
    });
  }, [playerId, creatures, words]);

  const [battleState, setBattleState] = useState<BattleState>(() => battleEngine.getState());

  const restartBattle = (newPlayerId?: string) => {
    const nextPlayerId = newPlayerId || playerId;
    if (newPlayerId) {
      setPlayerId(nextPlayerId);
    }
    const nextState = battleEngine.restart(nextPlayerId);
    setBattleState(nextState);
  };

  const submitCombo = (word1Id: string, word2Id: string | null, category: MoveCategory) => {
    const nextState = battleEngine.submitCombo(word1Id, word2Id, category);
    setBattleState({ ...nextState });

    // Audio effects based on category
    if (category === 'ATTACK') {
      juice.hit();
    } else if (category === 'DEFEND') {
      juice.ding(750, 180);
    } else if (category === 'BUFF') {
      juice.ding(880, 150);
      setTimeout(() => juice.ding(1100, 150), 100);
    } else if (category === 'DEBUFF') {
      juice.boing();
    }

    if (nextState.phase === 'BATTLE_END') {
      if (nextState.winner === battleState.player.id) {
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
