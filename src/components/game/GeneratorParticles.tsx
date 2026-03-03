import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBuildingsStore } from '../../stores/useBuildingsStore'

const MAX_SPARKS = 24
const SPARK_GRAVITY = 8
const BASE_INTENSITY = 0.3
const PER_TURRET_INTENSITY = 0.25

interface Props {
  position: [number, number, number]
  baseId: string
}

export function GeneratorParticles({ position, baseId }: Props) {
  const pointsRef = useRef<THREE.Points>(null)
  const intensityRef = useRef(BASE_INTENSITY)

  const { geo, sparks } = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const positions = new Float32Array(MAX_SPARKS * 3)
    const colors = new Float32Array(MAX_SPARKS * 3)
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const sparkData = Array.from({ length: MAX_SPARKS }, () => ({
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      life: 0,
      maxLife: 0,
    }))

    return { geo: g, sparks: sparkData }
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return

    const turretCount = useBuildingsStore.getState().buildings.filter(
      (b) => (b.type === 'turret' || b.type === 'turret_aa') && b.baseId === baseId
    ).length

    const targetIntensity = Math.min(1, BASE_INTENSITY + turretCount * PER_TURRET_INTENSITY)
    intensityRef.current += (targetIntensity - intensityRef.current) * Math.min(1, delta * 2)

    const intensity = intensityRef.current
    const activeCount = Math.max(3, Math.floor(MAX_SPARKS * intensity))

    const pos = geo.attributes.position.array as Float32Array
    const col = geo.attributes.color.array as Float32Array

    for (let i = 0; i < MAX_SPARKS; i++) {
      const s = sparks[i]

      if (i >= activeCount) {
        col[i * 3] = 0
        col[i * 3 + 1] = 0
        col[i * 3 + 2] = 0
        continue
      }

      s.life += delta

      if (s.life >= s.maxLife) {
        s.x = (Math.random() - 0.5) * 0.8
        s.y = Math.random() * 0.4
        s.z = (Math.random() - 0.5) * 0.8
        s.vx = (Math.random() - 0.5) * 2.5 * intensity
        s.vy = 1.5 + Math.random() * 3.0 * intensity
        s.vz = (Math.random() - 0.5) * 2.5 * intensity
        s.life = 0
        s.maxLife = 0.15 + Math.random() * 0.35
      }

      s.x += s.vx * delta
      s.y += s.vy * delta
      s.vy -= SPARK_GRAVITY * delta
      s.z += s.vz * delta

      pos[i * 3] = s.x
      pos[i * 3 + 1] = s.y
      pos[i * 3 + 2] = s.z

      const t = s.life / s.maxLife
      const fade = 1 - t * t
      const bright = 0.4 + intensity * 0.6
      col[i * 3] = 0.1 * fade * bright
      col[i * 3 + 1] = (0.4 + Math.random() * 0.15) * fade * bright
      col[i * 3 + 2] = (0.8 + Math.random() * 0.2) * fade * bright
    }

    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate = true
  })

  return (
    <points ref={pointsRef} position={position} geometry={geo}>
      <pointsMaterial
        size={0.07}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
