import { create } from 'zustand'

export interface DissolveEffect {
  id: string
  position: { x: number; y: number; z: number }
  startTime: number
}

interface DissolveState {
  effects: DissolveEffect[]
  addDissolve: (position: { x: number; y: number; z: number }) => void
}

let nextId = 1

export const useDissolveStore = create<DissolveState>((set) => ({
  effects: [],

  addDissolve: (position) => {
    set((state) => ({
      effects: [
        ...state.effects,
        { id: `dissolve-${nextId++}`, position, startTime: performance.now() },
      ],
    }))
  },
}))
