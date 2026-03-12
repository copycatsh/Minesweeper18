import { memo } from 'react'
import Cell from './Cell'

function Board({ board, revealed, flagged, gameStatus, onReveal, onFlag, config }) {
  const rows = config.rows
  const cols = config.cols

  return (
    <div
      className="inline-grid gap-[1px] p-2 sm:p-3 rounded-lg bg-black/40 border border-emerald-900/30 shadow-[0_0_30px_rgba(16,185,129,0.06),inset_0_0_20px_rgba(0,0,0,0.4)]"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        width: `min(90vw, ${cols * 2.2}rem)`,
      }}
    >
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const cellValue = board ? board[r][c] : 0
          const isRevealed = revealed ? revealed[r][c] : false
          const isFlagged = flagged ? flagged[r][c] : false
          const isMine = board ? board[r][c] === -1 : false

          return (
            <Cell
              key={`${r}-${c}`}
              row={r}
              col={c}
              value={cellValue}
              isRevealed={isRevealed}
              isFlagged={isFlagged}
              isMine={isMine}
              gameStatus={gameStatus}
              onReveal={onReveal}
              onFlag={onFlag}
            />
          )
        })
      )}
    </div>
  )
}

export default memo(Board)
