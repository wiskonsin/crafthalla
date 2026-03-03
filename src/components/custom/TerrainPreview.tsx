import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTerrainStore } from '../../stores/useTerrainStore'

const TILE_REPEAT = 23
const PLANE_SIZE = 14
const ROCK_COLOR = new THREE.Color(0.42, 0.40, 0.38)
const CRYSTAL_COLOR = new THREE.Color('#00e5ff')
const loader = new THREE.TextureLoader()

function noise3(x: number, y: number, z: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 45.164) * 43758.5453
  return (n - Math.floor(n)) * 2 - 1
}

function createStaticRock(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.8, 24, 16)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i)
    let y = pos.getY(i)
    let z = pos.getZ(i)
    const len = Math.sqrt(x * x + y * y + z * z) || 1
    const nx = x / len, ny = y / len, nz = z / len
    const d = noise3(x * 2.5, y * 2.5, z * 2.5) * 0.14
      + noise3(x * 5.0 + 7, y * 5.0 + 3, z * 5.0 + 11) * 0.07
    x += nx * d
    y += ny * d
    z += nz * d
    if (y < -0.2) y = -0.2 - (y + 0.2) * 0.08
    pos.setXYZ(i, x, y, z)
  }
  geo.computeVertexNormals()
  return geo
}

interface Crystal {
  position: [number, number, number]
  rotation: [number, number, number]
  height: number
  radius: number
}

function createStaticCrystals(): Crystal[] {
  const crystals: Crystal[] = []
  const seeds = [0.12, 0.38, 0.61, 0.85, 0.27, 0.73, 0.50]
  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i]
    const phi = s * Math.PI * 2
    const theta = 0.3 + s * 1.0
    const r = 0.65 + s * 0.15
    const x = r * Math.sin(theta) * Math.cos(phi)
    const y = r * Math.cos(theta)
    const z = r * Math.sin(theta) * Math.sin(phi)
    crystals.push({
      position: [x, y, z],
      rotation: [
        Math.sin(s * 47) * 0.5,
        phi,
        Math.cos(s * 31) * 0.4,
      ],
      height: 0.18 + s * 0.25,
      radius: 0.035 + s * 0.035,
    })
  }
  return crystals
}

function useTextureFromUrl(url: string | null): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    if (!url) { setTex(null); return }

    let cancelled = false
    loader.load(url, (t) => {
      if (cancelled) { t.dispose(); return }
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.colorSpace = THREE.SRGBColorSpace
      t.needsUpdate = true
      setTex(t)
    })

    return () => {
      cancelled = true
      setTex((prev) => { prev?.dispose(); return null })
    }
  }, [url])

  return tex
}

function StaticRock({ rockTexUrl }: { rockTexUrl: string }) {
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const geo = useMemo(() => createStaticRock(), [])
  const crystals = useMemo(() => createStaticCrystals(), [])
  const tex = useTextureFromUrl(rockTexUrl)

  useEffect(() => {
    if (matRef.current) {
      if (tex) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping
        tex.repeat.set(3, 3)
        tex.needsUpdate = true
        matRef.current.map = tex
      } else {
        matRef.current.map = null
      }
      matRef.current.needsUpdate = true
    }
  }, [tex])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15
    }
  })

  return (
    <group ref={groupRef} position={[0, 0.6, 0]} scale={1.3}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial
          ref={matRef}
          color={ROCK_COLOR}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      {crystals.map((c, i) => (
        <mesh
          key={i}
          position={c.position}
          rotation={c.rotation}
        >
          <cylinderGeometry args={[0, c.radius, c.height, 5]} />
          <meshStandardMaterial
            color={CRYSTAL_COLOR}
            emissive={CRYSTAL_COLOR}
            emissiveIntensity={0.6}
            transparent
            opacity={0.85}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}

function TerrainPlane({ texUrl }: { texUrl: string }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const tex = useTextureFromUrl(texUrl)

  useEffect(() => {
    if (matRef.current) {
      if (tex) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping
        tex.repeat.set(TILE_REPEAT, TILE_REPEAT)
        tex.anisotropy = 4
        tex.needsUpdate = true
        matRef.current.map = tex
      } else {
        matRef.current.map = null
      }
      matRef.current.needsUpdate = true
    }
  }, [tex])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
      <meshStandardMaterial ref={matRef} roughness={0.9} />
    </mesh>
  )
}

function PreviewScene({ terrainTexUrl, rockTexUrl }: { terrainTexUrl: string; rockTexUrl: string }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 5, 3]} intensity={1.2} castShadow />
      <TerrainPlane texUrl={terrainTexUrl} />
      <StaticRock rockTexUrl={rockTexUrl} />
    </>
  )
}

function resolveTerrainUrl(preset: string, customBlobUrl: string | null): string {
  if (preset === 'custom' && customBlobUrl) return customBlobUrl
  if (preset === 'exoplanet') return '/tiles/exo.png'
  return '/tiles/grass.png'
}

function resolveRockUrl(preset: string, customBlobUrl: string | null): string {
  if (preset === 'custom' && customBlobUrl) return customBlobUrl
  return '/tiles/rock.png'
}

export function TerrainPreview() {
  const { terrainPreset, rockPreset, customTerrainBlobId, customRockBlobId, getBlobUrl } = useTerrainStore()

  const [terrainBlobUrl, setTerrainBlobUrl] = useState<string | null>(null)
  const [rockBlobUrl, setRockBlobUrl] = useState<string | null>(null)

  useEffect(() => {
    if (terrainPreset === 'custom' && customTerrainBlobId) {
      getBlobUrl(customTerrainBlobId).then(setTerrainBlobUrl)
    } else {
      setTerrainBlobUrl(null)
    }
  }, [terrainPreset, customTerrainBlobId, getBlobUrl])

  useEffect(() => {
    if (rockPreset === 'custom' && customRockBlobId) {
      getBlobUrl(customRockBlobId).then(setRockBlobUrl)
    } else {
      setRockBlobUrl(null)
    }
  }, [rockPreset, customRockBlobId, getBlobUrl])

  const terrainTexUrl = resolveTerrainUrl(terrainPreset, terrainBlobUrl)
  const rockTexUrl = resolveRockUrl(rockPreset, rockBlobUrl)

  return (
    <div
      style={{
        width: '100%',
        flex: 1,
        minHeight: 120,
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid rgba(0,180,255,0.2)',
        background: '#080c14',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 12,
          zIndex: 2,
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 9,
          fontWeight: 600,
          color: 'rgba(0,212,255,0.5)',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          pointerEvents: 'none',
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}
      >
        Preview
      </div>
      <Canvas
        camera={{ position: [3.5, 3, 3.5], fov: 40 }}
        gl={{ antialias: true }}
        shadows
        style={{ width: '100%', height: '100%' }}
      >
        <PreviewScene
          terrainTexUrl={terrainTexUrl}
          rockTexUrl={rockTexUrl}
        />
      </Canvas>
    </div>
  )
}
