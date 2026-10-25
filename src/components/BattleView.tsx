import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Activity, BookOpen, Heart, RotateCcw, Shield, Sparkles, Swords, Volume2, Zap } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { INITIAL_WORDS } from '../data/initialData';
import { evaluateCombo, getMatrixEffectInfo } from '../engine/combat';
import { juice } from '../engine/juice';
import { BattleLogEntry, Creature, MoveCategory, PartOfSpeech, Word } from '../types';
import { FloatingCombatOverlay, CombatPopup } from './FloatingCombatOverlay';
import { WordInspectorBanner } from './WordInspectorBanner';
import { WordModal } from './WordModal';

const POS_STYLES: Record<PartOfSpeech, { label: string; card: string; badge: string; icon: string }> = {
  verb: { label: 'VERB', card: 'border-rose-300 bg-gradient-to-br from-rose-400 to-red-500 text-white shadow-rose-300/50', badge: 'bg-rose-700/70', icon: '⚡' },
  noun: { label: 'NOUN', card: 'border-sky-300 bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-sky-300/50', badge: 'bg-blue-700/70', icon: '💎' },
  adjective: { label: 'ADJECTIVE', card: 'border-emerald-300 bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-emerald-300/50', badge: 'bg-green-700/70', icon: '🌿' },
  adverb: { label: 'ADVERB', card: 'border-amber-200 bg-gradient-to-br from-amber-300 to-yellow-400 text-amber-950 shadow-amber-200/70', badge: 'bg-amber-100/70', icon: '✨' },
};

const creatureEmoji = (creature: Creature) => {
  const name = creature.name.toLowerCase();
  if (name.includes('fox')) return '🦊';
  if (name.includes('wolf') || name.includes('pup')) return '🐺';
  if (name.includes('dragon')) return '🐉';
  if (name.includes('bird') || name.includes('owl')) return '🦉';
  if (name.includes('turtle')) return '🐢';
  return creature.element === 'ice' ? '🐻‍❄️' : creature.element === 'nature' ? '🦌' : '🐲';
};

const healthColor = (element: string) => element === 'ice' ? 'from-sky-400 to-blue-500' : element === 'nature' ? 'from-lime-400 to-emerald-500' : 'from-orange-400 to-rose-500';

export const BattleView: React.FC = () => {
  const { battleState, words, playerId, submitCombo, restartBattle, goToLoadout } = useGame();
  const [activeCategory, setActiveCategory] = useState<MoveCategory>('ATTACK');
  const [slot1Word, setSlot1Word] = useState<Word | null>(null);
  const [slot2Word, setSlot2Word] = useState<Word | null>(null);
  const [inspectedWord, setInspectedWord] = useState<Word | null>(null);
  const [modalWord, setModalWord] = useState<Word | null>(null);
  const [playerPopups, setPlayerPopups] = useState<CombatPopup[]>([]);
  const [enemyPopups, setEnemyPopups] = useState<CombatPopup[]>([]);
  const [playerShake, setPlayerShake] = useState(false);
  const [enemyShake, setEnemyShake] = useState(false);
  const [playerLunge, setPlayerLunge] = useState(false);
  const [enemyLunge, setEnemyLunge] = useState(false);
  const prevLogCount = useRef(battleState.log.length);

  const player = battleState.player;
  const enemy = battleState.enemy;
  const isBattleEnd = battleState.phase === 'BATTLE_END';

  const allWords = useMemo(() => [
    ...(words.verbs?.length ? words.verbs : INITIAL_WORDS.verbs || []),
    ...(words.nouns?.length ? words.nouns : INITIAL_WORDS.nouns || []),
    ...(words.adjectives?.length ? words.adjectives : INITIAL_WORDS.adjectives || []),
    ...(words.adverbs?.length ? words.adverbs : INITIAL_WORDS.adverbs || []),
  ], [words]);

  const equippedLoadoutWords = useMemo(() => {
    const loadout = player.loadout || { verb: null, noun: null, adjective: null, adverb: null };
    return (['verb', 'noun', 'adjective', 'adverb'] as PartOfSpeech[]).map((slot) => ({
      slot,
      word: allWords.find((word) => word.id === loadout[slot]) || null,
    }));
  }, [player.loadout, allWords]);

  const pushPopup = (target: 'player' | 'enemy', text: string, type: CombatPopup['type']) => {
    const id = `${Date.now()}-${Math.random()}`;
    const setter = target === 'player' ? setPlayerPopups : setEnemyPopups;
    setter((items) => [...items, { id, text, type }]);
    window.setTimeout(() => setter((items) => items.filter((item) => item.id !== id)), 1400);
  };

  useEffect(() => {
    const count = battleState.log.length;
    if (count < prevLogCount.current) {
      prevLogCount.current = count;
      setPlayerPopups([]); setEnemyPopups([]); setPlayerShake(false); setEnemyShake(false);
      return;
    }
    if (count === prevLogCount.current) return;
    const additions = battleState.log.slice(prevLogCount.current);
    prevLogCount.current = count;
    additions.forEach((entry: BattleLogEntry) => {
      const target = entry.isPlayer ? 'enemy' : 'player';
      if (entry.damage && entry.damage > 0) {
        pushPopup(target, `−${entry.damage}`, 'damage');
        if (target === 'player') {
          setPlayerShake(true);
          if (!entry.isPlayer) { setEnemyLunge(true); window.setTimeout(() => setEnemyLunge(false), 420); }
          window.setTimeout(() => setPlayerShake(false), 520);
        } else {
          setEnemyShake(true);
          if (entry.isPlayer) { setPlayerLunge(true); window.setTimeout(() => setPlayerLunge(false), 420); }
          window.setTimeout(() => setEnemyShake(false), 520);
        }
      }
      if (entry.shield && entry.shield > 0) pushPopup(entry.isPlayer ? 'player' : 'enemy', `+${entry.shield} SHIELD`, 'shield');
      if (entry.message.includes('dodged')) pushPopup(entry.message.startsWith('You') ? 'player' : 'enemy', '💨 DODGED!', 'evade');
      if (entry.message.includes('Mighty Surge') || entry.message.includes('Empowered')) pushPopup(entry.isPlayer ? 'player' : 'enemy', '✨ POWER UP!', 'buff');
      if (entry.message.includes('Inflicted') || entry.message.includes('Afflicted')) pushPopup('enemy', '🌟 AFFECTED!', 'debuff');
    });
  }, [battleState.log]);

  const handleWordClick = (word: Word) => {
    setInspectedWord(word);
    juice.ding(word.element === 'fire' ? 620 : word.element === 'ice' ? 520 : 700, 80);
    juice.speak(word.word);
    if (slot1Word?.id === word.id) setSlot1Word(null);
    else if (slot2Word?.id === word.id) setSlot2Word(null);
    else if (!slot1Word) setSlot1Word(word);
    else setSlot2Word(word);
  };

  const clearSlots = () => { setSlot1Word(null); setSlot2Word(null); };
  const handleSubmit = () => {
    if (isBattleEnd) { restartBattle(playerId); clearSlots(); return; }
    if (!slot1Word) return;
    setPlayerLunge(true);
    window.setTimeout(() => setPlayerLunge(false), 420);
    submitCombo(slot1Word.id, slot2Word?.id || null, activeCategory);
    clearSlots();
  };
  const liveEvaluation = useMemo(() => !slot1Word && !slot2Word ? null : evaluateCombo(player, slot1Word, slot2Word, activeCategory), [player, slot1Word, slot2Word, activeCategory]);
  const playerHpRatio = player.maxHp ? Math.max(0, (player.currentHp ?? 0) / player.maxHp) : 0;
  const enemyHpRatio = enemy.maxHp ? Math.max(0, (enemy.currentHp ?? 0) / enemy.maxHp) : 0;

  return (
    <main className="battle-page text-slate-900">
      <div className="battle-shell">
        <section className="battle-stage" aria-label="Battle arena">
          <div className="stage-sky" />
          <div className="stage-sun" />
          <div className="stage-cloud cloud-one">☁️</div><div className="stage-cloud cloud-two">☁️</div>
          <div className="stage-hill hill-back" /><div className="stage-hill hill-front" />
          <div className="stage-flower flower-one">🌼</div><div className="stage-flower flower-two">🌸</div><div className="stage-flower flower-three">🌼</div>
          <div className="stage-topline">
            <div className="stage-level"><span className="level-star">★</span><span>WORD WILD</span></div>
            <div className="stage-title"><span>🌈</span> MEADOW ARENA <span>🌈</span></div>
            <div className="stage-round">{isBattleEnd ? 'BATTLE OVER' : battleState.phase === 'ENEMY_TURN' ? 'RIVAL TURN' : 'YOUR TURN'}</div>
          </div>
          <div className="stage-tree tree-one" aria-hidden="true" />
          <div className="stage-tree tree-two" aria-hidden="true" />
          <div className="stage-tree tree-three" aria-hidden="true" />
          <div className="stage-tree tree-four" aria-hidden="true" />
          <div className="stage-story" role="status" aria-live="polite">
            <span className="story-guide" aria-hidden="true">🦉</span>
            <p>
              <strong>{isBattleEnd ? 'Battle Buddy' : 'Battle Buddy says'}</strong>
              {isBattleEnd
                ? battleState.winner === player.id
                  ? 'You did it! Your word magic saved the day!'
                  : 'Every great word wizard tries again. Ready for a rematch?'
                : battleState.phase === 'ENEMY_TURN'
                  ? `${enemy.name} is making a move. Get ready!`
                  : slot1Word && slot2Word
                    ? `${slot1Word.word} + ${slot2Word.word} are ready! Cast your word combo!`
                    : slot1Word
                      ? `${slot1Word.word} is ready! Pick a second word or cast it on its own.`
                      : 'Pick a spell to cast! Tap one of your word cards to get started.'}
            </p>
          </div>
          <div className="fighter-row">
            <article className={`fighter fighter-player ${playerShake ? 'is-hurt' : ''} ${playerLunge ? 'is-lunging' : ''}`}>
              <div className="fighter-nameplate player-nameplate"><span>YOUR PET</span><strong>{player.name}</strong><small>{player.element} {player.element === 'fire' ? '🔥' : player.element === 'ice' ? '❄️' : '🌿'}</small></div>
              <div className={`fighter-art player-art element-${player.element}`} aria-label={`${player.name} battle sprite`}><div className="art-aura" /><span className="pet-emoji">{creatureEmoji(player)}</span><span className="art-spark">✦</span></div>
              <div className="platform platform-player" />
              <div className="fighter-hp"><div className="hp-top"><span><Heart size={14} fill="currentColor" /> HP</span><strong>{player.currentHp} / {player.maxHp}</strong></div><div className="hp-track" role="progressbar" aria-label={`${player.name} health`} aria-valuemin={0} aria-valuemax={player.maxHp} aria-valuenow={player.currentHp}><i className={healthColor(player.element)} style={{ width: `${playerHpRatio * 100}%` }} /></div></div>
              {(player.shield ?? 0) > 0 && <span className="battle-status">🛡️ {player.shield}</span>}
              <FloatingCombatOverlay popups={playerPopups} />
            </article>
            <div className="versus-badge">VS</div>
            <article className={`fighter fighter-enemy ${enemyShake ? 'is-hurt' : ''} ${enemyLunge ? 'is-lunging' : ''}`}>
              <div className="fighter-nameplate enemy-nameplate"><span>WORD BOSS</span><strong>{enemy.name}</strong><small>{enemy.element} {enemy.element === 'fire' ? '🔥' : enemy.element === 'ice' ? '❄️' : '🌿'}</small></div>
              <div className={`fighter-art enemy-art element-${enemy.element}`} aria-label={`${enemy.name} battle sprite`}><div className="art-aura" /><span className="pet-emoji">{creatureEmoji(enemy)}</span><span className="art-spark">✦</span></div>
              <div className="platform platform-enemy" />
              <div className="fighter-hp"><div className="hp-top"><span><Heart size={14} fill="currentColor" /> HP</span><strong>{enemy.currentHp} / {enemy.maxHp}</strong></div><div className="hp-track" role="progressbar" aria-label={`${enemy.name} health`} aria-valuemin={0} aria-valuemax={enemy.maxHp} aria-valuenow={enemy.currentHp}><i className={healthColor(enemy.element)} style={{ width: `${enemyHpRatio * 100}%` }} /></div></div>
              {(enemy.shield ?? 0) > 0 && <span className="battle-status">🛡️ {enemy.shield}</span>}
              <FloatingCombatOverlay popups={enemyPopups} />
            </article>
          </div>
          <div className="arena-ground-label"><span>🍀</span> MEADOW OF WORDS <span>🍀</span></div>
          {isBattleEnd && <div className="victory-ribbon">{battleState.winner === player.id ? '🏆 AMAZING WIN!' : '💫 TRY AGAIN!'}</div>}
        </section>

        <section className="battle-deck">
          <div className="deck-heading"><div><p className="eyebrow">YOUR PET'S MOVE SET</p><h1>Pick a word move!</h1></div><button onClick={goToLoadout} className="arsenal-edit"><BookOpen size={17} /> Edit arsenal</button></div>
          <div className="move-grid" aria-label={`${player.name}'s four equipped battle moves`}>
            {equippedLoadoutWords.map(({ slot, word }, index) => {
              const style = POS_STYLES[slot];
              if (!word) return <button key={slot} onClick={goToLoadout} className="move-card move-empty"><span className="move-number">{index + 1}</span><span className="move-symbol">＋</span><span className="move-empty-copy">Equip a {slot}</span></button>;
              const selected = slot1Word?.id === word.id || slot2Word?.id === word.id;
              return <button key={slot} onClick={() => handleWordClick(word)} onContextMenu={(event) => { event.preventDefault(); setModalWord(word); }} className={`move-card ${style.card} ${selected ? 'move-selected' : ''}`} aria-pressed={selected} title={`${word.definition} Right click for word details`}>
                <span className="move-number">{index + 1}</span><span className="move-symbol">{style.icon}</span><span className={`move-type ${style.badge}`}>{style.label}</span><strong className="move-word">{word.word}</strong><span className="move-element">{word.element === 'fire' ? '🔥' : word.element === 'ice' ? '❄️' : '🌿'} {word.element}</span>{selected && <span className="move-check">✓</span>}
              </button>;
            })}
          </div>
          <div className="deck-controls">
            <div className="category-pills" aria-label="Move style">{([
              ['ATTACK', Swords, 'Strike'], ['DEFEND', Shield, 'Guard'], ['BUFF', Sparkles, 'Boost'], ['DEBUFF', Activity, 'Trick'],
            ] as const).map(([category, Icon, label]) => <button key={category} type="button" aria-pressed={activeCategory === category} onClick={() => { setActiveCategory(category); juice.ding(category === 'ATTACK' ? 520 : category === 'DEFEND' ? 660 : category === 'BUFF' ? 880 : 380, 80); }} className={`category-pill category-${category.toLowerCase()} ${activeCategory === category ? 'category-active' : ''}`}><Icon size={15} /> {label}</button>)}</div>
            <p className="pick-hint">{slot1Word ? slot2Word ? <><strong>{slot1Word.word} {slot2Word.word}</strong> — ready to go!</> : <>Tap a second word to make a combo, or use <strong>{slot1Word.word}</strong> alone.</> : 'Choose one of your four words to make a move!'}</p>
            <button onClick={handleSubmit} disabled={!slot1Word && !isBattleEnd} className="battle-button">{isBattleEnd ? <><RotateCcw size={20} /> Battle again!</> : <><Zap size={20} fill="currentColor" /> {activeCategory === 'ATTACK' ? 'LET’S GO!' : `${activeCategory} MOVE!`}</>}</button>
            {slot1Word && <button onClick={clearSlots} className="clear-move">Clear move</button>}
          </div>
          {liveEvaluation && <div className={`move-preview ${liveEvaluation.valid ? 'preview-valid' : 'preview-invalid'}`}><span className="preview-label">{liveEvaluation.valid ? `✨ ${getMatrixEffectInfo(activeCategory, (slot2Word || slot1Word)!.partOfSpeech).name}` : '🔒 Check your word'}</span><span>{liveEvaluation.valid ? liveEvaluation.tacticalOutcome : liveEvaluation.reasons[0]}</span></div>}
          <WordInspectorBanner word={inspectedWord} activeCategory={activeCategory} onClose={() => setInspectedWord(null)} onSlotWord={handleWordClick} />
          <div className="deck-footnote"><span>📚</span> Words in your arsenal are your battle moves. Build combos to power them up!</div>
        </section>
      </div>
      <AnimatePresence>{modalWord && <WordModal word={modalWord} onClose={() => setModalWord(null)} />}</AnimatePresence>
    </main>
  );
};