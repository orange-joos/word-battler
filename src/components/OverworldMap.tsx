import React, { useEffect, useState } from 'react';
import {
  Swords,
  Sparkles,
  BookOpen,
  Trophy,
  Star,
  Shield,
  Flame,
  Volume2,
  VolumeX,
  Compass,
  Palette,
  Egg,
  ShoppingBag,
  Backpack,
  CheckCircle2,
  X,
  HelpCircle,
  LogOut,
  ChevronRight,
  Zap,
  Gift,
  Mail,
  Newspaper,
  Calendar,
  Settings,
  Users,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { WORLD_TIERS, WorldTier } from '../data/worldTiers';
import { juice } from '../engine/juice';
import { EvolutionSequenceModal } from './EvolutionSequenceModal';
import { canPetEvolve, getNextEvolutionStage, getCurrentStage } from '../data/evolutionData';
import { Creature, TabType } from '../types';
import { ELEMENTS } from '../data/elements';
import { HUB_DESTINATIONS } from '../data/hubDestinations';

interface OverworldMapProps {
  onOpenGuide?: () => void;
  onSelectZone?: (zoneId: string) => void;
  initialPanel?: 'shop' | 'hatchery' | null;
  activeTab?: TabType;
}

export const OverworldMap: React.FC<OverworldMapProps> = ({ onOpenGuide, onSelectZone, initialPanel = null, activeTab = 'hub' }) => {
  const {
    gameState,
    startBattleInZone,
    activeZoneId,
    zoneProgress,
    setTab,
    creatures,
    playerId,
    setPlayerId,
    isMuted,
    toggleMute,
    words,
    levelUpPet,
    trainPetWithCoins,
    evolvePet,
  } = useGame();

  const { currentUser, setIsCustomizingAvatar, logout, updateProfile } = useAuth();

  // Active Pet
  const activePet = creatures.find((c) => c.id === playerId) || creatures[0];
  const unlockedCreatures = creatures.filter((creature) => gameState.unlockedPetIds.includes(creature.id));

  // Active interactive modals
  const [activeModal, setActiveModal] = useState<
    'story' | 'hatchery' | 'shop' | 'roster' | 'quests' | 'events' | 'mail' | 'settings' | null
  >(initialPanel);

  useEffect(() => {
    setActiveModal(initialPanel);
  }, [initialPanel]);

  // Active pet undergoing evolution
  const [evolvingCreature, setEvolvingCreature] = useState<Creature | null>(null);

  const [selectedTier, setSelectedTier] = useState<WorldTier>(() => {
    return WORLD_TIERS.find((t) => t.id === activeZoneId) || WORLD_TIERS[0];
  });

  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);

  // Companion speech quotes
  const speechQuotes = [
    `Let's Explore!`,
    `Roots & affixes give us power!`,
    `Shadowcrypt holds your Arsenal!`,
    `Fireforge fuses Latin roots!`,
    `Hatch Lexi-Eggs at Treetop!`,
  ];
  const [speechIdx, setSpeechIdx] = useState(0);

  const cycleSpeech = () => {
    setSpeechIdx((prev) => (prev + 1) % speechQuotes.length);
    playSfx(750);
  };

  const playSfx = (freq = 600) => {
    if (isMuted) return;
    try {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      const ac = new AudioCtor();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      gain.gain.setValueAtTime(0.12, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.12);
    } catch {}
  };

  const handlePronounce = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch {}
    }
  };

  const handleLaunchBattle = (tier: WorldTier) => {
    juice.fanfare();
    startBattleInZone(tier.id, tier.boss.id);
    if (onSelectZone) onSelectZone(tier.id);
  };

  const openHubDestination = (destinationId: (typeof HUB_DESTINATIONS)[number]['id']) => {
    const destination = HUB_DESTINATIONS.find((item) => item.id === destinationId);
    if (!destination) return;
    playSfx(destination.id === 'battle' ? 850 : 700);
    if (destination.id === 'hub') {
      setActiveModal('story');
      return;
    }
    setTab(destination.id);
  };

  // Currencies & stats
  const coins = currentUser?.lexiCoins ?? 45980;
  const gems = currentUser?.fusionTokens ?? 1250;
  const playerLevel = currentUser?.level || 42;
  const playerName = currentUser?.displayName || 'Aris';

  // Date formatting for top calendar badge
  const currentDate = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthStr = monthNames[currentDate.getMonth()];
  const dayStr = currentDate.getDate();

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden bg-[#59b8fa] select-none flex flex-col font-sans">
      
      {/* ======================================================== */}
      {/* 1. TOP HUD (EXACT MATCH TO REFERENCE PHOTO IMG_4204)     */}
      {/* ======================================================== */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-start justify-between p-2 sm:p-4 pointer-events-none">
        
        {/* Top-Left: Avatar Shield, HP, MP, Gold, Diamonds, Stamina */}
        <div className="flex items-start gap-2 sm:gap-3 pointer-events-auto">
          
          {/* Avatar Shield Frame */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsCustomizingAvatar(true)}
              title="Customize Explorer Avatar"
              className="group relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border-4 border-[#5a2e12] bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] text-3xl sm:text-4xl shadow-[0_4px_0_#3d1e0a] hover:scale-105 active:translate-y-1 transition cursor-pointer"
            >
              <span>{currentUser?.avatarConfig?.emoji || currentUser?.avatarEmoji || '🦊'}</span>
              {currentUser?.avatarConfig?.headgearEmoji && (
                <span className="absolute -top-3 -right-1 text-base sm:text-lg drop-shadow">
                  {currentUser.avatarConfig.headgearEmoji}
                </span>
              )}
              {/* Level Badge at bottom-left */}
              <div className="absolute -bottom-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#5a2e12] bg-gradient-to-b from-amber-300 to-amber-500 font-serif text-[11px] font-black text-[#451e08] shadow">
                {playerLevel}
              </div>
            </button>
            {/* Wooden Name Banner */}
            <div className="mt-1 rounded-md border-2 border-[#5a2e12] bg-gradient-to-b from-[#d97706] to-[#b45309] px-2 py-0.5 text-center shadow-xs">
              <span className="font-serif text-xs font-black text-amber-100 tracking-wide">
                {playerName}
              </span>
            </div>
          </div>

          {/* Vitals & Currency Cluster */}
          <div className="space-y-1 sm:space-y-1.5 pt-0.5">
            {/* Row 1: HP Bar + Hearts */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border-2 border-[#381a07] bg-[#5a2e12] px-2 py-0.5 text-[10px] sm:text-xs font-black text-white shadow-xs">
                <span className="text-red-400 font-bold">HP</span>
                <div className="h-3.5 w-24 sm:w-32 rounded-full border border-[#7f1d1d] bg-[#450a0a] overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-red-600 via-rose-500 to-red-400" />
                </div>
                <span className="font-mono text-[9px] sm:text-[10px]">1250/1250</span>
              </div>

              <div className="hidden sm:flex items-center gap-1 rounded-lg border-2 border-[#381a07] bg-[#5a2e12] px-2 py-0.5 text-xs font-black text-white shadow-xs">
                <span className="text-rose-400">❤️</span>
                <span className="font-mono">45,980</span>
              </div>
            </div>

            {/* Row 2: MP Bar + Diamonds */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border-2 border-[#381a07] bg-[#5a2e12] px-2 py-0.5 text-[10px] sm:text-xs font-black text-white shadow-xs">
                <span className="text-sky-400 font-bold">MP</span>
                <div className="h-3.5 w-24 sm:w-32 rounded-full border border-[#0c4a6e] bg-[#082f49] overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-sky-600 via-cyan-400 to-blue-400" />
                </div>
                <span className="font-mono text-[9px] sm:text-[10px]">800/800</span>
              </div>

              <div className="hidden sm:flex items-center gap-1 rounded-lg border-2 border-[#381a07] bg-[#5a2e12] px-2 py-0.5 text-xs font-black text-white shadow-xs">
                <span className="text-cyan-400">💎</span>
                <span className="font-mono">{gems.toLocaleString()}</span>
              </div>
            </div>

            {/* Row 3: Gold Coins + Energy Bolts */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                onClick={() => setActiveModal('shop')}
                title="Lexi-Coins: Click to open Shop"
                className="flex items-center gap-1 rounded-lg border-2 border-[#381a07] bg-[#5a2e12] px-2 py-0.5 text-[10px] sm:text-xs font-black text-amber-300 shadow-xs cursor-pointer hover:brightness-110"
              >
                <span>🪙</span>
                <span className="font-mono text-white">{coins.toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-1 rounded-lg border-2 border-[#381a07] bg-[#5a2e12] px-2 py-0.5 text-[10px] sm:text-xs font-black text-amber-400 shadow-xs">
                <span>⚡</span>
                <span className="font-mono text-white">15/20</span>
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse ml-0.5" />
              </div>
            </div>
          </div>

        </div>

        {/* Top-Center: Game Title & Realm Subtitle Banner Plaque */}
        <div className="hidden md:flex flex-col items-center pointer-events-auto">
          {/* Hexagonal Blue/Gold Plaque */}
          <div className="relative rounded-2xl border-4 border-[#3b82f6] bg-gradient-to-b from-[#1e40af] via-[#1d4ed8] to-[#172554] px-7 py-1.5 text-center shadow-[0_5px_0_#0f172a]">
            <h1 className="font-serif text-lg sm:text-xl font-black tracking-wide text-amber-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              Aetheria Quest · Word Battler
            </h1>
          </div>
          {/* Subtitle Banner Ribbon */}
          <div className="mt-1 rounded-full border-2 border-[#1e3a8a] bg-[#1e40af]/90 px-4 py-0.5 text-center shadow-xs">
            <span className="font-sans text-[11px] font-black text-sky-200 uppercase tracking-wider">
              World Map - Aetheria (Level 20-50 · Grades 3–5)
            </span>
          </div>
        </div>

        {/* Top-Right: Quests, Events, Mail, News, Calendar, Settings, Shop */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          
          {/* Action Button Row */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Quests (with red badge) */}
            <button
              type="button"
              onClick={() => {
                playSfx(700);
                setActiveModal('quests');
              }}
              title="Daily Vocabulary Quests"
              className="group flex flex-col items-center justify-center rounded-xl border-2 border-[#381a07] bg-gradient-to-b from-amber-100 to-amber-200 p-1.5 shadow-[0_3px_0_#381a07] hover:scale-105 active:translate-y-1 transition cursor-pointer"
            >
              <div className="relative">
                <FileText className="h-5 w-5 text-blue-700" />
                <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white shadow">
                  !
                </span>
              </div>
              <span className="text-[9px] font-black text-[#5a2e12]">Quests</span>
            </button>

            {/* Events (Gift Box) */}
            <button
              type="button"
              onClick={() => {
                playSfx(750);
                setActiveModal('events');
              }}
              title="Events & Daily Login Bonus"
              className="flex flex-col items-center justify-center rounded-xl border-2 border-[#381a07] bg-gradient-to-b from-amber-100 to-amber-200 p-1.5 shadow-[0_3px_0_#381a07] hover:scale-105 active:translate-y-1 transition cursor-pointer"
            >
              <Gift className="h-5 w-5 text-amber-600" />
              <span className="text-[9px] font-black text-[#5a2e12]">Events</span>
            </button>

            {/* Mail */}
            <button
              type="button"
              onClick={() => {
                playSfx(650);
                setActiveModal('mail');
              }}
              title="Scholar Mail & Notices"
              className="group flex flex-col items-center justify-center rounded-xl border-2 border-[#381a07] bg-gradient-to-b from-amber-100 to-amber-200 p-1.5 shadow-[0_3px_0_#381a07] hover:scale-105 active:translate-y-1 transition cursor-pointer"
            >
              <div className="relative">
                <Mail className="h-5 w-5 text-amber-700" />
                <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white shadow">
                  !
                </span>
              </div>
              <span className="text-[9px] font-black text-[#5a2e12]">Mail</span>
            </button>

            {/* News / Linguistic Guide */}
            <button
              type="button"
              onClick={() => {
                playSfx(600);
                if (onOpenGuide) onOpenGuide();
                else setActiveModal('story');
              }}
              title="Linguistic Rules & News"
              className="hidden sm:flex flex-col items-center justify-center rounded-xl border-2 border-[#381a07] bg-gradient-to-b from-amber-100 to-amber-200 p-1.5 shadow-[0_3px_0_#381a07] hover:scale-105 active:translate-y-1 transition cursor-pointer"
            >
              <Newspaper className="h-5 w-5 text-slate-700" />
              <span className="text-[9px] font-black text-[#5a2e12]">News</span>
            </button>

            {/* Calendar Page */}
            <div className="hidden sm:flex flex-col items-center justify-center rounded-xl border-2 border-[#381a07] bg-white p-1 shadow-[0_3px_0_#381a07]">
              <span className="rounded-t-md bg-red-600 px-2 text-[8px] font-black uppercase text-white">
                {monthStr}
              </span>
              <span className="font-serif text-xs font-black text-slate-900 leading-tight">
                {dayStr}
              </span>
            </div>

            {/* Settings Gear */}
            <button
              type="button"
              onClick={() => {
                playSfx(550);
                setActiveModal('settings');
              }}
              title="Settings & Audio"
              className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#381a07] bg-slate-200 p-1 shadow-[0_3px_0_#381a07] hover:scale-105 active:translate-y-1 transition cursor-pointer"
            >
              <Settings className="h-5 w-5 text-slate-700" />
            </button>

            {/* Shop Booth with Red Awning */}
            <button
              type="button"
              onClick={() => {
                playSfx(850);
                setActiveModal('shop');
              }}
              title="The Lexi-Shop"
              className="flex flex-col items-center justify-center rounded-xl border-2 border-[#381a07] bg-gradient-to-b from-red-500 to-amber-500 p-1 text-white shadow-[0_3px_0_#381a07] hover:scale-105 active:translate-y-1 transition cursor-pointer"
            >
              <ShoppingBag className="h-5 w-5 text-amber-100" />
              <span className="text-[9px] font-black uppercase">Shop</span>
            </button>

          </div>

          {/* New Badge Pill (top-left beneath avatar on mobile/desktop) */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border-2 border-[#381a07] bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-[#451e08] shadow-xs">
            <span className="text-red-600">🎖️</span>
            <span>New badge</span>
            <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
          </div>

        </div>

      </header>

      {/* ======================================================== */}
      {/* 2. FULL-SCREEN ILLUSTRATED VECTOR WORLD MAP STAGE        */}
      {/* ======================================================== */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        
        {/* Sky Background with Gentle Drift Clouds & Sea Horizon */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#56b4f7] via-[#85cdfb] to-[#3ca7e7]">
          
          {/* Animated SVG Clouds */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
            <g fill="#ffffff">
              <path d="M 80 80 Q 110 50 150 70 Q 190 50 230 75 Q 260 65 290 85 Q 280 110 230 115 Q 160 120 100 110 Z" opacity="0.6" />
              <path d="M 850 60 Q 880 30 920 50 Q 960 30 1000 55 Q 1030 45 1060 65 Q 1050 90 1000 95 Q 930 100 870 90 Z" opacity="0.5" />
              <path d="M 500 120 Q 530 95 570 110 Q 610 95 640 120 Q 620 140 580 145 Z" opacity="0.4" />
              <path d="M 1200 140 Q 1230 115 1270 130 Q 1310 115 1340 140 Q 1320 160 1280 165 Z" opacity="0.5" />
            </g>
          </svg>

          {/* Sea / Ocean Layer at Bottom with Water Reflections */}
          <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-b from-[#3ba5e6] via-[#248ac9] to-[#12689c] opacity-80" />
        </div>

        {/* Interactive Full-Viewport SVG Map Canvas */}
        <div className="relative w-full h-full min-h-[550px]">
          
          {/* SVG Vector Drawing of the Archipelago (Islands, Cliffs, Bridges, Structures) */}
          <svg
            viewBox="0 0 1440 900"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full absolute inset-0 select-none"
          >
            <defs>
              {/* Gradients for Islands & Cliffs */}
              <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7ad14b" />
                <stop offset="100%" stopColor="#4f9e2b" />
              </linearGradient>

              <linearGradient id="cliffGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8c5837" />
                <stop offset="100%" stopColor="#482715" />
              </linearGradient>

              <linearGradient id="dunesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fed7aa" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>

              <linearGradient id="pinkwoodGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbcfe8" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>

              <linearGradient id="frostpeakGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#7dd3fc" />
              </linearGradient>

              <linearGradient id="lavaGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>

              <linearGradient id="shadowcryptGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              <linearGradient id="seaWaterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>

              {/* Wooden Bridge Planks Pattern */}
              <pattern id="bridgePlank" width="12" height="6" patternUnits="userSpaceOnUse">
                <rect width="10" height="5" fill="#a16207" stroke="#451a03" strokeWidth="1" />
              </pattern>
            </defs>

            {/* ======================================================== */}
            {/* WOODEN SUSPENSION BRIDGES CONNECTING THE ISLANDS         */}
            {/* ======================================================== */}
            <g id="bridges" stroke="#5c2e0b" strokeWidth="6" strokeLinecap="round">
              {/* Bridge: Harmony Village ➜ Shadowcrypt */}
              <path d="M 520 540 Q 450 565 380 575" fill="none" strokeDasharray="8 4" stroke="#a16207" strokeWidth="12" />
              
              {/* Bridge: Harmony Village ➜ Sunfall Dunes */}
              <path d="M 680 430 Q 720 380 750 350" fill="none" strokeDasharray="8 4" stroke="#a16207" strokeWidth="12" />

              {/* Bridge: Sunfall Dunes ➜ Celestia */}
              <path d="M 880 320 Q 940 300 990 280" fill="none" strokeDasharray="8 4" stroke="#a16207" strokeWidth="12" />

              {/* Bridge: Harmony Village ➜ Fireforge */}
              <path d="M 760 550 Q 820 575 870 590" fill="none" strokeDasharray="8 4" stroke="#a16207" strokeWidth="12" />

              {/* Bridge: Far Left Altar ➜ Shadowcrypt */}
              <path d="M 180 520 Q 230 550 280 560" fill="none" strokeDasharray="6 3" stroke="#a16207" strokeWidth="10" />
            </g>

            {/* ======================================================== */}
            {/* ISLAND 1: HARMONY VILLAGE / ROOT VILLAGE (CENTER)        */}
            {/* ======================================================== */}
            <g id="island-harmony-village" className="cursor-pointer group" onClick={() => setActiveModal('story')}>
              {/* Earthen Cliff Underneath */}
              <path d="M 460 520 C 460 620, 780 620, 800 520 L 780 470 C 700 450, 520 460, 460 520 Z" fill="url(#cliffGrad)" />
              {/* Lush Meadow Grass Cap */}
              <ellipse cx="630" cy="500" rx="170" ry="85" fill="url(#grassGrad)" stroke="#3f7e22" strokeWidth="4" />
              
              {/* Village Stream & Stepping Stones */}
              <path d="M 570 460 Q 600 510 650 540" fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
              
              {/* Cozy Red & Blue Cottages */}
              {/* Cottage 1 */}
              <rect x="580" y="475" width="28" height="20" fill="#fef3c7" stroke="#451a03" strokeWidth="2" />
              <polygon points="575,475 594,455 613,475" fill="#dc2626" stroke="#451a03" strokeWidth="2" />
              {/* Cottage 2 */}
              <rect x="620" y="485" width="26" height="18" fill="#fef3c7" stroke="#451a03" strokeWidth="2" />
              <polygon points="615,485 633,465 651,485" fill="#2563eb" stroke="#451a03" strokeWidth="2" />
              {/* Cottage 3 */}
              <rect x="660" y="480" width="24" height="18" fill="#fef3c7" stroke="#451a03" strokeWidth="2" />
              <polygon points="656,480 672,462 688,480" fill="#ea580c" stroke="#451a03" strokeWidth="2" />
              
              {/* Trees & Fences */}
              <circle cx="530" cy="485" r="18" fill="#22c55e" stroke="#166534" strokeWidth="3" />
              <circle cx="510" cy="505" r="16" fill="#15803d" stroke="#166534" strokeWidth="3" />
              <circle cx="730" cy="495" r="18" fill="#22c55e" stroke="#166534" strokeWidth="3" />
            </g>

            {/* ======================================================== */}
            {/* ISLAND 2: SHADOWCRYPT (BOTTOM-LEFT / ARSENAL)            */}
            {/* ======================================================== */}
            <g id="island-shadowcrypt" className="cursor-pointer group" onClick={() => setTab('loadout')}>
              {/* Dark Obsidian Cliff Base */}
              <path d="M 230 580 C 230 720, 480 720, 500 580 L 480 540 C 400 520, 280 530, 230 580 Z" fill="url(#shadowcryptGrad)" />
              {/* Top Stone Temple Plaza */}
              <ellipse cx="370" cy="570" rx="130" ry="65" fill="#475569" stroke="#1e293b" strokeWidth="4" />
              
              {/* Glowing Rune Altar in Center */}
              <ellipse cx="370" cy="570" rx="40" ry="20" fill="#0f172a" stroke="#06b6d4" strokeWidth="3" />
              <path d="M 360 565 L 380 565 L 370 575 Z" fill="#22d3ee" className="animate-pulse" />

              {/* Ancient Stone Columns & Arch */}
              <rect x="290" y="525" width="16" height="42" fill="#334155" stroke="#0f172a" strokeWidth="2" />
              <rect x="320" y="515" width="16" height="52" fill="#334155" stroke="#0f172a" strokeWidth="2" />
              <rect x="420" y="515" width="16" height="52" fill="#334155" stroke="#0f172a" strokeWidth="2" />
              <rect x="450" y="525" width="16" height="42" fill="#334155" stroke="#0f172a" strokeWidth="2" />
              <rect x="316" y="510" width="124" height="10" fill="#1e293b" rx="2" />

              {/* Cyan Glowing Glyph Pillars */}
              <rect x="270" y="560" width="10" height="24" fill="#06b6d4" rx="2" className="animate-pulse" />
              <rect x="470" y="560" width="10" height="24" fill="#06b6d4" rx="2" className="animate-pulse" />
            </g>

            {/* ======================================================== */}
            {/* ISLAND 3: PINKWOOD & FROSTPEAK (TOP-LEFT / PET ROSTER)   */}
            {/* ======================================================== */}
            <g id="island-pinkwood-frostpeak" className="cursor-pointer group" onClick={() => setActiveModal('roster')}>
              {/* Cliff Platform */}
              <path d="M 180 340 C 180 470, 520 470, 540 340 L 520 280 C 420 260, 240 260, 180 340 Z" fill="url(#cliffGrad)" />
              
              {/* Left Side: Pink Blossom Paradise */}
              <ellipse cx="280" cy="330" rx="90" ry="50" fill="url(#pinkwoodGrad)" stroke="#db2777" strokeWidth="3" />
              {/* Turquoise Pond */}
              <ellipse cx="310" cy="340" rx="45" ry="22" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
              {/* Pink Blossom Trees */}
              <circle cx="230" cy="310" r="22" fill="#f472b6" stroke="#9d174d" strokeWidth="3" />
              <circle cx="260" cy="295" r="26" fill="#fb7185" stroke="#9d174d" strokeWidth="3" />
              <circle cx="290" cy="310" r="20" fill="#f472b6" stroke="#9d174d" strokeWidth="3" />

              {/* Right Side: Snow-Capped Jagged Frostpeak Mountains */}
              <polygon points="400,320 440,210 480,320" fill="url(#frostpeakGrad)" stroke="#0369a1" strokeWidth="3" />
              <polygon points="440,210 430,240 450,240" fill="#ffffff" />
              <polygon points="440,320 480,230 520,320" fill="url(#frostpeakGrad)" stroke="#0369a1" strokeWidth="3" />
              <polygon points="480,230 470,260 490,260" fill="#ffffff" />
              <polygon points="360,325 395,240 430,325" fill="url(#frostpeakGrad)" stroke="#0369a1" strokeWidth="3" />
            </g>

            {/* ======================================================== */}
            {/* ISLAND 4: SUNFALL DUNES (UPPER-CENTER)                   */}
            {/* ======================================================== */}
            <g id="island-sunfall-dunes" className="cursor-pointer group">
              <path d="M 640 320 C 640 400, 840 400, 850 320 L 840 280 C 780 260, 680 260, 640 320 Z" fill="#92400e" />
              <ellipse cx="745" cy="305" rx="100" ry="45" fill="url(#dunesGrad)" stroke="#b45309" strokeWidth="3" />
              
              {/* Oasis Pond */}
              <ellipse cx="740" cy="305" rx="35" ry="16" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
              {/* Palm Trees */}
              <circle cx="690" cy="285" r="12" fill="#15803d" />
              <circle cx="780" cy="285" r="14" fill="#15803d" />
            </g>

            {/* ======================================================== */}
            {/* ISLAND 5: CELESTIA (TOP-RIGHT / BATTLE ARENA)            */}
            {/* ======================================================== */}
            <g id="island-celestia" className="cursor-pointer group" onClick={() => setTab('battle')}>
              {/* Floating Cloud & Marble Base */}
              <path d="M 920 270 C 920 370, 1150 370, 1170 270 L 1150 220 C 1080 200, 960 210, 920 270 Z" fill="#78350f" />
              <ellipse cx="1040" cy="255" rx="115" ry="55" fill="#f8fafc" stroke="#64748b" strokeWidth="3" />
              
              {/* Glowing Fountain of Power */}
              <ellipse cx="1040" cy="255" rx="35" ry="18" fill="#38bdf8" stroke="#0284c7" strokeWidth="3" />
              <path d="M 1040 255 L 1040 230" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />

              {/* Marble Columns & Sacred Temple Arches */}
              <rect x="970" y="225" width="10" height="30" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
              <rect x="995" y="220" width="10" height="35" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
              <rect x="1080" y="220" width="10" height="35" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
              <rect x="1105" y="225" width="10" height="30" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
              <polygon points="965,220 1040,195 1115,220" fill="#f1f5f9" stroke="#475569" strokeWidth="2" />
            </g>

            {/* ======================================================== */}
            {/* ISLAND 6: FIREFORGE (BOTTOM-RIGHT / WORD FORGE)          */}
            {/* ======================================================== */}
            <g id="island-fireforge" className="cursor-pointer group" onClick={() => setTab('forge')}>
              {/* Jagged Dark Basalt Platform */}
              <path d="M 820 620 C 820 740, 1080 740, 1100 620 L 1080 570 C 1000 540, 880 550, 820 620 Z" fill="#1c1917" />
              <ellipse cx="950" cy="610" rx="125" ry="60" fill="#292524" stroke="#7f1d1d" strokeWidth="4" />

              {/* Fiery Active Volcano Caldera */}
              <polygon points="890,610 950,510 1010,610" fill="#1c1917" stroke="#78350f" strokeWidth="3" />
              {/* Crater Lava Top */}
              <ellipse cx="950" cy="515" rx="22" ry="10" fill="#f97316" className="animate-pulse" />
              
              {/* Magma Rivers Flowing Down */}
              <path d="M 950 520 Q 940 560 920 610" fill="none" stroke="url(#lavaGrad)" strokeWidth="6" strokeLinecap="round" />
              <path d="M 955 520 Q 970 560 985 610" fill="none" stroke="url(#lavaGrad)" strokeWidth="5" strokeLinecap="round" />
              <path d="M 915 605 Q 950 630 1020 615" fill="none" stroke="url(#lavaGrad)" strokeWidth="7" strokeLinecap="round" />
            </g>

            {/* ======================================================== */}
            {/* ISLAND 7: TREETOP CANOPY (FAR-RIGHT / PET HATCHERY)      */}
            {/* ======================================================== */}
            <g id="island-treetop-canopy" className="cursor-pointer group" onClick={() => setActiveModal('hatchery')}>
              {/* Earth Crust */}
              <path d="M 1060 560 C 1060 700, 1340 700, 1360 560 L 1330 510 C 1240 480, 1120 490, 1060 560 Z" fill="url(#cliffGrad)" />
              <ellipse cx="1200" cy="545" rx="130" ry="60" fill="url(#grassGrad)" stroke="#166534" strokeWidth="4" />
              
              {/* Giant Ancient Gnarled Tree Trunk */}
              <path d="M 1160 540 Q 1190 420 1170 330 Q 1230 420 1240 540 Z" fill="#78350f" stroke="#451a03" strokeWidth="4" />
              
              {/* Massive Green Canopy */}
              <circle cx="1140" cy="320" r="45" fill="#15803d" stroke="#14532d" strokeWidth="3" />
              <circle cx="1200" cy="290" r="55" fill="#22c55e" stroke="#14532d" strokeWidth="3" />
              <circle cx="1260" cy="330" r="45" fill="#16a34a" stroke="#14532d" strokeWidth="3" />

              {/* Wooden Treehouses with Red & Orange Roofs */}
              <rect x="1130" y="320" width="30" height="25" fill="#fef3c7" stroke="#451a03" strokeWidth="2" />
              <polygon points="1125,320 1145,300 1165,320" fill="#dc2626" stroke="#451a03" strokeWidth="2" />

              <rect x="1220" y="340" width="32" height="26" fill="#fef3c7" stroke="#451a03" strokeWidth="2" />
              <polygon points="1215,340 1236,320 1257,340" fill="#ea580c" stroke="#451a03" strokeWidth="2" />

              {/* Treehouse Entrance Hollow */}
              <ellipse cx="1195" cy="500" rx="12" ry="18" fill="#292524" />
            </g>

            {/* ======================================================== */}
            {/* ISLAND 8: GALLEON'S REST (BOTTOM-CENTER / LEXI-SHOP)     */}
            {/* ======================================================== */}
            <g id="island-galleons-rest" className="cursor-pointer group" onClick={() => setActiveModal('shop')}>
              {/* Sandbar Island in the Water */}
              <ellipse cx="680" cy="740" rx="75" ry="32" fill="#fde047" stroke="#ca8a04" strokeWidth="3" />
              {/* Water Ripples around Sandbar */}
              <ellipse cx="680" cy="742" rx="88" ry="38" fill="none" stroke="#e0f2fe" strokeWidth="3" opacity="0.8" />

              {/* Stranded Pirate Galleon Ship */}
              {/* Hull */}
              <path d="M 640 730 Q 680 755 730 730 L 735 715 Q 680 725 635 715 Z" fill="#92400e" stroke="#451a03" strokeWidth="3" />
              {/* Main Mast & Sails */}
              <line x1="680" y1="720" x2="680" y2="660" stroke="#451a03" strokeWidth="4" />
              <path d="M 660 670 Q 685 660 705 675 L 700 705 Q 680 690 660 705 Z" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
              {/* Pirate Flag */}
              <polygon points="680,660 700,667 680,674" fill="#dc2626" />
              
              {/* Palm Trees on Sandbar */}
              <path d="M 630 735 Q 625 715 620 700" fill="none" stroke="#78350f" strokeWidth="3" />
              <circle cx="620" cy="695" r="10" fill="#15803d" />
              <path d="M 730 735 Q 735 715 740 700" fill="none" stroke="#78350f" strokeWidth="3" />
              <circle cx="740" cy="695" r="10" fill="#15803d" />
            </g>

            {/* ======================================================== */}
            {/* ISLAND 9: FAR-LEFT STONE STELE / SHRINE                  */}
            {/* ======================================================== */}
            <g id="island-shrine">
              <ellipse cx="140" cy="510" rx="35" ry="18" fill="#475569" stroke="#1e293b" strokeWidth="2" />
              <rect x="135" y="475" width="10" height="28" fill="#64748b" stroke="#0f172a" strokeWidth="1.5" />
              <polygon points="140,465 148,475 132,475" fill="#facc15" />
            </g>

          </svg>

          {/* ======================================================== */}
          {/* INTERACTIVE WOODEN SIGNBOARDS & HOTSPOTS OVER ISLANDS    */}
          {/* ======================================================== */}

          {/* 3. Pinkwood & Frostpeak (Top-Left / Pet Roster) */}
          <div
            style={{ position: 'absolute', left: '20%', top: '38%' }}
            onClick={() => {
              playSfx(620);
              setActiveModal('roster');
            }}
            className="group flex items-center gap-2 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition"
          >
            <div className="rounded-xl border-3 border-[#831843] bg-gradient-to-b from-[#f472b6] to-[#db2777] px-3 py-1 text-center shadow-[0_4px_0_#831843]">
              <span className="font-serif text-xs sm:text-sm font-black text-white drop-shadow">
                Pinkwood
              </span>
            </div>

            <div className="rounded-xl border-3 border-[#0c4a6e] bg-gradient-to-b from-[#7dd3fc] to-[#0284c7] px-3 py-1 text-center shadow-[0_4px_0_#0c4a6e]">
              <span className="font-serif text-xs sm:text-sm font-black text-white drop-shadow">
                Frostpeak
              </span>
            </div>
          </div>

          {/* 4. Sunfall Dunes (Upper-Center) */}
          <div
            style={{ position: 'absolute', left: '52%', top: '32%' }}
            className="group flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="rounded-xl border-3 border-[#78350f] bg-gradient-to-b from-[#fde68a] to-[#d97706] px-3.5 py-1 text-center shadow-[0_4px_0_#78350f]">
              <span className="font-serif text-xs sm:text-sm font-black text-[#451a03]">
                Sunfall Dunes
              </span>
            </div>
          </div>

          {HUB_DESTINATIONS.map((destination) => (
            <button
              key={destination.id}
              type="button"
              onClick={() => openHubDestination(destination.id)}
              aria-label={`${destination.label} at ${destination.islandName}`}
              aria-current={activeTab === destination.id ? 'page' : undefined}
              title={`Open ${destination.label}`}
              style={{ left: `${destination.x}%`, top: `${destination.y}%` }}
              className={`group absolute z-10 flex min-h-12 -translate-x-1/2 -translate-y-1/2 touch-manipulation flex-col items-center justify-center rounded-2xl border-2 border-white/90 bg-gradient-to-r ${destination.tone} px-3 py-1.5 text-center text-white shadow-[0_4px_0_rgba(71,35,20,0.7)] transition duration-150 hover:z-20 hover:scale-110 hover:brightness-110 focus-visible:z-20 focus-visible:outline focus-visible:outline-4 focus-visible:outline-amber-200 active:translate-y-0`}
            >
              <span className="whitespace-nowrap font-serif text-[11px] font-black leading-tight drop-shadow sm:text-sm">
                {destination.emoji} {destination.label}
              </span>
              <span className="mt-0.5 whitespace-nowrap text-[8px] font-extrabold leading-tight text-white/95 sm:text-[10px]">
                {destination.islandName}
              </span>
            </button>
          ))}

        </div>

      </main>

      {/* ======================================================== */}
      {/* 3. BOTTOM HUD (EXACT MATCH TO REFERENCE PHOTO IMG_4204)  */}
      {/* ======================================================== */}
      <footer className="absolute bottom-0 left-0 right-0 z-30 flex flex-wrap items-end justify-between p-2 sm:p-4 pointer-events-none">
        
        {/* Bottom-Left: Daily Tasks, Backpack, Chat */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 pointer-events-auto">
          
          {/* Daily Tasks Button */}
          <button
            type="button"
            onClick={() => {
              playSfx(650);
              setActiveModal('quests');
            }}
            title="Daily Quests Progress"
            className="flex flex-col items-center justify-center rounded-2xl border-3 border-[#381a07] bg-gradient-to-b from-amber-100 to-amber-200 p-2 shadow-[0_4px_0_#381a07] hover:scale-105 active:translate-y-1 transition cursor-pointer"
          >
            <div className="relative">
              <span className="text-xl sm:text-2xl">📋</span>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-black text-white">
                ✓
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-black text-[#5a2e12] leading-tight">
              Daily Quests
            </span>
            <span className="text-[8px] font-bold text-[#8c4617]">(3/5)</span>
          </button>

          {/* Backpack (Arsenal / Inventory) */}
          <button
            type="button"
            onClick={() => {
              playSfx(580);
              setTab('loadout');
            }}
            title="Open Backpack / Word Arsenal"
            className="flex flex-col items-center justify-center rounded-2xl border-3 border-[#381a07] bg-gradient-to-b from-[#b45309] to-[#78350f] p-2 text-white shadow-[0_4px_0_#381a07] hover:scale-105 active:translate-y-1 transition cursor-pointer"
          >
            <Backpack className="h-6 w-6 text-amber-200" />
            <span className="text-[9px] sm:text-[10px] font-black">Inventory</span>
          </button>

          {/* Chat / Lore */}
          <button
            type="button"
            onClick={cycleSpeech}
            title="Companion Dialogue &amp; Lore"
            className="flex flex-col items-center justify-center rounded-2xl border-3 border-[#381a07] bg-gradient-to-b from-sky-400 to-blue-600 p-2 text-white shadow-[0_4px_0_#381a07] hover:scale-105 active:translate-y-1 transition cursor-pointer"
          >
            <MessageSquare className="h-6 w-6 text-white" />
            <span className="text-[9px] sm:text-[10px] font-black">Chat</span>
          </button>

        </div>

        {/* Bottom-Center: BIG GREEN PLAY/ENTER BUTTON + 4 GRAMMAR SPELL CARDS */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 pointer-events-auto mx-auto my-1 sm:my-0">
          
          {/* Big Green Play / Enter Button */}
          <button
            type="button"
            onClick={() => {
              juice.fanfare();
              setActiveModal('story');
            }}
            className="group flex items-center justify-center gap-2 sm:gap-3 rounded-3xl border-4 border-[#14532d] bg-gradient-to-r from-[#84cc16] via-[#22c55e] to-[#15803d] px-6 sm:px-10 py-2.5 sm:py-3 text-base sm:text-xl font-black uppercase tracking-wider text-white shadow-[0_5px_0_#14532d] hover:scale-103 hover:brightness-110 active:translate-y-1 active:shadow-none transition cursor-pointer"
          >
            <span>Play/Enter</span>
            <Star className="h-5 w-5 sm:h-6 sm:w-6 fill-amber-300 text-amber-200 group-hover:rotate-45 transition-transform" />
          </button>

          {/* The 4 Grammar Synergy Cards matching IMG_4204 */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* 1. Adjective Attack */}
            <div
              title="Adjective Attack: Modifier adds physical burst damage"
              className="flex flex-col items-center justify-center w-12 sm:w-14 h-14 sm:h-16 rounded-xl border-2 border-[#7f1d1d] bg-gradient-to-b from-red-500 to-rose-600 p-1 text-center shadow-xs"
            >
              <Swords className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              <span className="text-[8px] sm:text-[9px] font-black text-white leading-tight mt-0.5">
                Adjective
              </span>
              <span className="text-[7px] sm:text-[8px] font-bold text-red-200">Attack</span>
            </div>

            {/* 2. Noun Defense */}
            <div
              title="Noun Defense: Concrete nouns grant defensive fortitude"
              className="flex flex-col items-center justify-center w-12 sm:w-14 h-14 sm:h-16 rounded-xl border-2 border-[#1e3a8a] bg-gradient-to-b from-blue-500 to-indigo-600 p-1 text-center shadow-xs"
            >
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              <span className="text-[8px] sm:text-[9px] font-black text-white leading-tight mt-0.5">
                Noun
              </span>
              <span className="text-[7px] sm:text-[8px] font-bold text-blue-200">Defense</span>
            </div>

            {/* 3. Adverb Multiplier */}
            <div
              title="Adverb Multiplier: Boosts speed and combo frequency"
              className="flex flex-col items-center justify-center w-12 sm:w-14 h-14 sm:h-16 rounded-xl border-2 border-[#581c87] bg-gradient-to-b from-purple-500 to-violet-700 p-1 text-center shadow-xs"
            >
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              <span className="text-[8px] sm:text-[9px] font-black text-white leading-tight mt-0.5">
                Adverb
              </span>
              <span className="text-[7px] sm:text-[8px] font-bold text-purple-200">Multiplier</span>
            </div>

            {/* 4. Synergy Boost */}
            <div
              title="Synergy Boost: Root and affix fusions unleash elemental surge"
              className="flex flex-col items-center justify-center w-12 sm:w-14 h-14 sm:h-16 rounded-xl border-2 border-[#b45309] bg-gradient-to-b from-amber-400 via-orange-500 to-amber-600 p-1 text-center shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse"
            >
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              <span className="text-[8px] sm:text-[9px] font-black text-white leading-tight mt-0.5">
                Synergy
              </span>
              <span className="text-[7px] sm:text-[8px] font-bold text-amber-200">Boost</span>
            </div>

          </div>

        </div>

        {/* Bottom-Right: Profile, Mail, Settings, Social, Quest Log */}
        <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto">
          
          {/* Profile */}
          <button
            type="button"
            onClick={() => setIsCustomizingAvatar(true)}
            title="Edit Character &amp; Title"
            className="flex flex-col items-center justify-center rounded-2xl border-3 border-[#381a07] bg-gradient-to-b from-sky-400 to-blue-500 p-1.5 sm:p-2 text-white shadow-[0_4px_0_#381a07] hover:scale-105 active:translate-y-1 transition cursor-pointer"
          >
            <span className="text-lg sm:text-xl">👤</span>
            <span className="text-[8px] sm:text-[9px] font-black">Profile</span>
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => setActiveModal('settings')}
            title="Game Settings &amp; Audio"
            className="flex flex-col items-center justify-center rounded-2xl border-3 border-[#381a07] bg-gradient-to-b from-slate-200 to-slate-400 p-1.5 sm:p-2 text-slate-800 shadow-[0_4px_0_#381a07] hover:scale-105 active:translate-y-1 transition cursor-pointer"
          >
            <Settings className="h-5 w-5 text-slate-800" />
            <span className="text-[8px] sm:text-[9px] font-black">Settings</span>
          </button>

          {/* Social */}
          <button
            type="button"
            onClick={() => setActiveModal('roster')}
            title="Classroom Explorers"
            className="flex flex-col items-center justify-center rounded-2xl border-3 border-[#381a07] bg-gradient-to-b from-amber-300 to-orange-400 p-1.5 sm:p-2 text-white shadow-[0_4px_0_#381a07] hover:scale-105 active:translate-y-1 transition cursor-pointer"
          >
            <Users className="h-5 w-5 text-white" />
            <span className="text-[8px] sm:text-[9px] font-black">Social</span>
          </button>

          {/* Quest Log */}
          <button
            type="button"
            onClick={() => setActiveModal('story')}
            title="Story Realms &amp; Quest Log"
            className="flex flex-col items-center justify-center rounded-2xl border-3 border-[#381a07] bg-gradient-to-b from-amber-100 to-amber-200 p-1.5 sm:p-2 shadow-[0_4px_0_#381a07] hover:scale-105 active:translate-y-1 transition cursor-pointer"
          >
            <BookOpen className="h-5 w-5 text-amber-800" />
            <span className="text-[8px] sm:text-[9px] font-black text-[#5a2e12]">Quest Log</span>
          </button>

        </div>

      </footer>

      {/* ======================================================== */}
      {/* 4. SYSTEM MODALS (HATCHERY, SHOP, ROSTER, STORY, QUESTS) */}
      {/* ======================================================== */}

      {/* A. NINE ELEMENTAL WORD WORLD AREAS */}
      {activeModal === 'story' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border-4 border-[#5a2e12] bg-[#fffaf2] p-5 sm:p-7 shadow-[0_10px_0_#5a2e12] space-y-4 my-auto max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b-3 border-amber-200 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🗺️</span>
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-black text-[#542d1d]">
                Word World · Elemental Areas
                  </h3>
                  <p className="text-xs font-bold text-[#824c16]">
                Explore nine regions, learn new words, and challenge the area guardians.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-xl border-2 border-[#5a2e12] p-1.5 text-slate-500 hover:text-black hover:bg-amber-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List of Tiers */}
            <div className="space-y-3">
              {WORLD_TIERS.map((tier, index) => {
                const progress = zoneProgress[tier.id] || { stars: 0, cleared: false };
                const previousTier = WORLD_TIERS[index - 1];
                const isLocked = Boolean(previousTier && !zoneProgress[previousTier.id]?.cleared);

                return (
                  <div
                    key={tier.id}
                    className={`flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border-3 ${tier.borderColor} bg-white p-3.5 shadow-xs transition hover:shadow-md`}
                  >
                    <div className="flex items-center gap-3 text-center sm:text-left">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#5a2e12] bg-gradient-to-b ${tier.bgGradient} text-2xl shadow-xs`}>
                        {tier.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <span className="rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black uppercase px-1.5 py-0.2">
                            Area {tier.tierNumber} of {WORLD_TIERS.length}
                          </span>
                          <span className="text-[10px] font-black" style={{ color: ELEMENTS[tier.element].color }}>
                            {ELEMENTS[tier.element].icon} {ELEMENTS[tier.element].name}
                          </span>
                        </div>
                        <h4 className="font-serif text-base font-black text-[#542d1d]">
                          {tier.name}
                        </h4>
                        <p className="text-xs text-slate-600 font-bold">
                          {tier.subtitle} · {progress.cleared ? `Cleared · ${progress.stars} stars` : `Guardian: ${tier.boss.name} ${tier.boss.spriteEmoji}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTier(tier);
                          handlePronounce(tier.name);
                        }}
                        className="rounded-xl border-2 border-[#5a2e12] bg-amber-100 hover:bg-amber-200 px-3 py-2 text-xs font-black uppercase text-[#542d1d] shadow-xs cursor-pointer"
                      >
                        <BookOpen className="h-3.5 w-3.5 inline mr-1" />
                        <span>Vocab</span>
                      </button>

                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => {
                          setActiveModal(null);
                          handleLaunchBattle(tier);
                        }}
                        title={isLocked ? `Clear ${previousTier?.name} to unlock this area` : `Battle in ${tier.name}`}
                        className="flex items-center gap-1.5 rounded-xl border-2 border-[#5a2e12] bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 text-xs font-black uppercase text-white shadow-xs enabled:hover:brightness-110 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <Swords className="h-4 w-4" />
                        <span>{isLocked ? 'Locked' : 'Battle'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Tier Vocab Lesson Preview */}
            {selectedTier && (
              <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-base font-black text-emerald-950">
                    💡 Area {selectedTier.tierNumber} Lesson: {selectedTier.theme}
                  </h4>
                  <button
                    type="button"
                    onClick={() => handlePronounce(selectedTier.vocabConcept)}
                    className="flex items-center gap-1 rounded-lg bg-emerald-200 px-2 py-0.5 text-[11px] font-black text-emerald-900 cursor-pointer"
                  >
                    <Volume2 className="h-3 w-3" />
                    <span>Listen</span>
                  </button>
                </div>
                <p className="text-xs font-bold text-emerald-900">
                  {selectedTier.vocabConcept}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedTier.keyRootsOrAffixes.map((root) => (
                    <span
                      key={root}
                      className="rounded-lg border border-emerald-300 bg-white px-2 py-0.5 text-xs font-black text-emerald-950"
                    >
                      {root}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* B. PET HATCHERY MODAL (TREETOP CANOPY) */}
      {activeModal === 'hatchery' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border-4 border-[#b57a1b] bg-[#fffcee] p-6 shadow-[0_8px_0_#b57a1b] text-center space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                🥚 Treetop Canopy · Pet Hatchery
              </span>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-black font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-2">
              <span className="text-7xl inline-block animate-bounce">🥚</span>
              <h3 className="font-serif text-2xl font-black text-[#5a3b0a] mt-2">
                Lexi-Egg Ready to Hatch!
              </h3>
              <p className="text-xs font-bold text-amber-900 mt-1">
                Treetop Canopy nests allow you to hatch elemental pets, word cards &amp; rewards!
              </p>
            </div>

            <div className="rounded-2xl border-2 border-amber-300 bg-amber-100/70 p-3 text-xs font-black text-amber-950">
              Reward: <strong>+150 Lexi-Coins</strong> &amp; <strong>+2 Fusion Tokens</strong>!
            </div>

            <button
              type="button"
              onClick={() => {
                juice.fanfare();
                updateProfile({
                  lexiCoins: (currentUser?.lexiCoins ?? 450) + 150,
                  fusionTokens: (currentUser?.fusionTokens ?? 14) + 2,
                });
                setActiveModal(null);
              }}
              className="w-full rounded-2xl border-3 border-[#5a2e12] bg-gradient-to-r from-amber-400 to-orange-400 py-3 text-sm font-black uppercase text-white shadow-[0_4px_0_#5a2e12] hover:brightness-105 active:translate-y-1 cursor-pointer"
            >
              ✨ Hatch Free Lexi-Egg Now!
            </button>
          </div>
        </div>
      )}

      {/* C. THE LEXI-SHOP MODAL (GALLEON'S REST) */}
      {activeModal === 'shop' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border-4 border-[#1b6b88] bg-[#f0fbff] p-6 shadow-[0_8px_0_#1b6b88] space-y-4">
            
            <div className="flex justify-between items-center border-b-2 border-sky-200 pb-2">
              <div>
                <h3 className="font-serif text-xl font-black text-[#13495d]">
                  🛍️ Galleon's Rest · Lexi-Shop
                </h3>
                <p className="text-[11px] font-bold text-sky-800">
                  Your Balance: {coins.toLocaleString()} 🪙
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-black font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-2xl border-2 border-sky-300 bg-white p-3 shadow-xs">
                <div>
                  <span className="font-black text-slate-800 block text-sm">✨ Mystery Word Booster</span>
                  <span className="text-[10px] text-slate-500">Unlocks 2 random vocabulary cards</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if ((currentUser?.lexiCoins ?? 0) >= 100) {
                      juice.ding(800, 100);
                      updateProfile({ lexiCoins: (currentUser?.lexiCoins ?? 450) - 100 });
                      setActiveModal(null);
                    }
                  }}
                  className="rounded-xl bg-sky-500 px-3 py-2 font-black text-white hover:bg-sky-600 cursor-pointer shadow-xs"
                >
                  100 🪙
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl border-2 border-sky-300 bg-white p-3 shadow-xs">
                <div>
                  <span className="font-black text-slate-800 block text-sm">🧪 Fusion Catalyst Vials</span>
                  <span className="text-[10px] text-slate-500">+5 Fusion Tokens for the Forge</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if ((currentUser?.lexiCoins ?? 0) >= 150) {
                      juice.ding(900, 100);
                      updateProfile({
                        lexiCoins: (currentUser?.lexiCoins ?? 450) - 150,
                        fusionTokens: (currentUser?.fusionTokens ?? 14) + 5,
                      });
                      setActiveModal(null);
                    }
                  }}
                  className="rounded-xl bg-purple-600 px-3 py-2 font-black text-white hover:bg-purple-700 cursor-pointer shadow-xs"
                >
                  150 🪙
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* D. PET ROSTER MODAL (PINKWOOD & FROSTPEAK - WITH EVOLUTION MECHANIC) */}
      {activeModal === 'roster' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl border-4 border-pink-500 bg-[#fff5f8] p-5 sm:p-6 shadow-[0_8px_0_#db2777] space-y-4 max-h-[92vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b-2 border-pink-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🐾</span>
                  <h3 className="font-serif text-xl sm:text-2xl font-black text-pink-950">
                    Pinkwood &amp; Frostpeak · Pet Roster
                  </h3>
                </div>
                <p className="text-xs font-bold text-pink-800 mt-0.5">
                  Train companions to reach <strong>Level 10</strong> &amp; <strong>Level 20</strong> to trigger powerful Metamorphic Evolutions!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-xl border-2 border-pink-400 p-1 text-slate-500 hover:text-black font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {unlockedCreatures.map((c) => {
                const isActive = c.id === playerId;
                const petLevel = c.level || 8;
                const petStage = c.stage || 1;
                const nextEvolution = getNextEvolutionStage(c);
                const isReadyToEvolve = canPetEvolve(c);

                return (
                  <div
                    key={c.id}
                    className={`flex flex-col gap-3 rounded-2xl border-3 p-3.5 transition ${
                      isActive
                        ? 'border-pink-500 bg-white ring-3 ring-pink-300 shadow-sm'
                        : 'border-[#5a2e12] bg-white/95 hover:bg-white'
                    }`}
                  >
                    {/* Top Row: Sprite, Name, Level, Element & Stage */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#5a2e12] bg-gradient-to-b from-amber-100 to-amber-200 text-3xl shadow-xs">
                          <span>{c.spriteEmoji || ELEMENTS[c.element].icon}</span>
                          <span className="absolute -bottom-2 -left-1 rounded-full border border-[#5a2e12] bg-amber-400 px-1 text-[9px] font-black text-[#5a2e12]">
                            Lv.{petLevel}
                          </span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="font-serif text-base sm:text-lg font-black text-[#542d1d]">
                              {c.name}
                            </h4>
                            <span className="rounded-full bg-pink-100 border border-pink-300 px-2 py-0.2 text-[9px] font-black uppercase text-pink-900">
                              Stage {petStage}
                            </span>
                            <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.2 text-[9px] font-black uppercase text-amber-900">
                              {c.element.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 block">
                            {c.title || 'Companion Beast'}
                          </span>
                        </div>
                      </div>

                      {/* Select / Active Lead button */}
                      <button
                        type="button"
                        onClick={() => {
                          setPlayerId(c.id);
                          playSfx(750);
                        }}
                        className={`rounded-xl px-3 py-1.5 text-xs font-black uppercase transition cursor-pointer shadow-xs ${
                          isActive
                            ? 'bg-emerald-500 text-white border-2 border-emerald-600'
                            : 'bg-amber-200 text-[#542d1d] hover:bg-amber-300 border-2 border-amber-300'
                        }`}
                      >
                        {isActive ? '✓ Active Lead' : 'Set Lead'}
                      </button>
                    </div>

                    {/* Middle: Stats Matrix */}
                    <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-center text-[10px] font-black text-slate-700">
                      <div>❤️ HP: <span className="font-mono text-slate-900">{c.stats.hp}</span></div>
                      <div>⚔️ ATK: <span className="font-mono text-slate-900">{c.stats.attack}</span></div>
                      <div>🛡️ DEF: <span className="font-mono text-slate-900">{c.stats.defense}</span></div>
                      <div>⚡ SPD: <span className="font-mono text-slate-900">{c.stats.speed}</span></div>
                    </div>

                    {/* Bottom: Evolution Readiness & Training Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
                      
                      {/* Evolution Status Info */}
                      <div className="text-xs font-bold">
                        {isReadyToEvolve && nextEvolution ? (
                          <div className="flex items-center gap-1.5 text-amber-600 font-black animate-pulse">
                            <span>✨</span>
                            <span>Ready to evolve into <strong>{nextEvolution.name}</strong> ({nextEvolution.spriteEmoji})!</span>
                          </div>
                        ) : nextEvolution ? (
                          <div className="text-slate-500 text-[11px]">
                            <span>Evolves into <strong>{nextEvolution.name}</strong> ({nextEvolution.spriteEmoji}) at <strong>Lv.{nextEvolution.minLevel}</strong></span>
                            <span className="ml-1 text-amber-700 font-extrabold">({Math.max(0, nextEvolution.minLevel - petLevel)} lvls left)</span>
                          </div>
                        ) : (
                          <div className="text-emerald-700 text-[11px] font-black">
                            👑 Fully Ascended Apex Form!
                          </div>
                        )}
                      </div>

                      {/* Interactive Buttons: Evolve or Train */}
                      <div className="flex items-center gap-2">
                        {/* Quick Level Up Training Button */}
                        <button
                          type="button"
                          onClick={() => {
                            levelUpPet(c.id, 1);
                            juice.ding(700, 100);
                          }}
                          title="Feed Vocabulary Treat (+1 Level)"
                          className="rounded-xl border border-amber-300 bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 text-[11px] font-black text-amber-900 transition active:translate-y-0.5 cursor-pointer shadow-xs"
                        >
                          ⚡ Train (+1 Lv)
                        </button>

                        {/* Evolution Trigger Button */}
                        {isReadyToEvolve && (
                          <button
                            type="button"
                            onClick={() => {
                              playSfx(950);
                              setEvolvingCreature(c);
                            }}
                            className="group flex items-center gap-1.5 rounded-xl border-2 border-amber-500 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_3px_0_#b45309] hover:scale-105 active:translate-y-0.5 transition cursor-pointer animate-bounce"
                          >
                            <Sparkles className="h-4 w-4 group-hover:rotate-45 transition-transform" />
                            <span>✨ EVOLVE!</span>
                          </button>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveModal(null);
                setTab('loadout');
              }}
              className="w-full rounded-2xl border-3 border-[#5a2e12] bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-black uppercase text-white shadow-xs cursor-pointer"
            >
              🎒 Open Arsenal to Equip Word Cards
            </button>
          </div>
        </div>
      )}

      {/* E. QUESTS & DAILY TASKS MODAL */}
      {activeModal === 'quests' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border-4 border-[#5a2e12] bg-[#fffaf2] p-6 shadow-[0_8px_0_#5a2e12] space-y-4">
            
            <div className="flex justify-between items-center border-b-2 border-amber-200 pb-2">
              <div>
                <h3 className="font-serif text-xl font-black text-[#542d1d]">
                  📋 Daily Vocabulary Quests
                </h3>
                <p className="text-xs font-bold text-[#824c16]">
                  Complete challenges to earn Lexi-Coins!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-black font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="rounded-2xl border-2 border-amber-300 bg-white p-3 space-y-1">
                <div className="flex justify-between font-black text-amber-900">
                  <span>✨ Adjective Ace</span>
                  <span>+75 🪙</span>
                </div>
                <p className="text-[11px] text-slate-600 font-bold">Unleash 2 Adjectives in battle or quizzes</p>
                <div className="h-2 rounded-full bg-amber-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 w-full" />
                </div>
              </div>

              <div className="rounded-2xl border-2 border-purple-300 bg-white p-3 space-y-1">
                <div className="flex justify-between font-black text-purple-900">
                  <span>🧬 Morphology Crafter</span>
                  <span>+100 🪙</span>
                </div>
                <p className="text-[11px] text-slate-600 font-bold">Fuse roots &amp; prefixes in the Word Forge</p>
                <div className="h-2 rounded-full bg-purple-100 overflow-hidden">
                  <div className="h-full bg-purple-500 w-full" />
                </div>
              </div>

              <div className="rounded-2xl border-2 border-rose-300 bg-white p-3 space-y-1">
                <div className="flex justify-between font-black text-rose-900">
                  <span>⚔️ Elemental Tactician</span>
                  <span>+90 🪙</span>
                </div>
                <p className="text-[11px] text-slate-600 font-bold">Win battles using element advantages</p>
                <div className="h-2 rounded-full bg-rose-100 overflow-hidden">
                  <div className="h-full bg-rose-500 w-3/4" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                juice.ding(900, 100);
                updateProfile({ lexiCoins: (currentUser?.lexiCoins ?? 450) + 100 });
                setActiveModal(null);
              }}
              className="w-full rounded-2xl border-3 border-[#5a2e12] bg-gradient-to-r from-amber-400 to-orange-400 py-2.5 text-xs font-black uppercase text-white shadow-xs cursor-pointer"
            >
              🎁 Claim All Ready Rewards (+100 🪙)
            </button>
          </div>
        </div>
      )}

      {/* F. EVENTS MODAL */}
      {activeModal === 'events' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border-4 border-[#b93815] bg-[#fff5ea] p-6 shadow-[0_8px_0_#b93815] text-center space-y-4">
            <span className="text-6xl animate-bounce block">🔥</span>
            <h3 className="font-serif text-2xl font-black text-[#5e2009]">5-Day Streak Active!</h3>
            <p className="text-xs font-bold text-[#8f4320]">
              Log in every school day to maintain your streak and earn free Lexi-Coins &amp; Fusion Tokens!
            </p>
            <div className="rounded-2xl border-2 border-orange-300 bg-orange-100 p-3 text-xs font-black text-orange-900">
              Daily Bonus: <strong>+100 Lexi-Coins</strong> &amp; <strong>+3 Fusion Tokens</strong>
            </div>
            <button
              type="button"
              onClick={() => {
                juice.fanfare();
                updateProfile({
                  lexiCoins: (currentUser?.lexiCoins ?? 450) + 100,
                  fusionTokens: (currentUser?.fusionTokens ?? 14) + 3,
                });
                setActiveModal(null);
              }}
              className="w-full rounded-2xl border-3 border-[#5a2e12] bg-gradient-to-r from-orange-500 to-red-500 py-3 text-sm font-black uppercase text-white shadow-[0_4px_0_#5a2e12] hover:brightness-105 active:translate-y-1 cursor-pointer"
            >
              🎁 Claim Streak Bonus!
            </button>
          </div>
        </div>
      )}

      {/* G. SCHOLAR MAIL MODAL */}
      {activeModal === 'mail' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border-4 border-[#5a2e12] bg-[#fffaf2] p-6 shadow-[0_8px_0_#5a2e12] space-y-4">
            <div className="flex justify-between items-center border-b-2 border-amber-200 pb-2">
              <h3 className="font-serif text-xl font-black text-[#542d1d]">📬 Scholar Mail</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-black font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="rounded-2xl border-2 border-amber-300 bg-white p-3 space-y-1">
                <span className="font-black text-[#5a2e12] block">Welcome to the Lexi Archipelago!</span>
                <p className="text-slate-600 font-bold">
                  Explore each floating island to level up your vocabulary, forge word compounds, and conquer elemental bosses!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* H. SETTINGS & LOGOUT MODAL */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border-4 border-[#5a2e12] bg-[#fffaf2] p-6 shadow-[0_8px_0_#5a2e12] text-center space-y-4">
            <h3 className="font-serif text-xl font-black text-[#542d1d]">Game Settings</h3>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={toggleMute}
                className="w-full flex items-center justify-between rounded-2xl border-2 border-[#5a2e12] bg-white p-3 text-xs font-black text-[#542d1d] shadow-xs cursor-pointer hover:bg-amber-50"
              >
                <span>Sound Audio Effects:</span>
                <span className={isMuted ? 'text-red-600' : 'text-emerald-600'}>
                  {isMuted ? 'Muted 🔇' : 'Enabled 🔊'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setIsCustomizingAvatar(true);
                }}
                className="w-full flex items-center justify-between rounded-2xl border-2 border-[#5a2e12] bg-white p-3 text-xs font-black text-[#542d1d] shadow-xs cursor-pointer hover:bg-amber-50"
              >
                <span>Explorer Customizer:</span>
                <span>🎨 Edit Avatar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  logout();
                }}
                className="w-full rounded-2xl border-3 border-red-500 bg-red-50 hover:bg-red-100 py-3 text-xs font-black uppercase text-red-700 shadow-xs cursor-pointer"
              >
                🚪 Log Out / Switch Explorer
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="text-xs font-bold text-slate-500 underline cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* I. EVOLUTION SEQUENCE THEATER MODAL */}
      {evolvingCreature && (
        <EvolutionSequenceModal
          creature={evolvingCreature}
          onComplete={(evolved) => {
            evolvePet(evolved.id);
            setEvolvingCreature(null);
          }}
          onClose={() => setEvolvingCreature(null)}
        />
      )}

    </div>
  );
};
