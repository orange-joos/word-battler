import React from 'react';
import { ArrowRight, BookOpen, Compass, Flame, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';

const LESSONS = [
  { icon: <Compass className="h-6 w-6" />, title: 'Explore Word World', copy: 'Visit the map to find new places and adventure battles.' },
  { icon: <BookOpen className="h-6 w-6" />, title: 'Make words your moves', copy: 'Choose vocabulary cards to protect your pet and take action.' },
  { icon: <Flame className="h-6 w-6" />, title: 'Create at the Word Forge', copy: 'Combine word parts to discover fresh vocabulary and stronger cards.' },
];

export const TutorialScreen: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  const { creatures, playerId, setActiveScreen, setTab } = useGame();
  const starterPet = creatures.find((creature) => creature.id === playerId);

  const enterWorld = () => {
    updateProfile({ onboardingComplete: true });
    setTab('hub');
    setActiveScreen('game');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-100 via-emerald-50 to-amber-100 px-4 py-8">
      <section className="w-full max-w-3xl rounded-[2rem] border-4 border-white bg-white/90 p-5 shadow-[0_10px_0_#86efac] sm:p-8">
        <div className="text-center">
          <span className="text-6xl" aria-hidden="true">{starterPet?.spriteEmoji || '🐾'}</span>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">A tiny tour for {currentUser?.displayName || 'Explorer'}</p>
          <h1 className="mt-1 font-serif text-3xl font-black text-emerald-950 sm:text-4xl">Ready to begin?</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">Here are three things you can do together.</p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {LESSONS.map(({ icon, title, copy }, index) => (
            <article key={title} className="rounded-2xl border-2 border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-200 text-emerald-800">{icon}</span>
              <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-emerald-700">Step {index + 1}</p>
              <h2 className="mt-1 font-serif text-lg font-black text-slate-800">{title}</h2>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">{copy}</p>
            </article>
          ))}
        </div>

        <button
          type="button"
          onClick={enterWorld}
          className="mx-auto mt-6 flex min-h-12 items-center gap-2 rounded-2xl border-2 border-emerald-800 bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_4px_0_#065f46] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
        >
          <Sparkles className="h-5 w-5" /> Enter Word World <ArrowRight className="h-5 w-5" />
        </button>
      </section>
    </main>
  );
};
