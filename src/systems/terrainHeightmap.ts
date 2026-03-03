import * as THREE from 'three'

export const terrainParams = {
  baseNoiseScale: 0.025,
  baseNoiseAmp: 0.25,
  mountainMinDist: 30,
  mountainMaxDist: 52,
  mountainHeight: 6.0,
  mountainRadius: 8.0,
  mountainCount: 0,
  flatRadius: 12,
  suspensionAmp: 0.12,
  suspensionFreq: 0.08,
}

export const TERRAIN_SIZE = 120

interface Mountain {
  x: number
  z: number
  height: number
  radius: number
}

let mountains: Mountain[] = []
let seed = 0

function seededRandom() {
  seed = (seed * 16807 + 0) % 2147483647
  return (seed - 1) / 2147483646
}

function simplexNoise2D(x: number, z: number): number {
  const n1 = Math.sin(x * 1.7 + z * 2.3) * 0.5
  const n2 = Math.sin(x * 3.1 - z * 1.9) * 0.25
  const n3 = Math.sin(x * 0.8 + z * 0.6 + n1 * 2) * 0.25
  return n1 + n2 + n3
}

export function generateTerrain(newSeed?: number) {
  seed = newSeed ?? (Date.now() % 100000)
  mountains = []

  const p = terrainParams
  let attempts = 0
  while (mountains.length < p.mountainCount && attempts < 200) {
    attempts++
    const angle = seededRandom() * Math.PI * 2
    const dist = p.mountainMinDist + seededRandom() * (p.mountainMaxDist - p.mountainMinDist)
    const mx = Math.cos(angle) * dist
    const mz = Math.sin(angle) * dist

    const tooClose = mountains.some((m) => {
      const dx = m.x - mx
      const dz = m.z - mz
      return Math.sqrt(dx * dx + dz * dz) < p.mountainRadius * 2.2
    })
    if (tooClose) continue

    mountains.push({
      x: mx,
      z: mz,
      height: p.mountainHeight * (0.6 + seededRandom() * 0.4),
      radius: p.mountainRadius * (0.7 + seededRandom() * 0.6),
    })
  }
}

export function getMountains(): Mountain[] {
  return mountains
}

export function getHeightAt(x: number, z: number): number {
  const p = terrainParams
  const distFromCenter = Math.sqrt(x * x + z * z)

  const flatBlend = Math.min(1, Math.max(0, (distFromCenter - p.flatRadius * 0.5) / (p.flatRadius * 0.5)))
  const baseNoise = simplexNoise2D(x * p.baseNoiseScale, z * p.baseNoiseScale) * p.baseNoiseAmp * flatBlend

  let mountainH = 0
  for (const m of mountains) {
    const dx = x - m.x
    const dz = z - m.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    const t = Math.max(0, 1 - dist / m.radius)
    const shaped = t * t * (3 - 2 * t)
    mountainH += shaped * m.height
  }

  return baseNoise + mountainH
}

export function getSuspensionHeight(x: number, z: number): number {
  const p = terrainParams
  const base = getHeightAt(x, z)
  const micro = simplexNoise2D(x * p.suspensionFreq * 5, z * p.suspensionFreq * 5) * p.suspensionAmp
  return base + micro
}

export function isMountainAt(x: number, z: number): boolean {
  const h = getHeightAt(x, z)
  return h > 1.5
}

export function getMountainAvoidance(x: number, z: number, targetX: number, targetZ: number): { x: number; z: number } {
  const ahead = 3.0
  const dx = targetX - x
  const dz = targetZ - z
  const len = Math.sqrt(dx * dx + dz * dz) || 1
  const ndx = dx / len
  const ndz = dz / len

  const probeX = x + ndx * ahead
  const probeZ = z + ndz * ahead
  const probeH = getHeightAt(probeX, probeZ)

  if (probeH < 1.2) return { x: 0, z: 0 }

  const perpX = -ndz
  const perpZ = ndx
  const leftH = getHeightAt(x + perpX * 3, z + perpZ * 3)
  const rightH = getHeightAt(x - perpX * 3, z - perpZ * 3)

  const strength = Math.min(5, probeH * 2)
  if (leftH < rightH) {
    return { x: perpX * strength, z: perpZ * strength }
  } else {
    return { x: -perpX * strength, z: -perpZ * strength }
  }
}

export function applyHeightmapToGeometry(geometry: THREE.PlaneGeometry) {
  const positions = geometry.attributes.position.array as Float32Array
  const count = positions.length / 3

  for (let i = 0; i < count; i++) {
    const localX = positions[i * 3]
    const localY = positions[i * 3 + 1]
    const worldX = localX
    const worldZ = -localY
    positions[i * 3 + 2] = getHeightAt(worldX, worldZ)
  }

  geometry.computeVertexNormals()
  geometry.attributes.position.needsUpdate = true
}
