export const GAME_SEED = 42

/** Radio de acción de cada base (donde se pueden colocar edificios) */
export const BASE_RADIUS = 22

/** Coste para construir una sub-base */
export const SUB_BASE_COST = 750

export const BUILDING_COSTS = {
  generator: 200,
  turret: 100,
  turret_aa: 180,
  engineer: 150,
  subBase: SUB_BASE_COST,
  wall: 10,
} as const

/** Limits per base (main + sub-bases). turret + turret_aa share the limit of 5 */
export const TURRETS_PER_BASE = 5
export const GENERATORS_PER_BASE = 2

export const RESOURCE_PRODUCTION = {
  generator: {
    metal: 4,
    energy: 10,
  },
} as const

export const ENERGY_CAP = 300

export const GRID_SIZE = 1
/** @deprecated Usar BASE_RADIUS */
export const PLACEMENT_RADIUS = BASE_RADIUS

export const BASE_HP = {
  generator: 200,
  turret: 150,
  turret_aa: 120,
  central: 500,
  subBase: 400,
  wall: 30,
} as const

export const CONSTRUCTION_DURATION = 1.5

export const EXPLOSION_RADIUS = 5

export const WAVE_CONFIG = {
  countdownSeconds: 10,
  spawnRadiusMin: 38,
  spawnRadiusMax: 48,
} as const

export const ENEMY_CONFIG = {
  baseHp: 50,
  hpPerWave: 12,
} as const

export const TURRET_CONFIG = {
  fireRate: 0.8,
  range: 10.5,
  energyCostPerShot: 4,
  idleEnergyPerSecond: 1,
} as const

export const MISSILE_SPEED = 4.5

/** Torreta antiaérea: dispara a dirigibles, consume mucha energía */
export const TURRET_AA_CONFIG = {
  damage: 60,
  fireRate: 1.2,
  range: 18,
  energyCostPerShot: 8,
  idleEnergyPerSecond: 3,
} as const

/** Engineer: repairs structures, 1/4 of max HP, then fades out */
export const ENGINEER_CONFIG = {
  repairAmount: 0.25,
  repairSpeed: 0.15,
  placementRadius: 12,
} as const

/** Dirigible: aparece ocasionalmente, lanza bombas al centro */
export const DIRIGIBLE_CONFIG = {
  hp: 120,
  speed: 1.5,
  bombDamage: 40,
  spawnChancePerWave: 0.25,
} as const

export const PROJECTILE_SPEED = 35

/** Kills needed for each central base evolution level (0=initial, 1, 2, 3...) */
export const CENTRAL_EVOLUTION_KILLS = [0, 5, 15, 35, 70]

/** Metal reward per enemy kill */
export const KILL_REWARD_METAL = 18

/** Vision radius for fog of war */
export const VISION_RADIUS = {
  central: 16,
  subBase: 14,
  generator: 12,
  turret: 9,
} as const

export const MINERAL_ROCK_CONFIG = {
  count: 10,
  minDistFromCenter: 14,
  maxDistFromCenter: 34,
  minSpacing: 6,
  minMinerals: 150,
  maxMinerals: 400,
} as const

export const HARVESTER_CONFIG = {
  cost: 50,
  speed: 3.5,
  carryCapacity: 30,
  gatherRate: 5,
  depositRate: 20,
  maxPerBase: 3,
} as const

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}
