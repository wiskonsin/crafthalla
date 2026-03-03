import { create } from 'zustand'
import type { EnemyModelDebugInfo } from '../types/modelDebug'

interface EnemyModelDebugState {
  info: EnemyModelDebugInfo | null
  setInfo: (info: EnemyModelDebugInfo | null) => void
}

export const useEnemyModelDebugStore = create<EnemyModelDebugState>((set) => ({
  info: null,
  setInfo: (info) => set({ info }),
}))
