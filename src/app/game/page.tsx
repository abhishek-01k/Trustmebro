'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'

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
  const [slideOffset, setSlideOffset] = useState(0)
  const [betAmount] = useState(0.1)

  const generateLevel = useCallback((levelNum: number): LevelData => {
    const numTiles = Math.floor(Math.random() * 4) + 2
    const deathIndex = Math.floor(Math.random() * numTiles)
    const multiplier = parseFloat((1.1 ** levelNum).toFixed(2))
    
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

  useEffect(() => {
    const initialLevels: LevelData[] = []
    for (let i = 1; i <= 15; i++) {
      initialLevels.push(generateLevel(i))
    }
    setLevels(initialLevels)
  }, [generateLevel])

  const handleTileSelect = useCallback((levelIndex: number, tileId: number) => {
    if (gameState !== 'playing' || isAnimating) return
    if (levelIndex !== currentLevel - 1) return

    const level = levels[levelIndex]
    if (!level || level.isCompleted) return

    const tile = level.tiles.find(t => t.id === tileId)
    if (!tile) return

    setIsAnimating(true)

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

    setPlayerPosition({ level: levelIndex + 1, tileIndex: tileId })

    setTimeout(() => {
      if (tile.isDeath) {
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
        }, 600)
      } else {
        // Start smooth slide animation
        setSlideOffset(100)
        
        setTimeout(() => {
          const newMultiplier = totalMultiplier * level.multiplier
          setTotalMultiplier(newMultiplier)
          
          setLevels(prev => prev.map((lvl, idx) => {
            if (idx === levelIndex) {
              return { ...lvl, isCompleted: true }
            }
            return lvl
          }))

          if (currentLevel >= levels.length - 5) {
            setLevels(prev => [...prev, generateLevel(prev.length + 1)])
          }

          setCurrentLevel(prev => prev + 1)
          setSlideOffset(0)
          setIsAnimating(false)
        }, 400)
      }
    }, 300)
  }, [gameState, isAnimating, currentLevel, levels, totalMultiplier, generateLevel])

  const handleCashOut = useCallback(() => {
    if (gameState === 'playing' && currentLevel > 1) {
      setGameState('won')
    }
  }, [gameState, currentLevel])

  const handleRestart = useCallback(() => {
    const initialLevels: LevelData[] = []
    for (let i = 1; i <= 15; i++) {
      initialLevels.push(generateLevel(i))
    }
    setLevels(initialLevels)
    setCurrentLevel(1)
    setTotalMultiplier(1.0)
    setGameState('playing')
    setPlayerPosition({ level: 0, tileIndex: -1 })
    setIsAnimating(false)
    setSlideOffset(0)
  }, [generateLevel])

  const visibleLevels = useMemo(() => {
    const startIdx = currentLevel - 1
    const endIdx = Math.min(levels.length, currentLevel + 5)
    return levels.slice(startIdx, endIdx)
  }, [levels, currentLevel])

  const toWin = (betAmount * totalMultiplier).toFixed(2)

  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center p-4"
      style={{ background: '#0a0a12' }}
    >
      {/* Game Container Frame */}
      <div 
        className="relative w-full max-w-md h-full max-h-[800px] rounded-3xl overflow-hidden flex flex-col"
        style={{
          border: '1.5px solid rgba(255, 255, 255, 0.12)',
          background: '#0d0d18',
        }}
      >
        {/* Top Stats Row */}
        <div className="flex gap-3 p-4">
          <div 
            className="flex-1 rounded-2xl p-4"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(18, 18, 30, 0.9)',
            }}
          >
            <div className="text-gray-500 text-sm mb-1">Multiplier</div>
            <div className="text-white text-2xl font-bold">{totalMultiplier.toFixed(2)}x</div>
          </div>
          
          <div 
            className="flex-1 rounded-2xl p-4"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(18, 18, 30, 0.9)',
            }}
          >
            <div className="text-gray-500 text-sm mb-1">To win</div>
            <div className="text-white text-2xl font-bold">{toWin}</div>
          </div>
        </div>

        {/* Game Area with Perspective Track */}
        <div className="flex-1 relative overflow-hidden">
          {/* Perspective Lines - Wider to fit 5 tiles */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 400 600"
            preserveAspectRatio="xMidYMax meet"
          >
            {/* Left perspective line - wider angle */}
            <line 
              x1="20" y1="600" 
              x2="170" y2="0" 
              stroke="rgba(255,255,255,0.15)" 
              strokeWidth="1.5"
            />
            {/* Right perspective line - wider angle */}
            <line 
              x1="380" y1="600" 
              x2="230" y2="0" 
              stroke="rgba(255,255,255,0.15)" 
              strokeWidth="1.5"
            />
          </svg>

          {/* Levels Container with smooth animation */}
          <div 
            className="absolute inset-0 flex flex-col-reverse items-center justify-start pb-4"
            style={{
              transform: `translateY(${slideOffset}px)`,
              transition: slideOffset > 0 ? 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            }}
          >
            {visibleLevels.map((level, idx) => {
              const actualIndex = levels.findIndex(l => l.level === level.level)
              const distanceFromCurrent = level.level - currentLevel
              const isCurrentLevel = level.level === currentLevel
              
              // Much more aggressive scaling for upcoming tiles
              const scale = isCurrentLevel ? 1 : Math.max(0.35, 0.75 - distanceFromCurrent * 0.1)
              
              // Smoother vertical spacing
              const baseSpacing = 75
              const translateY = -distanceFromCurrent * baseSpacing - (distanceFromCurrent * distanceFromCurrent * 5)
              
              // Opacity for depth effect
              const opacity = isCurrentLevel ? 1 : Math.max(0.25, 0.8 - distanceFromCurrent * 0.15)
              
              // Tile sizes - much smaller for upcoming levels
              const currentTileSize = 48
              const currentTileHeight = 58
              const tileSize = isCurrentLevel ? currentTileSize : Math.max(20, currentTileSize - distanceFromCurrent * 10)
              const tileHeight = isCurrentLevel ? currentTileHeight : Math.max(26, currentTileHeight - distanceFromCurrent * 12)
              const tileGap = isCurrentLevel ? 8 : Math.max(3, 8 - distanceFromCurrent * 2)
              const tilePadding = isCurrentLevel ? 12 : Math.max(4, 10 - distanceFromCurrent * 2)
              
              return (
                <div
                  key={level.level}
                  className="relative flex flex-col items-center will-change-transform"
                  style={{
                    transform: `translateY(${translateY}px) scale(${scale})`,
                    opacity,
                    zIndex: 100 - distanceFromCurrent,
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out',
                    marginBottom: isCurrentLevel ? '8px' : '0',
                  }}
                >
                  {/* Current level multiplier label */}
                  {isCurrentLevel && (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px w-16 bg-white/25" />
                      <span className="text-white/70 text-sm font-medium tracking-wide">
                        {level.multiplier.toFixed(1)}x
                      </span>
                      <div className="h-px w-16 bg-white/25" />
                    </div>
                  )}

                  {/* Tiles container */}
                  <div 
                    className="relative flex justify-center rounded-xl"
                    style={{
                      gap: `${tileGap}px`,
                      padding: `${tilePadding}px`,
                      background: isCurrentLevel 
                        ? 'rgba(25, 25, 45, 0.95)' 
                        : 'rgba(20, 20, 35, 0.7)',
                      border: isCurrentLevel 
                        ? '1.5px solid rgba(255, 255, 255, 0.2)' 
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: isCurrentLevel ? '14px' : '10px',
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
                            relative overflow-hidden
                            ${isCurrentLevel && !level.isCompleted && gameState === 'playing' 
                              ? 'cursor-pointer hover:brightness-125 active:scale-95' 
                              : 'cursor-default'}
                          `}
                          style={{
                            width: `${tileSize}px`,
                            height: `${tileHeight}px`,
                            background: tile.isRevealed
                              ? tile.isDeath
                                ? 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)'
                                : 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)'
                              : 'rgba(50, 50, 70, 0.9)',
                            border: isCurrentLevel 
                              ? '1.5px solid rgba(255, 255, 255, 0.2)' 
                              : '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: isCurrentLevel ? '10px' : '6px',
                            transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
                          }}
                        >
                          {tile.isRevealed && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span style={{ fontSize: isCurrentLevel ? '20px' : '12px' }}>
                                {tile.isDeath ? '💀' : '✓'}
                              </span>
                            </div>
                          )}

                          {isPlayerHere && !tile.isDeath && (
                            <div 
                              className="absolute left-1/2 -translate-x-1/2"
                              style={{ 
                                top: '-22px',
                                fontSize: '18px',
                                animation: 'bounce 0.5s ease-out',
                              }}
                            >
                              🧑‍🚀
                            </div>
                          )}

                          {isPlayerHere && tile.isDeath && (
                            <div 
                              className="absolute left-1/2"
                              style={{ 
                                top: '-22px',
                                fontSize: '18px',
                                animation: 'fall 0.6s ease-in forwards',
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
        </div>

        {/* Bottom Section */}
        <div className="p-4 flex flex-col gap-3">
          <div className="text-center text-white/60 text-base">
            Bet : {betAmount} USDC
          </div>
          
          <button
            onClick={currentLevel > 1 ? handleCashOut : undefined}
            disabled={currentLevel <= 1 || gameState !== 'playing'}
            className={`w-full py-4 rounded-xl font-semibold text-base ${
              currentLevel > 1 && gameState === 'playing'
                ? 'hover:bg-white/10 active:scale-[0.98]'
                : 'opacity-40 cursor-not-allowed'
            }`}
            style={{
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(30, 30, 50, 0.8)',
              color: 'white',
              transition: 'all 0.2s ease-out',
            }}
          >
            Cash Out
          </button>
        </div>
      </div>

      {/* Game Over Overlay */}
      {gameState === 'lost' && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-50"
          style={{
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <div className="text-6xl mb-4">💀</div>
          <h2 className="text-3xl font-bold text-red-500 mb-2">RUGGED!</h2>
          <p className="text-lg text-gray-400 mb-4">
            You hit a death tile at Level {currentLevel}
          </p>
          <p className="text-base text-gray-500 mb-8">
            Final: <span className="text-white font-bold text-xl">{totalMultiplier.toFixed(2)}x</span>
          </p>
          <button
            onClick={handleRestart}
            className="px-8 py-3 rounded-xl font-semibold text-base hover:bg-white/10 active:scale-95"
            style={{
              background: 'rgba(50, 50, 70, 0.9)',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              transition: 'all 0.2s ease-out',
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Win Overlay */}
      {gameState === 'won' && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-50"
          style={{
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-green-400 mb-2">CASHED OUT!</h2>
          <p className="text-lg text-gray-400 mb-4">
            You made it to Level {currentLevel - 1}
          </p>
          <p className="text-3xl font-bold text-white mb-2">
            {totalMultiplier.toFixed(2)}x
          </p>
          <p className="text-xl text-green-400 mb-8">
            Won: {toWin} USDC
          </p>
          <button
            onClick={handleRestart}
            className="px-8 py-3 rounded-xl font-semibold text-base hover:bg-white/10 active:scale-95"
            style={{
              background: 'rgba(50, 50, 70, 0.9)',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              transition: 'all 0.2s ease-out',
            }}
          >
            Play Again
          </button>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateX(-50%) translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(120px) rotate(180deg);
            opacity: 0;
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(-6px);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
