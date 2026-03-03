import { create } from 'zustand'
import type { Building, BuildingType, Vector3 } from '../types'
import {
  BUILDING_COSTS,
  BASE_HP,
  BASE_RADIUS,
  TURRETS_PER_BASE,
  GENERATORS_PER_BASE,
  ENGINEER_CONFIG,
} from '../config/constants'
import { useResourcesStore } from './useResourcesStore'
import { useGameStore } from './useGameStore'
import { useExplosionsStore } from './useExplosionsStore'
import { useFloatingTextsStore } from './useFloatingTextsStore'

export interface GameBase {
  id: string
  position: Vector3
  isMain: boolean
}

interface BuildingsState {
  bases: GameBase[]
  buildings: Building[]
  centralHp: number
  centralMaxHp: number
  addBuilding: (type: BuildingType, position: Vector3, baseId?: string) => boolean
  addSubBase: (position: Vector3) => boolean
  removeBuilding: (id: string) => void
  damageBuilding: (id: string, damage: number) => void
  damageCentral: (damage: number) => void
  healBuilding: (id: string, amount: number) => void
  healCentral: (amount: number) => void
  toggleTurret: (id: string) => void
  getBuildingAt: (x: number, z: number) => Building | undefined
  canPlaceAt: (x: number, z: number, baseId: string, excludeId?: string) => boolean
  findNearestValidPlacement: (x: number, z: number, baseId: string) => { x: number; z: number } | null
  getBaseAt: (x: number, z: number) => GameBase | null
  canPlaceSubBase: (x: number, z: number) => boolean
  canPlaceEngineerAt: (x: number, z: number) => boolean
  reset: () => void
}

let nextId = 1
let nextBaseId = 1

function generateId(): string {
  return `building-${nextId++}`
}

function generateBaseId(): string {
  return `sub-${nextBaseId++}`
}

export const useBuildingsStore = create<BuildingsState>((set, get) => ({
  bases: [{ id: 'main', position: { x: 0, y: 0, z: 0 }, isMain: true }],
  buildings: [],
  centralHp: BASE_HP.central,
  centralMaxHp: BASE_HP.central,

  addSubBase: (position) => {
    const cost = BUILDING_COSTS.subBase
    const canAfford = useResourcesStore.getState().spendMetal(cost)
    if (!canAfford) return false

    const { x, z } = position
    const base = get().getBaseAt(x, z)
    if (!base) return false
    const dist = Math.sqrt(x * x + z * z)
    if (base.isMain && dist < 8) return false

    const threshold = 6
    const tooClose = get().bases.some(
      (b) =>
        Math.abs(b.position.x - x) < threshold &&
        Math.abs(b.position.z - z) < threshold
    )
    if (tooClose) return false

    const baseId = generateBaseId()
    const subBase: GameBase = { id: baseId, position: { x, y: 0, z }, isMain: false }
    const building: Building = {
      id: generateId(),
      type: 'subBase',
      position: { x, y: 0, z },
      hp: BASE_HP.subBase,
      maxHp: BASE_HP.subBase,
      baseId,
      createdAt: Date.now(),
    }
    set((state) => ({
      bases: [...state.bases, subBase],
      buildings: [...state.buildings, building],
    }))
    useFloatingTextsStore.getState().addText(`-${cost}`, '#ff4444', { x, y: 1.2, z })
    return true
  },

  addBuilding: (type, position, baseId) => {
    if (type === 'subBase') return get().addSubBase(position)

    const base = baseId ? get().bases.find((b) => b.id === baseId) : get().getBaseAt(position.x, position.z)
    if (!base) return false

    if (type !== 'wall') {
      const turretsInBase = get().buildings.filter((b) => b.baseId === base.id && (b.type === 'turret' || b.type === 'turret_aa')).length
      const generatorsInBase = get().buildings.filter((b) => b.baseId === base.id && b.type === 'generator').length

      if ((type === 'turret' || type === 'turret_aa') && generatorsInBase === 0) return false
      if ((type === 'turret' || type === 'turret_aa') && turretsInBase >= TURRETS_PER_BASE) return false
      if (type === 'generator' && generatorsInBase >= GENERATORS_PER_BASE) return false
    }

    const cost = BUILDING_COSTS[type]
    const canAfford = useResourcesStore.getState().spendMetal(cost)
    if (!canAfford) return false

    let { x, z } = position
    if (!get().canPlaceAt(x, z, base.id)) {
      const nearest = get().findNearestValidPlacement(x, z, base.id)
      if (!nearest) {
        useResourcesStore.getState().addMetal(cost)
        return false
      }
      x = nearest.x
      z = nearest.z
    }

    const rotation = type === 'wall' ? useGameStore.getState().wallRotation : undefined

    const building: Building = {
      id: generateId(),
      type,
      position: { x, y: position.y, z },
      hp: BASE_HP[type],
      maxHp: BASE_HP[type],
      enabled: type === 'turret' ? true : undefined,
      baseId: base.id,
      rotation,
      createdAt: Date.now(),
    }
    set((state) => ({ buildings: [...state.buildings, building] }))
    const yFloat = type === 'generator' ? 0.75 : type === 'subBase' ? 1.2 : 0
    useFloatingTextsStore.getState().addText(`-${cost}`, '#ff4444', { x, y: yFloat, z })
    return true
  },

  removeBuilding: (id) => {
    const b = get().buildings.find((x) => x.id === id)
    if (b?.type === 'subBase') {
      set((state) => ({
        bases: state.bases.filter((x) => x.id !== b.baseId),
        buildings: state.buildings.filter((x) => x.id !== id && x.baseId !== b.baseId),
      }))
    } else {
      set((state) => ({
        buildings: state.buildings.filter((x) => x.id !== id),
      }))
    }
  },

  damageBuilding: (id, damage) => {
    set((state) => {
      const updated = state.buildings.map((b) =>
        b.id === id ? { ...b, hp: Math.max(0, b.hp - damage) } : b
      )
      const toRemove = updated.filter((b) => b.hp <= 0)
      let newBuildings = updated.filter((b) => b.hp > 0)
      const subBaseToRemove = toRemove.find((b) => b.type === 'subBase')
      if (subBaseToRemove) {
        newBuildings = newBuildings.filter((b) => b.baseId !== subBaseToRemove.baseId)
        return {
          buildings: newBuildings,
          bases: state.bases.filter((b) => b.id !== subBaseToRemove.baseId),
        }
      }
      return { buildings: newBuildings }
    })
  },

  damageCentral: (damage) => {
    set((state) => {
      const newHp = Math.max(0, state.centralHp - damage)
      if (newHp <= 0) {
        useExplosionsStore.getState().addExplosion({ x: 0, y: 1.5, z: 0 })
        useGameStore.getState().setGameState('gameover')
      }
      return { centralHp: newHp }
    })
  },

  healBuilding: (id, amount) => {
    set((state) => ({
      buildings: state.buildings.map((b) =>
        b.id === id ? { ...b, hp: Math.min(b.maxHp, b.hp + amount) } : b
      ),
    }))
  },

  healCentral: (amount) => {
    set((state) => ({
      centralHp: Math.min(state.centralMaxHp, state.centralHp + amount),
    }))
  },

  toggleTurret: (id) => {
    set((state) => ({
      buildings: state.buildings.map((b) =>
        b.id === id && (b.type === 'turret' || b.type === 'turret_aa') ? { ...b, enabled: !(b.enabled ?? true) } : b
      ),
    }))
  },

  getBuildingAt: (x, z) => {
    const threshold = 2
    return get().buildings.find(
      (b) =>
        Math.abs(b.position.x - x) < threshold && Math.abs(b.position.z - z) < threshold
    )
  },

  getBaseAt: (x, z) => {
    for (const base of get().bases) {
      const dx = x - base.position.x
      const dz = z - base.position.z
      if (Math.sqrt(dx * dx + dz * dz) <= BASE_RADIUS) return base
    }
    return null
  },

  canPlaceSubBase: (x, z) => {
    const base = get().getBaseAt(x, z)
    if (!base) return false
    const dx = x - base.position.x
    const dz = z - base.position.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (base.isMain && dist < 8) return false
    const threshold = 6
    return !get().bases.some((b) => {
      const ddx = x - b.position.x
      const ddz = z - b.position.z
      return Math.sqrt(ddx * ddx + ddz * ddz) < threshold
    })
  },

  canPlaceEngineerAt: (x, z) => {
    const bases = get().bases
    return bases.some((b) => {
      const dx = x - b.position.x
      const dz = z - b.position.z
      return Math.sqrt(dx * dx + dz * dz) <= ENGINEER_CONFIG.placementRadius
    })
  },

  canPlaceAt: (x, z, baseId, excludeId) => {
    const { buildings, bases } = get()
    const base = bases.find((b) => b.id === baseId)
    if (!base) return false

    const dx = x - base.position.x
    const dz = z - base.position.z
    if (Math.sqrt(dx * dx + dz * dz) > BASE_RADIUS) return false

    const centralRadius = 2.5
    if (base.isMain && Math.abs(x) <= centralRadius && Math.abs(z) <= centralRadius) return false

    const subBaseRadius = 2
    const overlappingBase = bases
      .filter((b) => b.id !== baseId)
      .some(
        (b) =>
          Math.abs(b.position.x - x) < subBaseRadius + 2 &&
          Math.abs(b.position.z - z) < subBaseRadius + 2
      )
    if (overlappingBase) return false

    const threshold = 1.5
    const overlapping = buildings.some(
      (b) =>
        b.id !== excludeId &&
        Math.abs(b.position.x - x) < threshold &&
        Math.abs(b.position.z - z) < threshold
    )
    return !overlapping
  },

  findNearestValidPlacement: (x, z, baseId) => {
    const { canPlaceAt } = get()
    if (canPlaceAt(x, z, baseId)) return { x, z }
    const grid = 2
    for (let r = 1; r <= 8; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue
          const nx = Math.round(x / grid) * grid + dx * grid
          const nz = Math.round(z / grid) * grid + dz * grid
          if (canPlaceAt(nx, nz, baseId)) return { x: nx, z: nz }
        }
      }
    }
    return null
  },

  reset: () =>
    set({
      bases: [{ id: 'main', position: { x: 0, y: 0, z: 0 }, isMain: true }],
      buildings: [],
      centralHp: BASE_HP.central,
      centralMaxHp: BASE_HP.central,
    }),
}))
