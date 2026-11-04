import React, { useState } from 'react';
import { Swords, Sparkles, User, KeyRound, Dices, ArrowRight, ShieldCheck, Flame, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { juice } from '../engine/juice';

const FUN_NAMES = [
  'EmberKnight',
  'FrostWizard',
  'SyntaxScout',
  'StormScholar',
  'LeafRanger',
  'FlameReader',
  'NovaCrafter',
  'EchoHero',
  'CosmicSage',
  'RuneMaster',
  'SparkChampion',
  'GlacierMage',
];

export const TitleScreen: React.FC = () => {
  const { login, signup, guestLogin, allUsers } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRandomizeName = () => {
    const randomPick = FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)];
    const randomNum = Math.floor(10 + Math.random() * 89);
    const generated = `${randomPick}${randomNum}`;
    setUsername(generated);
    setDisplayName(`${randomPick} ${randomNum}`);
    juice.ding(880, 80);
  };

  const handleSwitchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setErrorMessage(null);
    juice.ding(650, 70);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const res = login(username, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Login failed. Try again.');
      juice.boing();
    } else {
      juice.fanfare();
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password && confirmPassword && password !== confirmPassword) {
      setErrorMessage('Secret Passcodes do not match!');
      juice.boing();
      return;
    }

    const res = signup(username, password, displayName || username);
    if (!res.success) {
      setErrorMessage(res.error || 'Could not create account.');
      juice.boing();
    } else {
      juice.fanfare();
    }
  };

  const handleQuickSelectUser = (savedUser: (typeof allUsers)[0]) => {
    setUsername(savedUser.username);
    setPassword(savedUser.passwordHash || '');
    const res = login(savedUser.username, savedUser.passwordHash || '');
    if (!res.success) {
      setErrorMessage(res.error || 'Could not log in.');
      juice.boing();
    } else {
      juice.fanfare();
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#ffeed4] via-[#ffe3c2] to-[#ffd2aa] text-slate-800 font-sans flex flex-col justify-between overflow-x-hidden selection:bg-amber-300">
      {/* Background Whimsical Decor Elements */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-72 w-72 rounded-full bg-orange-300/30 blur-3xl animate-pulse"></div>
      <div className="pointer-events-none absolute top-1/4 -right-20 h-80 w-80 rounded-full bg-amber-400/25 blur-3xl"></div>
      <div className="pointer-events-none absolute -bottom-10 left-1/3 h-64 w-64 rounded-full bg-rose-300/30 blur-3xl"></div>

      {/* Main Container */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:py-12 flex-1 flex flex-col items-center justify-center">
        
        {/* Title Header Hero Banner */}
        <div className="text-center space-y-3 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border-3 border-[#7b4632] bg-amber-300 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#542d1d] shadow-[0_3px_0_#7b4632] animate-bounce">
            <Sparkles className="h-4 w-4 text-amber-700" />
            <span>Educational Vocabulary Pet Battler · Grades 3–5</span>
          </div>

          <div className="relative inline-block">
            <h1 className="font-serif text-5xl sm:text-7xl font-black tracking-tight text-[#4e2717] drop-shadow-[0_4px_0_#ffce7a]">
              WORD BATTLER
            </h1>
            <div className="flex justify-center items-center gap-3 mt-1 text-2xl sm:text-3xl">
              <span className="animate-[bounce_2s_infinite]">🦊</span>
              <span className="text-sm sm:text-base font-extrabold uppercase tracking-widest text-[#8c4b27] bg-white/70 px-3 py-0.5 rounded-xl border border-amber-300">
                Linguistic Arena &amp; Morphology Forge
              </span>
              <span className="animate-[bounce_2.5s_infinite]">🐺</span>
            </div>
          </div>
        </div>

        {/* Auth & Character Selection Card */}
        <div className="w-full max-w-md rounded-3xl border-4 border-[#7b4632] bg-[#fff9ed] p-5 sm:p-7 shadow-[0_8px_0_#7b4632] space-y-5">
          
          {/* Top Toggle: Login vs Sign Up */}
          <div className="flex rounded-2xl border-3 border-[#7b4632] bg-amber-200/60 p-1 shadow-inner">
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide transition cursor-pointer ${
                mode === 'login'
                  ? 'border-2 border-[#7b4632] bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-[0_3px_0_#7b4632]'
                  : 'text-[#6b3821] hover:text-[#421d0d]'
              }`}
            >
              <KeyRound className="h-4 w-4" />
              <span>Log In</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('signup')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide transition cursor-pointer ${
                mode === 'signup'
                  ? 'border-2 border-[#7b4632] bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-[0_3px_0_#7b4632]'
                  : 'text-[#6b3821] hover:text-[#421d0d]'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="rounded-2xl border-2 border-red-400 bg-red-100 p-3 text-xs font-bold text-red-900 animate-shake">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Mode 1: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Quick Profile Select for Chromebook Classrooms */}
              {allUsers.length > 0 && (
                <div className="space-y-2">
                  <span className="block text-[11px] font-black uppercase tracking-wider text-[#7b4632]">
                    Quick Pick Saved Explorer:
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleQuickSelectUser(u)}
                        className="group flex flex-col items-center justify-center min-w-[76px] rounded-2xl border-2 border-[#7b4632] bg-white p-2 shadow-[0_3px_0_#7b4632] transition hover:scale-105 active:translate-y-0.5 cursor-pointer"
                      >
                        <span className="text-3xl group-hover:scale-110 transition-transform">{u.avatarEmoji || '🦊'}</span>
                        <span className="mt-1 text-[10px] font-black text-[#542d1d] truncate max-w-[70px]">
                          {u.displayName || u.username}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-black uppercase text-[#542d1d]">
                  Explorer Name / Username:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. EmberfoxScout"
                    required
                    className="w-full rounded-2xl border-3 border-[#7b4632] bg-white px-3.5 py-2.5 pl-10 text-sm font-bold text-[#542d1d] focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                  <User className="absolute left-3 top-3 h-4 w-4 text-[#8c5a41]" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black uppercase text-[#542d1d]">
                  Secret Word / Passcode:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your secret passcode"
                    className="w-full rounded-2xl border-3 border-[#7b4632] bg-white px-3.5 py-2.5 pl-10 text-sm font-bold text-[#542d1d] focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-[#8c5a41]" />
                </div>
                <span className="block text-[10px] font-bold text-[#86563c]">
                  (Tip: If you're using a classroom account, ask your teacher or leave blank if none was set.)
                </span>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl border-3 border-[#7b4632] bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 py-3 text-sm font-black uppercase tracking-wider text-white shadow-[0_4px_0_#7b4632] transition hover:scale-102 hover:brightness-110 active:translate-y-1 active:shadow-none cursor-pointer"
              >
                <Swords className="h-5 w-5" />
                <span>Enter Word Battler!</span>
              </button>
            </form>
          )}

          {/* Mode 2: SIGN UP */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase text-[#542d1d]">
                    Choose Explorer Name:
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomizeName}
                    className="flex items-center gap-1 text-[11px] font-black text-amber-700 hover:text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 cursor-pointer"
                  >
                    <Dices className="h-3.5 w-3.5" />
                    <span>🎲 Suggest Name</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (!displayName) setDisplayName(e.target.value);
                    }}
                    placeholder="e.g. WordWizard42"
                    required
                    className="w-full rounded-2xl border-3 border-[#7b4632] bg-white px-3.5 py-2.5 pl-10 text-sm font-bold text-[#542d1d] focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                  <User className="absolute left-3 top-3 h-4 w-4 text-[#8c5a41]" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black uppercase text-[#542d1d]">
                  Display Nickname (shown to friends):
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Captain Spark"
                  className="w-full rounded-2xl border-3 border-[#7b4632] bg-white px-3.5 py-2.5 text-sm font-bold text-[#542d1d] focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-black uppercase text-[#542d1d]">
                    Secret Passcode:
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create passcode"
                    className="w-full rounded-2xl border-3 border-[#7b4632] bg-white px-3.5 py-2 text-sm font-bold text-[#542d1d] focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-black uppercase text-[#542d1d]">
                    Confirm Passcode:
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat passcode"
                    className="w-full rounded-2xl border-3 border-[#7b4632] bg-white px-3.5 py-2 text-sm font-bold text-[#542d1d] focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                </div>
              </div>

              <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-2.5 text-[11px] font-bold text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Next step: Customize your personal avatar creature, headgear &amp; style!</span>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl border-3 border-[#7b4632] bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 py-3 text-sm font-black uppercase tracking-wider text-white shadow-[0_4px_0_#7b4632] transition hover:scale-102 hover:brightness-110 active:translate-y-1 active:shadow-none cursor-pointer"
              >
                <span>Create &amp; Customize Character</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Quick Classroom / Guest Mode Link */}
          <div className="pt-2 border-t-2 border-amber-200 text-center">
            <button
              type="button"
              onClick={() => {
                juice.ding(700, 100);
                guestLogin();
              }}
              className="text-xs font-black text-[#8c502b] hover:text-[#50240b] underline cursor-pointer"
            >
              ⚡ Quick Play as Guest Explorer (Instant Avatar Creator)
            </button>
          </div>

        </div>

      </div>

      {/* Footer Branding */}
      <footer className="relative z-10 py-4 text-center text-xs font-bold text-[#7b4632]/80">
        Word Battler · Educational Vocabulary &amp; English Morphology Combat System
      </footer>
    </div>
  );
};
