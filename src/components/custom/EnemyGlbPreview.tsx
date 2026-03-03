import { useEffect, useMemo, Suspense } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import type { CustomModelConfig } from '../../types/customModels'

interface EnemyGlbPreviewProps {
  url: string
  config: CustomModelConfig
}

function EnemyGlbPreviewInner({ url, config }: EnemyGlbPreviewProps) {
  const gltf = useGLTF(url)

  const clone = useMemo(() => {
    const c = SkeletonUtils.clone(gltf.scene)
    c.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return c
  }, [gltf.scene])

  const mixer = useMemo(() => new THREE.AnimationMixer(clone), [clone])

  useEffect(() => {
    if (gltf.animations.length === 0) return
    const clip = gltf.animations[0]
    const action = mixer.clipAction(clip)
    action.play()
    return () => {
      action.stop()
      mixer.stopAllAction()
    }
  }, [mixer, gltf.animations])

  useFrame((_, delta) => mixer.update(delta))

  const s = config.scale
  const safeScale: [number, number, number] = [s[0] || 1, s[1] || 1, s[2] || 1]
  const rotation = config.rotation ?? [0, 0, 0]

  return (
    <group scale={safeScale} position={config.position} rotation={rotation}>
      <primitive object={clone} />
    </group>
  )
}

export function EnemyGlbPreview(props: EnemyGlbPreviewProps) {
  return (
    <Suspense fallback={null}>
      <EnemyGlbPreviewInner {...props} />
    </Suspense>
  )
}
