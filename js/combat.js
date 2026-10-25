/**
 * Word Battler — 4x4 Action Matrix Combat Engine (Layer 3: Sentence Construction)
 * Standard ES6 Module with full JSDoc annotations for lightweight, cross-platform execution.
 *
 * The 4x4 Matrix maps 4 Move Categories (ATTACK, DEFEND, BUFF, DEBUFF)
 * across 4 Parts of Speech (VERB, NOUN, ADJECTIVE, ADVERB) with 1-word and 2-word combinations.
 *
 * @module combat
 */

/**
 * @typedef {'ATTACK' | 'DEFEND' | 'BUFF' | 'DEBUFF'} MoveCategory
 */

/**
 * @typedef {'verb' | 'noun' | 'adjective' | 'adverb'} PartOfSpeech
 */

/**
 * @typedef {Object} Word
 * @property {string} id
 * @property {string} word
 * @property {PartOfSpeech} partOfSpeech
 * @property {string} element
 * @property {string} definition
 * @property {string} example
 * @property {Object} [forge]
 */

/**
 * @typedef {Object} StatusEffect
 * @property {string} id
 * @property {string} name
 * @property {'buff' | 'debuff'} type
 * @property {number} duration
 * @property {number} [amount]
 * @property {string} [stat]
 * @property {string} [description]
 */

/**
 * @typedef {Object} CreatureStats
 * @property {number} hp
 * @property {number} attack
 * @property {number} defense
 * @property {number} speed
 */

/**
 * @typedef {Object} Creature
 * @property {string} id
 * @property {string} name
 * @property {string} element
 * @property {string} description
 * @property {CreatureStats} stats
 * @property {number} currentHp
 * @property {number} maxHp
 * @property {number} shield
 * @property {string[]} allowedWordTypes
 * @property {string[]} allowedElements
 * @property {StatusEffect[]} [statuses]
 * @property {boolean} [empowered]
 * @property {boolean} [reflectStance]
 * @property {boolean} [evasionStance]
 */

/**
 * @typedef {Object} CombatEvent
 * @property {'SPEAK' | 'DAMAGE' | 'SHIELD' | 'BUFF' | 'DEBUFF' | 'EVADE' | 'REFLECT' | 'FIZZLE' | 'VICTORY' | 'DEFEAT' | 'STATUS_TICK'} type
 * @property {string} [attackerId]
 * @property {string} [targetId]
 * @property {number} [amount]
 * @property {number} [absorbed]
 * @property {string} [stat]
 * @property {number} [duration]
 * @property {string} [effect]
 * @property {string} [phrase]
 * @property {string} [reason]
 * @property {string} [text]
 * @property {string} [winnerId]
 */

export const MOVE_CATEGORIES = Object.freeze({
  ATTACK: 'ATTACK',
  DEFEND: 'DEFEND',
  BUFF: 'BUFF',
  DEBUFF: 'DEBUFF',
});

export const PHASES = Object.freeze({
  PLAYER_TURN: 'PLAYER_TURN',
  RESOLUTION: 'RESOLUTION',
  ENEMY_TURN: 'ENEMY_TURN',
  BATTLE_END: 'BATTLE_END',
});

const BASE_POWER = 6;
const ELEMENT_SYNERGY_BONUS = 4;
const CRIT_MULTIPLIER = 1.75;

/**
 * Clone creature with fresh combat meters and status lists.
 * @param {Creature} template
 * @returns {Creature}
 */
export function cloneCreature(template) {
  return {
    ...template,
    stats: { ...template.stats },
    currentHp: template.currentHp ?? template.stats.hp,
    maxHp: template.stats.hp,
    shield: 0,
    statuses: [],
    empowered: false,
    reflectStance: false,
    evasionStance: false,
    allowedWordTypes: template.allowedWordTypes || ['adjective', 'noun', 'verb', 'adverb'],
    allowedElements: template.allowedElements || [template.element],
  };
}

/**
 * Resolve an action within the 4x4 Matrix.
 * Supports both single-word actions (word1) and 2-word combos (word1 + word2).
 *
 * @param {Creature} attacker
 * @param {Creature} defender
 * @param {MoveCategory} category
 * @param {Word} word1 - Modifier or primary word
 * @param {Word} [word2] - Head word (if 2-word combo)
 * @returns {CombatEvent[]} Array of chronological combat events
 */
export function resolveSentence(attacker, defender, category, word1, word2) {
  const events = [];

  if (!word1 && !word2) {
    events.push({
      type: 'FIZZLE',
      attackerId: attacker.id,
      reason: 'Every action requires at least one elemental word!',
    });
    return events;
  }

  // Determine Primary (Head) and Secondary (Modifier)
  const headWord = word2 || word1;
  const modifierWord = word2 ? word1 : null;

  // Check elemental compatibility
  const allowedElements = new Set(attacker.allowedElements || [attacker.element]);
  if (!allowedElements.has(headWord.element)) {
    events.push({
      type: 'FIZZLE',
      attackerId: attacker.id,
      reason: `${attacker.name} cannot harness ${headWord.element} energy! Choose a matching element.`,
    });
    return events;
  }

  if (modifierWord && !allowedElements.has(modifierWord.element)) {
    events.push({
      type: 'FIZZLE',
      attackerId: attacker.id,
      reason: `${attacker.name} cannot harness ${modifierWord.element} in "${modifierWord.word}".`,
    });
    return events;
  }

  // Text-To-Speech Event for reading sentence aloud
  const phrase = modifierWord ? `${modifierWord.word} ${headWord.word}` : headWord.word;
  events.push({ type: 'SPEAK', text: phrase });

  // Calculate Elemental Harmony & Morphology Bonuses
  let synergyBonus = 0;
  if (headWord.element === attacker.element) synergyBonus += ELEMENT_SYNERGY_BONUS;
  if (modifierWord && modifierWord.element === headWord.element) synergyBonus += 2;
  if (headWord.forge?.powerBonus) synergyBonus += headWord.forge.powerBonus;
  if (modifierWord?.forge?.powerBonus) synergyBonus += modifierWord.forge.powerBonus;

  // -------------------------------------------------------------
  // 1. ATTACK CATEGORY (Offensive Strikes)
  // -------------------------------------------------------------
  if (category === MOVE_CATEGORIES.ATTACK) {
    // Check if defender has active Evasion Stance
    if (defender.evasionStance) {
      defender.evasionStance = false;
      events.push({
        type: 'EVADE',
        attackerId: defender.id,
        targetId: attacker.id,
        reason: `${defender.name} swiftly evaded the strike with nimble maneuvers!`,
      });
      return events;
    }

    let baseDmg = BASE_POWER + (attacker.stats.attack || 10) + synergyBonus;
    let armorPierce = false;
    let isCrit = false;

    // Head POS Resolution
    if (headWord.partOfSpeech === 'verb') {
      // Direct Strike: High base damage
      baseDmg += 8;
    } else if (headWord.partOfSpeech === 'noun') {
      // Object Impact: Medium damage + Armor Piercing
      baseDmg += 4;
      armorPierce = true;
    } else if (headWord.partOfSpeech === 'adjective') {
      // Descriptive Assault: Elemental synergy + status condition
      baseDmg += 5;
      const dotEffect = headWord.element === 'fire' ? 'Burn' : 'Frostbite';
      defender.statuses.push({
        id: `dot-${Date.now()}`,
        name: dotEffect,
        type: 'debuff',
        duration: 3,
        amount: 4,
        description: `${dotEffect}: takes damage each turn.`,
      });
      events.push({
        type: 'DEBUFF',
        targetId: defender.id,
        effect: dotEffect,
        duration: 3,
        phrase,
      });
    } else if (headWord.partOfSpeech === 'adverb') {
      // Momentum Strike: High crit potential
      baseDmg += 3;
      isCrit = Math.random() < 0.5; // 50% crit for pure adverb strike
    }

    // Modifier POS Nuances
    if (modifierWord) {
      if (modifierWord.partOfSpeech === 'adverb') {
        isCrit = isCrit || Math.random() < 0.4;
      } else if (modifierWord.partOfSpeech === 'adjective') {
        baseDmg += 3;
      }
    }

    // Empowered bonus from previous buff
    if (attacker.empowered) {
      baseDmg = Math.round(baseDmg * 1.5);
      attacker.empowered = false;
    }

    if (isCrit) {
      baseDmg = Math.round(baseDmg * CRIT_MULTIPLIER);
    }

    // Calculate against defender stats & shields
    let rawDamage = Math.max(3, baseDmg - Math.floor(defender.stats.defense * (armorPierce ? 0.4 : 0.8)));
    let finalDamage = rawDamage;
    let absorbed = 0;

    if (defender.shield > 0) {
      if (armorPierce) {
        // Pierces 50% of shield directly to HP
        const directDmg = Math.floor(rawDamage * 0.5);
        const shieldTargetDmg = rawDamage - directDmg;
        const absorbedAmount = Math.min(defender.shield, shieldTargetDmg);
        defender.shield -= absorbedAmount;
        absorbed = absorbedAmount;
        finalDamage = directDmg + (shieldTargetDmg - absorbedAmount);
      } else {
        if (defender.shield >= rawDamage) {
          absorbed = rawDamage;
          defender.shield -= rawDamage;
          finalDamage = 0;
        } else {
          absorbed = defender.shield;
          finalDamage = rawDamage - defender.shield;
          defender.shield = 0;
        }
      }
    }

    defender.currentHp = Math.max(0, defender.currentHp - finalDamage);

    events.push({
      type: 'DAMAGE',
      attackerId: attacker.id,
      targetId: defender.id,
      amount: finalDamage,
      absorbed,
      phrase: isCrit ? `CRITICAL! ${phrase}` : phrase,
    });

    // Check Counter-Stance reflection
    if (defender.reflectStance && finalDamage > 0) {
      const reflected = Math.max(2, Math.round(finalDamage * 0.4));
      attacker.currentHp = Math.max(0, attacker.currentHp - reflected);
      events.push({
        type: 'REFLECT',
        attackerId: defender.id,
        targetId: attacker.id,
        amount: reflected,
        reason: `${defender.name}'s counter-stance reflected ${reflected} damage back!`,
      });
      defender.reflectStance = false;
    }
  }

  // -------------------------------------------------------------
  // 2. DEFEND CATEGORY (Shielding & Mitigation)
  // -------------------------------------------------------------
  else if (category === MOVE_CATEGORIES.DEFEND) {
    if (headWord.partOfSpeech === 'noun') {
      // Fortification: High flat shield
      const shieldAmount = 14 + (attacker.stats.defense || 6) + synergyBonus;
      attacker.shield += shieldAmount;
      events.push({
        type: 'SHIELD',
        targetId: attacker.id,
        amount: shieldAmount,
        phrase,
      });
    } else if (headWord.partOfSpeech === 'adjective') {
      // Barrier Quality: Moderate shield + damage reduction status
      const shieldAmount = 8 + synergyBonus;
      attacker.shield += shieldAmount;
      attacker.statuses.push({
        id: `barrier-${Date.now()}`,
        name: 'Iron Barrier',
        type: 'buff',
        duration: 2,
        amount: 30, // 30% damage reduction
        description: 'Reduces incoming attack damage by 30%.',
      });
      events.push({
        type: 'SHIELD',
        targetId: attacker.id,
        amount: shieldAmount,
        phrase,
      });
      events.push({
        type: 'BUFF',
        targetId: attacker.id,
        stat: 'Iron Barrier (30% Mitigation)',
        duration: 2,
        phrase,
      });
    } else if (headWord.partOfSpeech === 'adverb') {
      // Evasive Maneuvering: Evasion Stance
      attacker.evasionStance = true;
      events.push({
        type: 'BUFF',
        targetId: attacker.id,
        stat: 'Evasive Stance',
        duration: 1,
        phrase,
      });
    } else if (headWord.partOfSpeech === 'verb') {
      // Counter-Stance: Minor shield + reflect stance
      const shieldAmount = 6 + synergyBonus;
      attacker.shield += shieldAmount;
      attacker.reflectStance = true;
      events.push({
        type: 'SHIELD',
        targetId: attacker.id,
        amount: shieldAmount,
        phrase,
      });
      events.push({
        type: 'BUFF',
        targetId: attacker.id,
        stat: 'Counter-Stance (40% Reflect)',
        duration: 1,
        phrase,
      });
    }
  }

  // -------------------------------------------------------------
  // 3. BUFF CATEGORY (Enhancements & Stat Boosts)
  // -------------------------------------------------------------
  else if (category === MOVE_CATEGORIES.BUFF) {
    if (headWord.partOfSpeech === 'adjective') {
      // Attribute Boost: +4 Attack for 3 turns
      attacker.stats.attack += 4;
      attacker.statuses.push({
        id: `atk-buff-${Date.now()}`,
        name: 'Mighty Surge',
        type: 'buff',
        duration: 3,
        stat: 'attack',
        amount: 4,
        description: '+4 Attack boost.',
      });
      events.push({
        type: 'BUFF',
        targetId: attacker.id,
        stat: '+4 Attack (3 Turns)',
        duration: 3,
        phrase,
      });
    } else if (headWord.partOfSpeech === 'adverb') {
      // Temporal Boost: Health Regeneration for 3 turns
      attacker.statuses.push({
        id: `regen-${Date.now()}`,
        name: 'Regeneration',
        type: 'buff',
        duration: 3,
        amount: 6,
        description: 'Restores +6 HP every turn.',
      });
      events.push({
        type: 'BUFF',
        targetId: attacker.id,
        stat: 'Regeneration (+6 HP/Turn)',
        duration: 3,
        phrase,
      });
    } else if (headWord.partOfSpeech === 'verb') {
      // Empower Action: Boost next turn's offensive power by 50%
      attacker.empowered = true;
      events.push({
        type: 'BUFF',
        targetId: attacker.id,
        stat: 'Empowered Spirit (+50% Next Attack)',
        duration: 1,
        phrase,
      });
    } else if (headWord.partOfSpeech === 'noun') {
      // Catalyst Summon: Temporary elemental weapon infusion
      attacker.stats.defense += 4;
      attacker.statuses.push({
        id: `catalyst-${Date.now()}`,
        name: 'Elemental Catalyst',
        type: 'buff',
        duration: 3,
        stat: 'defense',
        amount: 4,
        description: '+4 Defense boost.',
      });
      events.push({
        type: 'BUFF',
        targetId: attacker.id,
        stat: '+4 Defense Catalyst (3 Turns)',
        duration: 3,
        phrase,
      });
    }
  }

  // -------------------------------------------------------------
  // 4. DEBUFF CATEGORY (Disruptions & Status Conditions)
  // -------------------------------------------------------------
  else if (category === MOVE_CATEGORIES.DEBUFF) {
    if (headWord.partOfSpeech === 'adverb') {
      // Interference: Reduces enemy speed and accuracy
      defender.stats.speed = Math.max(1, defender.stats.speed - 4);
      defender.statuses.push({
        id: `slow-${Date.now()}`,
        name: 'Interference',
        type: 'debuff',
        duration: 3,
        amount: 4,
        stat: 'speed',
        description: '-4 Speed reduction.',
      });
      events.push({
        type: 'DEBUFF',
        targetId: defender.id,
        effect: '-4 Speed & Low Accuracy',
        duration: 3,
        phrase,
      });
    } else if (headWord.partOfSpeech === 'adjective') {
      // Condition Affliction: Frostbite/Burn (-3 DEF & 4 DOT)
      defender.stats.defense = Math.max(0, defender.stats.defense - 3);
      defender.statuses.push({
        id: `condition-${Date.now()}`,
        name: 'Frost/Burn Affliction',
        type: 'debuff',
        duration: 3,
        amount: 4,
        description: '-3 Defense and 4 damage each turn.',
      });
      events.push({
        type: 'DEBUFF',
        targetId: defender.id,
        effect: '-3 Defense & Affliction DOT',
        duration: 3,
        phrase,
      });
    } else if (headWord.partOfSpeech === 'verb') {
      // Constraint: Traps enemy motion
      defender.statuses.push({
        id: `stun-${Date.now()}`,
        name: 'Motion Constraint',
        type: 'debuff',
        duration: 1,
        description: 'Enemy action delayed.',
      });
      events.push({
        type: 'DEBUFF',
        targetId: defender.id,
        effect: 'Motion Constraint (Skip/Delayed Turn)',
        duration: 1,
        phrase,
      });
    } else if (headWord.partOfSpeech === 'noun') {
      // Obstruction: Smoke screen / ice block
      defender.statuses.push({
        id: `obscure-${Date.now()}`,
        name: 'Obstruction Screen',
        type: 'debuff',
        duration: 2,
        description: 'Blocks enemy vision and accuracy.',
      });
      events.push({
        type: 'DEBUFF',
        targetId: defender.id,
        effect: 'Obstruction Barrier Screen',
        duration: 2,
        phrase,
      });
    }
  }

  return events;
}

/**
 * Tick active statuses for a creature at the start of their turn.
 * @param {Creature} creature
 * @returns {CombatEvent[]}
 */
export function tickStatuses(creature) {
  const events = [];
  if (!creature.statuses || creature.statuses.length === 0) return events;

  creature.statuses = creature.statuses.filter((status) => {
    // Process DOT / Regen
    if (status.name === 'Regeneration' && status.amount) {
      creature.currentHp = Math.min(creature.maxHp, creature.currentHp + status.amount);
      events.push({
        type: 'STATUS_TICK',
        targetId: creature.id,
        amount: status.amount,
        effect: 'Regeneration (+HP)',
      });
    } else if ((status.name === 'Burn' || status.name === 'Frostbite' || status.name === 'Frost/Burn Affliction') && status.amount) {
      creature.currentHp = Math.max(0, creature.currentHp - status.amount);
      events.push({
        type: 'STATUS_TICK',
        targetId: creature.id,
        amount: status.amount,
        effect: `${status.name} (Damage over time)`,
      });
    }

    status.duration -= 1;
    return status.duration > 0;
  });

  return events;
}

/**
 * Create a combat session with the 4x4 matrix engine.
 * @param {Object} options
 * @param {Creature[]} options.creatures
 * @param {Object} options.words
 * @param {string} [options.playerId]
 * @param {string} [options.enemyId]
 */
export function createBattle(options) {
  if (!options.creatures || !options.words) {
    throw new Error('createBattle requires creatures and words data.');
  }

  const playerTemplate = options.creatures.find((c) => c.id === options.playerId) || options.creatures[0];
  const enemyTemplate =
    options.creatures.find((c) => c.id === options.enemyId) ||
    options.creatures.find((c) => c.id !== options.playerId) ||
    options.creatures[1];

  const player = cloneCreature(playerTemplate);
  const enemy = cloneCreature(enemyTemplate);

  const battle = {
    phase: PHASES.PLAYER_TURN,
    player,
    enemy,
    log: [],
    winner: null,
  };

  function getState() {
    return {
      phase: battle.phase,
      winner: battle.winner ? battle.winner.id : null,
      player: { ...battle.player, statuses: [...(battle.player.statuses || [])] },
      enemy: { ...battle.enemy, statuses: [...(battle.enemy.statuses || [])] },
      log: battle.log.slice(),
    };
  }

  /**
   * Submit an action combo in the 4x4 Action Matrix.
   * @param {MoveCategory} category
   * @param {Word} word1
   * @param {Word} [word2]
   */
  function submitAction(category, word1, word2) {
    // 1. Tick player statuses
    const startTicks = tickStatuses(player);
    battle.log.push(...startTicks);

    // 2. Player action
    const playerEvents = resolveSentence(player, enemy, category, word1, word2);
    battle.log.push(...playerEvents);

    // Track daily missions if adjectives are used
    if (typeof window !== 'undefined' && typeof window.advanceDailyMission === 'function') {
      if (word1?.partOfSpeech === 'adjective' || word2?.partOfSpeech === 'adjective') {
        window.advanceDailyMission('adjective', 1);
      }
    }

    if (enemy.currentHp <= 0) {
      battle.phase = PHASES.BATTLE_END;
      battle.winner = player;
      battle.log.push({ type: 'VICTORY', winnerId: player.id });
      if (typeof window !== 'undefined' && typeof window.advanceDailyMission === 'function') {
        window.advanceDailyMission('combat', 1);
      }
      return { state: getState(), events: [...startTicks, ...playerEvents] };
    }

    // 3. Enemy AI Turn
    battle.phase = PHASES.ENEMY_TURN;
    const enemyTicks = tickStatuses(enemy);
    battle.log.push(...enemyTicks);

    // Check if enemy is constrained/stunned
    const isConstrained = enemy.statuses.some((s) => s.name === 'Motion Constraint');
    let enemyEvents = [];

    if (!isConstrained) {
      const allWords = [
        ...(options.words.verbs || []),
        ...(options.words.nouns || []),
        ...(options.words.adjectives || []),
        ...(options.words.adverbs || []),
      ];

      // Pick elemental words available to enemy
      const enemyWords = allWords.filter((w) => enemy.allowedElements.includes(w.element));
      const aiWord = enemyWords[Math.floor(Math.random() * enemyWords.length)] || enemyWords[0];

      // AI Decision: Defend if low, Buff/Attack otherwise
      let aiCategory = MOVE_CATEGORIES.ATTACK;
      if (enemy.currentHp / enemy.maxHp < 0.4 && enemy.shield === 0) {
        aiCategory = MOVE_CATEGORIES.DEFEND;
      } else if (Math.random() < 0.25) {
        aiCategory = MOVE_CATEGORIES.BUFF;
      }

      if (aiWord) {
        enemyEvents = resolveSentence(enemy, player, aiCategory, aiWord);
        battle.log.push(...enemyEvents);
      }
    } else {
      battle.log.push({
        type: 'DEBUFF',
        targetId: enemy.id,
        reason: `${enemy.name} is constrained and cannot move this turn!`,
      });
    }

    if (player.currentHp <= 0) {
      battle.phase = PHASES.BATTLE_END;
      battle.winner = enemy;
      battle.log.push({ type: 'DEFEAT', winnerId: enemy.id });
    } else {
      battle.phase = PHASES.PLAYER_TURN;
    }

    return {
      state: getState(),
      events: [...startTicks, ...playerEvents, ...enemyTicks, ...enemyEvents],
    };
  }

  return {
    PHASES,
    MOVE_CATEGORIES,
    getState,
    submitAction,
  };
}
