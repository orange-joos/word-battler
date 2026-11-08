import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Volume2,
  X,
  Check,
  GraduationCap,
  ArrowRight,
  Swords,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ELEMENTS } from '../data/elements';
import { getEvolutionBranch, canPetEvolve } from '../data/evolutionData';
import { getAllWordsList } from '../engine/forge';
import { GradeTier, PartOfSpeech, Creature } from '../types';
import { GRADE_TIERS, getGradeTierMeta } from '../data/vocabDatabase';
import { CreatureSprite } from './CreatureSprite';
import { juice } from '../engine/juice';

interface LexiDexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerEvolution?: (creature: Creature) => void;
}

export const LexiDexModal: React.FC<LexiDexModalProps> = ({
  isOpen,
  onClose,
  onTriggerEvolution,
}) => {
  const {
    creatures,
    words,
    playerId,
    setPlayerId,
    restartBattle,
    updatePetLoadout,
    useCreatureInBattle,
  } = useGame();

  const [activeTab, setActiveTab] = useState<'grimoire' | 'beastiary' | 'roots'>('grimoire');
  const [gradeFilter, setGradeFilter] = useState<GradeTier | 'all'>('all');
  const [posFilter, setPosFilter] = useState<PartOfSpeech | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const allWords = getAllWordsList(words);
  const activePet = creatures.find((c) => c.id === playerId) || creatures[0];
  const companionCreatures = creatures.filter((c) => !c.id.startsWith('boss_'));

  const filteredWords = allWords.filter((w) => {
    if (gradeFilter !== 'all' && (w.gradeTier || '3') !== gradeFilter) return false;
    if (posFilter !== 'all' && w.partOfSpeech !== posFilter) return false;
    if (
      searchQuery.trim() !== '' &&
      !w.word.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !w.definition.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5 backdrop-blur-xs select-none">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-3xl border-4 border-[#5a2e12] bg-[#fffaf2] shadow-[0_10px_0_#381b09] overflow-hidden">
        {/* Top Wooden Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-[#5a2e12] bg-gradient-to-r from-[#5a2e12] via-[#7c3f18] to-[#5a2e12] px-5 py-3.5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-[#ffce7a] bg-amber-500 text-slate-950 shadow">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-black text-[#fff3d1]">
                Scholar’s Lexi-Dex &amp; K–8 Word Tablet Archive
              </h2>
              <p className="text-xs font-bold text-amber-200/90">
                Complete Kindergarten to 5th Grade + Middle School Extender Database, Root Family Trees &amp; 3-Stage Pet Evolutions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#ffce7a] bg-[#3d1e0d] text-amber-200 hover:bg-red-700 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#e5cca8] bg-[#f7ebd9] px-5 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('grimoire')}
              className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-xs font-black uppercase transition cursor-pointer ${
                activeTab === 'grimoire'
                  ? 'border-[#3d1e0d] bg-[#5a2e12] text-amber-200 shadow-xs'
                  : 'border-[#c8a97e] bg-white text-[#5a2e12] hover:bg-amber-50'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>K–8 Word Tablets ({allWords.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('roots')}
              className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-xs font-black uppercase transition cursor-pointer ${
                activeTab === 'roots'
                  ? 'border-[#3d1e0d] bg-[#5a2e12] text-amber-200 shadow-xs'
                  : 'border-[#c8a97e] bg-white text-[#5a2e12] hover:bg-amber-50'
              }`}
            >
              <span>🌳 Root Family Trees</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('beastiary')}
              className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-xs font-black uppercase transition cursor-pointer ${
                activeTab === 'beastiary'
                  ? 'border-[#3d1e0d] bg-[#5a2e12] text-amber-200 shadow-xs'
                  : 'border-[#c8a97e] bg-white text-[#5a2e12] hover:bg-amber-50'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Companion Bestiary ({companionCreatures.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-black text-[#5a2e12]">
            <span>Active Companion:</span>
            <span className="rounded-lg border border-amber-500 bg-amber-100 px-2.5 py-1 text-amber-950">
              {activePet.name} (Lv.{activePet.level || 8})
            </span>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'grimoire' ? (
            <div className="space-y-4">
              {/* Grade Tier Filter Strip */}
              <div className="rounded-2xl border-2 border-[#d6bfa3] bg-white p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#5a2e12]">
                    Filter by Grade Level Tier (Kindergarten → 5th Grade → Middle School Extender):
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search word or definition..."
                    className="rounded-xl border-2 border-[#c8a97e] bg-[#fffaf2] px-3 py-1 text-xs font-bold text-[#2a170b] outline-none focus:border-amber-600"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGradeFilter('all')}
                    className={`rounded-xl border-2 px-3 py-1 text-xs font-black uppercase cursor-pointer ${
                      gradeFilter === 'all'
                        ? 'border-[#3d1e0d] bg-[#5a2e12] text-white'
                        : 'border-[#d6bfa3] bg-[#f7ebd9] text-[#5a2e12]'
                    }`}
                  >
                    All Tiers ({allWords.length})
                  </button>
                  {GRADE_TIERS.map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setGradeFilter(tier.id)}
                      className={`rounded-xl border-2 px-3 py-1 text-xs font-black uppercase cursor-pointer ${
                        gradeFilter === tier.id
                          ? 'border-[#3d1e0d] bg-[#5a2e12] text-white'
                          : `${tier.badgeBg} ${tier.badgeText} ${tier.badgeBorder}`
                      }`}
                    >
                      {tier.label} (+{tier.powerBonus} Pwr)
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-stone-200">
                  {(['all', 'verb', 'noun', 'adjective', 'adverb'] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setPosFilter(pos)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-black uppercase cursor-pointer ${
                        posFilter === pos
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {pos === 'all' ? 'All Parts of Speech' : `${pos}s`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Word Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredWords.map((word) => {
                  const tierMeta = getGradeTierMeta(word.gradeTier);
                  const elInfo = ELEMENTS[word.element] || ELEMENTS.fire;
                  const pwr = word.powerBonus ?? word.forge?.powerBonus ?? tierMeta.powerBonus;
                  const isEquipped = activePet.loadout?.[word.partOfSpeech] === word.id;

                  return (
                    <div
                      key={word.id}
                      className={`flex flex-col justify-between rounded-2xl border-2 p-3.5 transition ${
                        isEquipped
                          ? 'border-emerald-600 bg-emerald-50/90 shadow-md'
                          : 'border-[#d6bfa3] bg-white hover:border-amber-500'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[9px] font-black uppercase text-stone-700">
                            {word.partOfSpeech}
                          </span>
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase ${tierMeta.badgeBg} ${tierMeta.badgeText} ${tierMeta.badgeBorder}`}
                          >
                            {tierMeta.shortLabel} · +{pwr} Pwr
                          </span>
                        </div>

                        <div className="my-1.5 flex items-center justify-between">
                          <span className="font-serif text-xl font-black text-[#2a170b]">
                            {word.word}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              juice.speakWord(`${word.word}. ${word.definition}. Example: ${word.example}`)
                            }
                            className="flex items-center gap-1 rounded-lg border border-amber-400 bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-950 hover:bg-amber-200 cursor-pointer"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                            <span>Speak</span>
                          </button>
                        </div>

                        <p className="text-xs font-bold text-stone-800 leading-snug">
                          {word.definition}
                        </p>
                        <p className="mt-1 text-[11px] italic text-stone-600">
                          “{word.example}”
                        </p>
                        {word.morphologyNote && (
                          <p className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-950">
                            🔎 <strong>Morphology:</strong> {word.morphologyNote}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-stone-200 pt-2">
                        <span className="text-[10px] font-black text-stone-700">
                          {elInfo.icon} {elInfo.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            updatePetLoadout(activePet.id, word.partOfSpeech, word.id);
                            juice.ding(800, 100);
                          }}
                          className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase cursor-pointer ${
                            isEquipped
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#5a2e12] text-amber-200 hover:bg-[#7c3f18]'
                          }`}
                        >
                          {isEquipped ? (
                            <span className="flex items-center gap-1">
                              <Check className="h-3 w-3" /> Equipped on {activePet.name}
                            </span>
                          ) : (
                            `Equip on ${activePet.name}`
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'roots' ? (
            /* Feature #16: Root-Word Family Tree Visualizer */
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-[#5a2e12] bg-amber-50 p-4">
                <h3 className="font-serif text-lg font-black text-[#2a170b]">
                  🌳 Latin &amp; Greek Root-Word Family Tree Visualizer
                </h3>
                <p className="text-xs font-bold text-[#7c4a27]">
                  Click any branching derivative word below to hear how a single ancient root grows into an entire family of vocabulary words!
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    root: 'SPECT (Latin: "to look / see")',
                    icon: '🔭',
                    branches: [
                      { word: 'Inspect', note: 'in- (into) + spect = look closely into' },
                      { word: 'Spectacle', note: 'spect + -acle = an impressive sight' },
                      { word: 'Perspective', note: 'per- (through) + spect = point of view' },
                    ],
                  },
                  {
                    root: 'RUPT (Latin: "to break / burst")',
                    icon: '🌋',
                    branches: [
                      { word: 'Erupt', note: 'e- (out) + rupt = burst outward like magma' },
                      { word: 'Disrupt', note: 'dis- (apart) + rupt = break apart order' },
                      { word: 'Uninterrupted', note: 'un- + inter- + rupt = unbroken continuity' },
                    ],
                  },
                  {
                    root: 'PORT (Latin: "to carry")',
                    icon: '⛵',
                    branches: [
                      { word: 'Transport', note: 'trans- (across) + port = carry across realms' },
                      { word: 'Portable', note: 'port + -able = able to be carried easily' },
                      { word: 'Export', note: 'ex- (out) + port = carry goods outward' },
                    ],
                  },
                  {
                    root: 'LUM / LUC (Latin: "light / shine")',
                    icon: '✨',
                    branches: [
                      { word: 'Luminous', note: 'lumin + -ous = full of radiant light' },
                      { word: 'Illuminate', note: 'il- + lumin + -ate = brighten with light' },
                      { word: 'Translucent', note: 'trans- + luc = letting light shine through' },
                    ],
                  },
                ].map((tree) => (
                  <div
                    key={tree.root}
                    className="rounded-2xl border-2 border-[#5a2e12] bg-white p-4 space-y-2.5 shadow"
                  >
                    <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
                      <span className="text-2xl">{tree.icon}</span>
                      <span className="font-serif text-base font-black text-[#5a2e12]">
                        {tree.root}
                      </span>
                    </div>
                    <div className="space-y-1.5 pl-3 border-l-4 border-emerald-600">
                      {tree.branches.map((b) => (
                        <button
                          key={b.word}
                          type="button"
                          onClick={() => juice.speakWord(`${b.word}. ${b.note}`)}
                          className="w-full rounded-xl border border-[#c8a97e] bg-[#fffaf2] hover:bg-amber-100 px-3 py-2 text-left transition cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <div className="font-serif text-sm font-black text-[#2a170b]">
                              🌿 {b.word}
                            </div>
                            <div className="text-[11px] font-bold text-[#7c4a27]">{b.note}</div>
                          </div>
                          <Volume2 className="h-4 w-4 text-amber-800 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* TAB 2: 3-STAGE SVG BEASTIARY & EVOLUTION TREES */
            <div className="space-y-4">
              {companionCreatures.map((pet) => {
                const branch = getEvolutionBranch(pet);
                const isSelected = pet.id === playerId;
                const canEvo = canPetEvolve(pet);
                const elInfo = ELEMENTS[pet.element] || ELEMENTS.fire;

                return (
                  <div
                    key={pet.id}
                    className={`rounded-3xl border-3 p-4 transition ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-md'
                        : 'border-[#d6bfa3] bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3 mb-3">
                      <div className="flex items-center gap-3">
                        <CreatureSprite
                          creatureId={pet.id}
                          stage={pet.stage || 1}
                          element={pet.element}
                          size="sm"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-serif text-lg font-black text-[#2a170b]">
                              {pet.name}
                            </h3>
                            <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black uppercase text-amber-900">
                              {elInfo.icon} {elInfo.name} · Lv.{pet.level || 8} (Stage {pet.stage || 1})
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#7c4a27]">{pet.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {canEvo && onTriggerEvolution && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onTriggerEvolution(pet);
                            }}
                            className="flex items-center gap-1 rounded-xl border-2 border-amber-900 bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-1.5 text-xs font-black uppercase text-slate-950 animate-pulse cursor-pointer"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Evolve Now!</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setPlayerId(pet.id);
                            restartBattle(pet.id);
                            juice.ding(760, 100);
                          }}
                          className={`rounded-xl border-2 px-3 py-1.5 text-xs font-black uppercase cursor-pointer ${
                            isSelected
                              ? 'border-emerald-700 bg-emerald-600 text-white'
                              : 'border-[#5a2e12] bg-amber-100 text-[#3d1e0d] hover:bg-amber-200'
                          }`}
                        >
                          {isSelected ? '✓ Active Companion' : 'Set Active Companion'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            useCreatureInBattle(pet.id);
                          }}
                          className="flex items-center gap-1 rounded-xl border-2 border-[#5a2e12] bg-[#5a2e12] px-3 py-1.5 text-xs font-black uppercase text-amber-200 hover:bg-[#7c3f18] cursor-pointer"
                        >
                          <Swords className="h-3.5 w-3.5" />
                          <span>Battle</span>
                        </button>
                      </div>
                    </div>

                    {/* 3-Stage Evolution Visual Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {branch.map((stg, idx) => {
                        const isCurrentStage = (pet.stage || 1) === stg.stage;
                        return (
                          <div
                            key={stg.stage}
                            className={`relative flex items-center gap-3 rounded-2xl border-2 p-3 ${
                              isCurrentStage
                                ? 'border-amber-500 bg-amber-50/90'
                                : 'border-stone-200 bg-stone-50/70'
                            }`}
                          >
                            <CreatureSprite
                              creatureId={pet.id}
                              stage={stg.stage}
                              element={pet.element}
                              size="sm"
                            />
                            <div>
                              <span className="text-[10px] font-black uppercase text-amber-800 block">
                                Stage {stg.stage} (Lv.{stg.minLevel}+)
                              </span>
                              <span className="font-serif text-sm font-black text-[#2a170b] block">
                                {stg.name}
                              </span>
                              <span className="text-[10px] font-bold text-stone-600 block">
                                {stg.title}
                              </span>
                            </div>
                            {idx < 2 && (
                              <ArrowRight className="hidden sm:block absolute -right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-700 z-10" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
