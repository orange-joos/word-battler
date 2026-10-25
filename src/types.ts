export type ElementType = 'fire' | 'ice' | string;

export type PartOfSpeech = 'adjective' | 'noun' | 'verb' | 'adverb';

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
  description: string;
  stats: CreatureStats;
  currentHp?: number;
  maxHp?: number;
  shield?: number;
  allowedWordTypes: PartOfSpeech[];
  allowedElements: ElementType[];
  forged?: CreatureForgeMetadata;
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
  phrase: string;
  adjective: Word;
  noun: Word;
  power: number;
  reasons: string[];
}

export interface CombatEvent {
  type:
    | 'speak'
    | 'damage'
    | 'shield'
    | 'shield_hit'
    | 'shield_break'
    | 'fizzle'
    | 'victory'
    | 'defeat';
  attackerId?: string;
  targetId?: string;
  amount?: number;
  targetHp?: number;
  phrase?: string;
  reason?: string;
  winnerId?: string;
  absorbed?: number;
  text?: string;
}

export interface BattleResolution {
  attackerId: string;
  defenderId: string;
  combo: ComboEvaluation;
  damage: number;
  defenderHp: number;
}

export interface BattleLogEntry {
  id: string;
  phase: BattlePhase;
  message: string;
  isPlayer?: boolean;
  damage?: number;
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
