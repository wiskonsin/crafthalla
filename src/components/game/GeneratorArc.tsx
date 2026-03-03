import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const ARC_COUNT = 3
const SEGMENTS = 8

export function GeneratorArc({ position }: { position: [number, number, number] }) {
  const lines = useMemo(() => {
    return Array.from({ length: ARC_COUNT }, () => {
      const geo = new THREE.BufferGeometry()
      const positions = new Float32Array((SEGMENTS + 1) * 3)
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color('#44ddff'),
        transparent: true,
        opacity: 0.7,
      })
      const line = new THREE.Line(geo, mat)
      line.frustumCulled = false
      return { line, seed: Math.random() * 100, baseAngle: (Math.random() * Math.PI * 2) }
    })
  }, [])

  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const t = performance.now() * 0.004
    for (let a = 0; a < ARC_COUNT; a++) {
      const { line, seed, baseAngle } = lines[a]
      const positions = line.geometry.attributes.position.array as Float32Array
      const angle = baseAngle + t * 0.8 + a * (Math.PI * 2 / ARC_COUNT)
      const startR = 0.6
      const endR = 1.4 + Math.sin(t + seed) * 0.3
      const startY = 0.8 + Math.sin(t * 1.3 + seed) * 0.2
      const endY = 1.5 + Math.sin(t * 0.7 + seed) * 0.4

      for (let i = 0; i <= SEGMENTS; i++) {
        const frac = i / SEGMENTS
        const r = startR + (endR - startR) * frac
        const y = startY + (endY - startY) * frac
        const jitterX = (Math.random() - 0.5) * 0.15 * frac
        const jitterZ = (Math.random() - 0.5) * 0.15 * frac
        positions[i * 3] = Math.cos(angle + frac * 0.5) * r + jitterX
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = Math.sin(angle + frac * 0.5) * r + jitterZ
      }
      line.geometry.attributes.position.needsUpdate = true

      const mat = line.material as THREE.LineBasicMaterial
      mat.opacity = 0.4 + Math.sin(t * 3 + seed) * 0.3
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {lines.map(({ line }, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  )
}
