import { AnimatePresence, motion } from 'framer-motion'
import { useGameState } from './hooks/useGameState'
import Board from './components/Board'
import GameControls from './components/GameControls'

function App() {
  const {
    board, revealed, flagged, gameStatus, timer, difficulty, config,
    flagCount, revealCell, toggleFlag, reset, changeDifficulty,
  } = useGameState()

  const isGameOver = gameStatus === 'won' || gameStatus === 'lost'

  return (
    <div className="min-h-screen bg-[#0a0e0a] text-white flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Scanline texture */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16,185,129,0.015) 2px, rgba(16,185,129,0.015) 4px)',
        }}
      />

      {/* Vignette */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
      }} />

      <div className="relative z-10 flex flex-col items-center gap-5 sm:gap-6">
        <motion.h1
          className="font-mono text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.3em] text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          MINESWEEPER
        </motion.h1>

        <motion.div
          className="h-px w-48 bg-gradient-to-r from-transparent via-emerald-700/50 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />

        <GameControls
          difficulty={difficulty}
          onChangeDifficulty={changeDifficulty}
          onReset={reset}
          timer={timer}
          mineCount={config.mines}
          flagCount={flagCount}
          gameStatus={gameStatus}
        />

        <div className="relative">
          <Board
            board={board}
            revealed={revealed}
            flagged={flagged}
            gameStatus={gameStatus}
            onReveal={revealCell}
            onFlag={toggleFlag}
            config={config}
          />

          <AnimatePresence>
            {isGameOver && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <div className={`absolute inset-0 rounded-lg ${
                  gameStatus === 'won'
                    ? 'bg-emerald-950/50 backdrop-blur-[2px]'
                    : 'bg-red-950/50 backdrop-blur-[2px]'
                }`} />
                <motion.div
                  className="relative z-10 text-center"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
                >
                  <div className={`font-mono text-2xl sm:text-3xl font-bold tracking-[0.2em] ${
                    gameStatus === 'won'
                      ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                      : 'text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.5)]'
                  }`}>
                    {gameStatus === 'won' ? 'FIELD CLEARED' : 'MINE HIT'}
                  </div>
                  <motion.button
                    onClick={reset}
                    className="mt-4 px-6 py-2 rounded font-mono text-sm tracking-wider border transition-colors bg-black/50 hover:bg-black/70 border-current"
                    style={{ color: gameStatus === 'won' ? '#34d399' : '#f87171' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    PLAY AGAIN
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default App
