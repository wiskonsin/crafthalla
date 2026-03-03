import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useDissolveStore } from '../../stores/useDissolveStore'
import * as THREE from 'three'

const DURATION_MS = 1800
const ASH_COUNT = 40
const EMBER_COUNT = 14

function DissolveMesh({ position }: { position: { x: number; y: number; z: number } }) {
  const ashRef = useRef<THREE.Points>(null)
  const emberRef = useRef<THREE.Points>(null)
  const ageRef = useRef(0)

  const ash = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(ASH_COUNT * 3)
    const sizes = new Float32Array(ASH_COUNT)
    for (let i = 0; i < ASH_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.8
      pos[i * 3 + 1] = Math.random() * 0.7
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.8
      sizes[i] = 0.15 + Math.random() * 0.25
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const vels = Array.from({ length: ASH_COUNT }, () => ({
      x: (Math.random() - 0.5) * 2.0,
      y: Math.random() * 1.2 + 0.3,
      z: (Math.random() - 0.5) * 2.0,
      rotSpeed: (Math.random() - 0.5) * 3,
    }))
    return { geo, vels }
  }, [])

  const embers = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(EMBER_COUNT * 3)
    for (let i = 0; i < EMBER_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.5
      pos[i * 3 + 1] = Math.random() * 0.6
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))

    const vels = Array.from({ length: EMBER_COUNT }, () => ({
      x: (Math.random() - 0.5) * 3.5,
      y: Math.random() * 3 + 1.5,
      z: (Math.random() - 0.5) * 3.5,
    }))
    return { geo, vels }
  }, [])

  useFrame((_, delta) => {
    ageRef.current += delta
    const progress = Math.min(1, (ageRef.current * 1000) / DURATION_MS)

    if (ashRef.current) {
      const positions = ashRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < ASH_COUNT; i++) {
        const v = ash.vels[i]
        positions[i * 3] += v.x * delta * 0.6
        positions[i * 3 + 1] += v.y * delta
        positions[i * 3 + 2] += v.z * delta * 0.6
        v.y -= 1.5 * delta
        v.x *= 0.98
        v.z *= 0.98
      }
      ashRef.current.geometry.attributes.position.needsUpdate = true
      const ashMat = ashRef.current.material as THREE.PointsMaterial
      ashMat.opacity = 0.85 * (1 - progress * progress)
      ashMat.size = 0.2 * (1 - progress * 0.5)
    }

    if (emberRef.current) {
      const positions = emberRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < EMBER_COUNT; i++) {
        const v = embers.vels[i]
        positions[i * 3] += v.x * delta
        positions[i * 3 + 1] += v.y * delta
        positions[i * 3 + 2] += v.z * delta
        v.y -= 6 * delta
      }
      emberRef.current.geometry.attributes.position.needsUpdate = true
      const mat = emberRef.current.material as THREE.PointsMaterial
      mat.opacity = 1.0 * (1 - progress)
    }
  })

  return (
    <group position={[position.x, position.y + 0.3, position.z]}>
      {/* Ash cloud - dark particles that drift and fall */}
      <points ref={ashRef} geometry={ash.geo}>
        <pointsMaterial
          size={0.2}
          color="#2a2a2a"
          transparent
          opacity={0.85}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Embers - bright orange sparks that fly outward */}
      <points ref={emberRef} geometry={embers.geo}>
        <pointsMaterial
          size={0.12}
          color="#ff6622"
          transparent
          opacity={1.0}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  )
}

export function DissolveParticles() {
  const effects = useDissolveStore((s) => s.effects)

  useFrame(() => {
    const now = performance.now()
    const expired = effects.filter((e) => now - e.startTime > DURATION_MS)
    if (expired.length > 0) {
      useDissolveStore.setState((state) => ({
        effects: state.effects.filter((e) => now - e.startTime <= DURATION_MS),
      }))
    }
  })

  return (
    <>
      {effects.map((e) => (
        <DissolveMesh key={e.id} position={e.position} />
      ))}
    </>
  )
}
