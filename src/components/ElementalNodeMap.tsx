import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Swords,
  Award,
  CheckCircle2,
  HelpCircle,
  Hammer,
  Gift,
  Crown,
  Maximize2,
  Minimize2,
  Brush,
  Sparkles,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { ELEMENTS } from '../data/elements';
import {
  ELEMENTAL_ADVENTURE_BIOMES,
  ElementalBiomeTheme,
  AdventureStageNode,
  getBiomeByZoneId,
} from '../data/adventureNodesData';
import { CreatureSprite } from './CreatureSprite';
import { juice } from '../engine/juice';
import { Word } from '../types';

interface ElementalNodeMapProps {
  onCloseModal?: () => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export const ElementalNodeMap: React.FC<ElementalNodeMapProps> = ({
  onCloseModal,
  isFullScreen = false,
  onToggleFullScreen,
}) => {
  const {
    creatures,
    playerId,
    activeZoneId,
    setActiveZoneId,
    activeNodeId,
    setActiveNodeId,
    nodeProgress,
    startBattleAtNode,
    completeMapNode,
    commitWord,
    updatePetLoadout,
    levelUpPet,
    recruitWildCompanion,
    addMistakeWord,
    recruitedZones,
    markZoneRecruited,
  } = useGame();
  const { currentUser, addRewards } = useAuth();

  const selectedBiome: ElementalBiomeTheme = getBiomeByZoneId(activeZoneId);
  const selectablePets = creatures.filter((c) => !c.id.startsWith('boss_'));
  const activePet = selectablePets.find((c) => c.id === playerId) || selectablePets[0];

  // Improvement #1: Cloud-parting realm transition banner
  const [realmTransitionText, setRealmTransitionText] = useState<string | null>(null);
  const [recruitBanner, setRecruitBanner] = useState<string | null>(null);
  const [bonusChallengeDone, setBonusChallengeDone] = useState<boolean>(false);

  const frontierNode =
    selectedBiome.nodes.find((n) => !nodeProgress[n.nodeId]?.cleared) ||
    selectedBiome.nodes[selectedBiome.nodes.length - 1];

  const [selectedNode, setSelectedNode] = useState<AdventureStageNode>(() => {
    const match = selectedBiome.nodes.find((n) => n.nodeId === activeNodeId);
    return match || frontierNode;
  });

  useEffect(() => {
    const inBiome = selectedBiome.nodes.find((n) => n.nodeId === activeNodeId);
    if (inBiome) {
      setSelectedNode(inBiome);
    } else {
      const nextFrontier =
        selectedBiome.nodes.find((n) => !nodeProgress[n.nodeId]?.cleared) ||
        selectedBiome.nodes[0];
      setSelectedNode(nextFrontier);
      setActiveNodeId(nextFrontier.nodeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeZoneId]);

  // Quiz state for 'quiz' nodes (X-2, X-6, X-9)
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);

  // Improvement #2: Interactive 6-Tile Fossil Cleaning Grid (2 = Heavy Rock, 1 = Dust Layer, 0 = Clean)
  const [fossilGrid, setFossilGrid] = useState<number[]>([2, 1, 2, 1, 2, 1]);
  const [excavationTool, setExcavationTool] = useState<'hammer' | 'brush'>('hammer');
  const [fossilCracks, setFossilCracks] = useState<number>(0);
  const [tabletUnearthed, setTabletUnearthed] = useState<boolean>(false);

  // Treasure Chest state for 'chest' nodes (X-8)
  const [chestOpened, setChestOpened] = useState<boolean>(false);

  useEffect(() => {
    setQuizIndex(0);
    setSelectedOption(null);
    setCorrectCount(0);
    setQuizCompleted(false);
    const alreadyCleared = Boolean(nodeProgress[selectedNode.nodeId]?.cleared);
    setFossilGrid(alreadyCleared ? [0, 0, 0, 0, 0, 0] : [2, 1, 2, 1, 2, 1]);
    setFossilCracks(0);
    setTabletUnearthed(alreadyCleared);
    setChestOpened(alreadyCleared);
    setRecruitBanner(null);
    setBonusChallengeDone(false);
  }, [selectedNode.nodeId, nodeProgress]);

  const getBiomeStars = (biome: ElementalBiomeTheme) =>
    biome.nodes.reduce((sum, n) => sum + (nodeProgress[n.nodeId]?.stars || 0), 0);

  const currentBiomeStars = getBiomeStars(selectedBiome);
  const currentBiomeIdx = ELEMENTAL_ADVENTURE_BIOMES.findIndex(
    (b) => b.zoneId === selectedBiome.zoneId
  );

  const isNodeUnlocked = (node: AdventureStageNode): boolean => {
    if (node.stageNumber === 1) return true;
    if (nodeProgress[node.nodeId]?.cleared) return true;
    const prevCode = `${selectedBiome.order}-${node.stageNumber - 1}`;
    return Boolean(nodeProgress[prevCode]?.cleared);
  };

  const handleSwitchRealm = (biome: ElementalBiomeTheme) => {
    if (biome.zoneId === selectedBiome.zoneId) return;
    juice.click();
    setRealmTransitionText(`Traveling to ${biome.name}...`);
    setActiveZoneId(biome.zoneId);
    setTimeout(() => setRealmTransitionText(null), 900);
  };

  const handleStepRealm = (delta: -1 | 1) => {
    const nextIdx =
      (currentBiomeIdx + delta + ELEMENTAL_ADVENTURE_BIOMES.length) %
      ELEMENTAL_ADVENTURE_BIOMES.length;
    handleSwitchRealm(ELEMENTAL_ADVENTURE_BIOMES[nextIdx]);
  };

  const handleSelectNode = (node: AdventureStageNode) => {
    juice.click();
    setSelectedNode(node);
    setActiveNodeId(node.nodeId);
  };

  // Improvement #4: Recruit Wild Companion on Mid-Boss / Boss Stage
  const handleRecruitWildCompanion = () => {
    if (recruitedZones.includes(selectedBiome.zoneId)) return;
    const recruited = recruitWildCompanion(selectedBiome.zoneId);
    markZoneRecruited(selectedBiome.zoneId);
    if (recruited) {
      setRecruitBanner(`🎉 Befriended ${recruited.name} (+1 Level Boost)!`);
    }
  };

  // Handle answering a mini-quiz question
  const handleSelectQuizOption = (optIdx: number) => {
    if (selectedOption !== null || !selectedNode.quizQuestions) return;
    setSelectedOption(optIdx);
    const currentQ = selectedNode.quizQuestions[quizIndex];
    const isCorrect = optIdx === currentQ.correctIndex;

    if (isCorrect) {
      juice.ding(880, 140);
      juice.speakWord(currentQ.focusWord);
      setCorrectCount((c) => c + 1);
    } else {
      juice.boing();
      addMistakeWord(currentQ.focusWord);
    }
  };

  const handleNextQuizQuestion = () => {
    if (!selectedNode.quizQuestions) return;
    if (quizIndex + 1 < selectedNode.quizQuestions.length) {
      setQuizIndex((i) => i + 1);
      setSelectedOption(null);
    } else {
      const earnedStars = Math.max(1, Math.min(3, correctCount));
      completeMapNode(selectedBiome.zoneId, selectedNode.nodeId, earnedStars);
      addRewards({
        coins: selectedNode.rewardCoins,
        tokens: selectedNode.rewardGems,
        xp: 35,
      });
      juice.fanfare();
      setQuizCompleted(true);
    }
  };

  // Improvement #2: Interactive 6-Tile Fossil Cleaning Grid Handler
  const handleStrikeFossilTile = (tileIdx: number) => {
    if (!selectedNode.digSiteTablet || tabletUnearthed) return;
    const currentLayer = fossilGrid[tileIdx];
    if (currentLayer <= 0) return;

    const nextGrid = [...fossilGrid];
    let nextCracks = fossilCracks;

    if (excavationTool === 'hammer') {
      if (currentLayer === 1) {
        nextCracks += 1;
        juice.boing();
      } else {
        juice.ding(580, 110);
      }
      nextGrid[tileIdx] = Math.max(0, currentLayer - 2);
    } else {
      juice.ding(760, 90);
      nextGrid[tileIdx] = Math.max(0, currentLayer - 1);
    }

    setFossilGrid(nextGrid);
    setFossilCracks(nextCracks);

    if (nextGrid.every((val) => val === 0)) {
      const tablet = selectedNode.digSiteTablet;
      const flawlessBonus = nextCracks === 0 ? 2 : 0;
      const newWordCard: Word = {
        id: tablet.id,
        word: tablet.word,
        partOfSpeech: tablet.partOfSpeech,
        element: tablet.element,
        gradeTier: tablet.gradeTier,
        powerBonus: tablet.powerBonus + flawlessBonus,
        definition: tablet.definition,
        example: tablet.example,
        morphologyNote: tablet.morphologyNote,
      };
      commitWord(newWordCard);
      updatePetLoadout(activePet.id, tablet.partOfSpeech, tablet.id);
      completeMapNode(selectedBiome.zoneId, selectedNode.nodeId, nextCracks === 0 ? 3 : 2);
      addRewards({
        coins: selectedNode.rewardCoins + (flawlessBonus ? 25 : 0),
        tokens: selectedNode.rewardGems,
        xp: 50,
      });
      setTabletUnearthed(true);
      juice.fanfare();
      juice.speakWord(`${tablet.word}. ${tablet.definition}`);
    }
  };

  const handleOpenSupplyChest = () => {
    if (chestOpened) return;
    setChestOpened(true);
    completeMapNode(selectedBiome.zoneId, selectedNode.nodeId, 3);
    addRewards({
      coins: selectedNode.rewardCoins,
      tokens: selectedNode.rewardGems,
      xp: 50,
    });
    levelUpPet(activePet.id, 1);
    juice.fanfare();
  };

  const buildSmoothSCurvePath = (nodes: AdventureStageNode[]) => {
    const pts = nodes.map((n) => ({
      x: (n.xPct / 100) * 500,
      y: (n.yPct / 100) * 1050,
    }));
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const midY = (prev.y + curr.y) / 2;
      d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  const buildSteppingStones = (nodes: AdventureStageNode[]) => {
    const stones: { x: number; y: number; angle: number }[] = [];
    for (let i = 1; i < nodes.length; i++) {
      const p0 = { x: (nodes[i - 1].xPct / 100) * 500, y: (nodes[i - 1].yPct / 100) * 1050 };
      const p1 = { x: (nodes[i].xPct / 100) * 500, y: (nodes[i].yPct / 100) * 1050 };
      const steps = 4;
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const midY = (p0.y + p1.y) / 2;
        const u = 1 - t;
        const bx =
          u * u * u * p0.x +
          3 * u * u * t * p0.x +
          3 * u * t * t * p1.x +
          t * t * t * p1.x;
        const by =
          u * u * u * p0.y +
          3 * u * u * t * midY +
          3 * u * t * t * midY +
          t * t * t * p1.y;
        const angle = ((i + s) % 2 === 0 ? 1 : -1) * 8;
        stones.push({ x: bx, y: by, angle });
      }
    }
    return stones;
  };

  const sCurvePathD = buildSmoothSCurvePath(selectedBiome.nodes);
  const steppingStones = buildSteppingStones(selectedBiome.nodes);

  const renderBiomeScenery = (biome: ElementalBiomeTheme) => {
    const ink = '#1a162b';
    const isIce = biome.element === 'ice';
    const isShadow = biome.element === 'shadow';
    const isEarth = biome.element === 'earth';
    const isWater = biome.element === 'water';
    const isFire = biome.element === 'fire';

    const treeCanopy = isIce
      ? '#38bdf8'
      : isShadow
      ? '#7e22ce'
      : isEarth
      ? '#d97706'
      : isFire
      ? '#ea580c'
      : isWater
      ? '#0284c7'
      : '#4d7c0f';
    const treeHighlight = isIce
      ? '#7dd3fc'
      : isShadow
      ? '#a855f7'
      : isEarth
      ? '#fbbf24'
      : isFire
      ? '#fb923c'
      : isWater
      ? '#38bdf8'
      : '#84cc16';

    return (
      <g>
        {[
          { cx: (biome.nodes[0].xPct / 100) * 500, cy: (biome.nodes[0].yPct / 100) * 1050, r: 52 },
          { cx: (biome.nodes[4].xPct / 100) * 500, cy: (biome.nodes[4].yPct / 100) * 1050, r: 48 },
        ].map((spiral, idx) => (
          <g key={idx} opacity="0.9">
            <ellipse
              cx={spiral.cx}
              cy={spiral.cy + 6}
              rx={spiral.r}
              ry={spiral.r * 0.68}
              fill={biome.steppingStoneColor}
              stroke={biome.steppingStoneBorder}
              strokeWidth="4"
            />
            <path
              d={`M ${spiral.cx} ${spiral.cy + 6} m -26 0 a 26 18 0 1 0 52 0 a 20 14 0 1 0 -40 0 a 12 8 0 1 0 24 0`}
              fill="none"
              stroke={biome.steppingStoneBorder}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>
        ))}

        <g transform="translate(105, 135)">
          <ellipse
            cx="0"
            cy="0"
            rx="62"
            ry="28"
            fill={isFire ? '#f97316' : isIce ? '#bae6fd' : '#38bdf8'}
            stroke={ink}
            strokeWidth="3.5"
          />
          <ellipse
            cx="-6"
            cy="-4"
            rx="44"
            ry="18"
            fill={isFire ? '#fde047' : '#7dd3fc'}
            opacity="0.7"
          />
        </g>

        <g transform="translate(215, 650)">
          <ellipse
            cx="0"
            cy="12"
            rx="68"
            ry="32"
            fill="#d6c59a"
            stroke="#78350f"
            strokeWidth="3"
          />
          <path
            d="M-55,-8 L-55,14 M-25,-14 L-25,8 M15,-14 L15,8 M48,-6 L48,16 M-58,0 L48,-2"
            stroke="#78350f"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M-36,12 Q0,4 38,14 M-24,2 Q-26,16 -18,22 M-8,0 Q-10,16 -2,22 M8,2 Q6,16 14,22"
            stroke="#fef3c7"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        <g transform="translate(310, 385) rotate(-12)">
          <rect
            x="-36"
            y="-18"
            width="72"
            height="36"
            rx="6"
            fill="#92400e"
            stroke={ink}
            strokeWidth="3"
          />
          <line x1="-20" y1="-18" x2="-20" y2="18" stroke="#451a03" strokeWidth="3" />
          <line x1="0" y1="-18" x2="0" y2="18" stroke="#451a03" strokeWidth="3" />
          <line x1="20" y1="-18" x2="20" y2="18" stroke="#451a03" strokeWidth="3" />
        </g>

        {[
          { x: 95, y: 840, scale: 1.0 },
          { x: 425, y: 740, scale: 1.05 },
          { x: 420, y: 260, scale: 0.95 },
          { x: 90, y: 460, scale: 0.9 },
        ].map((tree, idx) => (
          <g
            key={idx}
            transform={`translate(${tree.x}, ${tree.y}) scale(${tree.scale})`}
            stroke={ink}
            strokeWidth="3"
          >
            <ellipse cx="0" cy="28" rx="28" ry="10" fill="#000000" opacity="0.2" stroke="none" />
            <rect x="-8" y="-2" width="16" height="30" rx="3" fill="#78350f" />
            <circle cx="-18" cy="-16" r="24" fill={treeCanopy} />
            <circle cx="18" cy="-16" r="24" fill={treeCanopy} />
            <circle cx="0" cy="-34" r="28" fill={treeHighlight} />
          </g>
        ))}

        {[
          { x: 425, y: 540 },
          { x: 80, y: 310 },
        ].map((rock, idx) => (
          <g key={idx} transform={`translate(${rock.x}, ${rock.y})`} stroke={ink} strokeWidth="3">
            <polygon
              points="-28,18 -18,-14 14,-18 30,18"
              fill={isIce ? '#7dd3fc' : isShadow ? '#6b21a8' : '#78716c'}
              strokeLinejoin="round"
            />
            <polygon
              points="-18,-14 14,-18 6,18 -14,18"
              fill={isIce ? '#bae6fd' : isShadow ? '#9333ea' : '#a8a29e'}
              strokeLinejoin="round"
            />
          </g>
        ))}

        <g transform="translate(115, 910)" stroke={ink} strokeWidth="2.8">
          <ellipse cx="0" cy="12" rx="38" ry="16" fill="#fef3c7" opacity="0.6" stroke="none" />
          <path d="M-16,12 V-2 H-4 V12 Z" fill="#fef3c7" />
          <path d="M-28,0 Q-10,-22 8,0 Z" fill={isEarth ? '#f97316' : '#ef4444'} />
          <circle cx="-14" cy="-8" r="3" fill="#ffffff" stroke="none" />
          <circle cx="-6" cy="-5" r="2.5" fill="#ffffff" stroke="none" />
          <path d="M12,14 V4 H20 V14 Z" fill="#fef3c7" />
          <path d="M4,6 Q16,-10 28,6 Z" fill="#38bdf8" />
        </g>
      </g>
    );
  };

  return (
    <div className="space-y-3.5 relative">
      {/* Improvement #1: Animated Cloud-Parting Realm Transition Overlay */}
      {realmTransitionText && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-sky-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="rounded-3xl border-[4px] border-[#1a162b] bg-gradient-to-r from-[#fef08a] via-[#facc15] to-[#f59e0b] px-8 py-4 text-center shadow-[0_8px_0_#1a162b]">
            <div className="font-display text-xl sm:text-2xl font-black text-[#1a162b]">
              ☁️ {realmTransitionText} ☁️
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DECLUTTER #11: COMPACT ◀ CURRENT REALM ▶ SELECTOR & DROPDOWN BAR
      ====================================================================== */}
      <div className="rounded-2xl border-[3px] border-[#1a162b] bg-[#1e293b] px-3 py-2 text-white shadow-[0_4px_0_#1a162b]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* ◀ Current Realm ▶ Selector + Dropdown */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStepRealm(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#1a162b] bg-[#334155] hover:bg-[#475569] font-display text-sm font-black text-[#fde047] shadow-[0_2px_0_#1a162b] cursor-pointer"
              title="Previous Realm"
            >
              ◀
            </button>

            <select
              aria-label="Select Elemental Realm"
              value={selectedBiome.zoneId}
              onChange={(e) => {
                const found = ELEMENTAL_ADVENTURE_BIOMES.find((b) => b.zoneId === e.target.value);
                if (found) handleSwitchRealm(found);
              }}
              className="rounded-xl border-2 border-[#fde047] bg-[#0f172a] px-3 py-1.5 font-display text-xs sm:text-sm font-black text-[#fde047] shadow-inner cursor-pointer focus:outline-none"
            >
              {ELEMENTAL_ADVENTURE_BIOMES.map((biome) => {
                const elemMeta = ELEMENTS[biome.element] || ELEMENTS.grass;
                const stars = getBiomeStars(biome);
                return (
                  <option key={biome.zoneId} value={biome.zoneId}>
                    {biome.order}. {elemMeta.icon} {biome.name} ({biome.gradeBand}) — ★ {stars}/30
                  </option>
                );
              })}
            </select>

            <button
              type="button"
              onClick={() => handleStepRealm(1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#1a162b] bg-[#334155] hover:bg-[#475569] font-display text-sm font-black text-[#fde047] shadow-[0_2px_0_#1a162b] cursor-pointer"
              title="Next Realm"
            >
              ▶
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-black">
            <span className="rounded-xl bg-[#0f172a] border-2 border-amber-400/50 px-3 py-1 text-[#fde047]">
              ★ {currentBiomeStars} / 30 Stars
            </span>

            {onToggleFullScreen && (
              <button
                type="button"
                onClick={onToggleFullScreen}
                className="flex items-center gap-1 rounded-xl border-2 border-[#fde047] bg-[#334155] hover:bg-[#475569] px-2.5 py-1 text-[10px] font-black uppercase text-[#fde047] cursor-pointer"
                title="Toggle Full-Screen Adventure Map"
              >
                {isFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                <span>{isFullScreen ? 'Windowed' : 'Full Screen'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. MAIN SPLIT VIEW:
             - Left (7 Cols): Scrollable Winding S-Curve Elemental Node Map (10 Nodes)
             - Right (5 Cols): Interactive Stage Briefing, 6-Tile Fossil Dig & Mini-Quiz
      ====================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT 7 COLS: VERTICAL WINDING S-CURVE ADVENTURE NODE MAP */}
        <div className="lg:col-span-7 relative rounded-3xl border-[4px] border-[#1a162b] shadow-[0_7px_0_#1a162b] overflow-hidden">
          <div className="flex items-center justify-between bg-[#1a162b] px-4 py-2 text-white border-b-[3px] border-[#1a162b]">
            <div className="flex items-center gap-2">
              <span className="text-lg">{ELEMENTS[selectedBiome.element]?.icon}</span>
              <div>
                <div className="font-display text-xs sm:text-sm font-black text-[#fde047]">
                  {selectedBiome.name} — 10-Stage Trail ({selectedBiome.order}-1 to{' '}
                  {selectedBiome.order}-10)
                </div>
                <div className="text-[10px] font-bold text-slate-300">
                  Focus: {selectedBiome.grammarFocus}
                </div>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-400 px-2.5 py-0.5 font-mono text-[10px] font-black text-emerald-300">
              Click Any Stage
            </span>
          </div>

          <div
            className={`relative ${
              isFullScreen ? 'h-[640px]' : 'h-[500px]'
            } overflow-y-auto overflow-x-hidden select-none`}
          >
            <div
              className="relative w-full h-[980px]"
              style={{
                background: `linear-gradient(180deg, ${selectedBiome.bgGradientTo} 0%, ${selectedBiome.bgGradientVia} 50%, ${selectedBiome.bgGradientFrom} 100%)`,
              }}
            >
              <svg
                viewBox="0 0 500 1050"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <rect x="0" y="0" width="26" height="1050" fill="#000000" opacity="0.14" />
                <rect x="474" y="0" width="26" height="1050" fill="#000000" opacity="0.14" />

                <path
                  d={sCurvePathD}
                  fill="none"
                  stroke={selectedBiome.roadBorderColor}
                  strokeWidth="54"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={sCurvePathD}
                  fill="none"
                  stroke={selectedBiome.roadStrokeColor}
                  strokeWidth="42"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {steppingStones.map((st, idx) => (
                  <g key={idx} transform={`translate(${st.x}, ${st.y}) rotate(${st.angle})`}>
                    <rect
                      x="-18"
                      y="-9"
                      width="36"
                      height="18"
                      rx="6"
                      fill={selectedBiome.steppingStoneColor}
                      stroke={selectedBiome.steppingStoneBorder}
                      strokeWidth="2.8"
                    />
                  </g>
                ))}

                {renderBiomeScenery(selectedBiome)}
              </svg>

              {selectedBiome.nodes.map((node) => {
                const prog = nodeProgress[node.nodeId] || { stars: 0, cleared: false };
                const unlocked = isNodeUnlocked(node);
                const isSelected = selectedNode.nodeId === node.nodeId;
                const isFrontier = frontierNode.nodeId === node.nodeId;

                return (
                  <div
                    key={node.nodeId}
                    style={{
                      left: `${node.xPct}%`,
                      top: `${node.yPct}%`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
                  >
                    <div className="flex items-end gap-0.5 -mb-1 z-20 pointer-events-none">
                      {[1, 2, 3].map((starIdx) => {
                        const earned = prog.stars >= starIdx;
                        return (
                          <span
                            key={starIdx}
                            className={`text-base sm:text-lg leading-none drop-shadow-[0_2px_0_#1a162b] ${
                              starIdx === 2 ? '-translate-y-1 scale-110' : ''
                            } ${earned ? 'text-[#facc15]' : 'text-slate-900/45'}`}
                          >
                            ★
                          </span>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectNode(node)}
                      className={`relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-[4px] transition-all cursor-pointer ${
                        isSelected
                          ? 'scale-115 ring-4 ring-[#fde047] shadow-[0_7px_0_#1a162b,0_0_20px_rgba(250,204,21,0.95)]'
                          : unlocked
                          ? 'hover:scale-108 shadow-[0_6px_0_#1a162b]'
                          : 'opacity-80 hover:opacity-100 shadow-[0_4px_0_#1a162b]'
                      }`}
                      style={{
                        borderColor: selectedBiome.nodeBtnRing,
                        background: `linear-gradient(180deg, ${selectedBiome.nodeBtnTop} 0%, ${selectedBiome.nodeBtnBottom} 100%)`,
                      }}
                    >
                      <div className="pointer-events-none absolute top-1 left-2.5 right-2.5 h-3.5 rounded-full bg-white/35" />

                      {node.type === 'digsite' ? (
                        <Hammer className="h-6 w-6 text-white drop-shadow-[0_2px_0_#1a162b]" />
                      ) : node.type === 'quiz' ? (
                        <HelpCircle className="h-6 w-6 text-white drop-shadow-[0_2px_0_#1a162b]" />
                      ) : node.type === 'chest' ? (
                        <Gift className="h-6 w-6 text-white drop-shadow-[0_2px_0_#1a162b]" />
                      ) : node.type === 'boss' ? (
                        <Crown className="h-7 w-7 text-[#fde047] drop-shadow-[0_2px_0_#1a162b]" />
                      ) : node.type === 'midboss' ? (
                        <Swords className="h-6 w-6 text-[#fde047] drop-shadow-[0_2px_0_#1a162b]" />
                      ) : (
                        <svg
                          viewBox="0 0 40 40"
                          className="h-8 w-8 drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]"
                        >
                          <polygon
                            points="20,2 25,15 38,20 25,25 20,38 15,25 2,20 15,15"
                            fill="#ffffff"
                          />
                        </svg>
                      )}

                      <span className="absolute -bottom-2.5 rounded-full border-2 border-[#1a162b] bg-[#1a162b] px-2 py-0.2 font-mono text-[10px] font-black text-[#fde047] shadow">
                        {node.code}
                      </span>
                    </button>

                    <span className="mt-3 rounded-md bg-[#1a162b]/85 px-2 py-0.5 font-display text-[9px] font-black uppercase tracking-wider text-white border border-white/20">
                      {node.type === 'digsite'
                        ? '🦴 Fossil Dig'
                        : node.type === 'quiz'
                        ? '📝 Field Quiz'
                        : node.type === 'chest'
                        ? '🎁 Supply Chest'
                        : node.type === 'midboss'
                        ? '⚔️ Mid-Boss'
                        : node.type === 'boss'
                        ? '👑 Realm Boss'
                        : '✦ Battle'}
                    </span>

                    {isFrontier && (
                      <div className="pointer-events-none absolute -right-24 top-1 flex items-center gap-1 rounded-2xl border-[3px] border-[#1a162b] bg-[#fff8e7] px-2 py-1 shadow-[0_4px_0_#1a162b] animate-bounce">
                        <span className="text-base">
                          {currentUser?.avatarConfig?.emoji || '🦊'}
                        </span>
                        <CreatureSprite
                          creatureId={activePet.forged?.sourceId || activePet.id}
                          stage={activePet.stage || 1}
                          element={activePet.element}
                          size="xs"
                          animated={false}
                        />
                        <span className="font-display text-[9px] font-black uppercase text-[#d84315]">
                          HERE!
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Declutter #13: Only render Secret/Relic pins when their prerequisite stage (X-5 or X-8) is cleared */}
              {Boolean(nodeProgress[selectedBiome.nodes[4]?.nodeId]?.cleared) && (
                <button
                  type="button"
                  onClick={() => {
                    juice.ding(760, 120);
                    if (!bonusChallengeDone) {
                      addRewards({ coins: 60, tokens: 1, xp: 30 });
                      setBonusChallengeDone(true);
                    }
                  }}
                  style={{ left: '84%', top: '52%' }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-pointer group"
                  title="Discovered Secret Branch Node X-5B"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-[#fde047] bg-gradient-to-b from-purple-700 to-indigo-950 text-xl shadow-[0_4px_0_#1a162b] group-hover:scale-110 transition">
                    🗝️
                  </div>
                  <span className="mt-1 rounded bg-[#1a162b] px-1.5 py-0.2 font-mono text-[9px] font-black text-[#fde047] border border-[#fde047]/50">
                    {selectedBiome.order}-5B Secret
                  </span>
                </button>
              )}

              {Boolean(nodeProgress[selectedBiome.nodes[7]?.nodeId]?.cleared) && (
                <button
                  type="button"
                  onClick={() => {
                    juice.ding(820, 120);
                    if (!bonusChallengeDone) {
                      addRewards({ coins: 60, tokens: 1, xp: 30 });
                      setBonusChallengeDone(true);
                    }
                  }}
                  style={{ left: '16%', top: '28%' }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-pointer group"
                  title="Discovered Wandering Word Merchant X-8B"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-[#fde047] bg-gradient-to-b from-amber-500 to-orange-700 text-xl shadow-[0_4px_0_#1a162b] group-hover:scale-110 transition">
                    🐫
                  </div>
                  <span className="mt-1 rounded bg-[#1a162b] px-1.5 py-0.2 font-mono text-[9px] font-black text-amber-200 border border-amber-400/50">
                    {selectedBiome.order}-8B Caravan
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ===================================================================
            DECLUTTER #12: MERGED SINGLE FOCUSED STAGE CARD + 1 OPTIONAL BONUS CHALLENGE
        ==================================================================== */}
        <div className="lg:col-span-5 rounded-3xl border-[4px] border-[#1a162b] bg-white p-4 sm:p-5 shadow-[0_7px_0_#1a162b] space-y-4">
          <div className="flex items-center justify-between gap-2 border-b-2 border-amber-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-[#1a162b] px-2.5 py-0.5 font-mono text-xs font-black text-[#fde047]">
                  STAGE {selectedNode.code}
                </span>
                <span className="font-mono text-sm font-black text-[#f59e0b]">
                  {'★'.repeat(nodeProgress[selectedNode.nodeId]?.stars || 0)}
                  {'☆'.repeat(3 - (nodeProgress[selectedNode.nodeId]?.stars || 0))}
                </span>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-black text-[#1a162b] mt-1">
                {selectedNode.title}
              </h3>
              <p className="text-xs font-bold text-[#5d4037]">{selectedNode.subtitle}</p>
            </div>
            {nodeProgress[selectedNode.nodeId]?.cleared && (
              <span className="flex items-center gap-1 rounded-xl bg-emerald-100 border-2 border-emerald-700 px-2.5 py-1 text-[11px] font-black text-emerald-800">
                <CheckCircle2 className="h-4 w-4" /> Cleared
              </span>
            )}
          </div>

          {/* =================================================================
              ENCOUNTER TYPE A: COMBAT / MID-BOSS / GUARDIAN BOSS (1, 3, 5, 7, 10)
          ================================================================== */}
          {(selectedNode.type === 'combat' ||
            selectedNode.type === 'midboss' ||
            selectedNode.type === 'boss') && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-4 rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-r from-[#fff8e7] to-[#fde68a] p-3.5 shadow-[0_4px_0_#1a162b]">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-[3px] border-[#1a162b] bg-white shrink-0">
                  <CreatureSprite
                    creatureId={
                      selectedNode.type === 'boss'
                        ? selectedBiome.bossId
                        : selectedNode.type === 'midboss'
                        ? selectedBiome.midBossId
                        : selectedBiome.vanguardId
                    }
                    stage={
                      selectedNode.type === 'boss' ? 3 : selectedNode.type === 'midboss' ? 2 : 1
                    }
                    element={selectedBiome.element}
                    size="md"
                  />
                </div>
                <div className="min-w-0">
                  <span className="inline-block rounded-md bg-[#c62828] px-2 py-0.5 text-[10px] font-black uppercase text-white">
                    {selectedNode.type === 'boss'
                      ? '👑 Realm Guardian Boss'
                      : selectedNode.type === 'midboss'
                      ? '⚔️ Ammonite Gate Mid-Boss'
                      : '✦ Trail Vanguard'}
                  </span>
                  <div className="font-display text-lg font-black text-[#1a162b] truncate mt-0.5">
                    {selectedNode.enemyName}
                  </div>
                  <div className="text-xs font-bold text-[#5d4037]">
                    Lv.{selectedNode.enemyLevel || 10} · {ELEMENTS[selectedBiome.element]?.name}{' '}
                    Element
                  </div>
                </div>
              </div>

              {(selectedNode.type === 'midboss' || selectedNode.type === 'boss') && (
                <div className="rounded-2xl border-2 border-emerald-700 bg-emerald-50 p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-5 w-5 text-emerald-700 shrink-0" />
                    <div>
                      <div className="font-display text-xs font-black text-emerald-950">
                        🐾 Wild {ELEMENTS[selectedBiome.element]?.name} Companion Encounter
                      </div>
                      <p className="text-[11px] font-semibold text-emerald-800">
                        {recruitedZones.includes(selectedBiome.zoneId)
                          ? 'Recruited & boosted in your Pet Hatchery!'
                          : 'Clear this stage or click to befriend for your Hatchery!'}
                      </p>
                    </div>
                  </div>
                  {!recruitedZones.includes(selectedBiome.zoneId) && (
                    <button
                      type="button"
                      onClick={handleRecruitWildCompanion}
                      className="rounded-xl border-2 border-[#1a162b] bg-[#fde047] hover:bg-[#facc15] px-3 py-1.5 font-display text-[10px] font-black uppercase text-[#1a162b] shadow-[0_2px_0_#1a162b] cursor-pointer shrink-0"
                    >
                      Befriend Pet
                    </button>
                  )}
                </div>
              )}

              {recruitBanner && (
                <div className="rounded-xl border-2 border-[#1a162b] bg-[#fde047] px-3 py-2 text-center font-display text-xs font-black text-[#1a162b]">
                  {recruitBanner}
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl bg-amber-50 border-2 border-amber-300 px-3 py-2 text-xs font-black text-[#78350f]">
                <span>Victory Rewards:</span>
                <span>
                  +{selectedNode.rewardCoins} 🪙 · +{selectedNode.rewardGems} 💎 · +1 Pet Lv
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onCloseModal) onCloseModal();
                  const stageTier: 1 | 2 | 3 =
                    selectedNode.type === 'boss'
                      ? 3
                      : selectedNode.type === 'midboss'
                      ? 2
                      : 1;
                  const spriteId =
                    selectedNode.type === 'boss'
                      ? selectedBiome.bossId
                      : selectedNode.type === 'midboss'
                      ? selectedBiome.midBossId
                      : selectedBiome.vanguardId;
                  startBattleAtNode(
                    selectedBiome.zoneId,
                    selectedNode.nodeId,
                    spriteId,
                    selectedNode.enemyName,
                    stageTier
                  );
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-b from-[#4ade80] to-[#16a34a] hover:brightness-105 text-[#1a162b] font-display font-black text-base uppercase tracking-wider border-[3px] border-[#1a162b] shadow-[0_5px_0_#1a162b] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Swords className="h-5 w-5" />
                <span>▶ ENTER BATTLE</span>
              </button>
            </div>
          )}

          {/* =================================================================
              ENCOUNTER TYPE B: INTERACTIVE 6-TILE FOSSIL EXCAVATION MINI-GAME (X-4)
          ================================================================== */}
          {selectedNode.type === 'digsite' && selectedNode.digSiteTablet && (
            <div className="space-y-3.5">
              <div className="rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-b from-[#fef3c7] to-[#fde68a] p-4 text-center space-y-3 shadow-[0_4px_0_#1a162b]">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#78350f] px-3 py-0.5 font-display text-[10px] font-black uppercase tracking-wider text-[#fde047]">
                    🦴 6-Tile Fossil Cleaning Bench
                  </span>
                  <span className="font-mono text-[11px] font-black text-[#92400e]">
                    Cracks: {fossilCracks} {fossilCracks === 0 ? '(Flawless +2 Pwr!)' : ''}
                  </span>
                </div>

                {!tabletUnearthed ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          juice.click();
                          setExcavationTool('hammer');
                        }}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2 font-display text-xs font-black cursor-pointer transition ${
                          excavationTool === 'hammer'
                            ? 'border-[#1a162b] bg-[#f59e0b] text-[#1a162b] shadow-[0_3px_0_#1a162b]'
                            : 'border-[#78350f]/40 bg-white/80 text-[#78350f]'
                        }`}
                      >
                        <Hammer className="h-4 w-4" />
                        <span>Hammer (-2 Rock)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          juice.click();
                          setExcavationTool('brush');
                        }}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2 font-display text-xs font-black cursor-pointer transition ${
                          excavationTool === 'brush'
                            ? 'border-[#1a162b] bg-[#38bdf8] text-[#1a162b] shadow-[0_3px_0_#1a162b]'
                            : 'border-[#78350f]/40 bg-white/80 text-[#78350f]'
                        }`}
                      >
                        <Brush className="h-4 w-4" />
                        <span>Brush (-1 Dust)</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-[#451a03] border-[3px] border-[#1a162b]">
                      {fossilGrid.map((layer, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleStrikeFossilTile(idx)}
                          className={`h-16 rounded-xl border-2 border-[#1a162b] flex flex-col items-center justify-center font-mono text-xs font-black transition cursor-pointer ${
                            layer === 2
                              ? 'bg-gradient-to-b from-[#78716c] to-[#57534e] text-amber-200 hover:brightness-110 shadow-[0_3px_0_#1a162b]'
                              : layer === 1
                              ? 'bg-gradient-to-b from-[#d6c59a] to-[#b45309] text-white hover:brightness-110 shadow-[0_2px_0_#1a162b]'
                              : 'bg-emerald-500 text-white'
                          }`}
                        >
                          {layer === 2 && (
                            <>
                              <span>🪨 HARD ROCK</span>
                              <span className="text-[9px] text-amber-300">Use Hammer</span>
                            </>
                          )}
                          {layer === 1 && (
                            <>
                              <span>🏜️ SAND DUST</span>
                              <span className="text-[9px] text-amber-100">Use Brush</span>
                            </>
                          )}
                          {layer === 0 && <span>✨ CLEAN!</span>}
                        </button>
                      ))}
                    </div>

                    <p className="text-[11px] font-bold text-[#5d4037]">
                      Tip: Use the <strong>Hammer</strong> on Hard Rock and the{' '}
                      <strong>Brush</strong> on Sand Dust for a{' '}
                      <strong>Flawless Excavation (+2 Bonus Power)</strong>!
                    </p>
                  </>
                ) : (
                  <div className="rounded-2xl border-[3px] border-[#1a162b] bg-white p-4 text-left space-y-2 shadow">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                        {fossilCracks === 0
                          ? '★ Flawless Word Tablet (+2 Bonus Power)!'
                          : '✓ Word Tablet Unearthed & Equipped!'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          juice.speakWord(
                            `${selectedNode.digSiteTablet?.word}. ${selectedNode.digSiteTablet?.definition}`
                          )
                        }
                        className="flex items-center gap-1 rounded-lg border-2 border-[#1a162b] bg-[#fde047] px-2.5 py-1 text-xs font-black text-[#1a162b] cursor-pointer"
                      >
                        <Volume2 className="h-3.5 w-3.5" /> Speak
                      </button>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="font-display text-2xl font-black text-[#1a162b]">
                        {selectedNode.digSiteTablet.word}
                      </span>
                      <span className="font-mono text-xs font-black uppercase text-[#d97706]">
                        {selectedNode.digSiteTablet.partOfSpeech} · +
                        {selectedNode.digSiteTablet.powerBonus + (fossilCracks === 0 ? 2 : 0)} Power
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      {selectedNode.digSiteTablet.definition}
                    </p>
                    <div className="rounded-xl bg-amber-50 border border-amber-300 p-2 text-[11px] font-semibold text-[#78350f]">
                      “{selectedNode.digSiteTablet.example}”
                    </div>
                    <div className="text-[11px] font-black text-emerald-800">
                      🔬 {selectedNode.digSiteTablet.morphologyNote}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================================================================
              ENCOUNTER TYPE C: 3-QUESTION GRAMMAR & MORPHOLOGY MINI-QUIZ (2, 6, 9)
          ================================================================== */}
          {selectedNode.type === 'quiz' && selectedNode.quizQuestions && (
            <div className="space-y-3.5">
              {!quizCompleted ? (
                <>
                  <div className="flex items-center justify-between rounded-xl bg-indigo-950 px-3 py-2 text-white">
                    <span className="font-display text-xs font-black text-[#fde047]">
                      📝 Question {quizIndex + 1} of {selectedNode.quizQuestions.length}
                    </span>
                    <span className="font-mono text-xs font-black text-emerald-300">
                      Score: {correctCount} / {selectedNode.quizQuestions.length}
                    </span>
                  </div>

                  <div className="rounded-2xl border-[3px] border-[#1a162b] bg-[#fff8e7] p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display text-sm sm:text-base font-black text-[#1a162b]">
                        {selectedNode.quizQuestions[quizIndex].prompt}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          juice.speakWord(selectedNode.quizQuestions![quizIndex].prompt)
                        }
                        className="rounded-lg border-2 border-[#1a162b] bg-white p-1.5 text-[#1a162b] hover:bg-[#fde047] cursor-pointer shrink-0"
                        title="Read Question Aloud"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {selectedNode.quizQuestions[quizIndex].options.map((opt, idx) => {
                        const isChosen = selectedOption === idx;
                        const isCorrect =
                          idx === selectedNode.quizQuestions![quizIndex].correctIndex;
                        let btnStyle =
                          'bg-white hover:bg-amber-100 border-[#1a162b] text-[#1a162b]';
                        if (selectedOption !== null) {
                          if (isCorrect) {
                            btnStyle =
                              'bg-emerald-500 border-[#1a162b] text-white shadow-[0_3px_0_#1a162b]';
                          } else if (isChosen) {
                            btnStyle = 'bg-rose-500 border-[#1a162b] text-white';
                          }
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectQuizOption(idx)}
                            className={`w-full rounded-xl border-2 px-3.5 py-2.5 text-left font-display text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {selectedOption !== null && isCorrect && <span>✓</span>}
                          </button>
                        );
                      })}
                    </div>

                    {selectedOption !== null && (
                      <div className="mt-3 rounded-xl border-2 border-[#1a162b] bg-white p-2.5 space-y-2">
                        <p className="text-xs font-bold text-[#1a162b]">
                          💡 {selectedNode.quizQuestions[quizIndex].explanation}
                        </p>
                        <button
                          type="button"
                          onClick={handleNextQuizQuestion}
                          className="w-full py-2 rounded-xl bg-gradient-to-b from-[#4ade80] to-[#16a34a] border-2 border-[#1a162b] font-display font-black text-xs uppercase text-[#1a162b] shadow-[0_3px_0_#1a162b] cursor-pointer"
                        >
                          {quizIndex + 1 < selectedNode.quizQuestions.length
                            ? 'Next Question →'
                            : 'Complete Field Trial & Claim Stars!'}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border-[3px] border-[#1a162b] bg-emerald-50 p-4 text-center space-y-3">
                  <Award className="mx-auto h-10 w-10 text-emerald-700" />
                  <div className="font-display text-lg font-black text-[#1a162b]">
                    Field Trial Complete! ({correctCount}/{selectedNode.quizQuestions.length}{' '}
                    Correct)
                  </div>
                  <p className="text-xs font-bold text-emerald-900">
                    Earned +{selectedNode.rewardCoins} 🪙 &amp; +{selectedNode.rewardGems} 💎! Next
                    stage on the trail is now unlocked.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuizIndex(0);
                      setSelectedOption(null);
                      setCorrectCount(0);
                      setQuizCompleted(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#fde047] border-2 border-[#1a162b] font-display font-black text-xs text-[#1a162b] cursor-pointer"
                  >
                    Practice Quiz Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              ENCOUNTER TYPE D: EXPEDITION SUPPLY CHEST (X-8)
          ================================================================== */}
          {selectedNode.type === 'chest' && (
            <div className="rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-b from-[#fff8e7] to-[#fde68a] p-4 text-center space-y-3 shadow-[0_4px_0_#1a162b]">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border-[3px] border-[#1a162b] bg-[#f59e0b] text-white shadow">
                <Gift className="h-10 w-10" />
              </div>
              <div className="font-display text-lg font-black text-[#1a162b]">
                {chestOpened ? 'Supply Cache Claimed!' : 'Expedition Supply Chest'}
              </div>
              <p className="text-xs font-bold text-[#5d4037]">
                Contains <strong>+{selectedNode.rewardCoins} Lexi-Coins</strong>,{' '}
                <strong>+{selectedNode.rewardGems} Fusion Gems</strong>, and{' '}
                <strong>+1 Companion Level</strong> for {activePet.name}!
              </p>
              {!chestOpened ? (
                <button
                  type="button"
                  onClick={handleOpenSupplyChest}
                  className="w-full py-3 rounded-xl bg-gradient-to-b from-[#4ade80] to-[#16a34a] border-[3px] border-[#1a162b] font-display font-black text-sm uppercase text-[#1a162b] shadow-[0_4px_0_#1a162b] cursor-pointer"
                >
                  🎁 Open Supply Chest!
                </button>
              ) : (
                <div className="rounded-xl bg-emerald-600 text-white py-2 font-display font-black text-xs uppercase">
                  ✓ ★★★ Claimed &amp; Next Stage Unlocked!
                </div>
              )}
            </div>
          )}

          {/* Declutter #12: 1 Focused Optional Bonus Challenge on the Stage Card */}
          <div className="rounded-2xl border-2 border-[#1a162b] bg-[#fff8e7] p-3 flex items-center justify-between gap-2">
            <div>
              <div className="font-display text-xs font-black uppercase text-[#78350f]">
                ✨ Optional Bonus Challenge
              </div>
              <div className="text-xs font-bold text-[#1a162b]">
                Practice {selectedBiome.grammarFocus} (+60 🪙 Bonus)
              </div>
            </div>
            <button
              type="button"
              disabled={bonusChallengeDone}
              onClick={() => {
                juice.fanfare();
                addRewards({ coins: 60, tokens: 1, xp: 30 });
                setBonusChallengeDone(true);
              }}
              className={`rounded-xl border-2 border-[#1a162b] px-3 py-1.5 font-display text-xs font-black uppercase shrink-0 ${
                bonusChallengeDone
                  ? 'bg-emerald-500 text-white cursor-default'
                  : 'bg-[#fde047] hover:bg-[#facc15] text-[#1a162b] shadow-[0_2px_0_#1a162b] cursor-pointer'
              }`}
            >
              {bonusChallengeDone ? '✓ Claimed' : 'Claim +60 🪙'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ElementalNodeMap;
