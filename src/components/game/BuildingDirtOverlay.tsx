import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBuildingsStore } from '../../stores/useBuildingsStore'

const CANVAS_SIZE = 512
const MAP_SIZE = 130

export function BuildingDirtOverlay() {
  const lastKeyRef = useRef('')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE
    canvasRef.current = canvas
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
    textureRef.current = tex
    return tex
  }, [])

  useFrame(() => {
    const { buildings } = useBuildingsStore.getState()
    const key = buildings.map((b) => `${b.id}`).join(',')
    if (key === lastKeyRef.current) return
    lastKeyRef.current = key

    const canvas = canvasRef.current
    const tex = textureRef.current
    if (!canvas || !tex) return
    const ctx = canvas.getContext('2d')!

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    const worldToCanvas = (x: number, z: number) => ({
      u: ((x + MAP_SIZE / 2) / MAP_SIZE) * CANVAS_SIZE,
      v: ((z + MAP_SIZE / 2) / MAP_SIZE) * CANVAS_SIZE,
    })
    const radiusToCanvas = (r: number) => (r / MAP_SIZE) * CANVAS_SIZE

    const drawDirt = (cx: number, cz: number, radius: number) => {
      const { u, v } = worldToCanvas(cx, cz)
      const r = radiusToCanvas(radius)
      const gradient = ctx.createRadialGradient(u, v, 0, u, v, r)
      gradient.addColorStop(0, 'rgba(75, 60, 38, 0.65)')
      gradient.addColorStop(0.4, 'rgba(68, 55, 35, 0.45)')
      gradient.addColorStop(0.75, 'rgba(60, 50, 30, 0.18)')
      gradient.addColorStop(1, 'rgba(55, 45, 28, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(u, v, r, 0, Math.PI * 2)
      ctx.fill()
    }

    drawDirt(0, 0, 7)

    for (const b of buildings) {
      const r = b.type === 'subBase' ? 5.5 : b.type === 'generator' ? 4 : 3.2
      drawDirt(b.position.x, b.position.z, r)
    }

    tex.needsUpdate = true
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} renderOrder={1}>
      <planeGeometry args={[MAP_SIZE, MAP_SIZE]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  )
}
