import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { useGameStore } from '../../stores/useGameStore'
import { snapToGrid } from '../../config/constants'

interface ConstructionArcProps {
  position: { x: number; z: number } | null
}

const ARC_SEGMENTS = 12
const VALID_COLOR = new THREE.Color('#aaccff')
const INVALID_COLOR = new THREE.Color('#ff4444')

export function ConstructionArc({ position }: ConstructionArcProps) {
  const selectedBuilding = useGameStore((s) => s.selectedBuilding)
  const getBaseAt = useBuildingsStore((s) => s.getBaseAt)
  const canPlaceAt = useBuildingsStore((s) => s.canPlaceAt)
  const canPlaceSubBase = useBuildingsStore((s) => s.canPlaceSubBase)
  const seed = useRef(Math.random() * 1000)

  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array((ARC_SEGMENTS + 1) * 3)
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.LineBasicMaterial({ color: VALID_COLOR, linewidth: 1.8, transparent: true, opacity: 0.9 })
    return new THREE.Line(geo, mat)
  }, [])

  useFrame(() => {
    if (!selectedBuilding || !position) {
      lineObj.visible = false
      return
    }

    const x = snapToGrid(position.x)
    const z = snapToGrid(position.z)
    const base = getBaseAt(x, z)

    const valid =
      selectedBuilding === 'subBase'
        ? canPlaceSubBase(x, z)
        : base
          ? canPlaceAt(x, z, base.id)
          : false

    const basePos = base?.position ?? { x: 0, y: 0, z: 0 }
    const fromX = basePos.x, fromY = 1.2, fromZ = basePos.z
    const toY = selectedBuilding === 'generator' ? 0.75
      : selectedBuilding === 'subBase' ? 1.2
      : selectedBuilding === 'engineer' ? 0.5
      : 1

    const positions = lineObj.geometry.attributes.position.array as Float32Array
    const t = performance.now() * 0.008 + seed.current
    const dx = x - fromX
    const dy = toY - fromY
    const dz = z - fromZ

    for (let i = 0; i <= ARC_SEGMENTS; i++) {
      const tt = i / ARC_SEGMENTS
      positions[i * 3] = fromX + dx * tt + (Math.random() - 0.5) * 0.04
      positions[i * 3 + 1] = fromY + dy * tt + 0.08 * Math.sin(t + i * 2)
      positions[i * 3 + 2] = fromZ + dz * tt + (Math.random() - 0.5) * 0.04
    }
    lineObj.geometry.attributes.position.needsUpdate = true
    ;(lineObj.material as THREE.LineBasicMaterial).color.copy(valid ? VALID_COLOR : INVALID_COLOR)
    lineObj.visible = true
  })

  return <primitive object={lineObj} />
}
