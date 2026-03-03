import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { useGameStore } from '../../stores/useGameStore'
import { Generator } from './Generator'
import { GeneratorParticles } from './GeneratorParticles'
import { PlasmaOrb } from './PlasmaOrb'
import { Turret } from './Turret'
import { SubBase } from './SubBase'
import { Wall } from './Wall'

export function BuildingsManager() {
  const buildings = useBuildingsStore((s) => s.buildings)
  const selectedTurretId = useGameStore((s) => s.selectedTurretId)
  const selectedGeneratorId = useGameStore((s) => s.selectedGeneratorId)
  const setSelectedTurret = useGameStore((s) => s.setSelectedTurret)
  const setSelectedGenerator = useGameStore((s) => s.setSelectedGenerator)

  return (
    <>
      {buildings.map((b) => {
        const y = b.type === 'generator' ? 0.75 : b.type === 'subBase' ? 1.2 : 0
        const pos: [number, number, number] = [b.position.x, y, b.position.z]

        if (b.type === 'wall') {
          return (
            <Wall
              key={b.id}
              id={b.id}
              position={pos}
              rotation={b.rotation ?? 0}
              hp={b.hp}
              maxHp={b.maxHp}
            />
          )
        }

        if (b.type === 'generator') {
          return (
            <group key={b.id}>
              <Generator
                id={b.id}
                position={pos}
                hp={b.hp}
                maxHp={b.maxHp}
                isSelected={selectedGeneratorId === b.id}
                onSelect={() => setSelectedGenerator(selectedGeneratorId === b.id ? null : b.id)}
              />
              <GeneratorParticles position={pos} baseId={b.baseId} />
              <PlasmaOrb position={pos} createdAt={b.createdAt} />
            </group>
          )
        }

        if (b.type === 'subBase') {
          return (
            <SubBase key={b.id} id={b.id} baseId={b.baseId} position={pos} hp={b.hp} maxHp={b.maxHp} />
          )
        }

        return (
          <Turret
            key={b.id}
            id={b.id}
            position={pos}
            hp={b.hp}
            maxHp={b.maxHp}
            enabled={b.enabled ?? true}
            isSelected={selectedTurretId === b.id}
            onSelect={() => setSelectedTurret(selectedTurretId === b.id ? null : b.id)}
            turretType={b.type === 'turret_aa' ? 'turret_aa' : 'turret'}
          />
        )
      })}
    </>
  )
}
