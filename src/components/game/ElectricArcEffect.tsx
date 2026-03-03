import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { useGameStore } from '../../stores/useGameStore'

export function ElectricArcEffect() {
  const selectedGeneratorId = useGameStore((s) => s.selectedGeneratorId)
  const selectedTurretId = useGameStore((s) => s.selectedTurretId)
  const buildings = useBuildingsStore((s) => s.buildings)

  const generator = selectedGeneratorId
    ? buildings.find((b) => b.id === selectedGeneratorId && b.type === 'generator')
    : null

  const turret = selectedTurretId
    ? buildings.find((b) => b.id === selectedTurretId && (b.type === 'turret' || b.type === 'turret_aa'))
    : null

  if (generator) {
    const turrets = buildings.filter(
      (b) => b.type === 'turret' && b.baseId === generator.baseId
    )
    return (
      <group>
        {turrets.map((t) => (
          <ElectricArc
            key={t.id}
            from={[generator.position.x, 1.2, generator.position.z]}
            to={[t.position.x, 1.5, t.position.z]}
          />
        ))}
      </group>
    )
  }

  if (turret) {
    const generators = buildings.filter(
      (b) => b.type === 'generator' && b.baseId === turret.baseId
    )
    return (
      <group>
        {generators.map((g) => (
          <ElectricArc
            key={g.id}
            from={[turret.position.x, 1.5, turret.position.z]}
            to={[g.position.x, 1.2, g.position.z]}
          />
        ))}
      </group>
    )
  }

  return null
}

const ARC_SEGMENTS = 10

function ElectricArc({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const seed = useRef(Math.random() * 1000)

  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array((ARC_SEGMENTS + 1) * 3)
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.LineBasicMaterial({ color: '#66aaff', transparent: true, opacity: 0.8 })
    return new THREE.Line(geo, mat)
  }, [])

  const hasInit = useRef(false)

  useFrame(() => {
    const positions = lineObj.geometry.attributes.position.array as Float32Array
    const t = performance.now() * 0.012 + seed.current
    const dx = to[0] - from[0]
    const dy = to[1] - from[1]
    const dz = to[2] - from[2]

    for (let i = 0; i <= ARC_SEGMENTS; i++) {
      const tt = i / ARC_SEGMENTS
      positions[i * 3] = from[0] + dx * tt + (Math.random() - 0.5) * 0.06
      positions[i * 3 + 1] = from[1] + dy * tt + 0.1 * Math.sin(t + i * 2.5)
      positions[i * 3 + 2] = from[2] + dz * tt + (Math.random() - 0.5) * 0.06
    }
    lineObj.geometry.attributes.position.needsUpdate = true
    if (!hasInit.current) {
      lineObj.geometry.computeBoundingSphere()
      hasInit.current = true
    }
  })

  return <primitive object={lineObj} />
}
