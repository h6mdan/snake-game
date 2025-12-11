import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;

const DIFFICULTIES = {
  EASY: {
    name: 'Easy',
    initialSpeed: 250,
    speedIncrement: 3,
    minSpeed: 100,
    powerUpChance: 0.25,
    color: '#00ff00',
  },
  MEDIUM: {
    name: 'Medium',
    initialSpeed: 180,
    speedIncrement: 5,
    minSpeed: 70,
    powerUpChance: 0.15,
    color: '#ffff00',
  },
  HARD: {
    name: 'Hard',
    initialSpeed: 120,
    speedIncrement: 8,
    minSpeed: 40,
    powerUpChance: 0.08,
    color: '#ff0000',
  },
};

const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const POWER_UP_TYPES = {
  SPEED_BOOST: {
    name: 'Speed Boost',
    color: '#ffff00',
    symbol: '⚡',
    duration: 5000,
  },
  SLOW_DOWN: {
    name: 'Slow Down',
    color: '#00ffff',
    symbol: '⏱',
    duration: 5000,
  },
  INVINCIBILITY: {
    name: 'Invincibility',
    color: '#ff00ff',
    symbol: '★',
    duration: 5000,
  },
  SCORE_MULTIPLIER: {
    name: 'Score x2',
    color: '#ffa500',
    symbol: '×2',
    duration: 8000,
  },
};

export default function Snake() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('idle');
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [highScore, setHighScore] = useState(0);
  const [activePowerUp, setActivePowerUp] = useState(null);

  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const directionRef = useRef(DIRECTIONS.RIGHT);
  const nextDirectionRef = useRef(DIRECTIONS.RIGHT);
  const foodRef = useRef({ x: 15, y: 10 });
  const speedRef = useRef(DIFFICULTIES.MEDIUM.initialSpeed);
  const gameLoopRef = useRef(null);
  const powerUpRef = useRef(null);
  const powerUpTimeoutRef = useRef(null);
  const baseSpeedRef = useRef(DIFFICULTIES.MEDIUM.initialSpeed);
  const scoreMultiplierRef = useRef(1);
  const isInvincibleRef = useRef(false);
  const difficultySettingsRef = useRef(DIFFICULTIES.MEDIUM);

  const generateFood = useCallback(() => {
    const snake = snakeRef.current;
    const powerUp = powerUpRef.current;
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
      (powerUp && powerUp.x === newFood.x && powerUp.y === newFood.y)
    );
    foodRef.current = newFood;
  }, []);

  const generatePowerUp = useCallback(() => {
    const spawnChance = difficultySettingsRef.current.powerUpChance;
    if (Math.random() > spawnChance) return;
    
    const snake = snakeRef.current;
    const food = foodRef.current;
    const types = Object.keys(POWER_UP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    
    let newPowerUp;
    do {
      newPowerUp = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        type,
      };
    } while (
      snake.some(segment => segment.x === newPowerUp.x && segment.y === newPowerUp.y) ||
      (food.x === newPowerUp.x && food.y === newPowerUp.y)
    );
    powerUpRef.current = newPowerUp;
  }, []);

  const activatePowerUp = useCallback((type) => {
    if (powerUpTimeoutRef.current) {
      clearTimeout(powerUpTimeoutRef.current);
    }

    const powerUp = POWER_UP_TYPES[type];
    setActivePowerUp({ type, name: powerUp.name, color: powerUp.color });

    switch (type) {
      case 'SPEED_BOOST':
        speedRef.current = Math.max(difficultySettingsRef.current.minSpeed, speedRef.current * 0.5);
        break;
      case 'SLOW_DOWN':
        speedRef.current = speedRef.current * 1.5;
        break;
      case 'INVINCIBILITY':
        isInvincibleRef.current = true;
        break;
      case 'SCORE_MULTIPLIER':
        scoreMultiplierRef.current = 2;
        break;
    }

    powerUpTimeoutRef.current = setTimeout(() => {
      setActivePowerUp(null);
      switch (type) {
        case 'SPEED_BOOST':
        case 'SLOW_DOWN':
          speedRef.current = baseSpeedRef.current;
          break;
        case 'INVINCIBILITY':
          isInvincibleRef.current = false;
          break;
        case 'SCORE_MULTIPLIER':
          scoreMultiplierRef.current = 1;
          break;
      }
    }, powerUp.duration);
  }, []);

  const resetGame = useCallback(() => {
    const diffSettings = DIFFICULTIES[difficulty];
    difficultySettingsRef.current = diffSettings;
    
    snakeRef.current = [{ x: 10, y: 10 }];
    directionRef.current = DIRECTIONS.RIGHT;
    nextDirectionRef.current = DIRECTIONS.RIGHT;
    speedRef.current = diffSettings.initialSpeed;
    baseSpeedRef.current = diffSettings.initialSpeed;
    scoreMultiplierRef.current = 1;
    isInvincibleRef.current = false;
    powerUpRef.current = null;
    setScore(0);
    setActivePowerUp(null);
    if (powerUpTimeoutRef.current) {
      clearTimeout(powerUpTimeoutRef.current);
    }
    generateFood();
  }, [generateFood, difficulty]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const snake = snakeRef.current;
    const food = foodRef.current;
    const powerUp = powerUpRef.current;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#0a1a0a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(
      food.x * CELL_SIZE + 2,
      food.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4
    );
    ctx.fillStyle = '#ff6666';
    ctx.fillRect(
      food.x * CELL_SIZE + 4,
      food.y * CELL_SIZE + 4,
      CELL_SIZE - 12,
      CELL_SIZE - 12
    );

    if (powerUp) {
      const powerUpType = POWER_UP_TYPES[powerUp.type];
      ctx.fillStyle = powerUpType.color;
      ctx.fillRect(
        powerUp.x * CELL_SIZE + 2,
        powerUp.y * CELL_SIZE + 2,
        CELL_SIZE - 4,
        CELL_SIZE - 4
      );
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        powerUpType.symbol,
        powerUp.x * CELL_SIZE + CELL_SIZE / 2,
        powerUp.y * CELL_SIZE + CELL_SIZE / 2
      );
    }

    snake.forEach((segment, index) => {
      if (isInvincibleRef.current) {
        ctx.fillStyle = index === 0 ? '#ff00ff' : '#cc00cc';
      } else {
        ctx.fillStyle = index === 0 ? '#33ff33' : '#22cc22';
      }
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );

      if (index === 0) {
        const direction = directionRef.current;
        ctx.fillStyle = '#000000';
        
        if (direction === DIRECTIONS.RIGHT) {
          ctx.fillRect(segment.x * CELL_SIZE + 13, segment.y * CELL_SIZE + 5, 3, 3);
          ctx.fillRect(segment.x * CELL_SIZE + 13, segment.y * CELL_SIZE + 12, 3, 3);
        } else if (direction === DIRECTIONS.LEFT) {
          ctx.fillRect(segment.x * CELL_SIZE + 4, segment.y * CELL_SIZE + 5, 3, 3);
          ctx.fillRect(segment.x * CELL_SIZE + 4, segment.y * CELL_SIZE + 12, 3, 3);
        } else if (direction === DIRECTIONS.UP) {
          ctx.fillRect(segment.x * CELL_SIZE + 5, segment.y * CELL_SIZE + 4, 3, 3);
          ctx.fillRect(segment.x * CELL_SIZE + 12, segment.y * CELL_SIZE + 4, 3, 3);
        } else if (direction === DIRECTIONS.DOWN) {
          ctx.fillRect(segment.x * CELL_SIZE + 5, segment.y * CELL_SIZE + 13, 3, 3);
          ctx.fillRect(segment.x * CELL_SIZE + 12, segment.y * CELL_SIZE + 13, 3, 3);
        }
      }
    });

    ctx.strokeStyle = '#33ff33';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }, []);

  const gameLoop = useCallback(() => {
    const snake = snakeRef.current;
    directionRef.current = nextDirectionRef.current;
    const direction = directionRef.current;

    const newHead = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y,
    };

    // Check wall collision
    if (
      newHead.x < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y < 0 ||
      newHead.y >= GRID_SIZE
    ) {
      setGameState('gameover');
      return;
    }

    // Create new snake with new head
    const newSnake = [newHead, ...snake];
    
    // Check if food was eaten
    const ateFood = newHead.x === foodRef.current.x && newHead.y === foodRef.current.y;
    
    if (ateFood) {
      // Snake grows - don't remove tail
      const points = 10 * scoreMultiplierRef.current;
      setScore(prev => {
        const newScore = prev + points;
        if (newScore > highScore) {
          setHighScore(newScore);
          // Save to localStorage instead
          try {
            localStorage.setItem('snakeHighScore', newScore.toString());
          } catch (err) {
            console.log('Failed to save high score:', err);
          }
        }
        return newScore;
      });
      generateFood();
      generatePowerUp();
      const diffSettings = difficultySettingsRef.current;
      baseSpeedRef.current = Math.max(
        diffSettings.minSpeed, 
        baseSpeedRef.current - diffSettings.speedIncrement
      );
      if (activePowerUp?.type !== 'SPEED_BOOST' && activePowerUp?.type !== 'SLOW_DOWN') {
        speedRef.current = baseSpeedRef.current;
      }
    } else {
      // Snake doesn't grow - remove tail
      newSnake.pop();
    }

    // NOW check for self-collision (after tail is removed if no food eaten)
    // Skip the head (index 0) when checking collision
    if (!isInvincibleRef.current) {
      for (let i = 1; i < newSnake.length; i++) {
        if (newSnake[i].x === newHead.x && newSnake[i].y === newHead.y) {
          setGameState('gameover');
          return;
        }
      }
    }

    // Check power-up collision
    const powerUp = powerUpRef.current;
    if (powerUp && newHead.x === powerUp.x && newHead.y === powerUp.y) {
      activatePowerUp(powerUp.type);
      powerUpRef.current = null;
    }

    snakeRef.current = newSnake;
    draw();
  }, [draw, generateFood, generatePowerUp, activatePowerUp, highScore, activePowerUp]);

  const startGame = useCallback(() => {
    resetGame();
    setGameState('playing');
  }, [resetGame]);

  useEffect(() => {
    if (gameState === 'playing') {
      const runLoop = () => {
        gameLoop();
        if (gameState === 'playing') {
          gameLoopRef.current = setTimeout(runLoop, speedRef.current);
        }
      };
      gameLoopRef.current = setTimeout(runLoop, speedRef.current);
    }

    return () => {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    const loadHighScore = () => {
      try {
        const saved = localStorage.getItem('snakeHighScore');
        if (saved) {
          setHighScore(parseInt(saved, 10));
        }
      } catch (error) {
        console.log('No saved high score yet');
      }
    };
    loadHighScore();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') {
        if (e.key === ' ' || e.key === 'Enter') {
          startGame();
        }
        return;
      }

      const currentDirection = directionRef.current;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDirection !== DIRECTIONS.DOWN) {
            nextDirectionRef.current = DIRECTIONS.UP;
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDirection !== DIRECTIONS.UP) {
            nextDirectionRef.current = DIRECTIONS.DOWN;
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDirection !== DIRECTIONS.RIGHT) {
            nextDirectionRef.current = DIRECTIONS.LEFT;
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDirection !== DIRECTIONS.LEFT) {
            nextDirectionRef.current = DIRECTIONS.RIGHT;
          }
          break;
        default:
          break;
      }
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, startGame]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <h1 
        className="text-3xl md:text-4xl font-bold mb-4 tracking-wider"
        style={{ 
          fontFamily: 'monospace',
          color: '#33ff33',
          textShadow: '0 0 10px #33ff33'
        }}
      >
        SNAKE
      </h1>

      <div 
        className="flex gap-6 mb-4 text-lg items-center"
        style={{ fontFamily: 'monospace', color: '#33ff33' }}
      >
        <div>SCORE: {String(score).padStart(4, '0')}</div>
        <div>HIGH: {String(highScore).padStart(4, '0')}</div>
        {gameState === 'playing' && (
          <div className="text-sm opacity-70">
            [{DIFFICULTIES[difficulty].name.toUpperCase()}]
          </div>
        )}
      </div>

      {activePowerUp && (
        <div 
          className="mb-2 px-4 py-2 rounded border-2 animate-pulse"
          style={{ 
            fontFamily: 'monospace',
            color: activePowerUp.color,
            borderColor: activePowerUp.color,
            backgroundColor: 'rgba(0,0,0,0.8)',
            boxShadow: `0 0 10px ${activePowerUp.color}`
          }}
        >
          ⚡ {activePowerUp.name.toUpperCase()} ACTIVE ⚡
        </div>
      )}

      <div 
        className="relative bg-black p-2 rounded"
        style={{ 
          boxShadow: '0 0 20px rgba(51, 255, 51, 0.3), inset 0 0 60px rgba(51, 255, 51, 0.1)'
        }}
      >
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="block"
        />

        {gameState !== 'playing' && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/90"
            style={{ fontFamily: 'monospace', color: '#33ff33' }}
          >
            {gameState === 'gameover' && (
              <div className="text-2xl mb-4 animate-pulse">GAME OVER</div>
            )}
            <div className="text-xl mb-4">
              {gameState === 'idle' ? 'SNAKE GAME' : `SCORE: ${score}`}
            </div>

            {gameState === 'idle' && (
              <div className="mb-6 w-64">
                <div className="text-sm mb-3 text-center opacity-70">SELECT DIFFICULTY</div>
                <div className="flex flex-col gap-2">
                  {Object.entries(DIFFICULTIES).map(([key, diff]) => (
                    <button
                      key={key}
                      onClick={() => setDifficulty(key)}
                      className="px-4 py-2 border-2 transition-all text-base tracking-wider"
                      style={{ 
                        fontFamily: 'monospace',
                        backgroundColor: difficulty === key ? '#33ff33' : 'transparent',
                        color: difficulty === key ? '#000' : '#33ff33',
                        borderColor: '#33ff33',
                        boxShadow: difficulty === key ? `0 0 15px ${diff.color}` : 'none'
                      }}
                    >
                      <span style={{ color: difficulty === key ? '#000' : diff.color }}>●</span> {diff.name.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {gameState === 'gameover' && (
              <div className="mb-4 text-sm opacity-70">
                Difficulty: {DIFFICULTIES[difficulty].name.toUpperCase()}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="px-6 py-2 border-2 border-[#33ff33] text-[#33ff33] hover:bg-[#33ff33] hover:text-black transition-colors text-lg tracking-wider"
                style={{ fontFamily: 'monospace' }}
              >
                {gameState === 'idle' ? 'START GAME' : 'PLAY AGAIN'}
              </button>
              {gameState === 'gameover' && (
                <button
                  onClick={() => setGameState('idle')}
                  className="px-6 py-2 border-2 border-[#33ff33] text-[#33ff33] hover:bg-[#33ff33] hover:text-black transition-colors text-lg tracking-wider"
                  style={{ fontFamily: 'monospace' }}
                >
                  MAIN MENU
                </button>
              )}
            </div>
            <div className="mt-4 text-sm opacity-70">
              {gameState === 'idle' ? 'PRESS SPACE OR ENTER' : 'PRESS SPACE OR ENTER TO PLAY AGAIN'}
            </div>
          </div>
        )}
      </div>

      <div 
        className="mt-6 text-center text-sm"
        style={{ fontFamily: 'monospace', color: '#33ff33', opacity: 0.7 }}
      >
        <div className="mb-2">USE ARROW KEYS OR WASD TO MOVE</div>
        <div className="flex justify-center gap-1">
          <div className="w-8 h-8 border border-[#33ff33] flex items-center justify-center">↑</div>
        </div>
        <div className="flex justify-center gap-1">
          <div className="w-8 h-8 border border-[#33ff33] flex items-center justify-center">←</div>
          <div className="w-8 h-8 border border-[#33ff33] flex items-center justify-center">↓</div>
          <div className="w-8 h-8 border border-[#33ff33] flex items-center justify-center">→</div>
        </div>
      </div>

      <div className="mt-6 md:hidden">
        <div className="flex justify-center mb-2">
          <button
            onTouchStart={() => {
              if (gameState === 'playing' && directionRef.current !== DIRECTIONS.DOWN) {
                nextDirectionRef.current = DIRECTIONS.UP;
              }
            }}
            className="w-16 h-16 border-2 border-[#33ff33] text-[#33ff33] text-2xl active:bg-[#33ff33] active:text-black"
          >
            ↑
          </button>
        </div>
        <div className="flex justify-center gap-2">
          <button
            onTouchStart={() => {
              if (gameState === 'playing' && directionRef.current !== DIRECTIONS.RIGHT) {
                nextDirectionRef.current = DIRECTIONS.LEFT;
              }
            }}
            className="w-16 h-16 border-2 border-[#33ff33] text-[#33ff33] text-2xl active:bg-[#33ff33] active:text-black"
          >
            ←
          </button>
          <button
            onTouchStart={() => {
              if (gameState === 'playing' && directionRef.current !== DIRECTIONS.UP) {
                nextDirectionRef.current = DIRECTIONS.DOWN;
              }
            }}
            className="w-16 h-16 border-2 border-[#33ff33] text-[#33ff33] text-2xl active:bg-[#33ff33] active:text-black"
          >
            ↓
          </button>
          <button
            onTouchStart={() => {
              if (gameState === 'playing' && directionRef.current !== DIRECTIONS.LEFT) {
                nextDirectionRef.current = DIRECTIONS.RIGHT;
              }
            }}
            className="w-16 h-16 border-2 border-[#33ff33] text-[#33ff33] text-2xl active:bg-[#33ff33] active:text-black"
          >
            →
          </button>
        </div>
      </div>

      <div 
        className="mt-8 text-xs"
        style={{ fontFamily: 'monospace', color: '#33ff33', opacity: 0.5 }}
      >
        © 1997 CLASSIC SNAKE
      </div>
    </div>
  );
}
