import { memo } from 'react'
import { motion } from 'framer-motion'
import { Flag, Bomb } from 'lucide-react'

const NUMBER_COLORS = {
  1: '#4fc3f7',
  2: '#66bb6a',
  3: '#ef5350',
  4: '#ab47bc',
  5: '#ad1457',
  6: '#26a69a',
  7: '#cfd8dc',
  8: '#78909c',
}

function Cell({ value, isRevealed, isFlagged, isMine, gameStatus, onReveal, onFlag, row, col }) {
  const handleClick = () => {
    if (isRevealed || isFlagged || gameStatus === 'won' || gameStatus === 'lost') return
    onReveal(row, col)
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    if (isRevealed || gameStatus === 'won' || gameStatus === 'lost') return
    onFlag(row, col)
  }

  const isGameOver = gameStatus === 'won' || gameStatus === 'lost'
  const wrongFlag = isFlagged && !isMine && gameStatus === 'lost'
  const showMine = isRevealed && isMine
  const showNumber = isRevealed && !isMine && value > 0
  const showEmpty = isRevealed && !isMine && value === 0

  return (
    <motion.button
      className={`
        relative aspect-square flex items-center justify-center
        text-xs sm:text-sm font-mono font-bold
        border border-emerald-900/30 select-none
        transition-colors duration-100
        ${isRevealed
          ? showMine
            ? 'bg-red-950/80 border-red-800/40'
            : showEmpty
              ? 'bg-black/60 border-emerald-950/20'
              : 'bg-black/50 border-emerald-900/20'
          : 'bg-emerald-950/30 hover:bg-emerald-900/40 hover:border-emerald-500/40 hover:shadow-[0_0_8px_rgba(16,185,129,0.15)] cursor-pointer'
        }
        ${isFlagged && !isRevealed ? 'bg-amber-950/30 border-amber-700/30' : ''}
        ${isGameOver && !isRevealed ? 'opacity-60' : ''}
      `}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      initial={false}
      animate={isRevealed ? { scale: [0.85, 1], opacity: [0.5, 1] } : {}}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      whileHover={!isRevealed && !isGameOver ? { scale: 1.05 } : {}}
      whileTap={!isRevealed && !isGameOver ? { scale: 0.92 } : {}}
    >
      {isFlagged && !isRevealed && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className={wrongFlag ? 'relative' : ''}
        >
          <Flag className={`w-3 h-3 sm:w-4 sm:h-4 ${wrongFlag ? 'text-red-400' : 'text-amber-500'} drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]`} />
          {wrongFlag && <span className="absolute inset-0 flex items-center justify-center text-red-500 font-bold text-lg">×</span>}
        </motion.div>
      )}

      {showMine && (
        <motion.div
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 12 }}
        >
          <Bomb className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)]" />
        </motion.div>
      )}

      {showNumber && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          style={{ color: NUMBER_COLORS[value], textShadow: `0 0 8px ${NUMBER_COLORS[value]}44` }}
        >
          {value}
        </motion.span>
      )}
    </motion.button>
  )
}

export default memo(Cell)
