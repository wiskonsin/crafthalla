import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { useGameStore } from '../../stores/useGameStore'

export function GeneratorPanel() {
  const selectedGeneratorId = useGameStore((s) => s.selectedGeneratorId)
  const setSelectedGenerator = useGameStore((s) => s.setSelectedGenerator)
  const buildings = useBuildingsStore((s) => s.buildings)

  const generator = selectedGeneratorId
    ? buildings.find((b) => b.id === selectedGeneratorId && b.type === 'generator')
    : null

  if (!generator) return null

  const turretsInBase = buildings.filter(
    (b) => b.type === 'turret' && b.baseId === generator.baseId
  ).length

  return (
    <div
      className="rts-panel rts-hud"
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        padding: '16px 20px',
        minWidth: 200,
        zIndex: 10,
      }}
    >
      <div className="rts-panel-title">Generator selected</div>
      <div style={{ fontSize: 12, color: 'rgba(180,210,240,0.9)', marginBottom: 4 }}>
        HP: {Math.floor(generator.hp)} / {Math.floor(generator.maxHp)}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(150,200,255,0.8)', marginBottom: 12 }}>
        Powering {turretsInBase} turret(s)
      </div>
      <button className="rts-btn" onClick={() => setSelectedGenerator(null)} style={{ width: '100%' }}>
        Close
      </button>
    </div>
  )
}
