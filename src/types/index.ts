export type BuildingType = 'generator' | 'turret' | 'turret_aa' | 'subBase' | 'wall'
export type BuildOption = BuildingType | 'engineer'

export interface Vector3 {
  x: number
  y: number
  z: number
}

/** baseId: 'main' para base central, 'sub-X' para sub-bases */
export interface Building {
  id: string
  type: BuildingType
  position: Vector3
  hp: number
  maxHp: number
  enabled?: boolean
  baseId: string
  rotation?: number
  createdAt: number
}

export interface Enemy {
  id: string
  position: Vector3
  hp: number
  maxHp: number
}

export interface Projectile {
  id: string
  position: Vector3
  targetEnemyId: string
}
