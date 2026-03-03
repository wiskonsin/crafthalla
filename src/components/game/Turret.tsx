import { useRef, useState, useEffect } from 'react'
import { RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../stores/useGameStore'
import { useCustomConfigStore } from '../../stores/useCustomConfigStore'
import { useTurretTargetStore } from '../../stores/useTurretTargetStore'
import { GameCustomModel } from './GameFbxModel'
import { PulseRing } from './PulseRing'
import { BuildingRiseIn } from './ConstructionEffect'
import type { CustomModelType } from '../../types/customModels'

const BASE_RADIUS = 0.8
const BASE_HEIGHT = 1
const DOME_RADIUS = 0.6
const TURRET_SCALE = 0.5
const Y_GROUND_OFFSET = -0.02

interface TurretProps {
  id: string
  position: [number, number, number]
  hp: number
  maxHp: number
  enabled?: boolean
  isSelected?: boolean
  onSelect?: () => void
  turretType?: 'turret' | 'turret_aa'
}

export function Turret({ id, position, hp, maxHp, enabled = true, isSelected, onSelect, turretType = 'turret' }: TurretProps) {
  const domeRef = useRef<THREE.Mesh>(null)
  const customRotateRef = useRef<THREE.Group>(null)
  const yOffset = BASE_HEIGHT / 2 + DOME_RADIUS
  const hpPercent = Math.max(0, hp / maxHp)

  const useCustomModels = useGameStore((s) => s.useCustomModels)
  const config = useCustomConfigStore((s) => s.config[turretType as CustomModelType])
  const target = useTurretTargetStore((s) => s.getTarget(id))
  const [fbxUrl, setFbxUrl] = useState<string | null>(null)

  useEffect(() => {
    let url: string | null = null
    if (useCustomModels) {
      useCustomConfigStore.getState().getBlobUrl(turretType as CustomModelType).then((u) => {
        url = u
        setFbxUrl(u)
      })
    } else {
      setFbxUrl(null)
    }
    return () => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url)
    }
  }, [useCustomModels, config.fbxBlobId, turretType])

  useFrame((_, delta) => {
    const rotRef = useCustomModels && fbxUrl ? customRotateRef.current : domeRef.current
    if (!rotRef || !enabled) return
    if (target) {
      const dx = target.x - position[0]
      const dz = target.z - position[2]
      const targetAngle = Math.atan2(dx, dz) + Math.PI
      const current = rotRef.rotation.y
      let diff = targetAngle - current
      while (diff > Math.PI) diff -= 2 * Math.PI
      while (diff < -Math.PI) diff += 2 * Math.PI
      rotRef.rotation.y = current + diff * Math.min(1, delta * 8)
    } else if (!useCustomModels) {
      rotRef.rotation.y += delta * 0.3
    }
  })

  const scaledTop = (yOffset + DOME_RADIUS) * TURRET_SCALE

  return (
    <RigidBody type="fixed" position={position} colliders="cuboid" userData={{ type: 'building', id }}>
      <group
        onPointerDown={(e: { stopPropagation: () => void }) => {
          e.stopPropagation()
          onSelect?.()
        }}
        onPointerOver={() => document.body.classList.add('cursor-pointer')}
        onPointerOut={() => document.body.classList.remove('cursor-pointer')}
      >
        {/* HP bar — outside scale group so it stays readable */}
        <group position={[0, scaledTop + 0.25, 0]}>
          <mesh>
            <boxGeometry args={[1.0, 0.06, 0.04]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[-0.5 + hpPercent * 0.5, 0, 0.02]}>
            <boxGeometry args={[hpPercent * 1.0, 0.04, 0.03]} />
            <meshBasicMaterial color={hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444'} />
          </mesh>
        </group>

        {/* Turret model — scaled to half */}
        <group scale={TURRET_SCALE} position={[0, Y_GROUND_OFFSET, 0]}>
          {fbxUrl ? (
            <BuildingRiseIn>
              <group ref={customRotateRef}>
                <GameCustomModel url={fbxUrl} config={config} modelType={turretType as CustomModelType} />
              </group>
            </BuildingRiseIn>
          ) : !useCustomModels ? (
            <BuildingRiseIn>
              <mesh position={[0, BASE_HEIGHT / 2, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[BASE_RADIUS, BASE_RADIUS, BASE_HEIGHT, 6]} />
                <meshStandardMaterial color="#4a4a4a" roughness={0.7} metalness={0.3} />
              </mesh>
              <mesh ref={domeRef} position={[0, yOffset, 0]} castShadow>
                <sphereGeometry args={[DOME_RADIUS, 6, 4]} />
                <meshStandardMaterial
                  color={isSelected ? '#8a8a8a' : '#6a6a6a'}
                  roughness={0.5}
                  metalness={0.5}
                  emissive={enabled ? '#cc3333' : '#333333'}
                  emissiveIntensity={enabled ? (isSelected ? 0.25 : 0.15) : 0.02}
                />
              </mesh>
            </BuildingRiseIn>
          ) : null}
        </group>

        <PulseRing color="#ff3333" radius={0.7} y={0.03} />
      </group>
    </RigidBody>
  )
}
