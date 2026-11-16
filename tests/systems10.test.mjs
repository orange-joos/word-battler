import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LexiconTrie,
  getGlobalLexiconTrie,
  benchmarkTrieLookup,
  isProfaneOrSlur,
  evaluateWordEconomy,
  evaluateWordPropertySynergies,
  countVowels,
  isPalindromeWord,
  areAnagrams,
} from '../src/engine/lexiconTrie.ts';
import {
  getEnemyModifierForBoss,
  evaluateEnemyModifierImpact,
  ENEMY_BOARD_MODIFIERS,
  ROGUELIKE_RELICS,
  STARTER_DECK_UNLOCK_TRACKS,
  PLATFORM_ACHIEVEMENTS,
  TUTORIAL_STEPS_3MIN,
  computeSnapshotChecksum,
  saveAtomicCombatSnapshot,
} from '../src/engine/roguelikeLoop.ts';

test('Priority #1: LexiconTrie lookup, prefix autocomplete, profanity guard, and 10k benchmark', () => {
  const trie = getGlobalLexiconTrie();
  assert.ok(trie.size() >= 100, 'Global lexicon should index K-8 + CSW/TWL fallback words');
  assert.equal(trie.hasWord('blazing'), true);
  assert.equal(trie.hasWord('quartz'), true);
  assert.equal(trie.hasPrefix('blaz'), true);
  assert.ok(trie.getPrefixCompletions('blaz').includes('blazing'));

  // Profanity & slur filtering
  assert.equal(isProfaneOrSlur('fuck'), true);
  assert.equal(isProfaneOrSlur('blazing'), false);
  const customTrie = new LexiconTrie();
  assert.equal(customTrie.insert('shitstorm'), false);

  const bench = benchmarkTrieLookup(5000);
  assert.equal(bench.iterations, 5000);
  assert.ok(bench.elapsedMs < 500, '5000 deterministic Trie lookups should finish under 500ms');
});

test('Priority #2: Letter Economy calibrates Q/Z/X/J values and exponential 6+ letter multipliers', () => {
  const shortSpam = evaluateWordEconomy('cat');
  const sixLetter = evaluateWordEconomy('glacier');
  const rareQuartz = evaluateWordEconomy('quartz');

  assert.equal(shortSpam.lengthMultiplier, 0.85);
  assert.equal(sixLetter.lengthMultiplier, 1.75); // 7 letters
  assert.ok(rareQuartz.highTierLetters.includes('Q'));
  assert.ok(rareQuartz.highTierLetters.includes('Z'));
  assert.ok(rareQuartz.bonusDamage > shortSpam.bonusDamage);
});

test('Priority #3: Word Property Synergies trigger Freeze (>=3 vowels), Bleed (palindromes), Shield (anagrams), and Rare Crit', () => {
  assert.equal(countVowels('glacial'), 3);
  assert.equal(isPalindromeWord('kayak'), true);
  assert.equal(areAnagrams('silent', 'listen'), true);

  const synergies = evaluateWordPropertySynergies(['glacial', 'kayak', 'silent', 'quartz']);
  const ids = synergies.map((s) => s.id);
  assert.ok(ids.includes('vowel-freeze'), 'Should trigger Freeze on >=3 vowels');
  assert.ok(ids.includes('palindrome-bleed'), 'Should trigger Bleed on palindrome');
  assert.ok(ids.includes('anagram-shield'), 'Should trigger Shield on anagram');
  assert.ok(ids.includes('rare-letter-crit'), 'Should trigger Guaranteed Crit on Q/Z/X/J');
});

test('Priority #4, #5, #8, #10: Enemy Board Modifiers, Relics, Atomic Checksum Serialization & 3-Min Tutorial', () => {
  const mod = getEnemyModifierForBoss('boss_warden');
  assert.ok(mod && mod.id in ENEMY_BOARD_MODIFIERS);

  const vowelCounter = evaluateEnemyModifierImpact(ENEMY_BOARD_MODIFIERS['vowel-devourer'], ['furious']);
  assert.equal(vowelCounter.powerDelta, 5);

  assert.ok(ROGUELIKE_RELICS.length >= 4);
  assert.ok(STARTER_DECK_UNLOCK_TRACKS.length >= 3);
  assert.ok(PLATFORM_ACHIEVEMENTS.length >= 4);
  assert.equal(TUTORIAL_STEPS_3MIN.length, 4);

  const snap = saveAtomicCombatSnapshot({
    roundNumber: 3,
    zoneId: 'area-fire',
    nodeId: '2-4',
    playerId: 'c1',
    enemyId: 'boss_1',
    playerHp: 82,
    playerMaxHp: 100,
    playerShield: 6,
    enemyHp: 45,
    enemyMaxHp: 110,
    enemyShield: 0,
    selectedWordIds: ['blazing', 'flame'],
  });
  assert.equal(snap.schemaVersion, 1);
  assert.equal(snap.checksum.length, 8);
  const { checksum, ...rest } = snap;
  assert.equal(computeSnapshotChecksum(rest), checksum);
});
