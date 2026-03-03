import { create } from 'zustand'
import type { BuildOption } from '../types'
import { useResourcesStore } from './useResourcesStore'
import { useBuildingsStore } from './useBuildingsStore'
import { useUnitsStore } from './useUnitsStore'
import { useExplosionsStore } from './useExplosionsStore'
import { useProjectilesStore } from './useProjectilesStore'
import { useBurstEffectsStore } from './useBurstEffectsStore'
import { useMissilesStore } from './useMissilesStore'
import { useEngineersStore } from './useEngineersStore'
import { useTurretTargetStore } from './useTurretTargetStore'
import { useMineralRocksStore } from './useMineralRocksStore'
import { useHarvestersStore } from './useHarvestersStore'
import { useFloatingTextsStore } from './useFloatingTextsStore'

type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'custom_setup'

interface GameStoreState {
  useCustomModels: boolean
  waveNumber: number
  kills: number
  gameState: GameState
  timeToNextWave: number
  selectedBuilding: BuildOption | null
  selectedTurretId: string | null
  selectedGeneratorId: string | null
  selectedBaseId: string | null
  selectedHarvesterId: string | null
  harvesterPovMode: boolean
  harvesterPovTransitioning: boolean
  showCoverageOverlay: boolean
  wallRotation: number
  setWaveNumber: (n: number) => void
  addKill: () => void
  setGameState: (s: GameState) => void
  setTimeToNextWave: (t: number) => void
  setSelectedBuilding: (b: BuildOption | null) => void
  setSelectedTurret: (id: string | null) => void
  setSelectedGenerator: (id: string | null) => void
  setSelectedBase: (id: string | null) => void
  setSelectedHarvester: (id: string | null) => void
  toggleHarvesterPov: () => void
  toggleCoverageOverlay: () => void
  rotateWallPlacement: () => void
  forceNextWave: () => void
  reset: () => void
  startGame: () => void
  resetGame: () => void
  openCustomSetup: () => void
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  waveNumber: 0,
  kills: 0,
  gameState: 'menu',
  useCustomModels: false,
  timeToNextWave: -1,
  selectedBuilding: null,
  selectedTurretId: null,
  selectedGeneratorId: null,
  selectedBaseId: null,
  selectedHarvesterId: null,
  harvesterPovMode: false,
  harvesterPovTransitioning: false,
  showCoverageOverlay: false,
  wallRotation: 0,

  setWaveNumber: (n) => set({ waveNumber: n }),
  addKill: () => set((s) => ({ kills: s.kills + 1 })),
  setGameState: (s) => set({ gameState: s }),
  setTimeToNextWave: (t) => set({ timeToNextWave: t }),
  setSelectedBuilding: (b) => set({ selectedBuilding: b, selectedTurretId: null, selectedGeneratorId: null, selectedBaseId: null, selectedHarvesterId: null, harvesterPovMode: false }),
  setSelectedTurret: (id) => set({ selectedTurretId: id, selectedBuilding: null, selectedGeneratorId: null, selectedBaseId: null, selectedHarvesterId: null, harvesterPovMode: false }),
  setSelectedGenerator: (id) => set({ selectedGeneratorId: id, selectedTurretId: null, selectedBuilding: null, selectedBaseId: null, selectedHarvesterId: null, harvesterPovMode: false }),
  setSelectedBase: (id) => set({ selectedBaseId: id, selectedTurretId: null, selectedBuilding: null, selectedGeneratorId: null, selectedHarvesterId: null, harvesterPovMode: false }),
  setSelectedHarvester: (id) => set({ selectedHarvesterId: id, selectedTurretId: null, selectedBuilding: null, selectedGeneratorId: null, selectedBaseId: null, harvesterPovMode: false }),
  toggleHarvesterPov: () => set((s) => ({ harvesterPovMode: !s.harvesterPovMode })),
  toggleCoverageOverlay: () => set((s) => ({ showCoverageOverlay: !s.showCoverageOverlay })),
  rotateWallPlacement: () => set((s) => ({ wallRotation: (s.wallRotation + Math.PI / 2) % (Math.PI * 2) })),

  forceNextWave: () => {
    const state = useGameStore.getState()
    useGameStore.setState({
      waveNumber: state.waveNumber + 1,
      timeToNextWave: -2,
    })
  },

  reset: () =>
    set({
      waveNumber: 0,
      kills: 0,
      gameState: 'playing',
      timeToNextWave: -1,
      selectedBuilding: null,
      selectedTurretId: null,
      selectedGeneratorId: null,
      selectedBaseId: null,
      selectedHarvesterId: null,
      harvesterPovMode: false,
      harvesterPovTransitioning: false,
      showCoverageOverlay: false,
      wallRotation: 0,
    }),

  startGame: () => set({ gameState: 'playing' }),

  openCustomSetup: () => set({ gameState: 'custom_setup' }),

  resetGame: () => {
    useResourcesStore.getState().reset()
    useBuildingsStore.getState().reset()
    useUnitsStore.getState().reset()
    useExplosionsStore.setState({ explosions: [] })
    useProjectilesStore.setState({ projectiles: [] })
    useBurstEffectsStore.setState({ effects: [] })
    useMissilesStore.setState({ missiles: [] })
    useEngineersStore.getState().reset()
    useTurretTargetStore.setState({ targets: {} })
    useMineralRocksStore.getState().reset()
    useHarvestersStore.getState().reset()
    useFloatingTextsStore.getState().reset()
    get().reset()
    set({ gameState: 'playing', useCustomModels: get().useCustomModels })
    useMineralRocksStore.getState().generateRocks()
    setTimeout(() => {
      useHarvestersStore.getState().addHarvester('main', { x: 2, y: 0, z: 2 })
    }, 2000)
  },
}))
