import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { MineralRock as MineralRockData } from '../../stores/useMineralRocksStore'
import { MINERAL_ROCK_CONFIG } from '../../config/constants'

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function noise3(x: number, y: number, z: number): number {
  return (
    Math.sin(x * 1.7 + y * 2.3 + z * 0.9) * 0.4 +
    Math.sin(x * 3.1 - y * 1.1 + z * 2.7) * 0.3 +
    Math.sin(x * 0.8 + y * 4.2 - z * 1.5) * 0.3
  )
}

const DISPERSE_DURATION = 1.0
const FRAG_COUNT = 28
const SPARK_COUNT = 35

interface MineralRockProps {
  rock: MineralRockData
  rockTexture?: THREE.Texture | null
}

function getBaseScale(maxMinerals: number): number {
  const t = (maxMinerals - MINERAL_ROCK_CONFIG.minMinerals) /
    ((MINERAL_ROCK_CONFIG.maxMinerals - MINERAL_ROCK_CONFIG.minMinerals) || 1)
  return 0.7 + t * 0.6
}

function buildRockGeometry(rand: () => number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 24, 18)
  const pos = geo.attributes.position
  const norm = geo.attributes.normal

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    let y = pos.getY(i)
    const z = pos.getZ(i)

    const nx = norm.getX(i)
    const ny = norm.getY(i)
    const nz = norm.getZ(i)

    const n = noise3(x * 2.5 + rand() * 0.3, y * 2.5, z * 2.5 + rand() * 0.3)
    const displacement = 0.12 + n * 0.18

    let px = x + nx * displacement
    let py = y + ny * displacement
    let pz = z + nz * displacement

    if (y < -0.3) {
      py *= 0.35
    } else if (y < 0) {
      const t = (y + 0.3) / 0.3
      py *= 0.35 + t * 0.65
    }

    const hStretch = 1.0 + (rand() - 0.5) * 0.15
    px *= hStretch * (1.05 + rand() * 0.1)
    pz *= hStretch * (1.05 + rand() * 0.1)
    py *= 0.7 + rand() * 0.15

    pos.setXYZ(i, px, py, pz)
  }

  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

interface CrystalDef {
  pos: [number, number, number]
  rot: [number, number, number]
  len: number
  radius: number
  phase: number
  emBase: number
}

function buildCrystals(rand: () => number): CrystalDef[] {
  const count = 3 + Math.floor(rand() * 4)
  const result: CrystalDef[] = []

  for (let i = 0; i < count; i++) {
    const theta = rand() * Math.PI * 2
    const phi = 0.3 + rand() * 1.0
    const surfR = 0.65 + rand() * 0.3

    const sx = Math.sin(phi) * Math.cos(theta) * surfR
    const sy = Math.abs(Math.cos(phi)) * surfR * 0.5 + 0.05
    const sz = Math.sin(phi) * Math.sin(theta) * surfR

    const outX = Math.sin(phi) * Math.cos(theta)
    const outY = Math.cos(phi) * 0.5 + 0.5
    const outZ = Math.sin(phi) * Math.sin(theta)

    const rotX = Math.atan2(outZ, outY) + (rand() - 0.5) * 0.6
    const rotY = rand() * Math.PI * 2
    const rotZ = Math.atan2(outX, outY) + (rand() - 0.5) * 0.6

    result.push({
      pos: [sx, sy, sz],
      rot: [rotX, rotY, rotZ],
      len: 0.25 + rand() * 0.4,
      radius: 0.04 + rand() * 0.05,
      phase: rand() * Math.PI * 2,
      emBase: 0.5 + rand() * 0.5,
    })
  }
  return result
}

interface FragDef {
  vx: number; vy: number; vz: number
  size: number; color: THREE.Color
}

function buildFragments(rand: () => number): FragDef[] {
  const frags: FragDef[] = []
  for (let i = 0; i < FRAG_COUNT + SPARK_COUNT; i++) {
    const spark = i >= FRAG_COUNT
    const a = rand() * Math.PI * 2
    const el = (rand() - 0.2) * Math.PI * 0.5
    const spd = spark ? (2 + rand() * 2.5) : (0.8 + rand() * 1.8)
    frags.push({
      vx: Math.cos(a) * Math.cos(el) * spd,
      vy: Math.abs(Math.sin(el)) * spd + (spark ? 1.2 : 0.5) + rand() * 1.2,
      vz: Math.sin(a) * Math.cos(el) * spd,
      size: spark ? (0.03 + rand() * 0.05) : (0.07 + rand() * 0.12),
      color: spark
        ? new THREE.Color().setHSL(0.52 + rand() * 0.06, 0.85, 0.55 + rand() * 0.3)
        : new THREE.Color(0.35 + rand() * 0.12, 0.34 + rand() * 0.1, 0.32 + rand() * 0.08),
    })
  }
  return frags
}

export function MineralRock({ rock, rockTexture }: MineralRockProps) {
  const groupRef = useRef<THREE.Group>(null)
  const crystalRefs = useRef<THREE.Mesh[]>([])
  const disperseRef = useRef<THREE.Points | null>(null)
  const disperseStartRef = useRef(0)
  const disperseElapsed = useRef(0)
  const [dispersing, setDispersing] = useState(false)
  const depletedTriggered = useRef(false)

  const percent = rock.maxMinerals > 0 ? rock.minerals / rock.maxMinerals : 0
  const baseScale = getBaseScale(rock.maxMinerals)

  const { rockGeo, crystals, fragmentData } = useMemo(() => {
    const rand = rng(rock.seed)
    return {
      rockGeo: buildRockGeometry(rand),
      crystals: buildCrystals(rand),
      fragmentData: buildFragments(rand),
    }
  }, [rock.seed])

  const rockMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: rockTexture ? '#999999' : '#5a5550',
      map: rockTexture || null,
      roughness: 0.92,
      metalness: 0.06,
    })
  }, [rockTexture])

  const disperseGeo = useMemo(() => {
    const total = FRAG_COUNT + SPARK_COUNT
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(total * 3)
    const colors = new Float32Array(total * 3)
    for (let i = 0; i < total; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0.4
      positions[i * 3 + 2] = 0
      const c = fragmentData[i].color
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [fragmentData])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    if (dispersing) {
      const elapsed = t - disperseStartRef.current
      disperseElapsed.current = elapsed
      if (elapsed > DISPERSE_DURATION) return
      const progress = elapsed / DISPERSE_DURATION

      if (groupRef.current) groupRef.current.visible = false
      if (disperseRef.current) {
        disperseRef.current.visible = true
        const pos = disperseGeo.attributes.position.array as Float32Array
        for (let i = 0; i < FRAG_COUNT + SPARK_COUNT; i++) {
          const fd = fragmentData[i]
          pos[i * 3] = fd.vx * elapsed
          pos[i * 3 + 1] = 0.4 + fd.vy * elapsed - 3.5 * elapsed * elapsed
          pos[i * 3 + 2] = fd.vz * elapsed
        }
        disperseGeo.attributes.position.needsUpdate = true
        ;(disperseRef.current.material as THREE.PointsMaterial).opacity = 1 - progress * progress
      }
      return
    }

    if (percent <= 0 && !depletedTriggered.current) {
      depletedTriggered.current = true
      disperseStartRef.current = t
      setDispersing(true)
      return
    }

    for (let i = 0; i < crystalRefs.current.length; i++) {
      const mesh = crystalRefs.current[i]
      if (!mesh) continue
      const cr = crystals[i]
      if (!cr) continue
      const mat = mesh.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = cr.emBase + Math.sin(t * 2.0 + cr.phase) * 0.25
    }

    const targetScale = baseScale * (0.45 + percent * 0.55) * rock.scale
    if (groupRef.current) {
      const s = groupRef.current.scale
      s.x += (targetScale - s.x) * 0.04
      s.y += (targetScale - s.y) * 0.04
      s.z += (targetScale - s.z) * 0.04
    }
  })

  if (dispersing && disperseElapsed.current > DISPERSE_DURATION + 0.3) return null

  const veinScale = 0.5 + percent * 0.5

  return (
    <>
      <group
        ref={groupRef}
        position={[rock.position.x, rock.position.y, rock.position.z]}
        scale={baseScale * rock.scale}
      >
        <mesh geometry={rockGeo} material={rockMat} castShadow receiveShadow />

        {percent > 0 && crystals.map((cr, i) => (
          <mesh
            key={i}
            ref={(el) => { if (el) crystalRefs.current[i] = el }}
            position={cr.pos}
            rotation={cr.rot}
            scale={veinScale}
          >
            <cylinderGeometry args={[cr.radius * 0.3, cr.radius, cr.len, 5, 1]} />
            <meshStandardMaterial
              color="#44ddff"
              emissive="#1199cc"
              emissiveIntensity={cr.emBase}
              roughness={0.1}
              metalness={0.85}
              transparent
              opacity={0.9}
            />
          </mesh>
        ))}

        {percent > 0 && (
          <group position={[0, 1.2 * (0.45 + percent * 0.55), 0]}>
            <mesh>
              <boxGeometry args={[0.8, 0.05, 0.03]} />
              <meshBasicMaterial color="#1a1a1a" transparent opacity={0.7} />
            </mesh>
            <mesh position={[-0.4 + percent * 0.4, 0, 0.015]}>
              <boxGeometry args={[percent * 0.8, 0.035, 0.02]} />
              <meshBasicMaterial color="#33ccee" />
            </mesh>
          </group>
        )}
      </group>

      <points
        ref={disperseRef}
        position={[rock.position.x, rock.position.y, rock.position.z]}
        geometry={disperseGeo}
        visible={false}
      >
        <pointsMaterial
          vertexColors
          size={0.1}
          transparent
          opacity={1}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </>
  )
}
