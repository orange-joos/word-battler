/**
 * Event-Driven Combat Engine for Word Battler
 * Supports Strike (Adverb + Verb) and Guard (Adjective + Noun) sentences.
 */

export const PHASES = Object.freeze({
  PLAYER_TURN: "PLAYER_TURN",
  WORD_CHOICE: "WORD_CHOICE",
  RESOLUTION: "RESOLUTION",
  ENEMY_TURN: "ENEMY_TURN",
  BATTLE_END: "BATTLE_END",
});

const BASE_POWER = 6;
const ELEMENT_BONUS = 3;

function cloneCreature(template) {
  return {
    ...template,
    stats: { ...template.stats },
    currentHp: template.stats.hp,
    shield: 0,
    buffs: [],
  };
}

function findCreature(creatureId, catalog) {
  const found = catalog.find((c) => c.id === creatureId);
  if (!found) throw new Error(`Unknown creature: ${creatureId}`);
  return found;
}

function allWords(catalog) {
  return [
    ...(catalog.verbs || []),
    ...(catalog.nouns || []),
    ...(catalog.adjectives || []),
    ...(catalog.adverbs || []),
  ];
}

function findWord(wordIdOrText, catalog) {
  const key = String(wordIdOrText).toLowerCase();
  const found = allWords(catalog).find(
    (w) => w.id === key || w.word.toLowerCase() === key
  );
  if (!found) throw new Error(`Unknown word: ${wordIdOrText}`);
  return found;
}

/**
 * Validates grammar rules and returns an ordered array of events.
 */
export function resolveSentence(attacker, defender, word1, word2, catalog) {
  const events = [];
  const allowedElements = new Set(attacker.allowedElements || [attacker.element]);

  // Determine pattern: Strike (adverb+verb or verb) or Guard (adjective+noun)
  const isStrike = word2.partOfSpeech === "verb";
  const isGuard = word2.partOfSpeech === "noun";

  if (!isStrike && !isGuard) {
    events.push({
      type: "fizzle",
      attackerId: attacker.id,
      reason: "Sentences must end in a Action Word (Verb) or a Thing (Noun)!",
    });
    return events;
  }

  // Element match check
  const elementMatch = allowedElements.has(word2.element);
  if (!elementMatch) {
    events.push({
      type: "fizzle",
      attackerId: attacker.id,
      reason: `${attacker.name} cannot harness ${word2.element} energy!`,
    });
    return events;
  }

  // Text-to-speech event for reading sentence aloud
  const phrase = word1 ? `${word1.word} ${word2.word}` : word2.word;
  events.push({ type: "speak", text: phrase });

  if (isStrike) {
    let damage = BASE_POWER + (attacker.stats.attack || 10);
    if (word2.element === attacker.element) damage += ELEMENT_BONUS;
    if (word1 && word1.partOfSpeech === "adverb") damage += 4; // Adverb boost

    // Check defender shield first
    let actualDamage = damage;
    if (defender.shield > 0) {
      if (defender.shield >= actualDamage) {
        defender.shield -= actualDamage;
        events.push({ type: "shield_hit", targetId: defender.id, absorbed: actualDamage });
        actualDamage = 0;
      } else {
        actualDamage -= defender.shield;
        events.push({ type: "shield_break", targetId: defender.id, absorbed: defender.shield });
        defender.shield = 0;
      }
    }

    if (actualDamage > 0) {
      defender.currentHp = Math.max(0, defender.currentHp - actualDamage);
      events.push({
        type: "damage",
        attackerId: attacker.id,
        targetId: defender.id,
        amount: actualDamage,
        targetHp: defender.currentHp,
        phrase,
      });
    }
  } else if (isGuard) {
    const shieldAmount = BASE_POWER + (attacker.stats.defense || 5);
    attacker.shield += shieldAmount;
    events.push({
      type: "shield",
      targetId: attacker.id,
      amount: shieldAmount,
      totalShield: attacker.shield,
      phrase,
    });
  }

  return events;
}

export function createBattle(options = {}) {
  if (!options.creatures || !options.words) {
    throw new Error("createBattle requires creatures and words data.");
  }

  const catalog = {
    creatures: options.creatures,
    words: options.words,
  };

  const player = cloneCreature(findCreature(options.playerId || "emberfox", catalog.creatures));
  const enemy = cloneCreature(findCreature(options.enemyId || "rimepup", catalog.creatures));

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
      player: { ...battle.player },
      enemy: { ...battle.enemy },
      log: battle.log.slice(),
    };
  }

  function submitCombo(word1Id, word2Id) {
    const word1 = word1Id ? findWord(word1Id, catalog.words) : null;
    const word2 = findWord(word2Id, catalog.words);

    // Player action
    const playerEvents = resolveSentence(player, enemy, word1, word2, catalog);
    battle.log.push(...playerEvents);

    if (enemy.currentHp <= 0) {
      battle.phase = PHASES.BATTLE_END;
      battle.winner = player;
      battle.log.push({ type: "victory", winnerId: player.id });
      return { state: getState(), events: playerEvents };
    }

    // AI Enemy Turn (Picks a basic noun or verb from available words)
    const enemyWord2 = allWords(catalog.words).find(
      (w) => enemy.allowedElements.includes(w.element) && (w.partOfSpeech === "verb" || w.partOfSpeech === "noun")
    );
    
    let enemyEvents = [];
    if (enemyWord2) {
      enemyEvents = resolveSentence(enemy, player, null, enemyWord2, catalog);
      battle.log.push(...enemyEvents);
    }

    if (player.currentHp <= 0) {
      battle.phase = PHASES.BATTLE_END;
      battle.winner = enemy;
      battle.log.push({ type: "defeat", winnerId: enemy.id });
    }

    return { state: getState(), events: [...playerEvents, ...enemyEvents] };
  }

  return {
    PHASES,
    start: () => getState(),
    submitCombo,
    getState,
  };
}