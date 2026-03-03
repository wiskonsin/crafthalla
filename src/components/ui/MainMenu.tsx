import { useGameStore } from '../../stores/useGameStore'

export function MainMenu() {
  const openCustomSetup = useGameStore((s) => s.openCustomSetup)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #0a0e1a 0%, #1a1a2e 50%, #0d1220 100%)',
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
          fontSize: 48,
          fontWeight: 800,
          color: '#00e5ff',
          textShadow: '0 0 40px rgba(0, 229, 255, 0.5)',
          marginBottom: 12,
          letterSpacing: '0.1em',
        }}
      >
        CRAFTHALLA
      </h1>
      <p
        style={{
          fontFamily: 'Rajdhani',
          fontSize: 16,
          color: 'rgba(180, 210, 255, 0.8)',
          marginBottom: 48,
          letterSpacing: '0.05em',
        }}
      >
        Defend your base. Build turrets. Survive the waves.
      </p>
      <button
        className="rts-btn"
        onClick={openCustomSetup}
        style={{
          padding: '20px 60px',
          fontSize: 18,
          letterSpacing: '0.2em',
          fontWeight: 700,
        }}
      >
        START
      </button>
      <p
        style={{
          marginTop: 48,
          fontFamily: 'Rajdhani',
          fontSize: 13,
          color: 'rgba(140, 160, 190, 0.6)',
          letterSpacing: '0.04em',
        }}
      >
        Created by{' '}
        <a
          href="https://x.com/techhalla"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#00b4ff',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          @techhalla
        </a>
      </p>
    </div>
  )
}
