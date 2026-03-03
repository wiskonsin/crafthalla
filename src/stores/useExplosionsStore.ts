import { create } from 'zustand'

export interface Explosion {
  id: string
  position: { x: number; y: number; z: number }
  startTime: number
}

interface ExplosionsState {
  explosions: Explosion[]
  addExplosion: (position: { x: number; y: number; z: number }) => void
  removeExpired: () => void
}

let nextId = 1

export const useExplosionsStore = create<ExplosionsState>((set) => ({
  explosions: [],

  addExplosion: (position) => {
    const id = `explosion-${nextId++}`
    set((state) => ({
      explosions: [
        ...state.explosions,
        { id, position, startTime: performance.now() },
      ],
    }))
  },

  removeExpired: () => {
    const now = performance.now()
    set((state) => ({
      explosions: state.explosions.filter((e) => now - e.startTime < 600),
    }))
  },
}))
