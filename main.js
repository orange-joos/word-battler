/**
 * Main Application Shell for Word Battler
 * Ties together tabs, game state, event-driven combat, and audio/speech juice.
 */

import { createBattle, PHASES } from "./combat.js";
import { juice } from "./js/juice.js";
import { creaturesFile } from "./data/creatures.json"; // Adjust path if imported differently
import { wordsData } from "./data/words.json";       // Adjust path if imported differently
// Note: In your current standalone file, these might be loaded globally or via import. 
// Adjust the data paths below to match your folder setup.

// Global Application State
const ctx = {
  tab: "battle", // "battle" or "forge"
  playerId: "emberfox",
  enemyId: "rimepup",
  creatures: [],
  words: { adjectives: [], nouns: [], verbs: [], adverbs: [] },
  battle: null,
  selectedWords: [], // Supports up to 2 words for sentences
  actions: null,
};

const app = document.getElementById("app");
const tabButtons = document.querySelectorAll("[data-tab]");

/**
 * Initialize Data & Start First Battle
 */
export function initApp(creaturesInput, wordsInput) {
  ctx.creatures = creaturesInput;
  ctx.words = wordsInput;
  
  startNewBattle();
  setupTabNavigation();
}

function startNewBattle() {
  ctx.battle = createBattle({
    creatures: ctx.creatures,
    words: ctx.words,
    playerId: ctx.playerId,
    enemyId: ctx.enemyId,
  });
  ctx.battle.start();
  ctx.selectedWords = [];
}

/**
 * Handle Tab Switching
 */
function setupTabNavigation() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");
      ctx.tab = targetTab;
      render();
    });
  });
}

/**
 * Central Render Switcher
 */
function render() {
  // Update tab button visual styles
  tabButtons.forEach((button) => {
    const active = button.getAttribute("data-tab") === ctx.tab;
    button.classList.toggle("bg-violet-600", active);
    button.classList.toggle("text-violet-50", active);
  });

  if (ctx.tab === "forge") {
    // Render Word Forge tab (Calls function from forge-ui.js if modularized)
    if (typeof window.renderForge === "function") {
      window.renderForge(app, ctx, ctx.actions);
    } else {
      app.innerHTML = `<div class="p-8 text-center text-slate-300">Word Forge module loading...</div>`;
    }
  } else {
    // Render Battle tab
    renderBattleScreen();
  }
}

/**
 * Render Battle Interface & Wire Interactive Word Buttons
 */
function renderBattleScreen() {
  const state = ctx.battle.getState();
  const player = state.player;
  const enemy = state.enemy;
  const ended = state.phase === PHASES.BATTLE_END;

  app.innerHTML = `
    <main class="min-h-screen bg-[#100c18] px-6 py-8 text-slate-100">
      <header class="mb-6 text-center">
        <h1 class="font-serif text-3xl tracking-[0.3em] text-orange-50">WORD BATTLER</h1>
        <p class="mt-2 text-violet-300">Phase: ${state.phase.replaceAll("_", " ")}</p>
      </header>

      <!-- Fighter Arenas -->
      <section class="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2 mb-6">
        <div class="rounded-xl border-2 border-orange-400 bg-violet-950/80 p-4">
          <h2 class="font-serif text-2xl text-orange-50">${player.name} (You)</h2>
          <p class="text-sm text-slate-300">HP: ${player.currentHp} / ${player.stats.hp}</p>
          <p class="text-sm text-sky-300">Shield: ${player.shield || 0}</p>
        </div>
        <div class="rounded-xl border-2 border-sky-400 bg-violet-950/80 p-4">
          <h2 class="font-serif text-2xl text-orange-50">${enemy.name} (Rival)</h2>
          <p class="text-sm text-slate-300">HP: ${enemy.currentHp} / ${enemy.stats.hp}</p>
          <p class="text-sm text-sky-300">Shield: ${enemy.shield || 0}</p>
        </div>
      </section>

      <!-- Word Selector Pools (Verbs, Nouns, Adjectives, Adverbs) -->
      <section class="mx-auto max-w-3xl space-y-4">
        <div>
          <h3 class="text-sm uppercase tracking-wide text-red-300 mb-1">Verbs (Actions)</h3>
          <div class="flex flex-wrap gap-2" id(pool-verbs)>
            ${renderWordPool(ctx.words.verbs || [])}
          </div>
        </div>
        <div>
          <h3 class="text-sm uppercase tracking-wide text-sky-300 mb-1">Nouns (Things)</h3>
          <div class="flex flex-wrap gap-2">
            ${renderWordPool(ctx.words.nouns || [])}
          </div>
        </div>
      </section>

      <!-- Submit & Sentence Builder Preview -->
      <section class="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-4">
        <p class="font-serif text-2xl text-amber-200">Sentence: <span id="sentence-preview">---</span></p>
        <button
          id="submit-action"
          type="button"
          class="rounded-lg bg-violet-600 px-6 py-3 text-lg font-semibold text-violet-50 hover:bg-violet-500 transition"
        >
          ${ended ? "New Battle" : "Execute Sentence"}
        </button>
      </section>
    </main>
  `;

  // Attach event listeners for word selection
  app.querySelectorAll("[data-word-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const wordId = btn.getAttribute("data-word-id");
      const wordObj = findWordObject(wordId);
      if (wordObj) {
        // Play word audio aloud when clicked (Elementary UX feature)
        juice.speak(wordObj.word);
        juice.ding(500, 80);

        // Toggle or set selected words for sentence building
        if (ctx.selectedWords.length >= 2) {
          ctx.selectedWords = [wordObj];
        } else {
          ctx.selectedWords.push(wordObj);
        }
        updateSentencePreview();
      }
    });
  });

  // Attach action button listener
  app.querySelector("#submit-action").addEventListener("click", async () => {
    if (ended) {
      startNewBattle();
      render();
      return;
    }

    if (ctx.selectedWords.length === 0) return;

    const word1 = ctx.selectedWords.length > 1 ? ctx.selectedWords[0] : null;
    const word2 = ctx.selectedWords.length > 1 ? ctx.selectedWords[1] : ctx.selectedWords[0];

    // Submit combo to event-driven combat engine
    const { state: nextState, events } = ctx.battle.submitCombo(word1?.id, word2?.id);

    // Play event sequence (Speech, sound effects, animations) with juice.js
    await juice.playEvents(events, (evt) => {
      // Optional: update UI in real-time as each event triggers
      render();
    });

    ctx.selectedWords = [];
    render();
  });
}

function renderWordPool(wordList) {
  return wordList.map((w) => `
    <button type="button" data-word-id="${w.id}" class="rounded-lg border border-violet-700 bg-violet-950 px-3 py-2 text-slate-100 hover:bg-violet-900 transition">
      <span class="block font-semibold">${w.word}</span>
      <span class="text-xs text-violet-300 uppercase">${w.partOfSpeech}</span>
    </button>
  `).join("");
}

function findWordObject(id) {
  const all = [...(ctx.words.verbs || []), ...(ctx.words.nouns || []), ...(ctx.words.adjectives || []), ...(ctx.words.adverbs || [])];
  return all.find((w) => w.id === id);
}

function updateSentencePreview() {
  const previewEl = document.getElementById("sentence-preview");
  if (previewEl) {
    previewEl.textContent = ctx.selectedWords.map((w) => w.word).join(" ") || "---";
  }
}

// Global actions map for tab communication
ctx.actions = {
  goToBattle: () => { ctx.tab = "battle"; render(); },
  useCreature: (id) => { ctx.playerId = id; startNewBattle(); ctx.tab = "battle"; render(); }
};