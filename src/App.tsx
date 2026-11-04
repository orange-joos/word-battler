import React, { lazy, Suspense, useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';

const TitleScreen = lazy(() => import('./components/TitleScreen').then((module) => ({ default: module.TitleScreen })));
const CharacterCreator = lazy(() => import('./components/CharacterCreator').then((module) => ({ default: module.CharacterCreator })));
const BattleView = lazy(() => import('./components/BattleView').then((module) => ({ default: module.BattleView })));
const WordForgeView = lazy(() => import('./components/WordForgeView').then((module) => ({ default: module.WordForgeView })));
const LoadoutView = lazy(() => import('./components/LoadoutView').then((module) => ({ default: module.LoadoutView })));
const HubView = lazy(() => import('./components/HubView').then((module) => ({ default: module.HubView })));
const GuideModal = lazy(() => import('./components/GuideModal').then((module) => ({ default: module.GuideModal })));

const AppContent: React.FC = () => {
  const { tab } = useGame();
  const { currentUser, isCustomizingAvatar, setIsCustomizingAvatar } = useAuth();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // If user is not logged in, show the Title Page with Login/Signup
  if (!currentUser) {
    return <TitleScreen />;
  }

  // If user is on the World Map Hub, render it full-screen matching the reference photograph
  if (tab === 'hub') {
    return (
      <div className="w-screen h-screen overflow-hidden bg-[#59b8fa] text-slate-800 flex flex-col font-sans select-none">
        <HubView />

        {/* Guide & Rules Modal */}
        <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

        {/* Character Customization (Avatar Creator & Profile Name) */}
        {isCustomizingAvatar && (
          <CharacterCreator onClose={() => setIsCustomizingAvatar(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 text-slate-800 flex flex-col font-sans">
      <Header onOpenGuide={() => setIsGuideOpen(true)} />

      <div className="flex-1">
        {tab === 'battle' ? (
          <BattleView />
        ) : tab === 'loadout' ? (
          <LoadoutView />
        ) : (
          <WordForgeView />
        )}
      </div>

      <footer className="border-t-4 border-[#793d35] bg-[#aa5544] py-4 text-center text-xs text-orange-50">
        Word Battler · Educational Vocabulary &amp; English Morphology Combat System
      </footer>

      {/* Guide & Rules Modal */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Character Customization (Avatar Creator & Profile Name) */}
      {isCustomizingAvatar && (
        <CharacterCreator onClose={() => setIsCustomizingAvatar(false)} />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-amber-50" />}>
      <AuthProvider>
        <GameProvider>
          <AppContent />
        </GameProvider>
      </AuthProvider>
    </Suspense>
  );
};

export default App;
