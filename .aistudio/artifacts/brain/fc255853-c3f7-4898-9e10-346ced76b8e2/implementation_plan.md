# Word Battler: 4x4 Action Matrix Combat System

A major linguistic combat evolution for elementary school students (Grades 3–5) that expands turn-based battle into a full **4x4 Action Matrix**. Students can choose between four strategic move categories (**Attack**, **Defend**, **Buff**, **Debuff**), each executable with any of the four parts of speech (**Verb**, **Noun**, **Adjective**, **Adverb**) as either single-word maneuvers or 2-word grammatical combos.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design decisions were confirmed during Phase 1 clarification:
> - **Move Construction Format**: Supports both **1-word actions** (e.g. *ignite* for Direct Strike) and **2-word combos** (e.g. *fiercely ignite* combining Momentum + Direct Strike).
> - **Category Selector UI**: Four accessible category tabs above the sentence builder:
>   - ⚔️ **Attack** (Offensive strikes, armor piercing, critical hits)
>   - 🛡️ **Defend** (Fortified shields, damage reduction, evasion, counter-stances)
>   - ✨ **Buff** (Stat increases, health regeneration, empower charges, catalyst summons)
>   - 🌀 **Debuff** (Status afflictions, turn constraints, smoke obstructions, interference)
> - **Dual Output**: Delivery of a standalone vanilla ES6 module (`js/combat.js`) with comprehensive JSDoc annotations alongside the fully integrated live web application engine (`src/engine/combat.ts`).

---

## 1. Overview & Core Concept

- **What It Does**: Transforms every word into a multi-dimensional tactical card. Rather than restricting parts of speech to rigid slots, students can select their desired combat goal (e.g., Attack vs. Defend vs. Buff vs. Debuff) and leverage any part of speech to produce distinct linguistic effects.
- **Pedagogical Value**: Teaches students how word classes function dynamically:
  - **Verbs** convey direct action, counter-reactions, and empowerments.
  - **Nouns** manifest tangible physical objects, barriers, obstructions, and catalysts.
  - **Adjectives** define intrinsic elemental qualities, barrier strength, and stat conditions.
  - **Adverbs** dictate pacing, momentum, evasion, and interference.
- **Elementary Scaffolding**: If an ungrammatical combination is attempted, constructive encouraging feedback explains the grammatical rule and suggests a better combination.

---

## 2. The 4x4 Action Matrix Specifications

| Category | Verb (Action) | Noun (Thing / Object) | Adjective (Description) | Adverb (How / Pacing) |
| :--- | :--- | :--- | :--- | :--- |
| **1. ATTACK** | **Direct Strike**: Heavy base damage (`+8` damage). | **Object Impact**: Medium damage + Armor Piercing (ignores 50% enemy shield). | **Descriptive Assault**: Elemental synergy (+6 matching bonus) + elemental burn/frost DOT. | **Momentum Strike**: Critical hit chance (35% chance of 1.75x crit damage). |
| **2. DEFEND** | **Counter-Stance**: Minor shield + reflects 40% of enemy attack damage. | **Fortification**: High flat shield gain (`12 + defense`). | **Barrier Quality**: Adds damage reduction barrier (30% incoming damage mitigated). | **Evasive Maneuver**: 40% chance to completely evade the next enemy strike. |
| **3. BUFF** | **Empower Action**: Powers up pet's next offensive turn by +50%. | **Catalyst Summon**: Temporary elemental weapon infusion (+5 bonus). | **Attribute Boost**: +4 Attack or +4 Defense for 3 turns. | **Temporal Boost**: Multi-turn health regeneration (+6 HP/turn for 3 turns). |
| **4. DEBUFF** | **Constraint**: Restrains enemy motion, delaying or skipping opponent turn. | **Obstruction**: Conjures a smoke screen or barrier, blocking enemy next move slot. | **Condition Affliction**: Afflicts Frostbite/Burn (-3 DEF and 5 DOT for 3 turns). | **Interference**: Lowers enemy speed (-4) and reduces accuracy by 30%. |

### 2-Word Combinations (Modifier + Head)
When students combine two words (e.g. *Adverb + Verb* in Attack, or *Adjective + Noun* in Defend):
- The **Head Word** sets the primary category effect.
- The **Modifier Word** layers on its unique tactical trait (e.g., *fiercely [Adverb: Crit]* + *ignite [Verb: Direct Strike]* = a Direct Strike with critical strike chance).

---

## 3. User Experience & Visual Design

### Key User Flows

1. **Category Selection**:
   - Student taps one of the 4 category tabs: `Attack`, `Defend`, `Buff`, `Debuff`.
   - The arena accent and slot prompt adapt instantly to highlight the tactical goal.
2. **Word Slotting & Inspector**:
   - The word pool displays all 4 parts of speech with category recommendation tags.
   - Tapping any word card updates the Word Inspector Banner with its definition, audio speech pronunciation, and how it behaves in the active category!
   - Tapping an empty slot or word card populates Slot 1 or Slot 2.
3. **Turn Execution & Event Animation**:
   - Tapping the execution button emits structured events (`DAMAGE`, `SHIELD`, `BUFF`, `DEBUFF`, `EVADE`, `SPEAK`, `REFLECT`).
   - The UI displays colorful status badges (e.g. `Regen`, `Reflect`, `Shield`, `Empowered`, `Burn`).
   - Web Audio synth triggers unique acoustic cues (swords clash, shield resonant tone, buff chime, debuff hex chord, evasion whoosh).

---

## 4. Technical Architecture & File Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│                              App.tsx                                   │
│            ┌─────────────────────────┴────────────────────────┐        │
│            ▼                                                  ▼        │
│    BattleView.tsx                                    WordForgeView.tsx │
│    ├── CategoryTabs (Attack, Defend, Buff, Debuff)   └── Dual Slots    │
│    ├── StatusEffectsHUD (Regen, Shields, Buffs)                        │
│    ├── WordInspectorBanner (Definition + 4x4 Role)                     │
│    └── SentenceBuilderBar (1-Word / 2-Word Actions)                    │
└────────────────────────────────────┬───────────────────────────────────┘
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Engine & Shared Schemas                         │
│  - js/combat.js (Clean standalone ES6 module with JSDoc for schools)  │
│  - src/engine/combat.ts (TypeScript engine powering the React web app) │
│  - src/engine/juice.ts (Web Audio synth & Web Speech TTS)              │
└────────────────────────────────────────────────────────────────────────┘
```

### Structured Event Schema

```javascript
/**
 * @typedef {Object} CombatEvent
 * @property {'SPEAK'|'DAMAGE'|'SHIELD'|'BUFF'|'DEBUFF'|'EVADE'|'REFLECT'|'FIZZLE'|'VICTORY'|'DEFEAT'} type
 * @property {string} [attackerId]
 * @property {string} [targetId]
 * @property {number} [amount]
 * @property {string} [stat]
 * @property {number} [duration]
 * @property {string} [effect]
 * @property {string} [phrase]
 * @property {string} [reason]
 */
```

---

## 5. Execution Steps

1. **Standalone ES6 Module (`js/combat.js`)**:
   - Write clean, standalone vanilla JavaScript with full JSDoc typing.
   - Implement the 4x4 Action Matrix matrix evaluator `resolveActionMatrix(attacker, defender, category, word1, word2, catalog)`.
   - Implement `createBattle` factory and event emitter.
2. **React Engine Integration (`src/engine/combat.ts` & `src/types.ts`)**:
   - Update TypeScript domain types with Status Effects (`buffs`, `debuffs`, `regeneration`, `evasion`, `reflect`, `empower`).
   - Wire the 4x4 Matrix into the battle simulation engine.
3. **Battle Arena UI Upgrade (`src/components/BattleView.tsx`)**:
   - Implement the 4 category tabs (`Attack`, `Defend`, `Buff`, `Debuff`).
   - Support flexible 1-word or 2-word slotting with category hints.
   - Display active status effect badges on pet cards.
   - Update Word Inspector to explain each word's specific 4x4 function.
4. **Audio Updates (`src/engine/juice.ts`)**:
   - Add sound effects for evasion, buffs, debuffs, and shield reflections.
5. **Framer Motion Combat Animations (`src/components/BattleView.tsx` & `src/components/FloatingCombatOverlay.tsx`)**:
   - Installed `framer-motion` package.
   - Built `<FloatingCombatOverlay popups={popups} />` rendering kinetic floating combat text types:
     - 💥 Damage (`-X` in vibrant rose) & Critical Hits (`💥 CRIT! -X` in gold serif)
     - 🛡️ Shield gains (`+X SHIELD` in amethyst)
     - 🌿 Healing ticks (`+X HP` in emerald)
     - ⚡ Buff triggers (`⚡ EMPOWERED`, `⚔️ +4 ATK`, `🌿 REGEN`)
     - 🛑 Debuff afflictions (`🛑 CONSTRAINED`, `🌀 -4 SPEED / ACC`, `❄️ AFFLICTED`)
     - 💨 Evasion alerts (`💨 EVASION READY`, `💨 DODGED!`)
   - Upgraded Fighter Arena cards to `<motion.article>` with responsive impact shakes (`animate={{ x: [-10, 10, -8, 8, -4, 4, 0] }}`) and shield fortification pulses (`scale: [1, 1.04, 1]` with vibrant purple glow).
   - Upgraded combat execution button to `<motion.button>` with tactile hover/press physics.
6. **Verification**:
   - Ran `lint_applet` and `compile_applet` (100% pass).
   - Validated zero runtime errors across Chrome dev server.
