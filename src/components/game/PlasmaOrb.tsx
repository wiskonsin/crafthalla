import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CONSTRUCTION_DURATION } from '../../config/constants'

const ARC_COUNT = 6
const ARC_SEGMENTS = 20
const ORB_RADIUS = 0.3
const ARC_REACH = 0.9
const FADE_IN_DURATION = 0.8

interface Props {
  position: [number, number, number]
  createdAt: number
}

export function PlasmaOrb({ position, createdAt }: Props) {
  const orbRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const arcsRef = useRef<THREE.LineSegments>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [visible, setVisible] = useState(false)

  const arcSeeds = useMemo(() =>
    Array.from({ length: ARC_COUNT }, () => ({
      theta: Math.random() * Math.PI * 2,
      phi: Math.random() * Math.PI,
      speed: 0.8 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
      reach: ARC_REACH * (0.6 + Math.random() * 0.4),
    })),
  [])

  const arcGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(ARC_COUNT * ARC_SEGMENTS * 2 * 3)
    const colors = new Float32Array(ARC_COUNT * ARC_SEGMENTS * 2 * 3)
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const age = (Date.now() - createdAt) / 1000

    if (age < CONSTRUCTION_DURATION) {
      if (groupRef.current) groupRef.current.visible = false
      return
    }

    if (!visible) setVisible(true)
    if (groupRef.current && !groupRef.current.visible) groupRef.current.visible = true

    const fadeT = Math.min(1, (age - CONSTRUCTION_DURATION) / FADE_IN_DURATION)
    const fadeEased = fadeT * fadeT * (3 - 2 * fadeT)

    if (groupRef.current) {
      groupRef.current.scale.setScalar(fadeEased)
    }

    if (orbRef.current) {
      const pulse = 0.95 + Math.sin(t * 6) * 0.08
      orbRef.current.scale.setScalar(pulse)
      const mat = orbRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.7 + Math.sin(t * 8) * 0.15
    }

    if (glowRef.current) {
      const glowPulse = 1 + Math.sin(t * 4) * 0.15
      glowRef.current.scale.setScalar(glowPulse)
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.12 + Math.sin(t * 5 + 1) * 0.06
    }

    if (!arcsRef.current) return
    const pos = arcGeo.attributes.position.array as Float32Array
    const col = arcGeo.attributes.color.array as Float32Array

    for (let a = 0; a < ARC_COUNT; a++) {
      const seed = arcSeeds[a]
      const wanderT = t * seed.speed + seed.phase
      const endTheta = seed.theta + Math.sin(wanderT * 0.7) * 1.5
      const endPhi = seed.phi + Math.cos(wanderT * 0.5) * 0.8

      const endX = Math.sin(endPhi) * Math.cos(endTheta) * seed.reach
      const endY = Math.cos(endPhi) * seed.reach + 0.1
      const endZ = Math.sin(endPhi) * Math.sin(endTheta) * seed.reach

      for (let s = 0; s < ARC_SEGMENTS; s++) {
        const t0 = s / ARC_SEGMENTS
        const t1 = (s + 1) / ARC_SEGMENTS
        const idx = (a * ARC_SEGMENTS + s) * 6

        const jitter0 = Math.sin(wanderT * 12 + s * 3.7) * 0.06 * (1 - Math.abs(t0 - 0.5) * 2)
        const jitter1 = Math.sin(wanderT * 12 + (s + 1) * 3.7) * 0.06 * (1 - Math.abs(t1 - 0.5) * 2)

        pos[idx] = t0 * endX + jitter0
        pos[idx + 1] = t0 * endY + Math.sin(t0 * Math.PI) * 0.08 + jitter0
        pos[idx + 2] = t0 * endZ + jitter0 * 0.7
        pos[idx + 3] = t1 * endX + jitter1
        pos[idx + 4] = t1 * endY + Math.sin(t1 * Math.PI) * 0.08 + jitter1
        pos[idx + 5] = t1 * endZ + jitter1 * 0.7

        const brightness = 0.5 + Math.sin(wanderT * 15 + s * 2) * 0.3
        const fade = 1 - t0 * 0.4
        col[idx] = 0.3 * brightness * fade
        col[idx + 1] = 0.6 * brightness * fade
        col[idx + 2] = 1.0 * brightness * fade
        col[idx + 3] = 0.3 * brightness * fade
        col[idx + 4] = 0.6 * brightness * fade
        col[idx + 5] = 1.0 * brightness * fade
      }
    }

    arcGeo.attributes.position.needsUpdate = true
    arcGeo.attributes.color.needsUpdate = true
  })

  const orbY = position[1] + 1.0

  return (
    <group ref={groupRef} position={[position[0], orbY, position[2]]}>
      {/* Core orb */}
      <mesh ref={orbRef}>
        <sphereGeometry args={[ORB_RADIUS, 16, 12]} />
        <meshBasicMaterial
          color="#88ccff"
          transparent
          opacity={0.75}
          depthWrite={false}
        />
      </mesh>

      {/* Inner bright core */}
      <mesh>
        <sphereGeometry args={[ORB_RADIUS * 0.5, 12, 8]} />
        <meshBasicMaterial
          color="#ccedff"
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[ORB_RADIUS * 2.2, 16, 12]} />
        <meshBasicMaterial
          color="#4488ff"
          transparent
          opacity={0.12}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Electric arcs */}
      <lineSegments ref={arcsRef} geometry={arcGeo}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  )
}
