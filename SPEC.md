# Brisca — Technical Specification

A single-page web implementation of the Spanish card game "Brisca" using Svelte 5.

## Overview

Brisca is a traditional Spanish trick-taking card game. This implementation is a fully client-side web application with no backend — all game state persists in `localStorage`. The game supports 2-4 players with optional AI opponents.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Svelte 5 (SvelteKit with static adapter) |
| Styling | LESS (utility-class approach) |
| Build | Vite 7 |
| Testing | Japa (unit), Playwright (e2e) |
| Deployment | Static bundle (SPA with hash routing) |

## Project Structure

```
brisca/
├── src/
│   ├── components/
│   │   ├── App.svelte       # Main game logic + UI orchestration
│   │   ├── Card.svelte      # Card rendering (deck/button/display modes)
│   │   ├── Dialog.svelte    # Modal overlay system
│   │   └── SvgIcon.svelte   # Inline SVG icon wrapper
│   ├── lib/
│   │   ├── shared/
│   │   │   ├── helpers.js       # Pure game logic functions
│   │   │   └── helpers.test.js  # Unit tests for game rules
│   │   ├── sprites/             # SVG icon files
│   │   └── assets/              # Static assets (favicon)
│   └── routes/
│       ├── +layout.svelte   # Global styles, favicon
│       └── +page.svelte     # Entry point (renders <App />)
├── static/
│   └── images/              # Card art PNGs (1-12.png, bkg.png)
├── svelte.config.js         # SvelteKit config (static adapter, hash routing)
└── vite.config.js           # Vite + SVG sprite plugin
```

## Game Rules

### Deck Composition

- **40 cards total**: 4 suits × 10 cards each
- **Suits**: OROS (coins), COPAS (cups), BASTOS (clubs), ESPADAS (swords)
- **Cards per suit**: 1, 2, 3, 4, 5, 6, 7, 10, 11, 12
- **3-player mode**: All 2s removed (36 cards total)

### Card Values (Points)

| Number | Points |
|--------|--------|
| 1 (As) | 11 |
| 3      | 10 |
| 10 (Sota) | 2 |
| 11 (Caballo) | 3 |
| 12 (Rey) | 4 |
| 2, 4, 5, 6, 7 | 0 |

### Gameplay Flow

1. **Setup**: Shuffle deck 10×, deal 3 cards per player
2. **Triumph**: Draw one card after dealing — this suit beats all others
3. **Play**: Players take turns playing one card each
4. **Trick Winner**: 
   - Same suit: highest value wins (1 > 3 > 12 > 11 > 10 > 7 > 6 > 5 > 4 > 2)
   - Triumph suit beats all non-triumph cards
   - Winner collects all played cards, leads next trick
5. **Drawing**: After each trick, winner draws first, others follow in order
6. **End**: When deck empty and all cards played, highest score wins

### Last-Round Rules

When the deck is empty and it's not the trick winner's turn:
- Must follow the opening suit if possible
- Must play triumph if can't follow suit and have triumph cards
- Only play other suits if no legal moves

## Game State Schema

```typescript
interface Card {
  kind: 'OROS' | 'COPAS' | 'BASTOS' | 'ESPADAS';
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;
}

interface PlayerState {
  hand: Card[];      // Cards in hand
  set: Card[];       // Cards played this trick (max 1)
  stack: Card[];     // Won cards
  played?: boolean;  // Has played this trick
}

interface Game {
  status: 'pending' | 'started' | 'finished';
  players: string[];           // ['p1', 'p2', ...]
  ordered: string[];           // Rotation order (winner leads)
  turn: string;                // Current player
  winner: string;              // Last trick winner
  triumph: Card;               // Trump suit card
  deck: Card[];                // Draw pile
  total: number;               // Initial deck size
  length: '2' | '3' | '4';     // Player count
  bots: string[];              // Bot player IDs
  start?: number;              // Game start timestamp
  history?: object[];          // State snapshots for replay
  cursor?: number;            // Current replay position
  p1: PlayerState;
  p2: PlayerState;
  p3?: PlayerState;
  p4?: PlayerState;
}
```

## Core Functions (`helpers.js`)

### Deck Operations

| Function | Purpose |
|----------|---------|
| `getBriscaDeck()` | Creates 40-card deck |
| `shuffle(array)` | Fisher-Yates shuffle |
| `random(cards, times)` | Shuffle N times (default 10) |
| `takeNth(array, n, filter)` | Draw N random cards |
| `rotateAt(array, head)` | Rotate array to start at head |

### Game Logic

| Function | Purpose |
|----------|---------|
| `getCardPoints(card)` | Returns point value (0-11) |
| `compareBriscaCards(a, b, triumph)` | Compare two cards (-1, 0, 1) |
| `getTrickCards(game)` | Extract played cards from state |
| `getTrickWinner(game, cards)` | Determine trick winner |
| `isInvalidBrisca(hand, card, played, triumph)` | Check last-round rules |
| `getLegalCards(game, player)` | Get playable cards |

### Bot AI

| Function | Purpose |
|----------|---------|
| `getBotStance(game, player)` | Returns 'evasive' | 'balanced' | 'aggressive' |
| `chooseBotCard(game, player)` | Select best card to play |

#### Bot Stance Logic

- **Evasive**: Score < 10, not enough points to win → avoid losing high cards
- **Balanced**: Could reach 10+ with current hand → play strategically
- **Aggressive**: Score ≥ 10 or deck empty → maximize point collection

#### Card Scoring

Bot evaluates cards using weighted factors:
- Point value (higher = more valuable to keep)
- Trump status (trump = valuable, penalty to waste)
- Card rank (1 > 3 > 12 > 11 > 10 > others)
- Trick points available (bonus for winning)
- Opponent scores (feed points to low scorers)

## UI Components

### Card.svelte

Three rendering modes via `type` prop:

| Mode | Element | Use Case |
|------|---------|----------|
| `"deck"` | `<span>` | Draw pile with count badge |
| `"button"` | `<button>` | Clickable card in hand |
| default | `<span>` | Display card on table |

**Styling**: Uses `data-cardset="KIND:NUMBER"` attribute for CSS selectors:
- Border/text colors by suit
- Background image by number

### Dialog.svelte

Modal overlay with variants:

| Variant | Props | Behavior |
|---------|-------|----------|
| Message | `icon`, `message`, `action` | Single action button |
| Confirm | `confirm`, `cancel`, `continue` | Cancel/Continue buttons |
| Custom | `children` | Render slot content |

### SvgIcon.svelte

Inline SVG wrapper using SVG sprite system. Icons: `at`, `enter`, `gear`, `nobell`, `repeat`, `star`, `warn`, `robot`.

## Interaction Model

### Keyboard Navigation

| Key | Action |
|-----|--------|
| ← → | Navigate cards in picker |
| Tab / Shift+Tab | Cycle through cards |
| Enter | Confirm selection / action |
| Escape | Cancel dialog |

### Turn Flow

1. Click player button → opens card picker dialog
2. Select card → `playCard()` called
3. All players played → `checkPlay()` determines winner
4. Winner dialog → next round starts

### Auto-Play Features

- **Auto OK**: Checkbox to auto-accept dialogs
- **Bot delay**: 350ms delay before bot plays
- **Auto draw**: Auto-open card picker when it's human's turn

## Styling System

### Utility Classes

```css
.flex        /* display: flex */
.v-flex      /* flex-direction: column */
.space       /* gap: 5px */
.center      /* align-items: center */
.justify     /* justify-content: center */
.wrapped     /* flex-wrap: wrap */
.dimmed      /* opacity: 0.5 */
.reset       /* margin: 0; padding: 0 */
```

### Card Dimensions

- Width: 73px
- Height: 108.5px
- Ratio: Standard playing card (2.5" × 3.5")

### Suit Colors

| Suit | Color Code |
|------|------------|
| OROS | #F1CC28 (gold) |
| COPAS | #EF4C28 (red) |
| BASTOS | #99B938 (green) |
| ESPADAS | #6BB6E3 (blue) |

### Responsive Breakpoints

| Min Width | Layout Change |
|-----------|---------------|
| 480px | 2-column grid |
| 720px | 3-column grid |
| 960px | Wider player cards |

## State Persistence

- **Storage**: `localStorage.$game`
- **Auto-save**: After every state change via `syncGame()`
- **Recovery**: On load, unfinished games restore to 'pending'
- **History**: State snapshots for replay scrubbing

## Known Issues

1. `App.svelte` partially migrated to Svelte 5 — still uses `$:` reactive statements
2. `VERSION` hardcoded as `'HEAD'`
3. `SvgIcon` uses deprecated `xlink:href` attribute
4. `cancelGame()` references `pending.resolved` but `setDialog()` may return `undefined`

## Build & Deploy

```bash
npm run dev      # Development server
npm run build    # Production build (static)
npm run test     # Run unit tests
npm run lint     # ESLint
```

Output: Single `index.html` with inlined assets, hash-based routing for SPA deployment.
