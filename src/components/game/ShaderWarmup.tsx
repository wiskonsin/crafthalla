import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Pre-compiles all WebGL shader variants + pre-loads the troika font
 * used by FloatingTexts, preventing the stall on first building placement.
 */
export function ShaderWarmup() {
  const [shadersReady, setShadersReady] = useState(false)
  const frameCount = useRef(0)
  const { gl, scene, camera } = useThree()

  useFrame(() => {
    if (shadersReady) return
    frameCount.current++
    if (frameCount.current === 2) {
      gl.compile(scene, camera)
    }
    if (frameCount.current >= 4) {
      setShadersReady(true)
    }
  })

  return (
    <group position={[0, -200, 0]}>
      {/* Permanent: pre-load troika font so first FloatingText doesn't stall */}
      <Text fontSize={0.01} anchorX="center" anchorY="middle">
        <meshBasicMaterial color="#000" transparent opacity={0} depthTest={false} toneMapped={false} />
        {'.'}
      </Text>

      {!shadersReady && (
        <>
          <mesh>
            <boxGeometry args={[0.01, 0.01, 0.01]} />
            <meshStandardMaterial color="#555" roughness={0.7} metalness={0.3} />
          </mesh>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.01, 0.01, 0.01, 6]} />
            <meshStandardMaterial color="#555" roughness={0.6} metalness={0.4} />
          </mesh>
          <mesh castShadow>
            <sphereGeometry args={[0.01, 6, 4]} />
            <meshStandardMaterial color="#555" roughness={0.5} metalness={0.5} emissive="#111" emissiveIntensity={0.5} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.01, 0.01, 0.01]} />
            <meshStandardMaterial color="#aaddff" roughness={0.1} metalness={0.8} transparent opacity={0.6} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.01, 0.01, 0.01]} />
            <meshStandardMaterial color="#44ddff" emissive="#22aacc" emissiveIntensity={0.4} roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.01, 0.01, 0.01]} />
            <meshBasicMaterial color="#fff" />
          </mesh>
          <mesh>
            <ringGeometry args={[0.005, 0.01, 24]} />
            <meshBasicMaterial color="#f00" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.01, 0.01, 0.01]} />
            <meshBasicMaterial color="#fff" transparent opacity={0.4} wireframe />
          </mesh>
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[new Float32Array([0, 0, 0]), 3]} />
              <bufferAttribute attach="attributes-color" args={[new Float32Array([1, 1, 1]), 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.01} vertexColors transparent opacity={0.9} sizeAttenuation depthWrite={false} />
          </points>
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[new Float32Array([0, 0, 0]), 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.01} color="#ffcc66" transparent opacity={0.8} sizeAttenuation depthWrite={false} />
          </points>
          <line>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[new Float32Array([0, 0, 0, 0.01, 0, 0]), 3]} />
            </bufferGeometry>
            <lineBasicMaterial color="#4488ff" transparent opacity={0.4} />
          </line>
          <mesh>
            <planeGeometry args={[0.01, 0.01]} />
            <meshBasicMaterial color="#000" transparent opacity={0.5} depthWrite={false} />
          </mesh>
        </>
      )}
    </group>
  )
}
