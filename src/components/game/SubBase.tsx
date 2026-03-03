import { useRef, useState, useEffect } from 'react'
import { RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../stores/useGameStore'
import { useCustomConfigStore } from '../../stores/useCustomConfigStore'
import { GameCustomModel } from './GameFbxModel'
import { BuildingRiseIn } from './ConstructionEffect'

interface SubBaseProps {
  id: string
  baseId: string
  position: [number, number, number]
  hp: number
  maxHp: number
}

export function SubBase({ id, baseId, position, hp, maxHp }: SubBaseProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const customRotateRef = useRef<THREE.Group>(null)
  const setSelectedBase = useGameStore((s) => s.setSelectedBase)
  const selectedBaseId = useGameStore((s) => s.selectedBaseId)

  const useCustomModels = useGameStore((s) => s.useCustomModels)
  const config = useCustomConfigStore((s) => s.config.subBase)
  const [fbxUrl, setFbxUrl] = useState<string | null>(null)

  useEffect(() => {
    let url: string | null = null
    if (useCustomModels) {
      useCustomConfigStore.getState().getBlobUrl('subBase').then((u) => {
        url = u
        setFbxUrl(u)
      })
    } else setFbxUrl(null)
    return () => { if (url && url.startsWith('blob:')) URL.revokeObjectURL(url) }
  }, [useCustomModels, config.fbxBlobId])

  const hpPercent = Math.max(0, hp / maxHp)

  useFrame((_, delta) => {
    if (useCustomModels) return
    const ref = meshRef.current
    if (ref) ref.rotation.y += delta * 0.15
  })

  return (
    <RigidBody
      type="fixed"
      position={position}
      colliders="cuboid"
      args={[2, 1.2, 2]}
      userData={{ type: 'building', id }}
    >
      <group
        onClick={(e) => {
          e.stopPropagation()
          setSelectedBase(selectedBaseId === baseId ? null : baseId)
        }}
        onPointerOver={() => document.body.classList.add('cursor-pointer')}
        onPointerOut={() => document.body.classList.remove('cursor-pointer')}
      >
        {fbxUrl ? (
          <BuildingRiseIn>
            <group ref={customRotateRef}>
              <GameCustomModel url={fbxUrl} config={config} modelType="subBase" />
            </group>
          </BuildingRiseIn>
        ) : !useCustomModels ? (
          <BuildingRiseIn>
            <mesh ref={meshRef} castShadow>
              <boxGeometry args={[4, 2.4, 4]} />
              <meshStandardMaterial color="#2a3a5a" roughness={0.7} metalness={0.3} />
            </mesh>
          </BuildingRiseIn>
        ) : null}
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[3.2, 0.1, 0.06]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[-1.6 + hpPercent * 1.6, 1.5, 0.03]}>
          <boxGeometry args={[hpPercent * 3.2, 0.06, 0.04]} />
          <meshBasicMaterial
            color={hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444'}
          />
        </mesh>
      </group>
    </RigidBody>
  )
}
