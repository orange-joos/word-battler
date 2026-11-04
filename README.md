# Word Battler (React + TypeScript)

An educational vocabulary pet battler rewritten in modern React, TypeScript, and Tailwind CSS. Combat outcomes, synergies, and abilities are driven by real English morphology, vocabulary definitions, and grammar rules.

## Core Linguistic Architecture

- **Layer 1 — Word Knowledge:** Vocabulary cards are verbs, nouns, adjectives, or adverbs aligned to Fire, Water, Ice, Grass, Electric, Shadow, Light, or Earth. Elements give a balanced 5% affinity boost: Fire/Shadow to attack, Water/Earth to defense, Ice/Electric to speed, and Grass/Light to HP. Elements have no hard-counter chart.
- **Layer 2 — Word Relationships (The Word Forge):**
  - **Affixation:** Attach prefixes (`un-`) and suffixes (`-less`, `-ness`, `-like`, `-ling`) according to English morphology, including element inversion when meanings reverse.
  - **Compounding:** Combine words into compounds (e.g. `flame-shard`), with the right-hand word functioning as the head.
  - **Creature Fusion:** Infuse vocabulary into creature tokens to forge hybrid pets (e.g. `Blizzardfox`) with dual-element capabilities and stat bonuses.
- **Layer 3 — Word-Driven Combat:** Word cards choose their own action: verbs attack, nouns defend, adjectives buff or debuff, and adverbs modify verbs. Build adjective + noun defenses or adverb + verb strikes for extra effects; invalid pairings explain how to fix the syntax.

## Features

- **Dynamic Turn Combat:** Live word-combo previews, structured damage/shield/status events, element-colored auras, health bars, and turn history logs.
- **Interactive Word Forge:** Dual-slot workbench with live linguistic rule feedback, element shift previews, and direct roster commitment.
- **Web Audio & Speech Juice:** Speech synthesis reads words and phrases aloud, complemented by synthesized sound effects and fanfares.
- **Persistent State:** Saves forged words and hybrid creatures across sessions.

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Audio:** Web Audio API + Web Speech API
