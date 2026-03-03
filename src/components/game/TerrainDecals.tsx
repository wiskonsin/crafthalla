import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { useHarvestersStore } from '../../stores/useHarvestersStore'
import { useCratersStore, CRATER_LIFETIME } from '../../stores/useCratersStore'
import { CONSTRUCTION_DURATION } from '../../config/constants'
import { getHeightAt } from '../../systems/terrainHeightmap'

const HARVESTER_SPAWN_DURATION = 1800

const MAP_SIZE = 120
const CANVAS_SIZE = 256
const DIRT_RADIUS = 3.2
const TRACK_WIDTH = 0.28
const TRACK_SPACING = 0.55
const TRACK_FADE_SPEED = 0.006
const DIRT_TRANSITION_DURATION = 2.0
const CRATER_RADIUS = 2.2

function worldToCanvas(x: number, z: number) {
  const u = ((x + MAP_SIZE / 2) / MAP_SIZE) * CANVAS_SIZE
  const v = ((z + MAP_SIZE / 2) / MAP_SIZE) * CANVAS_SIZE
  return { u, v }
}

function radiusToCanvas(r: number) {
  return (r / MAP_SIZE) * CANVAS_SIZE
}

interface DirtPatch {
  u: number
  v: number
  r: number
  startTime: number
}

export function TerrainDecals() {
  const meshRef = useRef<THREE.Mesh>(null)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)
  const dirtCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const trackCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const registeredBuildings = useRef<Set<string>>(new Set())
  const dirtPatches = useRef<DirtPatch[]>([])
  const lastHarvesterPositions = useRef<Map<string, { u: number; v: number }>>(new Map())
  const fadeAccum = useRef(0)
  const cleanupAccum = useRef(0)

  const { dirtCanvas, trackCanvas, texture } = useMemo(() => {
    const dirt = document.createElement('canvas')
    dirt.width = CANVAS_SIZE
    dirt.height = CANVAS_SIZE

    const track = document.createElement('canvas')
    track.width = CANVAS_SIZE
    track.height = CANVAS_SIZE

    const combined = document.createElement('canvas')
    combined.width = CANVAS_SIZE
    combined.height = CANVAS_SIZE

    const tex = new THREE.CanvasTexture(combined)
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping

    return { dirtCanvas: dirt, trackCanvas: track, texture: tex, combinedCanvas: combined }
  }, [])

  useMemo(() => {
    dirtCanvasRef.current = dirtCanvas
    trackCanvasRef.current = trackCanvas
    textureRef.current = texture
  }, [dirtCanvas, trackCanvas, texture])

  useFrame((_, delta) => {
    const dirtCtx = dirtCanvasRef.current?.getContext('2d')
    const trackCtx = trackCanvasRef.current?.getContext('2d')
    const tex = textureRef.current
    if (!dirtCtx || !trackCtx || !tex) return

    const buildings = useBuildingsStore.getState().buildings
    const centralHp = useBuildingsStore.getState().centralHp
    const harvesters = useHarvestersStore.getState().harvesters
    const craters = useCratersStore.getState().craters
    const now = Date.now()
    const nowSec = performance.now() / 1000

    cleanupAccum.current += delta
    if (cleanupAccum.current > 5) {
      cleanupAccum.current = 0
      useCratersStore.getState().cleanup()
    }

    if (centralHp > 0 && !registeredBuildings.current.has('central')) {
      const { u, v } = worldToCanvas(0, 0)
      const r = radiusToCanvas(DIRT_RADIUS * 1.6)
      dirtPatches.current.push({ u, v, r, startTime: nowSec })
      registeredBuildings.current.add('central')
    }

    for (const b of buildings) {
      const age = (now - b.createdAt) / 1000
      if (age < CONSTRUCTION_DURATION) continue
      if (registeredBuildings.current.has(b.id)) continue

      const { u, v } = worldToCanvas(b.position.x, b.position.z)
      const sizeMultiplier = b.type === 'wall' ? 0.6 : b.type === 'subBase' ? 1.3 : 1.0
      const r = radiusToCanvas(DIRT_RADIUS * sizeMultiplier)
      dirtPatches.current.push({ u, v, r, startTime: nowSec })
      registeredBuildings.current.add(b.id)
    }

    dirtCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    for (const patch of dirtPatches.current) {
      const patchAge = nowSec - patch.startTime
      const t = Math.min(1, patchAge / DIRT_TRANSITION_DURATION)
      const eased = t * t * (3 - 2 * t)
      const alpha = eased * 0.7

      const grad = dirtCtx.createRadialGradient(
        patch.u, patch.v, patch.r * 0.1,
        patch.u, patch.v, patch.r
      )
      grad.addColorStop(0, `rgba(85, 60, 35, ${alpha})`)
      grad.addColorStop(0.55, `rgba(85, 60, 35, ${alpha * 0.5})`)
      grad.addColorStop(1, 'rgba(85, 60, 35, 0)')
      dirtCtx.fillStyle = grad
      dirtCtx.beginPath()
      dirtCtx.arc(patch.u, patch.v, patch.r, 0, Math.PI * 2)
      dirtCtx.fill()
    }

    for (const c of craters) {
      const age = now - c.createdAt
      const lifeT = age / CRATER_LIFETIME
      const fadeIn = Math.min(1, age / 500)
      const fadeOut = Math.max(0, 1 - Math.pow(lifeT, 2))
      const alpha = fadeIn * fadeOut * 0.75

      const { u, v } = worldToCanvas(c.position.x, c.position.z)
      const r = radiusToCanvas(CRATER_RADIUS)

      const grad = dirtCtx.createRadialGradient(u, v, r * 0.05, u, v, r)
      grad.addColorStop(0, `rgba(20, 16, 10, ${alpha})`)
      grad.addColorStop(0.3, `rgba(30, 24, 14, ${alpha * 0.8})`)
      grad.addColorStop(0.6, `rgba(40, 32, 18, ${alpha * 0.4})`)
      grad.addColorStop(1, 'rgba(40, 32, 18, 0)')
      dirtCtx.fillStyle = grad
      dirtCtx.beginPath()
      dirtCtx.arc(u, v, r, 0, Math.PI * 2)
      dirtCtx.fill()
    }

    fadeAccum.current += delta
    if (fadeAccum.current > 0.1) {
      fadeAccum.current = 0
      trackCtx.globalCompositeOperation = 'destination-out'
      trackCtx.fillStyle = `rgba(0,0,0,${TRACK_FADE_SPEED})`
      trackCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      trackCtx.globalCompositeOperation = 'source-over'
    }

    const tw = radiusToCanvas(TRACK_WIDTH)
    const tsp = radiusToCanvas(TRACK_SPACING)
    for (const h of harvesters) {
      if (h.state === 'idle' || h.state === 'depositing' || h.state === 'gathering') continue
      const { u, v } = worldToCanvas(h.position.x, h.position.z)
      const spawning = now - h.createdAt < HARVESTER_SPAWN_DURATION
      const prev = lastHarvesterPositions.current.get(h.id)

      if (!spawning && prev) {
        const dx = u - prev.u
        const dv = v - prev.v
        const dist = Math.sqrt(dx * dx + dv * dv)
        if (dist > 0.3 && dist < 8) {
          const len = Math.sqrt(dx * dx + dv * dv) || 1
          const perpX = -dv / len
          const perpY = dx / len

          const hash = (u * 73.17 + v * 91.31) % 1
          const wobble1 = Math.sin(u * 3.7 + v * 2.1) * tw * 0.4
          const wobble2 = Math.sin(u * 2.3 - v * 4.1) * tw * 0.4
          const widthVar = 0.8 + hash * 0.4
          const opacity = 0.55 + hash * 0.2

          const lw = tw * widthVar

          const off1x = perpX * tsp + wobble1 * perpX
          const off1y = perpY * tsp + wobble1 * perpY
          const off2x = -perpX * tsp + wobble2 * perpX
          const off2y = -perpY * tsp + wobble2 * perpY

          const r = Math.floor(35 + hash * 15)
          const g = Math.floor(22 + hash * 10)
          const b = Math.floor(10 + hash * 8)

          trackCtx.strokeStyle = `rgba(${r},${g},${b},${opacity})`
          trackCtx.lineWidth = lw
          trackCtx.lineCap = 'round'

          trackCtx.beginPath()
          trackCtx.moveTo(prev.u + off1x, prev.v + off1y)
          trackCtx.lineTo(u + off1x, v + off1y)
          trackCtx.stroke()

          trackCtx.beginPath()
          trackCtx.moveTo(prev.u + off2x, prev.v + off2y)
          trackCtx.lineTo(u + off2x, v + off2y)
          trackCtx.stroke()

          if (hash > 0.6) {
            trackCtx.fillStyle = `rgba(${r - 5},${g - 3},${b},${opacity * 0.3})`
            const cx = (prev.u + u) / 2
            const cy = (prev.v + v) / 2
            trackCtx.beginPath()
            trackCtx.arc(cx, cy, lw * 1.2, 0, Math.PI * 2)
            trackCtx.fill()
          }

        }
      }
      lastHarvesterPositions.current.set(h.id, { u, v })
    }

    const combCtx = tex.image instanceof HTMLCanvasElement
      ? (tex.image as HTMLCanvasElement).getContext('2d')
      : null
    if (combCtx) {
      combCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      combCtx.drawImage(dirtCanvasRef.current!, 0, 0)
      combCtx.drawImage(trackCanvasRef.current!, 0, 0)
    }
    tex.needsUpdate = true
  })

  const decalGeo = useMemo(() => {
    const segs = 64
    const geo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, segs, segs)
    const positions = geo.attributes.position.array as Float32Array
    const count = positions.length / 3
    for (let i = 0; i < count; i++) {
      const localX = positions[i * 3]
      const localY = positions[i * 3 + 1]
      const worldX = localX
      const worldZ = -localY
      positions[i * 3 + 2] = getHeightAt(worldX, worldZ) + 0.05
    }
    geo.computeVertexNormals()
    geo.attributes.position.needsUpdate = true
    return geo
  }, [])

  return (
    <mesh
      ref={meshRef}
      geometry={decalGeo}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      renderOrder={1}
    >
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  )
}
