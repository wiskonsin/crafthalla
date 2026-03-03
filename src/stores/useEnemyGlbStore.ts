import { create } from 'zustand'
import * as THREE from 'three'

interface EnemyGlbState {
  url: string | null
  mixers: Map<string, THREE.AnimationMixer>
  registerMixer: (id: string, mixer: THREE.AnimationMixer) => void
  unregisterMixer: (id: string) => void
  setUrl: (url: string | null) => void
  updateAllMixers: (delta: number) => void
}

export const useEnemyGlbStore = create<EnemyGlbState>((set, get) => ({
  url: null,
  mixers: new Map(),

  setUrl: (url) => set({ url }),

  registerMixer: (id, mixer) => {
    get().mixers.set(id, mixer)
  },

  unregisterMixer: (id) => {
    const m = get().mixers
    const mixer = m.get(id)
    if (mixer) {
      mixer.stopAllAction()
      m.delete(id)
    }
  },

  updateAllMixers: (delta) => {
    get().mixers.forEach((mixer) => mixer.update(delta))
  },
}))
