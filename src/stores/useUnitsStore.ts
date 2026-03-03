import { create } from 'zustand'
import type { Enemy, Vector3 } from '../types'
import { useGameStore } from './useGameStore'
import { useResourcesStore } from './useResourcesStore'
import { useDissolveStore } from './useDissolveStore'
import { KILL_REWARD_METAL } from '../config/constants'

interface UnitsState {
  enemies: Enemy[]
  enemyPositions: Record<string, { x: number; y: number; z: number }>
  addEnemy: (position: Vector3, hp?: number) => string
  removeEnemy: (id: string) => void
  damageEnemy: (id: string, damage: number) => void
  getEnemy: (id: string) => Enemy | undefined
  updateEnemyPosition: (id: string, position: { x: number; y: number; z: number }) => void
  reset: () => void
}

let nextId = 1

function generateId(): string {
  return `enemy-${nextId++}`
}

export const useUnitsStore = create<UnitsState>((set, get) => ({
  enemies: [],
  enemyPositions: {},

  addEnemy: (position, hp = 100) => {
    const enemy: Enemy = {
      id: generateId(),
      position,
      hp,
      maxHp: hp,
    }
    set((state) => ({ enemies: [...state.enemies, enemy] }))
    return enemy.id
  },

  removeEnemy: (id) => {
    set((state) => {
      const { [id]: _, ...rest } = state.enemyPositions
      return {
        enemies: state.enemies.filter((e) => e.id !== id),
        enemyPositions: rest,
      }
    })
  },

  updateEnemyPosition: (id, position) => {
    set((state) => ({
      enemyPositions: {
        ...state.enemyPositions,
        [id]: position,
      },
    }))
  },

  damageEnemy: (id, damage) => {
    set((state) => {
      const updated = state.enemies.map((e) =>
        e.id === id ? { ...e, hp: Math.max(0, e.hp - damage) } : e
      )
      const alive = updated.filter((e) => e.hp > 0)
      const deadIds = updated.filter((e) => e.hp <= 0).map((e) => e.id)
      deadIds.forEach((deadId) => {
        const pos = state.enemyPositions[deadId]
        if (pos) useDissolveStore.getState().addDissolve(pos)
        useGameStore.getState().addKill()
        useResourcesStore.getState().addMetal(KILL_REWARD_METAL)
      })
      const newPositions = { ...state.enemyPositions }
      deadIds.forEach((deadId) => delete newPositions[deadId])
      return {
        enemies: alive,
        enemyPositions: newPositions,
      }
    })
  },

  getEnemy: (id) => get().enemies.find((e) => e.id === id),

  reset: () => set({ enemies: [], enemyPositions: {} }),
}))
