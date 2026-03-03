import { useRef, useState, useEffect } from 'react'
import { RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { useGameStore } from '../../stores/useGameStore'
import { useCustomConfigStore } from '../../stores/useCustomConfigStore'
import { GameCustomModel } from './GameFbxModel'
import { PulseRing } from './PulseRing'
import { BuildingRiseIn } from './ConstructionEffect'
import { CENTRAL_EVOLUTION_KILLS } from '../../config/constants'

const BASE_SIZE = 4
const BASE_HEIGHT = 3

function getEvolutionLevel(kills: number): number {
  for (let i = CENTRAL_EVOLUTION_KILLS.length - 1; i >= 0; i--) {
    if (kills >= CENTRAL_EVOLUTION_KILLS[i]) return i
  }
  return 0
}

export function CentralBuilding() {
  const coreRef = useRef<THREE.Mesh>(null)
  const customRotateRef = useRef<THREE.Group>(null)
  const setSelectedBase = useGameStore((s) => s.setSelectedBase)
  const selectedBaseId = useGameStore((s) => s.selectedBaseId)
  const centralHp = useBuildingsStore((s) => s.centralHp)
  const centralMaxHp = useBuildingsStore((s) => s.centralMaxHp)
  const kills = useGameStore((s) => s.kills)
  const level = getEvolutionLevel(kills)
  const hpPercent = Math.max(0, centralHp / centralMaxHp)

  const useCustomModels = useGameStore((s) => s.useCustomModels)
  const config = useCustomConfigStore((s) => s.config.central)
  const [fbxUrl, setFbxUrl] = useState<string | null>(null)

  useEffect(() => {
    let url: string | null = null
    if (useCustomModels) {
      useCustomConfigStore.getState().getBlobUrl('central').then((u) => {
        url = u
        setFbxUrl(u)
      })
    } else setFbxUrl(null)
    return () => { if (url && url.startsWith('blob:')) URL.revokeObjectURL(url) }
  }, [useCustomModels, config.fbxBlobId])

  useFrame((_, delta) => {
    if (useCustomModels) return
    const ref = coreRef.current
    if (ref && level >= 1) ref.rotation.y += delta * 0.15
  })

  const barHeight = 0.5

  return (
    <RigidBody type="fixed" position={[0, 0.6, 0]} colliders="cuboid" userData={{ type: 'central' }}>
      <group
        onClick={(e) => {
          e.stopPropagation()
          setSelectedBase(selectedBaseId === 'main' ? null : 'main')
        }}
        onPointerOver={() => document.body.classList.add('cursor-pointer')}
        onPointerOut={() => document.body.classList.remove('cursor-pointer')}
      >
        {/* Barra de vida */}
        <group position={[0, BASE_HEIGHT / 2 + barHeight + 0.8, 0]}>
          <mesh>
            <boxGeometry args={[BASE_SIZE * 0.6, 0.1, 0.06]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[-BASE_SIZE * 0.3 + hpPercent * BASE_SIZE * 0.3, 0, 0.02]}>
            <boxGeometry args={[hpPercent * BASE_SIZE * 0.6, 0.06, 0.04]} />
            <meshBasicMaterial
              color={hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444'}
            />
          </mesh>
        </group>

        {fbxUrl ? (
          <BuildingRiseIn>
            <group ref={customRotateRef}>
              <GameCustomModel url={fbxUrl} config={config} modelType="central" />
            </group>
          </BuildingRiseIn>
        ) : !useCustomModels ? (
          <BuildingRiseIn>
          <group scale={1.5}>
            <mesh ref={coreRef} position={[0, 0.4, 0]} castShadow receiveShadow>
              <octahedronGeometry args={[0.6, 0]} />
              <meshStandardMaterial
                color={level >= 4 ? '#00ff88' : level >= 3 ? '#00ccff' : level >= 2 ? '#ffaa00' : level >= 1 ? '#8888ff' : '#6a5a4a'}
                emissive={level >= 1 ? (level >= 4 ? '#00ff88' : level >= 3 ? '#00aacc' : level >= 2 ? '#cc8800' : '#4444aa') : '#000'}
                emissiveIntensity={level >= 1 ? 0.3 : 0}
                roughness={0.6}
                metalness={0.4}
              />
            </mesh>
            <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
              <cylinderGeometry args={[2.4, 1.4, 1.6, 10]} />
              <meshStandardMaterial color="#4a4038" roughness={0.85} metalness={0.1} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
              <cylinderGeometry args={[0.7, 0.9, 1.2, 6]} />
              <meshStandardMaterial color="#4a4038" roughness={0.85} metalness={0.1} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, -0.2, 0]}>
              <cylinderGeometry args={[2.8, 3, 0.4, 8]} />
              <meshStandardMaterial color="#3a3530" roughness={0.8} metalness={0.2} />
            </mesh>
            <mesh castShadow position={[0.6, 1.5, 0]}>
              <boxGeometry args={[0.35, 2.2, 0.35]} />
              <meshStandardMaterial color="#5a5048" roughness={0.7} metalness={0.3} />
            </mesh>
            <mesh castShadow position={[-0.6, 1.5, 0]}>
              <boxGeometry args={[0.35, 2.2, 0.35]} />
              <meshStandardMaterial color="#5a5048" roughness={0.7} metalness={0.3} />
            </mesh>
            <mesh castShadow position={[0, 2.2, 0]}>
              <boxGeometry args={[2.5, 0.25, 0.25]} />
              <meshStandardMaterial color="#5a5048" roughness={0.7} metalness={0.3} />
            </mesh>
          </group>
          </BuildingRiseIn>
        ) : null}

        {!useCustomModels && level >= 2 && (
          <mesh castShadow position={[0, 2.2, 0]}>
            <sphereGeometry args={[0.35, 8, 6]} />
            <meshStandardMaterial
              color="#ffaa00"
              emissive="#ff6600"
              emissiveIntensity={0.4}
            />
          </mesh>
        )}
        {!useCustomModels && level >= 3 && (
          <>
            <mesh castShadow position={[1.2, 1.8, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.8, 6]} />
              <meshStandardMaterial color="#00aacc" emissive="#0088aa" emissiveIntensity={0.3} />
            </mesh>
            <mesh castShadow position={[-1.2, 1.8, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.8, 6]} />
              <meshStandardMaterial color="#00aacc" emissive="#0088aa" emissiveIntensity={0.3} />
            </mesh>
          </>
        )}
        {!useCustomModels && level >= 4 && (
          <pointLight position={[0, 0.5, 0]} color="#00ff88" intensity={1} distance={6} />
        )}

        <PulseRing color="#ffcc00" radius={3.5} y={-0.55} />
      </group>
    </RigidBody>
  )
}
