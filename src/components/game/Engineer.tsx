import { useRef, useState, useEffect, useMemo } from 'react'
import { RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Engineer as EngineerType } from '../../stores/useEngineersStore'
import { useGameStore } from '../../stores/useGameStore'
import { useCustomConfigStore } from '../../stores/useCustomConfigStore'
import { GameCustomModel } from './GameFbxModel'

const SPARK_COUNT = 18

interface EngineerProps {
  engineer: EngineerType
}

function WeldingSparks({ active }: { active: boolean }) {
  const pointsRef = useRef<THREE.Points>(null)

  const { geo, vels } = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const positions = new Float32Array(SPARK_COUNT * 3)
    const colors = new Float32Array(SPARK_COUNT * 3)
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const velocities = Array.from({ length: SPARK_COUNT }, () => ({
      x: (Math.random() - 0.5) * 3,
      y: Math.random() * 4 + 1.5,
      z: (Math.random() - 0.5) * 3,
      life: 0,
      maxLife: 0.2 + Math.random() * 0.4,
    }))

    return { geo: g, vels: velocities }
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const pos = geo.attributes.position.array as Float32Array
    const col = geo.attributes.color.array as Float32Array

    for (let i = 0; i < SPARK_COUNT; i++) {
      const v = vels[i]
      v.life += delta

      if (!active || v.life >= v.maxLife) {
        if (active) {
          v.x = (Math.random() - 0.5) * 3
          v.y = Math.random() * 4 + 1.5
          v.z = (Math.random() - 0.5) * 3
          v.life = 0
          v.maxLife = 0.15 + Math.random() * 0.35
          pos[i * 3] = (Math.random() - 0.5) * 0.15
          pos[i * 3 + 1] = 0.3 + Math.random() * 0.2
          pos[i * 3 + 2] = (Math.random() - 0.5) * 0.15
        } else {
          col[i * 3] = 0
          col[i * 3 + 1] = 0
          col[i * 3 + 2] = 0
          continue
        }
      }

      pos[i * 3] += v.x * delta
      pos[i * 3 + 1] += v.y * delta
      v.y -= 12 * delta
      pos[i * 3 + 2] += v.z * delta

      const t = v.life / v.maxLife
      const fade = 1 - t * t
      col[i * 3] = 1.0 * fade
      col[i * 3 + 1] = (0.5 + Math.random() * 0.3) * fade
      col[i * 3 + 2] = 0.1 * fade
    }

    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

export function Engineer({ engineer }: EngineerProps) {
  const meshRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<React.ComponentRef<typeof RigidBody>>(null)
  const opacity = engineer.state === 'fading' ? 1 - engineer.fadeProgress : 1
  const isRepairing = engineer.state === 'repairing'

  const useCustomModels = useGameStore((s) => s.useCustomModels)
  const config = useCustomConfigStore((s) => s.config.engineer)
  const [fbxUrl, setFbxUrl] = useState<string | null>(null)

  useEffect(() => {
    let url: string | null = null
    if (useCustomModels && config.fbxBlobId) {
      useCustomConfigStore.getState().getBlobUrl('engineer').then((u) => {
        url = u
        setFbxUrl(u)
      })
    } else setFbxUrl(null)
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [useCustomModels, config.fbxBlobId])

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.visible = opacity > 0.01
      if (engineer.state === 'fading') {
        meshRef.current.position.y += 0.003
        meshRef.current.scale.setScalar(Math.max(0, opacity))
      }
    }
    if (bodyRef.current) {
      bodyRef.current.setNextKinematicTranslation({
        x: engineer.position.x,
        y: engineer.position.y || 0.5,
        z: engineer.position.z,
      })
    }
  })

  const pos: [number, number, number] = [
    engineer.position.x,
    engineer.position.y || 0.5,
    engineer.position.z,
  ]

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      position={pos}
      colliders="cuboid"
      args={[0.5, 0.35, 0.5]}
      userData={{ type: 'engineer', id: engineer.id }}
    >
      <group ref={meshRef}>
        {useCustomModels && fbxUrl ? (
          <GameCustomModel url={fbxUrl} config={config} opacity={opacity} modelType="engineer" />
        ) : (
          <>
            <mesh castShadow>
              <capsuleGeometry args={[0.2, 0.4, 4, 8, 1]} />
              <meshStandardMaterial
                color="#4a6a8a"
                roughness={0.7}
                metalness={0.2}
                transparent
                opacity={opacity}
              />
            </mesh>
            <mesh position={[0, 0.4, 0]} castShadow>
              <sphereGeometry args={[0.2, 8, 6]} />
              <meshStandardMaterial
                color="#e8c4a0"
                roughness={0.8}
                metalness={0.1}
                transparent
                opacity={opacity}
              />
            </mesh>
          </>
        )}
        <WeldingSparks active={isRepairing} />
      </group>
    </RigidBody>
  )
}
