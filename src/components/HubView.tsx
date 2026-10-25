import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

// Define the global window type with renderHub
declare global {
  interface Window {
    renderHub?: (container: HTMLElement, ctx: Record<string, unknown>, actions: Record<string, unknown>) => void;
  }
}

export const HubView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { creatures, words, playerId, setPlayerId, isMuted, setTab } = useGame();

  useEffect(() => {
    let isMounted = true;

    async function mountHub() {
      if (!containerRef.current) return;

      // Ensure renderHub is loaded
      let renderHub = window.renderHub;
      if (!renderHub) {
        try {
          // @ts-ignore
          const hubModule = await import('../../js/hub-ui.js');
          renderHub = hubModule.renderHub || window.renderHub;
        } catch (err) {
          console.error('Failed to load hub-ui.js:', err);
        }
      }

      if (!isMounted || !containerRef.current || !renderHub) return;

      const hubContext = {
        creatures,
        words,
        playerId,
        isMuted,
        player: {
          name: 'Lexi Explorer',
          avatar: '🦊',
          lexiCoins: 450,
          fusionTokens: 14,
          streak: 5,
        },
      };

      const hubActions = {
        navigateTo: (screen: string) => {
          if (screen === 'battle-arena' || screen === 'battle') {
            setTab('battle');
          } else if (screen === 'word-forge' || screen === 'forge') {
            setTab('forge');
          } else if (screen === 'pet-roster' || screen === 'loadout') {
            setTab('loadout');
          }
        },
        goToBattle: () => setTab('battle'),
        goToForge: () => setTab('forge'),
        goToLoadout: () => setTab('loadout'),
        onSelectPet: (id: string) => setPlayerId(id),
      };

      renderHub(containerRef.current, hubContext as any, hubActions);
    }

    mountHub();

    return () => {
      isMounted = false;
    };
  }, [creatures, words, playerId, isMuted, setTab, setPlayerId]);

  return <div ref={containerRef} className="w-full flex-1" />;
};

export default HubView;
