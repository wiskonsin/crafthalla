import { useMemo, Suspense, useEffect, useRef, useState } from 'react'
import { useGLTF, useAnimations, Html } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import type { CustomModelConfig } from '../../types/customModels'
import { collectModelDebugInfo } from '../../types/modelDebug'

interface GlbModelProps {
  url: string
  config: CustomModelConfig
  showMuzzle?: boolean
  showHead?: boolean
  headOffset?: [number, number, number] | null
  modelType?: string
  onAnimationStatus?: (loaded: boolean, count: number, names: string[]) => void
  onModelInfo?: (info: import('../../types/modelDebug').EnemyModelDebugInfo) => void
  animationPlaying?: boolean
}

function GlbModelInner({ url, config, showMuzzle, showHead, headOffset, modelType, onAnimationStatus, onModelInfo, animationPlaying }: GlbModelProps) {
  const gltf = useGLTF(url)
  const scene = useMemo(() => {
    const s = SkeletonUtils.clone(gltf.scene)
    s.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return s
  }, [gltf])
  const sceneRef = useRef<THREE.Object3D>(null!)
  sceneRef.current = scene
  const { actions, names } = useAnimations(gltf.animations, sceneRef)

  const [activeAction, setActiveAction] = useState<string | undefined>()
  const prevInfoRef = useRef<string>('')
  useEffect(() => {
    if (modelType !== 'enemy') return
    const count = gltf.animations?.length ?? 0
    const loaded = count > 0
    onAnimationStatus?.(loaded, count, names)
    if (onModelInfo) {
      const info = collectModelDebugInfo(gltf.scene, gltf.animations ?? [], activeAction, 'preview')
      const key = JSON.stringify({ ...info, activeAction })
      if (prevInfoRef.current !== key) {
        prevInfoRef.current = key
        onModelInfo(info)
      }
    }
  }, [modelType, onAnimationStatus, onModelInfo, gltf.scene, gltf.animations, names, activeAction])

  useEffect(() => {
    if (modelType !== 'enemy' || gltf.animations.length === 0) return
    const runName = names.find(
      (n) =>
        /run|walk|correr|caminar|idle/i.test(n) || n.toLowerCase().includes('run') || n.toLowerCase().includes('walk')
    )
    const actionName = runName ?? names[0]
    const action = actionName ? actions[actionName] : Object.values(actions)[0]
    if (!action) return
    if (animationPlaying !== false) {
      setActiveAction(actionName ?? Object.keys(actions)[0])
      action.reset().fadeIn(0.2).play()
      return () => {
        action.fadeOut(0.2)
        setActiveAction(undefined)
      }
    } else {
      action.fadeOut(0.2)
      setActiveAction(undefined)
    }
  }, [modelType, actions, names, animationPlaying])

  const scale = config.scale
  const safeScale: [number, number, number] = [
    scale[0] || 1,
    scale[1] || 1,
    scale[2] || 1,
  ]
  const rotation = config.rotation ?? [0, 0, 0]
  return (
    <group scale={safeScale} position={config.position} rotation={rotation}>
      <primitive object={scene} />
      {showMuzzle && config.muzzleOffset && (
        <mesh position={config.muzzleOffset}>
          <sphereGeometry args={[0.15, 8, 6]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.8} />
        </mesh>
      )}
      {showHead && headOffset && (
        <group position={headOffset}>
          <mesh>
            <sphereGeometry args={[0.15, 8, 6]} />
            <meshBasicMaterial color="#ff0000" transparent opacity={0.8} />
          </mesh>
          <Html
            position={[0, 0.35, 0]}
            center
            style={{
              fontSize: 10,
              fontFamily: 'Orbitron',
              color: '#ff6666',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              textShadow: '0 0 4px #000',
            }}
          >
            Head here
          </Html>
        </group>
      )}
    </group>
  )
}

export function GlbModel(props: GlbModelProps) {
  return (
    <Suspense fallback={null}>
      <GlbModelInner {...props} />
    </Suspense>
  )
}
