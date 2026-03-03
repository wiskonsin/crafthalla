import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { CONSTRUCTION_DURATION } from '../../config/constants'

const PARTICLE_COUNT = 20
const RISE_AMOUNT = 1.8

export function BuildingRiseIn({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)
  const startRef = useRef(performance.now())
  const doneRef = useRef(false)

  useFrame(() => {
    if (doneRef.current || !groupRef.current) return
    const elapsed = (performance.now() - startRef.current) / 1000
    const progress = Math.min(1, elapsed / CONSTRUCTION_DURATION)
    const eased = 1 - Math.pow(1 - progress, 3)
    groupRef.current.position.y = (eased - 1) * RISE_AMOUNT
    if (progress >= 1) {
      groupRef.current.position.y = 0
      doneRef.current = true
    }
  })

  return <group ref={groupRef}>{children}</group>
}

function ConstructionBurst({ position, createdAt }: { position: { x: number; y: number; z: number }; createdAt: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const doneRef = useRef(false)

  const { geometry, velocities } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))

    const vels = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: (Math.random() - 0.5) * 2.5,
      y: Math.random() * 3 + 1,
      z: (Math.random() - 0.5) * 2.5,
    }))

    return { geometry: geo, velocities: vels }
  }, [])

  useFrame(() => {
    if (doneRef.current || !pointsRef.current) return
    const elapsed = (Date.now() - createdAt) / 1000
    const progress = Math.min(1, elapsed / CONSTRUCTION_DURATION)

    if (progress >= 1) {
      pointsRef.current.visible = false
      doneRef.current = true
      return
    }

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    const t = elapsed % 1.2
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const v = velocities[i]
      positions[i * 3] = v.x * t * 0.4
      positions[i * 3 + 1] = v.y * t
      positions[i * 3 + 2] = v.z * t * 0.4
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    ;(pointsRef.current.material as THREE.PointsMaterial).opacity = 0.9 * (1 - progress)
  })

  return (
    <points
      ref={pointsRef}
      position={[position.x, position.y, position.z]}
      geometry={geometry}
    >
      <pointsMaterial
        size={0.3}
        color="#ffcc66"
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

export function ConstructionEffects() {
  const buildings = useBuildingsStore((s) => s.buildings)

  return (
    <>
      {buildings.map((b) => {
        const age = (Date.now() - b.createdAt) / 1000
        if (age > CONSTRUCTION_DURATION + 1) return null
        const y = b.type === 'generator' ? 0.75 : b.type === 'subBase' ? 1.2 : 0
        return (
          <ConstructionBurst
            key={`build-${b.id}`}
            position={{ x: b.position.x, y, z: b.position.z }}
            createdAt={b.createdAt}
          />
        )
      })}
    </>
  )
}
