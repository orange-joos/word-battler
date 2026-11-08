# Word World Adventure Mode — 9 Elemental Winding Node Maps & Spell-Free Word Tablet Overhaul

This upgrade transforms **Word World (Adventure Mode)** into an interactive, two-tier adventure experience with **9 Elemental Winding S-Curve Node Maps (90 Nodes Total)**, replaces all shrines with **Fossil Excavation Dig Sites for buried Word Tablets**, and **removes the concept of "spells" / "spellbooks" across the entire game** in favor of **Word Tablets, Lexicon Field Guides, and Word Strikes**.

## User Review & Critical Decisions

> [!IMPORTANT]
> Your feedback has been incorporated across the entire plan:
> 1. **Stage `X-4` is now a Fossil Excavation Dig Site**: Players excavate buried **Word Tablets** (inspired by *Fossil Fighters*) to unearth new K–8 vocabulary cards.
> 2. **Complete Removal of "Spells" Across the Game**: All references to "Spells", "Spellbook", "Spell Cast", "Shrines", or "Magic/Wizardry" in the Battle Arena, Overworld Map, Loadout, and Word Forge will be replaced with **Word Tablets**, **Lexicon Deck / Field Guide**, **Word Strikes / Word Combos**, and **Explorer / Tamer** terminology.

- **Confirmed Decision 1 — 10 Winding Nodes Per Zone (90 Total Stage Nodes)**: Each of the 9 Elemental Areas (`Grass`, `Water`, `Earth`, `Fire`, `Ice`, `Air`, `Electric`, `Shadow`, `Light`) features its own scrollable winding S-curve map with 10 sequential nodes (`X-1` to `X-10`).
- **Confirmed Decision 2 — Secular, Explorer-Focused Encounter & Reward Types**:
  - **Nodes `X-1`, `X-3`, `X-7` (Vanguard Combat Encounters)**: Fast-paced elemental creature battles with `★★★` star ratings based on HP remaining and Word Combo mastery.
  - **Nodes `X-2`, `X-6` (Quick Grammar & Morphology Mini-Quizzes)**: Interactive in-map 3-question K–8 vocabulary & affix challenges that award `★★★` stars, Lexi-Coins, and Fusion Gems on the spot—or let players launch a bonus skirmish.
  - **Node `X-4` (Fossil Excavation Dig Site)**: Players use excavation tools (Hammer & Brush) to uncover a buried **Word Tablet** matching the zone's elemental affinity and K–8 grade band, complete with audio pronunciation and instant loadout equipping.
  - **Node `X-5` (Zone Mid-Boss Gatekeeper)**: A fortified mid-zone boss battle atop a carved stone ammonite/fossil threshold (`Ref #1` spiral stone platform) that guards the upper half of the map.
  - **Node `X-8` (Elemental Treasure Chest Stop)**: Interactive supply cache node granting Lexi-Coins, Fusion Gems, and companion EXP.
  - **Node `X-9` (Elite Syntax Trial — Quiz + Combat Gauntlet)**: High-reward pre-boss challenge testing the zone's signature grammar rule before the summit.
  - **Node `X-10` (Realm Guardian Boss Finale)**: Full-scale boss battle against the realm's Guardian Boss (`Galecrest Wyvern`, `Tidal Leviathan`, `Ruptor`, `Pyrostorm Chimera`, `Dis-Hornet`, `Tempest Griffin`, `Volt-Rune Dynamo`, `Umbra Monarch`, or `The Syntax Sovereign`).
- **Confirmed Decision 3 — Game-Wide Removal of "Spells" Terminology**:
  - **Battle View (`BattleView.tsx`)**: Rename the bottom dock from `"Spellbook"` / `"Spell Inspector"` to **"Lexicon Field Guide"** and **"Word Tablet Inspector"**; change `"Cast Spell"` / `"Spell Power"` to **"Launch Word Strike"** / **"Tablet Power"**; replace the `"2x2 Syntax Rune Matrix"` header with **"2x2 Word Tablet Matrix"**.
  - **Overworld & Modals (`OverworldMap.tsx`, `LoadoutView.tsx`, `CraftingView.tsx`)**: Replace any remaining `"spell"`, `"shrine"`, or `"arcane"` copy with **"Word Tablet"**, **"Fossil Dig Site"**, **"Lexicon"**, and **"Elemental Energy"**.

---

## 1. Overview & Core Concept

- **What It Does**: Clicking the **Word World Gate** on the Overworld Sanctuary opens the **9 Elemental Realms Selector** alongside the active realm's **Winding S-Curve Adventure Node Map**. Players travel step-by-step from the bottom starting circle (`X-1`) up the winding stone-and-turf trail to the summit boss (`X-10`), excavating buried **Word Tablets** at Dig Sites (`X-4`), solving grammar trials, and earning up to **30 Stars (`30 ★`) per realm** (**270 Stars total** across all 9 Elemental Areas).
- **Target Audience / Persona**: Kindergarten through 8th-grade monster tamers and fossil explorers who love tactile map progression and hands-on discovery without any magic/spell themes.
- **Key Value**: Turns vocabulary and grammar practice into a secular, expedition-themed monster-tamer journey with clear visual milestones (`1-1` through `9-10`), varied pacing (battles, quizzes, fossil dig sites, treasure chests, mid-bosses), and persistent star mastery.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Entering the Word World Gate**:
   - Clicking **1. Word World Gate** on the Sanctuary Map (or the bottom navigation dock) opens the **Word World Expedition Atlas**.
   - A top ribbon switcher lets players switch among the **9 Elemental Realms** (`1. Grass`, `2. Water`, `3. Earth`, `4. Fire`, `5. Ice`, `6. Air`, `7. Electric`, `8. Shadow`, `9. Light`), displaying each realm's total stars (`e.g., 18 / 30 ★`) and recommended K–8 Grade Band.
2. **Exploring the Winding Elemental Node Map**:
   - The map renders a **rich vertical winding S-curve path** modeled on your two reference images:
     - **Reference #1 Visual DNA**: Segmented stone path tiles winding past spiral ammonite fossil thresholds, wooden excavation fences, bridges, ponds, crystal outcrops, giant pumpkins/mushrooms, dinosaur rib fossils, and explorer field stations.
     - **Reference #2 Visual DNA**: Glossy, bevelled circular stage buttons (amber-gold, ruby-red, sapphire-blue, or emerald-green with a 4-point star emblem in the center) crowned with **3 floating golden stars (`☆☆☆` / `★★★`)** above every single node!
   - **Live Tamer & Companion Avatar Token**: Your customized Explorer Tamer and Active Companion sprite stand directly beside your current highest unlocked node (`e.g., Node 1-4`), bouncing gently with a `"NEXT!"` callout badge.
3. **Interacting with a Node (`X-1` to `X-10`)**:
   - Clicking any unlocked node opens the **Stage Briefing & Encounter Card**:
     - **Combat / Mid-Boss / Boss Finale Nodes (`X-1`, `X-3`, `X-5`, `X-7`, `X-10`)**: Shows the stage code (`e.g., Stage 1-5 · Mid-Boss`), enemy preview, recommended grammar combo, star objectives (`★ Clear Stage`, `★★ Win with >50% HP`, `★★★ Weave a 2+ Word Combo`), and a **Launch Battle** button.
     - **Grammar Mini-Quiz Nodes (`X-2`, `X-6`, `X-9`)**: Launches an interactive 3-question **Elemental Syntax Trial** right inside the map modal (testing prefixes, suffixes, parts of speech, or definitions for that zone's K–8 grade tier) to earn up to `★★★` stars and instant coins/gems.
     - **Fossil Excavation Dig Site (`X-4`)**: Opens an interactive **Word Tablet Excavation** where players tap to brush away rock layers and unearth a buried K–8 **Word Tablet**, play its pronunciation, and add it to their Lexicon Deck (`★★★`).
     - **Treasure Chest Supply Stop (`X-8`)**: Opens an expedition supply chest granting Lexi-Coins, Fusion Gems, and companion EXP (`★★★`).

### Visual Identity & Theme (Per Elemental Biome)
Each of the 9 Elemental Areas dynamically re-themes the winding S-curve canvas, stepping stones, node buttons, and environmental scenery:
- **Area 1 — Grass (`1-1` to `1-10`)**: Lush lime-green meadow (`#65d654`), warm sandy dirt trail (`#eab676`), blooming trees, spotted toadstools, and amber-gold node buttons (`Ref #2` left panel).
- **Area 2 — Water (`2-1` to `2-10`)**: Turquoise lagoon shallows (`#38bdf8`), coral-stone stepping tiles, tidepools, seashells, and sapphire-blue node buttons.
- **Area 3 — Earth (`3-1` to `3-10`)**: Autumnal harvest canyon (`#f59e0b`, `Ref #1` middle section), cobbled brown flagstones, dinosaur fossil ribs, excavation trenches, wooden fences, and terracotta node buttons.
- **Area 4 — Fire (`4-1` to `4-10`)**: Obsidian caldera turf (`#44403c`), glowing magma-veined path stones, lava geysers, and ruby-red node buttons.
- **Area 5 — Ice (`5-1` to `5-10`)**: Sparkling snowfield (`#e0f2fe`), icy blue crystal road (`#7dd3fc`), frosted pine trees, ice boulders, and crimson-orange high-contrast node buttons (`Ref #2` right panel).
- **Area 6 — Air (`6-1` to `6-10`)**: Cloud-top sky meadow (`#99f6e4`), floating marble stepping stones, wind turbines/whirlwinds, and teal-gold node buttons.
- **Area 7 — Electric (`7-1` to `7-10`)**: Storm-indigo plateau (`#312e81`), charged golden circuit tiles, lightning rods, and neon-amber node buttons.
- **Area 8 — Shadow (`8-1` to `8-10`)**: Twilight violet forest (`#581c87`, `Ref #1` top section), dark slate stepping stones, glowing cyan ponds, bioluminescent mushrooms, crystal outcrops, and amethyst node buttons.
- **Area 9 — Light (`9-1` to `9-10`)**: Solar prism plateau (`#fef08a`), radiant alabaster flagstones, sun-dial monoliths, and royal-gold node buttons.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Fossil Excavation Dig Sites & Word Tablets Instead of Spells/Shrines**:
  - *Chosen Approach*: Frame all vocabulary cards as ancient **Word Tablets** unearthed at **Fossil Excavation Dig Sites** (`Stage X-4`) and equipped into the player's **Lexicon Field Guide**. In battle, combining Word Tablets powers **Elemental Word Strikes** rather than spells.
  - *Why*: Aligns with your *Fossil Fighters* aesthetic inspiration while completely eliminating magic/spell/shrine concepts from the game.
- **Decision 2 — Persistent Per-Node Star & Completion Tracking (`nodeProgress`)**:
  - *Chosen Approach*: Store per-node progress (`cleared`, `stars: 0..3`, `rewardClaimed`) keyed by node ID (`area-grass:1-1` through `area-light:9-10`) in `GameContext` and `localStorage`, while automatically syncing overall zone stars (`0..30 ★`) and zone completion back to the Overworld HUD.
  - *Why*: Ensures players never lose their node-by-node progress or earned stars across sessions, and completing combat nodes in `BattleView` automatically unlocks the next node (`X-(N+1)`) on the map.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram
```
┌───────────────────────────────────────────────────────────────────────────┐
│                        GameContext (State & Persistence)                  │
│  • activeZoneId ('area-grass' .. 'area-light')                            │
│  • activeNodeId ('1-1' .. '9-10')                                         │
│  • nodeProgress: Record<string, { cleared: boolean; stars: number }>      │
│  • startBattleAtNode(zoneId, nodeId) / completeMapNode(zoneId, nodeId, ★) │
└───────────────────┬───────────────────────────────────────┬───────────────┘
                    │                                       │
                    ▼                                       ▼
┌───────────────────────────────────────────┐ ┌─────────────────────────────┐
│     OverworldMap -> Word World Gate       │ │    BattleView (Spell-Free)  │
│  ┌─────────────────────────────────────┐  │ │ • Displays active Stage ID  │
│  │ 9-Realm Top Ribbon Switcher         │  │ │   badge (e.g. "Stage 1-5")  │
│  ├─────────────────────────────────────┤  │ │ • Bottom dock: "Lexicon     │
│  │ ElementalNodeMap (S-Curve Canvas)   │  │ │   Field Guide" & "Word      │
│  │  • Winding Stone/Turf Road & Props  │  │ │   Tablet Inspector"         │
│  │  • 10 Bevelled Nodes (X-1 .. X-10)  │  │ │ • Scales enemy stats for    │
│  │  • 3-Star Crowns (★★★) Above Nodes  │  │ │   Vanguard / Mid-Boss /     │
│  │  • Explorer + Pet Avatar Marker     │  │ │   Guardian Boss encounters  │
│  ├─────────────────────────────────────┤  │ │ • Awards 1–3 ★ on Victory   │
│  │ Interactive Node Drawer:            │  │ │   & unlocks Next Node!      │
│  │  • Combat / Mid-Boss / Boss Launch  │  │ └─────────────────────────────┘
│  │  • 3-Question Grammar Mini-Quiz     │  │
│  │  • Fossil Dig Site & Chest Unlocks  │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
```

### Interactive Component & State Mapping
- **Selecting an Elemental Area (`1`–`9`)**: Updates the active realm in the Word World Expedition Atlas, rendering its custom biome palette, winding road, fossil/biome props, and 10 stage nodes (`X-1` to `X-10`).
- **Clicking an Unlocked Node (`X-N`)**:
  - If **Combat / Mid-Boss / Final Boss (`1`, `3`, `5`, `7`, `10`)**: Opens the Stage Briefing bar with enemy stats and a **Start Stage `X-N` Battle** button that calls `startBattleAtNode(zoneId, nodeId)`. Upon winning in `BattleView`, `completeMapNode(zoneId, nodeId, earnedStars)` is called automatically and players can click **Next Stage on Node Map** to return directly to the winding map!
  - If **Grammar Mini-Quiz (`2`, `6`, `9`)**: Opens the interactive 3-question K–8 Vocabulary & Affix Quiz modal; answering questions awards `1–3 ★`, `+45 Lexi-Coins`, and `+1 Fusion Gem`, and unlocks node `X-(N+1)`.
  - If **Fossil Excavation Dig Site (`4`) or Treasure Chest (`8`)**: Opens the interactive Fossil Dig Site (brush & hammer excavation of a buried Word Tablet) or Supply Chest panel, awarding a new K–8 Word Tablet or coin/gem cache, marking the node `★★★`, and advancing the Explorer avatar to the next stepping stone.
