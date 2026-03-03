import { useMemo, Suspense, useEffect } from 'react'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader, SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import type { CustomModelConfig } from '../../types/customModels'

interface GameGlbModelProps {
  url: string
  config: CustomModelConfig
  opacity?: number
}

function GameGlbModelInner({ url, config, opacity = 1 }: GameGlbModelProps) {
  const gltf = useLoader(GLTFLoader, url)
  const cloned = useMemo(() => {
    const scene = SkeletonUtils.clone(gltf.scene)
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.castShadow = true
        child.receiveShadow = true
        const mat = child.material as THREE.MeshStandardMaterial
        if (mat.isMeshStandardMaterial) {
          mat.envMapIntensity = 0.4
          mat.metalness = Math.min(1, (mat.metalness ?? 0) + 0.08)
          mat.roughness = Math.max(0.2, (mat.roughness ?? 1) - 0.08)
          mat.needsUpdate = true
        }
      }
    })
    return scene
  }, [gltf])

  useEffect(() => {
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial
        mat.transparent = opacity < 1
        mat.opacity = opacity
      }
    })
  }, [cloned, opacity])

  const scale = config.scale
  const safeScale: [number, number, number] = [
    (scale[0] || 1) * 2,
    (scale[1] || 1) * 2,
    (scale[2] || 1) * 2,
  ]
  const rotation = config.rotation ?? [0, 0, 0]
  return (
    <group scale={safeScale} position={config.position} rotation={rotation}>
      <primitive object={cloned} />
    </group>
  )
}

export function GameGlbModel(props: GameGlbModelProps) {
  return (
    <Suspense fallback={null}>
      <GameGlbModelInner {...props} />
    </Suspense>
  )
}
