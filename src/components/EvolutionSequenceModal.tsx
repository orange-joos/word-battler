import React, { useState, useEffect } from 'react';
import { Sparkles, Star, Zap, Swords, Shield, Heart, Trophy, Check, ArrowRight } from 'lucide-react';
import { Creature, EvolutionStage } from '../types';
import { getCurrentStage, getNextEvolutionStage, applyEvolution } from '../data/evolutionData';
import { juice } from '../engine/juice';

interface EvolutionSequenceModalProps {
  creature: Creature;
  onComplete: (evolvedCreature: Creature) => void;
  onClose: () => void;
}

type SequenceStep = 'ready' | 'charging' | 'metamorphosis' | 'reveal';

export const EvolutionSequenceModal: React.FC<EvolutionSequenceModalProps> = ({
  creature,
  onComplete,
  onClose,
}) => {
  const [step, setStep] = useState<SequenceStep>('ready');
  const [flickerEmoji, setFlickerEmoji] = useState<string>(creature.spriteEmoji || '🦊');
  const [isWhiteout, setIsWhiteout] = useState(false);

  const currentStage = getCurrentStage(creature);
  const nextStage = getNextEvolutionStage(creature);

  // Play sound effect helper
  const playTone = (freq = 440, duration = 0.15, type: OscillatorType = 'triangle') => {
    try {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      const ac = new AudioCtor();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      gain.gain.setValueAtTime(0.15, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + duration);
    } catch {}
  };

  const handleStartEvolution = () => {
    setStep('charging');
    juice.ding(500, 150);

    // After 1.4s of charging, enter the flashing metamorphosis
    setTimeout(() => {
      setStep('metamorphosis');
      let count = 0;
      const maxFlickers = 18;
      const interval = setInterval(() => {
        count++;
        // Rapidly alternate emojis
        const isNext = count % 2 === 1;
        setFlickerEmoji(isNext ? (nextStage?.spriteEmoji || '🦁') : (currentStage.spriteEmoji || '🦊'));
        playTone(550 + count * 25, 0.08, 'sawtooth');

        if (count >= maxFlickers) {
          clearInterval(interval);
          // Dramatic whiteout flash
          setIsWhiteout(true);
          juice.fanfare();
          setTimeout(() => {
            setIsWhiteout(false);
            setStep('reveal');
          }, 400);
        }
      }, 140);
    }, 1400);
  };

  const handleFinish = () => {
    const { evolvedCreature } = applyEvolution(creature);
    juice.ding(900, 200);
    onComplete(evolvedCreature);
  };

  if (!nextStage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md overflow-hidden select-none">
      
      {/* Dramatic Whiteout Flash during Metamorphosis peak */}
      {isWhiteout && (
        <div className="fixed inset-0 z-60 bg-white transition-opacity duration-300 pointer-events-none" />
      )}

      {/* Main Evolution Stage Container */}
      <div className="relative w-full max-w-xl rounded-3xl border-4 border-[#ffce7a] bg-gradient-to-b from-[#1e1b4b] via-[#0f172a] to-[#020617] p-6 sm:p-8 text-center text-white shadow-[0_0_50px_rgba(251,191,36,0.4)] space-y-6 overflow-hidden">
        
        {/* Animated Background Magic Aura & Starry Nebula */}
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 blur-3xl animate-spin-slow" />
        </div>

        {/* STEP 1: READY / CONFIRMATION */}
        {step === 'ready' && (
          <div className="relative z-10 space-y-5">
            <div className="space-y-1">
              <span className="rounded-full border-2 border-amber-400 bg-amber-400/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-300 inline-block">
                ✨ Evolution Threshold Reached!
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-black text-amber-200">
                What? {creature.name} is Ready to Evolve!
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-300">
                {creature.name} has reached <strong>Level {creature.level || 10}</strong>. Channel your vocabulary power to trigger metamorphosis!
              </p>
            </div>

            {/* Side-by-side Evolution Preview Cards */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 py-2">
              
              {/* Current Pet */}
              <div className="flex flex-col items-center rounded-2xl border-2 border-slate-700 bg-slate-900/80 p-4 w-36 shadow-lg">
                <span className="text-5xl sm:text-6xl drop-shadow">{currentStage.spriteEmoji}</span>
                <span className="font-serif text-sm font-black text-slate-200 mt-2">{currentStage.name}</span>
                <span className="text-[10px] font-bold text-slate-400">Stage {currentStage.stage}</span>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center text-amber-400 animate-pulse">
                <ArrowRight className="h-8 w-8" />
                <span className="text-[9px] font-black uppercase tracking-wider">Evolve</span>
              </div>

              {/* Next Evolved Form */}
              <div className="flex flex-col items-center rounded-2xl border-3 border-amber-400 bg-amber-950/60 p-4 w-36 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-2 ring-amber-300/40">
                <span className="text-5xl sm:text-6xl drop-shadow animate-bounce">{nextStage.spriteEmoji}</span>
                <span className="font-serif text-sm font-black text-amber-300 mt-2">{nextStage.name}</span>
                <span className="text-[10px] font-bold text-amber-400">Stage {nextStage.stage}</span>
              </div>

            </div>

            {/* Projected Stat Boost Preview */}
            <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-900/30 p-3.5 text-xs text-amber-200">
              <span className="font-black uppercase tracking-wider text-amber-300 block mb-1">
                ⚡ Metamorphic Stat Upgrades:
              </span>
              <div className="grid grid-cols-4 gap-2 text-center font-mono font-black pt-1">
                <div className="rounded-lg bg-black/40 p-1.5 border border-red-500/30 text-red-300">
                  HP +{nextStage.statBoosts.hp}
                </div>
                <div className="rounded-lg bg-black/40 p-1.5 border border-amber-500/30 text-amber-300">
                  ATK +{nextStage.statBoosts.attack}
                </div>
                <div className="rounded-lg bg-black/40 p-1.5 border border-blue-500/30 text-blue-300">
                  DEF +{nextStage.statBoosts.defense}
                </div>
                <div className="rounded-lg bg-black/40 p-1.5 border border-purple-500/30 text-purple-300">
                  SPD +{nextStage.statBoosts.speed}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border-2 border-slate-600 bg-slate-800 hover:bg-slate-700 px-5 py-3 text-xs font-black uppercase text-slate-300 transition cursor-pointer"
              >
                Not Yet
              </button>

              <button
                type="button"
                onClick={handleStartEvolution}
                className="group flex items-center justify-center gap-2 rounded-2xl border-3 border-amber-400 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-8 py-3.5 text-sm sm:text-base font-black uppercase tracking-wider text-slate-950 shadow-[0_5px_0_#b45309] hover:scale-103 hover:brightness-110 active:translate-y-1 transition cursor-pointer"
              >
                <Sparkles className="h-5 w-5 text-slate-950 group-hover:rotate-45 transition-transform" />
                <span>Begin Evolution!</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CHARGING UP */}
        {step === 'charging' && (
          <div className="relative z-10 py-8 space-y-6">
            <h3 className="font-serif text-2xl font-black text-amber-300 animate-pulse">
              Channeling Linguistic Energy...
            </h3>

            {/* Pulsating Summoning Circle */}
            <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-amber-400 animate-spin-slow opacity-80" />
              <div className="absolute inset-2 rounded-full border-2 border-rose-400 animate-ping opacity-40" />
              <span className="text-7xl sm:text-8xl drop-shadow animate-pulse scale-110 transition-transform">
                {currentStage.spriteEmoji}
              </span>
            </div>

            <p className="font-mono text-xs font-bold text-amber-200">
              Grammatical particles swirling around {creature.name}...
            </p>
          </div>
        )}

        {/* STEP 3: METAMORPHOSIS RAPID FLICKER */}
        {step === 'metamorphosis' && (
          <div className="relative z-10 py-8 space-y-6">
            <h3 className="font-serif text-3xl font-black text-amber-300 tracking-wider">
              METAMORPHOSIS!
            </h3>

            {/* Rapidly flashing silhouette / sprite */}
            <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-400/40 blur-2xl animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-amber-300 animate-spin" />
              <span className="text-8xl sm:text-9xl drop-shadow transform scale-125 transition-all duration-75">
                {flickerEmoji}
              </span>
            </div>

            <p className="font-mono text-sm font-black text-amber-400 uppercase tracking-widest animate-pulse">
              ⚡ Transforming Form &amp; Synergies ⚡
            </p>
          </div>
        )}

        {/* STEP 4: TRIUMPHANT REVEAL & STAT UPGRADES */}
        {step === 'reveal' && (
          <div className="relative z-10 space-y-5 animate-in fade-in zoom-in-95 duration-500">
            
            <div className="space-y-1">
              <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-950 inline-block shadow">
                🎉 Evolution Complete!
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-black text-amber-300">
                {currentStage.name} evolved into {nextStage.name}!
              </h2>
              <span className="text-xs font-black uppercase text-amber-200 tracking-widest block">
                {nextStage.title}
              </span>
            </div>

            {/* Big Triumphant Sprite Stage */}
            <div className="relative mx-auto flex h-40 w-40 sm:h-44 sm:w-44 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-xl animate-pulse" />
              <div className="absolute bottom-2 h-8 w-32 rounded-full bg-amber-500/30 border-2 border-amber-400/60" />
              <span className="relative z-10 text-7xl sm:text-8xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] animate-bounce select-none">
                {nextStage.spriteEmoji}
              </span>
            </div>

            {/* Description & Lore */}
            <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-950/40 p-3 text-xs sm:text-sm font-bold text-amber-100">
              <p className="italic leading-relaxed">"{nextStage.description}"</p>
            </div>

            {/* Before ➜ After Stat Comparison Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left text-xs">
              
              {/* HP */}
              <div className="rounded-xl border border-red-500/50 bg-red-950/40 p-2.5">
                <div className="flex items-center gap-1 text-red-400 font-black text-[10px] uppercase">
                  <Heart className="h-3.5 w-3.5" />
                  <span>Max HP</span>
                </div>
                <div className="font-mono text-base font-black text-white mt-1">
                  {creature.stats.hp} ➜ <span className="text-emerald-400">{creature.stats.hp + nextStage.statBoosts.hp}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400">+{nextStage.statBoosts.hp} HP Boost</span>
              </div>

              {/* ATK */}
              <div className="rounded-xl border border-amber-500/50 bg-amber-950/40 p-2.5">
                <div className="flex items-center gap-1 text-amber-400 font-black text-[10px] uppercase">
                  <Swords className="h-3.5 w-3.5" />
                  <span>Attack</span>
                </div>
                <div className="font-mono text-base font-black text-white mt-1">
                  {creature.stats.attack} ➜ <span className="text-emerald-400">{creature.stats.attack + nextStage.statBoosts.attack}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400">+{nextStage.statBoosts.attack} ATK Boost</span>
              </div>

              {/* DEF */}
              <div className="rounded-xl border border-blue-500/50 bg-blue-950/40 p-2.5">
                <div className="flex items-center gap-1 text-blue-400 font-black text-[10px] uppercase">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Defense</span>
                </div>
                <div className="font-mono text-base font-black text-white mt-1">
                  {creature.stats.defense} ➜ <span className="text-emerald-400">{creature.stats.defense + nextStage.statBoosts.defense}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400">+{nextStage.statBoosts.defense} DEF Boost</span>
              </div>

              {/* SPD */}
              <div className="rounded-xl border border-purple-500/50 bg-purple-950/40 p-2.5">
                <div className="flex items-center gap-1 text-purple-400 font-black text-[10px] uppercase">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Speed</span>
                </div>
                <div className="font-mono text-base font-black text-white mt-1">
                  {creature.stats.speed} ➜ <span className="text-emerald-400">{creature.stats.speed + nextStage.statBoosts.speed}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400">+{nextStage.statBoosts.speed} SPD Boost</span>
              </div>

            </div>

            {/* Confirm & Close Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border-3 border-emerald-400 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 py-3.5 text-base font-black uppercase tracking-wider text-slate-950 shadow-[0_5px_0_#065f46] hover:scale-102 hover:brightness-110 active:translate-y-1 transition cursor-pointer"
              >
                <Check className="h-5 w-5" />
                <span>Claim {nextStage.name}!</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
