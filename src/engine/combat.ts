/**
 * Word-driven combat engine. A word's part of speech determines its action;
 * adjectives can be marked as buffs or debuffs in the word catalog.
 */

import {
  BattleLogEntry,
  BattlePhase,
  BattleState,
  CatalogWords,
  ComboEvaluation,
  CombatEvent,
  Creature,
  CreatureStats,
  MoveCategory,
  PartOfSpeech,
  StatusEffect,
  Word,
} from '../types';
import { ELEMENTS } from '../data/elements';
import { getAllWordsList } from './forge';

export const PHASES = Object.freeze({
  PLAYER_TURN: 'PLAYER_TURN' as BattlePhase,
  WORD_CHOICE: 'WORD_CHOICE' as BattlePhase,
  RESOLUTION: 'RESOLUTION' as BattlePhase,
  ENEMY_TURN: 'ENEMY_TURN' as BattlePhase,
  BATTLE_END: 'BATTLE_END' as BattlePhase,
});

const BASE_POWER = 6;
const ELEMENT_SYNERGY_BONUS = 4;
const CRIT_MULTIPLIER = 1.75;
const ELEMENT_STAT_SCALE = 1.05;

const EFFECTS: Record<MoveCategory, Record<PartOfSpeech, { name: string; description: string }>> = {
  ATTACK: {
    verb: { name: 'Direct Strike', description: 'Verbs deal the heaviest direct damage.' },
    noun: { name: 'Piercing Impact', description: 'Nouns deal medium damage and pierce half of a shield.' },
    adjective: { name: 'Elemental Flair', description: 'Adjectives add a 5% elemental damage flourish and a brief affliction.' },
    adverb: { name: 'Critical Tempo', description: 'Adverbs add a chance to critically strike.' },
  },
  DEFEND: {
    noun: { name: 'Fortification', description: 'Nouns raise a strong, flat shield.' },
    adjective: { name: 'Protective Quality', description: 'Adjectives reduce incoming damage by 30% for one turn.' },
    adverb: { name: 'Evasive Step', description: 'Adverbs grant a 50% chance to evade the next hit.' },
    verb: { name: 'Counter-Stance', description: 'Verbs raise a small shield and reflect 40% of the next hit.' },
  },
  BUFF: {
    adjective: { name: 'Attribute Surge', description: 'Adjectives raise attack and speed for three turns.' },
    adverb: { name: 'Regeneration', description: 'Adverbs restore health for three turns.' },
    verb: { name: 'Empowered Action', description: 'Verbs empower the next outgoing attack.' },
    noun: { name: 'Elemental Infusion', description: 'Nouns infuse matching attacks with 15% extra damage for three turns.' },
  },
  DEBUFF: {
    adverb: { name: 'Interference', description: 'Adverbs reduce accuracy and speed for three turns.' },
    adjective: { name: 'Affliction', description: 'Adjectives lower defense and deal damage over time.' },
    verb: { name: 'Motion Constraint', description: 'Verbs delay the opponent, skipping their next action.' },
    noun: { name: 'Combo Block', description: 'Nouns block the opponent from using two-word combos.' },
  },
};

function scaledStats(stats: CreatureStats, element: Creature['element']): CreatureStats {
  const result = { ...stats };
  const scaledStat = ELEMENTS[element].stat;
  result[scaledStat] = Math.round(result[scaledStat] * ELEMENT_STAT_SCALE);
  return result;
}

export function cloneCreature(template: Creature): Creature {
  const affinity = template.elementAffinity || template.element;
  const stats = scaledStats(template.stats, affinity);
  const allowedWordTypes: PartOfSpeech[] =
    template.allowedWordTypes?.length
      ? [...template.allowedWordTypes]
      : ['adjective', 'noun', 'verb', 'adverb'];

  return {
    ...template,
    elementAffinity: affinity,
    loadout: template.loadout
      ? { ...template.loadout }
      : { verb: null, noun: null, adjective: null, adverb: null },
    allowedWordTypes,
    allowedElements: template.allowedElements?.length ? [...template.allowedElements] : [affinity],
    stats,
    currentHp: template.currentHp ?? stats.hp,
    maxHp: stats.hp,
    shield: template.shield ?? 0,
    statuses: [],
    empowered: false,
    reflectStance: false,
    evasionStance: false,
    evadeChance: 0,
    infusionElement: undefined,
  };
}

export function getMatrixEffectInfo(category: MoveCategory, pos: PartOfSpeech): {
  name: string;
  description: string;
} {
  return EFFECTS[category][pos];
}

function intrinsicCategory(word: Word): MoveCategory | null {
  switch (word.partOfSpeech) {
    case 'verb':
      return 'ATTACK';
    case 'noun':
      return 'DEFEND';
    case 'adjective':
      return word.combatCategory === 'DEBUFF' ? 'DEBUFF' : 'BUFF';
    case 'adverb':
      return null;
  }
}

function comboShape(word1: Word, word2: Word | null): {
  category: MoveCategory | null;
  head: Word;
  modifier: Word | null;
  error?: string;
} {
  if (!word2) {
    const category = intrinsicCategory(word1);
    return {
      category,
      head: word1,
      modifier: null,
      error: category ? undefined : 'Adverbs modify verbs; add a verb after the adverb to make a strike combo.',
    };
  }

  if (word1.partOfSpeech === 'adjective' && word2.partOfSpeech === 'noun') {
    return { category: 'DEFEND', head: word2, modifier: word1 };
  }
  if (word1.partOfSpeech === 'adverb' && word2.partOfSpeech === 'verb') {
    return { category: 'ATTACK', head: word2, modifier: word1 };
  }

  if (word1.partOfSpeech === 'noun' && word2.partOfSpeech === 'adjective') {
    return {
      category: 'DEFEND',
      head: word1,
      modifier: word2,
      error: 'Put the adjective first and the noun second, like “frozen shield.”',
    };
  }
  if (word1.partOfSpeech === 'verb' && word2.partOfSpeech === 'adverb') {
    return {
      category: 'ATTACK',
      head: word1,
      modifier: word2,
      error: 'Put the adverb first and the verb second, like “fiercely scorch.”',
    };
  }

  return {
    category: intrinsicCategory(word2) || intrinsicCategory(word1),
    head: word2,
    modifier: word1,
    error: 'Try one word, adjective + noun for defense, or adverb + verb for a strike.',
  };
}

export function evaluateCombo(
  attacker: Creature,
  word1: Word | null,
  word2: Word | null = null,
  word3: Word | null = null,
  word4: Word | null = null
): ComboEvaluation {
  const emptyWord = word1 || word2 || word3 || word4;
  const fallbackCategory = emptyWord ? intrinsicCategory(emptyWord) || 'ATTACK' : 'ATTACK';
  if (!word1) {
    return {
      valid: false,
      category: fallbackCategory,
      phrase: '—',
      word1: null,
      word2,
      word3,
      word4,
      power: 0,
      shieldGain: 0,
      effectName: 'Unassigned',
      tacticalOutcome: 'Choose a word card or weave a sentence to begin.',
      reasons: ['Choose a word card to begin.'],
    };
  }

  // 4-CARD ULTIMATE SENTENCE WEAVE: [Adjective] + [Noun] + [Verb] + [Adverb]
  if (word1 && word2 && word3 && word4) {
    const isStandardOrder =
      word1.partOfSpeech === 'adjective' &&
      word2.partOfSpeech === 'noun' &&
      word3.partOfSpeech === 'verb' &&
      word4.partOfSpeech === 'adverb';

    const adj = [word1, word2, word3, word4].find((w) => w.partOfSpeech === 'adjective') || word1;
    const noun = [word1, word2, word3, word4].find((w) => w.partOfSpeech === 'noun') || word2;
    const verb = [word1, word2, word3, word4].find((w) => w.partOfSpeech === 'verb') || word3;
    const adv = [word1, word2, word3, word4].find((w) => w.partOfSpeech === 'adverb') || word4;

    const affinity = attacker.elementAffinity || attacker.element;
    let synergy = 6; // Base Ultimate Sentence Bonus
    for (const w of [adj, noun, verb, adv]) {
      if (w.element === affinity) synergy += 3;
      synergy += w.powerBonus ?? w.forge?.powerBonus ?? 0;
    }

    const phrase = `The ${adj.word} ${noun.word} ${verb.word}s ${adv.word}!`;
    const power = BASE_POWER + 12 + synergy;
    const shieldGain = Math.round(10 + attacker.stats.defense * 0.8 + (noun.powerBonus ?? 2));

    return {
      valid: true,
      category: 'ATTACK',
      phrase,
      word1: adj,
      word2: noun,
      word3: verb,
      word4: adv,
      isUltimateSentence: true,
      power,
      shieldGain,
      effectName: isStandardOrder ? 'Syntax Surge Ultimate' : 'Full Sentence Strike',
      tacticalOutcome:
        'Unleashes a 4-part grammatical sentence: deals massive Strike damage, raises a Fortification Shield, and surges Attack!',
      reasons: [
        `${attacker.name} weaves a complete sentence: “${phrase}” (+${power} Power & +${shieldGain} Shield!)`,
      ],
    };
  }

  const shape = comboShape(word1, word2);
  const category = shape.category || fallbackCategory;
  const phrase = word2 ? `${word1.word} ${word2.word}` : word1.word;
  const reasons: string[] = [];

  if (shape.error) reasons.push(shape.error);

  const valid = !shape.error && reasons.length === 0;
  const effectInfo = getMatrixEffectInfo(category, shape.head.partOfSpeech);
  let power = 0;
  let shieldGain = 0;

  if (valid) {
    const affinity = attacker.elementAffinity || attacker.element;
    let synergy = shape.head.element === affinity ? ELEMENT_SYNERGY_BONUS : 0;
    if (shape.modifier?.element === shape.head.element) synergy += 2;
    synergy += shape.head.powerBonus ?? shape.head.forge?.powerBonus ?? 0;
    synergy += shape.modifier?.powerBonus ?? shape.modifier?.forge?.powerBonus ?? 0;

    if (category === 'ATTACK') {
      const baseByPartOfSpeech: Record<PartOfSpeech, number> = {
        verb: 8,
        noun: 4,
        adjective: 5,
        adverb: 4,
      };
      power = BASE_POWER + baseByPartOfSpeech[shape.head.partOfSpeech] + synergy;
      if (shape.modifier?.partOfSpeech === 'adverb') power += 3;
      if (shape.modifier?.partOfSpeech === 'adjective') power += 2;
    } else if (category === 'DEFEND' && shape.head.partOfSpeech === 'noun') {
      shieldGain = 14 + attacker.stats.defense + synergy;
    } else if (category === 'DEFEND' && shape.head.partOfSpeech === 'verb') {
      shieldGain = 6 + Math.floor(attacker.stats.defense / 2) + synergy;
    }
  }

  return {
    valid,
    category,
    phrase,
    word1,
    word2,
    power,
    shieldGain,
    effectName: effectInfo.name,
    tacticalOutcome: effectInfo.description,
    reasons: valid
      ? [`${attacker.name} uses ${effectInfo.name.toLowerCase()} with “${phrase}.”`]
      : reasons,
  };
}

function changeStat(creature: Creature, stat: string, amount: number): void {
  switch (stat) {
    case 'attack':
    case 'defense':
    case 'speed':
      creature.stats[stat] = Math.max(0, creature.stats[stat] + amount);
      break;
    case 'accuracy':
      creature.stats.accuracy = Math.max(0.1, Math.min(1, (creature.stats.accuracy ?? 1) + amount));
      break;
  }
}

export function tickCreatureStatuses(creature: Creature): { message: string; heal?: number; damage?: number }[] {
  const events: { message: string; heal?: number; damage?: number }[] = [];
  creature.statuses = (creature.statuses || []).filter((status) => {
    if (status.name === 'Regeneration' && status.amount) {
      const healed = Math.min(status.amount, (creature.maxHp ?? creature.stats.hp) - (creature.currentHp ?? 0));
      creature.currentHp = Math.min(creature.maxHp ?? creature.stats.hp, (creature.currentHp ?? 0) + status.amount);
      events.push({ message: `${creature.name} restored ${healed} HP from Regeneration.`, heal: healed });
    } else if (['Burn', 'Chill', 'Thorn'].includes(status.name) && status.amount) {
      const damage = Math.min(status.amount, creature.currentHp ?? 0);
      creature.currentHp = Math.max(0, (creature.currentHp ?? 0) - status.amount);
      events.push({ message: `${creature.name} took ${damage} damage from ${status.name}.`, damage });
    }

    status.duration -= 1;
    if (status.duration > 0) return true;

    if (status.stat && status.amount) changeStat(creature, status.stat, -status.amount);
    if (status.name === 'Elemental Infusion') creature.infusionElement = undefined;
    if (status.name === 'Evasive Step') creature.evadeChance = 0;
    if (status.name === 'Counter-Stance') creature.reflectStance = false;
    return false;
  });
  return events;
}

export function createBattle(options: {
  playerId: string;
  enemyId: string;
  creatures: Creature[];
  words: CatalogWords;
}) {
  const playerTemplate =
    options.creatures.find((creature) => creature.id === options.playerId) || options.creatures[0];
  const enemyTemplate =
    options.creatures.find((creature) => creature.id === options.enemyId) ||
    options.creatures.find((creature) => creature.id !== options.playerId) ||
    options.creatures[1];
  const player = cloneCreature(playerTemplate);
  const enemy = cloneCreature(enemyTemplate);

  let state: BattleState = {
    phase: PHASES.PLAYER_TURN,
    winner: null,
    player,
    enemy,
    log: [],
    events: [],
    lastPlayerResolution: null,
    lastEnemyResolution: null,
  };
  let eventSequence = 0;

  function addEvent(event: CombatEvent): void {
    state.events.push(event);
    const actorIsPlayer = event.attackerId === state.player.id;
    const entry: Omit<BattleLogEntry, 'id' | 'timestamp'> = {
      phase: event.phase || state.phase,
      message: event.text || event.reason || event.effect || event.type,
      isPlayer: actorIsPlayer,
      valid: event.type !== 'FIZZLE' && event.type !== 'MISS',
      eventType: event.type,
      targetId: event.targetId,
    };
    if (event.type === 'DAMAGE' || event.type === 'MISS') entry.damage = event.type === 'DAMAGE' ? event.amount : undefined;
    if (event.type === 'SHIELD') entry.shield = event.amount;
    state.log.push({
      ...entry,
      id: `log-${Date.now()}-${++eventSequence}`,
      timestamp: Date.now(),
    });
  }

  function emit(
    type: CombatEvent['type'],
    actor: Creature,
    target: Creature | undefined,
    text: string,
    options: Partial<CombatEvent> = {},
    phase: BattlePhase = PHASES.RESOLUTION
  ): void {
    addEvent({
      type,
      attackerId: actor.id,
      targetId: target?.id,
      text,
      phase,
      ...options,
    });
  }

  function tickStatuses(creature: Creature, phase: BattlePhase): void {
    for (const tick of tickCreatureStatuses(creature)) {
      const type = tick.heal ? 'HEAL' : tick.damage ? 'DAMAGE' : 'STATUS_TICK';
      emit(
        type,
        creature,
        creature,
        tick.message,
        { amount: tick.heal ?? tick.damage, effect: tick.heal ? 'Regeneration' : undefined },
        phase
      );
    }
  }

  function applyStatus(
    target: Creature,
    actor: Creature,
    status: StatusEffect,
    phase: BattlePhase,
    category: MoveCategory
  ): void {
    target.statuses = target.statuses || [];
    const existing = target.statuses.find((entry) => entry.name === status.name);
    if (existing) {
      if (existing.stat && existing.amount) changeStat(target, existing.stat, -existing.amount);
      target.statuses = target.statuses.filter((entry) => entry !== existing);
    }
    target.statuses.push({ ...status, id: `${status.name.toLowerCase().replace(/\\s+/g, '-')}-${Date.now()}-${++eventSequence}` });
    if (status.stat && status.amount) changeStat(target, status.stat, status.amount);
    emit(
      status.type === 'buff' ? 'BUFF' : 'DEBUFF',
      actor,
      target,
      `${target.name} ${status.description || `is affected by ${status.name}.`}`,
      { effect: status.name, stat: status.stat, amount: status.amount, duration: status.duration, category },
      phase
    );
  }

  function damageTarget(
    attacker: Creature,
    defender: Creature,
    head: Word,
    combo: ComboEvaluation,
    modifier: Word | null,
    phase: BattlePhase
  ): { damage: number; shieldGain: number } {
    const accuracy = attacker.stats.accuracy ?? 1;
    if (Math.random() > accuracy) {
      emit('MISS', attacker, defender, `${attacker.name}'s strike missed.`, { phrase: combo.phrase }, phase);
      return { damage: 0, shieldGain: 0 };
    }

    const evadeChance = defender.evadeChance || 0;
    if (evadeChance > 0) {
      const evaded = Math.random() < evadeChance;
      defender.evadeChance = 0;
      defender.evasionStance = false;
      defender.statuses = (defender.statuses || []).filter((status) => status.name !== 'Evasive Step');
      if (evaded) {
        emit('EVADE', defender, attacker, `${defender.name} evaded “${combo.phrase}.”`, { phrase: combo.phrase }, phase);
        return { damage: 0, shieldGain: 0 };
      }
    }
    if (defender.evasionStance) {
      defender.evasionStance = false;
      emit('EVADE', defender, attacker, `${defender.name} evaded the strike.`, { phrase: combo.phrase }, phase);
      return { damage: 0, shieldGain: 0 };
    }

    let rawDamage = attacker.stats.attack + combo.power;
    if (attacker.infusionElement === head.element) rawDamage = Math.round(rawDamage * 1.15);
    if (attacker.empowered) {
      rawDamage = Math.round(rawDamage * 1.5);
      attacker.empowered = false;
    }
    const canCrit = head.partOfSpeech === 'adverb' || modifier?.partOfSpeech === 'adverb';
    const isCrit = canCrit && Math.random() < 0.4;
    if (isCrit) rawDamage = Math.round(rawDamage * CRIT_MULTIPLIER);
    if (head.partOfSpeech === 'adjective') rawDamage = Math.round(rawDamage * 1.05);

    const armorPierce = head.partOfSpeech === 'noun';
    const mitigation = Math.floor(defender.stats.defense * (armorPierce ? 0.35 : 0.8));
    let damage = Math.max(3, rawDamage - mitigation);
    const reduction = (defender.statuses || [])
      .filter((status) => status.name === 'Protective Quality')
      .reduce((total, status) => total + (status.amount || 0), 0);
    damage = Math.max(1, Math.round(damage * Math.max(0, 1 - reduction)));

    let absorbed = 0;
    if ((defender.shield ?? 0) > 0) {
      const shield = defender.shield ?? 0;
      const bypass = armorPierce ? Math.floor(damage * 0.5) : 0;
      const shieldableDamage = damage - bypass;
      absorbed = Math.min(shield, shieldableDamage);
      defender.shield = shield - absorbed;
      damage = bypass + (shieldableDamage - absorbed);
    }
    defender.currentHp = Math.max(0, (defender.currentHp ?? 0) - damage);
    emit(
      'DAMAGE',
      attacker,
      defender,
      `${isCrit ? 'Critical hit! ' : ''}${attacker.name} dealt ${damage} damage${absorbed ? ` (${absorbed} absorbed by shield)` : ''}.`,
      { amount: damage, absorbed, phrase: combo.phrase, category: combo.category },
      phase
    );

    if (defender.reflectStance && damage > 0) {
      const reflected = Math.max(1, Math.round(damage * 0.4));
      attacker.currentHp = Math.max(0, (attacker.currentHp ?? 0) - reflected);
      defender.reflectStance = false;
      emit('REFLECT', defender, attacker, `${defender.name} reflected ${reflected} damage.`, { amount: reflected }, phase);
    }

    if (combo.category === 'ATTACK' && head.partOfSpeech === 'adjective') {
      const affliction = head.element === 'fire' ? 'Burn' : head.element === 'grass' ? 'Thorn' : 'Chill';
      applyStatus(
        defender,
        attacker,
        { id: '', name: affliction, type: 'debuff', duration: 2, amount: 3, description: `is afflicted by ${affliction}.` },
        phase,
        combo.category
      );
    }
    return { damage, shieldGain: 0 };
  }

  function executeMove(
    attacker: Creature,
    defender: Creature,
    combo: ComboEvaluation,
    phase: BattlePhase
  ): { damage: number; shieldGain: number } {
    if (combo.isUltimateSentence && combo.word1 && combo.word2 && combo.word3 && combo.word4) {
      const verbWord = combo.word3;
      const advWord = combo.word4;
      const strikeResult = damageTarget(attacker, defender, verbWord, combo, advWord, phase);
      const shieldGain = combo.shieldGain;
      attacker.shield = (attacker.shield ?? 0) + shieldGain;
      emit(
        'SHIELD',
        attacker,
        attacker,
        `Syntax Surge! ${attacker.name} gained ${shieldGain} grammar shield!`,
        { amount: shieldGain, category: 'DEFEND' },
        phase
      );
      applyStatus(
        attacker,
        attacker,
        {
          id: '',
          name: 'Attribute Surge',
          type: 'buff',
          duration: 3,
          stat: 'attack',
          amount: 4,
          description: 'is surging with +4 Attack from weaving a full sentence!',
        },
        phase,
        'BUFF'
      );
      return { damage: strikeResult.damage, shieldGain };
    }

    const head = combo.word2 || combo.word1;
    if (!head) return { damage: 0, shieldGain: 0 };
    const modifier = combo.word2 ? combo.word1 : null;
    let damage = 0;
    let shieldGain = 0;

    if (combo.category === 'ATTACK') {
      const result = damageTarget(attacker, defender, head, combo, modifier, phase);
      damage = result.damage;
      if (head.partOfSpeech === 'adverb' && modifier) {
        emit('BUFF', attacker, attacker, `${modifier.word} sharpens the next strike's critical chance.`, { effect: 'Critical Tempo', amount: 0.4 }, phase);
      }
    } else if (combo.category === 'DEFEND') {
      if (head.partOfSpeech === 'noun') {
        shieldGain = combo.shieldGain;
        attacker.shield = (attacker.shield ?? 0) + shieldGain;
        emit('SHIELD', attacker, attacker, `${attacker.name} gained ${shieldGain} shield.`, { amount: shieldGain, category: combo.category }, phase);
        if (modifier?.partOfSpeech === 'adjective') {
          applyStatus(
            attacker,
            attacker,
            { id: '', name: 'Protective Quality', type: 'buff', duration: 1, amount: 0.3, description: 'is protected by 30% damage reduction.' },
            phase,
            combo.category
          );
        }
      } else if (head.partOfSpeech === 'adjective') {
        applyStatus(
          attacker,
          attacker,
          { id: '', name: 'Protective Quality', type: 'buff', duration: 1, amount: 0.3, description: 'is protected by 30% damage reduction.' },
          phase,
          combo.category
        );
      } else if (head.partOfSpeech === 'adverb') {
        attacker.evadeChance = 0.5;
        applyStatus(
          attacker,
          attacker,
          { id: '', name: 'Evasive Step', type: 'buff', duration: 1, description: 'has a 50% chance to evade the next hit.' },
          phase,
          combo.category
        );
      } else {
        shieldGain = combo.shieldGain;
        attacker.shield = (attacker.shield ?? 0) + shieldGain;
        attacker.reflectStance = true;
        emit('SHIELD', attacker, attacker, `${attacker.name} gained ${shieldGain} shield and prepared a counter-stance.`, { amount: shieldGain, effect: 'Counter-Stance', category: combo.category }, phase);
      }
    } else if (combo.category === 'BUFF') {
      if (head.partOfSpeech === 'adjective') {
        applyStatus(attacker, attacker, {
          id: '', name: 'Attribute Surge', type: 'buff', duration: 4, stat: 'attack', amount: 4,
          description: 'gained +4 attack for three turns.',
        }, phase, combo.category);
        applyStatus(attacker, attacker, {
          id: '', name: 'Swift Step', type: 'buff', duration: 4, stat: 'speed', amount: 2,
          description: 'gained +2 speed for three turns.',
        }, phase, combo.category);
      } else if (head.partOfSpeech === 'adverb') {
        applyStatus(attacker, attacker, {
          id: '', name: 'Regeneration', type: 'buff', duration: 3, amount: 5,
          description: 'will restore 5 HP at the start of each turn.',
        }, phase, combo.category);
      } else if (head.partOfSpeech === 'verb') {
        attacker.empowered = true;
        emit('BUFF', attacker, attacker, `${attacker.name} empowered the next attack.`, { effect: 'Empowered Action', amount: 50, category: combo.category }, phase);
      } else {
        attacker.infusionElement = head.element;
        applyStatus(attacker, attacker, {
          id: '', name: 'Elemental Infusion', type: 'buff', duration: 4, element: head.element,
          description: `is infused with ${head.element}; matching attacks deal 15% extra damage.`,
        }, phase, combo.category);
      }
    } else if (combo.category === 'DEBUFF') {
      defender.statuses = defender.statuses || [];
      if (head.partOfSpeech === 'adverb') {
        applyStatus(defender, attacker, {
          id: '', name: 'Interference', type: 'debuff', duration: 4, stat: 'speed', amount: -4,
          description: 'lost 4 speed and 25% accuracy for three turns.',
        }, phase, combo.category);
        applyStatus(defender, attacker, {
          id: '', name: 'Inaccuracy', type: 'debuff', duration: 4, stat: 'accuracy', amount: -0.25,
          description: 'lost 25% accuracy for three turns.',
        }, phase, combo.category);
      } else if (head.partOfSpeech === 'adjective') {
        applyStatus(defender, attacker, {
          id: '', name: 'Defense Break', type: 'debuff', duration: 4, stat: 'defense', amount: -3,
          description: 'lost 3 defense for three turns.',
        }, phase, combo.category);
        applyStatus(defender, attacker, {
          id: '', name: 'Thorn', type: 'debuff', duration: 3, amount: 4,
          description: 'will take 4 damage at the start of each turn.',
        }, phase, combo.category);
      } else if (head.partOfSpeech === 'verb') {
        applyStatus(defender, attacker, {
          id: '', name: 'Motion Constraint', type: 'debuff', duration: 1,
          description: 'will skip its next action.',
        }, phase, combo.category);
      } else {
        applyStatus(defender, attacker, {
          id: '', name: 'Combo Block', type: 'debuff', duration: 2,
          description: 'cannot use two-word combos for two turns.',
        }, phase, combo.category);
      }
    }

    return { damage, shieldGain };
  }

  function finishBattle(winner: Creature, phase: BattlePhase): void {
    state.phase = PHASES.BATTLE_END;
    state.winner = winner.id;
    emit(winner.id === state.player.id ? 'VICTORY' : 'DEFEAT', winner, undefined, `${winner.name} wins the battle.`, { winnerId: winner.id }, phase);
  }

  function submitCombo(
    word1Id: string,
    word2Id: string | null = null,
    word3Id: string | null = null,
    word4Id: string | null = null
  ): BattleState {
    state.events = [];
    state.lastEnemyResolution = null;
    const allWords = getAllWordsList(options.words);
    const word1 = allWords.find((word) => word.id === word1Id) || null;
    const word2 = word2Id ? allWords.find((word) => word.id === word2Id) || null : null;
    const word3 = word3Id ? allWords.find((word) => word.id === word3Id) || null : null;
    const word4 = word4Id ? allWords.find((word) => word.id === word4Id) || null : null;
    if (!word1 || (word2Id && !word2)) {
      emit('FIZZLE', state.player, undefined, 'That word card is no longer available. Choose another word.', { reason: 'Unknown word card.' });
      return { ...state };
    }

    tickStatuses(state.player, PHASES.PLAYER_TURN);
    const combo = evaluateCombo(state.player, word1, word2, word3, word4);
    state.lastPlayerResolution = null;
    if (!combo.valid) {
      emit('FIZZLE', state.player, undefined, `Try again: ${combo.reasons[0]}`, {
        phrase: combo.phrase,
        reason: combo.reasons[0],
        category: combo.category,
      });
    } else {
      state.phase = PHASES.RESOLUTION;
      emit('SPEAK', state.player, state.enemy, combo.phrase, { phrase: combo.phrase, category: combo.category });
      const result = executeMove(state.player, state.enemy, combo, PHASES.RESOLUTION);
      state.lastPlayerResolution = {
        attackerId: state.player.id,
        defenderId: state.enemy.id,
        combo,
        damage: result.damage,
        shieldGain: result.shieldGain,
        defenderHp: state.enemy.currentHp ?? 0,
      };
    }

    if ((state.enemy.currentHp ?? 0) <= 0) {
      finishBattle(state.player, PHASES.BATTLE_END);
      return { ...state };
    }
    if ((state.player.currentHp ?? 0) <= 0) {
      finishBattle(state.enemy, PHASES.BATTLE_END);
      return { ...state };
    }

    state.phase = PHASES.ENEMY_TURN;
    const isConstrained = (state.enemy.statuses || []).some((status) => status.name === 'Motion Constraint');
    if (isConstrained) {
      state.enemy.statuses = (state.enemy.statuses || []).filter((status) => status.name !== 'Motion Constraint');
      emit('DEBUFF', state.enemy, state.enemy, `${state.enemy.name} is delayed and skips this action.`, { effect: 'Motion Constraint', duration: 1 }, PHASES.ENEMY_TURN);
    } else {
      const combosBlocked = (state.enemy.statuses || []).some((status) => status.name === 'Combo Block');
      tickStatuses(state.enemy, PHASES.ENEMY_TURN);
      if ((state.enemy.currentHp ?? 0) <= 0) {
        finishBattle(state.player, PHASES.BATTLE_END);
        return { ...state };
      }

      const usableWords = allWords.filter((word) =>
        state.enemy.allowedElements.includes(word.element) && word.partOfSpeech !== 'adverb'
      );
      let aiWords: [Word, Word | null] | null = null;
      if (!combosBlocked && Math.random() < 0.35) {
        const validPairs: [Word, Word][] = [];
        for (const first of allWords.filter((word) =>
          state.enemy.allowedElements.includes(word.element) &&
          (word.partOfSpeech === 'adjective' || word.partOfSpeech === 'adverb')
        )) {
          const headPos = first.partOfSpeech === 'adjective' ? 'noun' : 'verb';
          const head = usableWords.find((word) => word.partOfSpeech === headPos && state.enemy.allowedElements.includes(word.element));
          if (head) validPairs.push([first, head]);
        }
        const pair = validPairs[Math.floor(Math.random() * validPairs.length)];
        if (pair) aiWords = pair;
      }
      if (!aiWords && usableWords.length) {
        aiWords = [usableWords[Math.floor(Math.random() * usableWords.length)], null];
      }

      if (aiWords) {
        const aiCombo = evaluateCombo(state.enemy, aiWords[0], aiWords[1]);
        if (aiCombo.valid) {
          emit('SPEAK', state.enemy, state.player, aiCombo.phrase, { phrase: aiCombo.phrase, category: aiCombo.category }, PHASES.ENEMY_TURN);
          const result = executeMove(state.enemy, state.player, aiCombo, PHASES.ENEMY_TURN);
          state.lastEnemyResolution = {
            attackerId: state.enemy.id,
            defenderId: state.player.id,
            combo: aiCombo,
            damage: result.damage,
            shieldGain: result.shieldGain,
            defenderHp: state.player.currentHp ?? 0,
          };
        }
      }
    }

    if ((state.player.currentHp ?? 0) <= 0) finishBattle(state.enemy, PHASES.BATTLE_END);
    else if ((state.enemy.currentHp ?? 0) <= 0) finishBattle(state.player, PHASES.BATTLE_END);
    else state.phase = PHASES.PLAYER_TURN;
    return { ...state };
  }

  function restart(newPlayerId?: string): BattleState {
    const playerId = newPlayerId || state.player.id;
    state = {
      phase: PHASES.PLAYER_TURN,
      winner: null,
      player: cloneCreature(options.creatures.find((creature) => creature.id === playerId) || options.creatures[0]),
      enemy: cloneCreature(
        options.creatures.find((creature) => creature.id === options.enemyId) ||
        options.creatures.find((creature) => creature.id !== playerId) ||
        options.creatures[1]
      ),
      log: [],
      events: [],
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
