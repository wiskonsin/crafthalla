import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBuildingsStore } from '../../stores/useBuildingsStore'

const MAX_BUILDINGS = 32
const CLOUD_LAYERS = [
  { y: 8, count: 4, scale: 30, speed: 0.25, opacity: 0.18 },
  { y: 11, count: 3, scale: 38, speed: 0.18, opacity: 0.14 },
  { y: 14, count: 2, scale: 45, speed: 0.12, opacity: 0.10 },
]

const cloudVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const cloudFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uBuildingPositions[${MAX_BUILDINGS}];
  uniform int uBuildingCount;
  uniform float uSeed;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  // Simplex-like noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float val = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 4; i++) {
      val += amp * snoise(p * freq);
      amp *= 0.5;
      freq *= 2.1;
    }
    return val;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float radial = 1.0 - smoothstep(0.3, 0.95, length(uv));

    vec2 drift = vec2(uTime * 0.08, uTime * 0.03);
    vec2 noiseCoord = vWorldPos.xz * 0.04 + drift + uSeed;
    float warp = snoise(noiseCoord * 0.5 + uTime * 0.06) * 0.3;
    noiseCoord += vec2(warp, -warp);
    float noise1 = fbm(noiseCoord);
    float noise2 = fbm(noiseCoord * 1.8 + vec2(3.7, 1.2) + uTime * 0.04);
    float cloud = smoothstep(-0.1, 0.5, noise1 * 0.6 + noise2 * 0.4) * radial;

    // Building dispersion
    float buildingMask = 1.0;
    for (int i = 0; i < ${MAX_BUILDINGS}; i++) {
      if (i >= uBuildingCount) break;
      vec2 bPos = uBuildingPositions[i].xz;
      float dist = length(vWorldPos.xz - bPos);
      float radius = 4.0 + uBuildingPositions[i].y * 0.5;
      float disperse = smoothstep(radius * 0.3, radius, dist);
      buildingMask *= disperse;
    }

    float alpha = cloud * uOpacity * buildingMask;
    if (alpha < 0.005) discard;

    vec3 color = mix(vec3(0.85, 0.88, 0.95), vec3(1.0), noise2 * 0.5 + 0.5);
    gl_FragColor = vec4(color, alpha);
  }
`

function CloudPlane({
  y,
  scale,
  speed,
  opacity,
  seed,
  offsetX,
  offsetZ,
}: {
  y: number
  scale: number
  speed: number
  opacity: number
  seed: number
  offsetX: number
  offsetZ: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uBuildingPositions: { value: new Array(MAX_BUILDINGS).fill(new THREE.Vector3()) },
      uBuildingCount: { value: 0 },
      uSeed: { value: seed },
    }),
    [opacity, seed]
  )

  useFrame(({ clock }) => {
    if (!matRef.current || !meshRef.current) return

    matRef.current.uniforms.uTime.value = clock.elapsedTime * speed

    const buildings = useBuildingsStore.getState().buildings
    const positions = matRef.current.uniforms.uBuildingPositions.value as THREE.Vector3[]
    const count = Math.min(buildings.length + 1, MAX_BUILDINGS)

    positions[0] = new THREE.Vector3(0, 3, 0)
    for (let i = 0; i < Math.min(buildings.length, MAX_BUILDINGS - 1); i++) {
      const b = buildings[i]
      const h = b.type === 'generator' ? 1.5 : b.type === 'subBase' ? 2.4 : b.type === 'wall' ? 1.4 : 2
      positions[i + 1] = new THREE.Vector3(b.position.x, h, b.position.z)
    }
    matRef.current.uniforms.uBuildingCount.value = count

    const t = clock.elapsedTime
    meshRef.current.position.x = offsetX + Math.sin(t * speed * 0.5) * 4 + t * speed * 0.3
    meshRef.current.position.z = offsetZ + t * speed * 1.2 + Math.cos(t * speed * 0.4) * 3
    if (meshRef.current.position.z > 60) meshRef.current.position.z -= 120
    if (meshRef.current.position.x > 60) meshRef.current.position.x -= 120
  })

  return (
    <mesh ref={meshRef} position={[offsetX, y, offsetZ]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[scale, scale, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={cloudVertexShader}
        fragmentShader={cloudFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export function CloudSystem() {
  const clouds = useMemo(() => {
    const result: {
      y: number
      scale: number
      speed: number
      opacity: number
      seed: number
      offsetX: number
      offsetZ: number
      key: string
    }[] = []

    let idx = 0
    for (const layer of CLOUD_LAYERS) {
      for (let i = 0; i < layer.count; i++) {
        const angle = (i / layer.count) * Math.PI * 2 + idx * 0.7
        const dist = 10 + (idx % 3) * 15
        result.push({
          ...layer,
          seed: idx * 17.3,
          offsetX: Math.cos(angle) * dist,
          offsetZ: Math.sin(angle) * dist - 30,
          key: `cloud-${idx}`,
        })
        idx++
      }
    }
    return result
  }, [])

  return (
    <group>
      {clouds.map(({ key, ...props }) => (
        <CloudPlane key={key} {...props} />
      ))}
    </group>
  )
}
