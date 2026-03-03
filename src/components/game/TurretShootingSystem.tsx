import { useFrame } from '@react-three/fiber'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { useUnitsStore } from '../../stores/useUnitsStore'
import { useResourcesStore } from '../../stores/useResourcesStore'
import { useMissilesStore } from '../../stores/useMissilesStore'
import { useGameStore } from '../../stores/useGameStore'
import { useCustomConfigStore } from '../../stores/useCustomConfigStore'
import { useTurretTargetStore } from '../../stores/useTurretTargetStore'
import { TURRET_CONFIG, CONSTRUCTION_DURATION } from '../../config/constants'

const lastShotTime: Record<string, number> = {}

function getMuzzlePosition(
  turret: { position: { x: number; y?: number; z: number } },
  config: { position: [number, number, number]; scale: [number, number, number]; muzzleOffset: [number, number, number] | null },
  angleY: number
): { x: number; y: number; z: number } {
  if (!config.muzzleOffset) {
    return { x: turret.position.x, y: 1.5, z: turret.position.z }
  }
  const [px, py, pz] = config.position
  const [sx, sy, sz] = config.scale
  const [mx, my, mz] = config.muzzleOffset
  const lx = px + mx * sx
  const ly = py + my * sy
  const lz = pz + mz * sz
  const cos = Math.cos(angleY)
  const sin = Math.sin(angleY)
  const baseY = turret.position.y ?? 1
  return {
    x: turret.position.x + lx * cos - lz * sin,
    y: baseY + ly,
    z: turret.position.z + lx * sin + lz * cos,
  }
}

export function TurretShootingSystem() {
  useFrame(() => {
    const buildings = useBuildingsStore.getState().buildings
    const now_ms = Date.now()
    const turrets = buildings.filter(
      (b) =>
        b.type === 'turret' &&
        (b.enabled ?? true) &&
        now_ms - b.createdAt > CONSTRUCTION_DURATION * 1000
    )
    const enemyPositions = useUnitsStore.getState().enemyPositions
    const enemies = useUnitsStore.getState().enemies
    const energy = useResourcesStore.getState().energy
    const useCustomModels = useGameStore.getState().useCustomModels
    const customConfig = useCustomConfigStore.getState().config

    const energyCost = TURRET_CONFIG.energyCostPerShot
    if (energy < energyCost) return

    const now = performance.now() / 1000

    for (const turret of turrets) {
      const last = lastShotTime[turret.id] ?? 0
      if (now - last < 1 / TURRET_CONFIG.fireRate) continue

      let nearest: { id: string; dist: number } | null = null
      for (const enemy of enemies) {
        const pos = enemyPositions[enemy.id]
        if (!pos) continue
        const dx = pos.x - turret.position.x
        const dz = pos.z - turret.position.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist <= TURRET_CONFIG.range && (!nearest || dist < nearest.dist)) {
          nearest = { id: enemy.id, dist }
        }
      }

      if (nearest) {
        const spent = useResourcesStore.getState().spendEnergy(energyCost)
        if (spent) {
          const targetPos = enemyPositions[nearest.id]
          if (targetPos) {
            useTurretTargetStore.getState().setTarget(turret.id, targetPos)
            const angleY = Math.atan2(
              targetPos.x - turret.position.x,
              targetPos.z - turret.position.z
            )
            const cfg = customConfig.turret
            const from = useCustomModels && cfg.fbxBlobId
              ? getMuzzlePosition(turret, cfg, angleY)
              : { x: turret.position.x, y: 1.5, z: turret.position.z }

            useMissilesStore.getState().addMissile(from, nearest.id, targetPos)
          }
          lastShotTime[turret.id] = now
        }
      } else {
        useTurretTargetStore.getState().setTarget(turret.id, null)
      }
    }
  })

  return null
}
