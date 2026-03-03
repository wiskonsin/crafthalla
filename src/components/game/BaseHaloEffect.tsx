import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBuildingsStore, type GameBase } from '../../stores/useBuildingsStore'
import { useGameStore } from '../../stores/useGameStore'
import { VISION_RADIUS } from '../../config/constants'

const SEGMENTS = 120
const ARC_COUNT = 3

function getRadius(base: GameBase): number {
  return base.isMain ? VISION_RADIUS.central : VISION_RADIUS.subBase
}

function isInsideOtherCircle(
  wx: number,
  wz: number,
  selfId: string,
  bases: GameBase[]
): boolean {
  for (const other of bases) {
    if (other.id === selfId) continue
    const r = getRadius(other)
    const dx = wx - other.position.x
    const dz = wz - other.position.z
    if (dx * dx + dz * dz < r * r) return true
  }
  return false
}

interface ElectricRingProps {
  base: GameBase
  radius: number
  allBases: GameBase[]
}

function ElectricRing({ base, radius, allBases }: ElectricRingProps) {
  const arcs = useMemo(() => {
    return Array.from({ length: ARC_COUNT }, (_, idx) => {
      const geo = new THREE.BufferGeometry()
      const positions = new Float32Array(SEGMENTS * 2 * 3)
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const opacity = idx === 0 ? 0.5 : 0.25
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(idx === 0 ? '#3399ff' : '#2266cc'),
        transparent: true,
        opacity,
        depthWrite: false,
      })
      const line = new THREE.LineSegments(geo, mat)
      line.frustumCulled = false
      return { line, phase: idx * 2.1 }
    })
  }, [])

  const hasInit = useRef(false)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const bx = base.position.x
    const bz = base.position.z

    for (let a = 0; a < ARC_COUNT; a++) {
      const { line, phase } = arcs[a]
      const pos = line.geometry.attributes.position.array as Float32Array
      const jitterScale = a === 0 ? 0.15 : 0.3 + a * 0.15

      for (let i = 0; i < SEGMENTS; i++) {
        const frac0 = i / SEGMENTS
        const frac1 = (i + 1) / SEGMENTS
        const angle0 = frac0 * Math.PI * 2
        const angle1 = frac1 * Math.PI * 2

        const midAngle = (angle0 + angle1) * 0.5
        const idealMidX = bx + Math.cos(midAngle) * radius
        const idealMidZ = bz + Math.sin(midAngle) * radius

        const idx = i * 6

        if (isInsideOtherCircle(idealMidX, idealMidZ, base.id, allBases)) {
          pos[idx] = 0; pos[idx + 1] = -50; pos[idx + 2] = 0
          pos[idx + 3] = 0; pos[idx + 4] = -50; pos[idx + 5] = 0
          continue
        }

        for (let vi = 0; vi < 2; vi++) {
          const angle = vi === 0 ? angle0 : angle1
          const w1 = Math.sin(t * 1.8 + angle * 6 + phase) * jitterScale
          const w2 = Math.sin(t * 3.2 + angle * 10 + phase * 0.7) * jitterScale * 0.4
          const w3 = Math.sin(t * 0.7 + angle * 3 + phase * 1.3) * jitterScale * 0.6
          const r = radius + w1 + w2 + w3
          const yWave = Math.sin(t * 2.1 + angle * 5 + phase) * 0.06 * (1 + a * 0.3)

          pos[idx + vi * 3] = Math.cos(angle) * r
          pos[idx + vi * 3 + 1] = yWave
          pos[idx + vi * 3 + 2] = Math.sin(angle) * r
        }
      }

      line.geometry.attributes.position.needsUpdate = true
    }

    if (!hasInit.current) {
      for (const { line } of arcs) line.geometry.computeBoundingSphere()
      hasInit.current = true
    }
  })

  return (
    <group position={[base.position.x, 0.06, base.position.z]}>
      {arcs.map(({ line }, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  )
}

export function BaseHaloEffect() {
  const selectedBaseId = useGameStore((s) => s.selectedBaseId)
  const bases = useBuildingsStore((s) => s.bases)

  if (!selectedBaseId) return null

  return (
    <group>
      {bases.map((base) => (
        <ElectricRing
          key={base.id}
          base={base}
          radius={getRadius(base)}
          allBases={bases}
        />
      ))}
    </group>
  )
}
