import type { CustomModelType } from '../../types/customModels'

interface DefaultHologramProps {
  type: CustomModelType
  hasModel?: boolean
}

export function DefaultHologram({ type, hasModel = false }: DefaultHologramProps) {
  const color = 0x00e5ff
  const opacity = hasModel ? 0.18 : 0.4

  switch (type) {
    case 'central':
      return (
        <group>
          <mesh>
            <cylinderGeometry args={[2.4, 1.4, 1.6, 10]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} wireframe />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[2.5, 0.25, 0.25]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} wireframe />
          </mesh>
        </group>
      )
    case 'generator':
      return (
        <mesh>
          <boxGeometry args={[2, 1.5, 2]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} wireframe />
        </mesh>
      )
    case 'turret':
    case 'turret_aa':
      return (
        <group>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 1, 8]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} wireframe />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <sphereGeometry args={[0.6, 8, 6]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} wireframe />
          </mesh>
        </group>
      )
    case 'subBase':
      return (
        <mesh>
          <boxGeometry args={[4, 2.4, 4]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} wireframe />
        </mesh>
      )
    case 'engineer':
      return (
        <group>
          <mesh position={[0, 0.5, 0]}>
            <capsuleGeometry args={[0.2, 0.4, 4, 8, 1]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} wireframe />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <sphereGeometry args={[0.2, 8, 6]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} wireframe />
          </mesh>
        </group>
      )
    case 'enemy':
      return (
        <group>
          <mesh>
            <boxGeometry args={[1, 0.7, 1]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} wireframe />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.35, 0.4, 0.35, 4]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} wireframe />
          </mesh>
        </group>
      )
    default:
      return null
  }
}
