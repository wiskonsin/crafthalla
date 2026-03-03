import { useRef } from 'react'
import { RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useUnitsStore } from '../../stores/useUnitsStore'
import { useProjectilesStore } from '../../stores/useProjectilesStore'
import { PROJECTILE_SPEED } from '../../config/constants'

const LEGACY_DAMAGE = 9999

interface ProjectileProps {
  id: string
  position: [number, number, number]
  targetEnemyId: string
}

export function Projectile({ id, position, targetEnemyId }: ProjectileProps) {
  const rigidBodyRef = useRef<React.ComponentRef<typeof RigidBody>>(null)
  const removeProjectile = useProjectilesStore((s) => s.removeProjectile)
  const damageEnemy = useUnitsStore((s) => s.damageEnemy)
  const getEnemy = useUnitsStore((s) => s.getEnemy)
  const enemyPositions = useUnitsStore((s) => s.enemyPositions)

  const handleCollision = (payload: unknown) => {
    const p = payload as { other: { rigidBody?: { userData?: unknown } } }
    const other = p.other.rigidBody?.userData as { type?: string; id?: string } | undefined
    if (other?.type === 'enemy' && other?.id === targetEnemyId) {
      damageEnemy(targetEnemyId, LEGACY_DAMAGE)
      removeProjectile(id)
    }
  }

  useFrame(() => {
    const body = rigidBodyRef.current
    if (!body) return

    const targetPos = enemyPositions[targetEnemyId]
    const enemy = getEnemy(targetEnemyId)
    if (!targetPos || !enemy) {
      removeProjectile(id)
      return
    }

    const t = body.translation()
    const dx = targetPos.x - t.x
    const dz = targetPos.z - t.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist < 1.2) {
      damageEnemy(targetEnemyId, LEGACY_DAMAGE)
      removeProjectile(id)
      return
    }

    const speed = PROJECTILE_SPEED
    const vx = (dx / dist) * speed
    const vz = (dz / dist) * speed
    body.setLinvel({ x: vx, y: 0, z: vz }, true)
  })

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={position}
      colliders="ball"
      args={[0.3]}
      userData={{ type: 'projectile', id, targetEnemyId }}
      onCollisionEnter={handleCollision}
      linearDamping={0}
      gravityScale={0}
      ccd
    >
      <group>
        <mesh>
          <sphereGeometry args={[0.35, 8, 6]} />
          <meshStandardMaterial
            color="#ffdd44"
            emissive="#ff6600"
            emissiveIntensity={0.9}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.5, 6, 4]} />
          <meshBasicMaterial
            color="#ff8800"
            transparent
            opacity={0.35}
          />
        </mesh>
      </group>
    </RigidBody>
  )
}
