import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PulseRingProps {
  color: string
  radius: number
  y?: number
}

const PERIOD = 2.2
const RING_COUNT = 2
const MIN_SCALE = 0.15
const MAX_OPACITY = 0.45
const THICKNESS = 0.07

export function PulseRing({ color, radius, y = 0.05 }: PulseRingProps) {
  const refs = useRef<(THREE.Mesh | null)[]>([])

  useFrame(({ clock }) => {
    for (let i = 0; i < RING_COUNT; i++) {
      const mesh = refs.current[i]
      if (!mesh) continue
      const offset = (i / RING_COUNT) * PERIOD
      const t = ((clock.elapsedTime + offset) % PERIOD) / PERIOD
      const scale = MIN_SCALE + t * (1 - MIN_SCALE)
      mesh.scale.set(scale, scale, 1)
      const fade = 1 - t * t
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = MAX_OPACITY * fade
    }
  })

  return (
    <group position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {Array.from({ length: RING_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
        >
          <ringGeometry args={[radius - THICKNESS, radius, 24]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={MAX_OPACITY}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
