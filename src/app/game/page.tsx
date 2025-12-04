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
  const [betAmount] = useState(0.1)
  const [viewOffset, setViewOffset] = useState(0)

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

  // Scroll handlers
  const handleScrollUp = useCallback(() => {
    setViewOffset(prev => Math.min(prev + 1, levels.length - currentLevel - 1))
  }, [levels.length, currentLevel])

  const handleScrollDown = useCallback(() => {
    setViewOffset(prev => Math.max(prev - 1, 0))
  }, [])

  // Reset view offset when level changes
  useEffect(() => {
    setViewOffset(0)
  }, [currentLevel])

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
    setViewOffset(0)
  }, [generateLevel])

  // Get visible levels - current + next 6 with offset
  const visibleLevels = useMemo(() => {
    const startIdx = currentLevel - 1 + viewOffset
    const endIdx = Math.min(levels.length, startIdx + 7)
    return levels.slice(startIdx, endIdx)
  }, [levels, currentLevel, viewOffset])

  const toWin = (betAmount * totalMultiplier).toFixed(2)

  // Glass icon for tiles
  const GlassIcon = ({ size = 24 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size }}>
      <rect x="3" y="3" width="18" height="18" rx="2" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
      <path d="M7 7L17 17M17 7L7 17" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
    </svg>
  )

  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center"
      style={{ 
        background: '#0a0a12',
      }}
    >
      {/* Game Container Frame */}
      <div 
        className="relative h-full w-full sm:w-[92%] md:w-[85%] max-h-[900px] rounded-none sm:rounded-3xl overflow-hidden flex flex-col"
        style={{
          maxWidth: '650px',
          border: '2px solid rgba(255, 180, 100, 0.3)',
          backgroundImage: 'url(/bg.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        {/* Top Stats Row */}
        <div className={`flex gap-3 p-4 ${gameState !== 'playing' ? 'invisible' : ''}`}>
          <div 
            className="flex-1 rounded-2xl p-4"
            style={{
              border: '1px solid rgba(255, 180, 100, 0.4)',
              background: 'rgba(10, 10, 20, 0.85)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="text-amber-400/70 text-sm mb-1">Multiplier</div>
            <div className="text-white text-2xl font-bold">{totalMultiplier.toFixed(2)}x</div>
          </div>
          
          <div 
            className="flex-1 rounded-2xl p-4"
            style={{
              border: '1px solid rgba(255, 180, 100, 0.4)',
              background: 'rgba(10, 10, 20, 0.85)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="text-amber-400/70 text-sm mb-1">To win</div>
            <div className="text-white text-2xl font-bold">{toWin}</div>
          </div>
        </div>

        {/* Game Area with 3D Perspective */}
        <div 
          className={`flex-1 relative overflow-hidden ${gameState !== 'playing' ? 'invisible' : ''}`}
          style={{ perspective: '800px', perspectiveOrigin: 'center 80%' }}
        >
          {/* Perspective Bridge - Neon cyan to purple gradient - starts from door */}
          <div 
            className="absolute pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.4) 0%, rgba(139, 92, 246, 0.6) 40%, rgba(236, 72, 153, 0.75) 100%)',
              width: '100%',
              height: '55%',
              left: 0,
              bottom: 0,
              clipPath: 'polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)',
              boxShadow: 'inset 0 0 60px rgba(6, 182, 212, 0.3)',
            }}
          />
          
          {/* Neon grid lines overlay - starts from door */}
          <div 
            className="absolute pointer-events-none"
            style={{
              width: '100%',
              height: '55%',
              left: 0,
              bottom: 0,
              clipPath: 'polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)',
              backgroundImage: `
                linear-gradient(rgba(6, 182, 212, 0.4) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '40px 30px',
            }}
          />

          {/* Scroll Buttons */}
          <div className="absolute right-4 top-1/3 -translate-y-1/2 flex flex-col gap-2 z-10">
            <button
              onClick={handleScrollUp}
              disabled={viewOffset >= levels.length - currentLevel - 1}
              className="p-3 backdrop-blur-sm border border-amber-700 rounded-lg hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
              aria-label="Scroll up"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-amber-900">
                <path d="m18 15-6-6-6 6"></path>
              </svg>
            </button>
            <button
              onClick={handleScrollDown}
              disabled={viewOffset <= 0}
              className="p-3 backdrop-blur-sm border border-amber-700 rounded-lg hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
              aria-label="Scroll down"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-amber-900">
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </button>
          </div>

          {/* Levels Container with 3D */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-end pb-4 overflow-hidden"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {[...visibleLevels].reverse().map((level, reverseIdx) => {
              const idx = visibleLevels.length - 1 - reverseIdx
              const actualIndex = levels.findIndex(l => l.level === level.level)
              const distanceFromCurrent = idx
              const isCurrentLevel = idx === 0 && viewOffset === 0
              const isViewingLevel = idx === 0
              
              // 3D transform values
              const baseY = isViewingLevel ? 0 : 280 + distanceFromCurrent * 90
              const rotateX = isViewingLevel ? 0 : -70
              const translateZ = isViewingLevel ? 0 : 20
              const scale = isViewingLevel ? 1 : Math.max(0.5, 0.85 - distanceFromCurrent * 0.08)
              
              // Opacity and effects - fade into infinity
              const opacity = isViewingLevel ? 1 : Math.max(0.25, 1 - distanceFromCurrent * 0.15)
              const brightness = isViewingLevel ? 1 : Math.max(0.5, 1 - distanceFromCurrent * 0.12)
              const blur = isViewingLevel ? 0 : Math.min(1.5, distanceFromCurrent * 0.35)
              
              return (
                <div
                  key={level.level}
                  className="absolute transition-all duration-500 ease-out"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `translateY(-${baseY}px) rotateX(${rotateX}deg) translateZ(${translateZ}px) scale(${scale})`,
                    transformOrigin: 'center center',
                    opacity,
                    filter: `brightness(${brightness}) blur(${blur}px)`,
                    zIndex: 100 - distanceFromCurrent,
                    bottom: '30px',
                    pointerEvents: isViewingLevel ? 'auto' : 'none',
                  }}
                >
                  <div style={{ pointerEvents: isViewingLevel ? 'auto' : 'none' }}>
                    <div className="flex flex-col items-center justify-center">
                      {/* Level label */}
                      <div 
                        className="flex flex-row items-center justify-center gap-2 px-3 py-1 rounded-t-sm"
                        style={{ 
                          background: isViewingLevel 
                            ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' 
                            : 'rgba(251, 191, 36, 0.8)',
                        }}
                      >
                        <span className={`${isViewingLevel ? 'text-sm' : 'text-xs'} text-amber-900 font-medium`}>
                          Step {level.level}:
                        </span>
                        <span className={`text-amber-900 font-bold ${isViewingLevel ? 'text-lg' : 'text-sm'}`}>
                          {level.multiplier.toFixed(2)}x
                        </span>
                      </div>
                      
                      {/* Tiles container */}
                      <div 
                        className={`${isViewingLevel ? 'rounded-lg p-4' : 'rounded-md p-2'}`}
                        style={{
                          background: 'rgba(15, 15, 25, 0.9)',
                          border: isViewingLevel ? '3px solid #fbbf24' : '2px solid rgba(251, 191, 36, 0.5)',
                        }}
                      >
                        <div className={`flex flex-row items-center justify-center ${isViewingLevel ? 'gap-3' : 'gap-1.5'}`}>
                          {level.tiles.map((tile) => {
                            const isPlayerHere = playerPosition.level === level.level && playerPosition.tileIndex === tile.id
                            
                            // For upcoming levels - smaller arch tiles
                            if (!isViewingLevel) {
                              return (
                                <div
                                  key={tile.id}
                                  className="rounded-t-full"
                                  style={{
                                    width: '28px',
                                    height: '36px',
                                    background: 'linear-gradient(180deg, rgba(147, 197, 253, 0.6) 0%, rgba(96, 165, 250, 0.4) 100%)',
                                    border: '1.5px solid rgba(255, 255, 255, 0.4)',
                                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2)',
                                  }}
                                />
                              )
                            }
                            
                            // Current level - full glass tiles
                            return (
                              <button
                                key={tile.id}
                                onClick={() => handleTileSelect(actualIndex, tile.id)}
                                disabled={!isCurrentLevel || level.isCompleted || isAnimating || gameState !== 'playing'}
                                className={`
                                  relative rounded-t-full p-2
                                  ${isCurrentLevel && !level.isCompleted && gameState === 'playing' 
                                    ? 'cursor-pointer hover:brightness-110 hover:scale-105 active:scale-95' 
                                    : 'cursor-default'}
                                `}
                                style={{
                                  width: '60px',
                                  height: '80px',
                                  background: tile.isRevealed
                                    ? tile.isDeath
                                      ? 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)'
                                      : 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)'
                                    : 'linear-gradient(180deg, rgba(147, 197, 253, 0.8) 0%, rgba(96, 165, 250, 0.6) 100%)',
                                  border: tile.isRevealed 
                                    ? '2px solid rgba(255, 255, 255, 0.5)' 
                                    : '2px solid rgba(255, 255, 255, 0.6)',
                                  boxShadow: tile.isRevealed 
                                    ? 'none' 
                                    : 'inset 0 4px 8px rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.3)',
                                  transition: 'transform 0.2s ease-out, filter 0.2s ease-out',
                                }}
                              >
                                <div className="flex flex-col items-center justify-center h-full">
                                  {tile.isRevealed ? (
                                    <span className="text-3xl">
                                      {tile.isDeath ? '💔' : '✓'}
                                    </span>
                                  ) : (
                                    <div className="flex flex-col items-center gap-1">
                                      <GlassIcon size={32} />
                                      <span className="text-[9px] text-white/90 font-bold tracking-tight">GLASS</span>
                                    </div>
                                  )}
                                </div>

                                {isPlayerHere && !tile.isDeath && (
                                  <div 
                                    className="absolute left-1/2 -translate-x-1/2"
                                    style={{ 
                                      top: '-36px',
                                      fontSize: '28px',
                                      animation: 'bounce 0.5s ease-out',
                                    }}
                                  >
                                    🏃
                                  </div>
                                )}

                                {isPlayerHere && tile.isDeath && (
                                  <div 
                                    className="absolute left-1/2"
                                    style={{ 
                                      top: '-36px',
                                      fontSize: '28px',
                                      animation: 'fall 0.6s ease-in forwards',
                                    }}
                                  >
                                    🏃
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div 
          className={`p-4 flex flex-col gap-3 ${gameState !== 'playing' ? 'invisible' : ''}`}
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(10, 10, 20, 0.9) 100%)',
          }}
        >
          <div className="text-center text-amber-200/70 text-base font-medium">
            Bet: {betAmount} USDC
          </div>
          
          <button
            onClick={currentLevel > 1 ? handleCashOut : undefined}
            disabled={currentLevel <= 1 || gameState !== 'playing'}
            className={`w-full py-4 rounded-xl font-semibold text-base ${
              currentLevel > 1 && gameState === 'playing'
                ? 'hover:brightness-110 active:scale-[0.98]'
                : 'opacity-40 cursor-not-allowed'
            }`}
            style={{
              background: currentLevel > 1 && gameState === 'playing'
                ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                : 'rgba(30, 30, 50, 0.8)',
              border: '2px solid rgba(255, 180, 100, 0.3)',
              color: currentLevel > 1 ? '#78350f' : 'white',
              fontWeight: currentLevel > 1 ? 700 : 500,
              transition: 'all 0.2s ease-out',
              boxShadow: currentLevel > 1 ? '0 4px 20px rgba(251, 191, 36, 0.4)' : 'none',
            }}
          >
            🏆 Survive ({toWin} USDC)
          </button>
        </div>
      </div>

      {/* Game Over - ELIMINATED */}
      {gameState === 'lost' && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-50"
          style={{
            backgroundImage: 'linear-gradient(rgba(10, 10, 18, 0.92), rgba(10, 10, 18, 0.92)), url(/bg.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <div className="text-8xl mb-6">💔</div>
          <h2 className="text-5xl font-bold text-red-400 mb-4 tracking-wider">ELIMINATED</h2>
          <div className="text-center mb-6">
            <p className="text-xl text-amber-200/70">The glass shattered</p>
            <p className="text-xl text-amber-200/70">at Step {currentLevel}</p>
          </div>
          <p className="text-lg text-amber-200/50 text-center mb-10">
            Final: <span className="text-white font-bold text-3xl">{totalMultiplier.toFixed(2)}x</span>
          </p>
          <button
            onClick={handleRestart}
            className="px-10 py-4 rounded-xl font-bold text-lg hover:brightness-110 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              border: '2px solid rgba(255, 180, 100, 0.4)',
              color: '#78350f',
              transition: 'all 0.2s ease-out',
              boxShadow: '0 4px 20px rgba(251, 191, 36, 0.4)',
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Win - SURVIVED */}
      {gameState === 'won' && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-50"
          style={{
            backgroundImage: 'linear-gradient(rgba(10, 10, 18, 0.88), rgba(10, 10, 18, 0.88)), url(/bg.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <div className="text-8xl mb-6">🏆</div>
          <h2 className="text-5xl font-bold text-amber-400 mb-4 tracking-wider">SURVIVED!</h2>
          <div className="text-center mb-6">
            <p className="text-xl text-amber-200/70">You crossed</p>
            <p className="text-xl text-amber-200/70">{currentLevel - 1} glass panels</p>
          </div>
          <p className="text-5xl font-bold text-white mb-3">
            {totalMultiplier.toFixed(2)}x
          </p>
          <p className="text-2xl text-amber-400 mb-10">
            Won: {toWin} USDC
          </p>
          <button
            onClick={handleRestart}
            className="px-10 py-4 rounded-xl font-bold text-lg hover:brightness-110 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              border: '2px solid rgba(255, 180, 100, 0.4)',
              color: '#78350f',
              transition: 'all 0.2s ease-out',
              boxShadow: '0 4px 20px rgba(251, 191, 36, 0.4)',
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
            transform: translateX(-50%) translateY(150px) rotate(180deg);
            opacity: 0;
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(-12px);
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
