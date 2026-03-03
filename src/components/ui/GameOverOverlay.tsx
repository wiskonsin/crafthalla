import { useGameStore } from '../../stores/useGameStore'

export function GameOverOverlay() {
  const resetGame = useGameStore((s) => s.resetGame)
  const kills = useGameStore((s) => s.kills)
  const waveNumber = useGameStore((s) => s.waveNumber)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <h1
        style={{
          fontFamily: 'Orbitron',
          fontSize: 42,
          fontWeight: 800,
          color: '#ff4444',
          textShadow: '0 0 30px rgba(255, 68, 68, 0.6)',
          marginBottom: 12,
          letterSpacing: '0.1em',
        }}
      >
        GAME OVER
      </h1>
      <p
        style={{
          fontFamily: 'Rajdhani',
          fontSize: 18,
          color: 'rgba(220, 220, 255, 0.9)',
          marginBottom: 8,
        }}
      >
        Your base has been destroyed.
      </p>
      <p
        style={{
          fontFamily: 'Orbitron',
          fontSize: 14,
          color: 'rgba(0, 230, 118, 0.9)',
          marginBottom: 32,
        }}
      >
        Wave {waveNumber} · {kills} kills
      </p>
      <button
        className="rts-btn"
        onClick={resetGame}
        style={{
          padding: '16px 40px',
          fontSize: 14,
          letterSpacing: '0.12em',
        }}
      >
        Play Again
      </button>
    </div>
  )
}
