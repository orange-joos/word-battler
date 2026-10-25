import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Creature, Word, CatalogWords, BattleState } from '../types';
import { INITIAL_CREATURES, INITIAL_WORDS } from '../data/initialData';
import { createBattle } from '../engine/combat';
import { addForgedCreature, addForgedWord } from '../engine/forge';
import { juice } from '../engine/juice';

interface GameContextType {
  tab: 'battle' | 'forge';
  setTab: (tab: 'battle' | 'forge') => void;
  creatures: Creature[];
  words: CatalogWords;
  playerId: string;
  setPlayerId: (id: string) => void;
  isMuted: boolean;
  toggleMute: () => void;
  battleState: BattleState;
  submitCombo: (adjectiveId: string, nounId: string) => void;
  restartBattle: (newPlayerId?: string) => void;
  commitWord: (word: Word) => void;
  commitCreature: (creature: Creature) => void;
  goToBattle: () => void;
  useCreatureInBattle: (id: string) => void;
  resetAll: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tab, setTab] = useState<'battle' | 'forge'>('battle');
  const [creatures, setCreatures] = useState<Creature[]>(() => {
    try {
      const saved = localStorage.getItem('wb_creatures');
      return saved ? JSON.parse(saved) : INITIAL_CREATURES;
    } catch {
      return INITIAL_CREATURES;
    }
  });

  const [words, setWords] = useState<CatalogWords>(() => {
    try {
      const saved = localStorage.getItem('wb_words');
      return saved ? JSON.parse(saved) : INITIAL_WORDS;
    } catch {
      return INITIAL_WORDS;
    }
  });

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
      setPlayerId(newPlayerId);
    }
    const nextState = battleEngine.restart(nextPlayerId);
    setBattleState(nextState);
  };

  const submitCombo = (adjectiveId: string, nounId: string) => {
    const nextState = battleEngine.submitCombo(adjectiveId, nounId);
    setBattleState({ ...nextState });

    // Juice sound effects
    if (nextState.lastPlayerResolution) {
      if (nextState.lastPlayerResolution.combo.valid) {
        juice.hit();
        juice.speak(nextState.lastPlayerResolution.combo.phrase);
      } else {
        juice.boing();
      }
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
        useCreatureInBattle,
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
