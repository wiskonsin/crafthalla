import { useBuildingsStore } from '../stores/useBuildingsStore'
import { VISION_RADIUS } from '../config/constants'

/** Comprueba si un punto (x,z) está en zona visible (no en niebla) */
export function isPositionVisible(x: number, z: number): boolean {
  const { buildings } = useBuildingsStore.getState()

  const checkRadius = (cx: number, cz: number, r: number) => {
    const dx = x - cx
    const dz = z - cz
    return dx * dx + dz * dz <= r * r
  }

  if (checkRadius(0, 0, VISION_RADIUS.central)) return true

  for (const b of buildings) {
    const r =
      b.type === 'generator'
        ? VISION_RADIUS.generator
        : b.type === 'subBase'
          ? VISION_RADIUS.subBase
          : b.type === 'turret_aa'
            ? VISION_RADIUS.turret
            : VISION_RADIUS.turret
    if (checkRadius(b.position.x, b.position.z, r)) return true
  }
  return false
}
