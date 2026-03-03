import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EnemyGlbPreview } from './EnemyGlbPreview'
import type { CustomModelConfig } from '../../types/customModels'

interface EnemySetupPreviewProps {
  url: string | null
  config: CustomModelConfig
}

export function EnemySetupPreview({ url, config }: EnemySetupPreviewProps) {
  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 280px)',
        minHeight: 360,
        background: '#0d1117',
        borderRadius: 6,
      }}
    >
      <Canvas
        camera={{ position: [4, 3, 4], fov: 45 }}
        gl={{ antialias: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        {url ? (
          <EnemyGlbPreview url={url} config={config} />
        ) : (
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#333" wireframe />
          </mesh>
        )}
        <OrbitControls enableZoom />
      </Canvas>
    </div>
  )
}
