import { create } from 'zustand'

export type EngineerState = 'idle' | 'walking' | 'repairing' | 'fading'

export interface Engineer {
  id: string
  position: { x: number; y: number; z: number }
  targetId: string | null
  targetType: 'central' | 'building' | null
  state: EngineerState
  repairProgress: number
  fadeProgress: number
}

interface EngineersState {
  engineers: Engineer[]
  addEngineer: (position: { x: number; y: number; z: number }) => string
  removeEngineer: (id: string) => void
  updateEngineer: (id: string, updates: Partial<Engineer>) => void
  getEngineer: (id: string) => Engineer | undefined
  reset: () => void
}

let nextId = 1

export const useEngineersStore = create<EngineersState>((set, get) => ({
  engineers: [],

  addEngineer: (position) => {
    const id = `engineer-${nextId++}`
    const engineer: Engineer = {
      id,
      position: { ...position },
      targetId: null,
      targetType: null,
      state: 'idle',
      repairProgress: 0,
      fadeProgress: 0,
    }
    set((state) => ({ engineers: [...state.engineers, engineer] }))
    return id
  },

  removeEngineer: (id) => {
    set((state) => ({
      engineers: state.engineers.filter((e) => e.id !== id),
    }))
  },

  updateEngineer: (id, updates) => {
    set((state) => ({
      engineers: state.engineers.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }))
  },

  getEngineer: (id) => get().engineers.find((e) => e.id === id),

  reset: () => set({ engineers: [] }),
}))
