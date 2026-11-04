import React from 'react';
import { Swords, Volume2, VolumeX, HelpCircle, RotateCcw, Palette, LogOut } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { PrimaryNavigation } from './PrimaryNavigation';

interface HeaderProps {
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenGuide }) => {
  const { isMuted, toggleMute, resetAll } = useGame();
  const { currentUser, setIsCustomizingAvatar, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b-4 border-[#793d35] bg-[#aa5544] px-4 py-3 text-white shadow-md">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 lg:flex-nowrap">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#ffce7a] bg-gradient-to-br from-amber-400 to-pink-500 shadow-md shadow-[#763b36]">
            <Swords className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-lg sm:text-xl font-bold tracking-wide text-white">
              WORD BATTLER
            </h1>
            <p className="hidden text-[11px] text-orange-50 sm:block">
              Vocabulary &amp; Morphology Pet Arena
            </p>
          </div>
        </div>

        <PrimaryNavigation variant="header" />

        {/* Control Actions & Explorer Profile */}
        <div className="order-2 ml-auto flex items-center gap-2 lg:order-none lg:ml-0">
          
          {/* Active Explorer Profile Badge */}
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-[#ffce7a] bg-[#893f3b] px-2.5 py-1 text-white shadow-xs">
              <button
                type="button"
                onClick={() => setIsCustomizingAvatar(true)}
                title="Customize Character Avatar"
                className="group relative flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-lg shadow transition hover:scale-110 cursor-pointer"
              >
                <span>{currentUser.avatarConfig?.emoji || currentUser.avatarEmoji || '🦊'}</span>
                {currentUser.avatarConfig?.headgearEmoji && (
                  <span className="absolute -top-2 -right-1 text-[11px] drop-shadow">
                    {currentUser.avatarConfig.headgearEmoji}
                  </span>
                )}
              </button>
              <div className="text-left leading-tight">
                <span className="block text-xs font-bold text-amber-200 truncate max-w-[100px]">
                  {currentUser.displayName}
                </span>
                <span className="block text-[9px] font-semibold text-orange-200 truncate max-w-[100px]">
                  {currentUser.avatarConfig?.title || 'Word Wizard'}
                </span>
              </div>
            </div>
          )}

          {/* Customize Character Button */}
          <button
            type="button"
            onClick={() => setIsCustomizingAvatar(true)}
            title="Character Customizer"
            aria-label="Character Customizer"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#f3c794] bg-[#fff4dc] px-2.5 text-xs font-bold text-[#74452f] transition hover:bg-amber-200 hover:text-amber-950 cursor-pointer"
          >
            <Palette className="h-4 w-4 text-purple-600" />
            <span className="hidden md:inline">Avatar</span>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#f3c794] bg-[#fff4dc] text-[#74452f] transition hover:bg-amber-200 hover:text-amber-950 cursor-pointer"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-violet-700" />}
          </button>

          <button
            type="button"
            onClick={onOpenGuide}
            title="Linguistic Rules &amp; Guide"
            aria-label="How to Play and Rules"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#f3c794] bg-[#fff4dc] text-[#74452f] transition hover:bg-amber-200 hover:text-amber-950 cursor-pointer"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              // Direct reset with safe confirmation or instant execution without window.confirm
              resetAll();
            }}
            title="Reset Game Data"
            aria-label="Reset Game Data"
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-[#f3c794] bg-[#fff4dc] text-[#74452f] transition hover:bg-amber-200 hover:text-amber-950 sm:flex cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Log Out / Switch Explorer */}
          <button
            type="button"
            onClick={() => {
              // Trigger logout directly to return to Title Page without window.confirm (which is blocked by iframe policies)
              logout();
            }}
            title="Log Out / Switch Explorer"
            aria-label="Log Out / Switch Explorer"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 px-2.5 text-xs font-bold text-red-700 shadow-xs transition hover:text-red-900 cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-red-600" />
            <span className="font-black">Exit</span>
          </button>
        </div>
      </div>
    </header>
  );
};
