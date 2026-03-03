import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'

const CAMERA_DISTANCE = 65
const CAMERA_HEIGHT = 50
const ANGLE = Math.PI / 4

export function IsometricCamera() {
  const { camera } = useThree()

  useEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return

    const x = Math.cos(ANGLE) * CAMERA_DISTANCE
    const z = Math.sin(ANGLE) * CAMERA_DISTANCE
    camera.position.set(x, CAMERA_HEIGHT, z)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera])

  return null
}
