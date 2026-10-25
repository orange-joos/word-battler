import React from 'react';
import { X, BookOpen, Sparkles, Shield, Flame, Snowflake } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-violet-700 bg-[#161022] p-6 text-slate-100 shadow-2xl shadow-violet-950/80">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg bg-violet-950 p-2 text-violet-300 hover:bg-violet-900 hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-violet-800 pb-4">
          <BookOpen className="h-6 w-6 text-amber-400" />
          <h2 className="font-serif text-2xl font-bold tracking-wider text-orange-50">
            Word Battler Field Guide
          </h2>
        </div>

        <div className="mt-5 space-y-6 text-sm leading-relaxed text-slate-200">
          <div>
            <h3 className="flex items-center gap-2 font-serif text-lg text-amber-300">
              <Sparkles className="h-4 w-4" /> The 3 Linguistic Layers
            </h3>
            <p className="mt-1 text-slate-300">
              In Word Battler, combat outcomes stem directly from real English linguistics, grammar, and morphology:
            </p>
          </div>

          {/* Layer 1 */}
          <div className="rounded-xl border border-violet-800 bg-violet-950/50 p-4">
            <h4 className="font-semibold text-violet-200">Layer 1: Word Knowledge (Elements &amp; Parts of Speech)</h4>
            <p className="mt-1 text-slate-300">
              Every word belongs to a grammatical class (<span className="text-amber-300">Adjective</span>, <span className="text-sky-300">Noun</span>) and an elemental alignment (<span className="text-orange-400">Fire 🔥</span> or <span className="text-sky-400">Ice ❄️</span>). Click any word button to hear it spoken aloud!
            </p>
          </div>

          {/* Layer 2 */}
          <div className="rounded-xl border border-violet-800 bg-violet-950/50 p-4">
            <h4 className="font-semibold text-violet-200">Layer 2: Word Relationships (The Word Forge)</h4>
            <p className="mt-1 text-slate-300">
              Transform words and forge hybrid creatures using English morphology:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-slate-300 pl-2">
              <li>
                <strong className="text-amber-200">Affixation:</strong> Attach prefixes (<code className="text-violet-300">un-</code>) or suffixes (<code className="text-violet-300">-less</code>, <code className="text-violet-300">-ness</code>, <code className="text-violet-300">-like</code>, <code className="text-violet-300">-ling</code>). Reversing affixes invert elemental affinities!
              </li>
              <li>
                <strong className="text-amber-200">Compounding:</strong> Combine two words into compounds (e.g. <code className="text-violet-300">flame-shard</code>). The right-hand word is the <em>head</em> that defines the core element and part of speech.
              </li>
              <li>
                <strong className="text-amber-200">Creature Fusion:</strong> Infuse a word into a pet (e.g. <code className="text-violet-300">blizzard</code> + <code className="text-violet-300">emberfox</code> = <code className="text-violet-300">Blizzardfox</code>). Hybrid creatures gain dual-element speech and stat upgrades!
              </li>
            </ul>
          </div>

          {/* Layer 3 */}
          <div className="rounded-xl border border-violet-800 bg-violet-950/50 p-4">
            <h4 className="font-semibold text-violet-200">Layer 3: Sentence Construction (The 4x4 Action Matrix)</h4>
            <p className="mt-1 text-slate-300">
              Select one of four move categories and use 1 or 2 words (Modifier + Head) from any grammatical class:
            </p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="rounded bg-violet-900/40 p-2.5 border border-red-900/50">
                <strong className="text-red-300 block mb-1">⚔️ Attack Category:</strong>
                <span>Verb = Direct Strike (Heavy damage) · Noun = Object Impact (Armor Pierce) · Adjective = Elemental DOT · Adverb = Momentum (Crit Chance).</span>
              </div>
              <div className="rounded bg-violet-900/40 p-2.5 border border-violet-900/50">
                <strong className="text-violet-300 block mb-1">🛡️ Defend Category:</strong>
                <span>Noun = Fortification (Heavy shield) · Adjective = Barrier Quality (30% Mitigation) · Adverb = Evasive Stance (Dodge) · Verb = Counter-Stance (Reflect 40%).</span>
              </div>
              <div className="rounded bg-violet-900/40 p-2.5 border border-amber-900/50">
                <strong className="text-amber-300 block mb-1">✨ Buff Category:</strong>
                <span>Adjective = Attribute Surge (+4 ATK) · Adverb = Regeneration (+6 HP/turn) · Verb = Empower (+50% next attack) · Noun = Catalyst (+4 DEF).</span>
              </div>
              <div className="rounded bg-violet-900/40 p-2.5 border border-emerald-900/50">
                <strong className="text-emerald-300 block mb-1">🌀 Debuff Category:</strong>
                <span>Adverb = Interference (-4 SPD &amp; Accuracy) · Adjective = Affliction (-3 DEF &amp; DOT) · Verb = Motion Constraint (Skip turn) · Noun = Obstruction Screen.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-violet-600 px-5 py-2.5 font-semibold text-violet-50 hover:bg-violet-500 transition"
          >
            Understood, Enter Arena!
          </button>
        </div>
      </div>
    </div>
  );
};
