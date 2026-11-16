import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SeededRng,
  getDailyChallengeConfig,
} from '../src/engine/seededRng.ts';
import {
  floatingNumberPool,
  particleBurstPool,
  getSdfTypographyProfile,
} from '../src/engine/objectPool.ts';
import {
  createDefaultSmartTileBag,
  drawSmartTileHand,
  isVowelOrWildcardTile,
  purgeTileFromBag,
  duplicateHighTierTileInBag,
  applyPermanentStampToTile,
  getBagViewerSummary,
  getMultiPhaseBossConstraint,
  evaluateBossPhaseConstraint,
  computeLiveCombatPreview,
} from '../src/engine/smartTileBag.ts';
import {
  loadLexiconCompendium,
  recordCastInCompendium,
  generateShareableRunSummaryCard,
  runHeadlessBalanceSimulation,
} from '../src/engine/compendiumAndSim.ts';

test('#11 Smart Tile Bag & Vowel Pity Timer guarantees >= 2 vowels or wildcard across 100 draws', () => {
  let bag = createDefaultSmartTileBag('PITY-TIMER-SEED-2026');
  for (let round = 1; round <= 100; round++) {
    bag = drawSmartTileHand(bag, 8, round, round % 2 === 0 ? 'time-bomb' : 'poisoned');
    assert.equal(bag.currentHand.length, 8);
    const vowelOrWildcardCount = bag.currentHand.filter(isVowelOrWildcardTile).length;
    assert.ok(
      vowelOrWildcardCount >= 2,
      `Expected >= 2 vowels/wildcards in hand on draw ${round}, got ${vowelOrWildcardCount}`
    );
  }
});

test('#12 Live Combat Preview & Damage Breakdown computes exact points, multipliers, relics, and HP drop %', () => {
  const bag = drawSmartTileHand(createDefaultSmartTileBag('PREVIEW-SEED'), 8, 2, 'time-bomb');
  const bossConstraint = getMultiPhaseBossConstraint('boss_pyro', 40, 100, 3);
  const preview = computeLiveCombatPreview({
    words: ['Luminous', 'Phoenix', 'Ignite', 'Fiercely'],
    validGrammar: true,
    baseComboPower: 28,
    playerAttack: 18,
    enemyDefense: 10,
    enemyHp: 40,
    enemyMaxHp: 100,
    enemyShield: 0,
    handTiles: bag.currentHand,
    bossConstraint,
  });

  assert.equal(preview.isValid, true);
  assert.ok(preview.baseTilePoints > 20);
  assert.ok(preview.maxLengthMultiplier > 1.5);
  assert.ok(preview.projectedDamage > 15);
  assert.ok(preview.projectedEnemyHpDropPct > 0);
  assert.ok(preview.projectedEnemyHpAfterPct < 40);
});

test('#13 Special, Dual-Letter Compound (QU, TH, ING) & Afflicted Hazard Tiles exist and trigger bonuses', () => {
  const bag = createDefaultSmartTileBag('COMPOUND-SEED');
  const allTiles = [...bag.remainingPool, ...bag.currentHand, ...bag.discardPile];
  assert.ok(allTiles.some((t) => t.letters === 'QU' && t.category === 'compound'));
  assert.ok(allTiles.some((t) => t.letters === 'TH' && t.category === 'compound'));
  assert.ok(allTiles.some((t) => t.letters === 'ING' && t.category === 'compound'));
  assert.ok(allTiles.some((t) => t.letters === '★' && t.category === 'wildcard'));

  const drawn = drawSmartTileHand(bag, 8, 2, 'time-bomb');
  assert.ok(drawn.currentHand.some((t) => t.hazard === 'time-bomb' && t.hazardTurnsLeft === 2));
});

test('#14 Multi-Phase Bosses shift spelling constraints between Phase 1 and Phase 2', () => {
  const phase1 = getMultiPhaseBossConstraint('boss_pyro', 95, 100, 1);
  assert.equal(phase1.phase, 1);
  assert.equal(phase1.ruleType, 'standard-phase1');

  const phase2 = getMultiPhaseBossConstraint('boss_pyro', 50, 100, 3);
  assert.equal(phase2.phase, 2);
  assert.notEqual(phase2.ruleType, 'standard-phase1');

  const evalRes = evaluateBossPhaseConstraint(phase2, ['Blazing', 'Flame', 'Scorch', 'Quickly']);
  assert.equal(typeof evalRes.powerDelta, 'number');
  assert.ok(evalRes.statusNote.length > 0);
});

test('#15 In-Run Letter Bag Customization supports Purge, Duplicate High-Tier, Permanent Stamp & Viewer Summary', () => {
  let bag = createDefaultSmartTileBag('CUSTOM-BAG-SEED');
  const initialSummary = getBagViewerSummary(bag);
  const firstTileId = bag.remainingPool[0].id;

  bag = purgeTileFromBag(bag, firstTileId);
  const afterPurge = getBagViewerSummary(bag);
  assert.equal(afterPurge.remainingCount, initialSummary.remainingCount - 1);

  bag = duplicateHighTierTileInBag(bag, 'QU');
  const afterDup = getBagViewerSummary(bag);
  assert.equal(afterDup.remainingCount, afterPurge.remainingCount + 1);

  const unstampedTile = bag.remainingPool.find((t) => t.stamp === 'none');
  assert.ok(unstampedTile);
  bag = applyPermanentStampToTile(bag, unstampedTile.id, 'gilded');
  const afterStamp = getBagViewerSummary(bag);
  assert.ok(afterStamp.stampedTiles.length > initialSummary.stampedTiles.length);
});

test('#16 Deterministic Seeding & Daily Challenge Mode produces identical sequences and 2 rotating modifiers', () => {
  const rngA = new SeededRng('AETHERIA-SEED-777');
  const rngB = new SeededRng('AETHERIA-SEED-777');
  const seqA = Array.from({ length: 10 }, () => rngA.nextInt(0, 1000));
  const seqB = Array.from({ length: 10 }, () => rngB.nextInt(0, 1000));
  assert.deepEqual(seqA, seqB);
  assert.equal(SeededRng.hashSeedString('AETHERIA-SEED-777'), SeededRng.hashSeedString('AETHERIA-SEED-777'));

  const daily = getDailyChallengeConfig('2026-11-15');
  assert.equal(daily.dateKey, '2026-11-15');
  assert.equal(daily.modifiers.length, 2);
  assert.notEqual(daily.modifiers[0].id, daily.modifiers[1].id);
});

test('#17 Lexicon Compendium tracks lifetime milestones and generates Shareable Run Summary Card', () => {
  let state = loadLexiconCompendium();
  state = recordCastInCompendium(
    state,
    ['Bioluminescent', 'Leviathan', 'Surge', 'Swiftly'],
    'Bioluminescent Leviathan Surge Swiftly!',
    112
  );
  assert.equal(state.longestWordPlayed, 'bioluminescent');
  assert.equal(state.longestWordPlayed.length, 14);
  assert.ok(state.highestSingleComboDamage >= 112);

  const card = generateShareableRunSummaryCard({
    explorerName: 'Aris',
    companionName: 'Pyrolynx',
    seedString: 'AETHERIA-DAILY-2026-11-15',
    realmsCleared: 6,
    compendium: state,
  });
  assert.ok(card.shareText.includes('WORD BATTLER'));
  assert.ok(card.shareText.includes('BIOLUMINESCENT'));
  assert.ok(card.shareText.includes('112 DMG'));
});

test('#19 ObjectPool reuses instances without GC churn and SDF Typography scales from Steam Deck 1280x800 to 4K', () => {
  const item1 = floatingNumberPool.acquire();
  item1.text = '-42 HP';
  floatingNumberPool.release(item1);
  const stats = floatingNumberPool.stats();
  assert.ok(stats.freeCount >= 1);
  assert.ok(stats.totalReused >= 1);

  const p1 = particleBurstPool.acquire();
  particleBurstPool.release(p1);
  assert.ok(particleBurstPool.stats().freeCount >= 1);

  const deckProfile = getSdfTypographyProfile(1280, 800);
  const uhdProfile = getSdfTypographyProfile(3840, 2160);
  assert.equal(deckProfile.presetName, 'Steam Deck Handheld (1280x800)');
  assert.equal(uhdProfile.presetName, '4K Ultra HD');
  assert.ok(uhdProfile.sdfStrokePx > deckProfile.sdfStrokePx);
});

test('#20 Headless Balance Simulator runs 1,000 automated battles with zero soft-locks and rewards Optimal Scholar Bot over Greedy 3-4L Bot', () => {
  const report = runHeadlessBalanceSimulation(500, 'CI-SIM-2026');
  assert.equal(report.totalSimulations, 1000);
  assert.equal(report.zeroSoftLocksVerified, true);
  assert.ok(
    report.optimalScholarBot.winRatePct > report.greedyBot.winRatePct,
    `Expected Optimal Bot win rate (${report.optimalScholarBot.winRatePct}%) > Greedy Bot (${report.greedyBot.winRatePct}%)`
  );
  assert.ok(
    report.optimalScholarBot.avgDamagePerTurn > report.greedyBot.avgDamagePerTurn,
    `Expected Optimal Bot avg damage (${report.optimalScholarBot.avgDamagePerTurn}) > Greedy Bot (${report.greedyBot.avgDamagePerTurn})`
  );
});
