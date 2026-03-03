import { create } from 'zustand'
import { HARVESTER_CONFIG } from '../config/constants'

export type HarvesterState = 'idle' | 'moving_to_rock' | 'gathering' | 'returning' | 'depositing'

export interface Harvester {
  id: string
  baseId: string
  position: { x: number; y: number; z: number }
  state: HarvesterState
  targetRockId: string | null
  cargo: number
  homePosition: { x: number; y: number; z: number }
  createdAt: number
}

interface HarvestersStoreState {
  harvesters: Harvester[]
  addHarvester: (baseId: string, position: { x: number; y: number; z: number }) => string | null
  removeHarvester: (id: string) => void
  updateHarvester: (id: string, updates: Partial<Harvester>) => void
  getHarvester: (id: string) => Harvester | undefined
  getHarvesterCountForBase: (baseId: string) => number
  reset: () => void
}

let nextId = 1

export const useHarvestersStore = create<HarvestersStoreState>((set, get) => ({
  harvesters: [],

  addHarvester: (baseId, position) => {
    const count = get().harvesters.filter((h) => h.baseId === baseId).length
    if (count >= HARVESTER_CONFIG.maxPerBase) return null
    const id = `harvester-${nextId++}`
    set((s) => ({
      harvesters: [
        ...s.harvesters,
        {
          id,
          baseId,
          position: { ...position },
          state: 'idle' as HarvesterState,
          targetRockId: null,
          cargo: 0,
          homePosition: { ...position },
          createdAt: Date.now(),
        },
      ],
    }))
    return id
  },

  removeHarvester: (id) => {
    set((s) => ({ harvesters: s.harvesters.filter((h) => h.id !== id) }))
  },

  updateHarvester: (id, updates) => {
    set((s) => ({
      harvesters: s.harvesters.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    }))
  },

  getHarvester: (id) => get().harvesters.find((h) => h.id === id),

  getHarvesterCountForBase: (baseId) =>
    get().harvesters.filter((h) => h.baseId === baseId).length,

  reset: () => {
    nextId = 1
    set({ harvesters: [] })
  },
}))
