import assert from 'node:assert/strict';
import test from 'node:test';
import { ELEMENTS, ELEMENT_TYPES } from '../src/data/elements.ts';
import { createStarterCreature, STARTER_PETS } from '../src/data/starterPets.ts';
import { getAuthDestination } from '../src/data/gameFlow.ts';
import { WORLD_TIERS } from '../src/data/worldTiers.ts';
import { HUB_DESTINATIONS } from '../src/data/hubDestinations.ts';
import { INITIAL_CREATURES, INITIAL_WORDS } from '../src/data/initialData.ts';
import { ARCHETYPE_OPTIONS } from '../src/types/auth.ts';
import { getEvolutionBranch } from '../src/data/evolutionData.ts';
import { evaluateCombo } from '../src/engine/combat.ts';
import { PET_ACCESSORIES_CATALOG, getEffectiveCreatureStats } from '../src/engine/progression.ts';

const wordSlots = ['verb', 'noun', 'adjective', 'adverb'];
const sampleWords = wordSlots.map((partOfSpeech) => ({
  id: `sample-${partOfSpeech}`,
  word: partOfSpeech,
  partOfSpeech,
  element: 'fire',
  definition: 'A sample word for the starter test.',
  example: 'The sample word is ready.',
}));

test('starter choices cover all nine elements with matching display data', () => {
  assert.equal(ELEMENT_TYPES.length, 9);
  assert.deepEqual(Object.keys(STARTER_PETS).sort(), [...ELEMENT_TYPES].sort());

  for (const element of ELEMENT_TYPES) {
    const option = STARTER_PETS[element];
    assert.equal(option.element, element);
    assert.ok(option.name);
    assert.ok(option.emoji);
    assert.ok(ELEMENTS[element].name);
  }
});

test('every element creates a usable starter creature and word loadout', () => {
  for (const element of ELEMENT_TYPES) {
    const pet = createStarterCreature(element, sampleWords);

    assert.equal(pet.id, `starter-${element}`);
    assert.equal(pet.element, element);
    assert.deepEqual(pet.allowedElements, [element]);
    assert.deepEqual(pet.allowedWordTypes, wordSlots);
    assert.ok(pet.stats.hp > 0);
    assert.ok(pet.stats.attack > 0);
    for (const slot of wordSlots) {
      assert.ok(pet.loadout[slot], `${element} starter should have a ${slot}`);
    }
  }
});

test('new explorers continue onboarding while returning explorers enter the game', () => {
  assert.equal(getAuthDestination(false), 'avatar');
  assert.equal(getAuthDestination(true), 'game');
  assert.equal(getAuthDestination(undefined), 'game');
});

test('Word World progresses through nine unique elemental areas with reusable lessons and battles', () => {
  assert.equal(WORLD_TIERS.length, 9);
  assert.deepEqual(
    WORLD_TIERS.map((area) => area.element),
    ['grass', 'water', 'earth', 'fire', 'ice', 'air', 'electric', 'shadow', 'light']
  );
  assert.equal(new Set(WORLD_TIERS.map((area) => area.id)).size, 9);
  assert.deepEqual(
    WORLD_TIERS.slice(0, 5).map((area) => area.id),
    ['root-village', 'prefix-path', 'suffix-steppes', 'compound-colosseum', 'syntax-spire']
  );

  for (const [index, area] of WORLD_TIERS.entries()) {
    assert.equal(area.tierNumber, index + 1);
    assert.ok(area.theme);
    assert.ok(area.vocabConcept);
    assert.ok(area.vocabSamples.length > 0);
    assert.ok(area.boss.id.startsWith('boss_'));
  }
});

test('illustrated hub exposes all five primary destinations as map locations', () => {
  assert.deepEqual(
    HUB_DESTINATIONS.map(({ id }) => id),
    ['hub', 'battle', 'loadout', 'forge', 'shop']
  );
  assert.deepEqual(
    HUB_DESTINATIONS.map(({ label }) => label),
    ['Word World', 'Battle Arena', 'Pet Hatchery', 'Word Forge', 'Lexi Shop']
  );

  for (const destination of HUB_DESTINATIONS) {
    assert.ok(destination.islandName);
    assert.ok(destination.emoji);
    assert.ok(destination.tone);
    assert.ok(destination.x > 0 && destination.x < 100);
    assert.ok(destination.y > 0 && destination.y < 100);
  }
});

test('Air content includes an avatar, companion, and usable vocabulary loadout', () => {
  const airAvatar = ARCHETYPE_OPTIONS.find((option) => option.element === 'air');
  const airPet = INITIAL_CREATURES.find((creature) => creature.id === 'zephyrfinch');
  const catalogWords = Object.values(INITIAL_WORDS).flat();

  assert.ok(airAvatar);
  assert.ok(airPet);
  for (const wordId of Object.values(airPet.loadout)) {
    assert.ok(catalogWords.some((word) => word.id === wordId), `Missing Air companion word: ${wordId}`);
  }
});

test('all 9 starter pets have handcrafted 3-stage evolution trees including Aquafin and Dusklynx', () => {
  for (const element of ELEMENT_TYPES) {
    const starter = createStarterCreature(element, sampleWords);
    const branch = getEvolutionBranch(starter);
    assert.equal(branch.length, 3, `Expected 3 evolution stages for ${element}`);
    assert.notEqual(branch[1].name, `Alpha ${starter.name}`);
  }
  const aquafin = INITIAL_CREATURES.find((c) => c.id === 'aquafin');
  const dusklynx = INITIAL_CREATURES.find((c) => c.id === 'dusklynx');
  assert.equal(getEvolutionBranch(aquafin)[1].name, 'Tidalphin');
  assert.equal(getEvolutionBranch(dusklynx)[1].name, 'Umbrapanther');
});

test('evaluateCombo supports 3-word sentence clauses and wearable PET_ACCESSORIES_CATALOG boosts stats', () => {
  const pet = INITIAL_CREATURES[0];
  const adj = INITIAL_WORDS.adjectives[0];
  const noun = INITIAL_WORDS.nouns[0];
  const verb = INITIAL_WORDS.verbs[0];

  const threeWordClause = evaluateCombo(pet, adj, noun, verb, null);
  assert.equal(threeWordClause.valid, true);
  assert.equal(threeWordClause.effectName, '3-Word Clause Strike');
  assert.ok(threeWordClause.power > 0);
  assert.ok(threeWordClause.shieldGain > 0);

  assert.equal(PET_ACCESSORIES_CATALOG.length, 6);
  for (const acc of PET_ACCESSORIES_CATALOG) {
    const boosted = getEffectiveCreatureStats(pet.stats, acc.id);
    assert.ok(boosted.hp > pet.stats.hp || boosted.attack > pet.stats.attack);
  }
});
