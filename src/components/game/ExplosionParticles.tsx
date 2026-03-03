import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useExplosionsStore } from '../../stores/useExplosionsStore'
import * as THREE from 'three'

const DURATION_MS = 600
const PARTICLE_COUNT = 20

function ExplosionMesh({
  position,
}: {
  position: { x: number; y: number; z: number }
}) {
  const meshRef = useRef<THREE.Points>(null)
  const velocities = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, () => ({
        x: (Math.random() - 0.5) * 6,
        y: Math.random() * 4 + 2,
        z: (Math.random() - 0.5) * 6,
      })),
    []
  )

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return geo
  }, [])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return

    const positions = mesh.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const v = velocities[i]
      positions[i * 3] += v.x * delta
      positions[i * 3 + 1] += v.y * delta
      positions[i * 3 + 2] += v.z * delta
      v.y -= 12 * delta
    }
    mesh.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={meshRef} position={[position.x, position.y, position.z]} geometry={geometry}>
      <pointsMaterial
        size={0.5}
        color="#ff4400"
        transparent
        opacity={0.95}
        sizeAttenuation
      />
    </points>
  )
}

export function ExplosionParticles() {
  const explosions = useExplosionsStore((s) => s.explosions)

  useFrame(() => {
    const now = performance.now()
    const expired = explosions.filter((e) => now - e.startTime > DURATION_MS)
    if (expired.length > 0) {
      useExplosionsStore.setState((state) => ({
        explosions: state.explosions.filter(
          (e) => now - e.startTime <= DURATION_MS
        ),
      }))
    }
  })

  return (
    <>
      {explosions.map((e) => (
        <ExplosionMesh key={e.id} position={e.position} />
      ))}
    </>
  )
}
