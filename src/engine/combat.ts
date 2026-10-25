/**
 * Event-Driven 4x4 Action Matrix Combat Engine for Word Battler (Layer 3 - Sentence Construction)
 * Supports 4 Move Categories (ATTACK, DEFEND, BUFF, DEBUFF)
 * across 4 Parts of Speech (Verb, Noun, Adjective, Adverb) with 1-word and 2-word combos.
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
  MoveCategory,
  PartOfSpeech,
} from '../types';
import { getAllWordsList } from './forge';

export const MOVE_CATEGORIES: Record<string, MoveCategory> = Object.freeze({
  ATTACK: 'ATTACK',
  DEFEND: 'DEFEND',
  BUFF: 'BUFF',
  DEBUFF: 'DEBUFF',
});

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

export function cloneCreature(template: Creature): Creature {
  const allowedWordTypes: PartOfSpeech[] =
    template.allowedWordTypes && template.allowedWordTypes.includes('verb')
      ? template.allowedWordTypes
      : (['adjective', 'noun', 'verb', 'adverb'] as PartOfSpeech[]);

  return {
    ...template,
    allowedWordTypes,
    stats: { ...template.stats },
    currentHp: template.currentHp ?? template.stats.hp,
    maxHp: template.stats.hp,
    shield: template.shield ?? 0,
    statuses: [],
    empowered: false,
    reflectStance: false,
    evasionStance: false,
  };
}

/**
 * Returns tactical description and effect name for any Category + Part of Speech combination.
 */
export function getMatrixEffectInfo(category: MoveCategory, pos: PartOfSpeech): {
  name: string;
  description: string;
} {
  switch (category) {
    case 'ATTACK':
      switch (pos) {
        case 'verb':
          return { name: 'Direct Strike', description: 'Deals heavy physical/elemental attack damage.' };
        case 'noun':
          return { name: 'Object Impact', description: 'Medium damage + Armor Piercing (bypasses 50% shield).' };
        case 'adjective':
          return { name: 'Descriptive Assault', description: 'Elemental synergy + inflicts status affliction DOT.' };
        case 'adverb':
          return { name: 'Momentum Strike', description: 'Swift attack with a 40% chance of a Critical Hit (1.75x).' };
      }
      break;

    case 'DEFEND':
      switch (pos) {
        case 'noun':
          return { name: 'Fortification', description: 'Manifests a heavy flat defensive shield (+14+DEF).' };
        case 'adjective':
          return { name: 'Barrier Quality', description: 'Raises moderate shield and mitigates 30% incoming damage.' };
        case 'adverb':
          return { name: 'Evasive Stance', description: 'Grants an evasion stance to dodge the next enemy attack.' };
        case 'verb':
          return { name: 'Counter-Stance', description: 'Raises minor shield and reflects 40% melee damage back.' };
      }
      break;

    case 'BUFF':
      switch (pos) {
        case 'adjective':
          return { name: 'Attribute Surge', description: 'Boosts attack attribute (+4 ATK for 3 turns).' };
        case 'adverb':
          return { name: 'Temporal Regeneration', description: 'Applies healing regeneration (+6 HP per turn for 3 turns).' };
        case 'verb':
          return { name: 'Empower Action', description: 'Empowers spirit to deal +50% damage on next attack.' };
        case 'noun':
          return { name: 'Catalyst Summon', description: 'Summons an elemental catalyst (+4 DEF for 3 turns).' };
      }
      break;

    case 'DEBUFF':
      switch (pos) {
        case 'adverb':
          return { name: 'Interference', description: 'Impairs enemy speed (-4) and reduces attack accuracy.' };
        case 'adjective':
          return { name: 'Condition Affliction', description: 'Lowers enemy defense by 3 and inflicts 4 DOT for 3 turns.' };
        case 'verb':
          return { name: 'Motion Constraint', description: 'Traps opponent, delaying or skipping their next action.' };
        case 'noun':
          return { name: 'Obstruction Screen', description: 'Conjures a protective smoke screen blocking enemy combo.' };
      }
      break;
  }

  return { name: 'Standard Action', description: 'Executes a basic combat maneuver.' };
}

export function evaluateCombo(
  attacker: Creature,
  word1: Word | null,
  word2: Word | null,
  category: MoveCategory
): ComboEvaluation {
  if (!word1 && !word2) {
    return {
      valid: false,
      category,
      phrase: '—',
      word1: (word1 || null) as unknown as Word,
      word2: (word2 || null) as unknown as Word,
      power: 0,
      shieldGain: 0,
      effectName: 'Unassigned',
      tacticalOutcome: 'Select 1 or 2 words to form an action.',
      reasons: ['Choose at least one word to execute a maneuver.'],
    };
  }

  const headWord = word2 || word1;
  const modifierWord = word2 ? word1 : null;
  const reasons: string[] = [];

  const allowedElements = new Set(attacker.allowedElements);
  const headAllowed = allowedElements.has(headWord!.element);
  const modAllowed = !modifierWord || allowedElements.has(modifierWord.element);

  if (!headAllowed) {
    reasons.push(
      `"${headWord!.word}" carries ${headWord!.element} energy; ${attacker.name} channels ${attacker.allowedElements.join(' & ')}.`
    );
  }
  if (!modAllowed && modifierWord) {
    reasons.push(
      `"${modifierWord.word}" carries ${modifierWord.element} energy; ${attacker.name} channels ${attacker.allowedElements.join(' & ')}.`
    );
  }

  const valid = headAllowed && modAllowed;
  const effectInfo = getMatrixEffectInfo(category, headWord!.partOfSpeech);

  let power = 0;
  let shieldGain = 0;

  if (valid) {
    let synergy = 0;
    if (headWord!.element === attacker.element) synergy += ELEMENT_SYNERGY_BONUS;
    if (modifierWord && modifierWord.element === headWord!.element) synergy += 2;
    if (headWord!.forge?.powerBonus) synergy += headWord!.forge.powerBonus;
    if (modifierWord?.forge?.powerBonus) synergy += modifierWord.forge.powerBonus;

    if (category === 'ATTACK') {
      power = BASE_POWER + synergy;
      if (headWord!.partOfSpeech === 'verb') power += 8;
      else if (headWord!.partOfSpeech === 'noun') power += 4;
      else if (headWord!.partOfSpeech === 'adjective') power += 5;
      else if (headWord!.partOfSpeech === 'adverb') power += 4;

      if (modifierWord?.partOfSpeech === 'adverb') power += 2;
      if (modifierWord?.partOfSpeech === 'adjective') power += 2;
    } else if (category === 'DEFEND') {
      if (headWord!.partOfSpeech === 'noun') {
        shieldGain = 14 + attacker.stats.defense + synergy;
      } else if (headWord!.partOfSpeech === 'adjective') {
        shieldGain = 8 + synergy;
      } else if (headWord!.partOfSpeech === 'verb') {
        shieldGain = 6 + synergy;
      } else {
        shieldGain = 4 + synergy;
      }
    }

    const phrase = modifierWord ? `${modifierWord.word} ${headWord!.word}` : headWord!.word;
    reasons.push(
      `${attacker.name} performs [${category}: ${effectInfo.name}] using "${phrase}"!`
    );
  }

  const phraseText = modifierWord ? `${modifierWord.word} ${headWord!.word}` : headWord!.word;

  return {
    valid,
    category,
    phrase: phraseText,
    word1: (modifierWord || headWord)!,
    word2: modifierWord ? headWord : null,
    power,
    shieldGain,
    effectName: effectInfo.name,
    tacticalOutcome: effectInfo.description,
    reasons,
  };
}

export function tickCreatureStatuses(creature: Creature): { message: string; heal?: number; damage?: number }[] {
  const events: { message: string; heal?: number; damage?: number }[] = [];
  if (!creature.statuses || creature.statuses.length === 0) return events;

  creature.statuses = creature.statuses.filter((status) => {
    if (status.name === 'Regeneration' && status.amount) {
      creature.currentHp = Math.min(creature.maxHp ?? creature.stats.hp, (creature.currentHp ?? 0) + status.amount);
      events.push({
        message: `${creature.name} restored +${status.amount} HP from Regeneration!`,
        heal: status.amount,
      });
    } else if ((status.name === 'Burn' || status.name === 'Frostbite' || status.name === 'Frost/Burn Affliction') && status.amount) {
      creature.currentHp = Math.max(0, (creature.currentHp ?? 0) - status.amount);
      events.push({
        message: `${creature.name} took ${status.amount} damage from ${status.name}!`,
        damage: status.amount,
      });
    }

    status.duration -= 1;
    return status.duration > 0;
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
    options.creatures.find((c) => c.id === options.playerId) || options.creatures[0];
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
        message: `${player.name} enters the 4x4 Action Arena against ${enemy.name}! Choose Attack, Defend, Buff, or Debuff.`,
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

  function submitCombo(word1Id: string, word2Id: string | null, category: MoveCategory): BattleState {
    const allWords = getAllWordsList(options.words);
    const word1 = allWords.find((w) => w.id === word1Id);
    const word2 = word2Id ? allWords.find((w) => w.id === word2Id) || null : null;

    if (!word1) return state;

    // 1. Tick player statuses
    const playerTicks = tickCreatureStatuses(state.player);
    for (const tick of playerTicks) {
      addLog({
        phase: PHASES.PLAYER_TURN,
        message: tick.message,
        isPlayer: true,
      });
    }

    // 2. Resolve Player Action in 4x4 Matrix
    const playerCombo = evaluateCombo(state.player, word1, word2, category);

    if (playerCombo.valid) {
      const headWord = word2 || word1;
      const modifierWord = word2 ? word1 : null;

      if (category === 'ATTACK') {
        // Check if enemy has active evasion
        if (state.enemy.evasionStance) {
          state.enemy.evasionStance = false;
          addLog({
            phase: PHASES.RESOLUTION,
            message: `${state.enemy.name} swiftly dodged your attack with Evasive Stance!`,
            isPlayer: true,
            valid: true,
          });
        } else {
          let isCrit = false;
          if (headWord.partOfSpeech === 'adverb' || modifierWord?.partOfSpeech === 'adverb') {
            isCrit = Math.random() < 0.45;
          }

          let baseDmg = state.player.stats.attack + playerCombo.power;
          if (state.player.empowered) {
            baseDmg = Math.round(baseDmg * 1.5);
            state.player.empowered = false;
          }
          if (isCrit) {
            baseDmg = Math.round(baseDmg * CRIT_MULTIPLIER);
          }

          const armorPierce = headWord.partOfSpeech === 'noun';
          const defenseMitigation = Math.floor(state.enemy.stats.defense * (armorPierce ? 0.35 : 0.8));
          let finalDamage = Math.max(3, baseDmg - defenseMitigation);
          let absorbed = 0;

          if ((state.enemy.shield ?? 0) > 0) {
            const currentShield = state.enemy.shield ?? 0;
            if (armorPierce) {
              const directDmg = Math.floor(finalDamage * 0.5);
              const shieldTarget = finalDamage - directDmg;
              absorbed = Math.min(currentShield, shieldTarget);
              state.enemy.shield = currentShield - absorbed;
              finalDamage = directDmg + (shieldTarget - absorbed);
            } else {
              if (currentShield >= finalDamage) {
                absorbed = finalDamage;
                state.enemy.shield = currentShield - finalDamage;
                finalDamage = 0;
              } else {
                absorbed = currentShield;
                finalDamage = finalDamage - currentShield;
                state.enemy.shield = 0;
              }
            }
          }

          state.enemy.currentHp = Math.max(0, (state.enemy.currentHp ?? 0) - finalDamage);

          let logMsg = `You: ${playerCombo.effectName} "${playerCombo.phrase}" deals ${finalDamage} damage!`;
          if (isCrit) logMsg = `CRITICAL HIT! ` + logMsg;
          if (absorbed > 0) logMsg += ` (${absorbed} absorbed by rival shield)`;
          addLog({
            phase: PHASES.RESOLUTION,
            message: logMsg,
            isPlayer: true,
            damage: finalDamage,
            valid: true,
          });

          // Check Reflect Stance on Defender
          if (state.enemy.reflectStance && finalDamage > 0) {
            const reflected = Math.max(2, Math.round(finalDamage * 0.4));
            state.player.currentHp = Math.max(0, (state.player.currentHp ?? 0) - reflected);
            addLog({
              phase: PHASES.RESOLUTION,
              message: `${state.enemy.name}'s counter-stance reflected ${reflected} damage back to you!`,
              isPlayer: false,
              damage: reflected,
            });
            state.enemy.reflectStance = false;
          }

          // Apply DOT status if Adjective
          if (headWord.partOfSpeech === 'adjective') {
            const dotName = headWord.element === 'fire' ? 'Burn' : 'Frostbite';
            state.enemy.statuses = state.enemy.statuses || [];
            state.enemy.statuses.push({
              id: `dot-${Date.now()}`,
              name: dotName,
              type: 'debuff',
              duration: 3,
              amount: 4,
              description: `${dotName}: takes damage every turn.`,
            });
            addLog({
              phase: PHASES.RESOLUTION,
              message: `Inflicted ${dotName} on ${state.enemy.name} for 3 turns!`,
              isPlayer: true,
            });
          }
        }
      } else if (category === 'DEFEND') {
        state.player.shield = (state.player.shield ?? 0) + playerCombo.shieldGain;
        if (headWord.partOfSpeech === 'adverb') {
          state.player.evasionStance = true;
          addLog({
            phase: PHASES.RESOLUTION,
            message: `You: Evasive Stance active! Next incoming attack will be evaded.`,
            isPlayer: true,
          });
        } else if (headWord.partOfSpeech === 'verb') {
          state.player.reflectStance = true;
          addLog({
            phase: PHASES.RESOLUTION,
            message: `You: Counter-Stance prepared! Will reflect 40% of melee damage back.`,
            isPlayer: true,
          });
        } else {
          addLog({
            phase: PHASES.RESOLUTION,
            message: `You: Fortified shield by +${playerCombo.shieldGain}! (Total Shield: ${state.player.shield})`,
            isPlayer: true,
            shield: playerCombo.shieldGain,
          });
        }
      } else if (category === 'BUFF') {
        if (headWord.partOfSpeech === 'adverb') {
          state.player.statuses = state.player.statuses || [];
          state.player.statuses.push({
            id: `regen-${Date.now()}`,
            name: 'Regeneration',
            type: 'buff',
            duration: 3,
            amount: 6,
            description: '+6 HP restored every turn.',
          });
          addLog({
            phase: PHASES.RESOLUTION,
            message: `You: Activated Regeneration (+6 HP per turn for 3 turns)!`,
            isPlayer: true,
          });
        } else if (headWord.partOfSpeech === 'verb') {
          state.player.empowered = true;
          addLog({
            phase: PHASES.RESOLUTION,
            message: `You: Empowered spirit! Your next offensive strike will deal +50% damage!`,
            isPlayer: true,
          });
        } else if (headWord.partOfSpeech === 'adjective') {
          state.player.stats.attack += 4;
          state.player.statuses = state.player.statuses || [];
          state.player.statuses.push({
            id: `atk-${Date.now()}`,
            name: 'Mighty Surge',
            type: 'buff',
            duration: 3,
            amount: 4,
            description: '+4 Attack boost.',
          });
          addLog({
            phase: PHASES.RESOLUTION,
            message: `You: Mighty Surge boosted Attack by +4 for 3 turns!`,
            isPlayer: true,
          });
        } else {
          state.player.stats.defense += 4;
          state.player.statuses = state.player.statuses || [];
          state.player.statuses.push({
            id: `def-${Date.now()}`,
            name: 'Catalyst Guard',
            type: 'buff',
            duration: 3,
            amount: 4,
            description: '+4 Defense boost.',
          });
          addLog({
            phase: PHASES.RESOLUTION,
            message: `You: Elemental Catalyst summoned (+4 Defense for 3 turns)!`,
            isPlayer: true,
          });
        }
      } else if (category === 'DEBUFF') {
        state.enemy.statuses = state.enemy.statuses || [];
        if (headWord.partOfSpeech === 'verb') {
          state.enemy.statuses.push({
            id: `stun-${Date.now()}`,
            name: 'Motion Constraint',
            type: 'debuff',
            duration: 1,
            description: 'Cannot attack next turn.',
          });
          addLog({
            phase: PHASES.RESOLUTION,
            message: `You: Motion Constraint! ${state.enemy.name} is trapped and will skip next turn!`,
            isPlayer: true,
          });
        } else if (headWord.partOfSpeech === 'adjective') {
          state.enemy.stats.defense = Math.max(0, state.enemy.stats.defense - 3);
          state.enemy.statuses.push({
            id: `afflict-${Date.now()}`,
            name: 'Frost/Burn Affliction',
            type: 'debuff',
            duration: 3,
            amount: 4,
            description: '-3 DEF & 4 DOT.',
          });
          addLog({
            phase: PHASES.RESOLUTION,
            message: `You: Afflicted ${state.enemy.name} with -3 Defense and 4 damage over time!`,
            isPlayer: true,
          });
        } else if (headWord.partOfSpeech === 'adverb') {
          state.enemy.stats.speed = Math.max(1, state.enemy.stats.speed - 4);
          state.enemy.statuses.push({
            id: `slow-${Date.now()}`,
            name: 'Interference',
            type: 'debuff',
            duration: 3,
            description: '-4 Speed & Reduced Accuracy.',
          });
          addLog({
            phase: PHASES.RESOLUTION,
            message: `You: Interference lowered ${state.enemy.name}'s speed and accuracy!`,
            isPlayer: true,
          });
        } else {
          state.enemy.statuses.push({
            id: `obscure-${Date.now()}`,
            name: 'Obstruction Screen',
            type: 'debuff',
            duration: 2,
            description: 'Vision blocked.',
          });
          addLog({
            phase: PHASES.RESOLUTION,
            message: `You: Conjured Obstruction Screen blocking ${state.enemy.name}'s view!`,
            isPlayer: true,
          });
        }
      }
    } else {
      addLog({
        phase: PHASES.RESOLUTION,
        message: `You: Action fizzles. ${playerCombo.reasons[0] || ''}`,
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
        message: `Victory! ${state.player.name} triumphed over ${state.enemy.name}!`,
        valid: true,
      });
      return { ...state };
    }

    // 3. Enemy AI Turn
    state.phase = PHASES.ENEMY_TURN;
    const enemyTicks = tickCreatureStatuses(state.enemy);
    for (const tick of enemyTicks) {
      addLog({
        phase: PHASES.ENEMY_TURN,
        message: tick.message,
        isPlayer: false,
      });
    }

    if ((state.enemy.currentHp ?? 0) <= 0) {
      state.phase = PHASES.BATTLE_END;
      state.winner = state.player.id;
      addLog({
        phase: PHASES.BATTLE_END,
        message: `Victory! ${state.enemy.name} was defeated!`,
        valid: true,
      });
      return { ...state };
    }

    const isEnemyConstrained = (state.enemy.statuses || []).some((s) => s.name === 'Motion Constraint');
    if (isEnemyConstrained) {
      addLog({
        phase: PHASES.ENEMY_TURN,
        message: `Rival: ${state.enemy.name} is constrained and skips its turn!`,
        isPlayer: false,
      });
    } else {
      // Enemy AI decision:
      const enemyWords = allWords.filter((w) => state.enemy.allowedElements.includes(w.element));
      if (enemyWords.length > 0) {
        const hpRatio = (state.enemy.currentHp ?? 0) / state.enemy.stats.hp;
        let aiCategory: MoveCategory = 'ATTACK';
        if (hpRatio < 0.4 && (state.enemy.shield ?? 0) === 0) {
          aiCategory = 'DEFEND';
        } else if (Math.random() < 0.3) {
          aiCategory = 'BUFF';
        }

        const aiWord = enemyWords[Math.floor(Math.random() * enemyWords.length)];
        const aiCombo = evaluateCombo(state.enemy, aiWord, null, aiCategory);

        if (aiCombo.valid) {
          if (aiCategory === 'ATTACK') {
            if (state.player.evasionStance) {
              state.player.evasionStance = false;
              addLog({
                phase: PHASES.ENEMY_TURN,
                message: `You deftly dodged ${state.enemy.name}'s attack with Evasive Stance!`,
                isPlayer: false,
              });
            } else {
              let aiDmg = Math.max(3, state.enemy.stats.attack + aiCombo.power - Math.floor(state.player.stats.defense * 0.7));
              let aiAbsorbed = 0;
              if ((state.player.shield ?? 0) > 0) {
                const currentShield = state.player.shield ?? 0;
                if (currentShield >= aiDmg) {
                  aiAbsorbed = aiDmg;
                  state.player.shield = currentShield - aiDmg;
                  aiDmg = 0;
                } else {
                  aiAbsorbed = currentShield;
                  aiDmg = aiDmg - currentShield;
                  state.player.shield = 0;
                }
              }
              state.player.currentHp = Math.max(0, (state.player.currentHp ?? 0) - aiDmg);

              let logMsg = `Rival: ${aiCombo.effectName} "${aiCombo.phrase}" deals ${aiDmg} damage!`;
              if (aiAbsorbed > 0) logMsg += ` (${aiAbsorbed} absorbed by your shield)`;
              addLog({
                phase: PHASES.ENEMY_TURN,
                message: logMsg,
                isPlayer: false,
                damage: aiDmg,
              });

              // Check Player Reflect Stance
              if (state.player.reflectStance && aiDmg > 0) {
                const reflected = Math.max(2, Math.round(aiDmg * 0.4));
                state.enemy.currentHp = Math.max(0, (state.enemy.currentHp ?? 0) - reflected);
                addLog({
                  phase: PHASES.ENEMY_TURN,
                  message: `Your Counter-Stance reflected ${reflected} damage back to ${state.enemy.name}!`,
                  isPlayer: true,
                  damage: reflected,
                });
                state.player.reflectStance = false;
              }
            }
          } else if (aiCategory === 'DEFEND') {
            state.enemy.shield = (state.enemy.shield ?? 0) + aiCombo.shieldGain;
            addLog({
              phase: PHASES.ENEMY_TURN,
              message: `Rival: Fortified with "${aiCombo.phrase}" gaining +${aiCombo.shieldGain} shield!`,
              isPlayer: false,
              shield: aiCombo.shieldGain,
            });
          } else {
            state.enemy.empowered = true;
            addLog({
              phase: PHASES.ENEMY_TURN,
              message: `Rival: Empowered with "${aiCombo.phrase}"!`,
              isPlayer: false,
            });
          }
        }
      }
    }

    // Check Defeat
    if ((state.player.currentHp ?? 0) <= 0) {
      state.phase = PHASES.BATTLE_END;
      state.winner = state.enemy.id;
      addLog({
        phase: PHASES.BATTLE_END,
        message: `Defeat! ${state.enemy.name} overpowered ${state.player.name}.`,
        valid: false,
      });
      return { ...state };
    }

    state.phase = PHASES.PLAYER_TURN;
    return { ...state };
  }

  function restart(newPlayerId?: string): BattleState {
    const pId = newPlayerId || state.player.id;
    const playerObj = cloneCreature(
      options.creatures.find((c) => c.id === pId) || options.creatures[0]
    );
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
          message: `A new battle commences! ${playerObj.name} vs ${enemyObj.name}. Select a category and construct your sentence.`,
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
