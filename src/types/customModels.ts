export type CustomModelType =
  | 'central'
  | 'generator'
  | 'turret'
  | 'turret_aa'
  | 'subBase'
  | 'engineer'
  | 'enemy'
  | 'harvester'

export interface CustomModelConfig {
  fbxBlobId: string | null
  scale: [number, number, number]
  position: [number, number, number]
  /** Euler rotation in radians (X, Y, Z) */
  rotation: [number, number, number]
  /** For turrets: where the muzzle/barrel points (local space). Used for burst origin and rotation. */
  muzzleOffset: [number, number, number] | null
  /** For enemies: where the head/face points (local space). Used for rotation pivot and preview. */
  headOffset: [number, number, number] | null
}

export const DEFAULT_CUSTOM_CONFIG: CustomModelConfig = {
  fbxBlobId: null,
  scale: [1, 1, 1],
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  muzzleOffset: null,
  headOffset: null,
}

export const DEFAULT_MODEL_URLS: Partial<Record<CustomModelType, string>> = {
  central: '/models/base.glb',
  generator: '/models/generator.glb',
  turret: '/models/turret.glb',
  turret_aa: '/models/turret.glb',
  subBase: '/models/base.glb',
  enemy: '/models/enemy.glb',
  harvester: '/models/truck.glb',
}

export const CUSTOM_MODEL_LABELS: Record<CustomModelType, string> = {
  central: 'Central building',
  generator: 'Generator',
  turret: 'Turret',
  turret_aa: 'AA Turret',
  subBase: 'Sub-base',
  engineer: 'Engineer',
  enemy: 'Enemy',
  harvester: 'Harvester Truck',
}

export const TURRET_TYPES: CustomModelType[] = ['turret', 'turret_aa']
export const ENEMY_TYPE: CustomModelType = 'enemy'
