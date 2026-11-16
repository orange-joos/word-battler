#!/usr/bin/env node
/**
 * Priority #20: Headless Balance Simulator CLI Script
 * Runs 1,000+ automated battles (500 Greedy 3-4 Letter Bot vs. 500 Optimal Scholar/Anagram Bot)
 * and outputs balance telemetry, vowel pity timer verification, and soft-lock diagnostics.
 */

import { runHeadlessBalanceSimulation } from '../src/engine/compendiumAndSim.ts';

const seed = process.argv[2] || 'CI-BALANCE-SIM-2026';
const runsPerBot = Number(process.argv[3] || 500);

const report = runHeadlessBalanceSimulation(runsPerBot, seed);

console.log('================================================================');
console.log('⚔️  WORD BATTLER — HEADLESS BALANCE SIMULATOR (#20)');
console.log('================================================================');
console.log(`Seed:             ${report.seed}`);
console.log(`Total Battles:    ${report.totalSimulations.toLocaleString()} (${runsPerBot} per bot)`);
console.log(`Execution Time:   ${report.elapsedMs} ms`);
console.log('----------------------------------------------------------------');
console.log(
  `🤖 Greedy 3-4 Letter Bot:    Win Rate ${report.greedyBot.winRatePct}% | Avg DMG/Turn ${report.greedyBot.avgDamagePerTurn} | Avg Turns ${report.greedyBot.avgTurnsToWin}`
);
console.log(
  `🧠 Optimal Scholar Bot:      Win Rate ${report.optimalScholarBot.winRatePct}% | Avg DMG/Turn ${report.optimalScholarBot.avgDamagePerTurn} | Avg Turns ${report.optimalScholarBot.avgTurnsToWin}`
);
console.log('----------------------------------------------------------------');
console.log(`Scholar Win-Rate Advantage:  +${report.scholarAdvantageWinRateDelta}%`);
console.log(`Scholar Damage Multiplier:   ${report.scholarDamageRatio}x`);
console.log(`Zero Soft-Locks & Pity OK:   ${report.zeroSoftLocksVerified ? '✅ PASS' : '❌ FAIL'}`);
console.log('================================================================');

if (!report.zeroSoftLocksVerified || report.scholarAdvantageWinRateDelta <= 0) {
  process.exit(1);
}
