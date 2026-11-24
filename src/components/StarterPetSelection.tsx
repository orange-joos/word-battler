import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ELEMENTS, ELEMENT_TYPES } from '../data/elements';
import { STARTER_PETS } from '../data/starterPets';
import { ElementType } from '../types';
import { CreatureSprite } from './CreatureSprite';
import { juice } from '../engine/juice';

export const StarterPetSelection: React.FC = () => {
  const { selectStarterPet } = useGame();
  const [selectedElement, setSelectedElement] = useState<ElementType>('fire');
  const [previewStage, setPreviewStage] = useState<1 | 2 | 3>(1);

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50 to-sky-100 px-4 py-6 text-slate-800 select-none">
      <section className="mx-auto max-w-5xl">
        <div className="mb-5 text-center space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-violet-200 bg-white px-4 py-1.5 text-xs font-black uppercase tracking-wide text-violet-800 shadow-sm">
            <Sparkles className="h-4 w-4" /> Your First Companion
          </span>
          <h1 className="font-serif text-3xl font-black text-[#542d1d] sm:text-4xl">
            Choose Your Starter Companion
          </h1>
          <p className="mx-auto max-w-xl text-sm font-semibold text-slate-600">
            Every companion grows and evolves through 3 stages as you master K–8 vocabulary. Tap a stage below to preview their future forms!
          </p>

          {/* 3-Stage Evolution Preview Bar */}
          <div className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-[#1a162b] bg-white p-1.5 shadow-[0_3px_0_#1a162b]">
            {([1, 2, 3] as const).map((stg) => (
              <button
                key={stg}
                type="button"
                onClick={() => {
                  juice.click();
                  setPreviewStage(stg);
                }}
                className={`rounded-xl px-3 py-1 text-xs font-black uppercase transition cursor-pointer ${
                  previewStage === stg
                    ? 'bg-[#1a162b] text-[#fde047]'
                    : 'text-slate-700 hover:bg-amber-100'
                }`}
              >
                {stg === 1 ? 'Stage 1 · Baby' : stg === 2 ? 'Stage 2 · Veteran' : 'Stage 3 · Apex'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
          {ELEMENT_TYPES.map((element) => {
            const option = STARTER_PETS[element];
            const selected = selectedElement === element;
            return (
              <button
                key={element}
                type="button"
                onClick={() => {
                  juice.click();
                  juice.speakWord(option.name);
                  setSelectedElement(element);
                }}
                aria-pressed={selected}
                className={`flex flex-col items-center rounded-3xl border-[3px] p-3.5 text-center transition hover:-translate-y-1 cursor-pointer ${
                  selected
                    ? 'border-[#1a162b] bg-gradient-to-b from-white to-amber-50 shadow-[0_6px_0_#1a162b] ring-4 ring-violet-400'
                    : 'border-[#1a162b]/30 bg-white/85 shadow-[0_4px_0_#cbd5e1]'
                }`}
              >
                <CreatureSprite
                  creatureId={option.name.toLowerCase()}
                  element={element}
                  stage={previewStage}
                  mood={selected ? 'happy' : 'idle'}
                  size="md"
                />
                <span
                  className="mt-1.5 rounded-full border border-current/30 bg-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider"
                  style={{ color: ELEMENTS[element].color }}
                >
                  {ELEMENTS[element].icon} {ELEMENTS[element].name}
                </span>
                <span className="mt-1 font-serif text-base font-black text-[#542d1d]">
                  {option.name}
                </span>
                <span className="mt-0.5 text-xs font-semibold leading-snug text-slate-600">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => selectStarterPet(selectedElement)}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl border-[3px] border-[#1a162b] bg-gradient-to-r from-violet-500 to-fuchsia-500 px-8 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-[0_5px_0_#1a162b] transition hover:brightness-110 active:translate-y-1 cursor-pointer"
          >
            Partner with {STARTER_PETS[selectedElement].name}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </main>
  );
};
