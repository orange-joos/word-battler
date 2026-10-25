/**
 * Word Battler — Central Application Shell (js/main.js)
 * Standard ES6 Module for elementary students (Grades 3–5).
 *
 * Responsibilities:
 * - Maintains global state `ctx` (creatures, words, active pet, battle state, forge state, audio).
 * - Manages tab switching between 'Battle' and 'Word Forge'.
 * - Exposes `window.renderForge` for the Forge UI module.
 * - Handles battle transitions (new battle, creature changes, move executions, audio cues).
 *
 * @module main
 */

import {
  createBattle,
  resolveSentence,
  evaluateCombo,
  getMatrixEffectInfo,
  MOVE_CATEGORIES,
  PHASES,
} from './combat.js';
import { renderForge } from './forge-ui.js';
import { addForgedWord, addForgedCreature } from './forge.js';

// Expose renderForge globally as specified in the architecture outline
if (typeof window !== 'undefined') {
  window.renderForge = renderForge;
}

// ---------------------------------------------------------------------------
// Initial Starter Data (Fire & Ice Archetypes for Elementary Students)
// ---------------------------------------------------------------------------

const DEFAULT_CREATURES = [
  {
    id: 'emberfox',
    name: 'Emberfox',
    element: 'fire',
    elementAffinity: 'fire',
    loadout: {
      verb: 'ignite',
      noun: 'flame',
      adjective: 'blazing',
      adverb: 'fiercely',
    },
    description: 'A nimble fox whose coat holds living embers. Channels flame nouns, heat adjectives, and blazing strikes.',
    stats: { hp: 42, attack: 14, defense: 8, speed: 12 },
    allowedWordTypes: ['adjective', 'noun', 'verb', 'adverb'],
    allowedElements: ['fire'],
  },
  {
    id: 'rimepup',
    name: 'Rimepup',
    element: 'ice',
    elementAffinity: 'ice',
    loadout: {
      verb: 'freeze',
      noun: 'shard',
      adjective: 'frozen',
      adverb: 'coldly',
    },
    description: 'A frost-coated wolf pup that exhales sparkling mist. Channels cold adjectives, ice nouns, and frozen strikes.',
    stats: { hp: 46, attack: 10, defense: 13, speed: 9 },
    allowedWordTypes: ['adjective', 'noun', 'verb', 'adverb'],
    allowedElements: ['ice'],
  },
];

const DEFAULT_WORDS = {
  adjectives: [
    {
      id: 'blazing',
      word: 'blazing',
      partOfSpeech: 'adjective',
      element: 'fire',
      definition: 'Burning brightly and with great heat.',
      example: 'The blazing torch lit the dark cavern.',
    },
    {
      id: 'fierce',
      word: 'fierce',
      partOfSpeech: 'adjective',
      element: 'fire',
      definition: 'Intense, powerful, and aggressive.',
      example: 'A fierce gust fanned the flames.',
    },
    {
      id: 'frozen',
      word: 'frozen',
      partOfSpeech: 'adjective',
      element: 'ice',
      definition: 'Turned into ice or made very cold.',
      example: 'The frozen pond glistened in the morning sun.',
    },
    {
      id: 'sharp',
      word: 'sharp',
      partOfSpeech: 'adjective',
      element: 'ice',
      definition: 'Having a thin piercing edge or biting frost.',
      example: 'A sharp chill cut across the snowfield.',
    },
  ],
  nouns: [
    {
      id: 'flame',
      word: 'flame',
      partOfSpeech: 'noun',
      element: 'fire',
      definition: 'A hot, glowing tongue of burning gas.',
      example: 'The campfire flame danced into the night.',
    },
    {
      id: 'ember',
      word: 'ember',
      partOfSpeech: 'noun',
      element: 'fire',
      definition: 'A glowing fragment of coal or wood in a dying fire.',
      example: 'A golden ember pulsed in the ash.',
    },
    {
      id: 'shard',
      word: 'shard',
      partOfSpeech: 'noun',
      element: 'ice',
      definition: 'A sharp, broken piece of ice or crystal.',
      example: 'An ice shard reflected the pale moonlight.',
    },
    {
      id: 'blizzard',
      word: 'blizzard',
      partOfSpeech: 'noun',
      element: 'ice',
      definition: 'A severe winter storm with howling winds and snow.',
      example: 'The mountain blizzard shrouded the peaks.',
    },
  ],
  verbs: [
    {
      id: 'ignite',
      word: 'ignite',
      partOfSpeech: 'verb',
      element: 'fire',
      definition: 'To catch fire or cause something to burst into flame.',
      example: 'Wild sparks ignite the dry grass.',
    },
    {
      id: 'scorch',
      word: 'scorch',
      partOfSpeech: 'verb',
      element: 'fire',
      definition: 'To burn the surface with searing heat.',
      example: 'Fierce embers scorch the stone floor.',
    },
    {
      id: 'freeze',
      word: 'freeze',
      partOfSpeech: 'verb',
      element: 'ice',
      definition: 'To solidify into ice through severe cold.',
      example: 'Frigid winds freeze the quiet stream.',
    },
    {
      id: 'crystallize',
      word: 'crystallize',
      partOfSpeech: 'verb',
      element: 'ice',
      definition: 'To take the form of glittering ice crystals.',
      example: 'Delicate frost patterns crystallize upon the pane.',
    },
  ],
  adverbs: [
    {
      id: 'fiercely',
      word: 'fiercely',
      partOfSpeech: 'adverb',
      element: 'fire',
      definition: 'In a powerful, aggressive, and blazing manner.',
      example: 'The hearth flared fiercely against the chill.',
    },
    {
      id: 'blazingly',
      word: 'blazingly',
      partOfSpeech: 'adverb',
      element: 'fire',
      definition: 'With dazzling heat and radiant light.',
      example: 'The midday sun shone blazingly hot.',
    },
    {
      id: 'sharply',
      word: 'sharply',
      partOfSpeech: 'adverb',
      element: 'ice',
      definition: 'In a sudden, piercing, or biting manner.',
      example: 'The winter wind bit sharply into our coats.',
    },
    {
      id: 'coldly',
      word: 'coldly',
      partOfSpeech: 'adverb',
      element: 'ice',
      definition: 'In an icy, chilling, or calm way.',
      example: 'The glacier gleamed coldly under the stars.',
    },
  ],
};

// ---------------------------------------------------------------------------
// LocalStorage Persistence Helpers
// ---------------------------------------------------------------------------

function loadSavedCreatures() {
  try {
    const raw = localStorage.getItem('wb_creatures');
    if (!raw) return DEFAULT_CREATURES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CREATURES;

    // Ensure starter creatures are always present
    for (const initC of DEFAULT_CREATURES) {
      if (!parsed.some((c) => c.id === initC.id)) {
        parsed.push(initC);
      }
    }
    return parsed;
  } catch {
    return DEFAULT_CREATURES;
  }
}

function loadSavedWords() {
  try {
    const raw = localStorage.getItem('wb_words');
    if (!raw) return DEFAULT_WORDS;
    const parsed = JSON.parse(raw);

    const mergeBucket = (bucket) => {
      const base = DEFAULT_WORDS[bucket] || [];
      const saved = Array.isArray(parsed[bucket]) ? parsed[bucket] : [];
      const merged = [...base];
      for (const w of saved) {
        if (!merged.some((existing) => existing.id === w.id)) {
          merged.push(w);
        }
      }
      return merged;
    };

    return {
      adjectives: mergeBucket('adjectives'),
      nouns: mergeBucket('nouns'),
      verbs: mergeBucket('verbs'),
      adverbs: mergeBucket('adverbs'),
    };
  } catch {
    return DEFAULT_WORDS;
  }
}

// ---------------------------------------------------------------------------
// Audio and Speech Synthesis "Juice"
// ---------------------------------------------------------------------------

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioCtor) {
      audioCtx = new AudioCtor();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playTone(freq = 600, durationMs = 120, type = 'sine') {
  if (ctx.isMuted) return;
  try {
    const ac = getAudioContext();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    osc.connect(gain);
    gain.connect(ac.destination);

    gain.gain.setValueAtTime(0.12, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + durationMs / 1000);

    osc.start();
    osc.stop(ac.currentTime + durationMs / 1000);
  } catch {
    // audio fallback
  }
}

export function speak(text) {
  if (ctx.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88; // Friendly, slower rate for 3rd-5th graders
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  } catch {
    // speech fallback
  }
}

// ---------------------------------------------------------------------------
// Global Application Context (ctx)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} AppContext
 * @property {'battle' | 'forge'} currentTab
 * @property {string} playerId
 * @property {string} enemyId
 * @property {Array} creatures
 * @property {Object} words
 * @property {Object|null} battleEngine
 * @property {Object|null} battleState
 * @property {Object} forgeState
 * @property {boolean} isMuted
 * @property {Object} battleUIState
 */
export const ctx = {
  currentTab: 'battle',
  playerId: 'emberfox',
  enemyId: 'rimepup',
  creatures: loadSavedCreatures(),
  words: loadSavedWords(),
  battleEngine: null,
  battleState: null,
  forgeState: {
    slot1: null,
    slot2: null,
    activeBin: 'words',
    searchQuery: '',
    lastOutcome: null,
    notice: null,
  },
  isMuted: false,

  // Temporary UI state for Battle View
  battleUIState: {
    category: 'ATTACK',
    posFilter: 'all',
    slot1: null,
    slot2: null,
    inspectedWord: null,
  },
};

// Expose ctx globally for debugging, console testing, and inspection
if (typeof window !== 'undefined') {
  window.ctx = ctx;
}

// ---------------------------------------------------------------------------
// State Persistence Sync
// ---------------------------------------------------------------------------

export function saveState() {
  try {
    localStorage.setItem('wb_creatures', JSON.stringify(ctx.creatures));
    localStorage.setItem('wb_words', JSON.stringify(ctx.words));
  } catch {
    // local storage quota fallback
  }
}

// ---------------------------------------------------------------------------
// Combat Session Initialization & Transitions
// ---------------------------------------------------------------------------

/**
 * Initialize or restart a combat session with the chosen player creature.
 * @param {string} [playerId] - Creature ID for the player champion
 * @param {string} [enemyId] - Creature ID for the enemy challenger
 */
export function initBattle(playerId = ctx.playerId, enemyId = ctx.enemyId) {
  ctx.playerId = playerId;
  ctx.enemyId = enemyId;

  ctx.battleEngine = createBattle({
    creatures: ctx.creatures,
    words: ctx.words,
    playerId: ctx.playerId,
    enemyId: ctx.enemyId,
  });

  ctx.battleState = ctx.battleEngine.getState();
  ctx.battleUIState.slot1 = null;
  ctx.battleUIState.slot2 = null;
}

/**
 * Restart current battle session.
 * @param {string} [newPlayerId]
 */
export function restartBattle(newPlayerId) {
  if (newPlayerId) {
    ctx.playerId = newPlayerId;
  }
  initBattle(ctx.playerId, ctx.enemyId);
  playTone(520, 100);
  renderApp();
}

// ---------------------------------------------------------------------------
// Tab Switching
// ---------------------------------------------------------------------------

/**
 * Switch the application view between 'battle', 'loadout', and 'forge'.
 * @param {'battle' | 'loadout' | 'forge'} tabName
 */
export function switchTab(tabName) {
  if (tabName !== 'battle' && tabName !== 'loadout' && tabName !== 'forge') return;
  ctx.currentTab = tabName;
  playTone(tabName === 'battle' ? 620 : tabName === 'loadout' ? 700 : 780, 80);
  renderApp();
}

if (typeof window !== 'undefined') {
  window.switchTab = switchTab;
  window.initBattle = initBattle;
  window.restartBattle = restartBattle;
}

// ---------------------------------------------------------------------------
// Battle UI Renderer
// ---------------------------------------------------------------------------

function getAllWordsList() {
  return [
    ...(ctx.words.verbs || []),
    ...(ctx.words.nouns || []),
    ...(ctx.words.adjectives || []),
    ...(ctx.words.adverbs || []),
  ];
}

function renderBattleView(container) {
  if (!ctx.battleEngine || !ctx.battleState) {
    initBattle(ctx.playerId, ctx.enemyId);
  }

  const state = ctx.battleState;
  const player = state.player;
  const enemy = state.enemy;
  const ui = ctx.battleUIState;
  const isBattleEnd = state.phase === PHASES.BATTLE_END;

  const playerHpRatio = player.maxHp ? Math.max(0, player.currentHp / player.maxHp) : 0;
  const enemyHpRatio = enemy.maxHp ? Math.max(0, enemy.currentHp / enemy.maxHp) : 0;

  const allWords = getAllWordsList();
  const filteredWords =
    ui.posFilter === 'all'
      ? allWords
      : allWords.filter((w) => w.partOfSpeech === ui.posFilter);

  // Dynamic live combination preview
  const livePreview =
    ui.slot1 || ui.slot2
      ? evaluateCombo(player, ui.slot1, ui.slot2, ui.category)
      : null;

  container.innerHTML = `
    <div class="mx-auto max-w-4xl space-y-6">
      <!-- Pet Selector & Phase Banner -->
      <section class="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-violet-900 bg-violet-950/40 p-3 sm:p-4">
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <label for="pet-select" class="text-xs sm:text-sm font-semibold uppercase tracking-wider text-violet-300">
            Active Pet:
          </label>
          <select
            id="pet-select"
            class="rounded-lg border border-violet-700 bg-violet-900 px-3 py-1.5 text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
          >
            ${ctx.creatures
              .filter((c) => c.id !== 'rimepup')
              .map(
                (c) => `
                <option value="${c.id}" ${c.id === ctx.playerId ? 'selected' : ''}>
                  ${c.name} ${c.forged ? '✦ (Hybrid)' : ''} — ${c.element.toUpperCase()}
                </option>
              `
              )
              .join('')}
          </select>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs uppercase tracking-wider text-violet-400">Battle Phase:</span>
          <span class="rounded-md bg-violet-900/80 px-2.5 py-1 text-xs font-semibold text-amber-300">
            ${state.phase.replaceAll('_', ' ')}
          </span>
        </div>
      </section>

      <!-- Fighter Arenas -->
      <section class="grid gap-4 sm:grid-cols-2">
        <!-- Player Card -->
        <article class="relative overflow-visible rounded-2xl border-2 border-orange-500/80 bg-gradient-to-b from-violet-950/90 to-[#181126] p-5 shadow-lg shadow-orange-950/20">
          <div class="flex items-start justify-between">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-widest text-orange-400">You · Champion</span>
              <div class="flex items-center gap-2 mt-0.5">
                <h2 class="font-serif text-2xl sm:text-3xl font-bold text-orange-50">${player.name}</h2>
                <button type="button" id="speak-player" title="Hear creature lore" class="rounded-lg p-1 text-violet-300 hover:text-white cursor-pointer">
                  🔊
                </button>
              </div>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap justify-end">
              ${
                player.shield > 0
                  ? `<span class="flex items-center gap-1 rounded-full border border-violet-400 bg-violet-950 px-2.5 py-0.5 text-xs font-bold text-violet-200 animate-pulse">🛡️ +${player.shield}</span>`
                  : ''
              }
              <span class="rounded-full border border-orange-500/60 bg-orange-950/40 px-2.5 py-0.5 text-xs font-semibold uppercase text-orange-300">
                ${player.element} 🔥
              </span>
            </div>
          </div>

          <p class="mt-1 text-xs text-slate-300">
            Channels: <strong class="text-violet-200">${(player.allowedElements || [player.element]).join(' + ')}</strong>
          </p>

          <!-- Active Statuses -->
          <div class="mt-2 flex flex-wrap gap-1.5 min-h-[22px]">
            ${player.evasionStance ? `<span class="rounded bg-sky-950 border border-sky-400 px-2 py-0.5 text-[10px] font-bold text-sky-200">💨 Evasion Stance</span>` : ''}
            ${player.reflectStance ? `<span class="rounded bg-violet-950 border border-violet-400 px-2 py-0.5 text-[10px] font-bold text-violet-200">🛡️ Counter-Stance</span>` : ''}
            ${player.empowered ? `<span class="rounded bg-amber-950 border border-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-200">⚡ Empowered (+50%)</span>` : ''}
            ${(player.statuses || [])
              .map(
                (st) => `
                <span class="rounded px-2 py-0.5 text-[10px] font-bold border ${
                  st.type === 'buff' ? 'bg-emerald-950 border-emerald-400 text-emerald-200' : 'bg-rose-950 border-rose-400 text-rose-200'
                }">
                  ${st.name} (${st.duration}t)
                </span>
              `
              )
              .join('')}
          </div>

          <!-- HP Bar -->
          <div class="mt-3 space-y-1.5">
            <div class="flex justify-between text-xs font-medium">
              <span class="text-slate-300">❤️ HP</span>
              <span class="font-mono text-slate-200">${player.currentHp} / ${player.maxHp}</span>
            </div>
            <div class="h-3 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                class="h-full transition-all duration-500 ${playerHpRatio > 0.35 ? 'bg-emerald-500' : 'bg-red-500'}"
                style="width: ${Math.max(0, playerHpRatio * 100)}%"
              ></div>
            </div>
          </div>

          <!-- Stats -->
          <div class="mt-3 flex gap-4 text-xs text-slate-300 border-t border-violet-900/60 pt-2.5">
            <div>ATK: <strong class="text-orange-300">${player.stats.attack}</strong></div>
            <div>DEF: <strong class="text-sky-300">${player.stats.defense}</strong></div>
            <div>SPD: <strong class="text-violet-300">${player.stats.speed}</strong></div>
            <div>SHIELD: <strong class="text-violet-300">${player.shield || 0}</strong></div>
          </div>
        </article>

        <!-- Rival Card -->
        <article class="relative overflow-visible rounded-2xl border-2 border-sky-500/80 bg-gradient-to-b from-violet-950/90 to-[#181126] p-5 shadow-lg shadow-sky-950/20">
          <div class="flex items-start justify-between">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-widest text-sky-400">Rival · Challenger</span>
              <div class="flex items-center gap-2 mt-0.5">
                <h2 class="font-serif text-2xl sm:text-3xl font-bold text-sky-50">${enemy.name}</h2>
                <button type="button" id="speak-enemy" title="Hear creature lore" class="rounded-lg p-1 text-violet-300 hover:text-white cursor-pointer">
                  🔊
                </button>
              </div>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap justify-end">
              ${
                enemy.shield > 0
                  ? `<span class="flex items-center gap-1 rounded-full border border-violet-400 bg-violet-950 px-2.5 py-0.5 text-xs font-bold text-violet-200 animate-pulse">🛡️ +${enemy.shield}</span>`
                  : ''
              }
              <span class="rounded-full border border-sky-500/60 bg-sky-950/40 px-2.5 py-0.5 text-xs font-semibold uppercase text-sky-300">
                ${enemy.element} ❄️
              </span>
            </div>
          </div>

          <p class="mt-1 text-xs text-slate-300">
            Channels: <strong class="text-violet-200">${(enemy.allowedElements || [enemy.element]).join(' + ')}</strong>
          </p>

          <!-- Active Statuses -->
          <div class="mt-2 flex flex-wrap gap-1.5 min-h-[22px]">
            ${enemy.evasionStance ? `<span class="rounded bg-sky-950 border border-sky-400 px-2 py-0.5 text-[10px] font-bold text-sky-200">💨 Evasion Stance</span>` : ''}
            ${enemy.reflectStance ? `<span class="rounded bg-violet-950 border border-violet-400 px-2 py-0.5 text-[10px] font-bold text-violet-200">🛡️ Counter-Stance</span>` : ''}
            ${enemy.empowered ? `<span class="rounded bg-amber-950 border border-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-200">⚡ Empowered (+50%)</span>` : ''}
            ${(enemy.statuses || [])
              .map(
                (st) => `
                <span class="rounded px-2 py-0.5 text-[10px] font-bold border ${
                  st.type === 'buff' ? 'bg-emerald-950 border-emerald-400 text-emerald-200' : 'bg-rose-950 border-rose-400 text-rose-200'
                }">
                  ${st.name} (${st.duration}t)
                </span>
              `
              )
              .join('')}
          </div>

          <!-- HP Bar -->
          <div class="mt-3 space-y-1.5">
            <div class="flex justify-between text-xs font-medium">
              <span class="text-slate-300">❤️ HP</span>
              <span class="font-mono text-slate-200">${enemy.currentHp} / ${enemy.maxHp}</span>
            </div>
            <div class="h-3 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                class="h-full transition-all duration-500 ${enemyHpRatio > 0.35 ? 'bg-emerald-500' : 'bg-red-500'}"
                style="width: ${Math.max(0, enemyHpRatio * 100)}%"
              ></div>
            </div>
          </div>

          <!-- Stats -->
          <div class="mt-3 flex gap-4 text-xs text-slate-300 border-t border-violet-900/60 pt-2.5">
            <div>ATK: <strong class="text-orange-300">${enemy.stats.attack}</strong></div>
            <div>DEF: <strong class="text-sky-300">${enemy.stats.defense}</strong></div>
            <div>SPD: <strong class="text-violet-300">${enemy.stats.speed}</strong></div>
            <div>SHIELD: <strong class="text-violet-300">${enemy.shield || 0}</strong></div>
          </div>
        </article>
      </section>

      <!-- Word Inspector Banner -->
      ${
        ui.inspectedWord
          ? `
        <aside class="rounded-2xl border-2 border-amber-400/80 bg-gradient-to-r from-violet-950 via-[#1b122c] to-violet-950 p-4 shadow-xl">
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold uppercase tracking-wider text-amber-300">Word Inspector</span>
                <span class="rounded bg-violet-900 px-2 py-0.5 text-[11px] font-semibold text-violet-200 capitalize">
                  ${ui.inspectedWord.partOfSpeech}
                </span>
                <span class="rounded bg-amber-950/80 px-2 py-0.5 text-[11px] font-semibold text-amber-300 capitalize">
                  ${ui.inspectedWord.element} ${ui.inspectedWord.element === 'fire' ? '🔥' : '❄️'}
                </span>
              </div>
              <h3 class="font-serif text-2xl font-bold capitalize text-white">${ui.inspectedWord.word}</h3>
              <p class="text-xs sm:text-sm text-slate-200">"${ui.inspectedWord.definition}"</p>
              <p class="text-xs italic text-violet-300">Example: "${ui.inspectedWord.example}"</p>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" id="hear-inspected" class="rounded-xl border border-violet-700 bg-violet-900/80 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-violet-800 cursor-pointer">
                🔊 Pronounce
              </button>
              <button type="button" id="close-inspector" class="rounded-xl p-1 text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
          </div>
        </aside>
      `
          : ''
      }

      <!-- 4x4 Category Selector Tabs -->
      <section class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-violet-300">
            Choose Move Category (4x4 Action Matrix):
          </span>
          <span class="text-xs text-slate-400">Any part of speech works in each category!</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          ${[
            { id: 'ATTACK', label: 'Attack (Offense)', icon: '⚔️', activeClass: 'from-red-600 to-orange-600 ring-2 ring-orange-400' },
            { id: 'DEFEND', label: 'Defend (Shield)', icon: '🛡️', activeClass: 'from-violet-600 to-indigo-600 ring-2 ring-violet-400' },
            { id: 'BUFF', label: 'Buff (Boost)', icon: '✨', activeClass: 'from-amber-600 to-yellow-600 ring-2 ring-amber-300' },
            { id: 'DEBUFF', label: 'Debuff (Disrupt)', icon: '🌀', activeClass: 'from-emerald-600 to-teal-600 ring-2 ring-emerald-400' },
          ]
            .map(
              (cat) => `
              <button
                type="button"
                data-category="${cat.id}"
                class="category-btn flex items-center justify-center gap-2 rounded-xl p-3 text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer ${
                  ui.category === cat.id
                    ? `bg-gradient-to-r ${cat.activeClass} text-white`
                    : 'bg-violet-950 text-violet-300 hover:bg-violet-900'
                }"
              >
                <span>${cat.icon}</span>
                <span>${cat.label}</span>
              </button>
            `
            )
            .join('')}
        </div>
      </section>

      <!-- Word Selection Vault -->
      <section class="space-y-4 rounded-2xl border border-violet-900/80 bg-violet-950/30 p-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-violet-800/60 pb-3">
          <div>
            <h3 class="text-sm font-bold uppercase tracking-wider text-amber-200">Elemental Word Vault</h3>
            <p class="text-xs text-violet-300/80">Choose 1 word for direct action, or 2 words to synthesize a combo</p>
          </div>

          <!-- POS Filters -->
          <div class="flex items-center gap-1 flex-wrap">
            ${['all', 'verb', 'noun', 'adjective', 'adverb']
              .map(
                (pos) => `
                <button
                  type="button"
                  data-pos="${pos}"
                  class="pos-filter-btn rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition cursor-pointer ${
                    ui.posFilter === pos
                      ? 'bg-violet-600 text-white shadow'
                      : 'bg-violet-950 text-violet-300 hover:bg-violet-900'
                  }"
                >
                  ${pos === 'all' ? 'All Words' : `${pos}s`}
                </button>
              `
              )
              .join('')}
          </div>
        </div>

        <!-- Word Cards -->
        <div class="flex flex-wrap gap-2.5 max-h-72 overflow-y-auto pr-1">
          ${filteredWords
            .map((word) => {
              const isSelected = ui.slot1?.id === word.id || ui.slot2?.id === word.id;
              const isFire = word.element === 'fire';
              const isUsable = (player.allowedElements || [player.element]).includes(word.element);
              const matrixRole = getMatrixEffectInfo(ui.category, word.partOfSpeech);

              return `
              <button
                type="button"
                data-word-id="${word.id}"
                class="word-token-btn rounded-xl border-2 px-3.5 py-2 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-300 bg-amber-500/20 ring-2 ring-amber-400 shadow-md scale-105'
                    : isFire
                    ? 'border-orange-500/70 bg-violet-950 hover:bg-violet-900 text-orange-200'
                    : 'border-sky-500/70 bg-violet-950 hover:bg-violet-900 text-sky-200'
                } ${!isUsable ? 'opacity-40 hover:opacity-75' : ''}"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="block text-sm font-semibold text-slate-100">${word.word}</span>
                  <span class="text-[10px] rounded px-1.5 py-0.2 bg-violet-900 text-violet-300 uppercase">
                    ${word.partOfSpeech}
                  </span>
                </div>
                <div class="flex items-center gap-1.5 text-[11px] uppercase tracking-wider mt-0.5">
                  <span class="${isFire ? 'text-orange-400' : 'text-sky-400'}">
                    ${word.element} ${isFire ? '🔥' : '❄️'}
                  </span>
                  <span class="text-[10px] text-amber-300 font-medium">· ${matrixRole.name}</span>
                </div>
              </button>
            `;
            })
            .join('')}
        </div>
      </section>

      <!-- Sentence Builder Bar -->
      <section class="rounded-2xl border-2 border-violet-700 bg-gradient-to-r from-violet-950/80 via-[#191129] to-violet-950/80 p-5 shadow-xl">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="w-full sm:w-auto space-y-2">
            <span class="text-xs uppercase tracking-widest text-violet-300 block">
              ${ui.category} Sentence Builder (1 or 2 words):
            </span>

            <div class="flex items-center gap-2 flex-wrap">
              <!-- Slot 1 -->
              <div class="min-w-[130px] rounded-xl border-2 p-2.5 text-center transition-all ${
                ui.slot1
                  ? 'border-amber-400 bg-amber-950/40 text-amber-100'
                  : 'border-dashed border-violet-700 bg-violet-950/40 text-slate-400'
              }">
                <span class="text-[10px] uppercase tracking-wider block text-violet-300">Slot 1 (Action)</span>
                <div class="flex items-center justify-center gap-1.5 mt-0.5">
                  <span class="font-serif font-bold text-base capitalize">
                    ${ui.slot1 ? ui.slot1.word : 'Pick Word'}
                  </span>
                  ${
                    ui.slot1
                      ? `<button type="button" id="clear-slot1" class="text-amber-300 hover:text-white cursor-pointer">✕</button>`
                      : ''
                  }
                </div>
              </div>

              <span class="font-serif text-xl font-bold text-violet-400">+</span>

              <!-- Slot 2 -->
              <div class="min-w-[130px] rounded-xl border-2 p-2.5 text-center transition-all ${
                ui.slot2
                  ? 'border-sky-400 bg-sky-950/40 text-sky-100'
                  : 'border-dashed border-violet-700 bg-violet-950/40 text-slate-400'
              }">
                <span class="text-[10px] uppercase tracking-wider block text-violet-300">Slot 2 (Optional)</span>
                <div class="flex items-center justify-center gap-1.5 mt-0.5">
                  <span class="font-serif font-bold text-base capitalize">
                    ${ui.slot2 ? ui.slot2.word : '(Optional)'}
                  </span>
                  ${
                    ui.slot2
                      ? `<button type="button" id="clear-slot2" class="text-sky-300 hover:text-white cursor-pointer">✕</button>`
                      : ''
                  }
                </div>
              </div>

              ${
                ui.slot1 || ui.slot2
                  ? `
                <button type="button" id="pronounce-phrase" title="Pronounce phrase" class="rounded-lg p-2 text-violet-300 hover:text-white cursor-pointer">
                  🔊
                </button>
              `
                  : ''
              }
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            ${
              (ui.slot1 || ui.slot2) && !isBattleEnd
                ? `<button type="button" id="clear-both-slots" class="rounded-lg border border-violet-800 px-3 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-900 transition cursor-pointer">
                    Clear Slots
                  </button>`
                : ''
            }

            <button
              type="button"
              id="execute-btn"
              ${!isBattleEnd && !ui.slot1 ? 'disabled' : ''}
              class="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base sm:text-lg font-bold transition-all shadow-lg w-full sm:w-auto cursor-pointer ${
                isBattleEnd
                  ? 'bg-amber-500 text-violet-950 hover:bg-amber-400 ring-2 ring-amber-300 animate-pulse'
                  : ui.slot1
                  ? ui.category === 'ATTACK'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 ring-2 ring-orange-400'
                    : ui.category === 'DEFEND'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 ring-2 ring-violet-400'
                    : ui.category === 'BUFF'
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white hover:from-amber-500 hover:to-yellow-500 ring-2 ring-amber-400'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 ring-2 ring-emerald-400'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }"
            >
              ${isBattleEnd ? '🔄 New Battle' : `⚡ Execute ${ui.category}`}
            </button>
          </div>
        </div>

        <!-- Live Linguistic Feedback Preview -->
        ${
          livePreview && ui.slot1 && !isBattleEnd
            ? `
          <div class="mt-4 rounded-xl border p-3 text-xs sm:text-sm ${
            livePreview.valid
              ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200'
              : 'border-rose-500/50 bg-rose-950/30 text-rose-200'
          }">
            <div class="flex items-center gap-1.5 font-bold">
              ${livePreview.valid ? `⚡ ${livePreview.effectName} (${ui.category}): ${livePreview.tacticalOutcome}` : `⚠️ Incompatible Combination`}
            </div>
            <p class="mt-1 text-slate-200">${livePreview.reasons[0] || ''}</p>
          </div>
        `
            : ''
        }
      </section>

      <!-- Combat Log -->
      <section class="rounded-2xl border border-violet-900 bg-violet-950/30 p-5">
        <div class="flex items-center justify-between mb-3 border-b border-violet-800/60 pb-2">
          <h3 class="text-xs font-bold uppercase tracking-wider text-violet-300">4x4 Battle Turn Log</h3>
          <span class="text-[11px] text-slate-400">Events &amp; Turn History</span>
        </div>

        <div class="max-h-48 space-y-2 overflow-y-auto pr-2">
          ${(state.log || [])
            .slice()
            .reverse()
            .map((entry) => {
              const text =
                entry.message ||
                (entry.type === 'DAMAGE'
                  ? `Direct hit deals ${entry.amount} damage!`
                  : entry.type === 'SHIELD'
                  ? `Fortified shield by +${entry.amount}!`
                  : entry.type === 'VICTORY'
                  ? `Victory! ${player.name} won!`
                  : entry.type === 'DEFEAT'
                  ? `Defeat! ${enemy.name} triumphed!`
                  : entry.phrase || JSON.stringify(entry));
              return `
              <div class="rounded-lg p-2.5 text-xs sm:text-sm border-l-4 border-l-violet-500 bg-violet-900/30 text-slate-200">
                ${text}
              </div>
            `;
            })
            .join('')}
        </div>
      </section>
    </div>
  `;

  // Attach event listeners for Battle View
  attachBattleEvents(container);
}

function attachBattleEvents(container) {
  const ui = ctx.battleUIState;

  // Active Pet select change
  container.querySelector('#pet-select')?.addEventListener('change', (e) => {
    restartBattle(e.target.value);
  });

  // Speak creature lore
  container.querySelector('#speak-player')?.addEventListener('click', () => {
    speak(`${ctx.battleState.player.name}. ${ctx.battleState.player.description}`);
  });
  container.querySelector('#speak-enemy')?.addEventListener('click', () => {
    speak(`${ctx.battleState.enemy.name}. ${ctx.battleState.enemy.description}`);
  });

  // Word inspector controls
  container.querySelector('#hear-inspected')?.addEventListener('click', () => {
    if (ui.inspectedWord) speak(ui.inspectedWord.word);
  });
  container.querySelector('#close-inspector')?.addEventListener('click', () => {
    ui.inspectedWord = null;
    renderBattleView(container);
  });

  // Category Buttons
  container.querySelectorAll('.category-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      ui.category = btn.getAttribute('data-category');
      playTone(ui.category === 'ATTACK' ? 520 : ui.category === 'DEFEND' ? 660 : 780, 80);
      renderBattleView(container);
    });
  });

  // POS Filter Buttons
  container.querySelectorAll('.pos-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      ui.posFilter = btn.getAttribute('data-pos');
      playTone(480, 60);
      renderBattleView(container);
    });
  });

  // Word token click
  container.querySelectorAll('.word-token-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wordId = btn.getAttribute('data-word-id');
      const allWords = getAllWordsList();
      const word = allWords.find((w) => w.id === wordId);
      if (!word) return;

      ui.inspectedWord = word;
      speak(word.word);
      playTone(word.element === 'fire' ? 640 : 540, 80);

      // Slotting
      if (ui.slot1?.id === word.id) {
        ui.slot1 = null;
      } else if (ui.slot2?.id === word.id) {
        ui.slot2 = null;
      } else if (!ui.slot1) {
        ui.slot1 = word;
      } else if (!ui.slot2) {
        ui.slot2 = word;
      } else {
        ui.slot2 = word;
      }

      renderBattleView(container);
    });
  });

  // Clear slot buttons
  container.querySelector('#clear-slot1')?.addEventListener('click', () => {
    ui.slot1 = null;
    renderBattleView(container);
  });
  container.querySelector('#clear-slot2')?.addEventListener('click', () => {
    ui.slot2 = null;
    renderBattleView(container);
  });
  container.querySelector('#clear-both-slots')?.addEventListener('click', () => {
    ui.slot1 = null;
    ui.slot2 = null;
    renderBattleView(container);
  });

  // Pronounce phrase
  container.querySelector('#pronounce-phrase')?.addEventListener('click', () => {
    const phrase = `${ui.slot1?.word || ''} ${ui.slot2?.word || ''}`.trim();
    if (phrase) speak(phrase);
  });

  // Execute Action / Restart Battle
  container.querySelector('#execute-btn')?.addEventListener('click', () => {
    if (ctx.battleState.phase === PHASES.BATTLE_END) {
      restartBattle(ctx.playerId);
      return;
    }

    if (!ui.slot1) return;

    // Submit Action to 4x4 combat engine
    const result = ctx.battleEngine.submitAction(ui.category, ui.slot1, ui.slot2);
    ctx.battleState = result.state;

    // Sound FX
    if (ui.category === 'ATTACK') {
      playTone(220, 150, 'sawtooth');
    } else if (ui.category === 'DEFEND') {
      playTone(720, 180, 'sine');
    } else if (ui.category === 'BUFF') {
      playTone(880, 150, 'triangle');
    } else {
      playTone(340, 150, 'square');
    }

    ui.slot1 = null;
    ui.slot2 = null;
    renderBattleView(container);
  });
}

// ---------------------------------------------------------------------------
// Arsenal / Pre-Battle Loadout Screen Renderer
// ---------------------------------------------------------------------------

function renderLoadoutView(container) {
  const activePet = ctx.creatures.find((c) => c.id === ctx.playerId) || ctx.creatures[0];
  const petAffinity = activePet.elementAffinity || activePet.element;
  const allWords = getAllWordsList();

  const loadout = activePet.loadout || { verb: null, noun: null, adjective: null, adverb: null };
  const equipped = {
    verb: allWords.find((w) => w.id === loadout.verb) || null,
    noun: allWords.find((w) => w.id === loadout.noun) || null,
    adjective: allWords.find((w) => w.id === loadout.adjective) || null,
    adverb: allWords.find((w) => w.id === loadout.adverb) || null,
  };

  const slots = [
    { pos: 'verb', label: 'Verb Slot', role: 'Action & Strike' },
    { pos: 'noun', label: 'Noun Slot', role: 'Substance & Shield' },
    { pos: 'adjective', label: 'Adjective Slot', role: 'Quality & Attribute' },
    { pos: 'adverb', label: 'Adverb Slot', role: 'Pacing & Momentum' },
  ];

  container.innerHTML = `
    <div class="mx-auto max-w-5xl space-y-6">
      <section class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-violet-900/80 bg-gradient-to-r from-violet-950/80 via-[#191129] to-violet-950/80 p-5 shadow-lg">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="font-serif text-xl sm:text-2xl font-bold text-orange-50">${activePet.name}</h2>
            <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
              petAffinity === 'fire'
                ? 'bg-orange-950 border border-orange-600 text-orange-300'
                : 'bg-cyan-950 border border-cyan-600 text-cyan-300'
            }">
              ${petAffinity === 'fire' ? '🔥' : '❄️'} ${petAffinity} Affinity
            </span>
          </div>
          <p class="text-xs text-violet-300 mt-1">${activePet.description}</p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" id="loadout-auto-equip-btn" class="rounded-xl border border-amber-500/60 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/60 transition cursor-pointer">
            ⚡ Auto-Equip
          </button>
          <button type="button" id="loadout-enter-battle-btn" class="rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg transition cursor-pointer">
            Enter Battle ⚔️
          </button>
        </div>
      </section>

      <!-- 4 Slots -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        ${slots
          .map((s) => {
            const w = equipped[s.pos];
            return `
            <div class="rounded-2xl border-2 p-4 flex flex-col justify-between ${
              w ? 'border-violet-600 bg-violet-950/60' : 'border-dashed border-violet-800/60 bg-violet-950/20'
            }">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold uppercase text-slate-200">${s.label}</span>
                  <span class="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-violet-900 text-violet-300">${s.pos}</span>
                </div>
                ${
                  w
                    ? `
                  <h4 class="font-serif text-lg font-bold text-slate-100">${w.word}</h4>
                  <div class="flex items-center gap-1.5 mt-1 text-[10px]">
                    <span class="rounded px-1.5 py-0.5 uppercase ${
                      w.element === 'fire' ? 'bg-orange-950 text-orange-300' : 'bg-cyan-950 text-cyan-300'
                    }">${w.element === 'fire' ? '🔥' : '❄️'} ${w.element}</span>
                    ${
                      w.powerBonus || w.forge?.powerBonus
                        ? `<span class="rounded bg-amber-500/20 text-amber-300 px-1 font-bold">+${
                            w.powerBonus || w.forge?.powerBonus
                          } PWR</span>`
                        : ''
                    }
                  </div>
                  <p class="text-[11px] text-slate-300 italic mt-2">"${w.definition}"</p>
                `
                    : `
                  <div class="py-4 text-center text-violet-400 text-xs">Empty Slot<br><span class="text-[10px] text-violet-400/70">Pick a ${s.pos} below</span></div>
                `
                }
              </div>
              ${
                w
                  ? `
                <div class="pt-3 border-t border-violet-800/40 mt-3 flex justify-end">
                  <button type="button" data-unequip-slot="${s.pos}" class="text-[11px] text-red-300 hover:text-red-100 font-semibold cursor-pointer">✕ Unequip</button>
                </div>
              `
                  : ''
              }
            </div>
          `;
          })
          .join('')}
      </section>

      <!-- Word Collection -->
      <section class="rounded-2xl border border-violet-900/80 bg-violet-950/40 p-4 space-y-3">
        <h3 class="font-serif text-base font-bold text-slate-100">Word Collection (${allWords.length} Cards in Arsenal)</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          ${allWords
            .map((card) => {
              const isEquipped = activePet.loadout?.[card.partOfSpeech] === card.id;
              return `
              <div class="rounded-xl border p-3 flex flex-col justify-between ${
                isEquipped ? 'border-emerald-500 bg-emerald-950/30' : 'border-violet-800/60 bg-violet-950/40'
              }">
                <div>
                  <div class="flex items-center justify-between text-[10px]">
                    <span class="rounded px-1.5 py-0.5 font-bold uppercase bg-violet-900 text-violet-300">${
                      card.partOfSpeech
                    }</span>
                    <span>${card.element === 'fire' ? '🔥' : '❄️'}</span>
                  </div>
                  <h4 class="font-serif text-base font-bold text-slate-100 mt-1">${card.word}</h4>
                  <p class="text-[11px] text-slate-300 mt-1 line-clamp-2">${card.definition}</p>
                </div>
                <div class="mt-3 pt-2 border-t border-violet-800/40">
                  <button type="button" data-equip-word="${card.id}" data-equip-pos="${
                card.partOfSpeech
              }" class="w-full py-1 text-xs font-bold rounded transition cursor-pointer ${
                isEquipped
                  ? 'bg-emerald-700/80 text-emerald-100'
                  : 'bg-violet-800 hover:bg-violet-700 text-slate-100'
              }">
                    ${isEquipped ? '✓ Equipped' : '＋ Equip to ' + card.partOfSpeech}
                  </button>
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      </section>
    </div>
  `;

  // Event handlers
  container.querySelector('#loadout-enter-battle-btn')?.addEventListener('click', () => {
    switchTab('battle');
  });

  container.querySelector('#loadout-auto-equip-btn')?.addEventListener('click', () => {
    const slotsList = ['verb', 'noun', 'adjective', 'adverb'];
    const newLoadout = { ...(activePet.loadout || {}) };
    slotsList.forEach((s) => {
      const candidates = allWords.filter((w) => w.partOfSpeech === s);
      candidates.sort((a, b) => {
        const aAff = a.element === petAffinity ? 1 : 0;
        const bAff = b.element === petAffinity ? 1 : 0;
        return bAff - aAff;
      });
      if (candidates.length > 0) newLoadout[s] = candidates[0].id;
    });
    activePet.loadout = newLoadout;
    saveState();
    playTone(880, 100);
    renderLoadoutView(container);
  });

  container.querySelectorAll('[data-unequip-slot]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const slot = e.currentTarget.getAttribute('data-unequip-slot');
      if (activePet.loadout) activePet.loadout[slot] = null;
      saveState();
      playTone(400, 60);
      renderLoadoutView(container);
    });
  });

  container.querySelectorAll('[data-equip-word]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const wordId = e.currentTarget.getAttribute('data-equip-word');
      const pos = e.currentTarget.getAttribute('data-equip-pos');
      if (!activePet.loadout) activePet.loadout = { verb: null, noun: null, adjective: null, adverb: null };
      if (activePet.loadout[pos] === wordId) {
        activePet.loadout[pos] = null;
      } else {
        activePet.loadout[pos] = wordId;
      }
      saveState();
      playTone(700, 80);
      renderLoadoutView(container);
    });
  });
}

// ---------------------------------------------------------------------------
// Central Application Shell Renderer
// ---------------------------------------------------------------------------

/**
 * Render the entire shell (Navigation Header, Active Tab Content, and Footer).
 * @param {HTMLElement} [targetEl]
 */
export function renderApp(targetEl) {
  let root = targetEl;
  if (!root) {
    root = document.getElementById('shell-root') || document.getElementById('root') || document.body;
  }
  if (!root) return;

  // Build shell scaffold if not already present
  if (!root.querySelector('#app-header')) {
    root.innerHTML = `
      <div class="min-h-screen bg-[#100c18] text-slate-100 flex flex-col font-sans">
        <!-- Application Header -->
        <header id="app-header" class="sticky top-0 z-50 border-b border-violet-900/80 bg-violet-950/70 backdrop-blur px-4 py-3 sm:px-6">
          <div class="mx-auto flex max-w-5xl items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🔥</span>
              <div>
                <h1 class="font-serif text-lg sm:text-xl font-bold tracking-wider text-orange-50">
                  WORD BATTLER
                </h1>
                <span class="text-[10px] uppercase tracking-widest text-violet-400 block -mt-1">
                  Morphology &amp; 4x4 Matrix Combat
                </span>
              </div>
            </div>

            <!-- Navigation Tabs -->
            <nav class="flex items-center gap-2">
              <button
                type="button"
                id="nav-tab-battle"
                class="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  ctx.currentTab === 'battle'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-950/40 ring-1 ring-orange-400'
                    : 'bg-violet-900/60 text-violet-300 hover:bg-violet-900 hover:text-white'
                }"
              >
                ⚔️ Battle
              </button>
              <button
                type="button"
                id="nav-tab-loadout"
                class="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  ctx.currentTab === 'loadout'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400'
                    : 'bg-violet-900/60 text-violet-300 hover:bg-violet-900 hover:text-white'
                }"
              >
                🎒 Arsenal
              </button>
              <button
                type="button"
                id="nav-tab-forge"
                class="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  ctx.currentTab === 'forge'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-950/40 ring-1 ring-amber-400'
                    : 'bg-violet-900/60 text-violet-300 hover:bg-violet-900 hover:text-white'
                }"
              >
                ✦ Word Forge
              </button>

              <!-- Mute Toggle -->
              <button
                type="button"
                id="nav-toggle-mute"
                title="Toggle Sound & Speech"
                class="ml-2 rounded-xl p-2 text-violet-300 hover:bg-violet-900 hover:text-white transition cursor-pointer"
              >
                ${ctx.isMuted ? '🔇' : '🔊'}
              </button>
            </nav>
          </div>
        </header>

        <!-- Dynamic Content Body -->
        <main id="app-view-container" class="flex-1 px-4 py-6 sm:px-6 sm:py-8"></main>

        <!-- Footer -->
        <footer class="border-t border-violet-950 py-4 text-center text-xs text-violet-400/80">
          Word Battler · Educational Vocabulary &amp; English Morphology Combat System
        </footer>
      </div>
    `;

    // Tab button handlers
    root.querySelector('#nav-tab-battle')?.addEventListener('click', () => switchTab('battle'));
    root.querySelector('#nav-tab-loadout')?.addEventListener('click', () => switchTab('loadout'));
    root.querySelector('#nav-tab-forge')?.addEventListener('click', () => switchTab('forge'));
    root.querySelector('#nav-toggle-mute')?.addEventListener('click', () => {
      ctx.isMuted = !ctx.isMuted;
      playTone(500, 60);
      renderApp(root);
    });
  } else {
    // Update active tab buttons visual state
    const battleTabBtn = root.querySelector('#nav-tab-battle');
    const loadoutTabBtn = root.querySelector('#nav-tab-loadout');
    const forgeTabBtn = root.querySelector('#nav-tab-forge');
    const muteBtn = root.querySelector('#nav-toggle-mute');

    if (battleTabBtn && forgeTabBtn) {
      battleTabBtn.className =
        ctx.currentTab === 'battle'
          ? 'rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-950/40 ring-1 ring-orange-400'
          : 'rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer bg-violet-900/60 text-violet-300 hover:bg-violet-900 hover:text-white';

      if (loadoutTabBtn) {
        loadoutTabBtn.className =
          ctx.currentTab === 'loadout'
            ? 'rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400'
            : 'rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer bg-violet-900/60 text-violet-300 hover:bg-violet-900 hover:text-white';
      }

      forgeTabBtn.className =
        ctx.currentTab === 'forge'
          ? 'rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-950/40 ring-1 ring-amber-400'
          : 'rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer bg-violet-900/60 text-violet-300 hover:bg-violet-900 hover:text-white';
    }
    if (muteBtn) {
      muteBtn.textContent = ctx.isMuted ? '🔇' : '🔊';
    }
  }

  const container = root.querySelector('#app-view-container');
  if (!container) return;

  if (ctx.currentTab === 'battle') {
    renderBattleView(container);
  } else if (ctx.currentTab === 'loadout') {
    renderLoadoutView(container);
  } else {
    // Forge Actions Callback Protocol
    const forgeActions = {
      goToBattle: () => {
        switchTab('battle');
      },
      useCreature: (creatureId) => {
        ctx.playerId = creatureId;
        initBattle(creatureId);
        switchTab('battle');
        speak(`${creatureId} entered the battle arena!`);
      },
      onForgedWord: (newWord) => {
        ctx.words = addForgedWord(ctx.words, newWord);
        saveState();
      },
      onForgedCreature: (newCreature) => {
        ctx.creatures = addForgedCreature(ctx.creatures, newCreature);
        saveState();
      },
    };

    renderForge(container, ctx, forgeActions);
  }
}

/**
 * Initialize the application shell.
 * @param {HTMLElement} [rootElement]
 */
export function initApp(rootElement) {
  initBattle(ctx.playerId, ctx.enemyId);
  renderApp(rootElement);
}

// Auto-boot if loaded directly in a page containing #shell-root or when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const shell = document.getElementById('shell-root');
      if (shell) initApp(shell);
    });
  } else {
    const shell = document.getElementById('shell-root');
    if (shell) initApp(shell);
  }
}

export default {
  ctx,
  switchTab,
  initBattle,
  restartBattle,
  renderApp,
  initApp,
  renderForge,
};
