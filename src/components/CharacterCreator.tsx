import React, { useState } from 'react';
import {
  Sparkles,
  Dices,
  Check,
  X,
  Shield,
  Flame,
  Award,
  Crown,
  Smile,
  Palette,
  Shirt,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  AvatarConfig,
  ARCHETYPE_OPTIONS,
  HEADGEAR_OPTIONS,
  OUTFIT_OPTIONS,
  AURA_OPTIONS,
  TITLE_OPTIONS,
  DEFAULT_AVATAR_CONFIG,
} from '../types/auth';
import { juice } from '../engine/juice';

interface CharacterCreatorProps {
  onClose?: () => void;
  isInitialSetup?: boolean;
}

const RANDOM_FIRST_NAMES = [
  'Blaze',
  'Frost',
  'Nova',
  'Storm',
  'Echo',
  'Leaf',
  'Spark',
  'Rune',
  'Aura',
  'Zephyr',
  'Titan',
  'Cosmo',
];

const RANDOM_LAST_NAMES = [
  'Scholar',
  'Knight',
  'Wizard',
  'Ranger',
  'Brawler',
  'Crafter',
  'Explorer',
  'Master',
  'Champion',
  'Seeker',
];

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onClose, isInitialSetup = false }) => {
  const { currentUser, updateAvatar, setIsCustomizingAvatar } = useAuth();

  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || currentUser?.username || 'Lexi Explorer'
  );

  const [config, setConfig] = useState<AvatarConfig>(
    currentUser?.avatarConfig || { ...DEFAULT_AVATAR_CONFIG }
  );

  const [activeTab, setActiveTab] = useState<'creature' | 'headgear' | 'outfit' | 'aura' | 'title'>('creature');

  const selectedArchetype = ARCHETYPE_OPTIONS.find((a) => a.id === config.archetype) || ARCHETYPE_OPTIONS[0];
  const selectedHeadgear = HEADGEAR_OPTIONS.find((h) => h.id === config.headgear) || HEADGEAR_OPTIONS[0];
  const selectedOutfit = OUTFIT_OPTIONS.find((o) => o.id === config.outfit) || OUTFIT_OPTIONS[0];
  const selectedAura = AURA_OPTIONS.find((au) => au.id === config.aura) || AURA_OPTIONS[0];

  const handleRandomizeName = () => {
    const first = RANDOM_FIRST_NAMES[Math.floor(Math.random() * RANDOM_FIRST_NAMES.length)];
    const last = RANDOM_LAST_NAMES[Math.floor(Math.random() * RANDOM_LAST_NAMES.length)];
    setDisplayName(`${first} ${last}`);
    juice.ding(880, 80);
  };

  const handleRandomizeAll = () => {
    const rArchetype = ARCHETYPE_OPTIONS[Math.floor(Math.random() * ARCHETYPE_OPTIONS.length)];
    const rHeadgear = HEADGEAR_OPTIONS[Math.floor(Math.random() * HEADGEAR_OPTIONS.length)];
    const rOutfit = OUTFIT_OPTIONS[Math.floor(Math.random() * OUTFIT_OPTIONS.length)];
    const rAura = AURA_OPTIONS[Math.floor(Math.random() * AURA_OPTIONS.length)];
    const rTitle = TITLE_OPTIONS[Math.floor(Math.random() * TITLE_OPTIONS.length)];

    const first = RANDOM_FIRST_NAMES[Math.floor(Math.random() * RANDOM_FIRST_NAMES.length)];
    const last = RANDOM_LAST_NAMES[Math.floor(Math.random() * RANDOM_LAST_NAMES.length)];
    setDisplayName(`${first} ${last}`);

    setConfig({
      archetype: rArchetype.id,
      emoji: rArchetype.emoji,
      headgear: rHeadgear.id,
      headgearEmoji: rHeadgear.emoji === '✖️' ? '' : rHeadgear.emoji,
      outfit: rOutfit.id,
      aura: rAura.id,
      title: rTitle,
      favoriteElement: (rArchetype.element as any) || 'fire',
      colorTheme: rAura.id === 'ice' ? '#0ea5e9' : rAura.id === 'nature' ? '#10b981' : '#f97316',
    });

    juice.ding(940, 150);
  };

  const handleSave = () => {
    updateAvatar(config, displayName);
    juice.fanfare();
    if (onClose) onClose();
    else setIsCustomizingAvatar(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border-4 border-[#7b4632] bg-[#fffaf0] p-4 sm:p-6 shadow-[0_10px_0_#7b4632] space-y-5 my-auto max-h-[95vh] overflow-y-auto">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-3 border-amber-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎨</span>
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-black text-[#542d1d]">
                Character Customizer
              </h2>
              <p className="text-xs font-bold text-[#8c563d]">
                Design your personal explorer avatar, title &amp; style!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRandomizeAll}
              title="Randomize Everything"
              className="flex items-center gap-1.5 rounded-xl border-2 border-[#7b4632] bg-amber-300 px-3 py-1.5 text-xs font-black uppercase text-[#542d1d] shadow-[0_2px_0_#7b4632] hover:bg-amber-400 active:translate-y-0.5 cursor-pointer"
            >
              <Dices className="h-4 w-4" />
              <span className="hidden sm:inline">Surprise Me!</span>
            </button>

            {!isInitialSetup && (
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  else setIsCustomizingAvatar(false);
                }}
                className="rounded-xl border-2 border-[#7b4632] p-1.5 text-slate-500 hover:text-black hover:bg-amber-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Top Half: Stage Preview & Name Input */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Left: Avatar Stage Preview */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className={`relative flex h-48 w-48 sm:h-52 sm:w-52 items-center justify-center rounded-3xl border-4 ${selectedAura.border} bg-gradient-to-b ${selectedAura.glow} p-4 shadow-inner`}>
              
              {/* Elemental Aura Glow */}
              <div className="absolute inset-0 rounded-3xl bg-white/40 blur-md animate-pulse pointer-events-none"></div>

              {/* Pedestal Base */}
              <div className="absolute bottom-3 h-8 w-36 rounded-full border-3 border-[#7b4632] bg-amber-200 shadow-[0_4px_0_#7b4632]"></div>

              {/* Headgear Layer */}
              {selectedHeadgear.emoji && selectedHeadgear.emoji !== '✖️' && (
                <div className="absolute top-6 z-20 text-4xl sm:text-5xl drop-shadow-md animate-[bounce_2.5s_infinite]">
                  {selectedHeadgear.emoji}
                </div>
              )}

              {/* Creature Sprite */}
              <div className="relative z-10 text-7xl sm:text-8xl drop-shadow-[0_8px_4px_rgba(0,0,0,0.25)] select-none animate-[bounce_3s_ease-in-out_infinite]">
                {selectedArchetype.emoji}
              </div>

              {/* Aura / Element Badge */}
              <span className="absolute top-2 right-2 rounded-full border-2 border-[#7b4632] bg-white p-1 text-sm shadow">
                {selectedAura.icon}
              </span>

              {/* Outfit Tag */}
              <span className="absolute bottom-1 z-20 rounded-full border border-[#7b4632] bg-amber-100 px-2 py-0.5 text-[10px] font-black text-[#542d1d] shadow">
                {selectedOutfit.icon} {selectedOutfit.name}
              </span>
            </div>

            {/* Title & Name Badge */}
            <div className="mt-3 text-center space-y-0.5">
              <span className="inline-block rounded-full border-2 border-[#7b4632] bg-amber-400 px-3 py-0.5 text-[11px] font-black uppercase text-[#542d1d] shadow-xs">
                ★ {config.title} ★
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-black text-[#542d1d]">
                {displayName}
              </h3>
            </div>
          </div>

          {/* Right: Explorer Name & Title Customization */}
          <div className="md:col-span-7 space-y-3 bg-white/80 rounded-2xl border-3 border-[#7b4632] p-4 shadow-sm">
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-[#542d1d]">
                  Explorer Profile Name:
                </label>
                <button
                  type="button"
                  onClick={handleRandomizeName}
                  className="flex items-center gap-1 text-[11px] font-black text-amber-700 hover:text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 cursor-pointer"
                >
                  <Dices className="h-3.5 w-3.5" />
                  <span>🎲 Random Name</span>
                </button>
              </div>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={24}
                placeholder="Enter character name..."
                className="w-full rounded-xl border-2 border-[#7b4632] bg-amber-50 px-3 py-2 text-sm font-bold text-[#542d1d] focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-[#542d1d]">
                Explorer Title Badge:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {TITLE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setConfig((prev) => ({ ...prev, title: t }));
                      juice.ding(700, 60);
                    }}
                    className={`rounded-xl border-2 px-2.5 py-1.5 text-left text-xs font-bold transition cursor-pointer ${
                      config.title === t
                        ? 'border-[#7b4632] bg-amber-300 text-[#542d1d] shadow-[0_2px_0_#7b4632]'
                        : 'border-amber-200 bg-white hover:bg-amber-100 text-[#71432f]'
                    }`}
                  >
                    <span>{t}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Category Tabs for Customizer */}
        <div className="space-y-3">
          <div className="flex rounded-2xl border-3 border-[#7b4632] bg-amber-200/70 p-1 shadow-inner gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('creature');
                juice.ding(600, 60);
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'creature'
                  ? 'border-2 border-[#7b4632] bg-amber-400 text-[#542d1d] shadow-[0_2px_0_#7b4632]'
                  : 'text-[#71432f] hover:bg-amber-300/50'
              }`}
            >
              <span>🐾</span>
              <span className="hidden sm:inline">Creature</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('headgear');
                juice.ding(650, 60);
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'headgear'
                  ? 'border-2 border-[#7b4632] bg-amber-400 text-[#542d1d] shadow-[0_2px_0_#7b4632]'
                  : 'text-[#71432f] hover:bg-amber-300/50'
              }`}
            >
              <span>👑</span>
              <span className="hidden sm:inline">Headgear</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('outfit');
                juice.ding(700, 60);
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'outfit'
                  ? 'border-2 border-[#7b4632] bg-amber-400 text-[#542d1d] shadow-[0_2px_0_#7b4632]'
                  : 'text-[#71432f] hover:bg-amber-300/50'
              }`}
            >
              <span>🥋</span>
              <span className="hidden sm:inline">Outfit</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('aura');
                juice.ding(750, 60);
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'aura'
                  ? 'border-2 border-[#7b4632] bg-amber-400 text-[#542d1d] shadow-[0_2px_0_#7b4632]'
                  : 'text-[#71432f] hover:bg-amber-300/50'
              }`}
            >
              <span>✨</span>
              <span className="hidden sm:inline">Aura</span>
            </button>
          </div>

          {/* Sub-Panel: CREATURE SELECTION */}
          {activeTab === 'creature' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ARCHETYPE_OPTIONS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setConfig((prev) => ({
                      ...prev,
                      archetype: a.id,
                      emoji: a.emoji,
                      favoriteElement: (a.element as any) || 'fire',
                    }));
                    juice.ding(750, 70);
                  }}
                  className={`flex flex-col items-center justify-center rounded-2xl border-3 p-2.5 text-center transition cursor-pointer ${
                    config.archetype === a.id
                      ? 'border-[#7b4632] bg-gradient-to-b from-amber-200 to-amber-300 shadow-[0_4px_0_#7b4632] scale-102'
                      : 'border-amber-200 bg-white hover:bg-amber-50 shadow-xs'
                  }`}
                >
                  <span className="text-4xl">{a.emoji}</span>
                  <span className="mt-1 font-serif text-xs font-black text-[#542d1d]">
                    {a.name}
                  </span>
                  <span className="text-[10px] font-bold text-amber-800">
                    {a.element.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Sub-Panel: HEADGEAR SELECTION */}
          {activeTab === 'headgear' && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {HEADGEAR_OPTIONS.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    setConfig((prev) => ({
                      ...prev,
                      headgear: h.id,
                      headgearEmoji: h.emoji === '✖️' ? '' : h.emoji,
                    }));
                    juice.ding(800, 70);
                  }}
                  className={`flex flex-col items-center justify-center rounded-2xl border-3 p-2.5 text-center transition cursor-pointer ${
                    config.headgear === h.id
                      ? 'border-[#7b4632] bg-gradient-to-b from-amber-200 to-amber-300 shadow-[0_4px_0_#7b4632] scale-102'
                      : 'border-amber-200 bg-white hover:bg-amber-50 shadow-xs'
                  }`}
                >
                  <span className="text-3xl">{h.emoji}</span>
                  <span className="mt-1 font-bold text-xs text-[#542d1d] leading-tight">
                    {h.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Sub-Panel: OUTFIT SELECTION */}
          {activeTab === 'outfit' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {OUTFIT_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setConfig((prev) => ({ ...prev, outfit: o.id }));
                    juice.ding(720, 70);
                  }}
                  className={`flex items-center gap-3 rounded-2xl border-3 p-3 text-left transition cursor-pointer ${
                    config.outfit === o.id
                      ? 'border-[#7b4632] bg-gradient-to-b from-amber-200 to-amber-300 shadow-[0_4px_0_#7b4632] scale-102'
                      : 'border-amber-200 bg-white hover:bg-amber-50 shadow-xs'
                  }`}
                >
                  <span className="text-3xl">{o.icon}</span>
                  <div>
                    <h4 className="font-serif text-xs font-black text-[#542d1d]">{o.name}</h4>
                    <p className="text-[10px] font-bold text-[#86563c]">{o.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Sub-Panel: AURA SELECTION */}
          {activeTab === 'aura' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AURA_OPTIONS.map((au) => (
                <button
                  key={au.id}
                  type="button"
                  onClick={() => {
                    setConfig((prev) => ({ ...prev, aura: au.id }));
                    juice.ding(840, 70);
                  }}
                  className={`flex items-center gap-2.5 rounded-2xl border-3 p-2.5 text-left transition cursor-pointer ${
                    config.aura === au.id
                      ? `border-[#7b4632] bg-gradient-to-r ${au.glow} shadow-[0_4px_0_#7b4632] scale-102`
                      : 'border-amber-200 bg-white hover:bg-amber-50 shadow-xs'
                  }`}
                >
                  <span className="text-2xl">{au.icon}</span>
                  <div>
                    <h4 className="font-bold text-xs text-[#542d1d]">{au.name}</h4>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Save & Continue CTA */}
        <div className="pt-2 border-t-3 border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs font-bold text-[#8c563d]">
            Your customized explorer avatar and profile name will stay with your account!
          </p>

          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border-3 border-[#7b4632] bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-[0_4px_0_#7b4632] transition hover:scale-103 hover:brightness-110 active:translate-y-1 active:shadow-none cursor-pointer"
          >
            <Check className="h-5 w-5" />
            <span>Save Character &amp; Enter World!</span>
          </button>
        </div>

      </div>
    </div>
  );
};
