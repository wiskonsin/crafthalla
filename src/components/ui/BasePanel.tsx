import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { useGameStore } from '../../stores/useGameStore'
import { useHarvestersStore } from '../../stores/useHarvestersStore'
import { useResourcesStore } from '../../stores/useResourcesStore'
import { useFloatingTextsStore } from '../../stores/useFloatingTextsStore'
import { TURRETS_PER_BASE, GENERATORS_PER_BASE, HARVESTER_CONFIG } from '../../config/constants'

export function BasePanel() {
  const selectedBaseId = useGameStore((s) => s.selectedBaseId)
  const setSelectedBase = useGameStore((s) => s.setSelectedBase)
  const buildings = useBuildingsStore((s) => s.buildings)
  const bases = useBuildingsStore((s) => s.bases)
  const harvesters = useHarvestersStore((s) => s.harvesters)
  const addHarvester = useHarvestersStore((s) => s.addHarvester)

  const base = selectedBaseId ? bases.find((b) => b.id === selectedBaseId) : null
  if (!base) return null

  const turrets = buildings.filter((b) => b.baseId === base.id && b.type === 'turret').length
  const generators = buildings.filter((b) => b.baseId === base.id && b.type === 'generator').length
  const subBase = base.isMain ? null : buildings.find((b) => b.baseId === base.id && b.type === 'subBase')
  const harvesterCount = harvesters.filter((h) => h.baseId === base.id).length
  const canBuildHarvester = harvesterCount < HARVESTER_CONFIG.maxPerBase

  const handleBuildHarvester = () => {
    if (!canBuildHarvester) return
    const canAfford = useResourcesStore.getState().spendMetal(HARVESTER_CONFIG.cost)
    if (!canAfford) return
    const spawnX = base.position.x + 2
    const spawnZ = base.position.z + 2
    const result = addHarvester(base.id, { x: spawnX, y: 0, z: spawnZ })
    if (!result) {
      useResourcesStore.getState().addMetal(HARVESTER_CONFIG.cost)
    } else {
      useFloatingTextsStore.getState().addText(`-${HARVESTER_CONFIG.cost}`, '#ff4444', { x: spawnX, y: 0.5, z: spawnZ })
    }
  }

  return (
    <div
      className="rts-panel rts-hud"
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        padding: '16px 20px',
        minWidth: 220,
        zIndex: 10,
      }}
    >
      <div className="rts-panel-title">
        {base.isMain ? 'Headquarters' : 'Sub-base'}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(180,210,240,0.9)', marginBottom: 4 }}>
        Turrets: {turrets} / {TURRETS_PER_BASE}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(180,210,240,0.9)', marginBottom: 4 }}>
        Generators: {generators} / {GENERATORS_PER_BASE}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(180,210,240,0.9)', marginBottom: 8 }}>
        Harvesters: {harvesterCount} / {HARVESTER_CONFIG.maxPerBase}
      </div>
      {subBase && (
        <div style={{ fontSize: 11, color: 'rgba(150,200,255,0.8)', marginBottom: 8 }}>
          HP: {Math.floor(subBase.hp)} / {Math.floor(subBase.maxHp)}
        </div>
      )}
      <button
        className="rts-btn"
        onClick={handleBuildHarvester}
        disabled={!canBuildHarvester}
        style={{
          width: '100%',
          marginBottom: 6,
          opacity: canBuildHarvester ? 1 : 0.4,
        }}
      >
        Build Harvester ({HARVESTER_CONFIG.cost} metal)
      </button>
      <button className="rts-btn" onClick={() => setSelectedBase(null)} style={{ width: '100%' }}>
        Close
      </button>
    </div>
  )
}
