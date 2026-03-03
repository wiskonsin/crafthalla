import { create } from 'zustand'
import type { Vector3 } from '../types'

interface ProjectileState {
  id: string
  position: Vector3
  targetEnemyId: string
}

interface ProjectilesState {
  projectiles: ProjectileState[]
  addProjectile: (position: Vector3, targetEnemyId: string) => string
  removeProjectile: (id: string) => void
}

let nextId = 1

function generateId(): string {
  return `projectile-${nextId++}`
}

export const useProjectilesStore = create<ProjectilesState>((set) => ({
  projectiles: [],

  addProjectile: (position, targetEnemyId) => {
    const id = generateId()
    set((state) => ({
      projectiles: [...state.projectiles, { id, position, targetEnemyId }],
    }))
    return id
  },

  removeProjectile: (id) => {
    set((state) => ({
      projectiles: state.projectiles.filter((p) => p.id !== id),
    }))
  },
}))
