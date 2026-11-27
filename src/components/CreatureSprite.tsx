import React from 'react';
import { ElementType } from '../types';

interface CreatureSpriteProps {
  creatureId: string;
  stage?: number;
  element?: ElementType;
  secondaryElement?: ElementType;
  accessoryId?: string;
  isPrismatic?: boolean;
  mood?: 'idle' | 'happy' | 'charging' | 'dizzy' | 'shielded';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
  facing?: 'left' | 'right';
  isAttacking?: boolean;
  isHit?: boolean;
}

const SIZE_MAP = {
  xs: 'w-10 h-10',
  sm: 'w-14 h-14',
  md: 'w-24 h-24',
  lg: 'w-36 h-36',
  xl: 'w-48 h-48',
};

const ELEMENT_AURA: Record<ElementType, { primary: string; secondary: string; glow: string }> = {
  fire: { primary: '#ff5722', secondary: '#ffca28', glow: 'rgba(255, 87, 34, 0.45)' },
  ice: { primary: '#00bcd4', secondary: '#b2ebf2', glow: 'rgba(0, 188, 212, 0.45)' },
  water: { primary: '#2196f3', secondary: '#90caf9', glow: 'rgba(33, 150, 243, 0.45)' },
  grass: { primary: '#4caf50', secondary: '#c8e6c9', glow: 'rgba(76, 175, 80, 0.45)' },
  electric: { primary: '#ffc107', secondary: '#fff59d', glow: 'rgba(255, 193, 7, 0.5)' },
  earth: { primary: '#8d6e63', secondary: '#d7ccc8', glow: 'rgba(141, 110, 99, 0.45)' },
  air: { primary: '#26c6da', secondary: '#e0f7fa', glow: 'rgba(38, 198, 218, 0.45)' },
  light: { primary: '#ffca28', secondary: '#fff8e1', glow: 'rgba(255, 202, 40, 0.5)' },
  shadow: { primary: '#7e57c2', secondary: '#d1c4e9', glow: 'rgba(126, 87, 194, 0.5)' },
};

const ACCESSORY_BADGE: Record<string, { icon: string; label: string }> = {
  root_crown: { icon: '👑', label: 'Crown' },
  amber_fang: { icon: '🦴', label: 'Fang' },
  iron_shell: { icon: '🛡️', label: 'Shell' },
  zephyr_band: { icon: '🪶', label: 'Band' },
  scholar_glasses: { icon: '👓', label: 'Glasses' },
  wizard_hat: { icon: '🎩', label: 'Hat' },
};

interface SpriteAssetMeta {
  src: string;
  naturalFacing: 'left' | 'right';
}

function resolveCreatureAsset(cleanId: string, element: ElementType): SpriteAssetMeta {
  if (cleanId.startsWith('boss_')) {
    if (cleanId.includes('ruptor') || element === 'earth') {
      return { src: '/assets/creatures/boss_ruptor.png', naturalFacing: 'left' };
    }
    if (cleanId.includes('leviathan') || cleanId.includes('hornet') || element === 'water' || element === 'ice') {
      return { src: '/assets/creatures/boss_leviathan.png', naturalFacing: 'left' };
    }
    if (cleanId.includes('chimera') || cleanId.includes('pyro') || cleanId.includes('volt') || element === 'fire' || element === 'electric') {
      return { src: '/assets/creatures/boss_chimera.png', naturalFacing: 'left' };
    }
    if (cleanId.includes('wyvern') || cleanId.includes('griffin') || element === 'grass' || element === 'air') {
      return { src: '/assets/creatures/boss_wyvern.png', naturalFacing: 'left' };
    }
    return { src: '/assets/creatures/boss_sovereign.png', naturalFacing: 'right' };
  }

  if (cleanId.includes('aqua') || cleanId.includes('fin') || cleanId.includes('tidal') || cleanId.includes('plesio')) {
    return { src: '/assets/creatures/aquafin.png', naturalFacing: 'right' };
  }
  if (cleanId.includes('dusk') || cleanId.includes('umbra') || cleanId.includes('nyx')) {
    return { src: '/assets/creatures/dusklynx.png', naturalFacing: 'left' };
  }
  if (cleanId.includes('rimepup') || cleanId.includes('frost') || cleanId.includes('cryo') || cleanId.includes('mammoth')) {
    return { src: '/assets/creatures/rimepup.png', naturalFacing: 'left' };
  }
  if (cleanId.includes('verdant') || cleanId.includes('sylvan') || cleanId.includes('gaia') || cleanId.includes('fern')) {
    return { src: '/assets/creatures/verdantsprout.png', naturalFacing: 'left' };
  }
  if (cleanId.includes('volt') || cleanId.includes('thunder')) {
    return { src: '/assets/creatures/voltowl.png', naturalFacing: 'left' };
  }
  if (cleanId.includes('terra') || cleanId.includes('stone') || cleanId.includes('boulder') || cleanId.includes('ankylo')) {
    return { src: '/assets/creatures/terraturtle.png', naturalFacing: 'right' };
  }
  if (cleanId.includes('zephyr') || cleanId.includes('gale') || cleanId.includes('ptero')) {
    return { src: '/assets/creatures/zephyrkit.png', naturalFacing: 'left' };
  }
  if (cleanId.includes('glimmer') || cleanId.includes('lumina') || cleanId.includes('lumini')) {
    return { src: '/assets/creatures/glimmerfae.png', naturalFacing: 'right' };
  }
  if (cleanId.includes('ember') || cleanId.includes('pyro') || cleanId.includes('solar')) {
    return { src: '/assets/creatures/emberfox.png', naturalFacing: 'right' };
  }

  // Fallback by element
  switch (element) {
    case 'water':
      return { src: '/assets/creatures/aquafin.png', naturalFacing: 'right' };
    case 'ice':
      return { src: '/assets/creatures/rimepup.png', naturalFacing: 'left' };
    case 'grass':
      return { src: '/assets/creatures/verdantsprout.png', naturalFacing: 'left' };
    case 'electric':
      return { src: '/assets/creatures/voltowl.png', naturalFacing: 'left' };
    case 'earth':
      return { src: '/assets/creatures/terraturtle.png', naturalFacing: 'right' };
    case 'air':
      return { src: '/assets/creatures/zephyrkit.png', naturalFacing: 'left' };
    case 'light':
      return { src: '/assets/creatures/glimmerfae.png', naturalFacing: 'right' };
    case 'shadow':
      return { src: '/assets/creatures/dusklynx.png', naturalFacing: 'left' };
    case 'fire':
    default:
      return { src: '/assets/creatures/emberfox.png', naturalFacing: 'right' };
  }
}

export const CreatureSprite: React.FC<CreatureSpriteProps> = ({
  creatureId,
  stage = 1,
  element = 'fire',
  secondaryElement,
  accessoryId,
  isPrismatic = false,
  mood = 'idle',
  size = 'md',
  className = '',
  animated = true,
  facing,
  isAttacking = false,
  isHit = false,
}) => {
  const cleanId = creatureId.toLowerCase();
  const aura = ELEMENT_AURA[element] || ELEMENT_AURA.fire;
  const secondaryAura = secondaryElement ? ELEMENT_AURA[secondaryElement] : null;
  const asset = resolveCreatureAsset(cleanId, element);

  const shouldFlip = facing ? facing !== asset.naturalFacing : false;
  const stageScale = stage >= 3 ? 'scale-110' : stage === 2 ? 'scale-105' : 'scale-95';
  const stageFilter =
    stage >= 3
      ? 'saturate-150 contrast-110 brightness-105 drop-shadow-[0_0_12px_rgba(253,224,71,0.75)]'
      : stage === 2
      ? 'saturate-125 contrast-105 drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]'
      : '';

  const motionClasses = isAttacking
    ? facing === 'right'
      ? 'translate-x-6 -translate-y-2 scale-115'
      : '-translate-x-6 -translate-y-2 scale-115'
    : isHit
    ? 'scale-90 brightness-150 saturate-200'
    : mood === 'happy'
    ? 'pet-rig-happy'
    : '';

  const accessoryMeta = accessoryId ? ACCESSORY_BADGE[accessoryId] : null;
  const hasDistinctSecondary = Boolean(secondaryAura && secondaryElement !== element);

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none transition-all duration-200 ${SIZE_MAP[size]} ${
        animated ? 'hover:scale-105' : ''
      } ${motionClasses} ${className}`}
    >
      {/* Elemental Aura Glow Behind Creature (Split Dual-Element when Hybrid) */}
      <div
        className="pointer-events-none absolute inset-1 rounded-full blur-md transition-opacity"
        style={{
          background: hasDistinctSecondary && secondaryAura
            ? `linear-gradient(135deg, ${aura.primary} 0%, ${aura.secondary} 45%, ${secondaryAura.secondary} 55%, ${secondaryAura.primary} 100%)`
            : `radial-gradient(circle, ${aura.secondary} 0%, ${aura.primary} 65%, transparent 100%)`,
          opacity: stage >= 3 ? 0.75 : stage === 2 ? 0.55 : 0.32,
        }}
      />

      {/* Stage 2+ Evolved Elemental Wing / Crest Backdrop */}
      {stage >= 2 && (
        <svg
          viewBox="0 0 120 120"
          className="pointer-events-none absolute inset-0 w-full h-full z-0 opacity-90"
          aria-hidden="true"
        >
          {/* Left & Right Evolved Elemental Wings */}
          <path
            d="M22 68 C4 52, 6 28, 30 34 C18 44, 20 56, 34 62 Z"
            fill={aura.primary}
            stroke="#fde047"
            strokeWidth={stage >= 3 ? '2.5' : '1.5'}
            opacity="0.85"
          />
          <path
            d="M98 68 C116 52, 114 28, 90 34 C102 44, 100 56, 86 62 Z"
            fill={hasDistinctSecondary && secondaryAura ? secondaryAura.primary : aura.primary}
            stroke="#fde047"
            strokeWidth={stage >= 3 ? '2.5' : '1.5'}
            opacity="0.85"
          />
          {stage >= 3 && (
            <>
              {/* Stage 3 Sovereign Halo & Lower Wing Feathers */}
              <path
                d="M26 80 C8 74, 6 56, 26 56 C18 64, 22 72, 34 76 Z"
                fill="#fde047"
                opacity="0.85"
              />
              <path
                d="M94 80 C112 74, 114 56, 94 56 C102 64, 98 72, 86 76 Z"
                fill="#fde047"
                opacity="0.85"
              />
              <polygon
                points="60,4 66,16 78,10 73,23 47,23 42,10 54,16"
                fill="#fde047"
                stroke="#1a162b"
                strokeWidth="2"
              />
            </>
          )}
        </svg>
      )}

      {/* Dual-Element Hybrid Orbit Ring */}
      {hasDistinctSecondary && secondaryAura && (
        <div
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-dashed opacity-90 animate-spin"
          style={{
            borderColor: secondaryAura.primary,
            animationDuration: '10s',
          }}
        />
      )}

      {/* Stage 3 / Prismatic Golden Aura Ring */}
      {(stage >= 3 || isPrismatic) && (
        <div
          className="pointer-events-none absolute inset-0.5 rounded-full border-2 border-dashed animate-spin"
          style={{
            borderColor: '#fde047',
            animationDuration: '14s',
          }}
        />
      )}

      {/* Shield Dome Overlay */}
      {mood === 'shielded' && (
        <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-sky-400 bg-sky-400/15 shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
      )}

      {/* High-Res Illustrated Creature Cutout */}
      <div
        className={`relative z-10 w-full h-full flex items-center justify-center ${
          animated ? 'pet-rig-breathe' : ''
        } ${stageScale}`}
      >
        <img
          src={asset.src}
          alt={creatureId}
          draggable={false}
          className={`w-full h-full object-contain drop-shadow-[0_6px_8px_rgba(15,23,42,0.55)] transition-transform ${
            shouldFlip ? '-scale-x-100' : ''
          } ${stageFilter} ${isPrismatic ? ' saturate-125 contrast-105' : ''}`}
        />
      </div>

      {/* Evolution Stage Crest Pill (Stage II / Stage III) */}
      {stage >= 2 && size !== 'xs' && !cleanId.startsWith('boss_') && (
        <span
          className={`pointer-events-none absolute -bottom-1 right-0 z-20 rounded-full border border-[#1a162b] px-1.5 py-0.2 font-mono text-[9px] font-black shadow ${
            stage >= 3 ? 'bg-[#fde047] text-[#1a162b]' : 'bg-white text-[#1a162b]'
          }`}
        >
          {stage >= 3 ? '👑 III' : '★ II'}
        </span>
      )}

      {/* Dual-Element Hybrid Badge */}
      {hasDistinctSecondary && secondaryAura && size !== 'xs' && (
        <span
          className="pointer-events-none absolute -bottom-1 left-0 z-20 flex h-4 w-7 items-center justify-center rounded-full border border-[#1a162b] text-[8px] font-black text-white shadow"
          style={{
            background: `linear-gradient(90deg, ${aura.primary} 50%, ${secondaryAura.primary} 50%)`,
          }}
          title={`Dual-Element: ${element} + ${secondaryElement}`}
        >
          ⚡2x
        </span>
      )}

      {/* Wearable Accessory Badge */}
      {accessoryMeta && size !== 'xs' && (
        <span
          className="pointer-events-none absolute -top-1 -right-1 z-20 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1a162b] bg-[#fde047] text-xs shadow"
          title={accessoryMeta.label}
        >
          {accessoryMeta.icon}
        </span>
      )}

      {/* Mood Reaction Overlays */}
      {mood === 'happy' && (
        <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 z-20 text-base animate-bounce">
          ❤️
        </span>
      )}
      {mood === 'charging' && (
        <span className="pointer-events-none absolute -top-2 right-0 z-20 text-base animate-pulse">
          ⚡
        </span>
      )}
      {mood === 'dizzy' && (
        <span className="pointer-events-none absolute -top-2 right-0 z-20 text-sm animate-bounce">
          💧
        </span>
      )}
    </div>
  );
};
