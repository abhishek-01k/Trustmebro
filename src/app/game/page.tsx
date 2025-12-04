'use client'

import { useEffect, useState, useCallback } from 'react'

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
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'jumping' | 'sliding'>('idle')
  const [betAmount] = useState(0.1)

  // Generate a new level
  const generateLevel = useCallback((levelNum: number): LevelData => {
    const numTiles = Math.floor(Math.random() * 4) + 2 // 2 to 5 tiles
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

  // Initialize game
  useEffect(() => {
    const initialLevels: LevelData[] = []
    for (let i = 1; i <= 15; i++) {
      initialLevels.push(generateLevel(i))
    }
    setLevels(initialLevels)
  }, [generateLevel])

  // Handle tile selection
  const handleTileSelect = useCallback((levelIndex: number, tileId: number) => {
    if (gameState !== 'playing' || isAnimating) return
    if (levelIndex !== currentLevel - 1) return

    const level = levels[levelIndex]
    if (!level || level.isCompleted) return

    const tile = level.tiles.find(t => t.id === tileId)
    if (!tile) return

    setIsAnimating(true)
    setAnimationPhase('jumping')

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
          setAnimationPhase('idle')
        }, 600)
      } else {
        setAnimationPhase('sliding')
        
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
          setIsAnimating(false)
          setAnimationPhase('idle')
        }, 500)
      }
    }, 400)
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
    setAnimationPhase('idle')
  }, [generateLevel])

  const getVisibleLevels = () => {
    const startIdx = currentLevel - 1
    const endIdx = Math.min(levels.length, currentLevel + 6)
    return levels.slice(startIdx, endIdx)
  }

  const visibleLevels = getVisibleLevels()
  const toWin = (betAmount * totalMultiplier).toFixed(2)
  const currentLevelData = levels[currentLevel - 1]

  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center p-4"
      style={{ background: '#0f0f1a' }}
    >
      {/* Game Container Frame */}
      <div 
        className="relative w-full max-w-md h-full max-h-[800px] rounded-3xl overflow-hidden flex flex-col"
        style={{
          border: '2px solid rgba(255, 255, 255, 0.15)',
          background: '#0a0a14',
        }}
      >
        {/* Top Stats Row */}
        <div className="flex gap-3 p-4">
          {/* Multiplier Box */}
          <div 
            className="flex-1 rounded-2xl p-4"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(20, 20, 35, 0.8)',
            }}
          >
            <div className="text-gray-400 text-sm mb-1">Multiplier</div>
            <div className="text-white text-2xl font-bold">{totalMultiplier.toFixed(2)}x</div>
          </div>
          
          {/* To Win Box */}
          <div 
            className="flex-1 rounded-2xl p-4"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(20, 20, 35, 0.8)',
            }}
          >
            <div className="text-gray-400 text-sm mb-1">To win</div>
            <div className="text-white text-2xl font-bold">{toWin}</div>
          </div>
        </div>

        {/* Game Area with Perspective Track */}
        <div className="flex-1 relative overflow-hidden">
          {/* Perspective Lines */}
          <svg 
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 400 500"
            preserveAspectRatio="xMidYMax meet"
          >
            {/* Left perspective line */}
            <line 
              x1="50" y1="500" 
              x2="180" y2="0" 
              stroke="rgba(255,255,255,0.2)" 
              strokeWidth="1"
            />
            {/* Right perspective line */}
            <line 
              x1="350" y1="500" 
              x2="220" y2="0" 
              stroke="rgba(255,255,255,0.2)" 
              strokeWidth="1"
            />
          </svg>

          {/* Levels Container */}
          <div 
            className="absolute inset-0 flex flex-col-reverse items-center justify-start pb-4"
            style={{
              transform: animationPhase === 'sliding' ? 'translateY(60px)' : 'translateY(0)',
              transition: animationPhase === 'sliding' ? 'transform 0.5s ease-out' : 'none',
            }}
          >
            {visibleLevels.map((level) => {
              const actualIndex = levels.findIndex(l => l.level === level.level)
              const distanceFromCurrent = level.level - currentLevel
              const isCurrentLevel = level.level === currentLevel
              
              // Scale and positioning
              const scale = Math.max(0.3, 1 - distanceFromCurrent * 0.12)
              const translateY = distanceFromCurrent * -65 - distanceFromCurrent * distanceFromCurrent * 4
              const opacity = Math.max(0.2, 1 - distanceFromCurrent * 0.18)
              
              return (
                <div
                  key={level.level}
                  className="relative flex flex-col items-center"
                  style={{
                    transform: `translateY(${translateY}px) scale(${scale})`,
                    opacity,
                    zIndex: 100 - distanceFromCurrent,
                    transition: 'all 0.5s ease-out',
                    marginBottom: isCurrentLevel ? '8px' : '0',
                  }}
                >
                  {/* Current level multiplier label with lines */}
                  {isCurrentLevel && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px w-12 bg-white/30" />
                      <span className="text-white/80 text-sm font-medium whitespace-nowrap">
                        {level.multiplier.toFixed(1)}x
                      </span>
                      <div className="h-px w-12 bg-white/30" />
                    </div>
                  )}

                  {/* Tiles row */}
                  <div 
                    className={`relative flex justify-center gap-2 p-3 rounded-xl ${
                      isCurrentLevel ? 'ring-1 ring-white/30' : ''
                    }`}
                    style={{
                      background: isCurrentLevel 
                        ? 'rgba(30, 30, 50, 0.9)' 
                        : 'rgba(25, 25, 40, 0.6)',
                    }}
                  >
                    {level.tiles.map((tile) => {
                      const isPlayerHere = playerPosition.level === level.level && playerPosition.tileIndex === tile.id
                      const tileSize = isCurrentLevel ? 52 : Math.max(24, 52 - distanceFromCurrent * 8)
                      const tileHeight = isCurrentLevel ? 64 : Math.max(32, 64 - distanceFromCurrent * 10)
                      
                      return (
                        <button
                          key={tile.id}
                          onClick={() => handleTileSelect(actualIndex, tile.id)}
                          disabled={!isCurrentLevel || level.isCompleted || isAnimating || gameState !== 'playing'}
                          className={`
                            relative rounded-lg overflow-hidden transition-all duration-200
                            ${isCurrentLevel && !level.isCompleted && gameState === 'playing' 
                              ? 'cursor-pointer hover:scale-105 hover:brightness-110 active:scale-95' 
                              : 'cursor-default'}
                          `}
                          style={{
                            width: `${tileSize}px`,
                            height: `${tileHeight}px`,
                            background: tile.isRevealed
                              ? tile.isDeath
                                ? 'linear-gradient(180deg, #ef4444 0%, #991b1b 100%)'
                                : 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)'
                              : 'rgba(60, 60, 80, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                          }}
                        >
                          {tile.isRevealed && (
                            <div className="absolute inset-0 flex items-center justify-center text-xl">
                              {tile.isDeath ? '💀' : '✓'}
                            </div>
                          )}

                          {isPlayerHere && !tile.isDeath && (
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xl">
                              🧑‍🚀
                            </div>
                          )}

                          {isPlayerHere && tile.isDeath && (
                            <div 
                              className="absolute -top-6 left-1/2 text-xl"
                              style={{ animation: 'fall 0.6s ease-in forwards' }}
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
          {/* Bet Amount */}
          <div className="text-center text-white/80 text-lg">
            Bet : {betAmount} USDC
          </div>
          
          {/* Cash Out Button */}
          <button
            onClick={currentLevel > 1 ? handleCashOut : undefined}
            disabled={currentLevel <= 1 || gameState !== 'playing'}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              currentLevel > 1 && gameState === 'playing'
                ? 'hover:scale-[1.02] active:scale-[0.98]'
                : 'opacity-50 cursor-not-allowed'
            }`}
            style={{
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: currentLevel > 1 && gameState === 'playing'
                ? 'rgba(40, 40, 60, 0.9)'
                : 'rgba(30, 30, 45, 0.6)',
              color: 'white',
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
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="text-6xl mb-4">💀</div>
          <h2 className="text-3xl font-bold text-red-500 mb-2">RUGGED!</h2>
          <p className="text-lg text-gray-300 mb-4">
            You hit a death tile at Level {currentLevel}
          </p>
          <p className="text-base text-gray-400 mb-8">
            Final: <span className="text-white font-bold text-xl">{totalMultiplier.toFixed(2)}x</span>
          </p>
          <button
            onClick={handleRestart}
            className="px-8 py-3 rounded-xl font-bold text-lg transition-all hover:scale-105"
            style={{
              background: 'rgba(60, 60, 80, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
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
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-green-400 mb-2">CASHED OUT!</h2>
          <p className="text-lg text-gray-300 mb-4">
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
            className="px-8 py-3 rounded-xl font-bold text-lg transition-all hover:scale-105"
            style={{
              background: 'rgba(60, 60, 80, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
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
            transform: translateX(-50%) translateY(150px) rotate(180deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
