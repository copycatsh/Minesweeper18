# Minesweeper Modern Refactor — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor legacy PHP minesweeper into a modern Docker-based app with PHP 8.3 API backend, React+Vite frontend, and nginx reverse proxy.

**Architecture:** Three containers — nginx reverse proxy (port 80), PHP 8.3 Apache API (stateless board generation), React+Vite SPA (all game logic client-side). Single API endpoint POST /api/new-game returns board grid. No CORS needed thanks to nginx.

**Tech Stack:** PHP 8.3, React 18, Vite, Tailwind CSS, Framer Motion, Lucide React, Docker, nginx

---

### Task 1: Docker Infrastructure — nginx + compose.yaml

**Files:**
- Create: `nginx/nginx.conf`
- Create: `nginx/Dockerfile`
- Create: `compose.yaml`

**Step 1: Create nginx config**

```nginx
# nginx/nginx.conf
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://frontend:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /api/ {
        proxy_pass http://api:80/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Step 2: Create nginx Dockerfile**

```dockerfile
# nginx/Dockerfile
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

**Step 3: Create compose.yaml**

```yaml
services:
  nginx:
    build: ./nginx
    ports:
      - "80:80"
    depends_on:
      - api
      - frontend

  api:
    build: ./api
    expose:
      - "80"

  frontend:
    build: ./frontend
    expose:
      - "5173"
```

**Step 4: Verify files exist**

Run: `ls -la nginx/ compose.yaml`
Expected: All three files present

**Step 5: Commit**

```bash
git add nginx/ compose.yaml
git commit -m "feat: add docker infrastructure with nginx reverse proxy"
```

---

### Task 2: PHP API — Dockerfile

**Files:**
- Create: `api/Dockerfile`
- Create: `api/.htaccess`

**Step 1: Create API Dockerfile**

```dockerfile
# api/Dockerfile
FROM php:8.3-apache

RUN a2enmod rewrite headers

ENV APACHE_DOCUMENT_ROOT=/var/www/html

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!AllowOverride None!AllowOverride All!g' \
    /etc/apache2/apache2.conf

WORKDIR /var/www/html
COPY . .

EXPOSE 80
```

**Step 2: Create .htaccess for routing**

```apache
# api/.htaccess
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.php [QSA,L]
```

**Step 3: Commit**

```bash
git add api/Dockerfile api/.htaccess
git commit -m "feat: add PHP 8.3 API Dockerfile with rewrite rules"
```

---

### Task 3: PHP API — Game.php (mine placement algorithm)

**Files:**
- Create: `api/src/Game.php`

**Step 1: Create Game.php**

```php
<?php
// api/src/Game.php
declare(strict_types=1);

namespace Minesweeper;

class Game
{
    private const MINE = -1;
    private const DIRECTIONS = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
    ];

    public static function generate(int $rows, int $cols, int $mines, int $firstRow, int $firstCol): array
    {
        $board = array_fill(0, $rows, array_fill(0, $cols, 0));

        $safeZone = self::getSafeZone($firstRow, $firstCol, $rows, $cols);

        $placed = 0;
        while ($placed < $mines) {
            $r = random_int(0, $rows - 1);
            $c = random_int(0, $cols - 1);

            if ($board[$r][$c] === self::MINE || isset($safeZone["$r,$c"])) {
                continue;
            }

            $board[$r][$c] = self::MINE;
            $placed++;
        }

        for ($r = 0; $r < $rows; $r++) {
            for ($c = 0; $c < $cols; $c++) {
                if ($board[$r][$c] === self::MINE) {
                    continue;
                }
                $count = 0;
                foreach (self::DIRECTIONS as [$dr, $dc]) {
                    $nr = $r + $dr;
                    $nc = $c + $dc;
                    if ($nr >= 0 && $nr < $rows && $nc >= 0 && $nc < $cols && $board[$nr][$nc] === self::MINE) {
                        $count++;
                    }
                }
                $board[$r][$c] = $count;
            }
        }

        return $board;
    }

    private static function getSafeZone(int $row, int $col, int $rows, int $cols): array
    {
        $zone = ["$row,$col" => true];
        foreach (self::DIRECTIONS as [$dr, $dc]) {
            $nr = $row + $dr;
            $nc = $col + $dc;
            if ($nr >= 0 && $nr < $rows && $nc >= 0 && $nc < $cols) {
                $zone["$nr,$nc"] = true;
            }
        }
        return $zone;
    }
}
```

**Step 2: Commit**

```bash
git add api/src/Game.php
git commit -m "feat: add Game.php with mine placement algorithm"
```

---

### Task 4: PHP API — Board.php (validation)

**Files:**
- Create: `api/src/Board.php`

**Step 1: Create Board.php**

```php
<?php
// api/src/Board.php
declare(strict_types=1);

namespace Minesweeper;

class Board
{
    public readonly int $rows;
    public readonly int $cols;
    public readonly int $mines;
    public readonly int $firstRow;
    public readonly int $firstCol;

    private const LIMITS = [
        'rows' => ['min' => 5, 'max' => 30],
        'cols' => ['min' => 5, 'max' => 50],
    ];

    public function __construct(int $rows, int $cols, int $mines, int $firstRow, int $firstCol)
    {
        $this->validate($rows, $cols, $mines, $firstRow, $firstCol);
        $this->rows = $rows;
        $this->cols = $cols;
        $this->mines = $mines;
        $this->firstRow = $firstRow;
        $this->firstCol = $firstCol;
    }

    public function generate(): array
    {
        return Game::generate($this->rows, $this->cols, $this->mines, $this->firstRow, $this->firstCol);
    }

    private function validate(int $rows, int $cols, int $mines, int $firstRow, int $firstCol): void
    {
        if ($rows < self::LIMITS['rows']['min'] || $rows > self::LIMITS['rows']['max']) {
            throw new \InvalidArgumentException("rows must be between 5 and 30");
        }
        if ($cols < self::LIMITS['cols']['min'] || $cols > self::LIMITS['cols']['max']) {
            throw new \InvalidArgumentException("cols must be between 5 and 50");
        }
        $maxMines = ($rows * $cols) - 9;
        if ($mines < 1 || $mines > $maxMines) {
            throw new \InvalidArgumentException("mines must be between 1 and $maxMines");
        }
        if ($firstRow < 0 || $firstRow >= $rows || $firstCol < 0 || $firstCol >= $cols) {
            throw new \InvalidArgumentException("firstClick out of bounds");
        }
    }
}
```

**Step 2: Commit**

```bash
git add api/src/Board.php
git commit -m "feat: add Board.php with input validation"
```

---

### Task 5: PHP API — index.php (entry point)

**Files:**
- Create: `api/index.php`

**Step 1: Create index.php**

```php
<?php
// api/index.php
declare(strict_types=1);

require_once __DIR__ . '/src/Game.php';
require_once __DIR__ . '/src/Board.php';

use Minesweeper\Board;

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

try {
    $board = new Board(
        (int)($input['rows'] ?? 0),
        (int)($input['cols'] ?? 0),
        (int)($input['mines'] ?? 0),
        (int)($input['firstClick']['row'] ?? -1),
        (int)($input['firstClick']['col'] ?? -1),
    );

    echo json_encode(['board' => $board->generate()]);
} catch (\InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
```

**Step 2: Verify API structure**

Run: `ls -R api/`
Expected: `Dockerfile`, `.htaccess`, `index.php`, `src/Game.php`, `src/Board.php`

**Step 3: Commit**

```bash
git add api/index.php
git commit -m "feat: add API entry point with JSON routing"
```

---

### Task 6: Frontend — Vite + React scaffold

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`
- Create: `frontend/postcss.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/Dockerfile`

**Step 1: Scaffold frontend with Vite**

Run from project root:
```bash
cd frontend && npm create vite@latest . -- --template react && npm install
npm install tailwindcss @tailwindcss/vite framer-motion lucide-react
```

**Step 2: Configure vite.config.js**

```js
// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
})
```

**Step 3: Set up Tailwind in CSS**

Replace `frontend/src/index.css` with:
```css
@import "tailwindcss";
```

**Step 4: Create Dockerfile**

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
```

**Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold React + Vite frontend with Tailwind"
```

---

### Task 7: Frontend — useGameState hook

**Files:**
- Create: `frontend/src/hooks/useGameState.js`

**Step 1: Create the hook**

```jsx
// frontend/src/hooks/useGameState.js
import { useState, useCallback, useRef, useEffect } from 'react'

const DIFFICULTIES = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
}

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
]

function createGrid(rows, cols, value) {
  return Array.from({ length: rows }, () => Array(cols).fill(value))
}

function floodFill(board, revealed, startRow, startCol) {
  const rows = board.length
  const cols = board[0].length
  const newRevealed = revealed.map(r => [...r])
  const stack = [[startRow, startCol]]

  while (stack.length > 0) {
    const [r, c] = stack.pop()
    if (r < 0 || r >= rows || c < 0 || c >= cols || newRevealed[r][c]) continue
    newRevealed[r][c] = true
    if (board[r][c] === 0) {
      for (const [dr, dc] of DIRECTIONS) {
        stack.push([r + dr, c + dc])
      }
    }
  }

  return newRevealed
}

function countRevealed(revealed) {
  return revealed.reduce((sum, row) => sum + row.filter(Boolean).length, 0)
}

export function useGameState() {
  const [difficulty, setDifficulty] = useState('easy')
  const [board, setBoard] = useState(null)
  const [revealed, setRevealed] = useState(null)
  const [flagged, setFlagged] = useState(null)
  const [gameStatus, setGameStatus] = useState('idle')
  const [timer, setTimer] = useState(0)
  const timerRef = useRef(null)

  const config = DIFFICULTIES[difficulty]

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
  }, [])

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  useEffect(() => () => stopTimer(), [stopTimer])

  const reset = useCallback(() => {
    stopTimer()
    setBoard(null)
    setRevealed(null)
    setFlagged(null)
    setGameStatus('idle')
    setTimer(0)
  }, [stopTimer])

  const changeDifficulty = useCallback((level) => {
    setDifficulty(level)
    stopTimer()
    setBoard(null)
    setRevealed(null)
    setFlagged(null)
    setGameStatus('idle')
    setTimer(0)
  }, [stopTimer])

  const handleFirstClick = useCallback(async (row, col) => {
    const res = await fetch('/api/new-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rows: config.rows,
        cols: config.cols,
        mines: config.mines,
        firstClick: { row, col },
      }),
    })
    const data = await res.json()
    const newBoard = data.board
    const newRevealed = createGrid(config.rows, config.cols, false)
    const newFlagged = createGrid(config.rows, config.cols, false)

    const filledRevealed = newBoard[row][col] === 0
      ? floodFill(newBoard, newRevealed, row, col)
      : (() => { newRevealed[row][col] = true; return newRevealed })()

    setBoard(newBoard)
    setRevealed(filledRevealed)
    setFlagged(newFlagged)
    setGameStatus('playing')
    startTimer()

    const revealedCount = countRevealed(filledRevealed)
    if (revealedCount === config.rows * config.cols - config.mines) {
      setGameStatus('won')
      stopTimer()
    }
  }, [config, startTimer, stopTimer])

  const revealCell = useCallback((row, col) => {
    if (gameStatus === 'idle') {
      handleFirstClick(row, col)
      return
    }
    if (gameStatus !== 'playing' || revealed[row][col] || flagged[row][col]) return

    if (board[row][col] === -1) {
      setGameStatus('lost')
      stopTimer()
      const allRevealed = board.map(r => r.map(() => true))
      setRevealed(allRevealed)
      return
    }

    let newRevealed
    if (board[row][col] === 0) {
      newRevealed = floodFill(board, revealed, row, col)
    } else {
      newRevealed = revealed.map(r => [...r])
      newRevealed[row][col] = true
    }

    setRevealed(newRevealed)

    const revealedCount = countRevealed(newRevealed)
    if (revealedCount === config.rows * config.cols - config.mines) {
      setGameStatus('won')
      stopTimer()
    }
  }, [board, revealed, flagged, gameStatus, config, handleFirstClick, stopTimer])

  const toggleFlag = useCallback((row, col) => {
    if (gameStatus !== 'playing' && gameStatus !== 'idle') return
    if (gameStatus === 'idle') return
    if (revealed[row][col]) return

    setFlagged(prev => {
      const next = prev.map(r => [...r])
      next[row][col] = !next[row][col]
      return next
    })
  }, [gameStatus, revealed])

  const flagCount = flagged ? flagged.reduce((sum, row) => sum + row.filter(Boolean).length, 0) : 0

  return {
    board, revealed, flagged, gameStatus, timer, difficulty, config,
    flagCount, revealCell, toggleFlag, reset, changeDifficulty,
  }
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/useGameState.js
git commit -m "feat: add useGameState hook with full game logic"
```

---

### Task 8: Frontend — Cell component

**Files:**
- Create: `frontend/src/components/Cell.jsx`

**Step 1: Create Cell.jsx**

This component handles all visual states. Use `@skill frontend-design` for the dark modern UI — the implementation agent should invoke the `frontend-design` skill here to design the cell visuals with Framer Motion + Tailwind + Lucide icons.

Key states: hidden, revealed-empty, revealed-number (1-8 each a different color), flagged, mine (on lose).

**Step 2: Commit**

```bash
git add frontend/src/components/Cell.jsx
git commit -m "feat: add Cell component with visual states"
```

---

### Task 9: Frontend — Board component

**Files:**
- Create: `frontend/src/components/Board.jsx`

**Step 1: Create Board.jsx**

Grid layout using CSS grid. Delegates clicks to parent. Renders Cell components. Sizes dynamically based on difficulty. Use `@skill frontend-design` for the board styling.

**Step 2: Commit**

```bash
git add frontend/src/components/Board.jsx
git commit -m "feat: add Board component with grid layout"
```

---

### Task 10: Frontend — GameControls component

**Files:**
- Create: `frontend/src/components/GameControls.jsx`

**Step 1: Create GameControls.jsx**

Difficulty selector (easy/medium/hard buttons), reset button, timer display, mine counter (total - flags). Use Lucide icons. Use `@skill frontend-design`.

**Step 2: Commit**

```bash
git add frontend/src/components/GameControls.jsx
git commit -m "feat: add GameControls with difficulty selector and timer"
```

---

### Task 11: Frontend — App.jsx (main layout)

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Wire everything together**

Import useGameState, Board, GameControls. Dark background layout. Title. Use `@skill frontend-design` for the overall page design — dark, modern, memorable.

Remove default Vite boilerplate (`App.css`, `assets/`).

**Step 2: Commit**

```bash
git add frontend/src/
git commit -m "feat: wire App.jsx with game components"
```

---

### Task 12: Integration test — docker compose up

**Step 1: Build and start all containers**

```bash
docker compose up --build -d
```

**Step 2: Test API endpoint**

```bash
curl -X POST http://localhost/api/new-game \
  -H "Content-Type: application/json" \
  -d '{"rows":9,"cols":9,"mines":10,"firstClick":{"row":4,"col":4}}'
```

Expected: JSON response with 9×9 board, cell [4][4] is not -1, exactly 10 mines total.

**Step 3: Test frontend**

Open http://localhost in browser. Should see the game board with difficulty controls.

**Step 4: Commit compose.yaml if any tweaks needed**

---

### Task 13: Cleanup legacy files

**Step 1: Remove old files**

```bash
rm -rf www/ bin/ config/ sample.env docker-compose.yml
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove legacy PHP 7.2 project files"
```
