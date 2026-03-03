import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const VERTEX_COUNT_SPHERE = 32
const MORPH_SPEED = 0.8
const ROTATE_SPEED = 0.6
const COLOR = new THREE.Color('#00e5ff')

export function LoadingHologram() {
  const meshRef = useRef<THREE.Mesh>(null)
  const wireRef = useRef<THREE.LineSegments>(null)
  const groupRef = useRef<THREE.Group>(null)

  const { geo, origPositions } = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.8, 2)
    const pos = g.attributes.position
    const orig = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      orig[i * 3] = pos.getX(i)
      orig[i * 3 + 1] = pos.getY(i)
      orig[i * 3 + 2] = pos.getZ(i)
    }
    return { geo: g, origPositions: orig }
  }, [])

  const wireGeo = useMemo(() => new THREE.WireframeGeometry(geo), [geo])

  const ringGeo = useMemo(() => {
    const g = new THREE.RingGeometry(1.0, 1.05, 48)
    return g
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    if (groupRef.current) {
      groupRef.current.rotation.y = t * ROTATE_SPEED
      groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.15
    }

    const pos = geo.attributes.position
    const arr = pos.array as Float32Array

    for (let i = 0; i < pos.count; i++) {
      const ox = origPositions[i * 3]
      const oy = origPositions[i * 3 + 1]
      const oz = origPositions[i * 3 + 2]

      const n1 = Math.sin(ox * 3.0 + t * MORPH_SPEED * 2.5) * 0.12
      const n2 = Math.sin(oy * 2.5 + t * MORPH_SPEED * 1.8 + 1.3) * 0.10
      const n3 = Math.sin(oz * 2.8 - t * MORPH_SPEED * 2.0 + 2.7) * 0.08

      const len = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1
      const nx = ox / len
      const ny = oy / len
      const nz = oz / len

      const displacement = n1 + n2 + n3

      arr[i * 3] = ox + nx * displacement
      arr[i * 3 + 1] = oy + ny * displacement
      arr[i * 3 + 2] = oz + nz * displacement
    }

    pos.needsUpdate = true
    geo.computeVertexNormals()

    if (wireRef.current) {
      const wg = new THREE.WireframeGeometry(geo)
      wireRef.current.geometry.dispose()
      wireRef.current.geometry = wg
    }

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.08 + Math.sin(t * 1.5) * 0.04
    }
  })

  const pulse = 0.3

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      <mesh ref={meshRef} geometry={geo}>
        <meshBasicMaterial
          color={COLOR}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      <lineSegments ref={wireRef} geometry={wireGeo}>
        <lineBasicMaterial
          color={COLOR}
          transparent
          opacity={pulse}
        />
      </lineSegments>

      <mesh geometry={ringGeo} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <meshBasicMaterial
          color={COLOR}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh geometry={ringGeo} rotation={[0, 0, 0]} position={[0, 0, 0]}>
        <meshBasicMaterial
          color={COLOR}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
