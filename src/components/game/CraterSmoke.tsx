import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCratersStore } from '../../stores/useCratersStore'

const PARTICLES_PER_CRATER = 12
const SMOKE_DURATION = 8000
const MAX_HEIGHT = 3.5
const SPREAD = 1.2

interface SmokeParticle {
  offsetX: number
  offsetZ: number
  speed: number
  phase: number
  drift: number
  size: number
}

function CraterSmokeInstance({ x, z, age }: { x: number; z: number; age: number }) {
  const pointsRef = useRef<THREE.Points>(null)

  const particles = useMemo<SmokeParticle[]>(() => {
    const arr: SmokeParticle[] = []
    for (let i = 0; i < PARTICLES_PER_CRATER; i++) {
      const a = Math.random() * Math.PI * 2
      const r = Math.random() * SPREAD * 0.6
      arr.push({
        offsetX: Math.cos(a) * r,
        offsetZ: Math.sin(a) * r,
        speed: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.4,
        size: 0.3 + Math.random() * 0.4,
      })
    }
    return arr
  }, [])

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const positions = new Float32Array(PARTICLES_PER_CRATER * 3)
    const sizes = new Float32Array(PARTICLES_PER_CRATER)
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return g
  }, [])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const t = clock.elapsedTime

    const smokeT = Math.min(1, age / SMOKE_DURATION)
    const globalAlpha = 1 - smokeT * smokeT

    if (globalAlpha <= 0.01) {
      pointsRef.current.visible = false
      return
    }
    pointsRef.current.visible = true

    const pos = geo.attributes.position.array as Float32Array

    for (let i = 0; i < PARTICLES_PER_CRATER; i++) {
      const p = particles[i]
      const cycleT = ((t * p.speed + p.phase) % 1.8) / 1.8
      const y = cycleT * MAX_HEIGHT
      const fadeParticle = cycleT < 0.1 ? cycleT / 0.1 : 1 - (cycleT - 0.1) / 0.9

      pos[i * 3] = p.offsetX + Math.sin(t * 0.8 + p.phase) * p.drift * cycleT
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = p.offsetZ + Math.cos(t * 0.6 + p.phase) * p.drift * cycleT

      const sz = geo.attributes.size.array as Float32Array
      sz[i] = p.size * fadeParticle * globalAlpha * (0.5 + cycleT * 0.5)
    }

    geo.attributes.position.needsUpdate = true
    geo.attributes.size.needsUpdate = true

    const mat = pointsRef.current.material as THREE.PointsMaterial
    mat.opacity = globalAlpha * 0.4
  })

  return (
    <points ref={pointsRef} position={[x, 0.1, z]} geometry={geo}>
      <pointsMaterial
        color="#3a3530"
        transparent
        opacity={0.4}
        size={0.5}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

export function CraterSmoke() {
  const craters = useCratersStore((s) => s.craters)
  const now = Date.now()

  return (
    <>
      {craters.map((c) => {
        const age = now - c.createdAt
        if (age > SMOKE_DURATION) return null
        return (
          <CraterSmokeInstance
            key={c.id}
            x={c.position.x}
            z={c.position.z}
            age={age}
          />
        )
      })}
    </>
  )
}
