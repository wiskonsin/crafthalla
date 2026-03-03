import { useHarvestersStore } from '../../stores/useHarvestersStore'
import { Harvester } from './Harvester'

export function HarvesterManager() {
  const harvesters = useHarvestersStore((s) => s.harvesters)

  return (
    <group>
      {harvesters.map((h) => (
        <Harvester key={h.id} harvester={h} />
      ))}
    </group>
  )
}
