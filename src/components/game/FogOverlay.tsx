import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { useHarvestersStore } from '../../stores/useHarvestersStore'
import { useMineralRocksStore } from '../../stores/useMineralRocksStore'
import { VISION_RADIUS } from '../../config/constants'
import { getHeightAt } from '../../systems/terrainHeightmap'

const HARVESTER_VISION = 8

const MAP_SIZE = 130
const CANVAS_SIZE = 512
const FOG_UPDATE_INTERVAL = 0.5

export function FogOverlay() {
  const meshRef = useRef<THREE.Mesh>(null)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const trailCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const lastUpdateRef = useRef(0)
  const lastBuildingCountRef = useRef(-1)

  const { canvas, texture, trailCanvas } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.needsUpdate = true

    const trail = document.createElement('canvas')
    trail.width = CANVAS_SIZE
    trail.height = CANVAS_SIZE
    const tCtx = trail.getContext('2d')!
    tCtx.fillStyle = 'rgba(0,0,0,0)'
    tCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    return { canvas, texture, trailCanvas: trail }
  }, [])

  useEffect(() => {
    canvasRef.current = canvas
    textureRef.current = texture
    trailCanvasRef.current = trailCanvas
    return () => {
      texture.dispose()
    }
  }, [canvas, texture, trailCanvas])

  useFrame(({ clock }) => {
    const now = clock.elapsedTime
    const buildings = useBuildingsStore.getState().buildings
    const harvesters = useHarvestersStore.getState().harvesters
    const buildingCount = buildings.length
    const hasMovingHarvesters = harvesters.length > 0

    const forceUpdate = buildingCount !== lastBuildingCountRef.current || hasMovingHarvesters
    if (!forceUpdate && now - lastUpdateRef.current < FOG_UPDATE_INTERVAL) return
    lastUpdateRef.current = now
    lastBuildingCountRef.current = buildingCount

    const ctx = canvasRef.current?.getContext('2d')
    const tCtx = trailCanvasRef.current?.getContext('2d')
    const tex = textureRef.current
    if (!ctx || !tCtx || !tex) return

    const worldToCanvas = (x: number, z: number) => {
      const u = ((x + MAP_SIZE / 2) / MAP_SIZE) * CANVAS_SIZE
      const v = ((z + MAP_SIZE / 2) / MAP_SIZE) * CANVAS_SIZE
      return { u, v }
    }

    const radiusToCanvas = (r: number) => (r / MAP_SIZE) * CANVAS_SIZE

    tCtx.globalCompositeOperation = 'lighten'
    for (const h of harvesters) {
      const { u, v } = worldToCanvas(h.position.x, h.position.z)
      const r = radiusToCanvas(HARVESTER_VISION)
      const gradient = tCtx.createRadialGradient(u, v, 0, u, v, r)
      gradient.addColorStop(0, 'rgba(255,255,255,0.98)')
      gradient.addColorStop(0.5, 'rgba(255,255,255,0.6)')
      gradient.addColorStop(0.8, 'rgba(255,255,255,0.2)')
      gradient.addColorStop(1, 'rgba(255,255,255,0)')
      tCtx.fillStyle = gradient
      tCtx.beginPath()
      tCtx.arc(u, v, r, 0, Math.PI * 2)
      tCtx.fill()
    }
    tCtx.globalCompositeOperation = 'source-over'

    ctx.fillStyle = 'rgba(15, 20, 35, 0.55)'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    ctx.globalCompositeOperation = 'destination-out'

    const revealCircle = (cx: number, cz: number, radius: number) => {
      const { u, v } = worldToCanvas(cx, cz)
      const r = radiusToCanvas(radius)
      const gradient = ctx.createRadialGradient(u, v, 0, u, v, r)
      gradient.addColorStop(0, 'rgba(255,255,255,0.98)')
      gradient.addColorStop(0.5, 'rgba(255,255,255,0.6)')
      gradient.addColorStop(0.8, 'rgba(255,255,255,0.2)')
      gradient.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(u, v, r, 0, Math.PI * 2)
      ctx.fill()
    }

    revealCircle(0, 0, VISION_RADIUS.central)

    for (const b of buildings) {
      const r =
        b.type === 'generator'
          ? VISION_RADIUS.generator
          : b.type === 'subBase'
            ? VISION_RADIUS.subBase
            : b.type === 'turret_aa'
              ? VISION_RADIUS.turret
              : VISION_RADIUS.turret
      revealCircle(b.position.x, b.position.z, r)
    }

    for (const h of harvesters) {
      revealCircle(h.position.x, h.position.z, HARVESTER_VISION)
    }

    ctx.drawImage(trailCanvasRef.current!, 0, 0)

    ctx.globalCompositeOperation = 'source-over'
    tex.needsUpdate = true
  })

  const rocks = useMineralRocksStore((s) => s.rocks)

  const fogGeo = useMemo(() => {
    const segs = 200
    const geo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, segs, segs)
    const positions = geo.attributes.position.array as Float32Array
    const count = positions.length / 3
    const halfSeg = MAP_SIZE / segs * 0.5
    const ROCK_COVER_RADIUS = 3.5
    for (let i = 0; i < count; i++) {
      const lx = positions[i * 3]
      const ly = positions[i * 3 + 1]
      const wx = lx
      const wz = -ly
      let maxH = getHeightAt(wx, wz)
      maxH = Math.max(maxH, getHeightAt(wx + halfSeg, wz))
      maxH = Math.max(maxH, getHeightAt(wx - halfSeg, wz))
      maxH = Math.max(maxH, getHeightAt(wx, wz + halfSeg))
      maxH = Math.max(maxH, getHeightAt(wx, wz - halfSeg))

      let rockBoost = 0
      for (const rock of rocks) {
        const dx = wx - rock.position.x
        const dz = wz - rock.position.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist < ROCK_COVER_RADIUS) {
          const t = 1 - dist / ROCK_COVER_RADIUS
          const height = rock.scale * 1.6
          rockBoost = Math.max(rockBoost, height * t * t)
        }
      }

      positions[i * 3 + 2] = maxH + 0.8 + rockBoost
    }
    geo.computeVertexNormals()
    geo.attributes.position.needsUpdate = true
    return geo
  }, [rocks])

  return (
    <mesh
      ref={meshRef}
      geometry={fogGeo}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      renderOrder={10}
    >
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
