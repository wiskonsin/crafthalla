import { useResourcesStore } from '../../stores/useResourcesStore'
import { useGameStore } from '../../stores/useGameStore'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { TURRETS_PER_BASE, GENERATORS_PER_BASE } from '../../config/constants'

export function StatsOverlay() {
  const toggleCoverageOverlay = useGameStore((s) => s.toggleCoverageOverlay)
  const buildings = useBuildingsStore((s) => s.buildings)
  const showCoverageOverlay = useGameStore((s) => s.showCoverageOverlay)
  const metal = useResourcesStore((s) => s.metal)
  const energy = useResourcesStore((s) => s.energy)
  const waveNumber = useGameStore((s) => s.waveNumber)
  const kills = useGameStore((s) => s.kills)
  const timeToNextWave = useGameStore((s) => s.timeToNextWave)
  const forceNextWave = useGameStore((s) => s.forceNextWave)
  const centralHp = useBuildingsStore((s) => s.centralHp)
  const centralMaxHp = useBuildingsStore((s) => s.centralMaxHp)

  const centralHpPercent = centralMaxHp > 0 ? centralHp / centralMaxHp : 1
  const hpBarClass = centralHpPercent > 0.5 ? 'hp' : centralHpPercent > 0.25 ? 'hp mid' : 'hp low'

  return (
    <div
      className="rts-panel rts-hud"
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        padding: '18px 22px',
        minWidth: 220,
        zIndex: 10,
      }}
    >
      <div className="rts-panel-title">Resources</div>
      <div className="rts-resource">
        <div className="rts-resource-icon metal" />
        <span className="rts-resource-value">{Math.floor(metal)}</span>
        <span style={{ fontSize: 10, color: 'rgba(200,220,255,0.6)', marginLeft: 4 }}>M</span>
      </div>
      <div className="rts-resource">
        <div className="rts-resource-icon energy" />
        <span className="rts-resource-value">{Math.floor(energy)}</span>
        <span style={{ fontSize: 10, color: 'rgba(200,220,255,0.6)', marginLeft: 4 }}>kW</span>
      </div>

      <div className="rts-panel-title" style={{ marginTop: 18 }}>Base integrity</div>
      <div className="rts-bar-container" style={{ width: 180 }}>
        <div
          className={`rts-bar-fill ${hpBarClass}`}
          style={{ width: `${centralHpPercent * 100}%` }}
        />
      </div>
      <div style={{ fontSize: 11, color: 'rgba(180,210,240,0.8)', marginTop: 3, fontFamily: 'Orbitron' }}>
        {centralHp} / {centralMaxHp}
      </div>

      <div className="rts-panel-title" style={{ marginTop: 18 }}>Population</div>
      <div style={{ fontSize: 12, color: 'rgba(180,210,240,0.9)', marginBottom: 4 }}>
        Turrets: {buildings.filter((b) => b.type === 'turret' || b.type === 'turret_aa').length} / {(buildings.filter((b) => b.type === 'subBase').length + 1) * TURRETS_PER_BASE}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(180,210,240,0.9)', marginBottom: 12 }}>
        Generators: {buildings.filter((b) => b.type === 'generator').length} / {(buildings.filter((b) => b.type === 'subBase').length + 1) * GENERATORS_PER_BASE}
      </div>

      <div className="rts-panel-title" style={{ marginTop: 18 }}>Wave / Kills</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
        <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Orbitron', color: '#fff' }}>{waveNumber}</span>
        <span style={{ fontSize: 14, color: 'rgba(0,230,118,0.9)', fontFamily: 'Orbitron' }}>{kills} kills</span>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(180,210,240,0.7)', marginTop: 2 }}>
        Next: {timeToNextWave}s
      </div>

      <button
        className="rts-btn"
        onClick={forceNextWave}
        style={{ marginTop: 18, width: '100%' }}
      >
        Spawn wave
      </button>

      <button
        className={`rts-btn ${showCoverageOverlay ? 'selected' : ''}`}
        onClick={toggleCoverageOverlay}
        style={{ marginTop: 12, width: '100%' }}
      >
        {showCoverageOverlay ? 'Hide coverage' : 'Show coverage'}
      </button>

    </div>
  )
}
