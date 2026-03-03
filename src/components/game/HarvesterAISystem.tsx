import { useFrame } from '@react-three/fiber'
import { useHarvestersStore } from '../../stores/useHarvestersStore'
import { useMineralRocksStore } from '../../stores/useMineralRocksStore'
import { useResourcesStore } from '../../stores/useResourcesStore'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { useUnitsStore } from '../../stores/useUnitsStore'
import { useFloatingTextsStore } from '../../stores/useFloatingTextsStore'
import { HARVESTER_CONFIG } from '../../config/constants'
import { getMountainAvoidance } from '../../systems/terrainHeightmap'

const ARRIVE_THRESHOLD = 1.8
const DEPOSIT_THRESHOLD = 2.8
const SEPARATION_RADIUS = 2.5
const SEPARATION_FORCE = 4.0
const OBSTACLE_RADIUS = 2.0
const OBSTACLE_FORCE = 8.0
const ROCK_AVOID_RADIUS = 2.5
const ROCK_AVOID_FORCE = 6.0
const ENEMY_AVOID_RADIUS = 3.5
const ENEMY_AVOID_FORCE = 6.0

function findNearestBasePosition(hx: number, hz: number, homePos: { x: number; z: number }) {
  const bases = useBuildingsStore.getState().bases
  let best = { x: homePos.x, z: homePos.z }
  let bestDist = Infinity
  for (const base of bases) {
    const dx = base.position.x - hx
    const dz = base.position.z - hz
    const d = Math.sqrt(dx * dx + dz * dz)
    if (d < bestDist) {
      bestDist = d
      best = { x: base.position.x, z: base.position.z }
    }
  }
  return best
}

function getOccupiedRockIds(harvesters: ReturnType<typeof useHarvestersStore.getState>['harvesters'], excludeId: string) {
  const occupied = new Set<string>()
  for (const h of harvesters) {
    if (h.id === excludeId) continue
    if (h.targetRockId && (h.state === 'moving_to_rock' || h.state === 'gathering')) {
      occupied.add(h.targetRockId)
    }
  }
  return occupied
}

function computeSeparation(
  hx: number,
  hz: number,
  harvesters: ReturnType<typeof useHarvestersStore.getState>['harvesters'],
  selfId: string,
) {
  let sepX = 0
  let sepZ = 0
  for (const other of harvesters) {
    if (other.id === selfId) continue
    const dx = hx - other.position.x
    const dz = hz - other.position.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < SEPARATION_RADIUS && dist > 0.01) {
      const strength = (SEPARATION_RADIUS - dist) / SEPARATION_RADIUS
      sepX += (dx / dist) * strength
      sepZ += (dz / dist) * strength
    }
  }
  return { x: sepX * SEPARATION_FORCE, z: sepZ * SEPARATION_FORCE }
}

function computeObstacleAvoidance(hx: number, hz: number, targetRockId: string | null) {
  let avoidX = 0
  let avoidZ = 0

  const buildings = useBuildingsStore.getState().buildings
  const allObstacles: { x: number; z: number; r: number }[] = [
    { x: 0, z: 0, r: 5.0 },
  ]
  for (const b of buildings) {
    const r = b.type === 'subBase' ? 4.0 : b.type === 'generator' ? 3.0 : b.type === 'wall' ? 2.0 : 2.5
    allObstacles.push({ x: b.position.x, z: b.position.z, r })
  }

  for (const ob of allObstacles) {
    const dx = hx - ob.x
    const dz = hz - ob.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    const threshold = ob.r + OBSTACLE_RADIUS
    if (dist < threshold && dist > 0.01) {
      const strength = (threshold - dist) / threshold
      avoidX += (dx / dist) * strength * strength * OBSTACLE_FORCE
      avoidZ += (dz / dist) * strength * strength * OBSTACLE_FORCE
    }
  }

  const rocks = useMineralRocksStore.getState().rocks
  for (const rock of rocks) {
    if (rock.id === targetRockId) continue
    const dx = hx - rock.position.x
    const dz = hz - rock.position.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    const rockR = rock.scale * 1.2
    const threshold = rockR + ROCK_AVOID_RADIUS
    if (dist < threshold && dist > 0.01) {
      const strength = (threshold - dist) / threshold
      avoidX += (dx / dist) * strength * ROCK_AVOID_FORCE
      avoidZ += (dz / dist) * strength * ROCK_AVOID_FORCE
    }
  }

  const enemyPositions = useUnitsStore.getState().enemyPositions
  for (const id in enemyPositions) {
    const ep = enemyPositions[id]
    const dx = hx - ep.x
    const dz = hz - ep.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < ENEMY_AVOID_RADIUS && dist > 0.01) {
      const strength = (ENEMY_AVOID_RADIUS - dist) / ENEMY_AVOID_RADIUS
      avoidX += (dx / dist) * strength * ENEMY_AVOID_FORCE
      avoidZ += (dz / dist) * strength * ENEMY_AVOID_FORCE
    }
  }

  return { x: avoidX, z: avoidZ }
}

export function HarvesterAISystem() {
  useFrame((_, delta) => {
    const { harvesters, updateHarvester } = useHarvestersStore.getState()
    const rocks = useMineralRocksStore.getState().rocks
    const harvestFrom = useMineralRocksStore.getState().harvestFrom
    const addMetal = useResourcesStore.getState().addMetal

    for (const h of harvesters) {
      switch (h.state) {
        case 'idle': {
          const occupied = getOccupiedRockIds(harvesters, h.id)
          const availableRocks = rocks.filter((r) => r.minerals > 0 && !occupied.has(r.id))
          if (availableRocks.length === 0) break

          let nearest = availableRocks[0]
          let nearestDist = Infinity
          for (const r of availableRocks) {
            const dx = r.position.x - h.position.x
            const dz = r.position.z - h.position.z
            const d = dx * dx + dz * dz
            if (d < nearestDist) {
              nearestDist = d
              nearest = r
            }
          }

          updateHarvester(h.id, { state: 'moving_to_rock', targetRockId: nearest.id })
          break
        }

        case 'moving_to_rock': {
          const rock = h.targetRockId ? rocks.find((r) => r.id === h.targetRockId) : null
          if (!rock || rock.minerals <= 0) {
            updateHarvester(h.id, { state: 'idle', targetRockId: null })
            break
          }

          const occupied = getOccupiedRockIds(harvesters, h.id)
          if (occupied.has(rock.id)) {
            updateHarvester(h.id, { state: 'idle', targetRockId: null })
            break
          }

          const dx = rock.position.x - h.position.x
          const dz = rock.position.z - h.position.z
          const dist = Math.sqrt(dx * dx + dz * dz)

          if (dist < ARRIVE_THRESHOLD) {
            updateHarvester(h.id, { state: 'gathering' })
          } else {
            const sep = computeSeparation(h.position.x, h.position.z, harvesters, h.id)
            const obs = computeObstacleAvoidance(h.position.x, h.position.z, h.targetRockId)
            const mtn = getMountainAvoidance(h.position.x, h.position.z, rock.position.x, rock.position.z)
            const step = HARVESTER_CONFIG.speed * delta
            let moveX = (dx / dist) * step + (sep.x + obs.x + mtn.x) * delta
            let moveZ = (dz / dist) * step + (sep.z + obs.z + mtn.z) * delta
            const moveMag = Math.sqrt(moveX * moveX + moveZ * moveZ)
            const maxStep = HARVESTER_CONFIG.speed * delta * 1.5
            if (moveMag > maxStep) {
              moveX = (moveX / moveMag) * maxStep
              moveZ = (moveZ / moveMag) * maxStep
            }
            updateHarvester(h.id, {
              position: { x: h.position.x + moveX, y: 0, z: h.position.z + moveZ },
            })
          }
          break
        }

        case 'gathering': {
          const rock = h.targetRockId ? rocks.find((r) => r.id === h.targetRockId) : null
          if (!rock || rock.minerals <= 0 || h.cargo >= HARVESTER_CONFIG.carryCapacity) {
            const nextState = h.cargo > 0 ? 'returning' : 'idle'
            updateHarvester(h.id, { state: nextState, targetRockId: null })
            break
          }

          const amount = HARVESTER_CONFIG.gatherRate * delta
          const harvested = harvestFrom(rock.id, amount)
          updateHarvester(h.id, {
            cargo: Math.min(h.cargo + harvested, HARVESTER_CONFIG.carryCapacity),
          })
          break
        }

        case 'returning': {
          const base = findNearestBasePosition(h.position.x, h.position.z, h.homePosition)
          const dx = base.x - h.position.x
          const dz = base.z - h.position.z
          const dist = Math.sqrt(dx * dx + dz * dz)

          if (dist < DEPOSIT_THRESHOLD) {
            updateHarvester(h.id, { state: 'depositing' })
            if (h.cargo > 0) {
              useFloatingTextsStore.getState().addText(
                `+${Math.floor(h.cargo)}`,
                '#44ff66',
                { x: h.position.x, y: 0.5, z: h.position.z },
              )
            }
          } else {
            const sep = computeSeparation(h.position.x, h.position.z, harvesters, h.id)
            const obs = computeObstacleAvoidance(h.position.x, h.position.z, null)
            const mtn = getMountainAvoidance(h.position.x, h.position.z, base.x, base.z)
            const step = HARVESTER_CONFIG.speed * delta
            let moveX = (dx / dist) * step + (sep.x + obs.x + mtn.x) * delta
            let moveZ = (dz / dist) * step + (sep.z + obs.z + mtn.z) * delta
            const moveMag = Math.sqrt(moveX * moveX + moveZ * moveZ)
            const maxStep = HARVESTER_CONFIG.speed * delta * 1.5
            if (moveMag > maxStep) {
              moveX = (moveX / moveMag) * maxStep
              moveZ = (moveZ / moveMag) * maxStep
            }
            updateHarvester(h.id, {
              position: { x: h.position.x + moveX, y: 0, z: h.position.z + moveZ },
            })
          }
          break
        }

        case 'depositing': {
          if (h.cargo <= 0) {
            updateHarvester(h.id, { state: 'idle', cargo: 0 })
            break
          }

          const deposit = Math.min(HARVESTER_CONFIG.depositRate * delta, h.cargo)
          addMetal(deposit)
          updateHarvester(h.id, { cargo: h.cargo - deposit })
          break
        }
      }
    }
  })

  return null
}
