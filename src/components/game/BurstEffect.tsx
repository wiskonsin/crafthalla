import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBurstEffectsStore } from '../../stores/useBurstEffectsStore'

const DURATION_MS = 200

function SingleBurst({
  from,
  to,
  startTime,
}: {
  from: [number, number, number]
  to: [number, number, number]
  startTime: number
}) {
  const tracerObj = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(6)
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#ffcc44'),
      transparent: true,
      opacity: 1,
      linewidth: 2,
    })
    return new THREE.Line(geo, mat)
  }, [])

  const impactGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const count = 8
    const pos = new Float32Array(count * 3)
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return { geo, count }
  }, [])

  const sparksVel = useRef(
    Array.from({ length: impactGeo.count }, () => ({
      x: (Math.random() - 0.5) * 6,
      y: Math.random() * 3 + 1,
      z: (Math.random() - 0.5) * 6,
    }))
  )

  const impactObj = useMemo(() => {
    const mat = new THREE.PointsMaterial({
      size: 0.15,
      color: new THREE.Color('#ff8833'),
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
    })
    return new THREE.Points(impactGeo.geo, mat)
  }, [impactGeo.geo])

  const muzzleObj = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.12, 4, 3)
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#ffee88'),
      transparent: true,
      opacity: 1,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(from[0], from[1], from[2])
    return mesh
  }, [from])

  useFrame(() => {
    const elapsed = performance.now() - startTime
    const progress = Math.min(elapsed / DURATION_MS, 1)

    const tracerPos = tracerObj.geometry.attributes.position.array as Float32Array
    const headFrac = Math.min(progress * 3, 1)
    const tailFrac = Math.max(0, headFrac - 0.3)

    tracerPos[0] = from[0] + (to[0] - from[0]) * tailFrac
    tracerPos[1] = from[1] + (to[1] - from[1]) * tailFrac
    tracerPos[2] = from[2] + (to[2] - from[2]) * tailFrac
    tracerPos[3] = from[0] + (to[0] - from[0]) * headFrac
    tracerPos[4] = from[1] + (to[1] - from[1]) * headFrac
    tracerPos[5] = from[2] + (to[2] - from[2]) * headFrac
    tracerObj.geometry.attributes.position.needsUpdate = true

    const tracerOpacity = headFrac >= 1 ? Math.max(0, 1 - (progress - 0.33) * 3) : 1
    ;(tracerObj.material as THREE.LineBasicMaterial).opacity = tracerOpacity
    tracerObj.visible = tracerOpacity > 0

    const muzzleMat = muzzleObj.material as THREE.MeshBasicMaterial
    muzzleMat.opacity = Math.max(0, 1 - progress * 4)
    muzzleObj.visible = muzzleMat.opacity > 0
    muzzleObj.scale.setScalar(1 + progress * 2)

    if (headFrac >= 1) {
      const sparkProgress = (progress - 0.33) / 0.67
      const sparkPos = impactGeo.geo.attributes.position.array as Float32Array
      for (let i = 0; i < impactGeo.count; i++) {
        const v = sparksVel.current[i]
        const t = sparkProgress * 0.08
        sparkPos[i * 3] = to[0] + v.x * t
        sparkPos[i * 3 + 1] = to[1] + v.y * t - 4 * t * t
        sparkPos[i * 3 + 2] = to[2] + v.z * t
      }
      impactGeo.geo.attributes.position.needsUpdate = true
      ;(impactObj.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - sparkProgress)
      impactObj.visible = true
    } else {
      impactObj.visible = false
    }
  })

  return (
    <group>
      <primitive object={tracerObj} />
      <primitive object={impactObj} />
      <primitive object={muzzleObj} />
    </group>
  )
}

export function BurstEffects() {
  const effects = useBurstEffectsStore((s) => s.effects)

  useFrame(() => {
    const now = performance.now()
    const expired = effects.filter((e) => now - e.startTime > DURATION_MS)
    if (expired.length > 0) {
      useBurstEffectsStore.setState((s) => ({
        effects: s.effects.filter((e) => now - e.startTime <= DURATION_MS),
      }))
    }
  })

  return (
    <group>
      {effects.map((e) => (
        <SingleBurst
          key={e.id}
          from={[e.from.x, e.from.y, e.from.z]}
          to={[e.to.x, e.to.y, e.to.z]}
          startTime={e.startTime}
        />
      ))}
    </group>
  )
}
