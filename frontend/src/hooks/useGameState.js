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
    reset()
  }, [reset])

  const handleFirstClick = useCallback(async (row, col) => {
    setGameStatus('loading')

    try {
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
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const newBoard = data.board
      if (!newBoard) throw new Error('Invalid board data')
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
    } catch {
      setGameStatus('idle')
    }
  }, [config, startTimer, stopTimer])

  const revealCell = useCallback((row, col) => {
    if (gameStatus === 'loading') return
    if (gameStatus === 'idle') {
      handleFirstClick(row, col)
      return
    }
    if (gameStatus !== 'playing' || revealed[row][col] || flagged[row][col]) return

    if (board[row][col] === -1) {
      setGameStatus('lost')
      stopTimer()
      const allRevealed = board.map((r, ri) =>
        r.map((_, ci) => !flagged[ri][ci])
      )
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
    if (gameStatus !== 'playing') return
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
