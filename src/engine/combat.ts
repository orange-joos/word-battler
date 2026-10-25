/**
 * Event-Driven Turn Combat Engine for Word Battler (Layer 3 - Sentence Construction)
 */

import {
  Creature,
  Word,
  BattleState,
  BattlePhase,
  ComboEvaluation,
  BattleResolution,
  BattleLogEntry,
  CatalogWords,
} from '../types';
import { getAllWordsList } from './forge';

export const PHASES = Object.freeze({
  PLAYER_TURN: 'PLAYER_TURN' as BattlePhase,
  WORD_CHOICE: 'WORD_CHOICE' as BattlePhase,
  RESOLUTION: 'RESOLUTION' as BattlePhase,
  ENEMY_TURN: 'ENEMY_TURN' as BattlePhase,
  BATTLE_END: 'BATTLE_END' as BattlePhase,
});

const BASE_COMBO_POWER = 6;
const MATCHING_ELEMENT_BONUS = 4;
const SHARED_WORD_ELEMENT_BONUS = 2;

export function cloneCreature(template: Creature): Creature {
  return {
    ...template,
    stats: { ...template.stats },
    currentHp: template.currentHp ?? template.stats.hp,
    maxHp: template.stats.hp,
    shield: 0,
  };
}

export function evaluateCombo(
  attacker: Creature,
  adjective: Word | null,
  noun: Word | null
): ComboEvaluation {
  if (!adjective || !noun) {
    return {
      valid: false,
      phrase: [adjective?.word, noun?.word].filter(Boolean).join(' ') || '—',
      adjective: adjective as Word,
      noun: noun as Word,
      power: 0,
      reasons: ['Select both an Adjective and a Noun to form a combo.'],
    };
  }

  const reasons: string[] = [];
  const allowedTypes = new Set(attacker.allowedWordTypes);
  const allowedElements = new Set(attacker.allowedElements);

  const grammarOk =
    adjective.partOfSpeech === 'adjective' && noun.partOfSpeech === 'noun';
  const typesAllowed =
    allowedTypes.has(adjective.partOfSpeech) && allowedTypes.has(noun.partOfSpeech);
  const adjectiveAllowed = allowedElements.has(adjective.element);
  const nounAllowed = allowedElements.has(noun.element);
  const bothMatchAttacker = adjectiveAllowed && nounAllowed;
  const wordsShareElement = adjective.element === noun.element;

  if (!grammarOk) {
    reasons.push('Combos must follow standard grammar: an Adjective followed by a Noun.');
  }
  if (!typesAllowed) {
    reasons.push(`${attacker.name} can only form: ${attacker.allowedWordTypes.join(', ')}.`);
  }
  if (!adjectiveAllowed) {
    reasons.push(
      `"${adjective.word}" carries ${adjective.element} energy; ${attacker.name} channels ${attacker.allowedElements.join(' & ')}.`
    );
  }
  if (!nounAllowed) {
    reasons.push(
      `"${noun.word}" carries ${noun.element} energy; ${attacker.name} channels ${attacker.allowedElements.join(' & ')}.`
    );
  }

  const valid = grammarOk && typesAllowed && bothMatchAttacker;
  let power = 0;

  if (valid) {
    power = BASE_COMBO_POWER;
    if (attacker.allowedElements.includes(adjective.element)) {
      power += MATCHING_ELEMENT_BONUS;
    }
    if (attacker.allowedElements.includes(noun.element)) {
      power += MATCHING_ELEMENT_BONUS;
    }
    if (wordsShareElement) {
      power += SHARED_WORD_ELEMENT_BONUS;
    }

    // Add morphology power bonuses if words were forged
    if (adjective.forge?.powerBonus) {
      power += adjective.forge.powerBonus;
    }
    if (noun.forge?.powerBonus) {
      power += noun.forge.powerBonus;
    }

    reasons.push(
      `${attacker.name} channels "${adjective.word} ${noun.word}" with ${power} base word synergy!`
    );
  } else if (grammarOk && wordsShareElement) {
    reasons.push(
      `"${adjective.word} ${noun.word}" is grammatically sound, but cannot be harnessed by ${attacker.name}.`
    );
  }

  return {
    valid,
    phrase: `${adjective.word} ${noun.word}`,
    adjective,
    noun,
    power,
    reasons,
  };
}

export function calculateDamage(
  attacker: Creature,
  defender: Creature,
  combo: ComboEvaluation
): number {
  if (!combo.valid) {
    return 0;
  }
  const raw = attacker.stats.attack + combo.power - defender.stats.defense;
  return Math.max(2, raw);
}

export function wordsForCreature(creature: Creature, catalog: CatalogWords): Word[] {
  const allowedTypes = new Set(creature.allowedWordTypes);
  const allowedElements = new Set(creature.allowedElements);

  return getAllWordsList(catalog).filter(
    (word) => allowedTypes.has(word.partOfSpeech) && allowedElements.has(word.element)
  );
}

export function pickEnemyCombo(creature: Creature, catalog: CatalogWords): { adjective: Word; noun: Word } | null {
  const pool = wordsForCreature(creature, catalog);
  const adjectives = pool.filter((w) => w.partOfSpeech === 'adjective');
  const nouns = pool.filter((w) => w.partOfSpeech === 'noun');

  if (adjectives.length === 0 || nouns.length === 0) {
    return null;
  }

  // Prefer matching element combo if available
  for (const adj of adjectives) {
    const matchingNoun = nouns.find((n) => n.element === adj.element);
    if (matchingNoun) {
      return { adjective: adj, noun: matchingNoun };
    }
  }

  return { adjective: adjectives[0], noun: nouns[0] };
}

export function createBattle(options: {
  playerId: string;
  enemyId: string;
  creatures: Creature[];
  words: CatalogWords;
}) {
  const playerTemplate = options.creatures.find((c) => c.id === options.playerId) || options.creatures[0];
  const enemyTemplate =
    options.creatures.find((c) => c.id === options.enemyId) ||
    options.creatures.find((c) => c.id !== options.playerId) ||
    options.creatures[1];

  const player = cloneCreature(playerTemplate);
  const enemy = cloneCreature(enemyTemplate);

  let state: BattleState = {
    phase: PHASES.PLAYER_TURN,
    winner: null,
    player,
    enemy,
    log: [
      {
        id: 'start-1',
        phase: PHASES.PLAYER_TURN,
        message: `${player.name} enters the battle against ${enemy.name}!`,
        timestamp: Date.now(),
      },
    ],
    lastPlayerResolution: null,
    lastEnemyResolution: null,
  };

  function addLog(entry: Omit<BattleLogEntry, 'id' | 'timestamp'>) {
    state.log.push({
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    });
  }

  function submitCombo(adjectiveId: string, nounId: string): BattleState {
    const allWords = getAllWordsList(options.words);
    const adjective = allWords.find((w) => w.id === adjectiveId);
    const noun = allWords.find((w) => w.id === nounId);

    if (!adjective || !noun) return state;

    // 1. Player Resolution
    const playerCombo = evaluateCombo(state.player, adjective, noun);
    const playerDamage = calculateDamage(state.player, state.enemy, playerCombo);

    if (playerCombo.valid) {
      state.enemy.currentHp = Math.max(0, (state.enemy.currentHp ?? 0) - playerDamage);
      const res: BattleResolution = {
        attackerId: state.player.id,
        defenderId: state.enemy.id,
        combo: playerCombo,
        damage: playerDamage,
        defenderHp: state.enemy.currentHp,
      };
      state.lastPlayerResolution = res;
      addLog({
        phase: PHASES.RESOLUTION,
        message: `You: "${playerCombo.phrase}" strikes for ${playerDamage} damage!`,
        isPlayer: true,
        damage: playerDamage,
        valid: true,
      });
    } else {
      const res: BattleResolution = {
        attackerId: state.player.id,
        defenderId: state.enemy.id,
        combo: playerCombo,
        damage: 0,
        defenderHp: state.enemy.currentHp ?? 0,
      };
      state.lastPlayerResolution = res;
      addLog({
        phase: PHASES.RESOLUTION,
        message: `You: "${playerCombo.phrase}" fizzles. ${playerCombo.reasons[0] || ''}`,
        isPlayer: true,
        valid: false,
      });
    }

    // Check Victory
    if ((state.enemy.currentHp ?? 0) <= 0) {
      state.phase = PHASES.BATTLE_END;
      state.winner = state.player.id;
      addLog({
        phase: PHASES.BATTLE_END,
        message: `Victory! ${state.player.name} defeated ${state.enemy.name}!`,
        valid: true,
      });
      return { ...state };
    }

    // 2. Enemy Turn
    state.phase = PHASES.ENEMY_TURN;
    const enemyComboPair = pickEnemyCombo(state.enemy, options.words);
    if (enemyComboPair) {
      const enemyCombo = evaluateCombo(state.enemy, enemyComboPair.adjective, enemyComboPair.noun);
      const enemyDamage = calculateDamage(state.enemy, state.player, enemyCombo);

      if (enemyCombo.valid) {
        state.player.currentHp = Math.max(0, (state.player.currentHp ?? 0) - enemyDamage);
        const res: BattleResolution = {
          attackerId: state.enemy.id,
          defenderId: state.player.id,
          combo: enemyCombo,
          damage: enemyDamage,
          defenderHp: state.player.currentHp,
        };
        state.lastEnemyResolution = res;
        addLog({
          phase: PHASES.ENEMY_TURN,
          message: `Rival: "${enemyCombo.phrase}" strikes for ${enemyDamage} damage!`,
          isPlayer: false,
          damage: enemyDamage,
          valid: true,
        });
      }
    }

    // Check Defeat
    if ((state.player.currentHp ?? 0) <= 0) {
      state.phase = PHASES.BATTLE_END;
      state.winner = state.enemy.id;
      addLog({
        phase: PHASES.BATTLE_END,
        message: `Defeat! ${state.enemy.name} triumphed over ${state.player.name}.`,
        valid: false,
      });
      return { ...state };
    }

    // Back to Player Turn
    state.phase = PHASES.PLAYER_TURN;
    return { ...state };
  }

  function restart(newPlayerId?: string): BattleState {
    const pId = newPlayerId || state.player.id;
    const playerObj = cloneCreature(options.creatures.find((c) => c.id === pId) || options.creatures[0]);
    const enemyObj = cloneCreature(
      options.creatures.find((c) => c.id === options.enemyId) ||
      options.creatures.find((c) => c.id !== pId) ||
      options.creatures[1]
    );

    state = {
      phase: PHASES.PLAYER_TURN,
      winner: null,
      player: playerObj,
      enemy: enemyObj,
      log: [
        {
          id: `start-${Date.now()}`,
          phase: PHASES.PLAYER_TURN,
          message: `A new battle commences! ${playerObj.name} vs ${enemyObj.name}.`,
          timestamp: Date.now(),
        },
      ],
      lastPlayerResolution: null,
      lastEnemyResolution: null,
    };
    return { ...state };
  }

  return {
    getState: () => ({ ...state }),
    submitCombo,
    restart,
  };
}
