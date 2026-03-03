import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../stores/useGameStore'
import { useHarvestersStore } from '../../stores/useHarvestersStore'

const CAM_HEIGHT = 2.60
const CAM_BEHIND = 3.10
const LOOK_AHEAD = 4.50
const LOOK_Y = 0.25
const POV_ZOOM = 105

const TRANSITION_IN_SPEED = 1.2
const TRANSITION_OUT_SPEED = 2.0

export function HarvesterPovCamera() {
  const { camera } = useThree()
  const povMode = useGameStore((s) => s.harvesterPovMode)
  const selectedId = useGameStore((s) => s.selectedHarvesterId)

  const savedCamera = useRef<{ position: THREE.Vector3; zoom: number } | null>(null)
  const wasActive = useRef(false)
  const exitingRef = useRef(false)
  const exitT = useRef(0)
  const exitFrom = useRef<{ position: THREE.Vector3; zoom: number } | null>(null)
  const exitTo = useRef<{ position: THREE.Vector3; zoom: number } | null>(null)

  const prevHarvesterPos = useRef(new THREE.Vector3())
  const smoothDir = useRef(new THREE.Vector3(0, 0, 1))
  const smoothCamPos = useRef(new THREE.Vector3())
  const smoothLookAt = useRef(new THREE.Vector3())
  const transitionT = useRef(0)

  useFrame((_, delta) => {
    const active = povMode && !!selectedId
    const harvester = active
      ? useHarvestersStore.getState().harvesters.find((h) => h.id === selectedId)
      : null

    if (exitingRef.current) {
      exitT.current = Math.min(1, exitT.current + delta * TRANSITION_OUT_SPEED)
      const ease = exitT.current * exitT.current * (3 - 2 * exitT.current)

      if (exitFrom.current && exitTo.current && camera instanceof THREE.OrthographicCamera) {
        camera.position.lerpVectors(exitFrom.current.position, exitTo.current.position, ease)
        camera.zoom = THREE.MathUtils.lerp(exitFrom.current.zoom, exitTo.current.zoom, ease)
        camera.lookAt(0, 0, 0)
        camera.updateProjectionMatrix()
      }

      if (exitT.current >= 1) {
        exitingRef.current = false
        exitFrom.current = null
        exitTo.current = null
        useGameStore.setState({ harvesterPovTransitioning: false })
      }
      return
    }

    if (active && harvester) {
      const hx = harvester.position.x
      const hz = harvester.position.z

      if (!wasActive.current) {
        if (camera instanceof THREE.OrthographicCamera) {
          savedCamera.current = { position: camera.position.clone(), zoom: camera.zoom }
        }
        prevHarvesterPos.current.set(hx, 0, hz)
        smoothDir.current.set(0, 0, 1)
        smoothCamPos.current.copy(camera.position)
        smoothLookAt.current.set(hx, LOOK_Y, hz)
        transitionT.current = 0
        wasActive.current = true
      }

      transitionT.current = Math.min(1, transitionT.current + delta * TRANSITION_IN_SPEED)
      const ease = transitionT.current * transitionT.current * (3 - 2 * transitionT.current)

      const moveDx = hx - prevHarvesterPos.current.x
      const moveDz = hz - prevHarvesterPos.current.z
      const moveDist = Math.sqrt(moveDx * moveDx + moveDz * moveDz)

      if (moveDist > 0.001) {
        const nx = moveDx / moveDist
        const nz = moveDz / moveDist
        const blend = Math.min(1, delta * 8)
        smoothDir.current.x += (nx - smoothDir.current.x) * blend
        smoothDir.current.z += (nz - smoothDir.current.z) * blend
        const len = Math.sqrt(
          smoothDir.current.x * smoothDir.current.x +
          smoothDir.current.z * smoothDir.current.z
        )
        if (len > 0.001) {
          smoothDir.current.x /= len
          smoothDir.current.z /= len
        }
      }

      prevHarvesterPos.current.set(hx, 0, hz)

      const wantCamX = hx - smoothDir.current.x * CAM_BEHIND
      const wantCamZ = hz - smoothDir.current.z * CAM_BEHIND
      const wantLookX = hx + smoothDir.current.x * LOOK_AHEAD
      const wantLookZ = hz + smoothDir.current.z * LOOK_AHEAD

      const posBlend = Math.min(1, delta * 6)
      smoothCamPos.current.x += (wantCamX - smoothCamPos.current.x) * posBlend
      smoothCamPos.current.y += (CAM_HEIGHT - smoothCamPos.current.y) * posBlend
      smoothCamPos.current.z += (wantCamZ - smoothCamPos.current.z) * posBlend

      smoothLookAt.current.x += (wantLookX - smoothLookAt.current.x) * posBlend
      smoothLookAt.current.y += (LOOK_Y - smoothLookAt.current.y) * posBlend
      smoothLookAt.current.z += (wantLookZ - smoothLookAt.current.z) * posBlend

      if (transitionT.current < 1 && savedCamera.current) {
        camera.position.lerpVectors(savedCamera.current.position, smoothCamPos.current, ease)
      } else {
        camera.position.copy(smoothCamPos.current)
      }

      camera.lookAt(smoothLookAt.current)

      if (camera instanceof THREE.OrthographicCamera) {
        const targetZoom = transitionT.current < 1
          ? THREE.MathUtils.lerp(savedCamera.current?.zoom ?? camera.zoom, POV_ZOOM, ease)
          : POV_ZOOM
        camera.zoom = THREE.MathUtils.lerp(camera.zoom, targetZoom, Math.min(1, delta * 4))
        camera.updateProjectionMatrix()
      }

    } else if (wasActive.current) {
      wasActive.current = false

      if (savedCamera.current && camera instanceof THREE.OrthographicCamera) {
        exitingRef.current = true
        exitT.current = 0
        exitFrom.current = { position: camera.position.clone(), zoom: camera.zoom }
        exitTo.current = { position: savedCamera.current.position.clone(), zoom: savedCamera.current.zoom }
        useGameStore.setState({ harvesterPovTransitioning: true })
      }
      savedCamera.current = null
    }
  })

  return null
}
