# Minesweeper Modern Refactor — Design

## Architecture

Three Docker containers behind `compose.yaml`:

```
                    ┌──────────────────┐
          :80       │   nginx          │
     ───────────────▶  reverse proxy   │
                    └───┬──────────┬───┘
                        │          │
              /         │          │  /api/
                        ▼          ▼
        ┌───────────────┐   ┌──────────────┐
        │ frontend :5173│   │  api :80     │
        │ Node 20 Vite  │   │ PHP 8.3      │
        │ React SPA     │   │ Apache       │
        └───────────────┘   └──────────────┘
```

- **nginx** on port 80 — reverse proxy, no CORS needed
  - `/` → frontend (Vite dev server on 5173)
  - `/api/` → PHP backend
- **api** — stateless PHP 8.3 Apache, no redis/mysql/sqlite
- **frontend** — React + Vite dev server

## API

Single endpoint:

**POST /api/new-game**

Request:
```json
{
  "rows": 9,
  "cols": 9,
  "mines": 10,
  "firstClick": {"row": 3, "col": 4}
}
```

Response:
```json
{
  "board": [
    [0, 1, -1, 1, 0, ...],
    [0, 1,  1, 1, 0, ...],
    ...
  ]
}
```

Values: `-1` = mine, `0-8` = adjacent mine count.

## Backend (PHP 8.3)

### Files
- `api/Dockerfile` — php:8.3-apache, mod_rewrite, document root
- `api/index.php` — entry point, reads JSON body, validates, returns JSON
- `api/src/Board.php` — board state: grid dimensions, validation
- `api/src/Game.php` — mine placement algorithm

### Mine Placement Algorithm
1. Create empty `rows × cols` grid of zeros
2. Place mines randomly, excluding firstClick cell and its 8 neighbors
3. For each mine, increment all valid adjacent non-mine cells by 1
4. Return grid

## Frontend (React + Vite)

### State Model (`useGameState.js`)
- `board: number[][] | null` — hidden mine map from server
- `revealed: boolean[][]` — player-visible cells
- `flagged: boolean[][]` — right-click flags
- `gameStatus: 'idle' | 'playing' | 'won' | 'lost'`
- `timer: number` — seconds since first click
- `difficulty: {rows, cols, mines}` — presets: easy(9×9,10), medium(16×16,40), hard(16×30,99)

### Click Logic (all client-side after board generation)
- First left-click → POST `/api/new-game` → store board, start timer, reveal cell
- Left-click unrevealed: mine → lose; number → reveal; 0 → BFS flood fill
- Right-click → toggle flag on unrevealed cell
- Win: `totalCells - mines === revealedCount`

### Components
- `App.jsx` — layout shell
- `GameControls.jsx` — difficulty selector, reset, timer, mine counter
- `Board.jsx` — grid, click delegation
- `Cell.jsx` — visual states: hidden, revealed-number, revealed-empty, flagged, mine

### Styling
- Tailwind CSS for layout
- Framer Motion for reveal animations and win/lose effects
- Lucide React for icons (flag, bomb, timer)

### Dockerfile
- Node 20 alpine, npm install, npm run dev, expose 5173

## Difficulty Presets

| Level  | Rows | Cols | Mines |
|--------|------|------|-------|
| Easy   | 9    | 9    | 10    |
| Medium | 16   | 16   | 40    |
| Hard   | 16   | 30   | 99    |

## Game Rules
- First click never hits a mine (safe zone = clicked cell + 8 neighbors)
- Numbers 1-8 = adjacent mine count
- Empty cell (0) = flood fill reveal all connected empties + their numbered borders
- Right click = place/remove flag
- Win = all non-mine cells revealed
- Lose = mine clicked → show all mines
