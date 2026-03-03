import { useState, useRef, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { useGameStore } from '../../stores/useGameStore'

let openSettingsFn: (() => void) | null = null
export function openSettingsPanel() {
  openSettingsFn?.()
}

export function SettingsPanel() {
  const [open, setOpen] = useState(false)
  const openCb = useCallback(() => setOpen(true), [])
  useEffect(() => { openSettingsFn = openCb; return () => { openSettingsFn = null } }, [openCb])
  const showFps = useSettingsStore((s) => s.showFps)
  const setShowFps = useSettingsStore((s) => s.setShowFps)
  const gameState = useGameStore((s) => s.gameState)

  const handleEndGame = () => {
    setOpen(false)
    useGameStore.getState().resetGame()
    useGameStore.getState().setGameState('menu')
  }

  return (
    <>
      {showFps && gameState === 'playing' && <FpsCounter />}

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="rts-panel"
            style={{ minWidth: 300, padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rts-panel-title" style={{ marginBottom: 20 }}>
              Settings
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showFps}
                onChange={(e) => setShowFps(e.target.checked)}
                style={{ accentColor: '#00e5ff' }}
              />
              <span style={{ fontSize: 13 }}>Show FPS</span>
            </label>

            {gameState === 'playing' && (
              <button
                className="rts-btn"
                onClick={handleEndGame}
                style={{
                  width: '100%',
                  marginBottom: 12,
                  padding: '12px 0',
                  fontSize: 12,
                  color: '#ff6666',
                  borderColor: 'rgba(255,100,100,0.4)',
                }}
              >
                End Game & Return to Menu
              </button>
            )}

            <button
              className="rts-btn"
              onClick={() => setOpen(false)}
              style={{ width: '100%', padding: '10px 0', fontSize: 12 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function FpsCounter() {
  const ref = useRef<HTMLDivElement>(null)
  const frames = useRef(0)
  const lastTime = useRef(performance.now())

  useEffect(() => {
    let raf: number
    const tick = () => {
      frames.current++
      const now = performance.now()
      if (now - lastTime.current >= 1000) {
        if (ref.current) {
          ref.current.textContent = `${frames.current} FPS`
        }
        frames.current = 0
        lastTime.current = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 16,
        right: 110,
        zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        color: '#00e5ff',
        padding: '4px 10px',
        borderRadius: 5,
        fontSize: 11,
        fontFamily: 'Orbitron, monospace',
        fontWeight: 600,
        pointerEvents: 'none',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(0,180,255,0.2)',
      }}
    >
      -- FPS
    </div>
  )
}
