import { memo } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Timer, Bomb } from 'lucide-react'

const DIFFICULTIES = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
]

function GameControls({ difficulty, onChangeDifficulty, onReset, timer, mineCount, flagCount, gameStatus }) {
  const remaining = mineCount - flagCount

  const statusText = {
    idle: 'READY',
    loading: 'DEPLOYING...',
    playing: 'SCANNING...',
    won: 'CLEARED',
    lost: 'DETONATED',
  }

  const statusColor = {
    idle: 'text-emerald-600',
    loading: 'text-emerald-600 animate-pulse',
    playing: 'text-emerald-400',
    won: 'text-cyan-400',
    lost: 'text-red-400',
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-md">
      {/* Difficulty selector */}
      <div className="flex gap-1 bg-black/30 rounded-md p-1 border border-emerald-900/20">
        {DIFFICULTIES.map(({ key, label }) => (
          <motion.button
            key={key}
            onClick={() => onChangeDifficulty(key)}
            className={`
              flex-1 py-1.5 px-2 rounded text-xs sm:text-sm font-mono uppercase tracking-wider transition-colors
              ${difficulty === key
                ? 'bg-emerald-900/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                : 'text-emerald-700 hover:text-emerald-500 hover:bg-emerald-950/30'
              }
            `}
            whileTap={{ scale: 0.96 }}
          >
            {label}
          </motion.button>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between gap-2 font-mono text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 text-emerald-500">
          <Timer className="w-3.5 h-3.5" />
          <span className="tabular-nums tracking-wide">{formatTime(timer)}</span>
        </div>

        <motion.div
          className={`text-xs sm:text-sm font-mono tracking-widest ${statusColor[gameStatus]}`}
          key={gameStatus}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {statusText[gameStatus]}
        </motion.div>

        <div className="flex items-center gap-1.5 text-amber-500">
          <Bomb className="w-3.5 h-3.5" />
          <span className="tabular-nums">{remaining}</span>
        </div>
      </div>

      {/* Reset button */}
      <motion.button
        onClick={onReset}
        className="flex items-center justify-center gap-2 py-2 rounded-md font-mono text-xs sm:text-sm uppercase tracking-wider bg-emerald-950/30 border border-emerald-900/30 text-emerald-600 hover:text-emerald-400 hover:border-emerald-700/40 hover:bg-emerald-950/50 transition-colors"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset
      </motion.button>
    </div>
  )
}

export default memo(GameControls)
