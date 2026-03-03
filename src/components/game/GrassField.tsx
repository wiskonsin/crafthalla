import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { useHarvestersStore } from '../../stores/useHarvestersStore'
import { useCratersStore, CRATER_LIFETIME } from '../../stores/useCratersStore'
import { VISION_RADIUS } from '../../config/constants'

const HARVESTER_VISION = 8

const BLADE_COUNT = 15000
const FIELD_RADIUS = 55
const BLADE_HEIGHT = 0.38
const BLADE_WIDTH = 0.08
const MAX_SLOTS = 48

const vertexShader = /* glsl */ `
  attribute vec3 offset;
  attribute float angle;
  attribute float bladeScale;

  varying float vHeight;
  varying float vFog;

  uniform float uTime;
  uniform vec4 uBExcl[${MAX_SLOTS}];
  uniform vec4 uBVis[${MAX_SLOTS}];
  uniform int uCount;

  void main() {
    float excl = 1.0;
    float vis = 0.0;

    for (int i = 0; i < ${MAX_SLOTS}; i++) {
      if (i >= uCount) break;
      float dExcl = distance(offset.xz, uBExcl[i].xz);
      excl *= smoothstep(uBExcl[i].w * 0.4, uBExcl[i].w, dExcl);
      float dVis = distance(offset.xz, uBVis[i].xz);
      vis = max(vis, 1.0 - smoothstep(uBVis[i].w * 0.65, uBVis[i].w, dVis));
    }

    vFog = vis;
    vHeight = position.y / ${BLADE_HEIGHT.toFixed(1)};

    float wind = sin(uTime * 1.2 + offset.x * 0.08 + offset.z * 0.06) * 0.3
               + sin(uTime * 2.5 + offset.x * 0.15) * 0.1;
    float bend = vHeight * vHeight * wind;
    float c = cos(angle);
    float s = sin(angle);
    float fs = bladeScale * excl;

    vec3 p = vec3(
      position.x * c - position.z * s,
      position.y * fs,
      position.x * s + position.z * c
    );
    p.x += bend * excl;
    p += offset;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  varying float vHeight;
  varying float vFog;

  void main() {
    vec3 base = vec3(0.12, 0.28, 0.06);
    vec3 tip = vec3(0.35, 0.58, 0.18);
    vec3 color = mix(base, tip, vHeight);
    vec3 fogColor = vec3(0.04, 0.06, 0.1);
    color = mix(fogColor, color, max(vFog, 0.10));
    gl_FragColor = vec4(color, 1.0);
  }
`

export function GrassField() {
  const meshRef = useRef<THREE.Mesh>(null)

  const uniforms = useRef({
    uTime: { value: 0 },
    uBExcl: { value: Array.from({ length: MAX_SLOTS }, () => new THREE.Vector4()) },
    uBVis: { value: Array.from({ length: MAX_SLOTS }, () => new THREE.Vector4()) },
    uCount: { value: 0 },
  })

  const { geo, mat } = useMemo(() => {
    const ibg = new THREE.InstancedBufferGeometry()
    const verts = new Float32Array([
      -BLADE_WIDTH * 0.5, 0, 0,
       BLADE_WIDTH * 0.5, 0, 0,
       0, BLADE_HEIGHT, 0,
    ])
    ibg.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    ibg.setIndex([0, 1, 2])

    const offsets = new Float32Array(BLADE_COUNT * 3)
    const angles = new Float32Array(BLADE_COUNT)
    const scales = new Float32Array(BLADE_COUNT)

    for (let i = 0; i < BLADE_COUNT; i++) {
      const r = Math.sqrt(Math.random()) * FIELD_RADIUS
      const theta = Math.random() * Math.PI * 2
      offsets[i * 3] = Math.cos(theta) * r
      offsets[i * 3 + 1] = 0
      offsets[i * 3 + 2] = Math.sin(theta) * r
      angles[i] = Math.random() * Math.PI
      scales[i] = 0.6 + Math.random() * 0.8
    }

    ibg.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3))
    ibg.setAttribute('angle', new THREE.InstancedBufferAttribute(angles, 1))
    ibg.setAttribute('bladeScale', new THREE.InstancedBufferAttribute(scales, 1))
    ibg.instanceCount = BLADE_COUNT

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: uniforms.current,
      side: THREE.DoubleSide,
      depthWrite: true,
    })

    return { geo: ibg, mat: material }
  }, [])

  useFrame((_, delta) => {
    uniforms.current.uTime.value += delta

    const { buildings } = useBuildingsStore.getState()
    const harvesters = useHarvestersStore.getState().harvesters
    const excl = uniforms.current.uBExcl.value
    const vis = uniforms.current.uBVis.value

    let idx = 0
    excl[idx].set(0, 0, 0, 5.5)
    vis[idx].set(0, 0, 0, VISION_RADIUS.central)
    idx++

    for (const b of buildings) {
      if (idx >= MAX_SLOTS) break
      const er = b.type === 'subBase' ? 4.5 : b.type === 'generator' ? 3.5 : 2.8
      excl[idx].set(b.position.x, 0, b.position.z, er)
      const vr = b.type === 'generator' ? VISION_RADIUS.generator
               : b.type === 'subBase' ? VISION_RADIUS.subBase
               : VISION_RADIUS.turret
      vis[idx].set(b.position.x, 0, b.position.z, vr)
      idx++
    }

    for (const h of harvesters) {
      if (idx >= MAX_SLOTS) break
      excl[idx].set(h.position.x, 0, h.position.z, 0)
      vis[idx].set(h.position.x, 0, h.position.z, HARVESTER_VISION)
      idx++
    }

    const craters = useCratersStore.getState().craters
    const now = Date.now()
    for (const c of craters) {
      if (idx >= MAX_SLOTS) break
      const age = now - c.createdAt
      const lifeT = age / CRATER_LIFETIME
      const strength = Math.max(0, 1 - lifeT * lifeT)
      const r = 2.5 * strength
      if (r > 0.1) {
        excl[idx].set(c.position.x, 0, c.position.z, r)
        vis[idx].set(c.position.x, 0, c.position.z, 0)
        idx++
      }
    }

    uniforms.current.uCount.value = idx
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geo}
      material={mat}
      position={[0, 0.01, 0]}
      frustumCulled={false}
    />
  )
}
