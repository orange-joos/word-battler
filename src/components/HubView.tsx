import React from 'react';
import { useGame } from '../context/GameContext';
import { OverworldMap } from './OverworldMap';

export const HubView: React.FC<{ onOpenGuide?: () => void }> = ({ onOpenGuide }) => {
  return (
    <div className="w-full h-full min-h-screen overflow-hidden flex flex-col">
      <OverworldMap onOpenGuide={onOpenGuide} />
    </div>
  );
};

export default HubView;
