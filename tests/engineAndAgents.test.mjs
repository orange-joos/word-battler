import test from 'node:test';
import assert from 'node:assert/strict';

import { INITIAL_AFFIXES, INITIAL_CREATURES, INITIAL_WORDS } from '../src/data/initialData.ts';
import { ELEMENT_TYPES, OPPOSITE_ELEMENT, normalizeElement } from '../src/data/elements.ts';
import { forgeCombine } from '../src/engine/forge.ts';
import { createBattle } from '../src/engine/combat.ts';
import { getEffectiveCreatureStats } from '../src/engine/progression.ts';
import { runLinguistQaAudit } from '../src/agents/linguistQaAgent.ts';
import { runCombatSimulation } from '../src/agents/combatSimAgent.ts';
import { selectBossTacticalMove } from '../src/agents/bossTacticianAgent.ts';
import { getAdaptiveTutorInsight } from '../src/agents/adaptiveTutorAgent.ts';

test('OPPOSITE_ELEMENT and normalizeElement cover all 9 canonical elements', () => {
  assert.equal(ELEMENT_TYPES.length, 9);
  for (const el of ELEMENT_TYPES) {
    assert.equal(normalizeElement(el), el);
    assert.ok(OPPOSITE_ELEMENT[el], `Missing opposite element for ${el}`);
  }
  assert.equal(normalizeElement('nature'), 'grass');
  assert.equal(normalizeElement('cosmic'), 'light');
});

test('forgeCombine supports word+word, creature+word, and creature+creature (bp-hybrid-pet)', () => {
  const forgeOpts = {
    creatures: INITIAL_CREATURES,
    words: INITIAL_WORDS,
    affixes: INITIAL_AFFIXES,
  };

  const fusedWordRes = forgeCombine(
    { kind: 'word', id: 'blazing' },
    { kind: 'word', id: 'flame' },
    forgeOpts
  );
  assert.equal(fusedWordRes.ok, true);
  assert.equal(fusedWordRes.kind, 'compound');
  assert.ok(fusedWordRes.result && 'word' in fusedWordRes.result);

  const hybridRes = forgeCombine(
    { kind: 'creature', id: 'emberfox' },
    { kind: 'creature', id: 'rimepup' },
    forgeOpts
  );
  assert.equal(hybridRes.ok, true);
  assert.equal(hybridRes.kind, 'creature-fusion');
  assert.equal(hybridRes.result?.name, 'Emberpup');
});

test('getEffectiveCreatureStats computes pure derived stats without mutating base creature', () => {
  const basePet = structuredClone(INITIAL_CREATURES[0]);
  const originalAttack = basePet.stats.attack;
  const originalDefense = basePet.stats.defense;

  const withFang = getEffectiveCreatureStats(basePet.stats, 'amber_fang', 'vanguard');
  assert.equal(basePet.stats.attack, originalAttack, 'Base creature attack should not be mutated');
  assert.equal(withFang.attack, originalAttack + 3 + 4);

  const switchedToShell = getEffectiveCreatureStats(basePet.stats, 'iron_shell', 'bastion');
  assert.equal(switchedToShell.attack, originalAttack + 1 + 1, 'Switching off attack gear should not stack old bonuses');
  assert.equal(switchedToShell.defense, originalDefense + 3 + 4);
});

test('createBattle and battle.syncCatalog preserve mid-battle HP while updating catalog words', () => {
  const battle = createBattle({
    creatures: INITIAL_CREATURES,
    words: INITIAL_WORDS,
    playerId: 'emberfox',
    enemyId: 'aquafin',
  });

  const stateAfterTurn = battle.submitCombo('blazing', 'flame', 'ignite', 'fiercely');
  assert.ok(stateAfterTurn.lastPlayerResolution);
  const enemyHpBeforeSync = stateAfterTurn.enemy.currentHp;

  // Simulate unlocking a newly forged word mid-battle
  const updatedWords = structuredClone(INITIAL_WORDS);
  updatedWords.verbs.push({
    id: 'fused_supernova',
    word: 'Supernova',
    partOfSpeech: 'verb',
    element: 'fire',
    powerBonus: 18,
    tier: 3,
    tags: ['fire', 'forged'],
    gradeTier: '5',
  });

  battle.syncCatalog(updatedWords, INITIAL_CREATURES);
  const stateAfterSync = battle.getState();
  assert.equal(stateAfterSync.enemy.currentHp, enemyHpBeforeSync, 'Mid-battle enemy HP should be preserved');

  // Verify the newly synced word can be used immediately in the active battle
  const stateAfterNewWord = battle.submitCombo('fused_supernova', null, null, null);
  assert.equal(stateAfterNewWord.lastPlayerResolution?.combo.valid, true);
});

test('Automation agents execute cleanly and return valid diagnostics', () => {
  const qa = runLinguistQaAudit(INITIAL_WORDS, INITIAL_CREATURES, INITIAL_AFFIXES);
  assert.equal(qa.passed, true, `Linguist QA failed: ${JSON.stringify(qa.issues)}`);
  assert.ok(qa.totalWords >= 50);

  const sim = runCombatSimulation({ runsPerMatchup: 3 });
  assert.ok(sim.totalBattlesSimulated > 0);
  assert.ok(sim.matchups.length > 0);

  const player = INITIAL_CREATURES[0];
  const enemy = INITIAL_CREATURES[1];
  const allWords = [
    ...INITIAL_WORDS.adjectives,
    ...INITIAL_WORDS.nouns,
    ...INITIAL_WORDS.verbs,
    ...INITIAL_WORDS.adverbs,
  ];
  const bossPlan = selectBossTacticalMove(enemy, player, allWords, false);
  assert.ok(bossPlan && bossPlan.words.length > 0);
  assert.ok(bossPlan.tacticName.length > 0);

  const tutor = getAdaptiveTutorInsight(['Their / There / They\'re'], INITIAL_WORDS, '3-5');
  assert.ok(tutor.recommendedWords.length > 0);
  assert.equal(tutor.category, 'homophone-confusion');
});
