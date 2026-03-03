import { useMemo, useRef, useEffect, useState } from 'react'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import {
  TERRAIN_SIZE,
  applyHeightmapToGeometry,
  generateTerrain,
} from '../../systems/terrainHeightmap'
import { useTerrainStore } from '../../stores/useTerrainStore'

const TERRAIN_SEGMENTS = 128
const TILE_REPEAT = 23

const PRESET_PATHS: Record<string, string> = {
  normal: '/tiles/grass.png',
  exoplanet: '/tiles/exo.png',
}

interface ProceduralTerrainProps {
  onTerrainClick?: (x: number, z: number) => void
  onPointerMove?: (x: number, z: number) => void
  onPointerLeave?: () => void
}

export function ProceduralTerrain({ onTerrainClick, onPointerMove, onPointerLeave }: ProceduralTerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(
    new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0.02 })
  )

  const terrainPreset = useTerrainStore((s) => s.terrainPreset)
  const customTerrainBlobId = useTerrainStore((s) => s.customTerrainBlobId)
  const getBlobUrl = useTerrainStore((s) => s.getBlobUrl)

  const [texUrl, setTexUrl] = useState<string>(PRESET_PATHS.normal)

  useEffect(() => {
    if (terrainPreset === 'custom' && customTerrainBlobId) {
      getBlobUrl(customTerrainBlobId).then((url) => {
        if (url) setTexUrl(url)
      })
    } else {
      setTexUrl(PRESET_PATHS[terrainPreset] || PRESET_PATHS.normal)
    }
  }, [terrainPreset, customTerrainBlobId, getBlobUrl])

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(texUrl, (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(TILE_REPEAT, TILE_REPEAT)
      tex.anisotropy = 8
      tex.colorSpace = THREE.SRGBColorSpace
      const mat = materialRef.current
      if (mat.map) mat.map.dispose()
      mat.map = tex
      mat.needsUpdate = true
    })
  }, [texUrl])

  const geometry = useMemo(() => {
    generateTerrain()
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS)
    applyHeightmapToGeometry(geo)
    return geo
  }, [])

  return (
    <RigidBody
      type="fixed"
      colliders="trimesh"
      friction={0.5}
    >
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={materialRef.current}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onPointerDown={(e) => {
          if ((e as unknown as { button?: number }).button !== 0) return
          e.stopPropagation()
          const { x, z } = e.point
          onTerrainClick?.(x, z)
        }}
        onPointerMove={(e) => {
          const { x, z } = e.point
          onPointerMove?.(x, z)
        }}
        onPointerLeave={() => onPointerLeave?.()}
      />
    </RigidBody>
  )
}
