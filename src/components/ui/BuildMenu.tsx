import { useEffect } from 'react'
import { useGameStore } from '../../stores/useGameStore'
import { useResourcesStore } from '../../stores/useResourcesStore'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { BUILDING_COSTS, TURRETS_PER_BASE, GENERATORS_PER_BASE } from '../../config/constants'
import type { BuildOption } from '../../types'

export function BuildMenu() {
  const selectedBuilding = useGameStore((s) => s.selectedBuilding)

  useEffect(() => {
    if (selectedBuilding) {
      document.body.classList.add('cursor-build')
    } else {
      document.body.classList.remove('cursor-build')
    }
    return () => document.body.classList.remove('cursor-build')
  }, [selectedBuilding])
  const setSelectedBuilding = useGameStore((s) => s.setSelectedBuilding)
  const metal = useResourcesStore((s) => s.metal)
  const energy = useResourcesStore((s) => s.energy)
  const buildings = useBuildingsStore((s) => s.buildings)
  const bases = useBuildingsStore((s) => s.bases)

  const generatorCount = buildings.filter((b) => b.type === 'generator').length
  const turretsAtLimit = bases.every((base) =>
    buildings.filter((b) => b.baseId === base.id && (b.type === 'turret' || b.type === 'turret_aa')).length >= TURRETS_PER_BASE
  )
  const generatorsAtLimit = bases.every((base) =>
    buildings.filter((b) => b.baseId === base.id && b.type === 'generator').length >= GENERATORS_PER_BASE
  )
  const noElectricity = generatorCount === 0

  const items: { type: BuildOption; label: string; cost: number; atLimit: boolean; noPower?: boolean }[] = [
    { type: 'generator', label: 'Generator', cost: BUILDING_COSTS.generator, atLimit: generatorsAtLimit },
    { type: 'turret', label: 'Turret', cost: BUILDING_COSTS.turret, atLimit: turretsAtLimit, noPower: noElectricity },
    { type: 'wall', label: 'Wall', cost: BUILDING_COSTS.wall, atLimit: false },
    { type: 'engineer', label: 'Engineer', cost: BUILDING_COSTS.engineer, atLimit: false },
    { type: 'subBase', label: 'Sub-base', cost: BUILDING_COSTS.subBase, atLimit: false },
  ]

  return (
    <div className="rts-buildbar">
      {items.map(({ type, label, cost, atLimit, noPower }) => {
        const affordable = metal >= cost && energy >= 0 && !atLimit && !noPower
        const isSelected = selectedBuilding === type
        return (
          <button
            key={type}
            className={`rts-buildbar-btn ${isSelected ? 'selected' : ''}`}
            onClick={() => setSelectedBuilding(isSelected ? null : type)}
            disabled={!affordable}
            title={noPower ? 'Build a generator first' : atLimit ? 'All bases at max' : undefined}
          >
            <span className="rts-buildbar-label">{label}</span>
            <span className="rts-buildbar-cost">{cost}M</span>
            {noPower && <span className="rts-buildbar-warn">!</span>}
            {atLimit && !noPower && <span className="rts-buildbar-warn">MAX</span>}
          </button>
        )
      })}
      {selectedBuilding && (
        <span className="rts-buildbar-hint">
          Click to place{selectedBuilding === 'wall' ? ' · Right-click to rotate' : ''}
        </span>
      )}
    </div>
  )
}
