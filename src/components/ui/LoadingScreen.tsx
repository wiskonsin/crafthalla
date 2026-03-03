import { useState, useEffect } from 'react'

const LOADING_DURATION = 1500
const FADE_DURATION = 400

export function LoadingScreen() {
  const [visible, setVisible] = useState(true)
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    const hideTimer = setTimeout(() => setVisible(false), LOADING_DURATION)
    return () => clearTimeout(hideTimer)
  }, [])

  useEffect(() => {
    if (!visible) {
      const unmountTimer = setTimeout(() => setMounted(false), FADE_DURATION)
      return () => clearTimeout(unmountTimer)
    }
  }, [visible])

  if (!mounted) return null

  return (
    <div
      className="loading-screen"
      style={{
        position: 'absolute',
        inset: 0,
        background: '#1a1a2e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease-out',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: '4px solid #333',
          borderTopColor: '#ffcc00',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ marginTop: 24, color: '#888', fontFamily: 'monospace' }}>
        Loading physics...
      </p>
    </div>
  )
}
