import React from 'react';
import { useGame } from '../context/GameContext';
import { OverworldMap } from './OverworldMap';

interface HubViewProps {
  onOpenGuide?: () => void;
  initialPanel?: 'shop' | 'hatchery' | null;
}

export const HubView: React.FC<HubViewProps> = ({ onOpenGuide, initialPanel = null }) => {
  const { tab, setTab, startBattleInZone } = useGame();

  return (
    <div className="relative h-full min-h-screen w-full overflow-hidden">
      <OverworldMap
        onSelectZone={(zId) => startBattleInZone(zId)}
        onOpenGuide={onOpenGuide}
        initialPanel={initialPanel}
        activeTab={tab}
      />
    </div>
  );
};

export default HubView;
