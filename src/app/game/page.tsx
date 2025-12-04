'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface TileData {
  id: number
  isDeath: boolean
  isRevealed: boolean
  isSelected: boolean
}

interface LevelData {
  level: number
  tiles: TileData[]
  multiplier: number
  isCompleted: boolean
  selectedTileId: number | null
}

export default function GamePage() {
  return <GameScreen />
}

export function GameScreen() {
  const [levels, setLevels] = useState<LevelData[]>([])
  const [currentLevel, setCurrentLevel] = useState(1)
  const [totalMultiplier, setTotalMultiplier] = useState(1.0)
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing')
  const [playerPosition, setPlayerPosition] = useState({ level: 0, tileIndex: -1 })
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate a new level
  const generateLevel = useCallback((levelNum: number): LevelData => {
    const numTiles = Math.floor(Math.random() * 4) + 2 // 2 to 5 tiles
    const deathIndex = Math.floor(Math.random() * numTiles)
    const multiplier = parseFloat((1.18 ** levelNum).toFixed(2))
    
    const tiles: TileData[] = Array.from({ length: numTiles }, (_, i) => ({
      id: i,
      isDeath: i === deathIndex,
      isRevealed: false,
      isSelected: false,
    }))

    return {
      level: levelNum,
      tiles,
      multiplier,
      isCompleted: false,
      selectedTileId: null,
    }
  }, [])

  // Initialize game
  useEffect(() => {
    const initialLevels: LevelData[] = []
    for (let i = 1; i <= 10; i++) {
      initialLevels.push(generateLevel(i))
    }
    setLevels(initialLevels)
  }, [generateLevel])

  // Handle tile selection
  const handleTileSelect = useCallback((levelIndex: number, tileId: number) => {
    if (gameState !== 'playing' || isAnimating) return
    if (levelIndex !== currentLevel - 1) return // Can only select current level

    const level = levels[levelIndex]
    if (!level || level.isCompleted) return

    const tile = level.tiles.find(t => t.id === tileId)
    if (!tile) return

    setIsAnimating(true)

    // Update the level with selection
    setLevels(prev => prev.map((lvl, idx) => {
      if (idx === levelIndex) {
        return {
          ...lvl,
          selectedTileId: tileId,
          tiles: lvl.tiles.map(t => ({
            ...t,
            isSelected: t.id === tileId,
            isRevealed: t.id === tileId,
          })),
        }
      }
      return lvl
    }))

    // Animate player jump
    setPlayerPosition({ level: levelIndex + 1, tileIndex: tileId })

    setTimeout(() => {
      if (tile.isDeath) {
        // Reveal all tiles on death
        setLevels(prev => prev.map((lvl, idx) => {
          if (idx === levelIndex) {
            return {
              ...lvl,
              tiles: lvl.tiles.map(t => ({ ...t, isRevealed: true })),
            }
          }
          return lvl
        }))
        
        setTimeout(() => {
          setGameState('lost')
          setIsAnimating(false)
        }, 500)
      } else {
        // Safe tile - update multiplier and move to next level
        const newMultiplier = totalMultiplier * level.multiplier
        setTotalMultiplier(newMultiplier)
        
        setLevels(prev => prev.map((lvl, idx) => {
          if (idx === levelIndex) {
            return { ...lvl, isCompleted: true }
          }
          return lvl
        }))

        // Add new level if needed
        if (currentLevel >= levels.length - 3) {
          setLevels(prev => [...prev, generateLevel(prev.length + 1)])
        }

        setCurrentLevel(prev => prev + 1)
        setIsAnimating(false)
      }
    }, 600)
  }, [gameState, isAnimating, currentLevel, levels, totalMultiplier, generateLevel])

  // Cash out
  const handleCashOut = useCallback(() => {
    if (gameState === 'playing' && currentLevel > 1) {
      setGameState('won')
    }
  }, [gameState, currentLevel])

  // Restart game
  const handleRestart = useCallback(() => {
    const initialLevels: LevelData[] = []
    for (let i = 1; i <= 10; i++) {
      initialLevels.push(generateLevel(i))
    }
    setLevels(initialLevels)
    setCurrentLevel(1)
    setTotalMultiplier(1.0)
    setGameState('playing')
    setPlayerPosition({ level: 0, tileIndex: -1 })
    setIsAnimating(false)
  }, [generateLevel])

  // Get visible levels (show current and a few ahead)
  const visibleLevels = levels.slice(
    Math.max(0, currentLevel - 2),
    Math.min(levels.length, currentLevel + 5)
  )

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 50%, #2d1b4e 100%)',
      }}
    >
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'center top',
        }}
      />

      {/* Perspective track */}
      <div 
        className="absolute left-1/2 bottom-0 w-full"
        style={{
          transform: 'translateX(-50%)',
          perspective: '800px',
          perspectiveOrigin: 'center bottom',
        }}
      >
        {/* Track/Road */}
        <div
          className="absolute left-1/2 bottom-0"
          style={{
            width: '100%',
            height: '80vh',
            transform: 'translateX(-50%) rotateX(60deg)',
            transformOrigin: 'center bottom',
            background: 'linear-gradient(180deg, transparent 0%, rgba(30, 20, 50, 0.9) 30%, rgba(40, 30, 60, 0.95) 100%)',
            clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
          }}
        />
      </div>

      {/* Levels Container */}
      <div 
        className="absolute bottom-20 left-1/2 w-full flex flex-col-reverse items-center gap-4"
        style={{
          transform: 'translateX(-50%)',
          perspective: '1000px',
        }}
      >
        {visibleLevels.map((level, visualIndex) => {
          const actualIndex = levels.findIndex(l => l.level === level.level)
          const distanceFromCurrent = level.level - currentLevel
          const scale = Math.max(0.3, 1 - distanceFromCurrent * 0.12)
          const translateY = distanceFromCurrent * -80
          const opacity = distanceFromCurrent > 3 ? 0.3 : 1
          const isCurrentLevel = level.level === currentLevel
          
          return (
            <div
              key={level.level}
              className="relative transition-all duration-500 ease-out"
              style={{
                transform: `translateY(${translateY}px) scale(${scale})`,
                opacity,
                zIndex: 100 - distanceFromCurrent,
              }}
            >
              {/* Level indicator */}
              {isCurrentLevel && (
                <div 
                  className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-lg font-bold text-lg whitespace-nowrap"
                  style={{
                    background: 'linear-gradient(135deg, #c4f94a 0%, #a3e635 100%)',
                    color: '#1a1a2e',
                    boxShadow: '0 0 20px rgba(196, 249, 74, 0.5)',
                  }}
                >
                  Lvl {level.level}: {level.multiplier.toFixed(2)}x
                </div>
              )}

              {/* Tiles row */}
              <div 
                className={`relative flex justify-center gap-3 p-4 rounded-2xl transition-all duration-300 ${
                  isCurrentLevel ? 'ring-2 ring-[#c4f94a] ring-opacity-80' : ''
                }`}
                style={{
                  background: isCurrentLevel 
                    ? 'rgba(30, 30, 50, 0.9)' 
                    : 'rgba(20, 20, 40, 0.7)',
                  boxShadow: isCurrentLevel 
                    ? '0 0 30px rgba(196, 249, 74, 0.3), inset 0 0 20px rgba(139, 92, 246, 0.2)' 
                    : 'none',
                }}
              >
                {level.tiles.map((tile) => {
                  const isPlayerHere = playerPosition.level === level.level && playerPosition.tileIndex === tile.id
                  
                  return (
                    <button
                      key={tile.id}
                      onClick={() => handleTileSelect(actualIndex, tile.id)}
                      disabled={!isCurrentLevel || level.isCompleted || isAnimating || gameState !== 'playing'}
                      className={`
                        relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl transition-all duration-300
                        ${isCurrentLevel && !level.isCompleted && gameState === 'playing' ? 'cursor-pointer hover:scale-105 hover:brightness-110' : 'cursor-default'}
                        ${tile.isSelected ? 'scale-95' : ''}
                      `}
                      style={{
                        background: tile.isRevealed
                          ? tile.isDeath
                            ? 'linear-gradient(180deg, #ef4444 0%, #991b1b 100%)'
                            : 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)'
                          : 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)',
                        boxShadow: tile.isRevealed
                          ? tile.isDeath
                            ? '0 4px 20px rgba(239, 68, 68, 0.5)'
                            : '0 4px 20px rgba(34, 197, 94, 0.5)'
                          : '0 4px 15px rgba(139, 92, 246, 0.4)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      {/* Card inner design */}
                      <div className="absolute inset-2 rounded-lg flex items-center justify-center"
                        style={{
                          background: tile.isRevealed
                            ? 'transparent'
                            : 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
                        }}
                      >
                        {tile.isRevealed ? (
                          <span className="text-2xl">
                            {tile.isDeath ? '💀' : '✓'}
                          </span>
                        ) : (
                          <div className="text-white/80 text-xs font-bold text-center">
                            <div className="text-lg">🎰</div>
                            <div className="mt-1 opacity-70">RUG</div>
                            <div className="opacity-70">RUMBLE</div>
                          </div>
                        )}
                      </div>

                      {/* Player indicator */}
                      {isPlayerHere && !tile.isDeath && (
                        <div 
                          className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-3xl animate-bounce"
                        >
                          🧑‍🚀
                        </div>
                      )}

                      {/* Death animation */}
                      {isPlayerHere && tile.isDeath && (
                        <div 
                          className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-3xl animate-fall"
                          style={{
                            animation: 'fall 0.5s ease-in forwards',
                          }}
                        >
                          🧑‍🚀
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
        {/* Total Multiplier */}
        <div 
          className="px-4 py-2 rounded-xl font-bold"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(196, 249, 74, 0.3)',
          }}
        >
          <div className="text-sm text-gray-400">Total</div>
          <div className="text-2xl" style={{ color: '#c4f94a' }}>
            {totalMultiplier.toFixed(2)}x
          </div>
        </div>

        {/* Cash Out Button */}
        {currentLevel > 1 && gameState === 'playing' && (
          <button
            onClick={handleCashOut}
            className="px-6 py-3 rounded-xl font-bold text-lg transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #c4f94a 0%, #a3e635 100%)',
              color: '#1a1a2e',
              boxShadow: '0 0 20px rgba(196, 249, 74, 0.4)',
            }}
          >
            Cash Out
          </button>
        )}
      </div>

      {/* Starting player position */}
      {playerPosition.level === 0 && gameState === 'playing' && (
        <div 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-4xl"
        >
          🧑‍🚀
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === 'lost' && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="text-6xl mb-4">💀</div>
          <h2 className="text-4xl font-bold text-red-500 mb-2">RUGGED!</h2>
          <p className="text-xl text-gray-300 mb-6">
            You hit a death tile at Level {currentLevel}
          </p>
          <p className="text-lg text-gray-400 mb-8">
            Final: <span className="text-[#c4f94a] font-bold">{totalMultiplier.toFixed(2)}x</span>
          </p>
          <button
            onClick={handleRestart}
            className="px-8 py-4 rounded-xl font-bold text-xl transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              color: 'white',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)',
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Win Overlay */}
      {gameState === 'won' && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold text-[#c4f94a] mb-2">CASHED OUT!</h2>
          <p className="text-xl text-gray-300 mb-6">
            You made it to Level {currentLevel - 1}
          </p>
          <p className="text-3xl text-[#c4f94a] font-bold mb-8">
            {totalMultiplier.toFixed(2)}x
          </p>
          <button
            onClick={handleRestart}
            className="px-8 py-4 rounded-xl font-bold text-xl transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #c4f94a 0%, #a3e635 100%)',
              color: '#1a1a2e',
              boxShadow: '0 0 30px rgba(196, 249, 74, 0.5)',
            }}
          >
            Play Again
          </button>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateX(-50%) translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(200px) rotate(180deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
