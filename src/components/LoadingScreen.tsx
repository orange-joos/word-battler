import React from 'react';
import { Sparkles } from 'lucide-react';

export const LoadingScreen: React.FC = () => (
  <main className="flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-sky-200 via-violet-100 to-amber-100 px-5">
    <div className="w-full max-w-sm rounded-[2rem] border-4 border-white bg-white/90 p-8 text-center shadow-[0_10px_0_#c4b5fd]">
      <div className="mx-auto mb-4 flex h-20 w-20 animate-bounce items-center justify-center rounded-3xl bg-gradient-to-br from-amber-300 to-orange-400 text-5xl shadow-inner">
        🐾
      </div>
      <Sparkles className="mx-auto h-6 w-6 animate-pulse text-violet-500" />
      <h1 className="mt-2 font-serif text-2xl font-black text-violet-950">Getting your world ready!</h1>
      <p className="mt-2 text-sm font-bold text-slate-600">Your next adventure is just around the corner.</p>
    </div>
  </main>
);
