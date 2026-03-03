import { useEffect, useMemo, useId, Suspense } from 'react'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import type { CustomModelConfig } from '../../types/customModels'
import { useEnemyGlbStore } from '../../stores/useEnemyGlbStore'

interface GameEnemyGlbModelProps {
  url: string
  config: CustomModelConfig
}

function GameEnemyGlbModelInner({ url, config }: GameEnemyGlbModelProps) {
  const instanceId = useId()
  const gltf = useGLTF(url)
  const registerMixer = useEnemyGlbStore((s) => s.registerMixer)
  const unregisterMixer = useEnemyGlbStore((s) => s.unregisterMixer)

  const clone = useMemo(() => {
    const c = SkeletonUtils.clone(gltf.scene)
    c.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        const mat = child.material as THREE.MeshStandardMaterial
        if (mat?.isMeshStandardMaterial) {
          mat.envMapIntensity = 0.4
          mat.metalness = Math.min(1, (mat.metalness ?? 0) + 0.08)
          mat.roughness = Math.max(0.2, (mat.roughness ?? 1) - 0.08)
          mat.needsUpdate = true
        }
      }
    })
    return c
  }, [gltf.scene])

  const mixer = useMemo(() => new THREE.AnimationMixer(clone), [clone])

  useEffect(() => {
    registerMixer(instanceId, mixer)
    return () => unregisterMixer(instanceId)
  }, [instanceId, mixer, registerMixer, unregisterMixer])

  useEffect(() => {
    if (gltf.animations.length === 0) return
    const preferred = gltf.animations.find((c) =>
      /run|walk|correr|caminar|idle/i.test(c.name)
    )
    const clip = preferred ?? gltf.animations[0]
    const action = mixer.clipAction(clip)
    action.play()
    return () => { action.stop() }
  }, [mixer, gltf.animations])

  const s = config.scale
  const safeScale: [number, number, number] = [(s[0] || 1) * 2, (s[1] || 1) * 2, (s[2] || 1) * 2]
  const rotation = config.rotation ?? [0, 0, 0]

  return (
    <group scale={safeScale} position={config.position} rotation={rotation}>
      <primitive object={clone} />
    </group>
  )
}

export function GameEnemyGlbModel(props: GameEnemyGlbModelProps) {
  return (
    <Suspense fallback={null}>
      <GameEnemyGlbModelInner {...props} />
    </Suspense>
  )
}
