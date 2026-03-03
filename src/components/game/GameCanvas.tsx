import { useCallback, useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { ProceduralTerrain } from './ProceduralTerrain'
import { CentralBuilding } from './CentralBuilding'
import { BuildingsManager } from './BuildingsManager'
import { EnemyManager } from './EnemyManager'
import { TurretShootingSystem } from './TurretShootingSystem'
import { EngineerRepairSystem } from './EngineerRepairSystem'
import { EngineerManager } from './EngineerManager'
import { ExplosionParticles } from './ExplosionParticles'
import { CraterSmoke } from './CraterSmoke'
import { DissolveParticles } from './DissolveParticles'
import { CoverageOverlay } from './CoverageOverlay'
import { BurstEffects } from './BurstEffect'
import { MissileSystem } from './MissileSystem'
import { ElectricArcEffect } from './ElectricArcEffect'
import { BaseHaloEffect } from './BaseHaloEffect'
import { FogOverlay } from './FogOverlay'
import { PlacementPreview } from './PlacementPreview'
import { GrassField } from './GrassField'
import { useTerrainStore } from '../../stores/useTerrainStore'
import { ConstructionEffects } from './ConstructionEffect'
import { IsometricCamera } from './IsometricCamera'
import { CameraControls } from './CameraControls'
import { FloatingTexts } from './FloatingTexts'
import { CloudSystem } from './CloudSystem'
import { MineralRocksManager } from './MineralRocksManager'
import { HarvesterManager } from './HarvesterManager'
import { HarvesterAISystem } from './HarvesterAISystem'
import { ShaderWarmup } from './ShaderWarmup'
import { TerrainDecals } from './TerrainDecals'
import { isMountainAt } from '../../systems/terrainHeightmap'
import { HarvesterPovCamera } from './HarvesterPovCamera'
import { useWaveSpawner } from '../../hooks/useWaveSpawner'
import { useGameStore } from '../../stores/useGameStore'
import { useBuildingsStore } from '../../stores/useBuildingsStore'
import { useEngineersStore } from '../../stores/useEngineersStore'
import { useResourcesStore } from '../../stores/useResourcesStore'
import { useMineralRocksStore } from '../../stores/useMineralRocksStore'
import { useHarvestersStore } from '../../stores/useHarvestersStore'
import { useFloatingTextsStore } from '../../stores/useFloatingTextsStore'
import { snapToGrid, BUILDING_COSTS, CONSTRUCTION_DURATION } from '../../config/constants'
import { useResourceProduction } from '../../hooks/useResourceProduction'
import { useTurretEnergyConsumption } from '../../hooks/useTurretEnergyConsumption'
import { useWaveTimer } from '../../hooks/useWaveTimer'

function PlacementPreviewWrapper({ position, onPlace }: { position: { x: number; z: number } | null; onPlace: (x: number, z: number) => void }) {
  const selectedBuilding = useGameStore((s) => s.selectedBuilding)
  const povMode = useGameStore((s) => s.harvesterPovMode)
  if (!selectedBuilding || povMode) return null
  return <PlacementPreview type={selectedBuilding} position={position} onPlace={onPlace} />
}

function ConditionalGrass() {
  const grassEnabled = useTerrainStore((s) => s.grassEnabled)
  if (!grassEnabled) return null
  return <GrassField />
}

export function GameCanvas() {
  useResourceProduction()
  useTurretEnergyConsumption()
  useWaveTimer()
  useWaveSpawner()

  const gameState = useGameStore((s) => s.gameState)
  const rocksGenerated = useRef(false)
  const firstHarvesterSpawned = useRef(false)

  useEffect(() => {
    if (gameState === 'playing' && !rocksGenerated.current) {
      rocksGenerated.current = true
      useMineralRocksStore.getState().generateRocks()
    }
    if (gameState === 'menu') {
      rocksGenerated.current = false
      firstHarvesterSpawned.current = false
    }
  }, [gameState])

  useEffect(() => {
    if (gameState !== 'playing' || firstHarvesterSpawned.current) return
    const timer = setTimeout(() => {
      if (!firstHarvesterSpawned.current) {
        firstHarvesterSpawned.current = true
        useHarvestersStore.getState().addHarvester('main', { x: 2, y: 0, z: 2 })
      }
    }, (CONSTRUCTION_DURATION + 0.5) * 1000)
    return () => clearTimeout(timer)
  }, [gameState])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (useGameStore.getState().selectedBuilding === 'wall') {
        e.preventDefault()
        useGameStore.getState().rotateWallPlacement()
      }
    }
    document.addEventListener('contextmenu', handler)
    return () => document.removeEventListener('contextmenu', handler)
  }, [])

  const [previewPos, setPreviewPos] = useState<{ x: number; z: number } | null>(null)

  const handleTerrainMove = useCallback((x: number, z: number) => {
    setPreviewPos({ x, z })
  }, [])

  const handleTerrainClick = useCallback(
    (x: number, z: number) => {
      if (useGameStore.getState().harvesterPovMode) return
      const selectedBuilding = useGameStore.getState().selectedBuilding
      if (!selectedBuilding) return
      const snappedX = snapToGrid(x)
      const snappedZ = snapToGrid(z)

      if (selectedBuilding === 'engineer') {
        const cost = BUILDING_COSTS.engineer
        const canAfford = useResourcesStore.getState().spendMetal(cost)
        if (!canAfford) return
        if (!useBuildingsStore.getState().canPlaceEngineerAt(snappedX, snappedZ)) {
          useResourcesStore.getState().addMetal(cost)
          return
        }
        useEngineersStore.getState().addEngineer({ x: snappedX, y: 0.5, z: snappedZ })
        useFloatingTextsStore.getState().addText(`-${cost}`, '#ff4444', { x: snappedX, y: 0.5, z: snappedZ })
        useGameStore.getState().setSelectedBuilding(null)
        return
      }

      if (isMountainAt(snappedX, snappedZ)) return

      const base = useBuildingsStore.getState().getBaseAt(snappedX, snappedZ)
      const baseId = base?.id
      const success = useBuildingsStore.getState().addBuilding(selectedBuilding, { x: snappedX, y: 0, z: snappedZ }, baseId)
      if (success && selectedBuilding !== 'wall') useGameStore.getState().setSelectedBuilding(null)
    },
    []
  )

  const handlePointerLeave = useCallback(() => setPreviewPos(null), [])
  const showCoverageOverlay = useGameStore((s) => s.showCoverageOverlay)

  const onCanvasCreated = useCallback(
    ({ gl, scene, camera }: { gl: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.Camera }) => {
      gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault())
      gl.compile(scene, camera)
    },
    []
  )

  return (
    <Canvas
      orthographic
      camera={{
        position: [46, 50, 46],
        zoom: 45,
        near: 0.1,
        far: 1000,
      }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      shadows={{ type: THREE.PCFShadowMap }}
      onCreated={onCanvasCreated}
      style={{ width: '100%', height: '100%', background: '#1a1a2e' }}
    >
      <IsometricCamera />
      <CameraControls />
      <HarvesterPovCamera />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={1}
        shadow-camera-far={80}
      />

      <ShaderWarmup />
      <FloatingTexts />
      <CloudSystem />
      <ConditionalGrass />
      <MissileSystem />
      <ConstructionEffects />
      <MineralRocksManager />
      <HarvesterManager />
      <HarvesterAISystem />
      <Physics gravity={[0, 0, 0]}>
        <ProceduralTerrain
          onTerrainClick={handleTerrainClick}
          onPointerMove={handleTerrainMove}
          onPointerLeave={handlePointerLeave}
        />
        <TerrainDecals />
        <CentralBuilding />
        <BuildingsManager />
        <EnemyManager />
        <TurretShootingSystem />
        <EngineerRepairSystem />
        <EngineerManager />
        <ExplosionParticles />
        <CraterSmoke />
        <DissolveParticles />
        <BurstEffects />
        <ElectricArcEffect />
        <BaseHaloEffect />
        <FogOverlay />
        {showCoverageOverlay && <CoverageOverlay />}
        <PlacementPreviewWrapper position={previewPos} onPlace={handleTerrainClick} />
      </Physics>
    </Canvas>
  )
}
