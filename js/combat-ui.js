import { createBattle, PHASES } from "./combat.js";
import { renderForge } from "./js/forge-ui.js";

const app = document.getElementById("app");
const tabButtons = document.querySelectorAll("[data-tab]");

const TAB_ACTIVE = "bg-violet-600 text-violet-50";
const TAB_IDLE = "bg-violet-950 text-violet-300 hover:bg-violet-900";
const ENEMY_ID = "rimepup";

function classNames(...parts) {
  return parts.filter(Boolean).join(" ");
}

function startBattle(ctx) {
  const battle = createBattle({
    playerId: ctx.playerId,
    enemyId: ENEMY_ID,
    // These are the SAME objects the Word Forge mutates, so forged
    // words and creatures are visible to the battle without a restart.
    creatures: ctx.creatures,
    words: ctx.words,
  });
  battle.start();
  battle.beginWordChoice();
  return battle;
}

function creatureCard(title, creature) {
  const ratio = creature.maxHp === 0 ? 0 : creature.hp / creature.maxHp;
  const accent =
    creature.element === "fire" ? "border-orange-400" : "border-sky-400";
  const elementColor =
    creature.element === "fire" ? "text-orange-400" : "text-sky-400";
  const barColor = ratio > 0.35 ? "bg-emerald-500" : "bg-red-500";
  const speaks = creature.allowedElements.join(" + ");

  return `
    <article class="${classNames("rounded-xl border-2 bg-violet-950/80 p-4", accent)}">
      <p class="text-xs uppercase tracking-wide text-violet-300">${title}</p>
      <h2 class="font-serif text-3xl text-orange-50">${creature.name}</h2>
      <p class="mt-1 ${elementColor}">Element: ${creature.element}</p>
      <p class="text-sm text-slate-300">Speaks: ${speaks}</p>
      <p class="mt-3 text-slate-200">HP ${creature.hp} / ${creature.maxHp}</p>
      <div class="mt-2 h-3 w-full rounded bg-slate-700">
        <div class="h-3 rounded ${barColor}" style="width:${Math.max(0, ratio * 100)}%"></div>
      </div>
    </article>
  `;
}

function canUse(creature, word) {
  return (
    creature.allowedWordTypes.includes(word.partOfSpeech) &&
    creature.allowedElements.includes(word.element)
  );
}

function wordButton(word, selected, usable) {
  const accent =
    word.element === "fire"
      ? "border-orange-400 text-orange-300"
      : "border-sky-400 text-sky-300";
  const selectedClass = selected ? "ring-2 ring-violet-300 bg-violet-800" : "";
  const dimClass = usable ? "" : "opacity-50";
  const forgedNote = word.forge
    ? `<span class="block text-xs text-amber-300">✦ ${word.forge.parts.join(" + ")}</span>`
    : "";

  return `
    <button
      type="button"
      data-word-id="${word.id}"
      data-pos="${word.partOfSpeech}"
      title="${usable ? "" : "Your creature can't use this word's element."}"
      class="${classNames(
        "rounded-lg border-2 bg-violet-950 px-3 py-2 text-left text-slate-100",
        accent,
        selectedClass,
        dimClass
      )}"
    >
      <span class="block font-semibold">${word.word}</span>
      <span class="text-xs uppercase">${word.element}</span>
      ${forgedNote}
    </button>
  `;
}

function feedbackLines(state) {
  const lines = [];
  if (state.lastPlayerResolution) {
    const result = state.lastPlayerResolution;
    lines.push(
      result.combo.valid
        ? `You: "${result.combo.phrase}" hits for ${result.damage}.`
        : `You: "${result.combo.phrase}" fizzles. ${result.combo.reasons[0] || ""}`
    );
  }
  if (state.lastEnemyResolution) {
    const result = state.lastEnemyResolution;
    lines.push(
      result.combo.valid
        ? `Enemy: "${result.combo.phrase}" hits for ${result.damage}.`
        : `Enemy: "${result.combo.phrase}" fizzles.`
    );
  }
  if (state.phase === PHASES.BATTLE_END) {
    const winner =
      state.winner === state.player.id ? state.player.name : state.enemy.name;
    lines.push(`${winner} wins.`);
  }
  if (!lines.length) {
    lines.push("Pick an adjective and a noun, then submit your combo.");
  }
  return lines;
}

function renderBattle(ctx) {
  const { battle, words, adjective, noun } = ctx;
  const state = battle.getState();
  const ended = state.phase === PHASES.BATTLE_END;
  const phrase =
    adjective || noun
      ? `${adjective?.word || "…"} ${noun?.word || "…"}`
      : "—";
  const canSubmit = ended || (adjective && noun);
  const player = state.player;
  const playerOptions = ctx.creatures
    .filter((creature) => creature.id !== ENEMY_ID)
    .map(
      (creature) =>
        `<option value="${creature.id}" ${creature.id === ctx.playerId ? "selected" : ""}>${creature.name}${creature.forged ? " ✦" : ""}</option>`
    )
    .join("");

  app.innerHTML = `
    <main class="min-h-screen bg-[#100c18] px-6 py-8 text-slate-100">
      <header class="mb-6 text-center">
        <h1 class="font-serif text-3xl tracking-[0.3em] text-orange-50">WORD BATTLER</h1>
        <p class="mt-2 text-violet-300">${state.phase.replaceAll("_", " ")}</p>
      </header>
      <section class="mx-auto mb-4 flex max-w-3xl items-center gap-3">
        <label for="player-select" class="text-sm text-violet-300">Your creature</label>
        <select id="player-select" class="rounded-lg border border-violet-700 bg-violet-950 px-3 py-2 text-slate-100">
          ${playerOptions}
        </select>
        <span class="text-xs text-slate-400">Switching restarts the battle.</span>
      </section>
      <section class="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
        ${creatureCard("You", player)}
        ${creatureCard("Rival", state.enemy)}
      </section>
      <section class="mx-auto mt-8 max-w-3xl">
        <h3 class="mb-2 text-amber-200">Adjectives</h3>
        <div class="flex flex-wrap gap-3" data-row="adjectives">
          ${words.adjectives
            .map((word) => wordButton(word, adjective?.id === word.id, canUse(player, word)))
            .join("")}
        </div>
        <h3 class="mb-2 mt-6 text-sky-200">Nouns</h3>
        <div class="flex flex-wrap gap-3" data-row="nouns">
          ${words.nouns
            .map((word) => wordButton(word, noun?.id === word.id, canUse(player, word)))
            .join("")}
        </div>
      </section>
      <section class="mx-auto mt-8 flex max-w-3xl flex-col items-start gap-4">
        <p class="font-serif text-2xl">Combo: ${phrase}</p>
        <button
          id="submit-combo"
          type="button"
          ${canSubmit ? "" : "disabled"}
          class="rounded-lg bg-violet-600 px-6 py-3 text-lg text-violet-50 disabled:bg-slate-600"
        >
          ${ended ? "New Battle" : "Submit Combo"}
        </button>
      </section>
      <section class="mx-auto mt-6 max-w-3xl">
        <h3 class="text-sm uppercase tracking-wide text-violet-300">Turn feedback</h3>
        ${feedbackLines(state)
          .map((line) => `<p class="mt-1 text-slate-200">${line}</p>`)
          .join("")}
      </section>
    </main>
  `;

  app.querySelector("#player-select").addEventListener("change", (event) => {
    ctx.playerId = event.target.value;
    ctx.battle = startBattle(ctx);
    ctx.adjective = null;
    ctx.noun = null;
    render(ctx);
  });

  app.querySelectorAll("[data-word-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-word-id");
      const pos = button.getAttribute("data-pos");
      const pool = pos === "adjective" ? words.adjectives : words.nouns;
      const word = pool.find((entry) => entry.id === id);
      if (pos === "adjective") {
        ctx.adjective = word;
      } else {
        ctx.noun = word;
      }
      render(ctx);
    });
  });

  app.querySelector("#submit-combo").addEventListener("click", () => {
    if (ended) {
      ctx.battle = startBattle(ctx);
      ctx.adjective = null;
      ctx.noun = null;
      render(ctx);
      return;
    }
    if (!ctx.adjective || !ctx.noun) {
      return;
    }
    const next = ctx.battle.submitCombo(ctx.adjective.id, ctx.noun.id);
    if (next.phase !== PHASES.BATTLE_END) {
      ctx.battle.beginWordChoice();
    }
    ctx.adjective = null;
    ctx.noun = null;
    render(ctx);
  });
}

function render(ctx) {
  tabButtons.forEach((button) => {
    const active = button.getAttribute("data-tab") === ctx.tab;
    button.className = classNames(
      "rounded-lg px-5 py-2 text-sm font-semibold tracking-wide",
      active ? TAB_ACTIVE : TAB_IDLE
    );
  });

  if (ctx.tab === "forge") {
    renderForge(app, ctx, ctx.actions);
  } else {
    renderBattle(ctx);
  }
}

const [creaturesFile, words] = await Promise.all([
  fetch("./creatures.json").then((response) => response.json()),
  fetch("./words.json").then((response) => response.json()),
]);

const ctx = {
  creatures: creaturesFile.creatures,
  words,
  playerId: "emberfox",
  battle: null,
  adjective: null,
  noun: null,
  tab: "battle",
  actions: null,
};

ctx.battle = startBattle(ctx);
ctx.actions = {
  goToBattle() {
    ctx.tab = "battle";
    render(ctx);
  },
  useCreature(id) {
    ctx.playerId = id;
    ctx.battle = startBattle(ctx);
    ctx.adjective = null;
    ctx.noun = null;
    ctx.tab = "battle";
    render(ctx);
  },
};

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    ctx.tab = button.getAttribute("data-tab");
    render(ctx);
  });
});

render(ctx);
