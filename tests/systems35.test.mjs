import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TILE_MATERIALS,
  getTactileTileMaterial,
  getDualTierTypographyClasses,
  SEMANTIC_COLOR_GRAMMAR,
  getSemanticColorToken,
  computeReactiveLightingState,
  computeBoardLinkedTelegraphs,
  SPRING_PHYSICS_PRESETS,
  computeTileBankTilt,
  buildScoringCascadeSteps,
  generateInlineLootDrops,
  detectAffixLigatures,
  computeAnticipatoryRelicStates,
  selectBestMatchingTileFromRack,
  computeNextTurnDrawOdds,
  KEYWORD_GLOSSARY,
  extractChainedKeywords,
} from '../src/engine/tactileContainedUi.ts';
import { createDefaultSmartTileBag, drawSmartTileHand } from '../src/engine/smartTileBag.ts';
import { ENEMY_BOARD_MODIFIERS } from '../src/engine/roguelikeLoop.ts';

test('#21 Tactile Tile Materiality switches materials for hazards, stamps, high-tier letters, and long words', () => {
  const obsidian = getTactileTileMaterial({ hazard: 'time-bomb' });
  assert.equal(obsidian.id, 'cracked-obsidian');
  assert.equal(obsidian.cssClass, 'tile-mat-obsidian');

  const frost = getTactileTileMaterial({ isLockedByEnemy: true });
  assert.equal(frost.id, 'frost-rimmed-stone');
  assert.equal(frost.cssClass, 'tile-mat-frost');

  const gilded = getTactileTileMaterial({ stamp: 'gilded' });
  assert.equal(gilded.id, 'gilded-wood');

  const amberWord = getTactileTileMaterial({ word: 'Phoenix' }); // contains X
  assert.equal(amberWord.id, 'glowing-amber');

  const boneWord = getTactileTileMaterial({ word: 'Flame' }); // 5 letters
  assert.equal(boneWord.id, 'carved-bone');

  const ivoryWord = getTactileTileMaterial({ word: 'Sun' }); // 3 letters
  assert.equal(ivoryWord.id, 'weighted-ivory');
  assert.ok(Object.keys(TILE_MATERIALS).length >= 7);
});

test('#22 Dual-Tier Typography System returns tabular slab/sans for tile faces and display serif for boss banners', () => {
  const tileTypography = getDualTierTypographyClasses('tile-face');
  const bossTypography = getDualTierTypographyClasses('boss-banner');
  assert.ok(tileTypography.includes('font-tile-face'));
  assert.ok(tileTypography.includes('tabular-nums'));
  assert.ok(bossTypography.includes('font-boss-serif'));
});

test('#23 Strict Semantic Color Coding locks all 5 semantic categories with high-contrast tokens', () => {
  const categories = ['multiplier', 'block', 'vowel-heal', 'hex-poison', 'raw-attack'];
  for (const cat of categories) {
    const token = getSemanticColorToken(cat);
    assert.ok(token.hex.startsWith('#'));
    assert.ok(token.badgeBg.length > 0);
    assert.ok(token.borderClass.length > 0);
  }
  assert.equal(SEMANTIC_COLOR_GRAMMAR.multiplier.hex, '#f59e0b');
  assert.equal(SEMANTIC_COLOR_GRAMMAR.block.hex, '#06b6d4');
  assert.equal(SEMANTIC_COLOR_GRAMMAR['vowel-heal'].hex, '#10b981');
  assert.equal(SEMANTIC_COLOR_GRAMMAR['hex-poison'].hex, '#8b5cf6');
  assert.equal(SEMANTIC_COLOR_GRAMMAR['raw-attack'].hex, '#e11d48');
});

test('#24 Reactive Combat Lighting & Vignettes activates spotlight on 6+ letter words and crimson vignette below 25% HP', () => {
  const calmState = computeReactiveLightingState({
    placedWords: ['Sun', 'Run'],
    playerHp: 80,
    playerMaxHp: 100,
  });
  assert.equal(calmState.spotlightActive, false);
  assert.equal(calmState.lowHpVignetteActive, false);

  const dramaticState = computeReactiveLightingState({
    placedWords: ['Luminous', 'Phoenix'],
    playerHp: 20,
    playerMaxHp: 100,
  });
  assert.equal(dramaticState.spotlightActive, true);
  assert.ok(dramaticState.ambientDimOpacity > 0);
  assert.equal(dramaticState.lowHpVignetteActive, true);
  assert.equal(dramaticState.playerHpPct, 20);
});

test('#25 Board-Linked Enemy Telegraphs projects Phase 2 Vowel Seals and Boss Modifiers directly onto rack slots', () => {
  const vowelDevourer = ENEMY_BOARD_MODIFIERS['vowel-devourer'];
  const telegraphs = computeBoardLinkedTelegraphs({
    rackWords: ['Blaze', 'Luminous', 'Scorch', 'Ignite'],
    enemyModifier: vowelDevourer,
    bannedVowel: 'O',
  });
  assert.equal(telegraphs.length, 4);
  // "Luminous" and "Scorch" contain 'O' -> Phase 2 Seal
  assert.equal(telegraphs[1].threatActive, true);
  assert.ok(telegraphs[1].shortLabel.includes('Seal "O"'));
  // "Blaze" has 2 vowels -> Vowel Drain threat under Vowel Devourer
  assert.equal(telegraphs[0].threatActive, true);
  assert.equal(telegraphs[0].shortLabel, 'Vowel Drain');
  // "Ignite" has 3 vowels and no 'O' -> Counters Boss!
  assert.equal(telegraphs[3].threatActive, false);
  assert.equal(telegraphs[3].shortLabel, 'Counters Boss');
});

test('#26 Spring-Physics Tile Movement & 2.5D Cursor Tilt computes perspective banking transforms', () => {
  assert.ok(SPRING_PHYSICS_PRESETS.criticallyDampedCss.includes('cubic-bezier'));
  const tilt = computeTileBankTilt(0.5, -0.5);
  assert.equal(tilt.rotateYDeg, 5.5);
  assert.equal(tilt.rotateXDeg, 4);
  assert.ok(tilt.cssTransform.includes('perspective(600px)'));
});

test('#27 Paced Left-to-Right Scoring Cascade builds accelerating step choreography with relic triggers', () => {
  const steps = buildScoringCascadeSteps(['Luminous', 'Phoenix', 'Ignite', 'Fiercely']);
  assert.equal(steps.length, 4);
  assert.equal(steps[0].delayMs, 0);
  assert.equal(steps[1].delayMs, 85); // 4-word chain accelerates to 85ms/step
  assert.ok(steps[1].triggeredRelicId !== null); // "Phoenix" triggers consonant fang
  assert.ok(steps[3].pitchSemitoneIndex > steps[0].pitchSemitoneIndex);
});

test('#29 Inline Post-Combat Loot Drops generates interactive tabletop loot tokens on victory', () => {
  const drops = generateInlineLootDrops('1-1', 'Ignis-Pup');
  assert.equal(drops.length, 3);
  assert.equal(drops[0].type, 'gold-pouch');
  assert.equal(drops[1].type, 'tile-stamp');
  assert.equal(drops[2].type, 'relic-boon');
  assert.ok(drops[2].title.includes('Ignis-Pup'));
});

test('#30 Instant Validity & Affix Ligatures detects morphological prefixes and suffixes with brackets', () => {
  const suffixMatch = detectAffixLigatures('Fiercely');
  assert.equal(suffixMatch.hasAffix, true);
  assert.equal(suffixMatch.suffix, 'ly');
  assert.equal(suffixMatch.formattedWithBrackets, 'Fierce[-ly]');

  const prefixSuffixMatch = detectAffixLigatures('Rebuilding');
  assert.equal(prefixSuffixMatch.hasAffix, true);
  assert.equal(prefixSuffixMatch.prefix, 'Re');
  assert.equal(prefixSuffixMatch.suffix, 'ing');
  assert.equal(prefixSuffixMatch.formattedWithBrackets, '[Re-]build[-ing]');
});

test('#32 Anticipatory Relic Rail transitions relics between idle, arming, and flaring states', () => {
  const emptyStates = computeAnticipatoryRelicStates([]);
  assert.ok(emptyStates.every((r) => r.state === 'idle'));

  const armingStates = computeAnticipatoryRelicStates(['Flame', 'Wolf', 'Roar']);
  // 3 words placed -> Phoenix Quill Bookmark is arming (3/4 tablets)
  const featherArming = armingStates.find((r) => r.id === 'relic-phoenix-feather');
  assert.equal(featherArming?.state, 'arming');

  const flaringStates = computeAnticipatoryRelicStates(['Luminous', 'Phoenix', 'Ignite', 'Fiercely']);
  assert.ok(flaringStates.every((r) => r.state === 'flaring'));
});

test('#33 Simultaneous Keyboard + Mouse Harmony plucks highest-scoring duplicate prefix match and cycles with Tab', () => {
  const candidates = [
    { id: 'c1', word: 'Flame', powerBonus: 1 },
    { id: 'c2', word: 'Flashy', powerBonus: 6 },
    { id: 'c3', word: 'Fiercely', powerBonus: 4 },
  ];
  const firstPick = selectBestMatchingTileFromRack(candidates, 'fl', [], 0);
  assert.equal(firstPick.duplicateCount, 2);
  assert.equal(firstPick.bestMatch?.id, 'c2'); // 'Flashy' outscores 'Flame'

  const cycledPick = selectBestMatchingTileFromRack(candidates, 'fl', [], 1);
  assert.equal(cycledPick.bestMatch?.id, 'c1'); // Tab cycles to 'Flame'
});

test('#34 Slide-Out Tactile Tile Bag Drawer computes remaining Vowel, Consonant, and Special tile odds', () => {
  const bag = drawSmartTileHand(createDefaultSmartTileBag('BAG-DRAWER-SEED'), 8, 1);
  const odds = computeNextTurnDrawOdds(bag);
  assert.ok(odds.totalRemaining > 0);
  assert.ok(odds.vowelTiles.length > 0);
  assert.ok(odds.consonantTiles.length > 0);
  assert.ok(odds.nextDrawVowelPct >= 25);
});

test('#35 Chained Keyword Tooltips & Hover-Lock extracts referenced mechanic glossary cards', () => {
  const cards = extractChainedKeywords(['Cryo-Vowel Freeze', 'Time-Bomb Tile', 'Vowel Seal']);
  const ids = cards.map((c) => c.id);
  assert.ok(ids.includes('Freeze'));
  assert.ok(ids.includes('Time-Bomb'));
  assert.ok(ids.includes('Vowel Seal'));
  assert.ok(Object.keys(KEYWORD_GLOSSARY).length >= 7);
});
