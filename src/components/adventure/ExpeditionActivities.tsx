import React, { useState } from 'react';
import { ELEMENTS } from '../../data/elements';
import type { ElementalBiomeTheme } from '../../data/adventureNodesData';
import type { Creature } from '../../types';
import { CreatureSprite } from '../CreatureSprite';
import { juice } from '../../engine/juice';

export type ExpeditionSubView = 'stage' | 'roaming' | 'quarry' | 'campfire' | 'relics';

interface ExpeditionActivitiesProps {
  expeditionSubView: Exclude<ExpeditionSubView, 'stage'>;
  selectedBiome: ElementalBiomeTheme;
  activePet: Creature;
  onRecruitWildCompanion: (zoneId: string) => unknown;
  onAddRewards: (rewards: { coins: number; tokens: number; xp: number }) => void;
  onLevelUpPet: (petId: string, amount?: number) => void;
  onAddAncientAmber: (amount: number) => void;
}

export const ExpeditionActivities: React.FC<ExpeditionActivitiesProps> = ({
  expeditionSubView,
  selectedBiome,
  activePet,
  onRecruitWildCompanion,
  onAddRewards,
  onLevelUpPet,
  onAddAncientAmber,
}) => {
  const [roamingSolved, setRoamingSolved] = useState<Record<string, boolean>>({});
  const [campfireSolved, setCampfireSolved] = useState<Record<string, boolean>>({});
  const [secretNodesClaimed, setSecretNodesClaimed] = useState<Record<string, boolean>>({});
  const [merchantPurchased, setMerchantPurchased] = useState<Record<string, boolean>>({});
  const [riddleGateSolved, setRiddleGateSolved] = useState<Record<string, boolean>>({});
  const [relicVaultSolved, setRelicVaultSolved] = useState<Record<string, boolean>>({});

  const [quarryLayers, setQuarryLayers] = useState<number[]>(() =>
    Array.from({ length: 12 }, (_, i) => (i % 3 === 0 ? 2 : 1))
  );
  const [quarryTool, setQuarryTool] = useState<'sonar' | 'pick' | 'chisel'>('pick');
  const [sonarRevealed, setSonarRevealed] = useState<boolean>(false);
  const [quarryClaimed, setQuarryClaimed] = useState<boolean>(false);

  const handleStrikeQuarryTile = (idx: number) => {
    if (quarryClaimed) return;
    if (quarryTool === 'sonar') {
      setSonarRevealed(true);
      juice.ding(980, 140);
      return;
    }

    const next = [...quarryLayers];
    if (quarryTool === 'pick') {
      const targets = [idx, idx - 1, idx + 1, idx - 4, idx + 4].filter(
        (t) => t >= 0 && t < 12
      );
      targets.forEach((t) => {
        next[t] = Math.max(0, next[t] - 1);
      });
      juice.ding(620, 110);
    } else {
      next[idx] = Math.max(0, next[idx] - 2);
      juice.ding(820, 90);
    }

    setQuarryLayers(next);
    if (next.every((v) => v === 0)) {
      setQuarryClaimed(true);
      onAddRewards({ coins: 140, tokens: 3, xp: 75 });
      onLevelUpPet(activePet.id, 1);
      juice.fanfare();
    }
  };

  if (expeditionSubView === 'roaming') {
    return (
      <div className="rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-b from-[#fef3c7] to-[#fde68a] p-4 space-y-3 shadow-[0_4px_0_#1a162b]">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-purple-900 px-3 py-0.5 font-display text-[10px] font-black uppercase text-[#fde047]">
            ⚡ Roaming Mythic Sighting in {selectedBiome.name}
          </span>
          <span className="font-mono text-xs font-black text-purple-950">
            +120 🪙 · +2 💎
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border-2 border-[#1a162b] bg-white p-3">
          <CreatureSprite
            creatureId={selectedBiome.bossId}
            stage={3}
            element={selectedBiome.element}
            size="md"
          />
          <div>
            <div className="font-display text-base font-black text-[#1a162b]">
              Mythic {ELEMENTS[selectedBiome.element]?.name} Wanderer
            </div>
            <p className="text-xs font-bold text-[#5d4037]">
              Complete the 4-Tablet Sentence below to intercept and befriend this Roaming Mythic!
            </p>
          </div>
        </div>

        <div className="rounded-xl border-2 border-[#1a162b] bg-white p-3 space-y-2">
          <p className="font-display text-xs font-black text-[#1a162b]">
            “The <span className="underline text-amber-700">[Adjective]</span> guardian{' '}
            <span className="underline text-rose-700">[Verb]</span> across the{' '}
            {selectedBiome.name}!”
          </p>
          {!roamingSolved[selectedBiome.zoneId] ? (
            <div className="grid grid-cols-1 gap-1.5">
              {[
                {
                  label: `✨ "${selectedBiome.nodes[3]?.digSiteTablet?.word || 'Radiant'} — surges boldly!" (4-Tablet Ultimate)`,
                  correct: true,
                },
                {
                  label: '🪨 "...walks slowly." (Incomplete Fragment)',
                  correct: false,
                },
              ].map((choice, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (choice.correct) {
                      setRoamingSolved((prev) => ({
                        ...prev,
                        [selectedBiome.zoneId]: true,
                      }));
                      onRecruitWildCompanion(selectedBiome.zoneId);
                      onAddRewards({ coins: 120, tokens: 2, xp: 65 });
                      juice.fanfare();
                    } else {
                      juice.boing();
                    }
                  }}
                  className="w-full rounded-xl border-2 border-[#1a162b] bg-[#fff8e7] hover:bg-[#fde047] px-3 py-2 text-left font-display text-xs font-black text-[#1a162b] cursor-pointer"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-emerald-600 p-2.5 text-center font-display text-xs font-black text-white">
              ✓ Mythic Intercepted! Earned +120 🪙, +2 💎 &amp; Companion Boost!
            </div>
          )}
        </div>
      </div>
    );
  }

  if (expeditionSubView === 'quarry') {
    return (
      <div className="rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-b from-[#e0f2fe] to-[#bae6fd] p-4 space-y-3 shadow-[0_4px_0_#1a162b]">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-[#1a162b] px-3 py-0.5 font-display text-[10px] font-black uppercase text-[#fde047]">
            ⛏️ 12-Tile Deep-Strata Quarry
          </span>
          <span className="font-mono text-[11px] font-black text-[#0369a1]">
            {sonarRevealed ? '📡 Relics Located!' : 'Use Sonar to Scan'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              { id: 'sonar', label: '📡 Sonar Ping' },
              { id: 'pick', label: '⛏️ Cross Pick' },
              { id: 'chisel', label: '🔨 Deep Chisel' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                juice.click();
                setQuarryTool(t.id);
              }}
              className={`rounded-xl border-2 border-[#1a162b] py-1.5 font-display text-[11px] font-black cursor-pointer ${
                quarryTool === t.id
                  ? 'bg-[#fde047] text-[#1a162b] shadow-[0_2px_0_#1a162b]'
                  : 'bg-white text-[#1a162b]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-1.5 rounded-2xl border-[3px] border-[#1a162b] bg-[#1e293b] p-2.5">
          {quarryLayers.map((layer, idx) => {
            const hasRelic = idx === 2 || idx === 5 || idx === 9;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleStrikeQuarryTile(idx)}
                className={`h-13 rounded-xl border-2 border-[#1a162b] flex flex-col items-center justify-center font-mono text-[10px] font-black cursor-pointer transition ${
                  layer === 2
                    ? 'bg-slate-600 text-amber-200 hover:brightness-110'
                    : layer === 1
                    ? 'bg-amber-700 text-white hover:brightness-110'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {layer > 0 ? (
                  <>
                    <span>{layer === 2 ? '🪨 BASALT' : '🏜️ SHALE'}</span>
                    {sonarRevealed && hasRelic && (
                      <span className="text-[9px] text-[#fde047]">★ RELIC</span>
                    )}
                  </>
                ) : (
                  <span>{hasRelic ? '💎 GEM!' : '✨ CLEAR'}</span>
                )}
              </button>
            );
          })}
        </div>

        {quarryClaimed && (
          <div className="rounded-xl bg-emerald-600 p-2 text-center font-display text-xs font-black text-white">
            🎉 Deep Quarry Cleared! Earned +140 🪙, +3 💎 &amp; +1 Companion Level!
          </div>
        )}
      </div>
    );
  }

  if (expeditionSubView === 'campfire') {
    return (
      <div className="rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-b from-[#ffedd5] to-[#fed7aa] p-4 space-y-3 shadow-[0_4px_0_#1a162b]">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-[#9a3412] px-3 py-0.5 font-display text-[10px] font-black uppercase text-[#fde047]">
            🔥 Campfire Chronicles · Context-Clue Story
          </span>
          <button
            type="button"
            onClick={() =>
              juice.speakWord(
                `Around the warm campfire in ${selectedBiome.name}, ${activePet.name} listened closely. Choose the word tablet that best fits the story's context clues!`
              )
            }
            className="rounded-lg border-2 border-[#1a162b] bg-white px-2 py-0.5 text-[10px] font-black text-[#1a162b] cursor-pointer"
          >
            🔊 Read Story
          </button>
        </div>

        <div className="rounded-xl border-2 border-[#1a162b] bg-white p-3 text-xs font-semibold text-[#1a162b] leading-relaxed">
          “As twilight settled over <strong>{selectedBiome.name}</strong>,{' '}
          <strong>{activePet.name}</strong> spotted an ancient stone bridge. Because the
          bridge was built from solid granite, it remained{' '}
          <span className="rounded bg-amber-200 px-1.5 py-0.5 font-black text-[#9a3412]">
            [ ? ]
          </span>{' '}
          even when the fiercest elemental storm swept through the canyon.”
        </div>

        {!campfireSolved[selectedBiome.zoneId] ? (
          <div className="grid grid-cols-1 gap-1.5">
            {[
              {
                word: 'UNBREAKABLE (Prefix un- + break + -able)',
                correct: true,
              },
              {
                word: 'CARELESS (Root care + -less)',
                correct: false,
              },
              {
                word: 'WHISPERING (Participle verb)',
                correct: false,
              },
            ].map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (opt.correct) {
                    setCampfireSolved((prev) => ({
                      ...prev,
                      [selectedBiome.zoneId]: true,
                    }));
                    onAddRewards({ coins: 80, tokens: 1, xp: 45 });
                    juice.fanfare();
                    juice.speakWord('Unbreakable! Able to withstand any storm.');
                  } else {
                    juice.boing();
                  }
                }}
                className="w-full rounded-xl border-2 border-[#1a162b] bg-[#fff8e7] hover:bg-[#fde047] px-3 py-2 text-left font-display text-xs font-black text-[#1a162b] cursor-pointer"
              >
                {opt.word}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-emerald-600 p-2.5 text-center font-display text-xs font-black text-white">
            ✓ Context-Clue Story Solved! Earned +80 🪙 &amp; +1 💎!
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-r from-purple-950 to-indigo-950 p-3.5 text-white space-y-2 shadow-[0_4px_0_#1a162b]">
        <div className="flex items-center justify-between">
          <span className="font-display text-xs font-black uppercase text-[#fde047]">
            🗝️ Secret Side-Paths ({selectedBiome.order}-5B &amp; {selectedBiome.order}-8B)
          </span>
          <span className="font-mono text-[10px] text-purple-200">+3 🦴 Amber · +90 🪙</span>
        </div>
        <p className="text-[11px] font-semibold text-purple-100">
          Hidden crystal caverns branching off the main trail! Claim your realm side-cache:
        </p>
        {!secretNodesClaimed[selectedBiome.zoneId] ? (
          <button
            type="button"
            onClick={() => {
              setSecretNodesClaimed((prev) => ({ ...prev, [selectedBiome.zoneId]: true }));
              onAddAncientAmber(3);
              onAddRewards({ coins: 90, tokens: 1, xp: 40 });
              juice.fanfare();
            }}
            className="w-full rounded-xl border-2 border-[#1a162b] bg-[#fde047] hover:bg-amber-300 py-2 font-display text-xs font-black uppercase text-[#1a162b] cursor-pointer"
          >
            ✨ Explore Secret Branch {selectedBiome.order}-5B (+3 🦴 Amber &amp; +90 🪙)
          </button>
        ) : (
          <div className="rounded-xl bg-emerald-600 py-1.5 text-center font-display text-xs font-black">
            ✓ Secret Branch Cavern Cleared!
          </div>
        )}
      </div>

      <div className="rounded-2xl border-[3px] border-[#1a162b] bg-[#fff8e7] p-3.5 space-y-2 shadow-[0_4px_0_#1a162b]">
        <div className="flex items-center justify-between">
          <span className="font-display text-xs font-black uppercase text-[#78350f]">
            🐫 Wandering Trail Merchant — {selectedBiome.name}
          </span>
          <span className="rounded bg-amber-200 px-2 py-0.5 font-mono text-[10px] font-black text-[#1a162b]">
            Trail Special
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-[#5d4037]">
            Unlocks a realm-attuned Word Tablet &amp; +4 🦴 Ancient Amber!
          </p>
          <button
            type="button"
            disabled={Boolean(merchantPurchased[selectedBiome.zoneId])}
            onClick={() => {
              setMerchantPurchased((prev) => ({ ...prev, [selectedBiome.zoneId]: true }));
              onAddAncientAmber(4);
              onAddRewards({ coins: 40, tokens: 1, xp: 30 });
              juice.fanfare();
            }}
            className={`shrink-0 rounded-xl border-2 border-[#1a162b] px-3 py-2 font-display text-xs font-black cursor-pointer ${
              merchantPurchased[selectedBiome.zoneId]
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-b from-[#ffd54f] to-[#f59e0b] text-[#1a162b]'
            }`}
          >
            {merchantPurchased[selectedBiome.zoneId] ? '✓ Claimed' : 'Claim Bundle (+4 🦴)'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-b from-[#fef3c7] to-[#fde68a] p-3.5 space-y-2.5 shadow-[0_4px_0_#1a162b]">
        <div className="font-display text-xs font-black uppercase text-[#1a162b]">
          🗿 Sphinx Riddle Gate &amp; Shades-of-Meaning Vault (#8 &amp; #10)
        </div>
        <p className="text-xs font-bold text-[#5d4037]">
          Order the adjectives from <strong>Mildest → Strongest Intensity</strong> to open the Mid-Boss Gate:
        </p>
        {!relicVaultSolved[selectedBiome.zoneId] || !riddleGateSolved[selectedBiome.zoneId] ? (
          <div className="space-y-1.5">
            {[
              { label: '🌡️ Warm → Hot → Scorching (Correct Intensity Order!)', ok: true },
              { label: '🌡️ Scorching → Warm → Hot (Scrambled Order)', ok: false },
            ].map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (opt.ok) {
                    setRelicVaultSolved((prev) => ({ ...prev, [selectedBiome.zoneId]: true }));
                    setRiddleGateSolved((prev) => ({ ...prev, [selectedBiome.zoneId]: true }));
                    onAddAncientAmber(3);
                    onAddRewards({ coins: 75, tokens: 1, xp: 40 });
                    juice.fanfare();
                    juice.speakWord('Warm, Hot, Scorching! Vault unlocked.');
                  } else {
                    juice.boing();
                  }
                }}
                className="w-full rounded-xl border-2 border-[#1a162b] bg-white hover:bg-[#fde047] px-3 py-2 text-left font-display text-xs font-black text-[#1a162b] cursor-pointer"
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-emerald-600 p-2 text-center font-display text-xs font-black text-white">
            ✓ Sphinx Gate &amp; Intensity Vault Unlocked! (+75 🪙 &amp; +3 🦴 Amber)
          </div>
        )}
      </div>
    </div>
  );
};
