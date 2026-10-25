import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Header } from './components/Header';
import { BattleView } from './components/BattleView';
import { WordForgeView } from './components/WordForgeView';
import { LoadoutView } from './components/LoadoutView';
import { HubView } from './components/HubView';
import { GuideModal } from './components/GuideModal';

const AppContent: React.FC = () => {
  const { tab } = useGame();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="min-h-screen bg-amber-50 text-slate-800 flex flex-col font-sans">
      <Header onOpenGuide={() => setIsGuideOpen(true)} />

      <div className="flex-1">
        {tab === 'hub' ? (
          <HubView />
        ) : tab === 'battle' ? (
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
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
};

export default App;
