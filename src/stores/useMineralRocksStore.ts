import { create } from 'zustand'
import { MINERAL_ROCK_CONFIG } from '../config/constants'

export interface MineralRock {
  id: string
  position: { x: number; y: number; z: number }
  minerals: number
  maxMinerals: number
  seed: number
  scale: number
}

interface MineralRocksState {
  rocks: MineralRock[]
  generateRocks: () => void
  harvestFrom: (rockId: string, amount: number) => number
  getRock: (id: string) => MineralRock | undefined
  reset: () => void
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export const useMineralRocksStore = create<MineralRocksState>((set, get) => ({
  rocks: [],

  generateRocks: () => {
    const { count, minDistFromCenter, maxDistFromCenter, minSpacing, minMinerals, maxMinerals } =
      MINERAL_ROCK_CONFIG
    const rng = seededRandom(Date.now() % 100000)
    const rocks: MineralRock[] = []

    let attempts = 0
    while (rocks.length < count && attempts < 500) {
      attempts++
      const angle = rng() * Math.PI * 2
      const dist = minDistFromCenter + rng() * (maxDistFromCenter - minDistFromCenter)
      const x = Math.cos(angle) * dist
      const z = Math.sin(angle) * dist

      const tooClose = rocks.some((r) => {
        const dx = r.position.x - x
        const dz = r.position.z - z
        return Math.sqrt(dx * dx + dz * dz) < minSpacing
      })
      if (tooClose) continue

      const minerals = Math.floor(minMinerals + rng() * (maxMinerals - minMinerals))
      rocks.push({
        id: `rock-${rocks.length}`,
        position: { x, y: 0, z },
        minerals,
        maxMinerals: minerals,
        seed: Math.floor(rng() * 100000),
        scale: 0.8 + rng() * 0.6,
      })
    }

    set({ rocks })
  },

  harvestFrom: (rockId, amount) => {
    const rock = get().rocks.find((r) => r.id === rockId)
    if (!rock || rock.minerals <= 0) return 0
    const harvested = Math.min(amount, rock.minerals)
    set({
      rocks: get().rocks.map((r) =>
        r.id === rockId ? { ...r, minerals: r.minerals - harvested } : r
      ),
    })
    return harvested
  },

  getRock: (id) => get().rocks.find((r) => r.id === id),

  reset: () => set({ rocks: [] }),
}))
