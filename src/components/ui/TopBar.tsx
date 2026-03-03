import { useResourcesStore } from '../../stores/useResourcesStore'
import { useGameStore } from '../../stores/useGameStore'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { useHarvestersStore } from '../../stores/useHarvestersStore'
import { openSettingsPanel } from './SettingsPanel'

export function TopBar() {
  const metal = useResourcesStore((s) => s.metal)
  const energy = useResourcesStore((s) => s.energy)
  const waveNumber = useGameStore((s) => s.waveNumber)
  const kills = useGameStore((s) => s.kills)
  const timeToNextWave = useGameStore((s) => s.timeToNextWave)
  const forceNextWave = useGameStore((s) => s.forceNextWave)
  const centralHp = useBuildingsStore((s) => s.centralHp)
  const centralMaxHp = useBuildingsStore((s) => s.centralMaxHp)
  const toggleCoverageOverlay = useGameStore((s) => s.toggleCoverageOverlay)
  const showCoverageOverlay = useGameStore((s) => s.showCoverageOverlay)
  const harvesterCount = useHarvestersStore((s) => s.harvesters.length)

  const hpPercent = centralMaxHp > 0 ? centralHp / centralMaxHp : 1
  const hpColor = hpPercent > 0.5 ? '#00e676' : hpPercent > 0.25 ? '#ffab00' : '#ff1744'

  return (
    <div className="rts-topbar">
      {/* Resources */}
      <div className="rts-topbar-section">
        <div className="rts-topbar-resource">
          <div className="rts-resource-icon metal" />
          <span className="rts-topbar-value">{Math.floor(metal)}</span>
          <span className="rts-topbar-label">M</span>
        </div>
        <div className="rts-topbar-resource">
          <div className="rts-resource-icon energy" />
          <span className="rts-topbar-value">{Math.floor(energy)}</span>
          <span className="rts-topbar-label">kW</span>
        </div>
      </div>

      <div className="rts-topbar-divider" />

      {/* Base HP */}
      <div className="rts-topbar-section">
        <span className="rts-topbar-label">BASE</span>
        <div className="rts-topbar-hp-bar">
          <div
            className="rts-topbar-hp-fill"
            style={{ width: `${hpPercent * 100}%`, background: hpColor }}
          />
        </div>
        <span className="rts-topbar-value" style={{ fontSize: 11, minWidth: 70 }}>
          {Math.floor(centralHp)}/{Math.floor(centralMaxHp)}
        </span>
      </div>

      <div className="rts-topbar-divider" />

      {/* Wave info */}
      <div className="rts-topbar-section">
        <span className="rts-topbar-label">WAVE</span>
        <span className="rts-topbar-value">{waveNumber}</span>
        <span className="rts-topbar-kills">{kills} kills</span>
        {harvesterCount > 0 && (
          <>
            <span className="rts-topbar-label" style={{ marginLeft: 8 }}>Trucks</span>
            <span className="rts-topbar-value">{harvesterCount}</span>
          </>
        )}
        <span className="rts-topbar-label" style={{ marginLeft: 8 }}>
          {timeToNextWave === -1
            ? 'Build a turret'
            : timeToNextWave === -2
              ? 'Active'
              : `Next ${timeToNextWave}s`}
        </span>
      </div>

      <div className="rts-topbar-divider" />

      {/* Actions */}
      <div className="rts-topbar-section">
        <button className="rts-topbar-btn" onClick={forceNextWave}>
          Spawn
        </button>
        <button
          className={`rts-topbar-btn ${showCoverageOverlay ? 'active' : ''}`}
          onClick={toggleCoverageOverlay}
        >
          Coverage
        </button>
      </div>

      <div className="rts-topbar-divider" />

      <div className="rts-topbar-section">
        <button className="rts-topbar-btn" onClick={openSettingsPanel}>
          MENU
        </button>
      </div>
    </div>
  )
}
