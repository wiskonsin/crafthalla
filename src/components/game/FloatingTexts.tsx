import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useFloatingTextsStore, type FloatingText } from '../../stores/useFloatingTextsStore'

const DURATION = 1.8
const RISE_SPEED = 3.0

function FloatingTextItem({ data }: { data: FloatingText }) {
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const removeText = useFloatingTextsStore((s) => s.removeText)
  const doneRef = useRef(false)

  useFrame(() => {
    if (doneRef.current || !groupRef.current) return
    const elapsed = (Date.now() - data.createdAt) / 1000
    const progress = Math.min(1, elapsed / DURATION)

    groupRef.current.position.y = data.position.y + 2 + elapsed * RISE_SPEED
    const fade = 1 - progress * progress
    if (matRef.current) matRef.current.opacity = fade

    if (progress >= 1) {
      doneRef.current = true
      removeText(data.id)
    }
  })

  return (
    <group ref={groupRef} position={[data.position.x, data.position.y + 2, data.position.z]}>
      <Text
        fontSize={0.7}
        fontWeight={700}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.06}
        outlineColor="#000000"
      >
        <meshBasicMaterial
          ref={matRef}
          color={data.color}
          transparent
          opacity={1}
          depthTest={false}
          toneMapped={false}
        />
        {data.text}
      </Text>
    </group>
  )
}

export function FloatingTexts() {
  const texts = useFloatingTextsStore((s) => s.texts)

  return (
    <group>
      {texts.map((t) => (
        <FloatingTextItem key={t.id} data={t} />
      ))}
    </group>
  )
}
