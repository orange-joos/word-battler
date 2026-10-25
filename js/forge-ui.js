/**
 * Word Forge UI — Interactive Morphology Laboratory (Layer 2)
 * Vanilla JavaScript ES6 Module styled with Tailwind CSS.
 *
 * Renders:
 * - Two selection slots for word, affix, or creature cards
 * - A 'Forge' fusion button triggering checkFusion() from js/forge.js
 * - Visual success & failure feedback cards with linguistic educational explanations
 * - Attaches and exports renderForge globally to window.renderForge
 *
 * @module forge-ui
 */

import { checkFusion, createForge, addForgedWord, addForgedCreature } from './forge.js';

const ELEMENT_STYLES = {
  fire: { border: 'border-orange-500', text: 'text-orange-300', bg: 'bg-orange-950/40' },
  ice: { border: 'border-sky-500', text: 'text-sky-300', bg: 'bg-sky-950/40' },
};
const DEFAULT_STYLE = { border: 'border-violet-600', text: 'text-violet-300', bg: 'bg-violet-950/40' };

const esc = (str) =>
  String(str || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);

/**
 * Render the Word Forge interface into a target container.
 *
 * @param {HTMLElement} container - DOM container element
 * @param {Object} ctx - Game context containing { creatures, words, ... }
 * @param {Object} [actions] - Action callbacks such as { goToBattle, useCreature }
 */
export function renderForge(container, ctx, actions = {}) {
  if (!ctx.forgeState) {
    ctx.forgeState = {
      slot1: null,
      slot2: null,
      activeBin: 'words',
      searchQuery: '',
      lastOutcome: null,
      notice: null,
    };
  }

  const state = ctx.forgeState;
  const forge = createForge({ creatures: ctx.creatures, words: ctx.words });

  const allWords = [
    ...(ctx.words.adjectives || []),
    ...(ctx.words.nouns || []),
    ...(ctx.words.verbs || []),
    ...(ctx.words.adverbs || []),
  ];

  function describeToken(token) {
    if (!token) return null;
    if (token.kind === 'word') {
      const w = allWords.find((item) => item.id === token.id);
      return w ? { title: w.word, sub: `${w.partOfSpeech} · ${w.element}`, element: w.element, isForged: Boolean(w.forge) } : null;
    }
    if (token.kind === 'affix') {
      const a = forge.listAffixes().find((item) => item.id === token.id);
      return a ? { title: a.type === 'prefix' ? `${a.text}-` : `-${a.text}`, sub: `${a.type} · ${a.gloss}`, element: null, isForged: false } : null;
    }
    if (token.kind === 'creature') {
      const c = ctx.creatures.find((item) => item.id === token.id);
      return c ? { title: c.name, sub: `creature · ${c.element}`, element: c.element, isForged: Boolean(c.forged) } : null;
    }
    return null;
  }

  const slot1Desc = describeToken(state.slot1);
  const slot2Desc = describeToken(state.slot2);

  // Filter inventory
  const filteredWords = allWords.filter(
    (w) => !state.searchQuery || w.word.toLowerCase().includes(state.searchQuery.toLowerCase())
  );
  const filteredAffixes = forge.listAffixes().filter(
    (a) => !state.searchQuery || a.text.toLowerCase().includes(state.searchQuery.toLowerCase()) || a.gloss.toLowerCase().includes(state.searchQuery.toLowerCase())
  );
  const filteredCreatures = ctx.creatures.filter(
    (c) => !state.searchQuery || c.name.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  container.innerHTML = `
    <main class="min-h-screen bg-[#100c18] px-4 py-8 text-slate-100 font-sans">
      <div class="mx-auto max-w-4xl space-y-6">
        <!-- Header -->
        <header class="text-center space-y-2">
          <div class="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-950/20 px-3 py-1 text-xs font-semibold text-amber-300">
            ✦ Layer 2: Morphology &amp; Word Relationships
          </div>
          <h1 class="font-serif text-3xl sm:text-4xl font-bold tracking-[0.25em] text-orange-50">
            THE WORD FORGE
          </h1>
          <p class="mx-auto max-w-xl text-xs sm:text-sm text-violet-300">
            Select two linguistic tokens and tap Forge to coin brand new words or fuse elemental hybrid creatures!
          </p>
        </header>

        <!-- Feedback Notice Banner -->
        ${state.notice ? `
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border-2 border-emerald-500 bg-emerald-950/60 p-4 shadow-xl">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🎉</span>
              <div>
                <p class="font-bold text-emerald-100">Fusion Committed!</p>
                <p class="text-xs text-emerald-200">${esc(state.notice.text)}</p>
              </div>
            </div>
            ${actions.goToBattle ? `
              <button id="forge-btn-battle" type="button" class="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 transition shadow">
                Go to Battle ⚔️
              </button>
            ` : ''}
          </div>
        ` : ''}

        <!-- Forge Slots & Fusion Button Card -->
        <section class="rounded-2xl border-2 border-violet-800 bg-gradient-to-b from-violet-950/90 to-[#171025] p-5 sm:p-6 shadow-2xl">
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <!-- Slot 1 -->
            <div class="flex min-h-[110px] flex-1 flex-col justify-between rounded-xl border-2 p-4 transition-all ${
              state.slot1 ? 'border-amber-400 bg-violet-900/60 shadow-lg' : 'border-dashed border-violet-700 bg-violet-950/40'
            }">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-violet-300 block">
                  Slot 1 (Modifier / Prefix)
                </span>
                <p class="font-serif text-xl sm:text-2xl font-bold text-orange-50 mt-1 capitalize">
                  ${slot1Desc ? esc(slot1Desc.title) : '<span class="text-slate-500 font-sans text-base">Select token below</span>'}
                </p>
                ${slot1Desc ? `<span class="text-xs text-amber-200 capitalize">${esc(slot1Desc.sub)}</span>` : ''}
              </div>
              ${state.slot1 ? `
                <button type="button" data-clear="slot1" class="mt-2 text-xs text-rose-300 hover:text-rose-100 underline self-start cursor-pointer">
                  Clear Slot
                </button>
              ` : ''}
            </div>

            <!-- Swap Button -->
            <button type="button" id="forge-btn-swap" title="Swap Slots" class="flex h-10 w-10 items-center justify-center rounded-full bg-violet-800 text-violet-100 hover:bg-violet-700 transition self-center shadow-md active:scale-95 cursor-pointer">
              ⇄
            </button>

            <!-- Slot 2 -->
            <div class="flex min-h-[110px] flex-1 flex-col justify-between rounded-xl border-2 p-4 transition-all ${
              state.slot2 ? 'border-sky-400 bg-violet-900/60 shadow-lg' : 'border-dashed border-violet-700 bg-violet-950/40'
            }">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-violet-300 block">
                  Slot 2 (Head / Base Word / Creature)
                </span>
                <p class="font-serif text-xl sm:text-2xl font-bold text-orange-50 mt-1 capitalize">
                  ${slot2Desc ? esc(slot2Desc.title) : '<span class="text-slate-500 font-sans text-base">Select token below</span>'}
                </p>
                ${slot2Desc ? `<span class="text-xs text-sky-200 capitalize">${esc(slot2Desc.sub)}</span>` : ''}
              </div>
              ${state.slot2 ? `
                <button type="button" data-clear="slot2" class="mt-2 text-xs text-rose-300 hover:text-rose-100 underline self-start cursor-pointer">
                  Clear Slot
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Fusion Trigger Button -->
          <div class="mt-6 flex justify-center">
            <button
              type="button"
              id="forge-btn-fuse"
              ${state.slot1 && state.slot2 ? '' : 'disabled'}
              class="flex items-center gap-2 rounded-xl px-8 py-3 text-base sm:text-lg font-bold transition-all shadow-xl ${
                state.slot1 && state.slot2
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-violet-950 hover:from-amber-400 hover:to-orange-400 ring-2 ring-amber-300 cursor-pointer active:scale-95'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
              }"
            >
              <span>🔥 Forge Fusion</span>
            </button>
          </div>

          <!-- Visual Outcome Feedback Cards -->
          <div class="mt-6 border-t border-violet-800/80 pt-4">
            ${renderOutcomeCard(state.lastOutcome)}
          </div>
        </section>

        <!-- Inventory Bins & Search -->
        <section className="rounded-2xl border border-violet-900 bg-violet-950/30 p-5 space-y-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-violet-800/60 pb-3">
            <!-- Bin Tabs -->
            <div class="flex gap-2">
              <button type="button" data-bin="words" class="rounded-lg px-4 py-1.5 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                state.activeBin === 'words' ? 'bg-violet-600 text-white shadow' : 'bg-violet-950 text-violet-300 hover:bg-violet-900'
              }">
                Words (${allWords.length})
              </button>
              <button type="button" data-bin="affixes" class="rounded-lg px-4 py-1.5 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                state.activeBin === 'affixes' ? 'bg-violet-600 text-white shadow' : 'bg-violet-950 text-violet-300 hover:bg-violet-900'
              }">
                Affixes (${forge.listAffixes().length})
              </button>
              <button type="button" data-bin="creatures" class="rounded-lg px-4 py-1.5 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                state.activeBin === 'creatures' ? 'bg-violet-600 text-white shadow' : 'bg-violet-950 text-violet-300 hover:bg-violet-900'
              }">
                Creatures (${ctx.creatures.length})
              </button>
            </div>

            <!-- Search input -->
            <div class="w-full sm:w-60">
              <input
                type="text"
                id="forge-search-input"
                placeholder="Search inventory..."
                value="${esc(state.searchQuery)}"
                class="w-full rounded-lg border border-violet-800 bg-violet-950/80 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>

          <!-- Tokens Grid -->
          <div class="flex flex-wrap gap-2.5 max-h-72 overflow-y-auto pr-1">
            ${renderTokenGrid(state.activeBin, { filteredWords, filteredAffixes, filteredCreatures })}
          </div>
        </section>
      </div>
    </main>
  `;

  // Attach DOM Event Listeners
  attachForgeListeners(container, ctx, actions, rerender);

  function rerender() {
    renderForge(container, ctx, actions);
  }
}

function renderOutcomeCard(outcome) {
  if (!outcome) {
    return `
      <div class="rounded-xl border border-violet-800/60 bg-violet-950/30 p-4 text-center text-xs sm:text-sm text-slate-400">
        Select two cards into the slots and press <strong>Forge Fusion</strong> to test a morphological rule!
      </div>
    `;
  }

  if (!outcome.ok) {
    return `
      <div class="rounded-xl border-2 border-rose-500/80 bg-rose-950/40 p-4 text-slate-100 shadow-md">
        <div class="flex items-center gap-2 text-rose-300 font-bold text-sm">
          <span>⚠️</span>
          <h4>Fusion Failed:</h4>
        </div>
        <div class="mt-2 space-y-1">
          ${outcome.reasons.map((r) => `<p class="text-xs sm:text-sm text-rose-200 leading-snug">• ${esc(r)}</p>`).join('')}
        </div>
        <p class="mt-3 text-[11px] text-slate-300 italic">
          Tip: Affixes need a base word, adjectives describe nouns, and creature heads belong in the second slot!
        </p>
      </div>
    `;
  }

  const res = outcome.result;
  const isCreature = outcome.kind === 'creature-fusion';
  const name = res.word || res.name;
  const elementStyle = ELEMENT_STYLES[res.element] || DEFAULT_STYLE;

  return `
    <div class="rounded-xl border-2 border-amber-400 bg-violet-950/90 p-5 shadow-xl text-slate-100">
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
          ✨ Successful Fusion: ${esc(outcome.kind.toUpperCase())}
        </span>
        <span class="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase border ${elementStyle.border} ${elementStyle.text}">
          ${esc(res.element)} ${res.element === 'fire' ? '🔥' : '❄️'}
        </span>
      </div>

      <h3 class="font-serif text-2xl sm:text-3xl font-bold text-orange-50 mt-1 capitalize">
        ${esc(name)}
      </h3>

      <p class="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
        ${esc(outcome.lesson)}
      </p>

      <div class="mt-3 text-xs text-violet-300 italic">
        Definition: "${esc(res.definition || res.description)}"
      </div>

      <div class="mt-4 flex justify-end">
        <button
          type="button"
          id="forge-btn-commit"
          class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 font-bold text-white hover:from-emerald-400 hover:to-teal-400 transition shadow-lg cursor-pointer active:scale-95"
        >
          <span>✦ Keep &amp; Add to Catalog</span>
        </button>
      </div>
    </div>
  `;
}

function renderTokenGrid(bin, data) {
  if (bin === 'words') {
    return data.filteredWords
      .map((w) => {
        const isFire = w.element === 'fire';
        return `
          <button
            type="button"
            data-token-kind="word"
            data-token-id="${esc(w.id)}"
            class="rounded-xl border-2 bg-violet-950 px-3.5 py-2 text-left transition hover:bg-violet-900 cursor-pointer ${
              isFire ? 'border-orange-500/70 text-orange-200' : 'border-sky-500/70 text-sky-200'
            }"
          >
            <span class="block text-sm font-semibold text-slate-100">${esc(w.word)}</span>
            <span class="text-[11px] uppercase tracking-wider text-violet-300">
              ${esc(w.partOfSpeech)} · ${esc(w.element)}
            </span>
            ${w.forge ? '<span class="block text-[10px] text-amber-300">✦ Forged</span>' : ''}
          </button>
        `;
      })
      .join('');
  }

  if (bin === 'affixes') {
    return data.filteredAffixes
      .map((a) => `
        <button
          type="button"
          data-token-kind="affix"
          data-token-id="${esc(a.id)}"
          class="rounded-xl border-2 border-violet-500/70 bg-violet-950 px-3.5 py-2 text-left text-slate-100 transition hover:bg-violet-900 cursor-pointer"
        >
          <span class="block text-sm font-semibold text-amber-200">
            ${esc(a.type === 'prefix' ? `${a.text}-` : `-${a.text}`)}
          </span>
          <span class="text-[11px] text-violet-300 uppercase">
            ${esc(a.type)} · ${esc(a.gloss)}
          </span>
        </button>
      `)
      .join('');
  }

  if (bin === 'creatures') {
    return data.filteredCreatures
      .map((c) => {
        const isFire = c.element === 'fire';
        return `
          <button
            type="button"
            data-token-kind="creature"
            data-token-id="${esc(c.id)}"
            class="rounded-xl border-2 bg-violet-950 px-3.5 py-2 text-left transition hover:bg-violet-900 cursor-pointer ${
              isFire ? 'border-orange-500/70 text-orange-200' : 'border-sky-500/70 text-sky-200'
            }"
          >
            <span class="block text-sm font-semibold text-slate-100">${esc(c.name)}</span>
            <span class="text-[11px] uppercase tracking-wider text-violet-300">
              ${esc(c.element)} · HP ${c.stats.hp}
            </span>
            ${c.forged ? '<span class="block text-[10px] text-amber-300">✦ Hybrid Pet</span>' : ''}
          </button>
        `;
      })
      .join('');
  }

  return '';
}

function attachForgeListeners(container, ctx, actions, rerender) {
  const state = ctx.forgeState;

  // Clear slots
  container.querySelectorAll('[data-clear]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = btn.getAttribute('data-clear');
      state[target] = null;
      state.lastOutcome = null;
      rerender();
    });
  });

  // Swap slots
  container.querySelector('#forge-btn-swap')?.addEventListener('click', () => {
    const temp = state.slot1;
    state.slot1 = state.slot2;
    state.slot2 = temp;
    state.lastOutcome = null;
    rerender();
  });

  // Bin tabs
  container.querySelectorAll('[data-bin]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeBin = btn.getAttribute('data-bin');
      rerender();
    });
  });

  // Search input
  const searchInput = container.querySelector('#forge-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      rerender();
      // Restore focus after rerender
      const freshInput = container.querySelector('#forge-search-input');
      if (freshInput) {
        freshInput.focus();
        freshInput.setSelectionRange(freshInput.value.length, freshInput.value.length);
      }
    });
  }

  // Token selection
  container.querySelectorAll('[data-token-kind]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const token = {
        kind: btn.getAttribute('data-token-kind'),
        id: btn.getAttribute('data-token-id'),
      };
      state.notice = null;

      if (!state.slot1) {
        state.slot1 = token;
      } else if (!state.slot2) {
        state.slot2 = token;
      } else {
        state.slot2 = token;
      }
      state.lastOutcome = null;
      rerender();
    });
  });

  // Fuse button
  container.querySelector('#forge-btn-fuse')?.addEventListener('click', () => {
    if (!state.slot1 || !state.slot2) return;
    const outcome = checkFusion(state.slot1, state.slot2, {
      creatures: ctx.creatures,
      words: ctx.words,
    });
    state.lastOutcome = outcome;
    rerender();
  });

  // Commit result
  container.querySelector('#forge-btn-commit')?.addEventListener('click', () => {
    if (!state.lastOutcome || !state.lastOutcome.ok || !state.lastOutcome.result) return;

    const outcome = state.lastOutcome;
    if (outcome.kind === 'creature-fusion') {
      ctx.creatures = addForgedCreature(ctx.creatures, outcome.result);
      state.notice = {
        kind: 'creature',
        text: `${outcome.result.name} joined your creature roster!`,
        id: outcome.result.id,
      };
    } else {
      ctx.words = addForgedWord(ctx.words, outcome.result);
      state.notice = {
        kind: 'word',
        text: `"${outcome.result.word}" added to your vocabulary catalog!`,
        id: outcome.result.id,
      };
    }

    state.slot1 = null;
    state.slot2 = null;
    state.lastOutcome = null;
    rerender();
  });

  // Quick navigation to battle
  container.querySelector('#forge-btn-battle')?.addEventListener('click', () => {
    if (actions.goToBattle) {
      actions.goToBattle();
    }
  });
}

// Export and attach globally to window.renderForge
if (typeof window !== 'undefined') {
  window.renderForge = renderForge;
}

export default renderForge;
