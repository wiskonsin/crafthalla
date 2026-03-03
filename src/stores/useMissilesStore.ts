import { create } from 'zustand'

export interface MissileData {
  id: string
  fromPos: { x: number; y: number; z: number }
  targetEnemyId: string
  targetLastPos: { x: number; y: number; z: number }
}

interface MissilesState {
  missiles: MissileData[]
  addMissile: (
    from: { x: number; y: number; z: number },
    targetId: string,
    targetPos: { x: number; y: number; z: number }
  ) => void
  removeMissile: (id: string) => void
}

let nextId = 1

export const useMissilesStore = create<MissilesState>((set) => ({
  missiles: [],

  addMissile: (from, targetId, targetPos) => {
    const id = `missile-${nextId++}`
    set((s) => ({
      missiles: [
        ...s.missiles,
        { id, fromPos: from, targetEnemyId: targetId, targetLastPos: targetPos },
      ],
    }))
  },

  removeMissile: (id) => {
    set((s) => ({
      missiles: s.missiles.filter((m) => m.id !== id),
    }))
  },
}))
