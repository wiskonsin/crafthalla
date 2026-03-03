import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { useMineralRocksStore } from '../../stores/useMineralRocksStore'
import { useTerrainStore } from '../../stores/useTerrainStore'
import { MineralRock } from './MineralRock'

const DEFAULT_ROCK_PATH = '/tiles/rock.png'

export function MineralRocksManager() {
  const rocks = useMineralRocksStore((s) => s.rocks)
  const rockPreset = useTerrainStore((s) => s.rockPreset)
  const customRockBlobId = useTerrainStore((s) => s.customRockBlobId)
  const getBlobUrl = useTerrainStore((s) => s.getBlobUrl)

  const [rockTex, setRockTex] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let cancelled = false
    const loadTex = async () => {
      let url = DEFAULT_ROCK_PATH
      if (rockPreset === 'custom' && customRockBlobId) {
        const blobUrl = await getBlobUrl(customRockBlobId)
        if (blobUrl) url = blobUrl
      }

      const loader = new THREE.TextureLoader()
      loader.load(url, (tex) => {
        if (cancelled) return
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping
        tex.repeat.set(2, 2)
        tex.colorSpace = THREE.SRGBColorSpace
        setRockTex(tex)
      })
    }
    loadTex()
    return () => { cancelled = true }
  }, [rockPreset, customRockBlobId, getBlobUrl])

  return (
    <group>
      {rocks.map((rock) => (
        <MineralRock key={rock.id} rock={rock} rockTexture={rockTex} />
      ))}
    </group>
  )
}
