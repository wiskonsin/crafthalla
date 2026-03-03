import { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useUnitsStore } from '../../stores/useUnitsStore'
import { useGameStore } from '../../stores/useGameStore'
import { useCustomConfigStore } from '../../stores/useCustomConfigStore'
import { useEnemyGlbStore } from '../../stores/useEnemyGlbStore'
import { Enemy } from './Enemy'

export function EnemyManager() {
  const enemies = useUnitsStore((s) => s.enemies)
  const useCustomModels = useGameStore((s) => s.useCustomModels)
  const fbxBlobId = useCustomConfigStore((s) => s.config.enemy.fbxBlobId)
  const setGlbUrl = useEnemyGlbStore((s) => s.setUrl)
  const updateAllMixers = useEnemyGlbStore((s) => s.updateAllMixers)

  useEffect(() => {
    if (!useCustomModels) {
      setGlbUrl(null)
      return
    }
    let revoke: string | null = null
    useCustomConfigStore.getState().getBlobUrl('enemy').then((u) => {
      revoke = u
      setGlbUrl(u)
    })
    return () => {
      if (revoke && revoke.startsWith('blob:')) URL.revokeObjectURL(revoke)
      setGlbUrl(null)
    }
  }, [useCustomModels, fbxBlobId, setGlbUrl])

  useFrame((_, delta) => {
    updateAllMixers(delta)
  })

  return (
    <>
      {enemies.map((e) => (
        <Enemy
          key={e.id}
          id={e.id}
          position={[e.position.x, e.position.y ?? 0.6, e.position.z]}
          hp={e.hp}
          maxHp={e.maxHp}
        />
      ))}
    </>
  )
}
