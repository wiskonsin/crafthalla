import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMissilesStore, type MissileData } from '../../stores/useMissilesStore'
import { useUnitsStore } from '../../stores/useUnitsStore'
import { useExplosionsStore } from '../../stores/useExplosionsStore'
import { useCratersStore } from '../../stores/useCratersStore'
import { MISSILE_SPEED } from '../../config/constants'

const HIT_RADIUS = 0.8
const MAX_LIFETIME = 8
const TRAIL_LENGTH = 6

function Missile({ id, fromPos, targetEnemyId, targetLastPos }: MissileData) {
  const groupRef = useRef<THREE.Group>(null)
  const posRef = useRef(new THREE.Vector3(fromPos.x, fromPos.y, fromPos.z))
  const lastTargetRef = useRef(new THREE.Vector3(targetLastPos.x, targetLastPos.y + 0.3, targetLastPos.z))
  const ageRef = useRef(0)
  const removeMissile = useMissilesStore((s) => s.removeMissile)
  const addExplosion = useExplosionsStore((s) => s.addExplosion)
  const dirRef = useRef(new THREE.Vector3())

  const trail = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(TRAIL_LENGTH * 3)
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const colors = new Float32Array(TRAIL_LENGTH * 3)
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const t = i / TRAIL_LENGTH
      colors[i * 3] = 1.0
      colors[i * 3 + 1] = 0.5 * (1 - t)
      colors[i * 3 + 2] = 0.1 * (1 - t)
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
    })
    return { line: new THREE.Line(geo, mat), history: [] as THREE.Vector3[] }
  }, [])

  useFrame((_, delta) => {
    ageRef.current += delta
    if (ageRef.current > MAX_LIFETIME) {
      removeMissile(id)
      return
    }

    const targetPos = useUnitsStore.getState().enemyPositions[targetEnemyId]
    if (targetPos) {
      lastTargetRef.current.set(targetPos.x, targetPos.y + 0.3, targetPos.z)
    }

    dirRef.current.subVectors(lastTargetRef.current, posRef.current)
    const dist = dirRef.current.length()
    dirRef.current.normalize()

    posRef.current.addScaledVector(dirRef.current, MISSILE_SPEED * delta)

    if (groupRef.current) {
      groupRef.current.position.copy(posRef.current)
      const lookTarget = posRef.current.clone().add(dirRef.current)
      groupRef.current.lookAt(lookTarget)
    }

    trail.history.unshift(posRef.current.clone())
    if (trail.history.length > TRAIL_LENGTH) trail.history.length = TRAIL_LENGTH
    const trailPos = trail.line.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const p = trail.history[i] ?? posRef.current
      trailPos[i * 3] = p.x
      trailPos[i * 3 + 1] = p.y
      trailPos[i * 3 + 2] = p.z
    }
    trail.line.geometry.attributes.position.needsUpdate = true

    if (dist < HIT_RADIUS) {
      const impactPos = { x: posRef.current.x, y: posRef.current.y, z: posRef.current.z }
      addExplosion(impactPos)
      useCratersStore.getState().addCrater(posRef.current.x, posRef.current.z)

      const enemy = useUnitsStore.getState().getEnemy(targetEnemyId)
      if (enemy) {
        useUnitsStore.getState().damageEnemy(targetEnemyId, 9999)
      }

      removeMissile(id)
    }
  })

  return (
    <group>
      <group ref={groupRef}>
        {/* Nose cone */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <coneGeometry args={[0.06, 0.25, 6]} />
          <meshStandardMaterial
            color="#cccccc"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>

        {/* Body */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.22]}>
          <cylinderGeometry args={[0.06, 0.06, 0.2, 6]} />
          <meshStandardMaterial
            color="#888888"
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>

        {/* Warhead stripe */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.08]}>
          <cylinderGeometry args={[0.065, 0.065, 0.06, 6]} />
          <meshStandardMaterial
            color="#cc3333"
            emissive="#ff2200"
            emissiveIntensity={0.5}
            metalness={0.3}
            roughness={0.5}
          />
        </mesh>

        {/* Tail fins (4 fins) */}
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
          <mesh
            key={i}
            position={[
              Math.sin(angle) * 0.07,
              Math.cos(angle) * 0.07,
              -0.35,
            ]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[0.01, 0.12, 0.1]} />
            <meshStandardMaterial color="#666666" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}

        {/* Engine glow */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.38]}>
          <sphereGeometry args={[0.04, 6, 4]} />
          <meshBasicMaterial color="#ff8800" />
        </mesh>
      </group>

      <primitive object={trail.line} />
    </group>
  )
}

export function MissileSystem() {
  const missiles = useMissilesStore((s) => s.missiles)

  return (
    <group>
      {missiles.map((m) => (
        <Missile key={m.id} {...m} />
      ))}
    </group>
  )
}
