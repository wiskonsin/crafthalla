import { useEffect } from 'react'
import { useBuildingsStore } from '../stores/useBuildingsStore'
import { useResourcesStore } from '../stores/useResourcesStore'
import { TURRET_CONFIG, TURRET_AA_CONFIG } from '../config/constants'

export function useTurretEnergyConsumption() {
  useEffect(() => {
    const interval = setInterval(() => {
      const buildings = useBuildingsStore.getState().buildings
      const activeTurrets = buildings.filter(
        (b) => b.type === 'turret' && (b.enabled ?? true)
      )
      const activeAATurrets = buildings.filter(
        (b) => b.type === 'turret_aa' && (b.enabled ?? true)
      )
      const cost =
        activeTurrets.length * TURRET_CONFIG.idleEnergyPerSecond +
        activeAATurrets.length * TURRET_AA_CONFIG.idleEnergyPerSecond
      if (cost > 0) useResourcesStore.getState().spendEnergy(cost)
    }, 1000)

    return () => clearInterval(interval)
  }, [])
}
