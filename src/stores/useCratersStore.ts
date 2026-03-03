import { create } from 'zustand'

export interface Crater {
  id: string
  position: { x: number; z: number }
  createdAt: number
}

const CRATER_LIFETIME = 30000

interface CratersState {
  craters: Crater[]
  addCrater: (x: number, z: number) => void
  cleanup: () => void
  reset: () => void
}

let nextId = 1

export const useCratersStore = create<CratersState>((set) => ({
  craters: [],

  addCrater: (x, z) => {
    const id = `crater-${nextId++}`
    set((s) => ({
      craters: [...s.craters, { id, position: { x, z }, createdAt: Date.now() }],
    }))
  },

  cleanup: () => {
    const now = Date.now()
    set((s) => ({
      craters: s.craters.filter((c) => now - c.createdAt < CRATER_LIFETIME),
    }))
  },

  reset: () => {
    nextId = 1
    set({ craters: [] })
  },
}))

export { CRATER_LIFETIME }
