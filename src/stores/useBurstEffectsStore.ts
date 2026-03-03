import { create } from 'zustand'

interface BurstEffect {
  id: string
  from: { x: number; y: number; z: number }
  to: { x: number; y: number; z: number }
  startTime: number
}

interface BurstEffectsState {
  effects: BurstEffect[]
  addBurst: (from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }) => void
}

let nextId = 1

export const useBurstEffectsStore = create<BurstEffectsState>((set) => ({
  effects: [],

  addBurst: (from, to) => {
    const id = `burst-${nextId++}`
    const startTime = performance.now()
    set((state) => ({
      effects: [...state.effects, { id, from, to, startTime }],
    }))
  },
}))
