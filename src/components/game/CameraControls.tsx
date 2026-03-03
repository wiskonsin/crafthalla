import { useRef, useEffect } from 'react'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { useCameraStore } from '../../stores/useCameraStore'
import { useGameStore } from '../../stores/useGameStore'

export function CameraControls() {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  const cameraSensitivity = useSettingsStore((s) => s.cameraSensitivity)
  const setControlsRef = useCameraStore((s) => s.setControlsRef)
  const povMode = useGameStore((s) => s.harvesterPovMode)
  const povTransitioning = useGameStore((s) => s.harvesterPovTransitioning)
  const suppressed = povMode || povTransitioning

  useEffect(() => {
    if (suppressed) {
      setControlsRef(null)
    } else {
      setControlsRef(controlsRef)
    }
  }, [setControlsRef, suppressed])

  if (suppressed) return null

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableRotate={true}
      enablePan={true}
      enableZoom={true}
      mouseButtons={{
        LEFT: undefined,
        MIDDLE: THREE.MOUSE.ROTATE,
        RIGHT: THREE.MOUSE.PAN,
      }}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.2}
      minAzimuthAngle={-Math.PI / 2}
      maxAzimuthAngle={Math.PI / 2}
      minZoom={20}
      maxZoom={80}
      zoomSpeed={1.2 * cameraSensitivity}
      panSpeed={1.5 * cameraSensitivity}
      rotateSpeed={0.8 * cameraSensitivity}
      target={[0, 0, 0]}
      enableDamping={false}
    />
  )
}
