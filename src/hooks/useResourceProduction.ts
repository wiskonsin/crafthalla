import { useEffect } from 'react'
import { useBuildingsStore } from '../stores/useBuildingsStore'
import { useResourcesStore } from '../stores/useResourcesStore'
import { RESOURCE_PRODUCTION, ENERGY_CAP } from '../config/constants'

export function useResourceProduction() {
  useEffect(() => {
    const interval = setInterval(() => {
      const buildings = useBuildingsStore.getState().buildings
      const generators = buildings.filter((b) => b.type === 'generator')
      if (generators.length === 0) return

      const energy = useResourcesStore.getState().energy
      const production = RESOURCE_PRODUCTION.generator
      const totalEnergy = Math.min(ENERGY_CAP - energy, production.energy * generators.length)
      if (totalEnergy > 0) useResourcesStore.getState().addEnergy(totalEnergy)

      const metalMultiplier = energy > 0 ? Math.min(1, energy / 50) : 0
      const totalMetal = production.metal * generators.length * metalMultiplier
      if (totalMetal > 0) useResourcesStore.getState().addMetal(totalMetal)
    }, 1000)

    return () => clearInterval(interval)
  }, [])
}
