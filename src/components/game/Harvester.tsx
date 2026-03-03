import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Harvester as HarvesterData } from '../../stores/useHarvestersStore'
import { useGameStore } from '../../stores/useGameStore'
import { useCustomConfigStore } from '../../stores/useCustomConfigStore'
import { GameCustomModel } from './GameFbxModel'
import { useMineralRocksStore } from '../../stores/useMineralRocksStore'
import { getSuspensionHeight } from '../../systems/terrainHeightmap'
import { HARVESTER_CONFIG } from '../../config/constants'

interface HarvesterProps {
  harvester: HarvesterData
}

const WHEEL_COLOR = '#2a2a2a'
const BODY_COLOR = '#c4a832'
const CABIN_COLOR = '#8a7a2a'
const CARGO_COLOR = '#5a6a3a'

const SPAWN_DURATION = 1.8
const SPAWN_DIP = 1.2
const SPAWN_TILT = 0.35
const SPAWN_PARTICLE_COUNT = 30
const MINING_PARTICLE_COUNT = 16
const EXHAUST_PARTICLE_COUNT = 12

function SpawnDirtBurst() {
  const pointsRef = useRef<THREE.Points>(null)
  const doneRef = useRef(false)
  const startRef = useRef(performance.now())

  const { geometry, velocities } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(SPAWN_PARTICLE_COUNT * 3)
    const col = new Float32Array(SPAWN_PARTICLE_COUNT * 3)
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))

    const vels = Array.from({ length: SPAWN_PARTICLE_COUNT }, () => ({
      x: (Math.random() - 0.5) * 2.5,
      y: Math.random() * 2.5 + 1.5,
      z: (Math.random() - 0.5) * 2.5,
    }))

    for (let i = 0; i < SPAWN_PARTICLE_COUNT; i++) {
      const brown = 0.5 + Math.random() * 0.3
      col[i * 3] = brown
      col[i * 3 + 1] = brown * 0.6
      col[i * 3 + 2] = brown * 0.25
    }
    geo.attributes.color.needsUpdate = true

    return { geometry: geo, velocities: vels }
  }, [])

  useFrame(() => {
    if (doneRef.current || !pointsRef.current) return
    const elapsed = (performance.now() - startRef.current) / 1000
    const t = elapsed / SPAWN_DURATION

    if (t >= 1) {
      pointsRef.current.visible = false
      doneRef.current = true
      return
    }

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < SPAWN_PARTICLE_COUNT; i++) {
      const v = velocities[i]
      const age = elapsed * 1.2
      positions[i * 3] = v.x * age * 0.5
      positions[i * 3 + 1] = v.y * age - 4.9 * age * age * 0.3
      positions[i * 3 + 2] = v.z * age * 0.5
      if (positions[i * 3 + 1] < -0.3) positions[i * 3 + 1] = -0.3
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    ;(pointsRef.current.material as THREE.PointsMaterial).opacity = 0.9 * (1 - t * t)
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.2}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function MiningParticles() {
  const pointsRef = useRef<THREE.Points>(null)

  const { geometry, velocities } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(MINING_PARTICLE_COUNT * 3)
    const col = new Float32Array(MINING_PARTICLE_COUNT * 3)
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))

    const vels = Array.from({ length: MINING_PARTICLE_COUNT }, () => ({
      x: (Math.random() - 0.5) * 1.5,
      y: Math.random() * 1.8 + 0.5,
      z: (Math.random() - 0.5) * 1.5,
      phase: Math.random() * Math.PI * 2,
      isCyan: Math.random() < 0.3,
    }))

    for (let i = 0; i < MINING_PARTICLE_COUNT; i++) {
      if (vels[i].isCyan) {
        col[i * 3] = 0.2 + Math.random() * 0.15
        col[i * 3 + 1] = 0.75 + Math.random() * 0.2
        col[i * 3 + 2] = 0.9 + Math.random() * 0.1
      } else {
        const brown = 0.45 + Math.random() * 0.25
        col[i * 3] = brown
        col[i * 3 + 1] = brown * 0.55
        col[i * 3 + 2] = brown * 0.2
      }
    }
    geo.attributes.color.needsUpdate = true

    return { geometry: geo, velocities: vels }
  }, [])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const t = clock.elapsedTime
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < MINING_PARTICLE_COUNT; i++) {
      const v = velocities[i]
      const cycle = ((t * 1.5 + v.phase) % 1.4)
      const age = cycle / 1.4
      positions[i * 3] = v.x * age + Math.sin(t * 3 + v.phase) * 0.1
      positions[i * 3 + 1] = v.y * age * 0.6 - 0.2
      positions[i * 3 + 2] = v.z * age - 0.4
      if (positions[i * 3 + 1] < -0.25) positions[i * 3 + 1] = -0.25
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    ;(pointsRef.current.material as THREE.PointsMaterial).opacity = 0.6 + Math.sin(t * 4) * 0.15
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function ExhaustSmoke({ isMoving }: { isMoving: boolean }) {
  const pointsRef = useRef<THREE.Points>(null)

  const { geometry, seeds } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(EXHAUST_PARTICLE_COUNT * 3)
    const col = new Float32Array(EXHAUST_PARTICLE_COUNT * 3)
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))

    const s = Array.from({ length: EXHAUST_PARTICLE_COUNT }, () => ({
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.3,
      speed: 0.6 + Math.random() * 0.6,
    }))

    for (let i = 0; i < EXHAUST_PARTICLE_COUNT; i++) {
      const brown = 0.3 + Math.random() * 0.2
      col[i * 3] = brown
      col[i * 3 + 1] = brown * 0.7
      col[i * 3 + 2] = brown * 0.4
    }
    geo.attributes.color.needsUpdate = true

    return { geometry: geo, seeds: s }
  }, [])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    pointsRef.current.visible = isMoving
    if (!isMoving) return

    const t = clock.elapsedTime
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < EXHAUST_PARTICLE_COUNT; i++) {
      const s = seeds[i]
      const cycle = ((t * s.speed + s.phase) % 1.0)
      positions[i * 3] = s.drift * cycle
      positions[i * 3 + 1] = cycle * 0.8 + 0.15
      positions[i * 3 + 2] = -0.6 - cycle * 0.3
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    ;(pointsRef.current.material as THREE.PointsMaterial).opacity = 0.35
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function SelectionRing() {
  const ringRef = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.35 + Math.sin(t * 3) * 0.15
      ringRef.current.scale.setScalar(1 + Math.sin(t * 2.5) * 0.04)
    }
    if (ring2Ref.current) {
      const mat = ring2Ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.15 + Math.sin(t * 2 + 1) * 0.1
      ring2Ref.current.scale.setScalar(1 + Math.sin(t * 1.8 + 0.5) * 0.06)
      ring2Ref.current.rotation.z = t * 0.4
    }
  })

  return (
    <group position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={ringRef}>
        <ringGeometry args={[1.1, 1.25, 32]} />
        <meshBasicMaterial color="#00e676" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={ring2Ref}>
        <ringGeometry args={[1.28, 1.35, 32]} />
        <meshBasicMaterial color="#00e676" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

export function Harvester({ harvester }: HarvesterProps) {
  const groupRef = useRef<THREE.Group>(null)
  const wheelRefs = useRef<(THREE.Mesh | null)[]>([])
  const prevPos = useRef(new THREE.Vector3(harvester.position.x, harvester.position.y, harvester.position.z))

  const useCustomModels = useGameStore((s) => s.useCustomModels)
  const config = useCustomConfigStore((s) => s.config.harvester)
  const [glbUrl, setGlbUrl] = useState<string | null>(null)

  useEffect(() => {
    let url: string | null = null
    if (useCustomModels) {
      useCustomConfigStore.getState().getBlobUrl('harvester').then((u) => {
        url = u
        setGlbUrl(u)
      })
    } else setGlbUrl(null)
    return () => { if (url && url.startsWith('blob:')) URL.revokeObjectURL(url) }
  }, [useCustomModels, config.fbxBlobId])

  const selectedHarvesterId = useGameStore((s) => s.selectedHarvesterId)
  const isSelected = selectedHarvesterId === harvester.id

  const handleClick = (e: THREE.Event) => {
    (e as any).stopPropagation?.()
    const gs = useGameStore.getState()
    if (gs.harvesterPovMode) return
    gs.setSelectedHarvester(gs.selectedHarvesterId === harvester.id ? null : harvester.id)
  }

  const cargoPercent = harvester.cargo / HARVESTER_CONFIG.carryCapacity
  const modelGroupRef = useRef<THREE.Group>(null)
  const spawnStartRef = useRef(harvester.createdAt)
  const spawnDone = useRef(false)

  useFrame((_, delta) => {
    if (!groupRef.current || !modelGroupRef.current) return

    const spawnElapsed = (Date.now() - spawnStartRef.current) / 1000
    const spawnT = Math.min(1, spawnElapsed / SPAWN_DURATION)
    const spawnEased = 1 - Math.pow(1 - spawnT, 3)

    if (spawnT < 1) {
      const yOffset = (1 - spawnEased) * -SPAWN_DIP
      const tilt = (1 - spawnEased) * SPAWN_TILT
      modelGroupRef.current.position.y = yOffset
      modelGroupRef.current.rotation.x = -tilt

      groupRef.current.position.set(harvester.position.x, 0.25, harvester.position.z)

      if (harvester.targetRockId) {
        const rock = useMineralRocksStore.getState().rocks.find((r) => r.id === harvester.targetRockId)
        if (rock) {
          const angle = Math.atan2(
            rock.position.x - harvester.position.x,
            rock.position.z - harvester.position.z
          )
          groupRef.current.rotation.y = angle
        }
      }

      prevPos.current.set(harvester.position.x, harvester.position.y, harvester.position.z)
      return
    }

    if (!spawnDone.current) {
      spawnDone.current = true
      modelGroupRef.current.position.y = 0
      modelGroupRef.current.rotation.x = 0
    }

    const terrainY = getSuspensionHeight(harvester.position.x, harvester.position.z)
    const target = new THREE.Vector3(harvester.position.x, terrainY + 0.25, harvester.position.z)
    groupRef.current.position.lerp(target, Math.min(1, delta * 10))

    const dx = harvester.position.x - prevPos.current.x
    const dz = harvester.position.z - prevPos.current.z
    if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
      const angle = Math.atan2(dx, dz)
      const current = groupRef.current.rotation.y
      let diff = angle - current
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      groupRef.current.rotation.y += diff * Math.min(1, delta * 6)
    }
    prevPos.current.set(harvester.position.x, harvester.position.y, harvester.position.z)

    const speed = Math.sqrt(dx * dx + dz * dz)
    for (const w of wheelRefs.current) {
      if (w) w.rotation.x += speed * 8
    }
  })

  const showCustom = useCustomModels && glbUrl
  const isMoving = harvester.state === 'moving_to_rock' || harvester.state === 'returning'
  const showExhaust = isMoving && spawnDone.current

  return (
    <group ref={groupRef} position={[harvester.position.x, 0.25, harvester.position.z]} onPointerDown={handleClick}>
      {isSelected && <SelectionRing />}
      <SpawnDirtBurst />
      <group ref={modelGroupRef}>
        {showCustom ? (
          <GameCustomModel url={glbUrl} config={config} modelType="harvester" />
        ) : !useCustomModels ? (
          <>
            <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.7, 0.12, 1.2]} />
              <meshStandardMaterial color="#3a3a3a" roughness={0.7} metalness={0.4} />
            </mesh>

            <mesh position={[0, 0.42, 0.25]} castShadow receiveShadow>
              <boxGeometry args={[0.6, 0.4, 0.45]} />
              <meshStandardMaterial color={CABIN_COLOR} roughness={0.5} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0.48, 0.02]}>
              <boxGeometry args={[0.5, 0.2, 0.02]} />
              <meshStandardMaterial color="#aaddff" roughness={0.1} metalness={0.8} transparent opacity={0.6} />
            </mesh>

            <mesh position={[0, 0.28, -0.25]} castShadow receiveShadow>
              <boxGeometry args={[0.65, 0.18, 0.6]} />
              <meshStandardMaterial color={CARGO_COLOR} roughness={0.7} metalness={0.2} />
            </mesh>
            {cargoPercent > 0 && (
              <mesh position={[0, 0.4, -0.25]}>
                <boxGeometry args={[0.55, cargoPercent * 0.2, 0.5]} />
                <meshStandardMaterial color="#44ddff" emissive="#22aacc" emissiveIntensity={0.4} roughness={0.3} metalness={0.6} />
              </mesh>
            )}

            <mesh position={[0.3, 0.35, -0.25]} castShadow>
              <boxGeometry args={[0.05, 0.16, 0.6]} />
              <meshStandardMaterial color={BODY_COLOR} roughness={0.6} metalness={0.3} />
            </mesh>
            <mesh position={[-0.3, 0.35, -0.25]} castShadow>
              <boxGeometry args={[0.05, 0.16, 0.6]} />
              <meshStandardMaterial color={BODY_COLOR} roughness={0.6} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0.35, -0.52]} castShadow>
              <boxGeometry args={[0.65, 0.16, 0.05]} />
              <meshStandardMaterial color={BODY_COLOR} roughness={0.6} metalness={0.3} />
            </mesh>

            {[
              [-0.35, 0.08, 0.32],
              [0.35, 0.08, 0.32],
              [-0.35, 0.08, -0.35],
              [0.35, 0.08, -0.35],
            ].map((pos, i) => (
              <mesh
                key={i}
                ref={(el) => { wheelRefs.current[i] = el }}
                position={pos as [number, number, number]}
                rotation={[0, 0, Math.PI / 2]}
                castShadow
              >
                <cylinderGeometry args={[0.09, 0.09, 0.08, 8]} />
                <meshStandardMaterial color={WHEEL_COLOR} roughness={0.9} metalness={0.2} />
              </mesh>
            ))}

            <mesh position={[0.2, 0.3, 0.5]}>
              <sphereGeometry args={[0.03, 6, 4]} />
              <meshBasicMaterial color="#ffee88" />
            </mesh>
            <mesh position={[-0.2, 0.3, 0.5]}>
              <sphereGeometry args={[0.03, 6, 4]} />
              <meshBasicMaterial color="#ffee88" />
            </mesh>
          </>
        )}

        {harvester.state === 'gathering' && (
          <>
            <pointLight position={[0, 0.5, -0.3]} color="#44ddff" intensity={1.5} distance={3} />
            <MiningParticles />
          </>
        )}
        <ExhaustSmoke isMoving={showExhaust} />
      </group>
    </group>
  )
}
