import React from 'react';
import { useGame } from '../context/GameContext';
import { OverworldMap } from './OverworldMap';

export const HubView: React.FC = () => {
  const { setTab, startBattleInZone } = useGame();

  return (
    <div className="w-full h-full min-h-screen overflow-hidden flex flex-col">
      <OverworldMap
        onSelectZone={(zId) => startBattleInZone(zId)}
        onOpenForge={() => setTab('forge')}
      />
    </div>
  );
};

export default HubView;
