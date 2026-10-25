export type ElementType = 'fire' | 'ice' | string;

export type PartOfSpeech = 'adjective' | 'noun' | 'verb' | 'adverb';

export type MoveCategory = 'ATTACK' | 'DEFEND' | 'BUFF' | 'DEBUFF';
export type CombatMode = MoveCategory;

export interface PetLoadout {
  verb: string | null;
  noun: string | null;
  adjective: string | null;
  adverb: string | null;
}

export type TabType = 'battle' | 'loadout' | 'forge';

export interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff';
  duration: number;
  amount?: number;
  stat?: string;
  description?: string;
}

export interface ForgeMetadata {
  layer: number;
  process: 'affixation' | 'compounding';
  parts: string[];
  affixId?: string;
  baseId?: string;
  modifierId?: string;
  headId?: string;
  modifierElement?: string;
  depth: number;
  resonance?: boolean;
  powerBonus: number;
}

export interface Word {
  id: string;
  word: string;
  partOfSpeech: PartOfSpeech;
  element: ElementType;
  definition: string;
  example: string;
  powerBonus?: number;
  fusionDepth?: number;
  forge?: ForgeMetadata;
}

export interface CreatureStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface CreatureForgeMetadata {
  layer: number;
  process: 'creature-compounding';
  modifier: string;
  head: string;
  sourceId: string;
  depth: number;
  resonance: boolean;
}

export interface Creature {
  id: string;
  name: string;
  element: ElementType;
  elementAffinity?: ElementType;
  loadout?: PetLoadout;
  description: string;
  stats: CreatureStats;
  currentHp?: number;
  maxHp?: number;
  shield?: number;
  allowedWordTypes: PartOfSpeech[];
  allowedElements: ElementType[];
  forged?: CreatureForgeMetadata;
  statuses?: StatusEffect[];
  empowered?: boolean;
  reflectStance?: boolean;
  evasionStance?: boolean;
}

export interface Affix {
  id: string;
  text: string;
  type: 'prefix' | 'suffix';
  from: PartOfSpeech[];
  to: PartOfSpeech;
  gloss: string;
  definition: string;
  elementEffect: 'keep' | 'invert';
  respell: string[];
}

export type BattlePhase =
  | 'PLAYER_TURN'
  | 'WORD_CHOICE'
  | 'RESOLUTION'
  | 'ENEMY_TURN'
  | 'BATTLE_END';

export interface ComboEvaluation {
  valid: boolean;
  category: MoveCategory;
  phrase: string;
  word1: Word;
  word2?: Word | null;
  power: number;
  shieldGain: number;
  effectName: string;
  tacticalOutcome: string;
  reasons: string[];
}

export interface CombatEvent {
  type:
    | 'SPEAK'
    | 'DAMAGE'
    | 'SHIELD'
    | 'BUFF'
    | 'DEBUFF'
    | 'EVADE'
    | 'REFLECT'
    | 'FIZZLE'
    | 'VICTORY'
    | 'DEFEAT'
    | 'STATUS_TICK';
  attackerId?: string;
  targetId?: string;
  amount?: number;
  targetHp?: number;
  phrase?: string;
  reason?: string;
  winnerId?: string;
  absorbed?: number;
  text?: string;
  effect?: string;
  duration?: number;
  stat?: string;
}

export interface BattleResolution {
  attackerId: string;
  defenderId: string;
  combo: ComboEvaluation;
  damage: number;
  shieldGain: number;
  defenderHp: number;
  shieldAbsorbed?: number;
  shieldBroken?: boolean;
  evaded?: boolean;
  reflected?: number;
  statusEffect?: string;
}

export interface BattleLogEntry {
  id: string;
  phase: BattlePhase;
  message: string;
  isPlayer?: boolean;
  damage?: number;
  shield?: number;
  valid?: boolean;
  timestamp: number;
}

export interface BattleState {
  phase: BattlePhase;
  winner: string | null;
  player: Creature;
  enemy: Creature;
  log: BattleLogEntry[];
  lastPlayerResolution: BattleResolution | null;
  lastEnemyResolution: BattleResolution | null;
}

export interface ForgeToken {
  kind: 'word' | 'affix' | 'creature';
  id: string;
}

export interface ForgeResult {
  ok: boolean;
  kind: 'affixation' | 'compound' | 'creature-fusion' | null;
  result: (Word & Creature) | Word | Creature | null;
  lesson: string | null;
  reasons: string[];
}

export interface CatalogWords {
  adjectives: Word[];
  nouns: Word[];
  verbs?: Word[];
  adverbs?: Word[];
}
