import * as THREE from 'three'

/** Debug info for GLB models with skeleton + animation */
export interface EnemyModelDebugInfo {
  /** Model loaded successfully */
  loaded: boolean
  /** Number of animation clips */
  animationCount: number
  /** Animation clip names */
  animationNames: string[]
  /** Number of bones in skeleton(s) */
  skeletonBones: number
  /** Number of SkinnedMesh (meshes with skeleton) */
  skinnedMeshCount: number
  /** Total mesh count */
  meshCount: number
  /** Currently playing action name */
  activeAction?: string
  /** Error message if any */
  error?: string
  /** Source: 'preview' (editor) or 'game' */
  source: 'preview' | 'game'
}

export function collectModelDebugInfo(
  scene: THREE.Object3D,
  animations: THREE.AnimationClip[],
  activeAction?: string,
  source: 'preview' | 'game' = 'preview'
): EnemyModelDebugInfo {
  let skeletonBones = 0
  let skinnedMeshCount = 0
  let meshCount = 0

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshCount++
      if (child instanceof THREE.SkinnedMesh && child.skeleton) {
        skinnedMeshCount++
        skeletonBones += child.skeleton.bones.length
      }
    }
  })

  return {
    loaded: true,
    animationCount: animations?.length ?? 0,
    animationNames: animations?.map((c) => c.name) ?? [],
    skeletonBones,
    skinnedMeshCount,
    meshCount,
    activeAction,
    source,
  }
}
