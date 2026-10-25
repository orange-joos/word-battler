# Word Battler (React + TypeScript)

An educational vocabulary pet battler rewritten in modern React, TypeScript, and Tailwind CSS. Combat outcomes, synergies, and abilities are driven by real English morphology, vocabulary definitions, and grammar rules.

## Core Linguistic Architecture

- **Layer 1 — Word Knowledge:** Vocabulary words categorized by grammatical class (Adjectives, Nouns) and elemental alignment (Fire 🔥, Ice ❄️). Words include full definitions and contextual examples.
- **Layer 2 — Word Relationships (The Word Forge):**
  - **Affixation:** Attach prefixes (`un-`) and suffixes (`-less`, `-ness`, `-like`, `-ling`) according to English morphology, including element inversion when meanings reverse.
  - **Compounding:** Combine words into compounds (e.g. `flame-shard`), with the right-hand word functioning as the head.
  - **Creature Fusion:** Infuse vocabulary into creature tokens to forge hybrid pets (e.g. `Blizzardfox`) with dual-element capabilities and stat bonuses.
- **Layer 3 — Sentence Construction (Turn Combat):** Construct valid Adjective + Noun combos against rivals with element synergy bonuses, morphology damage boosts, and interactive audio pronunciation.

## Features

- **Dynamic Turn Combat:** Live damage and element calculation preview, health bars, combat phase tracking, and turn history logs.
- **Interactive Word Forge:** Dual-slot workbench with live linguistic rule feedback, element shift previews, and direct roster commitment.
- **Web Audio & Speech Juice:** Speech synthesis reads words and phrases aloud, complemented by synthesized sound effects and fanfares.
- **Persistent State:** Saves forged words and hybrid creatures across sessions.

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Audio:** Web Audio API + Web Speech API
