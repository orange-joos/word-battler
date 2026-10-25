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

function playRewardChime() {
  playHubTone(523, 90, 'triangle');
  setTimeout(() => playHubTone(659, 90, 'triangle'), 90);
  setTimeout(() => playHubTone(784, 110, 'triangle'), 180);
  setTimeout(() => playHubTone(1046, 220, 'triangle'), 280);
}

function showHubToast(container, messageHtml) {
  if (!container) return;
  const old = container.querySelector('.hub-toast-banner');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.className =
    'hub-toast-banner fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl border-3 border-amber-500 bg-amber-50 px-5 py-3 text-xs sm:text-sm font-black text-amber-950 shadow-[0_6px_0_#b45309] animate-[bounce_0.4s_ease-out]';
  toast.innerHTML = messageHtml;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 2400);
}

// Daily Vocabulary Missions Schema & Challenges for Grades 3-5
const DEFAULT_DAILY_MISSIONS = [
  {
    id: 'adjective_ace',
    type: 'adjective',
    category: 'Grammar Power',
    categoryTheme: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: '✨',
    title: 'Adjective Ace',
    description: 'Master descriptive words! Identify or unleash 2 Adjectives in battle or practice.',
    target: 2,
    progress: 2, // Ready to claim immediately for quick reward delight!
    rewardCoins: 75,
    rewardTokens: 1,
    claimed: false,
    screen: 'battle-arena',
    screenLabel: 'Battle',
    quiz: {
      question: 'Which word is an ADJECTIVE describing something fiercely hot?',
      options: ['Scorching', 'Ignite', 'Quickly', 'Furnace'],
      correctIndex: 0,
      explanation: '"Scorching" is an adjective that describes blazing hot temperature!',
    },
  },
  {
    id: 'forge_crafter',
    type: 'morphology',
    category: 'Word Forge',
    categoryTheme: 'bg-purple-100 text-purple-900 border-purple-300',
    icon: '🧬',
    title: 'Morphology Crafter',
    description: 'Fuse prefixes and roots in the Word Forge to synthesize hybrid cards.',
    target: 1,
    progress: 1, // Ready to claim!
    rewardCoins: 100,
    rewardTokens: 2,
    claimed: false,
    screen: 'word-forge',
    screenLabel: 'Forge',
    quiz: {
      question: 'What does the prefix "RE-" mean in the word "REIGNITE"?',
      options: ['Again / Repeat', 'Not / Never', 'Under', 'Before'],
      correctIndex: 0,
      explanation: '"Re-" means to do again — reigniting means lighting up again!',
    },
  },
  {
    id: 'elemental_tactician',
    type: 'combat',
    category: 'Combat Tactics',
    categoryTheme: 'bg-rose-100 text-rose-900 border-rose-300',
    icon: '⚔️',
    title: 'Elemental Tactician',
    description: 'Win combat rounds using Fire, Ice, or Nature type advantages.',
    target: 2,
    progress: 1,
    rewardCoins: 90,
    rewardTokens: 1,
    claimed: false,
    screen: 'battle-arena',
    screenLabel: 'Battle',
    quiz: {
      question: 'In elemental battles, Fire moves are super effective against which element?',
      options: ['Ice / Frost', 'Magma', 'Sun', 'Stone'],
      correctIndex: 0,
      explanation: 'Fire melts Ice in elemental combat!',
    },
  },
  {
    id: 'noun_collector',
    type: 'vocabulary',
    category: 'Lexicon Lore',
    categoryTheme: 'bg-sky-100 text-sky-900 border-sky-300',
    icon: '📖',
    title: 'Lexicon Detective',
    description: 'Identify nouns, verbs, and adverbs in your Pet Roster arsenal.',
    target: 3,
    progress: 2,
    rewardCoins: 60,
    rewardTokens: 0,
    claimed: false,
    screen: 'pet-roster',
    screenLabel: 'Roster',
    quiz: {
      question: 'Which word is an ADVERB telling HOW an action was performed?',
      options: ['Fiercely', 'Dragon', 'Spark', 'Frozen'],
      correctIndex: 0,
      explanation: 'Adverbs often end in "-ly" and describe how an action occurs!',
    },
  },
];

function loadSavedDailyMissions() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem('wb_daily_missions');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today && Array.isArray(parsed.missions) && parsed.missions.length > 0) {
        return {
          missions: parsed.missions,
          grandBonusClaimed: Boolean(parsed.grandBonusClaimed),
        };
      }
    }
  } catch {
    // fallback
  }
  return {
    missions: JSON.parse(JSON.stringify(DEFAULT_DAILY_MISSIONS)),
    grandBonusClaimed: false,
  };
}

function saveDailyMissionsToStorage(missions, grandBonusClaimed) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    localStorage.setItem(
      'wb_daily_missions',
      JSON.stringify({
        date: today,
        missions,
        grandBonusClaimed,
      })
    );
  } catch {
    // ignore
  }
}

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

  // Ensure daily missions are initialized on hubState
  if (!ctx.hubState.dailyMissions) {
    const loadedMissions = loadSavedDailyMissions();
    ctx.hubState.dailyMissions = loadedMissions.missions;
    ctx.hubState.grandBonusClaimed = loadedMissions.grandBonusClaimed;
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

  const saveMissionsState = () => {
    saveDailyMissionsToStorage(hub.dailyMissions, hub.grandBonusClaimed);
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

  // Calculate Daily Missions statistics
  const missions = hub.dailyMissions || [];
  const totalMissions = missions.length;
  const completedCount = missions.filter((m) => m.progress >= m.target).length;
  const claimedCount = missions.filter((m) => Boolean(m.claimed)).length;
  const allMissionsClaimed = totalMissions > 0 && claimedCount === totalMissions;
  const completionPercentage = totalMissions > 0 ? Math.round((claimedCount / totalMissions) * 100) : 0;

  const missionsMarkup = missions
    .map((m) => {
      const isClaimed = Boolean(m.claimed);
      const isReadyToClaim = !isClaimed && m.progress >= m.target;
      const progressPercent = Math.min(100, Math.round((m.progress / m.target) * 100));

      let cardBorderBg = 'border-[#7b4632] bg-white';
      let progressColor = 'bg-gradient-to-r from-amber-400 to-orange-400';

      if (isClaimed) {
        cardBorderBg = 'border-emerald-600 bg-emerald-50/70 opacity-95';
        progressColor = 'bg-emerald-500';
      } else if (isReadyToClaim) {
        cardBorderBg = 'border-amber-500 bg-gradient-to-b from-amber-50 to-orange-50 ring-2 ring-amber-300';
        progressColor = 'bg-gradient-to-r from-amber-400 to-emerald-400';
      }

      let actionMarkup = '';
      if (isClaimed) {
        actionMarkup = `
          <div class="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-emerald-100 border-2 border-emerald-400 text-emerald-900 text-xs font-black shadow-xs">
            <span>✓</span>
            <span>Reward Claimed (+${m.rewardCoins} 🪙)</span>
          </div>
        `;
      } else if (isReadyToClaim) {
        actionMarkup = `
          <button
            type="button"
            data-claim-mission="${m.id}"
            class="claim-mission-btn group w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-3 border-[#b45309] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_4px_0_#b45309] transition hover:scale-102 hover:brightness-110 active:translate-y-1 active:shadow-none animate-pulse cursor-pointer"
          >
            <span class="text-base group-hover:scale-125 transition-transform">🎁</span>
            <span>Claim +${m.rewardCoins} Coins!</span>
          </button>
        `;
      } else {
        actionMarkup = `
          <div class="flex items-center gap-2">
            <button
              type="button"
              data-quiz-mission="${m.id}"
              class="mission-quiz-btn flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border-2 border-indigo-400 bg-indigo-50 hover:bg-indigo-100 active:translate-y-0.5 text-indigo-900 font-black text-xs shadow-xs transition cursor-pointer"
            >
              <span>⚡</span>
              <span>Quick Quiz (+1)</span>
            </button>
            <button
              type="button"
              data-nav-mission="${m.screen}"
              class="mission-go-btn flex items-center gap-1 py-2 px-3 rounded-xl border-2 border-[#7b4632] bg-amber-200 hover:bg-amber-300 active:translate-y-0.5 text-[#542d1d] font-black text-xs shadow-xs transition cursor-pointer"
            >
              <span>${m.screenLabel}</span>
              <span>➜</span>
            </button>
          </div>
        `;
      }

      return `
        <div class="mission-card relative flex flex-col justify-between rounded-2xl border-3 ${cardBorderBg} p-4 shadow-[0_4px_0_#7b4632] transition hover:shadow-[0_6px_0_#7b4632]">
          
          <!-- Category & Reward Badges -->
          <div>
            <div class="flex items-center justify-between gap-2">
              <span class="rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${m.categoryTheme || 'bg-amber-100 text-amber-900 border-amber-300'}">
                ${m.icon} ${esc(m.category)}
              </span>
              <div class="flex items-center gap-1 font-serif text-xs font-black">
                <span class="rounded-xl border border-amber-300 bg-amber-100 px-2 py-0.5 text-amber-900 shadow-xs">
                  🪙 +${m.rewardCoins}
                </span>
                ${
                  m.rewardTokens > 0
                    ? `
                  <span class="rounded-xl border border-purple-300 bg-purple-100 px-2 py-0.5 text-purple-900 shadow-xs">
                    🧬 +${m.rewardTokens}
                  </span>
                `
                    : ''
                }
              </div>
            </div>

            <!-- Title & Description -->
            <div class="my-2.5 space-y-1">
              <div class="flex items-center justify-between gap-2">
                <h3 class="font-serif text-base font-black tracking-wide text-[#542d1d]">
                  ${esc(m.title)}
                </h3>
                ${
                  isReadyToClaim
                    ? '<span class="rounded-md bg-amber-400 px-1.5 py-0.2 text-[9px] font-black uppercase text-[#542d1d] animate-bounce">Ready!</span>'
                    : ''
                }
              </div>
              <p class="text-xs font-bold text-slate-600 leading-snug">
                ${esc(m.description)}
              </p>
            </div>
          </div>

          <!-- Progress Bar & Actions -->
          <div class="space-y-2 mt-2">
            <div class="space-y-1">
              <div class="flex justify-between text-[10px] font-black uppercase tracking-wider text-[#7a462f]">
                <span>Challenge Progress</span>
                <span class="font-mono font-bold">${m.progress} / ${m.target}</span>
              </div>
              <div class="h-2.5 w-full overflow-hidden rounded-full bg-amber-100/80 border border-amber-300 shadow-inner">
                <div class="h-full ${progressColor} transition-all duration-300" style="width: ${progressPercent}%"></div>
              </div>
            </div>

            <div class="pt-1">
              ${actionMarkup}
            </div>
          </div>

        </div>
      `;
    })
    .join('');

  let grandChestMarkup = '';
  if (allMissionsClaimed) {
    if (!hub.grandBonusClaimed) {
      grandChestMarkup = `
        <div class="rounded-2xl border-3 border-[#b45309] bg-gradient-to-r from-amber-200 via-yellow-100 to-orange-200 p-4 shadow-[0_4px_0_#b45309] flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
          <div class="flex items-center gap-3 text-center sm:text-left">
            <span class="text-4xl">👑</span>
            <div>
              <h4 class="font-serif text-base sm:text-lg font-black text-[#542d1d]">
                Grand Scholar Chest Unlocked!
              </h4>
              <p class="text-xs font-bold text-[#824c16]">
                All 4 daily vocabulary challenges are complete! Claim your master bonus:
              </p>
            </div>
          </div>
          <button
            type="button"
            id="claim-grand-chest-btn"
            class="rounded-xl border-3 border-[#7b4632] bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_3px_0_#7b4632] hover:brightness-110 active:translate-y-1 active:shadow-none cursor-pointer"
          >
            🎁 Claim +150 🪙 &amp; +3 🧬
          </button>
        </div>
      `;
    } else {
      grandChestMarkup = `
        <div class="rounded-2xl border-2 border-emerald-400 bg-emerald-50/90 p-3 text-center text-xs font-black text-emerald-900 shadow-xs">
          🏆 Grand Scholar Chest Claimed! Outstanding vocabulary prowess today, Lexi Explorer!
        </div>
      `;
    }
  } else {
    grandChestMarkup = `
      <div class="rounded-2xl border-2 border-dashed border-amber-300 bg-white/70 p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-amber-900 shadow-xs">
        <div class="flex items-center gap-2">
          <span class="text-xl">🔒</span>
          <span>Claim all 4 daily quests to unlock the <strong>Grand Scholar Chest</strong>!</span>
        </div>
        <div class="rounded-lg bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-800 border border-amber-300">
          Reward: 🪙 +150 &amp; 🧬 +3
        </div>
      </div>
    `;
  }

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
        <!-- 3. DAILY MISSIONS PANEL (Vocabulary Challenges & Rewards) -->
        <!-- ======================================================== -->
        <section class="rounded-3xl border-4 border-[#7b4632] bg-gradient-to-b from-[#fff7e6] via-[#fffbf2] to-[#fff3d6] p-4 sm:p-6 shadow-[0_8px_0_#7b4632] space-y-4">
          
          <!-- Missions Header & Overall Progress Tracker -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-amber-200/80 pb-3">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-2xl sm:text-3xl">🎯</span>
                <h2 class="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#542d1d]">
                  Daily Vocabulary Quests
                </h2>
                <span class="rounded-full border-2 border-[#7b4632] bg-amber-400 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#542d1d] shadow-xs">
                  Resets Daily
                </span>
              </div>
              <p class="text-xs font-bold text-[#824c16]">
                Conquer grammar, morphology &amp; combat challenges to earn Lexi-Coins &amp; Fusion Tokens!
              </p>
            </div>

            <!-- Summary Progress Pill -->
            <div class="flex items-center gap-3 bg-white/95 rounded-2xl border-3 border-[#7b4632] px-3.5 py-2 shadow-[0_3px_0_#7b4632]">
              <div class="text-right">
                <div class="text-[10px] font-black uppercase tracking-wider text-[#824c16]">
                  Quests Claimed
                </div>
                <div class="font-serif text-base sm:text-lg font-black text-[#542d1d]">
                  ${claimedCount} / ${totalMissions} Claimed
                </div>
              </div>
              <div class="relative h-11 w-11 flex items-center justify-center rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 border-2 border-[#7b4632] text-2xl shadow-xs">
                ${allMissionsClaimed ? '👑' : '📜'}
              </div>
            </div>
          </div>

          <!-- Overall Progress Bar -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-[11px] font-black text-[#7a462f]">
              <span>Daily Completion Meter</span>
              <span>${completionPercentage}% (${completedCount}/${totalMissions} Quests Ready)</span>
            </div>
            <div class="h-3.5 w-full overflow-hidden rounded-full border-2 border-[#7b4632] bg-amber-100 shadow-inner">
              <div
                class="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-500 transition-all duration-500"
                style="width: ${completionPercentage}%"
              ></div>
            </div>
          </div>

          <!-- Grid of Mission Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
            ${missionsMarkup}
          </div>

          <!-- Grand Scholar Chest Bonus -->
          <div id="grand-chest-container">
            ${grandChestMarkup}
          </div>

        </section>

        <!-- ======================================================== -->
        <!-- 4. QUICK NAVIGATION GRID (6 Chunky Touch Tiles)          -->
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

  // Store globals for external actions
  if (typeof window !== 'undefined') {
    window.__hubActions = actions;
    window.__hubContainer = container;
    window.__hubCtx = ctx;
  }

  // Attach all DOM Event Handlers
  attachHubEvents(container, ctx, hub, actions, saveHubProfile, saveMissionsState, AVATAR_OPTIONS);
}

/**
 * Attach event listeners to the Hub interface
 */
function attachHubEvents(container, ctx, hub, actions, saveHubProfile, saveMissionsState, AVATAR_OPTIONS) {
  const rerender = () => renderHub(container, ctx, actions);
  const modalLayer = container.querySelector('#hub-modal-layer');

  // Claim Daily Mission Reward
  container.querySelectorAll('[data-claim-mission]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const missionId = btn.getAttribute('data-claim-mission');
      const mission = (hub.dailyMissions || []).find((m) => m.id === missionId);
      if (mission && mission.progress >= mission.target && !mission.claimed) {
        mission.claimed = true;
        hub.lexiCoins += mission.rewardCoins;
        hub.fusionTokens += (mission.rewardTokens || 0);
        saveHubProfile();
        saveMissionsState();
        playRewardChime();
        showHubToast(
          container,
          `🪙 <strong>+${mission.rewardCoins} Lexi-Coins</strong> Claimed for "${esc(mission.title)}"!`
        );
        rerender();
      }
    });
  });

  // Claim Grand Scholar Chest
  container.querySelector('#claim-grand-chest-btn')?.addEventListener('click', () => {
    if (!hub.grandBonusClaimed) {
      hub.grandBonusClaimed = true;
      hub.lexiCoins += 150;
      hub.fusionTokens += 3;
      saveHubProfile();
      saveMissionsState();
      playRewardChime();
      showHubToast(
        container,
        '👑 <strong>+150 Coins &amp; +3 Fusion Tokens</strong> Claimed from the Grand Scholar Chest!'
      );
      rerender();
    }
  });

  // Quick Quiz Challenge Button
  container.querySelectorAll('[data-quiz-mission]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const missionId = btn.getAttribute('data-quiz-mission');
      const mission = (hub.dailyMissions || []).find((m) => m.id === missionId);
      if (mission) {
        playHubTone(600, 80);
        showMissionQuizModal(modalLayer, mission, hub, saveHubProfile, saveMissionsState, rerender, container);
      }
    });
  });

  // Navigation Shortcut for Missions
  container.querySelectorAll('[data-nav-mission]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetScreen = btn.getAttribute('data-nav-mission');
      playHubTone(620, 100);
      if (actions.navigateTo) {
        actions.navigateTo(targetScreen);
      }
      if (targetScreen === 'battle-arena') {
        if (actions.goToBattle) actions.goToBattle();
        else if (typeof window.switchTab === 'function') window.switchTab('battle');
      } else if (targetScreen === 'word-forge') {
        if (actions.goToForge) actions.goToForge();
        else if (typeof window.switchTab === 'function') window.switchTab('forge');
      } else if (targetScreen === 'pet-roster') {
        if (actions.goToLoadout) actions.goToLoadout();
        else if (typeof window.switchTab === 'function') window.switchTab('loadout');
      }
    });
  });

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

function showMissionQuizModal(modalLayer, mission, hub, saveHubProfile, saveMissionsState, rerender, container) {
  if (!modalLayer || !mission || !mission.quiz) return;
  const q = mission.quiz;
  const letters = ['A', 'B', 'C', 'D'];

  modalLayer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div id="quiz-card" class="w-full max-w-md rounded-3xl border-4 border-indigo-600 bg-[#fbfaff] p-5 sm:p-6 shadow-[0_8px_0_#4338ca] space-y-4">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b-2 border-indigo-200 pb-2">
          <div class="flex items-center gap-2">
            <span class="text-2xl">${mission.icon}</span>
            <div>
              <h3 class="font-serif text-lg font-black text-indigo-950">${esc(mission.title)} Quiz</h3>
              <p class="text-[11px] font-bold text-indigo-700">Answer correctly for +1 Quest Progress!</p>
            </div>
          </div>
          <button type="button" id="modal-close" class="rounded-xl p-1 text-slate-400 hover:text-black font-bold text-lg cursor-pointer">✕</button>
        </div>

        <!-- Question Prompt -->
        <div class="rounded-2xl border-2 border-indigo-200 bg-white p-3.5 shadow-xs">
          <p class="font-bold text-slate-800 text-sm leading-relaxed">${esc(q.question)}</p>
        </div>

        <!-- Feedback Alert -->
        <div id="quiz-feedback" class="hidden rounded-xl p-2.5 text-xs font-bold text-center"></div>

        <!-- Options -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5" id="quiz-options">
          ${q.options
            .map(
              (opt, idx) => `
            <button
              type="button"
              data-opt-index="${idx}"
              class="quiz-opt-btn flex items-center gap-2.5 rounded-2xl border-2 border-indigo-300 bg-white p-3 text-left font-bold text-xs text-indigo-950 shadow-[0_3px_0_#c7d2fe] hover:bg-indigo-50 hover:border-indigo-500 active:translate-y-0.5 active:shadow-none transition cursor-pointer"
            >
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 font-mono font-black text-indigo-700">${letters[idx]}</span>
              <span>${esc(opt)}</span>
            </button>
          `
            )
            .join('')}
        </div>

        <div class="text-center pt-1">
          <span class="text-[11px] font-bold text-slate-400">Current Progress: ${mission.progress} / ${mission.target}</span>
        </div>

      </div>
    </div>
  `;

  modalLayer.querySelector('#modal-close')?.addEventListener('click', () => {
    modalLayer.innerHTML = '';
  });

  const feedbackEl = modalLayer.querySelector('#quiz-feedback');
  const cardEl = modalLayer.querySelector('#quiz-card');

  modalLayer.querySelectorAll('.quiz-opt-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedIdx = parseInt(btn.getAttribute('data-opt-index') || '-1', 10);
      if (selectedIdx === q.correctIndex) {
        mission.progress = Math.min(mission.target, mission.progress + 1);
        saveMissionsState();
        playRewardChime();

        const isNowReady = mission.progress >= mission.target;

        cardEl.className =
          'w-full max-w-md rounded-3xl border-4 border-emerald-600 bg-emerald-50 p-5 sm:p-6 shadow-[0_8px_0_#059669] space-y-4 text-center';
        cardEl.innerHTML = `
          <span class="text-5xl block animate-bounce">🎉</span>
          <h3 class="font-serif text-2xl font-black text-emerald-950">Awesome Vocabulary Work!</h3>
          <p class="text-xs font-bold text-emerald-900 leading-relaxed">${esc(q.explanation)}</p>
          <div class="rounded-2xl border-2 border-emerald-300 bg-white/80 p-3 text-xs font-black text-emerald-800">
            Progress: <strong>${mission.progress} / ${mission.target}</strong>
            ${isNowReady ? ' — <span class="text-amber-600">Quest Ready to Claim! 🎁</span>' : ''}
          </div>
          <button
            type="button"
            id="quiz-continue-btn"
            class="w-full rounded-2xl border-3 border-[#7b4632] bg-emerald-500 py-3 text-xs font-black uppercase text-white shadow-[0_3px_0_#7b4632] hover:bg-emerald-600 active:translate-y-1 cursor-pointer"
          >
            ${isNowReady ? 'Claim Reward in Hub ➜' : 'Back to Hub'}
          </button>
        `;

        cardEl.querySelector('#quiz-continue-btn')?.addEventListener('click', () => {
          modalLayer.innerHTML = '';
          rerender();
        });
      } else {
        playHubTone(240, 150, 'sawtooth');
        btn.classList.add('bg-rose-100', 'border-rose-400', 'text-rose-900');
        if (feedbackEl) {
          feedbackEl.className =
            'rounded-xl p-2.5 text-xs font-bold text-center bg-rose-100 text-rose-800 border border-rose-300 block';
          feedbackEl.textContent = "Not quite! Think about the word's meaning and try another choice.";
        }
      }
    });
  });
}

// Global helper to advance daily missions from combat or forge
if (typeof window !== 'undefined') {
  window.advanceDailyMission = function (typeOrId, amount = 1) {
    let hubState = window.ctx?.hubState || window.__hubCtx?.hubState;
    if (!hubState || !hubState.dailyMissions) {
      const loaded = loadSavedDailyMissions();
      let changed = false;
      loaded.missions.forEach((m) => {
        if ((m.type === typeOrId || m.id === typeOrId) && !m.claimed) {
          m.progress = Math.min(m.target, m.progress + amount);
          changed = true;
        }
      });
      if (changed) {
        saveDailyMissionsToStorage(loaded.missions, loaded.grandBonusClaimed);
      }
      return;
    }

    let changed = false;
    hubState.dailyMissions.forEach((m) => {
      if ((m.type === typeOrId || m.id === typeOrId) && !m.claimed) {
        m.progress = Math.min(m.target, m.progress + amount);
        changed = true;
      }
    });

    if (changed) {
      saveDailyMissionsToStorage(hubState.dailyMissions, hubState.grandBonusClaimed);
      const hubEl = document.querySelector('.hub-screen');
      if (hubEl && typeof window.renderHub === 'function' && window.__hubContainer && window.__hubCtx) {
        window.renderHub(window.__hubContainer, window.__hubCtx, window.__hubActions || {});
      }
    }
  };
}

// Attach globally to window.renderHub
if (typeof window !== 'undefined') {
  window.renderHub = renderHub;
}

export default renderHub;
