import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ELEMENTS, ELEMENT_TYPES } from '../data/elements';
import { STARTER_PETS } from '../data/starterPets';
import { ElementType } from '../types';

export const StarterPetSelection: React.FC = () => {
  const { selectStarterPet } = useGame();
  const [selectedElement, setSelectedElement] = useState<ElementType>('fire');

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50 to-sky-100 px-4 py-8 text-slate-800">
      <section className="mx-auto max-w-5xl">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-violet-200 bg-white px-4 py-1.5 text-xs font-black uppercase tracking-wide text-violet-800 shadow-sm">
            <Sparkles className="h-4 w-4" /> Your first companion
          </span>
          <h1 className="mt-3 font-serif text-3xl font-black text-[#542d1d] sm:text-4xl">Choose a starter pet</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-slate-600">
            Every companion learns alongside you. Pick the element and friend that feel just right.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ELEMENT_TYPES.map((element) => {
            const option = STARTER_PETS[element];
            const selected = selectedElement === element;
            return (
              <button
                key={element}
                type="button"
                onClick={() => setSelectedElement(element)}
                aria-pressed={selected}
                className={`flex min-h-40 flex-col items-center rounded-3xl border-4 p-3 text-center transition hover:-translate-y-1 ${
                  selected
                    ? 'border-violet-500 bg-white shadow-[0_6px_0_#8b5cf6]'
                    : 'border-white bg-white/75 shadow-[0_4px_0_#cbd5e1]'
                }`}
              >
                <span className="text-4xl" aria-hidden="true">{option.emoji}</span>
                <span className="mt-1 text-[10px] font-black uppercase tracking-wider" style={{ color: ELEMENTS[element].color }}>
                  {ELEMENTS[element].icon} {ELEMENTS[element].name}
                </span>
                <span className="mt-1 font-serif text-sm font-black text-[#542d1d]">{option.name}</span>
                <span className="mt-1 text-[10px] font-semibold leading-snug text-slate-500">{option.description}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => selectStarterPet(selectedElement)}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl border-2 border-[#6d28d9] bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_4px_0_#5b21b6] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
          >
            Choose {STARTER_PETS[selectedElement].name}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </main>
  );
};
