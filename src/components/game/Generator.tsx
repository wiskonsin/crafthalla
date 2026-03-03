import { useRef, useState, useEffect } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../stores/useGameStore'
import { useCustomConfigStore } from '../../stores/useCustomConfigStore'
import { GameCustomModel } from './GameFbxModel'
import { PulseRing } from './PulseRing'
import { BuildingRiseIn } from './ConstructionEffect'

const WIDTH = 2
const HEIGHT = 1.5
const DEPTH = 2

interface GeneratorProps {
  id: string
  position: [number, number, number]
  hp: number
  maxHp: number
  isSelected?: boolean
  onSelect?: () => void
}

export function Generator({ id, position, hp, maxHp, isSelected, onSelect }: GeneratorProps) {
  const coreRef = useRef<THREE.Mesh>(null)
  const customRotateRef = useRef<THREE.Group>(null)
  const hpPercent = Math.max(0, hp / maxHp)

  const useCustomModels = useGameStore((s) => s.useCustomModels)
  const config = useCustomConfigStore((s) => s.config.generator)
  const [fbxUrl, setFbxUrl] = useState<string | null>(null)

  useEffect(() => {
    let url: string | null = null
    if (useCustomModels) {
      useCustomConfigStore.getState().getBlobUrl('generator').then((u) => {
        url = u
        setFbxUrl(u)
      })
    } else setFbxUrl(null)
    return () => { if (url && url.startsWith('blob:')) URL.revokeObjectURL(url) }
  }, [useCustomModels, config.fbxBlobId])

  useFrame((_, delta) => {
    if (useCustomModels) return
    const ref = coreRef.current
    if (ref) ref.rotation.y += delta * 0.8
  })

  return (
    <RigidBody type="fixed" position={position} colliders={false} userData={{ type: 'building', id }}>
      <CuboidCollider args={[1, 0.75, 1]} />
      <group
        onPointerDown={(e: { stopPropagation: () => void }) => {
          e.stopPropagation()
          onSelect?.()
        }}
        onPointerOver={() => document.body.classList.add('cursor-pointer')}
        onPointerOut={() => document.body.classList.remove('cursor-pointer')}
      >
        <group position={[0, HEIGHT / 2 + 0.9, 0]}>
          <mesh>
            <boxGeometry args={[WIDTH * 1.1, 0.1, 0.06]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[-WIDTH * 0.55 + hpPercent * WIDTH * 0.55, 0, 0.03]}>
            <boxGeometry args={[hpPercent * WIDTH * 1.1, 0.06, 0.04]} />
            <meshBasicMaterial color={hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444'} />
          </mesh>
        </group>
        {fbxUrl ? (
          <BuildingRiseIn>
            <group ref={customRotateRef}>
              <GameCustomModel url={fbxUrl} config={config} modelType="generator" />
            </group>
          </BuildingRiseIn>
        ) : !useCustomModels ? (
          <BuildingRiseIn>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[WIDTH, HEIGHT, DEPTH]} />
              <meshStandardMaterial color="#5a5a5a" roughness={0.6} metalness={0.4} />
            </mesh>
            <mesh ref={coreRef} position={[0, HEIGHT / 2 + 0.2, 0]} castShadow>
              <boxGeometry args={[WIDTH * 0.6, 0.3, DEPTH * 0.6]} />
              <meshStandardMaterial
                color="#3a3a3a"
                roughness={0.5}
                metalness={0.5}
                emissive="#ffcc00"
                emissiveIntensity={isSelected ? 0.45 : 0.2}
              />
            </mesh>
          </BuildingRiseIn>
        )}
        <PulseRing color="#3388ff" radius={1.5} y={-0.70} />
      </group>
    </RigidBody>
  )
}
