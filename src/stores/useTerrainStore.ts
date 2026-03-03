import { create } from 'zustand'
import { getDB } from '../lib/customModelStorage'

export type TerrainPreset = 'normal' | 'exoplanet' | 'custom'
export type RockPreset = 'default' | 'custom'

interface TerrainState {
  terrainPreset: TerrainPreset
  rockPreset: RockPreset
  grassEnabled: boolean
  customTerrainBlobId: string | null
  customRockBlobId: string | null
  setTerrainPreset: (p: TerrainPreset) => void
  setRockPreset: (p: RockPreset) => void
  setGrassEnabled: (v: boolean) => void
  uploadTerrainTile: (file: File) => Promise<void>
  uploadRockTile: (file: File) => Promise<void>
  clearCustomTerrain: () => Promise<void>
  clearCustomRock: () => Promise<void>
  getBlobUrl: (blobId: string) => Promise<string | null>
  loadFromStorage: () => Promise<void>
  saveToStorage: () => Promise<void>
}

const TILE_STORE_KEY = 'terrain-config'
const TILE_SIZE = 512

async function resizeImageTo512(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = TILE_SIZE
      canvas.height = TILE_SIZE
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, TILE_SIZE, TILE_SIZE)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob'))
      }, 'image/png')
      URL.revokeObjectURL(img.src)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export const useTerrainStore = create<TerrainState>((set, get) => ({
  terrainPreset: 'normal',
  rockPreset: 'default',
  grassEnabled: true,
  customTerrainBlobId: null,
  customRockBlobId: null,

  setTerrainPreset: (p) => set({ terrainPreset: p }),
  setRockPreset: (p) => set({ rockPreset: p }),
  setGrassEnabled: (v) => set({ grassEnabled: v }),

  uploadTerrainTile: async (file) => {
    const resized = await resizeImageTo512(file)
    const blobId = `terrain-tile-${Date.now()}`
    const db = await getDB()
    await db.put('fbx-blobs', resized, blobId)
    const old = get().customTerrainBlobId
    if (old) {
      try { await db.delete('fbx-blobs', old) } catch {}
    }
    set({ customTerrainBlobId: blobId, terrainPreset: 'custom' })
  },

  uploadRockTile: async (file) => {
    const resized = await resizeImageTo512(file)
    const blobId = `rock-tile-${Date.now()}`
    const db = await getDB()
    await db.put('fbx-blobs', resized, blobId)
    const old = get().customRockBlobId
    if (old) {
      try { await db.delete('fbx-blobs', old) } catch {}
    }
    set({ customRockBlobId: blobId, rockPreset: 'custom' })
  },

  clearCustomTerrain: async () => {
    const blobId = get().customTerrainBlobId
    if (blobId) {
      const db = await getDB()
      try { await db.delete('fbx-blobs', blobId) } catch {}
    }
    set({ customTerrainBlobId: null, terrainPreset: 'normal' })
  },

  clearCustomRock: async () => {
    const blobId = get().customRockBlobId
    if (blobId) {
      const db = await getDB()
      try { await db.delete('fbx-blobs', blobId) } catch {}
    }
    set({ customRockBlobId: null, rockPreset: 'default' })
  },

  getBlobUrl: async (blobId) => {
    const db = await getDB()
    const blob = await db.get('fbx-blobs', blobId)
    if (!blob) return null
    return URL.createObjectURL(blob)
  },

  loadFromStorage: async () => {
    const db = await getDB()
    const stored = await db.get('config', TILE_STORE_KEY)
    if (stored) {
      const s = stored as Record<string, unknown>
      set({
        terrainPreset: (s.terrainPreset as TerrainPreset) || 'normal',
        rockPreset: (s.rockPreset as RockPreset) || 'default',
        grassEnabled: s.grassEnabled !== false,
        customTerrainBlobId: (s.customTerrainBlobId as string) || null,
        customRockBlobId: (s.customRockBlobId as string) || null,
      })
    }
  },

  saveToStorage: async () => {
    const { terrainPreset, rockPreset, grassEnabled, customTerrainBlobId, customRockBlobId } = get()
    const db = await getDB()
    await db.put('config', {
      terrainPreset,
      rockPreset,
      grassEnabled,
      customTerrainBlobId,
      customRockBlobId,
    }, TILE_STORE_KEY)
  },
}))
