import React, { useState } from 'react';
import { juice } from '../../engine/juice';
import type { TutorInsight } from '../../agents/adaptiveTutorAgent';

export const HOMOPHONE_TRAPS = [
  {
    context: 'The guardians defended _____ ancient crystal cavern.',
    options: ['THEIR', 'THERE', "THEY'RE"],
    correctIndex: 0,
    pairLabel: 'Their / There',
  },
  {
    context: 'The solar storm had a powerful _____ on the arena turf.',
    options: ['AFFECT', 'EFFECT', 'DEFECT'],
    correctIndex: 1,
    pairLabel: 'Affect / Effect',
  },
  {
    context: 'The frost dragon shook _____ shimmering crystalline wings.',
    options: ["IT'S", 'ITS', 'IGHTS'],
    correctIndex: 1,
    pairLabel: "Its / It's",
  },
];

export const WORD_DUEL_CHALLENGES = [
  {
    bossMove: 'COLOSSAL CRUSH',
    prompt: 'Pick the ANTONYM Tablet of "COLOSSAL" to deflect!',
    options: ['MINUSCULE', 'GIGANTIC', 'FIERCE'],
    correctIndex: 0,
  },
  {
    bossMove: 'FRIGID GALE',
    prompt: 'Pick the ANTONYM Tablet of "FRIGID" to deflect!',
    options: ['ICY', 'SCORCHING', 'SILENT'],
    correctIndex: 1,
  },
  {
    bossMove: 'RAPID BARRAGE',
    prompt: 'Pick the SYNONYM Tablet of "RAPID" to parry!',
    options: ['SLUGGISH', 'SWIFT', 'HEAVY'],
    correctIndex: 1,
  },
];

export const PASSIVE_TRAITS: Record<string, string> = {
  fire: '🔥 Blaze Verb Mastery (+3 Verb Pwr)',
  water: '💧 Tidal Bastion (+4 Noun Shield)',
  grass: '🌿 Rootweaver (+3 Adj Pwr)',
  electric: '⚡ Swift Syntax (+3 Adv Pwr)',
  ice: '❄️ Permafrost Ward (+3 DEF)',
  earth: '🪨 Granite Stance (+4 HP/Shield)',
  air: '🌬️ Gale Tailwind (+4 SPD)',
  shadow: '🌑 Umbra Echo (+3 Morpheme Pwr)',
  light: '✨ Radiant Harmony (+3 All Pwr)',
};

export const ACCESSORY_LABELS: Record<string, string> = {
  amber_fang: '🦴 Amber Fang (+ATK)',
  iron_shell: '🛡️ Iron Shell (+DEF)',
  zephyr_band: '🪶 Zephyr Band (+SPD)',
  root_crown: '👑 Root Crown (+HP)',
};

interface BattleMiniGameControlsProps {
  showSyllables: boolean;
  onToggleSyllables: () => void;
  onTriggerBurst: () => void;
  onAddRewards: (rewards: { coins: number; tokens: number; xp: number }) => void;
  onAddMistakeWord: (word: string) => void;
}

export const BattleMiniGameControls: React.FC<BattleMiniGameControlsProps> = ({
  showSyllables,
  onToggleSyllables,
  onTriggerBurst,
  onAddRewards,
  onAddMistakeWord,
}) => {
  const [showWordDuel, setShowWordDuel] = useState(false);
  const [duelIndex, setDuelIndex] = useState(0);
  const [duelBanner, setDuelBanner] = useState<string | null>(null);

  const [showHomophoneTrap, setShowHomophoneTrap] = useState(false);
  const [homophoneIdx, setHomophoneIdx] = useState(0);
  const [homophoneFeedback, setHomophoneFeedback] = useState<string | null>(null);

  const currentDuel = WORD_DUEL_CHALLENGES[duelIndex % WORD_DUEL_CHALLENGES.length];
  const currentHomophone = HOMOPHONE_TRAPS[homophoneIdx % HOMOPHONE_TRAPS.length];

  return (
    <>
      <div className="mt-1.5 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => {
            juice.click();
            setShowWordDuel((prev) => !prev);
            setShowHomophoneTrap(false);
            setDuelBanner(null);
          }}
          className="flex-1 rounded-lg border-2 border-[#1a162b] bg-gradient-to-r from-[#fde047] to-[#f59e0b] px-1.5 py-1 font-display text-[9px] font-black uppercase text-[#1a162b] shadow cursor-pointer"
        >
          ⚔️ Duel
        </button>
        <button
          type="button"
          onClick={() => {
            juice.click();
            setShowHomophoneTrap((prev) => !prev);
            setShowWordDuel(false);
            setHomophoneFeedback(null);
          }}
          className="flex-1 rounded-lg border-2 border-[#1a162b] bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] px-1.5 py-1 font-display text-[9px] font-black uppercase text-white shadow cursor-pointer"
        >
          🪞 Homophone
        </button>
        <button
          type="button"
          onClick={() => {
            juice.click();
            onToggleSyllables();
          }}
          className={`rounded-lg border-2 border-[#1a162b] px-1.5 py-1 font-display text-[9px] font-black uppercase cursor-pointer ${
            showSyllables ? 'bg-sky-400 text-[#1a162b]' : 'bg-[#271306] text-amber-200'
          }`}
          title="Toggle Phonetics & Syllable Clapper Breakdown"
        >
          👏 Syllables
        </button>
      </div>

      {showWordDuel && (
        <div className="mt-1.5 rounded-xl border-2 border-[#fde047] bg-[#1e1b4b] p-2 text-white space-y-1.5">
          <div className="text-[10px] font-black text-[#fde047]">
            ⚡ {currentDuel.bossMove}: {currentDuel.prompt}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {currentDuel.options.map((opt, idx) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  if (idx === currentDuel.correctIndex) {
                    juice.fanfare();
                    juice.speakWord(opt);
                    onTriggerBurst();
                    onAddRewards({ coins: 20, tokens: 0, xp: 15 });
                    setDuelBanner(`✨ Deflected with "${opt}"! +20 🪙!`);
                    setDuelIndex((i) => i + 1);
                  } else {
                    juice.boing();
                    setDuelBanner('Try again! Look for the exact match.');
                  }
                }}
                className="rounded-lg border border-[#fde047] bg-indigo-900 hover:bg-[#fde047] hover:text-[#1a162b] py-1 font-display text-[10px] font-black cursor-pointer transition"
              >
                {opt}
              </button>
            ))}
          </div>
          {duelBanner && (
            <div className="text-center font-display text-[10px] font-black text-emerald-300">
              {duelBanner}
            </div>
          )}
        </div>
      )}

      {showHomophoneTrap && (
        <div className="mt-1.5 rounded-xl border-2 border-purple-300 bg-[#2e1065] p-2 text-white space-y-1.5">
          <div className="text-[10px] font-black text-purple-200">
            🪞 Mirage Trap: {currentHomophone.context}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {currentHomophone.options.map((opt, idx) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  if (idx === currentHomophone.correctIndex) {
                    juice.fanfare();
                    juice.speakWord(opt);
                    onAddRewards({ coins: 25, tokens: 0, xp: 15 });
                    setHomophoneFeedback(`✨ Mirage Shattered with "${opt}"! +25 🪙!`);
                    setHomophoneIdx((i) => i + 1);
                  } else {
                    juice.boing();
                    onAddMistakeWord(currentHomophone.pairLabel);
                    setHomophoneFeedback(
                      `Saved "${currentHomophone.pairLabel}" to Field Journal for practice!`
                    );
                  }
                }}
                className="rounded-lg border border-purple-300 bg-purple-900 hover:bg-[#fde047] hover:text-[#1a162b] py-1 font-display text-[10px] font-black cursor-pointer transition"
              >
                {opt}
              </button>
            ))}
          </div>
          {homophoneFeedback && (
            <div className="text-center font-display text-[10px] font-black text-amber-200">
              {homophoneFeedback}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export const AdaptiveTutorCoachBar: React.FC<{ insight: TutorInsight }> = ({ insight }) => {
  return (
    <div className="mt-1 rounded-lg border border-[#1a162b]/40 bg-emerald-950/90 px-2 py-1 text-[9px] font-bold text-emerald-200 flex items-center justify-between gap-2">
      <span className="truncate">🤖 Coach: {insight.coachTip}</span>
      {insight.recommendedWords.length > 0 && (
        <span className="shrink-0 rounded bg-[#fde047] px-1.5 py-0.2 font-mono text-[8px] font-black text-[#1a162b]">
          Review: {insight.recommendedWords[0].word}
        </span>
      )}
    </div>
  );
};
