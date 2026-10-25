/**
 * Main Hub / Central Camp Screen (js/hub-ui.js)
 * Educational vocabulary pet battler web game for Grades 3–5.
 *
 * Responsibilities:
 * - Kid-friendly, colorful dashboard theme optimized for low-spec school Chromebooks.
 * - Top Bar (HUD): Player avatar, username, current currencies (Lexi-Coins, Fusion Tokens), daily streak.
 * - Central Action Area / Main Banner: Highlights the active lead pet (e.g. Emberfox) with level and element badge.
 * - Quick Navigation Grid: Big, touch-friendly navigation tiles:
 *     🗺️ World Select ('world-select')
 *     ⚔️ Battle Arena ('battle-arena')
 *     🧬 Word Forge ('word-forge')
 *     🥚 Pet Hatchery ('pet-hatchery')
 *     🛍️ The Lexi-Shop ('lexi-shop')
 *     🎒 Pet Roster ('pet-roster')
 * - Exports `renderHub(container, ctx, actions)` and attaches to `window.renderHub`.
 *
 * @module hub-ui
 */

// Escape HTML utility to avoid XSS
const esc = (str) =>
  String(str ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);

// Audio Feedback Juice for low-spec Chromebooks
function playHubTone(freq = 520, durationMs = 100, type = 'sine') {
  if (typeof window === 'undefined') return;
  if (window.ctx && window.ctx.isMuted) return;

  try {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    if (!window.__hubAudioCtx) {
      window.__hubAudioCtx = new AudioCtor();
    }
    const ac = window.__hubAudioCtx;
    if (ac.state === 'suspended') {
      ac.resume();
    }
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
    // fallback gracefully
  }
}

function speakLore(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (window.ctx && window.ctx.isMuted) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  } catch {
    // fallback
  }
}

// Elemental visual styling definitions
const ELEMENT_PALETTES = {
  fire: {
    badgeBg: 'bg-orange-500 text-white border-orange-300',
    bannerGradient: 'from-orange-500/20 via-amber-500/15 to-rose-500/20 border-orange-400',
    auraGlow: 'bg-orange-400/30',
    icon: '🔥',
    label: 'FIRE',
    quote: '"My flames burn brighter when you build clever words, Captain!"',
  },
  ice: {
    badgeBg: 'bg-sky-500 text-white border-sky-300',
    bannerGradient: 'from-sky-500/20 via-cyan-500/15 to-blue-500/20 border-sky-400',
    auraGlow: 'bg-cyan-400/30',
    icon: '❄️',
    label: 'ICE',
    quote: '"My frost sparkles with every sharp adjective you choose!"',
  },
  nature: {
    badgeBg: 'bg-emerald-500 text-white border-emerald-300',
    bannerGradient: 'from-emerald-500/20 via-lime-500/15 to-green-500/20 border-emerald-400',
    auraGlow: 'bg-emerald-400/30',
    icon: '🍃',
    label: 'NATURE',
    quote: '"Fresh vocabulary helps our nature energy flourish and grow!"',
  },
};

/**
 * Render the Main Hub / Central Camp Screen.
 *
 * @param {HTMLElement} container - Target DOM node
 * @param {Object} ctx - Global application context
 * @param {Object} [actions={}] - Action dispatchers
 */
export function renderHub(container, ctx = {}, actions = {}) {
  if (!container) return;

  // Initialize persistent default user/camp state if missing
  if (!ctx.hubState) {
    let savedCoins = 450;
    let savedTokens = 12;
    let savedStreak = 5;
    let savedAvatar = '🦊';
    let savedUsername = 'Lexi Explorer';

    try {
      const raw = localStorage.getItem('wb_player_profile');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.lexiCoins !== undefined) savedCoins = parsed.lexiCoins;
        if (parsed.fusionTokens !== undefined) savedTokens = parsed.fusionTokens;
        if (parsed.streak !== undefined) savedStreak = parsed.streak;
        if (parsed.avatar) savedAvatar = parsed.avatar;
        if (parsed.username) savedUsername = parsed.username;
      }
    } catch {
      // ignore
    }

    ctx.hubState = {
      username: ctx.player?.name || ctx.username || savedUsername,
      avatar: ctx.player?.avatar || ctx.avatar || savedAvatar,
      lexiCoins: ctx.player?.lexiCoins ?? ctx.lexiCoins ?? savedCoins,
      fusionTokens: ctx.player?.fusionTokens ?? ctx.fusionTokens ?? savedTokens,
      streak: ctx.player?.streak ?? ctx.streak ?? savedStreak,
      streakClaimedToday: false,
      activeModal: null, // 'hatchery' | 'shop' | 'world' | 'avatar' | null
    };
  }

  const hub = ctx.hubState;

  // Sync to local storage
  const saveHubProfile = () => {
    try {
      localStorage.setItem(
        'wb_player_profile',
        JSON.stringify({
          username: hub.username,
          avatar: hub.avatar,
          lexiCoins: hub.lexiCoins,
          fusionTokens: hub.fusionTokens,
          streak: hub.streak,
        })
      );
    } catch {
      // ignore
    }
  };

  // Find active lead pet
  const creaturesList = Array.isArray(ctx.creatures) && ctx.creatures.length > 0
    ? ctx.creatures
    : [
        {
          id: 'emberfox',
          name: 'Emberfox',
          element: 'fire',
          stats: { hp: 42, attack: 14, defense: 8, speed: 12 },
          description: 'A nimble fox whose coat holds living embers.',
          loadout: { verb: 'ignite', noun: 'flame', adjective: 'blazing', adverb: 'fiercely' },
        },
      ];

  const activePetId = ctx.playerId || creaturesList[0].id;
  const activePet = creaturesList.find((c) => c.id === activePetId) || creaturesList[0];
  const petElement = (activePet.elementAffinity || activePet.element || 'fire').toLowerCase();
  const elementStyle = ELEMENT_PALETTES[petElement] || ELEMENT_PALETTES.fire;
  const petLevel = activePet.level || Math.floor((activePet.stats.hp + activePet.stats.attack) / 7) || 8;

  // Equipped word cards summary
  const loadout = activePet.loadout || {};
  const equippedCount = ['verb', 'noun', 'adjective', 'adverb'].filter((s) => Boolean(loadout[s])).length;

  // Pet avatar emoji mapping
  const petEmoji =
    activePet.id.includes('fox') || activePet.name.toLowerCase().includes('fox')
      ? '🦊'
      : activePet.id.includes('pup') || activePet.name.toLowerCase().includes('pup') || activePet.name.toLowerCase().includes('wolf')
      ? '🐺'
      : activePet.id.includes('dragon')
      ? '🐲'
      : activePet.id.includes('cat')
      ? '🐱'
      : activePet.element === 'ice'
      ? '❄️'
      : '🔥';

  // Available avatars for the student
  const AVATAR_OPTIONS = ['🦊', '🐺', '🦁', '🦉', '🐼', '🦖', '🦄', '⭐'];

  // Render HTML scaffolding
  container.innerHTML = `
    <div class="hub-screen min-h-screen bg-[#fff9ed] text-slate-800 font-sans pb-12 selection:bg-amber-200">
      <div class="mx-auto max-w-5xl px-3 sm:px-6 pt-3 sm:pt-6 space-y-5">
        
        <!-- ========================================== -->
        <!-- 1. TOP BAR HUD (Chromebook Optimized)       -->
        <!-- ========================================== -->
        <header class="rounded-3xl border-4 border-[#7b4632] bg-gradient-to-r from-[#ffeacc] via-[#fff4e0] to-[#ffeacc] p-3 sm:p-4 shadow-[0_6px_0_#7b4632]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            
            <!-- Player Profile & Avatar Pill -->
            <div class="flex items-center gap-3">
              <button
                type="button"
                id="hub-avatar-btn"
                title="Change Avatar"
                class="group relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border-4 border-[#7b4632] bg-gradient-to-b from-amber-300 to-amber-500 text-3xl sm:text-4xl shadow-[0_4px_0_#7b4632] transition hover:scale-105 active:translate-y-1 active:shadow-none cursor-pointer"
              >
                <span>${esc(hub.avatar)}</span>
                <span class="absolute -bottom-1 -right-1 rounded-full bg-violet-600 px-1.5 py-0.2 text-[9px] font-black uppercase text-white shadow">
                  Edit
                </span>
              </button>
              
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="font-serif text-lg sm:text-2xl font-black tracking-wide text-[#542d1d]">
                    ${esc(hub.username)}
                  </h2>
                  <span class="rounded-full border-2 border-[#7b4632] bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#542d1d]">
                    Grades 3–5
                  </span>
                </div>
                <div class="flex items-center gap-2 text-xs font-bold text-[#86563c]">
                  <span>🏆 Rank: Lexi-Champion</span>
                  <span class="text-amber-600">•</span>
                  <span>Pet Team: ${creaturesList.length}</span>
                </div>
              </div>
            </div>

            <!-- Currencies & Daily Streak HUD Chips -->
            <div class="flex flex-wrap items-center gap-2 sm:gap-3">
              
              <!-- Lexi-Coins Chip -->
              <div
                id="hub-coins-chip"
                title="Lexi-Coins: Earned by solving vocabulary battles"
                class="flex items-center gap-2 rounded-2xl border-3 border-[#c2782b] bg-amber-100/90 px-3 py-1.5 shadow-[0_3px_0_#c2782b] transition hover:scale-102 cursor-pointer"
              >
                <span class="text-xl sm:text-2xl">🪙</span>
                <div>
                  <span class="block text-[9px] font-black uppercase tracking-wider text-[#824c16]">Lexi-Coins</span>
                  <span class="font-serif text-base sm:text-lg font-black text-[#5e3209]">${hub.lexiCoins}</span>
                </div>
              </div>

              <!-- Fusion Tokens Chip -->
              <div
                id="hub-tokens-chip"
                title="Fusion Tokens: Used in the Word Forge for high-level morphology"
                class="flex items-center gap-2 rounded-2xl border-3 border-[#7343b3] bg-purple-100/90 px-3 py-1.5 shadow-[0_3px_0_#7343b3] transition hover:scale-102 cursor-pointer"
              >
                <span class="text-xl sm:text-2xl">🧬</span>
                <div>
                  <span class="block text-[9px] font-black uppercase tracking-wider text-[#542b8a]">Fusion Tokens</span>
                  <span class="font-serif text-base sm:text-lg font-black text-[#431d77]">${hub.fusionTokens}</span>
                </div>
              </div>

              <!-- Daily Login Streak Counter -->
              <button
                type="button"
                id="hub-streak-btn"
                title="Daily Login Streak! Click to claim daily reward"
                class="flex items-center gap-2 rounded-2xl border-3 border-[#b93815] bg-gradient-to-r from-orange-400 to-red-400 px-3 py-1.5 text-white shadow-[0_3px_0_#b93815] transition hover:scale-105 active:translate-y-1 active:shadow-none cursor-pointer"
              >
                <span class="text-xl sm:text-2xl animate-bounce">🔥</span>
                <div class="text-left">
                  <span class="block text-[9px] font-black uppercase tracking-wider text-orange-100">
                    ${hub.streakClaimedToday ? 'Streak Active' : 'Claim Daily!'}
                  </span>
                  <span class="font-serif text-base sm:text-lg font-black">${hub.streak} Days</span>
                </div>
              </button>

            </div>
          </div>
        </header>

        <!-- ======================================================== -->
        <!-- 2. CENTRAL ACTION AREA / MAIN LEAD PET BANNER            -->
        <!-- ======================================================== -->
        <section class="relative overflow-hidden rounded-3xl border-4 border-[#7b4632] bg-gradient-to-b from-[#bfe8ff] via-[#d6f5ff] to-[#aee477] p-5 sm:p-7 shadow-[0_8px_0_#7b4632]">
          
          <!-- Background Decor Elements -->
          <div class="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full bg-yellow-200/50 blur-xl"></div>
          <div class="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#6bb846] to-transparent opacity-80"></div>

          <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            
            <!-- Lead Pet Sprite & Elemental Showcase -->
            <div class="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              
              <!-- Pet Sprite Stage -->
              <div class="relative flex h-32 w-32 sm:h-36 sm:w-36 items-center justify-center">
                <!-- Glowing element aura -->
                <div class="absolute inset-0 rounded-full ${elementStyle.auraGlow} blur-lg animate-pulse"></div>
                <!-- Grassy pedestal platform -->
                <div class="absolute bottom-1 h-8 w-28 rounded-full border-3 border-[#4d862d] bg-[#5da637] shadow-[0_3px_0_#38641e]"></div>
                <!-- Pet emoji -->
                <span class="relative z-10 text-6xl sm:text-7xl drop-shadow-[0_8px_4px_rgba(0,0,0,0.25)] select-none animate-[bounce_3s_ease-in-out_infinite]">
                  ${petEmoji}
                </span>
                <span class="absolute top-0 right-0 rounded-full bg-white/90 p-1 text-lg shadow border border-amber-300">
                  ${elementStyle.icon}
                </span>
              </div>

              <!-- Pet Details & Lore Dialogue -->
              <div class="space-y-2">
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span class="rounded-full border-2 border-[#7b4632] ${elementStyle.badgeBg} px-3 py-0.5 text-xs font-black uppercase tracking-wider shadow">
                    ${elementStyle.icon} ${elementStyle.label} TYPE
                  </span>
                  <span class="rounded-full border-2 border-[#7b4632] bg-amber-300 px-3 py-0.5 text-xs font-black text-[#542d1d] shadow">
                    ⭐ Level ${petLevel}
                  </span>
                  ${activePet.forged ? '<span class="rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">✦ Hybrid</span>' : ''}
                </div>

                <div class="flex items-center justify-center sm:justify-start gap-2">
                  <h1 class="font-serif text-3xl sm:text-4xl font-black tracking-tight text-[#48281b]">
                    ${esc(activePet.name)}
                  </h1>
                  <button
                    type="button"
                    id="hub-speak-pet"
                    title="Pronounce Pet Lore"
                    class="rounded-xl border-2 border-[#7b4632] bg-white/80 p-1.5 text-base text-[#7b4632] hover:bg-white shadow transition cursor-pointer"
                  >
                    🔊
                  </button>
                </div>

                <!-- Pet Speech / Dialogue Bubble -->
                <div class="relative max-w-md rounded-2xl border-3 border-[#7b4632] bg-white/95 p-3 text-xs sm:text-sm font-bold text-[#5c3725] shadow-[0_3px_0_#7b4632]">
                  <p class="leading-snug">${elementStyle.quote}</p>
                </div>

                <!-- Loadout & Stats Chips -->
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-[11px] font-black text-[#542d1d]">
                  <span class="rounded-lg bg-white/80 px-2 py-0.5 border border-amber-300">❤️ HP: ${activePet.stats.hp}</span>
                  <span class="rounded-lg bg-white/80 px-2 py-0.5 border border-amber-300">⚔️ ATK: ${activePet.stats.attack}</span>
                  <span class="rounded-lg bg-white/80 px-2 py-0.5 border border-amber-300">🛡️ DEF: ${activePet.stats.defense}</span>
                  <span class="rounded-lg bg-emerald-100 text-emerald-900 px-2 py-0.5 border border-emerald-400">
                    🃏 Cards: ${equippedCount}/4
                  </span>
                </div>
              </div>
            </div>

            <!-- Pet Switcher & Primary Battle CTA -->
            <div class="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
              
              <!-- Quick Pet Switcher Dropdown/Buttons -->
              <div class="flex items-center gap-2 rounded-2xl border-3 border-[#7b4632] bg-white/90 p-1.5 shadow-[0_3px_0_#7b4632]">
                <label for="hub-pet-select" class="text-xs font-black uppercase text-[#7b4632] pl-2">
                  Active Pet:
                </label>
                <select
                  id="hub-pet-select"
                  class="rounded-xl border-2 border-[#7b4632] bg-amber-100 px-3 py-1 text-xs font-bold text-[#542d1d] focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  ${creaturesList
                    .map(
                      (c) => `
                    <option value="${c.id}" ${c.id === activePet.id ? 'selected' : ''}>
                      ${c.name} (${c.element.toUpperCase()})
                    </option>
                  `
                    )
                    .join('')}
                </select>
              </div>

              <!-- Primary CTA: Jump into Battle Arena -->
              <button
                type="button"
                id="hub-quick-battle-btn"
                class="group relative flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl border-4 border-[#7b4632] bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 px-6 py-3.5 text-base sm:text-lg font-black uppercase tracking-wider text-white shadow-[0_6px_0_#7b4632] transition hover:scale-103 hover:brightness-110 active:translate-y-1 active:shadow-none cursor-pointer"
              >
                <span class="text-2xl group-hover:rotate-12 transition-transform">⚔️</span>
                <span>Enter Battle Arena!</span>
              </button>

            </div>

          </div>
        </section>

        <!-- ======================================================== -->
        <!-- 3. QUICK NAVIGATION GRID (6 Chunky Touch Tiles)          -->
        <!-- ======================================================== -->
        <section class="space-y-3">
          <div class="flex items-center justify-between px-1">
            <h2 class="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#542d1d]">
              Camp Activities &amp; Portals
            </h2>
            <span class="text-xs font-extrabold uppercase text-[#96634c]">
              Tap any tile to travel
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            
            <!-- 1. World Select (Overworld Map) -->
            <button
              type="button"
              data-nav="world-select"
              class="hub-nav-tile group relative flex flex-col justify-between overflow-hidden rounded-3xl border-4 border-[#246b38] bg-gradient-to-b from-[#60cf7a] to-[#2ea84e] p-5 text-left text-white shadow-[0_6px_0_#246b38] transition hover:-translate-y-1 hover:brightness-105 active:translate-y-1 active:shadow-none cursor-pointer"
            >
              <div class="flex items-start justify-between">
                <span class="text-4xl sm:text-5xl drop-shadow group-hover:scale-110 transition-transform">🗺️</span>
                <span class="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#1c552b] shadow">
                  3 Zones
                </span>
              </div>
              <div class="mt-4">
                <h3 class="font-serif text-xl sm:text-2xl font-black tracking-wide">World Select</h3>
                <p class="text-xs font-bold text-emerald-100">Overworld map, quest chapters, and vocabulary realms.</p>
              </div>
            </button>

            <!-- 2. Battle Arena -->
            <button
              type="button"
              data-nav="battle-arena"
              class="hub-nav-tile group relative flex flex-col justify-between overflow-hidden rounded-3xl border-4 border-[#942a17] bg-gradient-to-b from-[#f25d3b] to-[#d63418] p-5 text-left text-white shadow-[0_6px_0_#942a17] transition hover:-translate-y-1 hover:brightness-105 active:translate-y-1 active:shadow-none cursor-pointer"
            >
              <div class="flex items-start justify-between">
                <span class="text-4xl sm:text-5xl drop-shadow group-hover:scale-110 transition-transform">⚔️</span>
                <span class="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#942a17] shadow">
                  Turn Combat
                </span>
              </div>
              <div class="mt-4">
                <h3 class="font-serif text-xl sm:text-2xl font-black tracking-wide">Battle Arena</h3>
                <p class="text-xs font-bold text-orange-100">4x4 Matrix action with verbs, nouns, adjectives &amp; adverbs.</p>
              </div>
            </button>

            <!-- 3. Word Forge (Fusion Workshop) -->
            <button
              type="button"
              data-nav="word-forge"
              class="hub-nav-tile group relative flex flex-col justify-between overflow-hidden rounded-3xl border-4 border-[#522588] bg-gradient-to-b from-[#8f55d4] to-[#6c31b8] p-5 text-left text-white shadow-[0_6px_0_#522588] transition hover:-translate-y-1 hover:brightness-105 active:translate-y-1 active:shadow-none cursor-pointer"
            >
              <div class="flex items-start justify-between">
                <span class="text-4xl sm:text-5xl drop-shadow group-hover:scale-110 transition-transform">🧬</span>
                <span class="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#522588] shadow">
                  ✦ Morphology
                </span>
              </div>
              <div class="mt-4">
                <h3 class="font-serif text-xl sm:text-2xl font-black tracking-wide">Word Forge</h3>
                <p class="text-xs font-bold text-purple-100">Fuse prefixes, roots, and elements to mint hybrid pets.</p>
              </div>
            </button>

            <!-- 4. Pet Hatchery (Gacha Lexi-Crates) -->
            <button
              type="button"
              data-nav="pet-hatchery"
              class="hub-nav-tile group relative flex flex-col justify-between overflow-hidden rounded-3xl border-4 border-[#b57a1b] bg-gradient-to-b from-[#ffc83b] to-[#f09c18] p-5 text-left text-white shadow-[0_6px_0_#b57a1b] transition hover:-translate-y-1 hover:brightness-105 active:translate-y-1 active:shadow-none cursor-pointer"
            >
              <div class="flex items-start justify-between">
                <span class="text-4xl sm:text-5xl drop-shadow group-hover:scale-110 transition-transform">🥚</span>
                <span class="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#8c570b] shadow">
                  Free Egg Ready!
                </span>
              </div>
              <div class="mt-4">
                <h3 class="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#452702]">Pet Hatchery</h3>
                <p class="text-xs font-bold text-[#633a08]">Hatch Lexi-Crates to discover rare elemental companions.</p>
              </div>
            </button>

            <!-- 5. The Lexi-Shop (Token Store) -->
            <button
              type="button"
              data-nav="lexi-shop"
              class="hub-nav-tile group relative flex flex-col justify-between overflow-hidden rounded-3xl border-4 border-[#1b6b88] bg-gradient-to-b from-[#38b2d6] to-[#1c83a8] p-5 text-left text-white shadow-[0_6px_0_#1b6b88] transition hover:-translate-y-1 hover:brightness-105 active:translate-y-1 active:shadow-none cursor-pointer"
            >
              <div class="flex items-start justify-between">
                <span class="text-4xl sm:text-5xl drop-shadow group-hover:scale-110 transition-transform">🛍️</span>
                <span class="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#1b6b88] shadow">
                  Daily Deals
                </span>
              </div>
              <div class="mt-4">
                <h3 class="font-serif text-xl sm:text-2xl font-black tracking-wide">The Lexi-Shop</h3>
                <p class="text-xs font-bold text-sky-100">Trade Lexi-Coins for power boosters, card packs &amp; gear.</p>
              </div>
            </button>

            <!-- 6. Pet Roster ("My Pets" & Arsenal) -->
            <button
              type="button"
              data-nav="pet-roster"
              class="hub-nav-tile group relative flex flex-col justify-between overflow-hidden rounded-3xl border-4 border-[#1b736b] bg-gradient-to-b from-[#32bcae] to-[#198b80] p-5 text-left text-white shadow-[0_6px_0_#1b736b] transition hover:-translate-y-1 hover:brightness-105 active:translate-y-1 active:shadow-none cursor-pointer"
            >
              <div class="flex items-start justify-between">
                <span class="text-4xl sm:text-5xl drop-shadow group-hover:scale-110 transition-transform">🎒</span>
                <span class="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#125a53] shadow">
                  ${creaturesList.length} Pets
                </span>
              </div>
              <div class="mt-4">
                <h3 class="font-serif text-xl sm:text-2xl font-black tracking-wide">Pet Roster</h3>
                <p class="text-xs font-bold text-teal-100">Assign word cards, equip battle slots, and inspect team.</p>
              </div>
            </button>

          </div>
        </section>

        <!-- ======================================================== -->
        <!-- 4. MODAL DIALOGS (Interactive fallbacks for Chromebooks) -->
        <!-- ======================================================== -->
        <div id="hub-modal-layer"></div>

      </div>
    </div>
  `;

  // Attach all DOM Event Handlers
  attachHubEvents(container, ctx, hub, actions, saveHubProfile, AVATAR_OPTIONS);
}

/**
 * Attach event listeners to the Hub interface
 */
function attachHubEvents(container, ctx, hub, actions, saveHubProfile, AVATAR_OPTIONS) {
  const rerender = () => renderHub(container, ctx, actions);
  const modalLayer = container.querySelector('#hub-modal-layer');

  // Speak Lore
  container.querySelector('#hub-speak-pet')?.addEventListener('click', () => {
    const activePet = (ctx.creatures || []).find((c) => c.id === ctx.playerId) || ctx.creatures?.[0];
    if (activePet) {
      speakLore(`${activePet.name}! ${activePet.description}`);
    }
  });

  // Pet Switcher dropdown
  container.querySelector('#hub-pet-select')?.addEventListener('change', (e) => {
    const newId = e.target.value;
    ctx.playerId = newId;
    playHubTone(600, 80);
    if (actions.onSelectPet) {
      actions.onSelectPet(newId);
    }
    rerender();
  });

  // Quick Battle Primary CTA
  container.querySelector('#hub-quick-battle-btn')?.addEventListener('click', () => {
    playHubTone(750, 120, 'triangle');
    if (actions.navigateTo) {
      actions.navigateTo('battle-arena');
    } else if (actions.goToBattle) {
      actions.goToBattle();
    } else if (typeof window.switchTab === 'function') {
      window.switchTab('battle');
    }
  });

  // Avatar Editor Button
  container.querySelector('#hub-avatar-btn')?.addEventListener('click', () => {
    playHubTone(500, 80);
    showAvatarPickerModal(modalLayer, hub, saveHubProfile, rerender, AVATAR_OPTIONS);
  });

  // Streak Reward Claim
  container.querySelector('#hub-streak-btn')?.addEventListener('click', () => {
    playHubTone(880, 150, 'triangle');
    showStreakModal(modalLayer, hub, saveHubProfile, rerender);
  });

  // Coins Chip Modal
  container.querySelector('#hub-coins-chip')?.addEventListener('click', () => {
    playHubTone(650, 80);
    showCurrencyModal(modalLayer, 'coins', hub, saveHubProfile, rerender);
  });

  // Tokens Chip Modal
  container.querySelector('#hub-tokens-chip')?.addEventListener('click', () => {
    playHubTone(650, 80);
    showCurrencyModal(modalLayer, 'tokens', hub, saveHubProfile, rerender);
  });

  // Quick Navigation Tiles
  container.querySelectorAll('.hub-nav-tile').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetScreen = btn.getAttribute('data-nav');
      playHubTone(620, 100);

      // Trigger user provided action callback
      if (actions.navigateTo) {
        actions.navigateTo(targetScreen);
      }

      // Handle specific routes
      if (targetScreen === 'battle-arena') {
        if (actions.goToBattle) actions.goToBattle();
        else if (typeof window.switchTab === 'function') window.switchTab('battle');
      } else if (targetScreen === 'word-forge') {
        if (actions.goToForge) actions.goToForge();
        else if (typeof window.switchTab === 'function') window.switchTab('forge');
      } else if (targetScreen === 'pet-roster') {
        if (actions.goToLoadout) actions.goToLoadout();
        else if (typeof window.switchTab === 'function') window.switchTab('loadout');
      } else if (targetScreen === 'pet-hatchery') {
        showHatcheryModal(modalLayer, ctx, hub, saveHubProfile, rerender);
      } else if (targetScreen === 'lexi-shop') {
        showShopModal(modalLayer, ctx, hub, saveHubProfile, rerender);
      } else if (targetScreen === 'world-select') {
        showWorldSelectModal(modalLayer, actions);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Interactive Modals (Kid-friendly feedback for Chromebooks)
// ---------------------------------------------------------------------------

function showAvatarPickerModal(modalLayer, hub, saveHubProfile, rerender, AVATAR_OPTIONS) {
  if (!modalLayer) return;
  modalLayer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-sm rounded-3xl border-4 border-[#7b4632] bg-[#fff8ea] p-5 shadow-[0_8px_0_#7b4632] space-y-4">
        <div class="flex items-center justify-between border-b-2 border-amber-200 pb-2">
          <h3 class="font-serif text-xl font-black text-[#542d1d]">Choose Your Avatar</h3>
          <button type="button" id="modal-close" class="rounded-xl p-1 text-slate-500 hover:text-black font-bold text-lg">✕</button>
        </div>
        <div class="grid grid-cols-4 gap-3">
          ${AVATAR_OPTIONS.map(
            (av) => `
            <button
              type="button"
              data-pick-avatar="${av}"
              class="flex h-16 items-center justify-center rounded-2xl border-3 border-[#7b4632] text-3xl shadow-[0_3px_0_#7b4632] hover:scale-105 active:translate-y-1 ${
                hub.avatar === av ? 'bg-amber-300' : 'bg-white'
              }"
            >
              ${av}
            </button>
          `
          ).join('')}
        </div>
      </div>
    </div>
  `;

  modalLayer.querySelector('#modal-close')?.addEventListener('click', () => {
    modalLayer.innerHTML = '';
  });

  modalLayer.querySelectorAll('[data-pick-avatar]').forEach((btn) => {
    btn.addEventListener('click', () => {
      hub.avatar = btn.getAttribute('data-pick-avatar');
      saveHubProfile();
      playHubTone(700, 80);
      modalLayer.innerHTML = '';
      rerender();
    });
  });
}

function showStreakModal(modalLayer, hub, saveHubProfile, rerender) {
  if (!modalLayer) return;
  const isClaimed = hub.streakClaimedToday;

  modalLayer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-sm rounded-3xl border-4 border-[#b93815] bg-[#fff5ea] p-6 shadow-[0_8px_0_#b93815] text-center space-y-4">
        <span class="text-6xl animate-bounce block">🔥</span>
        <h3 class="font-serif text-2xl font-black text-[#5e2009]">${hub.streak}-Day Vocabulary Streak!</h3>
        <p class="text-xs font-bold text-[#8f4320]">
          Log in every school day to maintain your streak and earn free Lexi-Coins &amp; Fusion Tokens!
        </p>

        <div class="rounded-2xl border-2 border-orange-300 bg-orange-100 p-3 text-xs font-black text-orange-900">
          Daily Bonus: <strong>+100 Lexi-Coins</strong> &amp; <strong>+3 Fusion Tokens</strong>
        </div>

        <button
          type="button"
          id="claim-streak-btn"
          ${isClaimed ? 'disabled' : ''}
          class="w-full rounded-2xl border-3 border-[#7b4632] py-3 text-sm font-black uppercase text-white shadow-[0_4px_0_#7b4632] transition ${
            isClaimed
              ? 'bg-slate-400 opacity-60 cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-500 to-red-500 hover:brightness-105 active:translate-y-1 cursor-pointer'
          }"
        >
          ${isClaimed ? '✓ Already Claimed Today!' : '🎁 Claim Today\'s Reward!'}
        </button>

        <button type="button" id="modal-close" class="text-xs font-bold text-slate-500 underline cursor-pointer">
          Close
        </button>
      </div>
    </div>
  `;

  modalLayer.querySelector('#modal-close')?.addEventListener('click', () => {
    modalLayer.innerHTML = '';
  });

  modalLayer.querySelector('#claim-streak-btn')?.addEventListener('click', () => {
    if (!hub.streakClaimedToday) {
      hub.streakClaimedToday = true;
      hub.lexiCoins += 100;
      hub.fusionTokens += 3;
      saveHubProfile();
      playHubTone(900, 200, 'triangle');
      modalLayer.innerHTML = '';
      rerender();
    }
  });
}

function showCurrencyModal(modalLayer, type, hub, saveHubProfile, rerender) {
  if (!modalLayer) return;
  const isCoins = type === 'coins';
  modalLayer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-sm rounded-3xl border-4 border-[#7b4632] bg-[#fff9ed] p-5 shadow-[0_8px_0_#7b4632] text-center space-y-3">
        <span class="text-5xl block">${isCoins ? '🪙' : '🧬'}</span>
        <h3 class="font-serif text-xl font-black text-[#542d1d]">${isCoins ? 'Lexi-Coins' : 'Fusion Tokens'}</h3>
        <p class="text-xs font-bold text-slate-600">
          ${isCoins ? 'Earn Lexi-Coins by finishing grammar battles and spelling combos!' : 'Earn Fusion Tokens to synthesize hybrid beasts in the Word Forge!'}
        </p>
        <div class="font-serif text-3xl font-black text-amber-700">
          ${isCoins ? hub.lexiCoins : hub.fusionTokens}
        </div>
        <button type="button" id="modal-close" class="w-full rounded-2xl border-3 border-[#7b4632] bg-amber-400 py-2.5 text-xs font-black uppercase text-[#542d1d] shadow-[0_3px_0_#7b4632] hover:bg-amber-300">
          Got It!
        </button>
      </div>
    </div>
  `;
  modalLayer.querySelector('#modal-close')?.addEventListener('click', () => {
    modalLayer.innerHTML = '';
  });
}

function showHatcheryModal(modalLayer, ctx, hub, saveHubProfile, rerender) {
  if (!modalLayer) return;
  modalLayer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-md rounded-3xl border-4 border-[#b57a1b] bg-[#fffcee] p-6 shadow-[0_8px_0_#b57a1b] text-center space-y-4">
        <div class="flex justify-between items-center">
          <span class="text-xs font-black uppercase tracking-wider text-amber-800">🥚 Pet Hatchery</span>
          <button type="button" id="modal-close" class="text-slate-400 hover:text-black font-bold">✕</button>
        </div>
        <div class="py-2">
          <span class="text-6xl inline-block animate-bounce">🥚</span>
          <h3 class="font-serif text-2xl font-black text-[#5a3b0a] mt-2">Lexi-Egg Ready to Hatch!</h3>
          <p class="text-xs font-bold text-amber-900 mt-1">Tap the egg to hatch a rare elemental beast or vocabulary card!</p>
        </div>
        <button
          type="button"
          id="hatch-now-btn"
          class="w-full rounded-2xl border-3 border-[#7b4632] bg-gradient-to-r from-amber-400 to-orange-400 py-3 text-sm font-black uppercase text-white shadow-[0_4px_0_#7b4632] hover:brightness-105 active:translate-y-1 cursor-pointer"
        >
          ✨ Hatch Free Crate!
        </button>
      </div>
    </div>
  `;

  modalLayer.querySelector('#modal-close')?.addEventListener('click', () => {
    modalLayer.innerHTML = '';
  });

  modalLayer.querySelector('#hatch-now-btn')?.addEventListener('click', () => {
    playHubTone(940, 250, 'sawtooth');
    hub.lexiCoins += 150;
    hub.fusionTokens += 2;
    saveHubProfile();
    modalLayer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
        <div class="w-full max-w-md rounded-3xl border-4 border-emerald-600 bg-emerald-50 p-6 shadow-[0_8px_0_#059669] text-center space-y-3">
          <span class="text-6xl block">🐣</span>
          <h3 class="font-serif text-2xl font-black text-emerald-900">Egg Hatched!</h3>
          <p class="text-xs font-bold text-emerald-800">You earned <strong>+150 Lexi-Coins</strong> &amp; <strong>+2 Fusion Tokens</strong>!</p>
          <button type="button" id="modal-done" class="w-full rounded-2xl border-3 border-[#7b4632] bg-emerald-500 py-2.5 text-xs font-black uppercase text-white shadow-[0_3px_0_#7b4632]">
            Awesome!
          </button>
        </div>
      </div>
    `;
    modalLayer.querySelector('#modal-done')?.addEventListener('click', () => {
      modalLayer.innerHTML = '';
      rerender();
    });
  });
}

function showShopModal(modalLayer, ctx, hub, saveHubProfile, rerender) {
  if (!modalLayer) return;
  modalLayer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-md rounded-3xl border-4 border-[#1b6b88] bg-[#f0fbff] p-6 shadow-[0_8px_0_#1b6b88] space-y-4">
        <div class="flex justify-between items-center border-b-2 border-sky-200 pb-2">
          <div>
            <h3 class="font-serif text-xl font-black text-[#13495d]">🛍️ The Lexi-Shop</h3>
            <p class="text-[11px] font-bold text-sky-800">Your Balance: ${hub.lexiCoins} 🪙</p>
          </div>
          <button type="button" id="modal-close" class="text-slate-400 hover:text-black font-bold text-lg">✕</button>
        </div>

        <div class="space-y-2 text-xs">
          <div class="flex items-center justify-between rounded-2xl border-2 border-sky-300 bg-white p-3 shadow-xs">
            <div>
              <span class="font-black text-slate-800 block">✨ Mystery Word Booster</span>
              <span class="text-[10px] text-slate-500">Unlocks 2 random vocabulary cards</span>
            </div>
            <button type="button" class="buy-item rounded-xl bg-sky-500 px-3 py-1.5 font-black text-white hover:bg-sky-600 cursor-pointer" data-cost="100">
              100 🪙
            </button>
          </div>

          <div class="flex items-center justify-between rounded-2xl border-2 border-sky-300 bg-white p-3 shadow-xs">
            <div>
              <span class="font-black text-slate-800 block">🧪 Fusion Catalyst Vials</span>
              <span class="text-[10px] text-slate-500">+5 Fusion Tokens for the Forge</span>
            </div>
            <button type="button" class="buy-item rounded-xl bg-purple-600 px-3 py-1.5 font-black text-white hover:bg-purple-700 cursor-pointer" data-cost="150" data-reward="tokens">
              150 🪙
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  modalLayer.querySelector('#modal-close')?.addEventListener('click', () => {
    modalLayer.innerHTML = '';
  });

  modalLayer.querySelectorAll('.buy-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cost = parseInt(btn.getAttribute('data-cost') || '100', 10);
      const isTokens = btn.getAttribute('data-reward') === 'tokens';
      if (hub.lexiCoins >= cost) {
        hub.lexiCoins -= cost;
        if (isTokens) hub.fusionTokens += 5;
        saveHubProfile();
        playHubTone(820, 120);
        modalLayer.innerHTML = '';
        rerender();
      } else {
        alert('Not enough Lexi-Coins! Play battles to earn more coins.');
      }
    });
  });
}

function showWorldSelectModal(modalLayer, actions) {
  if (!modalLayer) return;
  modalLayer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-lg rounded-3xl border-4 border-[#246b38] bg-[#f2fcf4] p-6 shadow-[0_8px_0_#246b38] space-y-4">
        <div class="flex justify-between items-center border-b-2 border-emerald-200 pb-2">
          <div>
            <h3 class="font-serif text-2xl font-black text-[#1b552b]">🗺️ Overworld Map</h3>
            <p class="text-xs font-bold text-emerald-800">Select a zone to explore grammar quests!</p>
          </div>
          <button type="button" id="modal-close" class="text-slate-400 hover:text-black font-bold text-lg">✕</button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="rounded-2xl border-3 border-emerald-400 bg-white p-3 text-center shadow-xs">
            <span class="text-3xl block">🌲</span>
            <h4 class="font-bold text-sm text-emerald-950 mt-1">Verbia Meadow</h4>
            <span class="text-[10px] text-emerald-700 block">Zones 1–4 · Easy</span>
            <button type="button" id="launch-quest-1" class="mt-2 w-full rounded-xl bg-emerald-500 py-1 text-xs font-black text-white hover:bg-emerald-600">
              Enter
            </button>
          </div>

          <div class="rounded-2xl border-3 border-sky-400 bg-white p-3 text-center shadow-xs">
            <span class="text-3xl block">❄️</span>
            <h4 class="font-bold text-sm text-sky-950 mt-1">Frostpeak Ridge</h4>
            <span class="text-[10px] text-sky-700 block">Zones 5–8 · Ice</span>
            <button type="button" id="launch-quest-2" class="mt-2 w-full rounded-xl bg-sky-500 py-1 text-xs font-black text-white hover:bg-sky-600">
              Enter
            </button>
          </div>

          <div class="rounded-2xl border-3 border-orange-400 bg-white p-3 text-center shadow-xs">
            <span class="text-3xl block">🌋</span>
            <h4 class="font-bold text-sm text-orange-950 mt-1">Volcanix Crag</h4>
            <span class="text-[10px] text-orange-700 block">Zones 9–12 · Fire</span>
            <button type="button" id="launch-quest-3" class="mt-2 w-full rounded-xl bg-orange-500 py-1 text-xs font-black text-white hover:bg-orange-600">
              Enter
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  modalLayer.querySelector('#modal-close')?.addEventListener('click', () => {
    modalLayer.innerHTML = '';
  });

  const launch = () => {
    modalLayer.innerHTML = '';
    if (actions.goToBattle) actions.goToBattle();
    else if (typeof window.switchTab === 'function') window.switchTab('battle');
  };

  modalLayer.querySelector('#launch-quest-1')?.addEventListener('click', launch);
  modalLayer.querySelector('#launch-quest-2')?.addEventListener('click', launch);
  modalLayer.querySelector('#launch-quest-3')?.addEventListener('click', launch);
}

// Attach globally to window.renderHub
if (typeof window !== 'undefined') {
  window.renderHub = renderHub;
}

export default renderHub;
