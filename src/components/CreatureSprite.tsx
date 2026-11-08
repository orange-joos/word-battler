import React from 'react';
import { ElementType } from '../types';

interface CreatureSpriteProps {
  creatureId: string;
  stage?: number;
  element?: ElementType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
  facing?: 'left' | 'right';
  isAttacking?: boolean;
  isHit?: boolean;
}

const SIZE_MAP = {
  xs: 'w-9 h-9',
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
  xl: 'w-44 h-44',
};

const ELEMENT_AURA: Record<string, { primary: string; secondary: string; glow: string }> = {
  fire: { primary: '#ff5722', secondary: '#ffca28', glow: 'rgba(255, 87, 34, 0.45)' },
  ice: { primary: '#00bcd4', secondary: '#b2ebf2', glow: 'rgba(0, 188, 212, 0.45)' },
  water: { primary: '#2196f3', secondary: '#90caf9', glow: 'rgba(33, 150, 243, 0.45)' },
  grass: { primary: '#4caf50', secondary: '#c8e6c9', glow: 'rgba(76, 175, 80, 0.45)' },
  nature: { primary: '#4caf50', secondary: '#c8e6c9', glow: 'rgba(76, 175, 80, 0.45)' },
  electric: { primary: '#ffc107', secondary: '#fff59d', glow: 'rgba(255, 193, 7, 0.5)' },
  earth: { primary: '#8d6e63', secondary: '#d7ccc8', glow: 'rgba(141, 110, 99, 0.45)' },
  air: { primary: '#26c6da', secondary: '#e0f7fa', glow: 'rgba(38, 198, 218, 0.45)' },
  light: { primary: '#ffca28', secondary: '#fff8e1', glow: 'rgba(255, 202, 40, 0.5)' },
  shadow: { primary: '#7e57c2', secondary: '#d1c4e9', glow: 'rgba(126, 87, 194, 0.5)' },
  cosmic: { primary: '#ab47bc', secondary: '#f3e5f5', glow: 'rgba(171, 71, 188, 0.5)' },
};

/**
 * Edit 13: Bold Cel-Shaded Monster-Tamer & JRPG SVG Creature Rigs
 * Inspired by Pokémon, Digimon, Fossil Fighters, Amazing Island, and Final Fantasy.
 * Features thick #1a162b ink outlines, dual anime eye catchlights, elemental crests, and stage armor.
 */
export const CreatureSprite: React.FC<CreatureSpriteProps> = ({
  creatureId,
  stage = 1,
  element = 'fire',
  size = 'md',
  className = '',
  animated = true,
  facing = 'right',
  isAttacking = false,
  isHit = false,
}) => {
  const cleanId = creatureId.toLowerCase();
  const aura = ELEMENT_AURA[element] || ELEMENT_AURA.fire;
  const ink = '#1a162b';

  // Reusable Anime Eyes with Dual Catchlights (Pokémon / Digimon aesthetic)
  const renderAnimeEye = (cx: number, cy: number, irisColor: string, r = 5.5) => (
    <g>
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 1.12} fill="#ffffff" stroke={ink} strokeWidth="2.4" />
      <ellipse cx={cx} cy={cy + 0.5} rx={r * 0.68} ry={r * 0.8} fill={irisColor} />
      <ellipse cx={cx} cy={cy + 0.8} rx={r * 0.38} ry={r * 0.48} fill={ink} />
      {/* Dual anime specular highlights */}
      <circle cx={cx - r * 0.28} cy={cy - r * 0.32} r={r * 0.28} fill="#ffffff" />
      <circle cx={cx + r * 0.25} cy={cy + r * 0.28} r={r * 0.14} fill="#ffffff" />
    </g>
  );

  // 1. EMBERFOX LINE (Pyrokit -> BlazeHound -> IgnisNine)
  const renderEmberfox = () => (
    <g>
      {/* Multi-tail fan with thick comic outline */}
      {stage >= 3 ? (
        <g stroke={ink} strokeWidth="3" strokeLinejoin="round">
          <path d="M74 78 Q112 36 102 18 Q84 28 76 58 Z" fill="#ff3d00" />
          <path d="M76 82 Q118 58 112 36 Q92 46 78 68 Z" fill="#ff9100" />
          <path d="M74 86 Q114 82 108 62 Q90 66 76 76 Z" fill="#ffd600" />
          <path d="M96 24 Q104 18 98 34" fill="#fff9c4" stroke="none" />
        </g>
      ) : stage === 2 ? (
        <g stroke={ink} strokeWidth="3" strokeLinejoin="round">
          <path d="M72 80 Q108 44 98 24 Q80 38 72 66 Z" fill="#ff5722" />
          <path d="M74 84 Q112 68 104 46 Q86 56 74 74 Z" fill="#ffb300" />
        </g>
      ) : (
        <g stroke={ink} strokeWidth="3" strokeLinejoin="round">
          <path d="M70 82 Q104 54 96 34 Q78 46 68 72 Z" fill="#ff5722" />
          <path d="M96 34 Q90 48 84 46 Q90 36 96 34 Z" fill="#fff59d" />
        </g>
      )}

      {/* Body & Chest Fur */}
      <ellipse cx="56" cy="78" rx="23" ry="19" fill="#ff6d00" stroke={ink} strokeWidth="3.2" />
      {/* Cel-shaded belly shadow */}
      <path d="M36 82 Q56 96 76 82 Q68 95 56 95 Q44 95 36 82 Z" fill="#d84315" />
      <path d="M44 72 Q56 90 68 72 Q60 63 56 66 Q52 63 44 72 Z" fill="#fff3e0" stroke={ink} strokeWidth="2.4" />

      {/* Digimon-style Shoulder Flame Armor on Stage 2+ */}
      {stage >= 2 && (
        <g stroke={ink} strokeWidth="2.6" strokeLinejoin="round">
          <path d="M32 70 L20 60 L34 62 Z" fill="#ffd600" />
          <path d="M80 70 L92 60 L78 62 Z" fill="#ffd600" />
        </g>
      )}

      {/* Paws with claws */}
      <ellipse cx="43" cy="94" rx="7" ry="4.5" fill="#bf360c" stroke={ink} strokeWidth="2.8" />
      <ellipse cx="69" cy="94" rx="7" ry="4.5" fill="#bf360c" stroke={ink} strokeWidth="2.8" />

      {/* Fox Ears */}
      <polygon points="34,46 22,14 48,34" fill="#ff6d00" stroke={ink} strokeWidth="3.2" strokeLinejoin="round" />
      <polygon points="35,42 27,21 44,34" fill="#ffecb3" />
      <polygon points="78,46 90,14 64,34" fill="#ff6d00" stroke={ink} strokeWidth="3.2" strokeLinejoin="round" />
      <polygon points="77,42 85,21 68,34" fill="#ffecb3" />

      {/* Head with cel-shaded cheek tufts */}
      <path
        d="M32 48 Q32 28 56 28 Q80 28 80 48 L88 54 L76 62 Q56 70 36 62 L24 54 Z"
        fill="#ff6d00"
        stroke={ink}
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      {/* White cheek ruff */}
      <path d="M30 52 Q44 64 56 62 Q68 64 82 52 L76 62 Q56 68 36 62 Z" fill="#fff8e1" stroke={ink} strokeWidth="2.2" />

      {/* Forehead Flame Crest / Solar Crown */}
      {stage >= 2 && (
        <polygon
          points="56,8 47,29 56,24 65,29"
          fill="#ffd600"
          stroke={ink}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
      )}
      {stage >= 3 && (
        <circle cx="56" cy="22" r="4" fill="#00e5ff" stroke={ink} strokeWidth="2" />
      )}

      {/* Anime Eyes */}
      {renderAnimeEye(45, 47, '#d50000', 5.2)}
      {renderAnimeEye(67, 47, '#d50000', 5.2)}

      {/* Nose & Confident Monster Grin */}
      <polygon points="53,54 59,54 56,58" fill={ink} />
      <path d="M49 60 Q56 64 63 60" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <polygon points="60,61 62,64 63,60" fill="#ffffff" />
    </g>
  );

  // 2. RIMEPUP LINE (Frostfang -> GlacierWolf -> CryoFenrir)
  const renderRimepup = () => (
    <g>
      {/* Ice Spikes & Tail */}
      <path
        d="M74 80 Q104 62 96 42 Q82 54 74 72 Z"
        fill="#4dd0e1"
        stroke={ink}
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      {stage >= 2 && (
        <g stroke={ink} strokeWidth="2.6" strokeLinejoin="round">
          <polygon points="72,56 96,30 80,68" fill="#e0f7fa" />
          <polygon points="28,60 12,38 34,68" fill="#80deea" />
        </g>
      )}
      {/* Body */}
      <ellipse cx="56" cy="78" rx="24" ry="19" fill="#26c6da" stroke={ink} strokeWidth="3.2" />
      <path d="M42 70 Q56 92 70 70 Q62 60 56 64 Q50 60 42 70 Z" fill="#e0f7fa" stroke={ink} strokeWidth="2.4" />
      {/* Paws */}
      <ellipse cx="43" cy="94" rx="7.5" ry="4.5" fill="#00838f" stroke={ink} strokeWidth="2.8" />
      <ellipse cx="69" cy="94" rx="7.5" ry="4.5" fill="#00838f" stroke={ink} strokeWidth="2.8" />
      {/* Wolf Ears */}
      <polygon points="35,44 24,14 49,33" fill="#00acc1" stroke={ink} strokeWidth="3.2" strokeLinejoin="round" />
      <polygon points="36,40 29,20 45,33" fill="#e0f7fa" />
      <polygon points="77,44 88,14 63,33" fill="#00acc1" stroke={ink} strokeWidth="3.2" strokeLinejoin="round" />
      <polygon points="76,40 83,20 67,33" fill="#e0f7fa" />
      {/* Head & Cheek Spikes */}
      <path
        d="M31 48 Q31 27 56 27 Q81 27 81 48 L90 52 L78 62 Q56 70 34 62 L22 52 Z"
        fill="#4dd0e1"
        stroke={ink}
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      {/* Forehead Ice Diamond */}
      <polygon points="56,16 49,28 56,37 63,28" fill="#ffffff" stroke={ink} strokeWidth="2.6" />
      {stage >= 3 && (
        <g stroke={ink} strokeWidth="2.4">
          <polygon points="40,22 32,8 48,24" fill="#b2ebf2" />
          <polygon points="72,22 80,8 64,24" fill="#b2ebf2" />
        </g>
      )}
      {/* Anime Eyes */}
      {renderAnimeEye(45, 47, '#0277bd', 5.2)}
      {renderAnimeEye(67, 47, '#0277bd', 5.2)}
      {/* Snout & Fangs */}
      <polygon points="53,53 59,53 56,57" fill={ink} />
      <path d="M48 60 Q56 57 64 60" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {stage >= 2 && (
        <>
          <polygon points="48,60 50,66 53,60" fill="#ffffff" stroke={ink} strokeWidth="1.6" />
          <polygon points="59,60 62,66 64,60" fill="#ffffff" stroke={ink} strokeWidth="1.6" />
        </>
      )}
    </g>
  );

  // 3. VERDANTSPROUT LINE (SylvanCat -> BriarLynx -> GaiaGuardian)
  const renderVerdantsprout = () => (
    <g>
      {/* Whip Vine Tail with Leaf Blade */}
      <path d="M74 82 Q102 68 96 42" stroke="#2e7d32" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path
        d="M96 42 Q110 34 102 22 Q86 30 96 42 Z"
        fill="#76ff03"
        stroke={ink}
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      {/* Body */}
      <ellipse cx="56" cy="78" rx="22" ry="18" fill="#66bb6a" stroke={ink} strokeWidth="3.2" />
      {/* Leaf Collar */}
      <path
        d="M32 66 L44 76 L56 68 L68 76 L80 66 Q56 58 32 66 Z"
        fill="#2e7d32"
        stroke={ink}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {/* Paws */}
      <ellipse cx="44" cy="94" rx="6.5" ry="4.5" fill="#1b5e20" stroke={ink} strokeWidth="2.8" />
      <ellipse cx="68" cy="94" rx="6.5" ry="4.5" fill="#1b5e20" stroke={ink} strokeWidth="2.8" />
      {/* Lynx Leaf Ears */}
      <polygon points="35,44 22,16 50,34" fill="#43a047" stroke={ink} strokeWidth="3.2" strokeLinejoin="round" />
      <polygon points="77,44 90,16 62,34" fill="#43a047" stroke={ink} strokeWidth="3.2" strokeLinejoin="round" />
      {/* Head */}
      <ellipse cx="56" cy="48" rx="23" ry="19" fill="#81c784" stroke={ink} strokeWidth="3.2" />
      {/* Sprout / Crown Flower */}
      <path d="M56 29 L56 14" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M56 16 Q40 8 44 22 Q52 24 56 16 Z" fill="#76ff03" stroke={ink} strokeWidth="2.4" />
      <path d="M56 16 Q72 8 68 22 Q60 24 56 16 Z" fill="#76ff03" stroke={ink} strokeWidth="2.4" />
      {stage >= 2 && <circle cx="56" cy="14" r="6" fill="#ff4081" stroke={ink} strokeWidth="2.4" />}
      {stage >= 3 && <circle cx="56" cy="14" r="3" fill="#ffd600" />}
      {/* Anime Eyes */}
      {renderAnimeEye(45, 48, '#2e7d32', 5.2)}
      {renderAnimeEye(67, 48, '#2e7d32', 5.2)}
      {/* Cat Mouth */}
      <polygon points="54,54 58,54 56,57" fill="#f06292" stroke={ink} strokeWidth="1.5" />
      <path d="M50 59 Q53 62 56 59 Q59 62 62 59" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  );

  // 4. VOLTOWL LINE (Sparklet -> ThunderTalon -> AetherArchon)
  const renderVoltowl = () => (
    <g>
      {/* Lightning Wings */}
      <path
        d="M32 62 L10 44 L18 60 L12 72 L34 78 Z"
        fill="#ffd600"
        stroke={ink}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M80 62 L102 44 L94 60 L100 72 L78 78 Z"
        fill="#ffd600"
        stroke={ink}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Owl Body */}
      <ellipse cx="56" cy="68" rx="22" ry="24" fill="#ffb300" stroke={ink} strokeWidth="3.2" />
      <ellipse cx="56" cy="72" rx="15" ry="17" fill="#fff8e1" stroke={ink} strokeWidth="2.4" />
      {/* Thunder Chest Marks */}
      <path d="M49 64 L54 70 L59 64 M47 74 L56 80 L65 74" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {/* Brow Lightning Crests */}
      <polygon points="42,42 22,20 48,34" fill="#ff6f00" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <polygon points="70,42 90,20 64,34" fill="#ff6f00" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      {stage >= 2 && (
        <polygon points="56,12 50,30 56,26 62,30" fill="#00e5ff" stroke={ink} strokeWidth="2.4" />
      )}
      {/* Goggle Owl Eyes */}
      <circle cx="45" cy="49" r="8.5" fill="#ffffff" stroke={ink} strokeWidth="3" />
      <circle cx="67" cy="49" r="8.5" fill="#ffffff" stroke={ink} strokeWidth="3" />
      {renderAnimeEye(45, 49, '#ff6f00', 5.2)}
      {renderAnimeEye(67, 49, '#ff6f00', 5.2)}
      {/* Beak & Talons */}
      <polygon points="52,54 60,54 56,63" fill="#ff3d00" stroke={ink} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M44 92 L40 98 M44 92 L44 99 M44 92 L48 98" stroke="#ff6f00" strokeWidth="3" strokeLinecap="round" />
      <path d="M68 92 L64 98 M68 92 L68 99 M68 92 L72 98" stroke="#ff6f00" strokeWidth="3" strokeLinecap="round" />
    </g>
  );

  // 5. TERRATURTLE LINE (Fossil Fighters Ankylosaur / Crystal Tortoise)
  const renderTerraturtle = () => (
    <g>
      {/* Crystal Spires on Shell (Fossil Fighters / Digimon style) */}
      <polygon points="44,44 36,18 54,38" fill="#00e676" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <polygon points="68,44 78,16 58,38" fill="#00e676" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      {stage >= 2 && (
        <polygon points="56,38 56,10 66,38" fill="#69f0ae" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      )}
      {/* Armored Dome Shell */}
      <path
        d="M24 76 Q24 34 56 34 Q88 34 88 76 Z"
        fill="#5d4037"
        stroke={ink}
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      {/* Hex Plate Scutes */}
      <polygon points="44,54 56,46 68,54 64,68 48,68" fill="#8d6e63" stroke={ink} strokeWidth="2.4" />
      <rect x="20" y="72" width="72" height="9" rx="4.5" fill="#a1887f" stroke={ink} strokeWidth="3" />
      {/* Stomping Dino Legs */}
      <rect x="30" y="80" width="12" height="15" rx="4" fill="#689f38" stroke={ink} strokeWidth="3" />
      <rect x="68" y="80" width="12" height="15" rx="4" fill="#689f38" stroke={ink} strokeWidth="3" />
      {/* Dino Head with Horn */}
      <circle cx="90" cy="64" r="12" fill="#7cb342" stroke={ink} strokeWidth="3.2" />
      <polygon points="96,54 106,46 98,58" fill="#ffd600" stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
      {renderAnimeEye(93, 62, '#d50000', 4)}
      <path d="M88 70 Q94 73 98 69" stroke={ink} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </g>
  );

  // 6. ZEPHYRKIT LINE (BreezeKit -> GalePegasus -> TempestValkyrie)
  const renderZephyrkit = () => (
    <g>
      {/* Feathered Angelic Wings */}
      <path
        d="M34 66 Q8 36 16 22 Q32 34 38 56 Z"
        fill="#ffffff"
        stroke={ink}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M78 66 Q104 36 96 22 Q80 34 74 56 Z"
        fill="#ffffff"
        stroke={ink}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Body */}
      <ellipse cx="56" cy="76" rx="20" ry="17" fill="#80deea" stroke={ink} strokeWidth="3.2" />
      <ellipse cx="56" cy="78" rx="13" ry="12" fill="#ffffff" />
      {/* Head & Ears */}
      <polygon points="36,44 26,18 48,34" fill="#4dd0e1" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <polygon points="76,44 86,18 64,34" fill="#4dd0e1" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="56" cy="48" r="19" fill="#b2ebf2" stroke={ink} strokeWidth="3.2" />
      {stage >= 2 && (
        <polygon points="56,12 51,32 61,32" fill="#ffd54f" stroke={ink} strokeWidth="2.6" strokeLinejoin="round" />
      )}
      {renderAnimeEye(47, 48, '#00838f', 4.8)}
      {renderAnimeEye(65, 48, '#00838f', 4.8)}
      <path d="M51 56 Q56 60 61 56" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  );

  // 7. GLIMMERFAE LINE (StarSprite -> LuminaPixie -> SolarSeraph)
  const renderGlimmerfae = () => (
    <g>
      {/* Final Fantasy Crystal Butterfly Wings */}
      <path
        d="M42 60 Q10 34 18 58 Q12 82 42 74 Z"
        fill="#f48fb1"
        stroke={ink}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M70 60 Q102 34 94 58 Q100 82 70 74 Z"
        fill="#f48fb1"
        stroke={ink}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Floating Halo Crown */}
      <ellipse cx="56" cy="18" rx="15" ry="4.5" fill="none" stroke="#ffd600" strokeWidth="3.5" />
      {/* Body & Head */}
      <ellipse cx="56" cy="74" rx="16" ry="17" fill="#fff59d" stroke={ink} strokeWidth="3.2" />
      <circle cx="56" cy="47" r="18" fill="#fff9c4" stroke={ink} strokeWidth="3.2" />
      {renderAnimeEye(48, 47, '#ad1457', 4.8)}
      {renderAnimeEye(64, 47, '#ad1457', 4.8)}
      <circle cx="41" cy="53" r="3.5" fill="#f48fb1" />
      <circle cx="71" cy="53" r="3.5" fill="#f48fb1" />
      <path d="M51 54 Q56 58 61 54" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  );

  // 8. REALM BOSSES (9 Elemental Guardian Boss Designs)
  const renderBoss = () => {
    if (cleanId.includes('leviathan')) {
      return (
        <g>
          {/* Abyssal Sea Serpent Leviathan (Water Area Boss) */}
          <path d="M20 82 Q28 32 56 26 Q84 32 92 82 Z" fill="#0277bd" stroke={ink} strokeWidth="3.6" strokeLinejoin="round" />
          <polygon points="32,34 14,16 42,26" fill="#00e5ff" stroke={ink} strokeWidth="2.8" />
          <polygon points="80,34 98,16 70,26" fill="#00e5ff" stroke={ink} strokeWidth="2.8" />
          <polygon points="56,8 48,28 64,28" fill="#80deea" stroke={ink} strokeWidth="2.8" />
          <ellipse cx="56" cy="64" rx="22" ry="20" fill="#e1f5fe" stroke={ink} strokeWidth="2.6" />
          {renderAnimeEye(44, 46, '#ffd600', 5)}
          {renderAnimeEye(68, 46, '#ffd600', 5)}
          <path d="M40 62 L48 68 L56 62 L64 68 L72 62" stroke={ink} strokeWidth="3.2" fill="none" strokeLinecap="round" />
        </g>
      );
    }
    if (cleanId.includes('zephyrlord') || cleanId.includes('galecrest')) {
      return (
        <g>
          {/* Sky/Grass Griffon Sovereign */}
          <path d="M34 54 L6 20 L18 62 L38 72 Z" fill={cleanId.includes('gale') ? '#43a047' : '#26c6da'} stroke={ink} strokeWidth="3.2" strokeLinejoin="round" />
          <path d="M78 54 L106 20 L94 62 L74 72 Z" fill={cleanId.includes('gale') ? '#43a047' : '#26c6da'} stroke={ink} strokeWidth="3.2" strokeLinejoin="round" />
          <ellipse cx="56" cy="68" rx="20" ry="22" fill={cleanId.includes('gale') ? '#1b5e20' : '#00838f'} stroke={ink} strokeWidth="3.4" />
          <circle cx="56" cy="40" r="16" fill="#fff8e1" stroke={ink} strokeWidth="3.2" />
          <polygon points="50,44 62,44 56,56" fill="#ffb300" stroke={ink} strokeWidth="2.6" />
          {renderAnimeEye(46, 38, '#d50000', 4.5)}
          {renderAnimeEye(66, 38, '#d50000', 4.5)}
        </g>
      );
    }
    if (cleanId.includes('voltarchon')) {
      return (
        <g>
          {/* Thunder Dynamo Mech-Dragon (Electric Area Boss) */}
          <polygon points="10,40 36,52 16,74" fill="#ffd600" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <polygon points="102,40 76,52 96,74" fill="#ffd600" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <polygon points="28,86 24,36 56,18 88,36 84,86" fill="#37474f" stroke={ink} strokeWidth="3.5" strokeLinejoin="round" />
          <circle cx="56" cy="54" r="16" fill="#ffd600" stroke={ink} strokeWidth="3" />
          <polygon points="56,38 48,56 58,56 52,70 66,50 56,50" fill="#ffffff" stroke={ink} strokeWidth="1.8" />
          {renderAnimeEye(42, 36, '#00e5ff', 4.5)}
          {renderAnimeEye(70, 36, '#00e5ff', 4.5)}
        </g>
      );
    }
    if (cleanId.includes('umbralord')) {
      return (
        <g>
          {/* Void Phantom Wraith-Dragon (Shadow Area Boss) */}
          <path d="M18 84 Q14 34 56 18 Q98 34 94 84 L76 74 L56 88 L36 74 Z" fill="#311b92" stroke={ink} strokeWidth="3.5" strokeLinejoin="round" />
          <polygon points="36,28 20,8 48,22" fill="#b388ff" stroke={ink} strokeWidth="2.8" />
          <polygon points="76,28 92,8 64,22" fill="#b388ff" stroke={ink} strokeWidth="2.8" />
          <ellipse cx="44" cy="48" rx="6" ry="8" fill="#ff1744" stroke={ink} strokeWidth="2.2" />
          <ellipse cx="68" cy="48" rx="6" ry="8" fill="#ff1744" stroke={ink} strokeWidth="2.2" />
          <path d="M38 66 L46 60 L56 68 L66 60 L74 66" stroke="#e040fb" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        </g>
      );
    }
    if (cleanId.includes('ruptor')) {
      return (
        <g>
          {/* Magma Behemoth Golem */}
          <polygon points="22,86 14,42 36,24 56,16 76,24 98,42 90,86" fill="#37474f" stroke={ink} strokeWidth="3.6" strokeLinejoin="round" />
          <path d="M36 28 L56 48 L76 28 M26 62 L56 54 L86 62" stroke="#ff3d00" strokeWidth="4" fill="none" strokeLinecap="round" />
          <polygon points="34,46 50,52 38,58" fill="#ffd600" stroke={ink} strokeWidth="2.2" />
          <polygon points="78,46 62,52 74,58" fill="#ffd600" stroke={ink} strokeWidth="2.2" />
          <path d="M36 74 L44 68 L52 75 L60 68 L68 75 L76 68" stroke="#ff6d00" strokeWidth="3.6" fill="none" strokeLinecap="round" />
        </g>
      );
    }
    if (cleanId.includes('hornet')) {
      return (
        <g>
          <path d="M38 46 Q8 20 16 50 Q24 62 42 54 Z" fill="#ce93d8" stroke={ink} strokeWidth="3" />
          <path d="M74 46 Q104 20 96 50 Q88 62 70 54 Z" fill="#ce93d8" stroke={ink} strokeWidth="3" />
          <ellipse cx="56" cy="70" rx="19" ry="22" fill="#ffd600" stroke={ink} strokeWidth="3.4" />
          <path d="M39 63 H73 M38 73 H74 M42 83 H70" stroke={ink} strokeWidth="5.5" />
          <polygon points="51,91 61,91 56,105" fill="#d50000" stroke={ink} strokeWidth="2.6" />
          <circle cx="56" cy="40" r="15" fill="#311b92" stroke={ink} strokeWidth="3.2" />
          <ellipse cx="48" cy="40" rx="5.5" ry="7" fill="#ff1744" stroke={ink} strokeWidth="2" />
          <ellipse cx="64" cy="40" rx="5.5" ry="7" fill="#ff1744" stroke={ink} strokeWidth="2" />
        </g>
      );
    }
    if (cleanId.includes('wyvern')) {
      return (
        <g>
          <path d="M38 56 L6 24 L16 64 L38 70 Z" fill="#00acc1" stroke={ink} strokeWidth="3.2" strokeLinejoin="round" />
          <path d="M74 56 L106 24 L96 64 L74 70 Z" fill="#00acc1" stroke={ink} strokeWidth="3.2" strokeLinejoin="round" />
          <ellipse cx="56" cy="68" rx="18" ry="23" fill="#006064" stroke={ink} strokeWidth="3.4" />
          <polygon points="40,38 28,12 50,28" fill="#80deea" stroke={ink} strokeWidth="2.8" />
          <polygon points="72,38 84,12 62,28" fill="#80deea" stroke={ink} strokeWidth="2.8" />
          <circle cx="56" cy="40" r="15" fill="#00838f" stroke={ink} strokeWidth="3.2" />
          {renderAnimeEye(49, 40, '#ffd600', 4.5)}
          {renderAnimeEye(63, 40, '#ffd600', 4.5)}
        </g>
      );
    }
    if (cleanId.includes('chimera') || cleanId.includes('pyrostorm')) {
      return (
        <g>
          <circle cx="56" cy="56" r="32" fill="#d50000" stroke={ink} strokeWidth="3.4" />
          <circle cx="56" cy="60" r="21" fill="#ff6d00" stroke={ink} strokeWidth="3" />
          <polygon points="36,36 22,12 48,28" fill="#ffd600" stroke={ink} strokeWidth="2.8" />
          <polygon points="76,36 90,12 64,28" fill="#ffd600" stroke={ink} strokeWidth="2.8" />
          <polygon points="42,49 52,54 44,58" fill="#fffde7" stroke={ink} strokeWidth="2" />
          <polygon points="70,49 60,54 68,58" fill="#fffde7" stroke={ink} strokeWidth="2" />
          <path d="M43 68 Q56 76 69 68" stroke={ink} strokeWidth="3.5" fill="none" />
          <polygon points="46,69 49,77 52,70" fill="#ffffff" stroke={ink} strokeWidth="1.8" />
          <polygon points="60,70 63,77 66,69" fill="#ffffff" stroke={ink} strokeWidth="1.8" />
        </g>
      );
    }
    // Syntax Sovereign (Final Fantasy Light Archon Boss)
    return (
      <g>
        <circle cx="56" cy="54" r="37" fill="none" stroke="#ffd600" strokeWidth="3" strokeDasharray="7 4" />
        <polygon points="56,8 42,32 70,32" fill="#ffd600" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
        <polygon points="28,86 42,34 70,34 84,86" fill="#4a148c" stroke={ink} strokeWidth="3.4" strokeLinejoin="round" />
        <circle cx="56" cy="50" r="14" fill="#12005e" stroke="#ffd600" strokeWidth="3" />
        <circle cx="50" cy="49" r="3.8" fill="#00e5ff" />
        <circle cx="62" cy="49" r="3.8" fill="#00e5ff" />
      </g>
    );
  };

  const renderCreatureGraphic = () => {
    if (cleanId.startsWith('boss_')) return renderBoss();
    if (cleanId.includes('rimepup') || cleanId.includes('frost') || cleanId.includes('cryo') || element === 'ice') {
      return renderRimepup();
    }
    if (cleanId.includes('verdant') || cleanId.includes('sylvan') || cleanId.includes('gaia') || element === 'grass') {
      return renderVerdantsprout();
    }
    if (cleanId.includes('volt') || cleanId.includes('thunder') || element === 'electric') {
      return renderVoltowl();
    }
    if (cleanId.includes('terra') || cleanId.includes('stone') || element === 'earth') {
      return renderTerraturtle();
    }
    if (cleanId.includes('zephyr') || cleanId.includes('gale') || element === 'air') {
      return renderZephyrkit();
    }
    if (cleanId.includes('glimmer') || cleanId.includes('lumina') || element === 'light') {
      return renderGlimmerfae();
    }
    return renderEmberfox();
  };

  const motionClasses = isAttacking
    ? facing === 'right'
      ? 'translate-x-5 -translate-y-2 scale-110'
      : '-translate-x-5 -translate-y-2 scale-110'
    : isHit
    ? 'scale-95 brightness-150 saturate-200'
    : '';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none transition-all duration-200 ${SIZE_MAP[size]} ${
        animated ? 'hover:scale-105' : ''
      } ${motionClasses} ${className}`}
    >
      <svg
        viewBox="0 0 112 112"
        className="w-full h-full overflow-visible drop-shadow-[0_5px_6px_rgba(26,22,43,0.45)]"
      >
        <defs>
          <radialGradient id={`aura-${cleanId}-${stage}`} cx="50%" cy="55%" r="50%">
            <stop offset="0%" stopColor={aura.secondary} stopOpacity={stage >= 2 ? '0.75' : '0.45'} />
            <stop offset="65%" stopColor={aura.primary} stopOpacity={stage >= 3 ? '0.45' : '0.18'} />
            <stop offset="100%" stopColor={aura.primary} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ground Shadow Oval */}
        <ellipse cx="56" cy="99" rx="30" ry="6.5" fill="rgba(26, 22, 43, 0.35)" />

        {/* Elemental Aura Backdrop */}
        <circle cx="56" cy="58" r="45" fill={`url(#aura-${cleanId}-${stage})`} />

        {/* Stage 3 Final-Evolution Digimon/FF Crest Ring */}
        {stage >= 3 && (
          <circle
            cx="56"
            cy="56"
            r="47"
            fill="none"
            stroke={aura.primary}
            strokeWidth="2.4"
            strokeDasharray="6 5"
          />
        )}

        {renderCreatureGraphic()}
      </svg>
    </div>
  );
};
