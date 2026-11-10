import { runLinguistQaAudit } from '../src/agents/linguistQaAgent.ts';
import { runCombatSimulation } from '../src/agents/combatSimAgent.ts';

console.log('==========================================================');
console.log('  WORD BATTLER — AUTOMATION AGENTS AUDIT & BALANCE SUITE');
console.log('==========================================================\n');

const linguistReport = runLinguistQaAudit();
console.log(`[1] LINGUIST QA AGENT (${linguistReport.passed ? 'PASSED' : 'ISSUES FOUND'})`);
console.log(`    Total Words Audited   : ${linguistReport.totalWords}`);
console.log(`    Valid Affix Fusions   : ${linguistReport.validAffixFusions}`);
console.log(`    Valid Blueprints      : ${linguistReport.validBlueprintCount}/${linguistReport.totalBlueprints}`);
console.log(`    By Grade Tier         : ${JSON.stringify(linguistReport.wordsByGradeTier)}`);
console.log(`    By Element            : ${JSON.stringify(linguistReport.wordsByElement)}`);
if (linguistReport.issues.length > 0) {
  console.log(`    Issues (${linguistReport.issues.length}):`);
  for (const issue of linguistReport.issues.slice(0, 10)) {
    console.log(`      - ${issue}`);
  }
} else {
  console.log('    Issues                : 0');
}

console.log('\n----------------------------------------------------------\n');

const simReport = runCombatSimulation({ runsPerMatchup: 15 });
console.log('[2] COMBAT MONTE-CARLO SIMULATOR AGENT (15 trials / matchup)');
console.log(`    Total Battles Simulated : ${simReport.totalBattlesSimulated}`);
console.log(`    Matchups Evaluated      : ${simReport.matchups.length}`);
console.log(`    Balance Warnings        : ${simReport.warnings.length}`);

for (const m of simReport.matchups.slice(0, 8)) {
  console.log(
    `    • ${m.playerId.padEnd(11)} vs ${m.enemyId.padEnd(16)}: WinRate ${String(m.winRatePct).padStart(3)}% | AvgTurns ${m.avgTurns.toFixed(1)} | AvgRemHP ${m.avgRemainingHpPct}%`
  );
}

console.log('\n==========================================================');
if (!linguistReport.passed) {
  process.exitCode = 1;
}
