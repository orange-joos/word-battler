/**
 * Word Forge UI Component (Layer 2 - Word Relationships)
 * Renders slots, inventories, feedback, and commit actions.
 */

import { createForge } from "./forge.js";
import { juice } from "./js/juice.js";

const ELEMENT_STYLES = {
  fire: { border: "border-orange-400", text: "text-orange-300" },
  ice: { border: "border-sky-400", text: "text-sky-300" },
};
const NEUTRAL_STYLE = { border: "border-violet-500", text: "text-violet-300" };

const BINS = [
  { id: "words", label: "Words" },
  { id: "affixes", label: "Affixes" },
  { id: "creatures", label: "Creatures" },
];

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

const cx = (...parts) => parts.filter(Boolean).join(" ");
const styleFor = (element) => ELEMENT_STYLES[element] || NEUTRAL_STYLE;

export function renderForge(container, ctx, actions) {
  // Ensure forge state exists
  if (!ctx.forgeState) {
    ctx.forgeState = { left: null, right: null, bin: "words", notice: null };
  }
  const state = ctx.forgeState;
  const forge = createForge({ creatures: ctx.creatures, words: ctx.words });
  const rerender = () => renderForge(container, ctx, actions);

  const poolWords = [...ctx.words.adjectives, ...ctx.words.nouns, ...(ctx.words.verbs || []), ...(ctx.words.adverbs || [])];

  function describeToken(token) {
    if (!token) return null;
    if (token.kind === "word") {
      const word = poolWords.find((e) => e.id === token.id);
      return word && { title: word.word, sub: word.partOfSpeech, element: word.element, forged: Boolean(word.forge) };
    }
    if (token.kind === "affix") {
      const affix = forge.listAffixes().find((e) => e.id === token.id);
      return affix && { title: affix.type === "prefix" ? `${affix.text}-` : `-${affix.text}`, sub: `${affix.type} · ${affix.gloss}`, element: null };
    }
    if (token.kind === "creature") {
      const creature = ctx.creatures.find((e) => e.id === token.id);
      return creature && { title: creature.name, sub: "creature", element: creature.element, forged: Boolean(creature.forged) };
    }
    return null;
  }

  const leftDesc = describeToken(state.left);
  const rightDesc = describeToken(state.right);
  const outcome = state.left && state.right ? forge.fuse(state.left, state.right) : null;

  container.innerHTML = `
    <main class="min-h-screen bg-[#100c18] px-6 py-8 text-slate-100">
      <header class="mb-6 text-center">
        <h1 class="font-serif text-3xl tracking-[0.3em] text-orange-50">WORD FORGE</h1>
        <p class="mt-2 text-violet-300">Combine affixes, words, and creatures using real English rules.</p>
      </header>

      <div class="mx-auto max-w-3xl">
        ${state.notice ? `
          <div class="mb-6 flex items-center justify-between rounded-xl border border-emerald-400 bg-emerald-950/40 p-4">
            <p class="text-emerald-100">✦ Forged! ${esc(state.notice.text)}</p>
            <button id="go-battle" class="rounded-lg bg-violet-700 px-4 py-2 text-violet-50">Go to Battle</button>
          </div>
        ` : ""}

        <!-- Slots Section -->
        <section class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div class="flex min-h-[96px] flex-1 flex-col rounded-xl border-2 ${state.left ? 'border-violet-400 bg-violet-950/80' : 'border-dashed border-violet-700'} p-3">
            <span class="text-xs uppercase tracking-wide text-violet-300">First Slot</span>
            <span class="font-serif text-xl text-orange-50">${leftDesc ? esc(leftDesc.title) : 'Select modifier / prefix'}</span>
            ${state.left ? `<button type="button" data-clear="left" class="mt-2 text-xs text-violet-300 underline self-start">Clear</button>` : ''}
          </div>

          <button type="button" id="swap-slots" class="rounded-full bg-violet-900 p-3 text-violet-100 self-center">⇄</button>

          <div class="flex min-h-[96px] flex-1 flex-col rounded-xl border-2 ${state.right ? 'border-violet-400 bg-violet-950/80' : 'border-dashed border-violet-700'} p-3">
            <span class="text-xs uppercase tracking-wide text-violet-300">Second Slot</span>
            <span class="font-serif text-xl text-orange-50">${rightDesc ? esc(rightDesc.title) : 'Select base word / creature'}</span>
            ${state.right ? `<button type="button" data-clear="right" class="mt-2 text-xs text-violet-300 underline self-start">Clear</button>` : ''}
          </div>
        </section>

        <!-- Preview / Result Panel -->
        <section class="mt-6">
          ${renderPreview(outcome, state, ctx)}
        </section>

        <!-- Inventory Bins -->
        <section class="mt-8">
          <div class="flex gap-2 mb-4">
            ${BINS.map((b) => `
              <button type="button" data-bin="${b.id}" class="rounded-lg px-4 py-2 text-sm ${state.bin === b.id ? 'bg-violet-600 text-violet-50' : 'bg-violet-950 text-violet-300'}">
                ${b.label}
              </button>
            `).join("")}
          </div>
          <div class="flex flex-wrap gap-2">
            ${renderInventoryItems(ctx, forge, state.bin, describeToken)}
          </div>
        </section>
      </div>
    </main>
  `;

  // Wire Event Listeners
  container.querySelectorAll("[data-token-kind]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const token = { kind: btn.getAttribute("data-token-kind"), id: btn.getAttribute("data-token-id") };
      state.notice = null;
      if (!state.left) state.left = token;
      else state.right = token;
      juice.ding(550, 80);
      rerender();
    });
  });

  container.querySelectorAll("[data-clear]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state[btn.getAttribute("data-clear")] = null;
      rerender();
    });
  });

  container.querySelectorAll("[data-bin]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.bin = btn.getAttribute("data-bin");
      rerender();
    });
  });

  container.querySelector("#swap-slots")?.addEventListener("click", () => {
    [state.left, state.right] = [state.right, state.left];
    rerender();
  });

  container.querySelector("#commit-forge")?.addEventListener("click", () => {
    if (outcome && outcome.ok) {
      if (outcome.kind === "creature-fusion") {
        ctx.creatures.push(outcome.result);
        state.notice = { kind: "creature", text: `${outcome.result.name} joined your roster!` };
      } else {
        const bucket = outcome.result.partOfSpeech === "adjective" ? "adjectives" : "nouns";
        if (ctx.words[bucket]) ctx.words[bucket].push(outcome.result);
        state.notice = { kind: "word", text: `"${outcome.result.word}" added to battle pool!` };
      }
      state.left = null;
      state.right = null;
      juice.fanfare();
      rerender();
    }
  });

  container.querySelector("#go-battle")?.addEventListener("click", () => actions.goToBattle());
}

function renderPreview(outcome, state, ctx) {
  if (!outcome) {
    return `<div class="rounded-xl border border-violet-800 bg-violet-950/40 p-4 text-center text-slate-400">Pick two items to test a linguistic fusion.</div>`;
  }
  if (!outcome.ok) {
    return `
      <div class="rounded-xl border border-red-500 bg-red-950/40 p-4">
        <h4 class="font-semibold text-red-200">Fusion Failed:</h4>
        ${outcome.reasons.map((r) => `<p class="mt-1 text-sm text-slate-200">${esc(r)}</p>`).join("")}
      </div>
    `;
  }
  return `
    <div class="rounded-xl border border-amber-400 bg-violet-950/80 p-4">
      <span class="text-xs uppercase tracking-wide text-amber-300">Successful Fusion!</span>
      <h3 class="font-serif text-2xl text-orange-50 mt-1">${esc(outcome.result.word || outcome.result.name)}</h3>
      <p class="text-sm text-slate-300 mt-2">${esc(outcome.lesson)}</p>
      <button id="commit-forge" type="button" class="mt-4 rounded-lg bg-amber-500 px-5 py-2 font-semibold text-violet-950 hover:bg-amber-400 transition">
        Forge It!
      </button>
    </div>
  `;
}

function renderInventoryItems(ctx, forge, bin, describeToken) {
  if (bin === "affixes") {
    return forge.listAffixes().map((a) => {
      const token = { kind: "affix", id: a.id };
      const desc = describeToken(token);
      return desc ? itemButton(desc, token) : "";
    }).join("");
  }
  if (bin === "creatures") {
    return ctx.creatures.map((c) => {
      const token = { kind: "creature", id: c.id };
      const desc = describeToken(token);
      return desc ? itemButton(desc, token) : "";
    }).join("");
  }
  const words = [...ctx.words.adjectives, ...ctx.words.nouns, ...(ctx.words.verbs || [])];
  return words.map((w) => {
    const token = { kind: "word", id: w.id };
    const desc = describeToken(token);
    return desc ? itemButton(desc, token) : "";
  }).join("");
}

function itemButton(desc, token) {
  const style = styleFor(desc.element);
  return `
    <button type="button" data-token-kind="${token.kind}" data-token-id="${esc(token.id)}"
      class="rounded-lg border-2 bg-violet-950 px-3 py-2 text-left text-slate-100 hover:bg-violet-900 transition ${style.border}">
      <span class="block font-semibold">${esc(desc.title)}</span>
      <span class="text-xs uppercase ${style.text}">${esc(desc.sub)}</span>
    </button>
  `;
}