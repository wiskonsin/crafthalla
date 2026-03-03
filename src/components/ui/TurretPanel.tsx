import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { useGameStore } from '../../stores/useGameStore'

export function TurretPanel() {
  const selectedTurretId = useGameStore((s) => s.selectedTurretId)
  const setSelectedTurret = useGameStore((s) => s.setSelectedTurret)
  const buildings = useBuildingsStore((s) => s.buildings)
  const toggleTurret = useBuildingsStore((s) => s.toggleTurret)

  const turret = selectedTurretId
    ? buildings.find((b) => b.id === selectedTurretId && (b.type === 'turret' || b.type === 'turret_aa'))
    : null

  if (!turret) return null
  const enabled = turret.enabled ?? true

  return (
    <div
      className="rts-panel rts-hud"
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        padding: '16px 20px',
        minWidth: 180,
        zIndex: 10,
      }}
    >
      <div className="rts-panel-title">
        Turret selected
      </div>
      <div style={{ fontSize: 12, color: 'rgba(180,210,240,0.9)', marginBottom: 8 }}>
        {enabled ? 'On' : 'Off'}
      </div>
      <button
        className="rts-btn"
        onClick={() => toggleTurret(turret.id)}
        style={{ width: '100%', marginBottom: 8 }}
      >
        {enabled ? 'Turn off' : 'Turn on'}
      </button>
      <button
        className="rts-btn"
        onClick={() => setSelectedTurret(null)}
        style={{ width: '100%' }}
      >
        Close
      </button>
    </div>
  )
}
