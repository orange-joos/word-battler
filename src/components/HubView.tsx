import React from 'react';
import { useGame } from '../context/GameContext';
import { OverworldMap } from './OverworldMap';

interface HubViewProps {
  onOpenGuide?: () => void;
  initialPanel?: 'shop' | 'hatchery' | null;
}

export const HubView: React.FC<HubViewProps> = ({ initialPanel }) => {
  return (
    <div className="relative h-full min-h-screen w-full overflow-hidden">
      <OverworldMap initialPanel={initialPanel} />
    </div>
  );
};

export default HubView;
