import { memo, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useUnitsStore } from '../../stores/useUnitsStore'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { useEngineersStore } from '../../stores/useEngineersStore'
import { useExplosionsStore } from '../../stores/useExplosionsStore'
import { useGameStore } from '../../stores/useGameStore'
import { useCustomConfigStore } from '../../stores/useCustomConfigStore'
import { useEnemyGlbStore } from '../../stores/useEnemyGlbStore'
import { GameCustomModel } from './GameFbxModel'
import { getSuspensionHeight, getMountainAvoidance } from '../../systems/terrainHeightmap'
import { isPositionVisible } from '../../lib/visibility'

interface EnemyProps {
  id: string
  position: [number, number, number]
  hp: number
  maxHp: number
}

const SPEED = 1.5
const BUILDING_DAMAGE = 40
const CENTRAL_DAMAGE = 50

export const Enemy = memo(function Enemy({ id, position, hp, maxHp }: EnemyProps) {
  const rigidBodyRef = useRef<React.ComponentRef<typeof RigidBody>>(null)
  const meshGroupRef = useRef<THREE.Group>(null)
  const customRotateRef = useRef<THREE.Group>(null)
  const bobRef = useRef(0)
  const updateEnemyPosition = useUnitsStore((s) => s.updateEnemyPosition)
  const removeEnemy = useUnitsStore((s) => s.removeEnemy)
  const damageCentral = useBuildingsStore((s) => s.damageCentral)
  const damageBuilding = useBuildingsStore((s) => s.damageBuilding)
  const addExplosion = useExplosionsStore((s) => s.addExplosion)
  const removeEngineer = useEngineersStore((s) => s.removeEngineer)

  const useCustomModels = useGameStore((s) => s.useCustomModels)
  const config = useCustomConfigStore((s) => s.config.enemy)
  const glbUrl = useEnemyGlbStore((s) => s.url)

  const handleCollision = useCallback(
    (payload: unknown) => {
      const p = payload as { other: { rigidBody?: { userData?: unknown } } }
      const other = p.other.rigidBody?.userData as { type?: string; id?: string } | undefined
      if (other?.type === 'engineer' && other?.id) {
        removeEngineer(other.id)
        return
      }
      if (other?.type === 'building' && other?.id) {
        const body = rigidBodyRef.current
        if (body) {
          const t = body.translation()
          addExplosion({ x: t.x, y: t.y, z: t.z })
        }
        damageBuilding(other.id, BUILDING_DAMAGE)
        removeEnemy(id)
        return
      }
      if (other?.type === 'central') {
        const body = rigidBodyRef.current
        if (body) {
          const t = body.translation()
          addExplosion({ x: t.x, y: t.y, z: t.z })
        }
        damageCentral(CENTRAL_DAMAGE)
        removeEnemy(id)
        return
      }
    },
    [damageBuilding, damageCentral, removeEnemy, removeEngineer, addExplosion, id]
  )

  useFrame((_, delta) => {
    const body = rigidBodyRef.current
    if (!body) return

    const t = body.translation()
    updateEnemyPosition(id, { x: t.x, y: t.y, z: t.z })

    const visible = isPositionVisible(t.x, t.z)
    if (meshGroupRef.current) {
      meshGroupRef.current.visible = visible
      bobRef.current += delta * 4
      meshGroupRef.current.position.y = Math.sin(bobRef.current) * 0.03
    }

    const HIT_RANGE = 1.6
    const buildings = useBuildingsStore.getState().buildings
    const centralHp = useBuildingsStore.getState().centralHp
    for (const b of buildings) {
      const bdx = t.x - b.position.x
      const bdz = t.z - b.position.z
      const bDist = Math.sqrt(bdx * bdx + bdz * bdz)
      const bRadius = b.type === 'wall' ? 1.0 : b.type === 'subBase' ? 2.0 : 1.4
      if (bDist < bRadius + HIT_RANGE * 0.5) {
        addExplosion({ x: t.x, y: t.y, z: t.z })
        damageBuilding(b.id, BUILDING_DAMAGE)
        removeEnemy(id)
        return
      }
    }
    if (centralHp > 0) {
      const cDist = Math.sqrt(t.x * t.x + t.z * t.z)
      if (cDist < 2.2 + HIT_RANGE * 0.5) {
        addExplosion({ x: t.x, y: t.y, z: t.z })
        damageCentral(CENTRAL_DAMAGE)
        removeEnemy(id)
        return
      }
    }

    const dx = -t.x
    const dz = -t.z
    const len = Math.sqrt(dx * dx + dz * dz) || 1
    const avoid = getMountainAvoidance(t.x, t.z, 0, 0)
    const mvx = (dx / len) * SPEED + avoid.x
    const mvz = (dz / len) * SPEED + avoid.z
    const terrainY = getSuspensionHeight(t.x, t.z)
    body.setLinvel({ x: mvx, y: (terrainY + 0.5 - t.y) * 4, z: mvz }, true)

    if (useCustomModels && glbUrl && customRotateRef.current) {
      const baseY = config.rotation?.[1] ?? 0
      const targetAngle = Math.atan2(dx, dz) + baseY
      const current = customRotateRef.current.rotation.y
      let diff = targetAngle - current
      while (diff > Math.PI) diff -= 2 * Math.PI
      while (diff < -Math.PI) diff += 2 * Math.PI
      customRotateRef.current.rotation.y = current + diff * Math.min(1, delta * 12)
    }
  })

  const hpPercent = Math.max(0, hp / maxHp)
  const showCustom = useCustomModels && !!glbUrl

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={position}
      colliders="cuboid"
      args={[0.5, 0.35, 0.5]}
      userData={{ type: 'enemy', id }}
      linearDamping={0.3}
      ccd
      onCollisionEnter={handleCollision}
    >
      <group ref={meshGroupRef}>
        {showCustom ? (
          <group ref={customRotateRef}>
            <GameCustomModel url={glbUrl!} config={config} modelType="enemy" />
          </group>
        ) : (
          <>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1, 0.7, 1]} />
              <meshStandardMaterial color="#8b0000" roughness={0.8} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0.4, 0]} castShadow>
              <cylinderGeometry args={[0.35, 0.4, 0.35, 4]} />
              <meshStandardMaterial color="#4a4a4a" roughness={0.7} metalness={0.3} />
            </mesh>
          </>
        )}
        <group position={[0, 1.5, 0]}>
          <mesh>
            <boxGeometry args={[1.2, 0.08, 0.04]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[-0.6 + hpPercent * 0.6, 0, 0.025]}>
            <boxGeometry args={[hpPercent * 1.2, 0.05, 0.03]} />
            <meshBasicMaterial color={hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444'} />
          </mesh>
        </group>
      </group>
    </RigidBody>
  )
})
