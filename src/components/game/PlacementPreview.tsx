import type { BuildOption } from '../../types'
import { snapToGrid } from '../../config/constants'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { useGameStore } from '../../stores/useGameStore'

interface PlacementPreviewProps {
  type: BuildOption
  position: { x: number; z: number } | null
  onPlace?: (x: number, z: number) => void
}

export function PlacementPreview({ type, position, onPlace }: PlacementPreviewProps) {
  const canPlaceAt = useBuildingsStore((s) => s.canPlaceAt)
  const getBaseAt = useBuildingsStore((s) => s.getBaseAt)
  const canPlaceSubBase = useBuildingsStore((s) => s.canPlaceSubBase)
  const canPlaceEngineerAt = useBuildingsStore((s) => s.canPlaceEngineerAt)
  const wallRotation = useGameStore((s) => s.wallRotation)

  if (!position) return null

  const x = snapToGrid(position.x)
  const z = snapToGrid(position.z)
  const base = getBaseAt(x, z)
  const valid =
    type === 'subBase'
      ? canPlaceSubBase(x, z)
      : type === 'engineer'
        ? canPlaceEngineerAt(x, z)
        : base
          ? canPlaceAt(x, z, base.id)
          : false

  const y = type === 'generator' ? 0.75 : type === 'subBase' ? 1.2 : type === 'engineer' ? 0.5 : type === 'wall' ? 0 : 1

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    onPlace?.(x, z)
  }

  const color = valid ? 0x00ff00 : 0xff0000

  return (
    <group position={[x, y, z]} onPointerDown={handleClick}>
      {type === 'wall' ? (
        <group rotation={[0, wallRotation, 0]}>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[1.1, 1.4, 0.35]} />
            <meshBasicMaterial color={color} transparent opacity={0.4} wireframe />
          </mesh>
        </group>
      ) : type === 'engineer' ? (
        <>
          <mesh position={[0, 0.6, 0]}>
            <capsuleGeometry args={[0.2, 0.4, 4, 8, 1]} />
            <meshBasicMaterial color={color} transparent opacity={0.4} wireframe />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <sphereGeometry args={[0.2, 8, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.4} wireframe />
          </mesh>
        </>
      ) : type === 'generator' ? (
        <mesh>
          <boxGeometry args={[2, 1.5, 2]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} wireframe />
        </mesh>
      ) : type === 'subBase' ? (
        <mesh>
          <boxGeometry args={[4, 2.4, 4]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} wireframe />
        </mesh>
      ) : (
        <>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 1, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.4} wireframe />
          </mesh>
          <mesh position={[0, 1.6, 0]}>
            <sphereGeometry args={[0.6, 8, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.4} wireframe />
          </mesh>
        </>
      )}
    </group>
  )
}
