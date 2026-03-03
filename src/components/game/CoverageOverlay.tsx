import { memo, useMemo } from 'react'
import * as THREE from 'three'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { TURRET_CONFIG } from '../../config/constants'

export const CoverageOverlay = memo(function CoverageOverlay() {
  const buildings = useBuildingsStore((s) => s.buildings)
  const turrets = useMemo(
    () => buildings.filter((b) => b.type === 'turret' || b.type === 'turret_aa'),
    [buildings]
  )

  const circleGeo = useMemo(
    () => new THREE.CircleGeometry(TURRET_CONFIG.range, 48),
    []
  )

  if (turrets.length === 0) return null

  return (
    <group position={[0, 0.02, 0]}>
      {turrets.map((t) => (
        <mesh
          key={t.id}
          position={[t.position.x, 0, t.position.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          geometry={circleGeo}
        >
          <meshBasicMaterial
            color="#00ff88"
            transparent
            opacity={0.18}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
})
