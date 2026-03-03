import { create } from 'zustand'
import { ENERGY_CAP } from '../config/constants'

interface ResourcesState {
  metal: number
  energy: number
  addMetal: (amount: number) => void
  addEnergy: (amount: number) => void
  spendMetal: (amount: number) => boolean
  spendEnergy: (amount: number) => boolean
  canAfford: (metal: number, energy: number) => boolean
  reset: () => void
}

const INITIAL_METAL = 350
const INITIAL_ENERGY = 120

export const useResourcesStore = create<ResourcesState>((set, get) => ({
  metal: INITIAL_METAL,
  energy: INITIAL_ENERGY,

  addMetal: (amount) => set((state) => ({ metal: state.metal + amount })),
  addEnergy: (amount) =>
    set((state) => ({ energy: Math.min(ENERGY_CAP, state.energy + amount) })),

  spendMetal: (amount) => {
    const { metal } = get()
    if (metal < amount) return false
    set({ metal: metal - amount })
    return true
  },

  spendEnergy: (amount) => {
    const { energy } = get()
    if (energy < amount) return false
    set({ energy: energy - amount })
    return true
  },

  canAfford: (metal, energy) => {
    const state = get()
    return state.metal >= metal && state.energy >= energy
  },

  reset: () => set({ metal: INITIAL_METAL, energy: INITIAL_ENERGY }),
}))
