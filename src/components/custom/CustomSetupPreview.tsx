import { useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { CustomModel } from './CustomModel'
import { DefaultHologram } from './DefaultHologram'
import { LoadingHologram } from './LoadingHologram'
import type { CustomModelType, CustomModelConfig } from '../../types/customModels'

interface CustomSetupPreviewProps {
  type: CustomModelType
  config: CustomModelConfig
  glbUrl: string | null
  onAnimationStatus?: (loaded: boolean, count: number, names: string[]) => void
  onModelInfo?: (info: import('../../types/modelDebug').EnemyModelDebugInfo) => void
  animationPlaying?: boolean
}

const CENTER = [0, 0, 0] as [number, number, number]

function RotatingHologram({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.2
  })
  return <group ref={ref}>{children}</group>
}

/** Red sphere: only affected by Head offset, not by scale/position/rotation */
function HeadIndicator({ headOffset }: { headOffset: [number, number, number] }) {
  return (
    <group position={headOffset}>
      <mesh>
        <sphereGeometry args={[0.15, 8, 6]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.8} />
      </mesh>
      <Html
        position={[0, 0.35, 0]}
        center
        style={{
          fontSize: 10,
          fontFamily: 'Orbitron',
          color: '#ff6666',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          textShadow: '0 0 4px #000',
        }}
      >
        Head here
      </Html>
    </group>
  )
}

export function CustomSetupPreview({ type, config, glbUrl, onAnimationStatus, onModelInfo, animationPlaying }: CustomSetupPreviewProps) {
  const headOffset = type === 'enemy' ? (config.headOffset ?? [0, 0.5, 0.6]) : null

  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 300px)',
        minHeight: 400,
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
        <group position={CENTER}>
          <RotatingHologram>
            <DefaultHologram type={type} hasModel={!!glbUrl} />
            {glbUrl ? (
              <CustomModel
                url={glbUrl}
                config={config}
                modelType={type}
                onAnimationStatus={onAnimationStatus}
                onModelInfo={onModelInfo}
                animationPlaying={animationPlaying}
                headIndicatorExternal={!!headOffset}
              />
            ) : (
              <LoadingHologram />
            )}
          </RotatingHologram>
        </group>
        {glbUrl && headOffset && (
          <group position={CENTER}>
            <HeadIndicator headOffset={headOffset} />
          </group>
        )}
        <OrbitControls enableZoom />
      </Canvas>
    </div>
  )
}
