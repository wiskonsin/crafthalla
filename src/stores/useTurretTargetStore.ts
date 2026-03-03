import { create } from 'zustand'

interface TurretTarget {
  x: number
  y: number
  z: number
}

interface TurretTargetState {
  targets: Record<string, TurretTarget>
  setTarget: (turretId: string, target: TurretTarget | null) => void
  getTarget: (turretId: string) => TurretTarget | null
}

export const useTurretTargetStore = create<TurretTargetState>((set, get) => ({
  targets: {},

  setTarget: (turretId, target) => {
    if (!target) {
      set((s) => {
        const { [turretId]: _, ...rest } = s.targets
        return { targets: rest }
      })
    } else {
      set((s) => ({
        targets: { ...s.targets, [turretId]: target },
      }))
    }
  },

  getTarget: (turretId) => get().targets[turretId] ?? null,
}))
