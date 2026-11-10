import type { CatalogWords, Creature } from '../types.ts';
import { INITIAL_CREATURES, INITIAL_WORDS } from '../data/initialData.ts';
import { createBattle } from '../engine/combat.ts';
import { getAllWordsList } from '../engine/forge.ts';

export interface MatchupSimulationResult {
  playerId: string;
  enemyId: string;
  runs: number;
  playerWins: number;
  winRatePct: number;
  avgTurns: number;
  avgRemainingHpPct: number;
}

export interface CombatBalanceReport {
  totalBattlesSimulated: number;
  matchups: MatchupSimulationResult[];
  warnings: string[];
}

/**
 * Combat Balance & Monte Carlo Simulator Agent:
 * Runs automated headless battles using player loadout combinations against realm bosses.
 */
export function runCombatSimulation(options?: {
  creatures?: Creature[];
  words?: CatalogWords;
  runsPerMatchup?: number;
  playerIds?: string[];
  enemyIds?: string[];
}): CombatBalanceReport {
  const creatures = options?.creatures || INITIAL_CREATURES;
  const words = options?.words || INITIAL_WORDS;
  const runsPerMatchup = options?.runsPerMatchup ?? 15;
  const allWords = getAllWordsList(words);

  const playerIds =
    options?.playerIds ||
    creatures.filter((c) => !c.id.startsWith('boss_')).slice(0, 4).map((c) => c.id);
  const enemyIds =
    options?.enemyIds ||
    creatures.filter((c) => c.id.startsWith('boss_')).slice(0, 4).map((c) => c.id);

  const matchups: MatchupSimulationResult[] = [];
  const warnings: string[] = [];
  let totalBattlesSimulated = 0;

  for (const playerId of playerIds) {
    const playerTemplate = creatures.find((c) => c.id === playerId) || creatures[0];
    const loadout = playerTemplate.loadout || {
      adjective: 'blazing',
      noun: 'flame',
      verb: 'ignite',
      adverb: 'fiercely',
    };

    const fallbackVerb = allWords.find((w) => w.partOfSpeech === 'verb')?.id || 'ignite';
    const fallbackAdj = allWords.find((w) => w.partOfSpeech === 'adjective')?.id || 'blazing';
    const fallbackNoun = allWords.find((w) => w.partOfSpeech === 'noun')?.id || 'flame';
    const fallbackAdv = allWords.find((w) => w.partOfSpeech === 'adverb')?.id || 'fiercely';

    const eqAdj = loadout.adjective || fallbackAdj;
    const eqNoun = loadout.noun || fallbackNoun;
    const eqVerb = loadout.verb || fallbackVerb;
    const eqAdv = loadout.adverb || fallbackAdv;

    for (const enemyId of enemyIds) {
      let playerWins = 0;
      let totalTurns = 0;
      let totalRemainingHpPct = 0;

      for (let r = 0; r < runsPerMatchup; r++) {
        const battle = createBattle({ playerId, enemyId, creatures, words });
        let turns = 0;
        let state = battle.getState();

        while (state.phase !== 'BATTLE_END' && turns < 25) {
          turns += 1;
          const hpRatio =
            (state.player.currentHp ?? state.player.stats.hp) /
            Math.max(1, state.player.maxHp ?? state.player.stats.hp);

          // Simulate tactical student play:
          // - Turn 1 or every 3rd turn: 4-card Ultimate Sentence Weave
          // - Low HP (<40%) and no shield: Adjective + Noun Defense
          // - Otherwise: Adverb + Verb Strike
          if (turns % 3 === 1) {
            state = battle.submitCombo(eqAdj, eqNoun, eqVerb, eqAdv);
          } else if (hpRatio < 0.4 && (state.player.shield ?? 0) === 0) {
            state = battle.submitCombo(eqAdj, eqNoun);
          } else {
            state = battle.submitCombo(eqAdv, eqVerb);
          }
        }

        totalBattlesSimulated += 1;
        totalTurns += turns;
        if (state.winner === playerId) {
          playerWins += 1;
          const remRatio =
            (state.player.currentHp ?? 0) /
            Math.max(1, state.player.maxHp ?? state.player.stats.hp);
          totalRemainingHpPct += remRatio * 100;
        }
      }

      const winRatePct = Math.round((playerWins / runsPerMatchup) * 100);
      const avgTurns = Number((totalTurns / runsPerMatchup).toFixed(1));
      const avgRemainingHpPct =
        playerWins > 0 ? Math.round(totalRemainingHpPct / playerWins) : 0;

      if (avgTurns >= 22) {
        warnings.push(`Matchup ${playerId} vs ${enemyId} averaged ${avgTurns} turns (stall risk).`);
      }

      matchups.push({
        playerId,
        enemyId,
        runs: runsPerMatchup,
        playerWins,
        winRatePct,
        avgTurns,
        avgRemainingHpPct,
      });
    }
  }

  return {
    totalBattlesSimulated,
    matchups,
    warnings,
  };
}
