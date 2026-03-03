import { memo } from 'react'
import { RigidBody } from '@react-three/rapier'
import { useBuildingsStore } from '../../stores/useBuildingsStore'

interface WallProps {
  id: string
  position: [number, number, number]
  rotation: number
  hp: number
  maxHp: number
}

export const Wall = memo(function Wall({ id, position, rotation, hp, maxHp }: WallProps) {
  const buildings = useBuildingsStore((s) => s.buildings)

  const isHorizontal = Math.abs(rotation % Math.PI) < 0.01

  const hasNeighborA = buildings.some(
    (b) =>
      b.type === 'wall' &&
      b.id !== id &&
      Math.abs(b.rotation! - rotation) < 0.01 &&
      (isHorizontal
        ? Math.abs(b.position.z - position[2]) < 0.3 && Math.abs(b.position.x - (position[0] + 1)) < 0.3
        : Math.abs(b.position.x - position[0]) < 0.3 && Math.abs(b.position.z - (position[2] + 1)) < 0.3)
  )
  const hasNeighborB = buildings.some(
    (b) =>
      b.type === 'wall' &&
      b.id !== id &&
      Math.abs(b.rotation! - rotation) < 0.01 &&
      (isHorizontal
        ? Math.abs(b.position.z - position[2]) < 0.3 && Math.abs(b.position.x - (position[0] - 1)) < 0.3
        : Math.abs(b.position.x - position[0]) < 0.3 && Math.abs(b.position.z - (position[2] - 1)) < 0.3)
  )

  const wallWidth = 1.1
  const wallHeight = 1.4
  const wallDepth = 0.35

  const hpPercent = maxHp > 0 ? hp / maxHp : 1

  return (
    <RigidBody
      type="fixed"
      position={position}
      colliders="cuboid"
      userData={{ type: 'building', id }}
    >
      <group rotation={[0, rotation, 0]}>
        <mesh position={[0, wallHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[wallWidth, wallHeight, wallDepth]} />
          <meshStandardMaterial
            color="#7a7a7a"
            roughness={0.85}
            metalness={0.15}
          />
        </mesh>

        {/* Top rail */}
        <mesh position={[0, wallHeight + 0.06, 0]} castShadow receiveShadow>
          <boxGeometry args={[wallWidth, 0.12, wallDepth + 0.08]} />
          <meshStandardMaterial color="#5a5a5a" roughness={0.7} metalness={0.3} />
        </mesh>

        {/* Pillars on ends (only if no neighbor) */}
        {!hasNeighborB && (
          <mesh position={[-wallWidth / 2, wallHeight / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.2, wallHeight + 0.24, wallDepth + 0.12]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.6} metalness={0.4} />
          </mesh>
        )}
        {!hasNeighborA && (
          <mesh position={[wallWidth / 2, wallHeight / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.2, wallHeight + 0.24, wallDepth + 0.12]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.6} metalness={0.4} />
          </mesh>
        )}
      </group>

      {/* HP bar */}
      {hpPercent < 1 && (
        <group position={[0, wallHeight + 0.5, 0]}>
          <mesh>
            <boxGeometry args={[1.2, 0.06, 0.03]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[-0.6 + hpPercent * 0.6, 0, 0.02]}>
            <boxGeometry args={[hpPercent * 1.2, 0.04, 0.02]} />
            <meshBasicMaterial color={hpPercent > 0.5 ? '#22c55e' : '#ef4444'} />
          </mesh>
        </group>
      )}
    </RigidBody>
  )
})
