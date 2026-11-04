import React, { useEffect, useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TitleScreen } from './components/TitleScreen';
import { CharacterCreator } from './components/CharacterCreator';
import { Header } from './components/Header';
import { BattleView } from './components/BattleView';
import { WordForgeView } from './components/WordForgeView';
import { LoadoutView } from './components/LoadoutView';
import { HubView } from './components/HubView';
import { GuideModal } from './components/GuideModal';
import { LoadingScreen } from './components/LoadingScreen';
import { StarterPetSelection } from './components/StarterPetSelection';
import { TutorialScreen } from './components/TutorialScreen';

const AppContent: React.FC = () => {
  const { tab, gameState, setActiveScreen } = useGame();
  const { currentUser, isCustomizingAvatar, setIsCustomizingAvatar } = useAuth();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      if (gameState.activeScreen !== 'auth') setActiveScreen('auth');
      return;
    }

    if (gameState.activeScreen === 'loading') return;
    if (currentUser.onboardingComplete === false) {
      if (!['avatar', 'starter-pet', 'tutorial'].includes(gameState.activeScreen)) {
        setActiveScreen('avatar');
      }
    } else if (gameState.activeScreen === 'auth') {
      setActiveScreen('game');
    }
  }, [currentUser?.id, currentUser?.onboardingComplete, gameState.activeScreen, setActiveScreen]);

  if (gameState.activeScreen === 'loading') {
    return <LoadingScreen />;
  }

  if (gameState.activeScreen === 'auth' || !currentUser) {
    return <TitleScreen />;
  }

  if (gameState.activeScreen === 'avatar') {
    return (
      <CharacterCreator
        isInitialSetup
        onClose={() => setActiveScreen('starter-pet')}
      />
    );
  }

  if (gameState.activeScreen === 'starter-pet') {
    return <StarterPetSelection />;
  }

  if (gameState.activeScreen === 'tutorial') {
    return <TutorialScreen />;
  }

  if (tab === 'hub' || tab === 'shop') {
    return (
      <div className="w-screen h-screen overflow-hidden bg-[#59b8fa] text-slate-800 flex flex-col font-sans select-none">
        <HubView
          onOpenGuide={() => setIsGuideOpen(true)}
          initialPanel={tab === 'shop' ? 'shop' : null}
        />

        <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

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

      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {isCustomizingAvatar && (
        <CharacterCreator onClose={() => setIsCustomizingAvatar(false)} />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </AuthProvider>
  );
};

export default App;
