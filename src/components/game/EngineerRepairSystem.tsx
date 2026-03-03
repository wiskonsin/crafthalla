import { useFrame } from '@react-three/fiber'
import { useEngineersStore } from '../../stores/useEngineersStore'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { ENGINEER_CONFIG } from '../../config/constants'

const REPAIR_RANGE = 3
const FADE_DURATION = 1.5

export function EngineerRepairSystem() {
  useFrame((_, delta) => {
    const engineers = useEngineersStore.getState().engineers
    const buildings = useBuildingsStore.getState().buildings
    const centralHp = useBuildingsStore.getState().centralHp
    const centralMaxHp = useBuildingsStore.getState().centralMaxHp

    for (const eng of engineers) {
      if (eng.state === 'fading') {
        const newProgress = Math.min(1, eng.fadeProgress + delta / FADE_DURATION)
        useEngineersStore.getState().updateEngineer(eng.id, { fadeProgress: newProgress })
        if (newProgress >= 1) {
          useEngineersStore.getState().removeEngineer(eng.id)
        }
        continue
      }

      let targetX = 0
      let targetZ = 0
      let targetMaxHp = centralMaxHp
      let targetHp = centralHp
      let targetId: string | null = 'central'
      let targetType: 'central' | 'building' | null = 'central'

      if (eng.targetId && eng.targetType) {
        if (eng.targetType === 'central') {
          targetX = 0
          targetZ = 0
          targetMaxHp = centralMaxHp
          targetHp = centralHp
          targetId = 'central'
        } else if (eng.targetType === 'building') {
          const b = buildings.find((x) => x.id === eng.targetId)
          if (!b || b.hp >= b.maxHp) {
            useEngineersStore.getState().updateEngineer(eng.id, {
              targetId: null,
              targetType: null,
              state: 'idle',
            })
            continue
          }
          targetX = b.position.x
          targetZ = b.position.z
          targetMaxHp = b.maxHp
          targetHp = b.hp
          targetId = b.id
        }
      }

      if (eng.state === 'idle') {
        if (targetHp >= targetMaxHp - 0.01) {
          const nearest = findNearestDamagedTarget(eng.position, buildings, centralHp, centralMaxHp)
          if (nearest) {
            useEngineersStore.getState().updateEngineer(eng.id, {
              targetId: nearest.id,
              targetType: nearest.type,
              state: 'walking',
            })
          }
          continue
        }
        useEngineersStore.getState().updateEngineer(eng.id, {
          targetId,
          targetType,
          state: 'walking',
        })
        continue
      }

      if (eng.state === 'walking') {
        const dx = targetX - eng.position.x
        const dz = targetZ - eng.position.z
        const dist = Math.sqrt(dx * dx + dz * dz)

        if (dist < REPAIR_RANGE) {
          const stillNeedsRepair =
            (eng.targetType === 'central' && centralHp < centralMaxHp - 0.5) ||
            (eng.targetType === 'building' &&
              targetId &&
              (buildings.find((b) => b.id === targetId)?.hp ?? 0) <
                (buildings.find((b) => b.id === targetId)?.maxHp ?? 1) - 0.5)
          if (stillNeedsRepair) {
            useEngineersStore.getState().updateEngineer(eng.id, { state: 'repairing' })
          } else {
            useEngineersStore.getState().updateEngineer(eng.id, {
              targetId: null,
              targetType: null,
              state: 'idle',
            })
          }
          continue
        }

        const len = dist || 1
        const move = Math.min(WALK_SPEED * delta, dist - REPAIR_RANGE)
        const nx = eng.position.x + (dx / len) * move
        const nz = eng.position.z + (dz / len) * move
        useEngineersStore.getState().updateEngineer(eng.id, {
          position: { ...eng.position, x: nx, z: nz },
        })
        continue
      }

      if (eng.state === 'repairing') {
        const currentHp =
          targetType === 'central'
            ? useBuildingsStore.getState().centralHp
            : targetId
              ? buildings.find((b) => b.id === targetId)?.hp ?? 0
              : 0
        const currentMaxHp =
          targetType === 'central'
            ? useBuildingsStore.getState().centralMaxHp
            : targetId
              ? buildings.find((b) => b.id === targetId)?.maxHp ?? 1
              : 1
        const repairAmount = currentMaxHp * ENGINEER_CONFIG.repairAmount
        const progress = eng.repairProgress + delta * ENGINEER_CONFIG.repairSpeed
        const healThisFrame = Math.min(
          repairAmount * ENGINEER_CONFIG.repairSpeed * delta,
          currentMaxHp - currentHp
        )

        if (targetType === 'central') {
          useBuildingsStore.getState().healCentral(healThisFrame)
        } else if (targetId) {
          useBuildingsStore.getState().healBuilding(targetId, healThisFrame)
        }

        if (progress >= 1) {
          useEngineersStore.getState().updateEngineer(eng.id, {
            state: 'fading',
            repairProgress: 0,
            targetId: null,
            targetType: null,
          })
        } else {
          useEngineersStore.getState().updateEngineer(eng.id, { repairProgress: progress })
        }
      }
    }
  })

  return null
}

const WALK_SPEED = 1.8

function findNearestDamagedTarget(
  pos: { x: number; y: number; z: number },
  buildings: { id: string; position: { x: number; z: number }; hp: number; maxHp: number }[],
  centralHp: number,
  centralMaxHp: number
): { id: string; type: 'central' | 'building' } | null {
  let nearest: { id: string; type: 'central' | 'building'; dist: number } | null = null

  if (centralHp < centralMaxHp - 1) {
    const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z)
    nearest = { id: 'central', type: 'central', dist }
  }

  for (const b of buildings) {
    if (b.hp >= b.maxHp - 1) continue
    const dx = b.position.x - pos.x
    const dz = b.position.z - pos.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (!nearest || dist < nearest.dist) {
      nearest = { id: b.id, type: 'building', dist }
    }
  }

  return nearest ? { id: nearest.id, type: nearest.type } : null
}
