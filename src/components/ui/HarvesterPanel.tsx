import { useGameStore } from '../../stores/useGameStore'
import { useHarvestersStore } from '../../stores/useHarvestersStore'
import { useResourcesStore } from '../../stores/useResourcesStore'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { HARVESTER_CONFIG } from '../../config/constants'
import { HarvesterJourneyView } from './HarvesterJourneyView'

const STATE_LABELS: Record<string, string> = {
  idle: 'Idle',
  moving_to_rock: 'Moving to resource',
  gathering: 'Gathering minerals',
  returning: 'Returning to base',
  depositing: 'Depositing minerals',
}

function NormalPanel() {
  const selectedHarvesterId = useGameStore((s) => s.selectedHarvesterId)
  const setSelectedHarvester = useGameStore((s) => s.setSelectedHarvester)
  const toggleHarvesterPov = useGameStore((s) => s.toggleHarvesterPov)
  const harvesters = useHarvestersStore((s) => s.harvesters)

  const harvester = selectedHarvesterId
    ? harvesters.find((h) => h.id === selectedHarvesterId)
    : null

  if (!harvester) return null

  const cargoPercent = harvester.cargo / HARVESTER_CONFIG.carryCapacity
  const stateLabel = STATE_LABELS[harvester.state] || harvester.state

  return (
    <div
      className="rts-panel rts-hud"
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        padding: '16px 20px',
        minWidth: 220,
        zIndex: 30,
      }}
    >
      <div className="rts-panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#c4a832' }}>&#9726;</span>
        Harvester
      </div>
      <div style={{ fontSize: 12, color: 'rgba(180,210,240,0.9)', marginBottom: 4 }}>
        Status: <span style={{ color: '#00e676', fontWeight: 600 }}>{stateLabel}</span>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(180,210,240,0.9)', marginBottom: 4 }}>
        Cargo: {Math.floor(harvester.cargo)} / {HARVESTER_CONFIG.carryCapacity}
      </div>
      <div style={{ marginBottom: 10, background: 'rgba(0,0,0,0.4)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${cargoPercent * 100}%`, height: '100%', background: 'linear-gradient(90deg, #22aacc, #44ddff)', borderRadius: 4, transition: 'width 0.3s ease' }} />
      </div>
      <button className="rts-btn" onClick={toggleHarvesterPov} style={{ width: '100%', marginBottom: 6, background: 'linear-gradient(180deg, #2266aa, #114488)' }}>
        POV Camera
      </button>
      <button className="rts-btn" onClick={() => setSelectedHarvester(null)} style={{ width: '100%' }}>
        Close
      </button>
    </div>
  )
}

function PovHud() {
  const selectedHarvesterId = useGameStore((s) => s.selectedHarvesterId)
  const harvesterPovMode = useGameStore((s) => s.harvesterPovMode)
  const toggleHarvesterPov = useGameStore((s) => s.toggleHarvesterPov)
  const harvesters = useHarvestersStore((s) => s.harvesters)
  const metal = useResourcesStore((s) => s.metal)
  const energy = useResourcesStore((s) => s.energy)
  const waveNumber = useGameStore((s) => s.waveNumber)
  const kills = useGameStore((s) => s.kills)
  const timeToNextWave = useGameStore((s) => s.timeToNextWave)
  const centralHp = useBuildingsStore((s) => s.centralHp)
  const centralMaxHp = useBuildingsStore((s) => s.centralMaxHp)

  const harvester = selectedHarvesterId
    ? harvesters.find((h) => h.id === selectedHarvesterId)
    : null

  const hpPercent = centralMaxHp > 0 ? centralHp / centralMaxHp : 1
  const hpColor = hpPercent > 0.5 ? '#00e676' : hpPercent > 0.25 ? '#ffab00' : '#ff1744'
  const stateLabel = harvester ? (STATE_LABELS[harvester.state] || harvester.state) : ''
  const cargoPercent = harvester ? harvester.cargo / HARVESTER_CONFIG.carryCapacity : 0

  const waveLabel = timeToNextWave === -1
    ? 'Waiting'
    : timeToNextWave === -2
      ? 'Active'
      : `Next ${timeToNextWave}s`

  return (
    <div
      className="rts-pov-hud"
      style={{
        transform: harvesterPovMode ? 'translateY(0)' : 'translateY(100%)',
        opacity: harvesterPovMode ? 1 : 0,
      }}
    >
      {/* Journey side-view */}
      {selectedHarvesterId && (
        <HarvesterJourneyView harvesterId={selectedHarvesterId} />
      )}

      {/* Stats bar */}
      <div className="rts-pov-hud-inner">
        <div className="rts-pov-section">
          <div className="rts-pov-stat">
            <div className="rts-resource-icon metal" />
            <span className="rts-pov-val">{Math.floor(metal)}</span>
            <span className="rts-pov-lbl">M</span>
          </div>
          <div className="rts-pov-stat">
            <div className="rts-resource-icon energy" />
            <span className="rts-pov-val">{Math.floor(energy)}</span>
            <span className="rts-pov-lbl">kW</span>
          </div>
        </div>

        <div className="rts-pov-divider" />

        <div className="rts-pov-section">
          <span className="rts-pov-lbl">BASE</span>
          <div className="rts-topbar-hp-bar" style={{ width: 60 }}>
            <div className="rts-topbar-hp-fill" style={{ width: `${hpPercent * 100}%`, background: hpColor }} />
          </div>
          <span className="rts-pov-val" style={{ fontSize: 10, minWidth: 55 }}>
            {Math.floor(centralHp)}/{Math.floor(centralMaxHp)}
          </span>
        </div>

        <div className="rts-pov-divider" />

        <div className="rts-pov-section">
          <span className="rts-pov-lbl">WAVE</span>
          <span className="rts-pov-val">{waveNumber}</span>
          <span className="rts-pov-lbl" style={{ marginLeft: 4 }}>{kills} kills</span>
          <span className="rts-pov-lbl" style={{ marginLeft: 6, color: 'rgba(0,212,255,0.7)' }}>{waveLabel}</span>
        </div>

        <div className="rts-pov-divider" />

        {harvester && (
          <div className="rts-pov-section">
            <span style={{ color: '#c4a832', fontSize: 14, marginRight: 4 }}>&#9726;</span>
            <span className="rts-pov-lbl">TRUCK</span>
            <span className="rts-pov-val" style={{ color: '#00e676', fontSize: 11 }}>{stateLabel}</span>
            <div style={{ width: 50, height: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 3, marginLeft: 6, overflow: 'hidden' }}>
              <div style={{ width: `${cargoPercent * 100}%`, height: '100%', background: 'linear-gradient(90deg, #22aacc, #44ddff)', borderRadius: 3, transition: 'width 0.3s ease' }} />
            </div>
            <span className="rts-pov-val" style={{ fontSize: 10, marginLeft: 4 }}>
              {Math.floor(harvester.cargo)}/{HARVESTER_CONFIG.carryCapacity}
            </span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        <button className="rts-pov-exit" onClick={toggleHarvesterPov}>
          EXIT POV
        </button>
      </div>
    </div>
  )
}

export function HarvesterPanel() {
  const harvesterPovMode = useGameStore((s) => s.harvesterPovMode)
  const selectedHarvesterId = useGameStore((s) => s.selectedHarvesterId)

  if (!selectedHarvesterId) return null

  return (
    <>
      {!harvesterPovMode && <NormalPanel />}
      <PovHud />
    </>
  )
}
