import { create } from 'zustand'
import type { CustomModelType, CustomModelConfig } from '../types/customModels'
import { DEFAULT_CUSTOM_CONFIG, DEFAULT_MODEL_URLS } from '../types/customModels'
import {
  saveFbxBlob,
  getFbxBlob,
  deleteFbxBlob,
  saveTextureBlob,
  getTextureBlob,
  getAllTexturePaths,
  deleteTextureBlobs,
  saveConfig,
  loadConfig,
} from '../lib/customModelStorage'

export type CustomConfigState = Record<CustomModelType, CustomModelConfig>

const INITIAL: CustomConfigState = {
  central: {
    ...DEFAULT_CUSTOM_CONFIG,
    scale: [3, 3, 3],
    position: [0, 1.3, 0],
  },
  generator: {
    ...DEFAULT_CUSTOM_CONFIG,
    scale: [2.05, 2.05, 2.05],
    position: [0, 0.4, 0],
  },
  turret: {
    ...DEFAULT_CUSTOM_CONFIG,
    scale: [1.55, 1.55, 1.55],
    position: [0, 1.05, -0.15],
    muzzleOffset: [0, 0.25, -0.8],
  },
  turret_aa: {
    ...DEFAULT_CUSTOM_CONFIG,
    scale: [1.7, 1.7, 1.7],
    position: [0, 0.6, 0],
    muzzleOffset: [0, 0.3, -0.8],
  },
  subBase: {
    ...DEFAULT_CUSTOM_CONFIG,
    scale: [2.45, 2.45, 2.45],
    position: [0, 0.05, 0],
  },
  engineer: { ...DEFAULT_CUSTOM_CONFIG },
  enemy: {
    ...DEFAULT_CUSTOM_CONFIG,
    scale: [0.83, 0.83, 0.83],
    position: [-0.5, 1.5, 0],
    headOffset: [0.193, 0.05, 0.052],
  },
  harvester: {
    ...DEFAULT_CUSTOM_CONFIG,
    position: [0, 0.3, 0],
  },
}

interface UseCustomConfigState {
  config: CustomConfigState
  hasAnyCustomModels: boolean
  textureUpdate?: number
  setConfig: (type: CustomModelType, config: Partial<CustomModelConfig>) => void
  setFbx: (type: CustomModelType, file: File) => Promise<void>
  setTextures: (type: CustomModelType, files: File[]) => Promise<void>
  setFbxFolder: (type: CustomModelType, files: File[]) => Promise<void>
  clearFbx: (type: CustomModelType) => Promise<void>
  getTextureUrlMap: (type: CustomModelType) => Promise<Map<string, string>>
  getTextureCount: (type: CustomModelType) => Promise<number>
  loadFromStorage: () => Promise<void>
  saveToStorage: () => Promise<void>
  getBlobUrl: (type: CustomModelType) => Promise<string | null>
}

export const useCustomConfigStore = create<UseCustomConfigState>((set, get) => ({
  config: { ...INITIAL },
  hasAnyCustomModels: true,

  setConfig: (type, updates) => {
    set((state) => ({
      config: {
        ...state.config,
        [type]: { ...state.config[type], ...updates },
      },
    }))
  },

  setFbx: async (type, file) => {
    if (!file.name.toLowerCase().endsWith('.glb')) return
    await get().clearFbx(type)
    const blobId = `model-${type}-${Date.now()}`
    await saveFbxBlob(blobId, file)
    set((state) => ({
      config: {
        ...state.config,
        [type]: { ...state.config[type], fbxBlobId: blobId },
      },
      hasAnyCustomModels: true,
    }))
  },

  setTextures: async (type, files) => {
    const cfg = get().config[type]
    if (!cfg.fbxBlobId) return
    for (const f of files) {
      const ext = f.name.split('.').pop()?.toLowerCase()
      if (['png', 'jpg', 'jpeg'].includes(ext || '')) {
        await saveTextureBlob(type, f.name, f)
      }
    }
    set((state) => ({ textureUpdate: (state.textureUpdate ?? 0) + 1 }))
  },

  setFbxFolder: async (type, files) => {
    await get().clearFbx(type)
    const modelFile = files.find((f) => f.name.toLowerCase().endsWith('.glb'))
    if (!modelFile) return
    const blobId = `model-${type}-${Date.now()}`
    await saveFbxBlob(blobId, modelFile)
    set((state) => ({
      config: {
        ...state.config,
        [type]: { ...state.config[type], fbxBlobId: blobId },
      },
      hasAnyCustomModels: true,
    }))
  },

  clearFbx: async (type) => {
    const cfg = get().config[type]
    if (cfg.fbxBlobId) {
      await deleteFbxBlob(cfg.fbxBlobId)
    }
    await deleteTextureBlobs(type)
    set((state) => ({
      config: {
        ...state.config,
        [type]: { ...state.config[type], fbxBlobId: null },
      },
    }))
  },

  getTextureUrlMap: async (type) => {
    const map = new Map<string, string>()
    let paths: string[] = []
    try {
      paths = await getAllTexturePaths(type)
    } catch {
      return map
    }
    for (const path of paths) {
      const blob = await getTextureBlob(type, path)
      if (blob) {
        const url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        map.set(path, url)
        const filename = path.split(/[/\\]/).pop()
        if (filename) {
          if (!map.has(filename)) map.set(filename, url)
          map.set(filename.toLowerCase(), url)
          map.set(path.toLowerCase(), url)
        }
      }
    }
    return map
  },

  getTextureCount: async (type) => {
    const paths = await getAllTexturePaths(type)
    const unique = new Set(paths.map((p) => p.split(/[/\\]/).pop() ?? p))
    return unique.size
  },

  loadFromStorage: async () => {
    const stored = await loadConfig()
    if (stored?.config) {
      const storedConfig = stored.config as CustomConfigState
      const merged: CustomConfigState = {} as CustomConfigState
      for (const k of Object.keys(INITIAL) as CustomModelType[]) {
        const def = INITIAL[k]
        const s = storedConfig[k] as CustomModelConfig | undefined
        merged[k] = {
          ...def,
          ...s,
          rotation: s?.rotation ?? def.rotation,
          headOffset: s?.headOffset ?? def.headOffset,
        } as CustomModelConfig
      }
      set({
        config: merged,
        hasAnyCustomModels: Object.values(storedConfig).some(
          (c) => (c as CustomModelConfig).fbxBlobId != null
        ),
      })
    }
  },

  saveToStorage: async () => {
    const { config } = get()
    await saveConfig({ config })
  },

  getBlobUrl: async (type) => {
    const cfg = get().config[type]
    if (!cfg.fbxBlobId) {
      return DEFAULT_MODEL_URLS[type] ?? null
    }
    const blob = await getFbxBlob(cfg.fbxBlobId)
    if (!blob) {
      return DEFAULT_MODEL_URLS[type] ?? null
    }
    return URL.createObjectURL(blob)
  },
}))
