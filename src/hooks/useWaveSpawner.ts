import { useEffect, useRef } from 'react'
import { useGameStore } from '../stores/useGameStore'
import { useUnitsStore } from '../stores/useUnitsStore'
import { useBuildingsStore } from '../stores/useBuildingsStore'
import { seededRandom } from '../lib/random'
import { WAVE_CONFIG, ENEMY_CONFIG } from '../config/constants'

function spawnWave(waveNumber: number) {
  const count = waveNumber
  const hp = ENEMY_CONFIG.baseHp + (waveNumber - 1) * ENEMY_CONFIG.hpPerWave

  for (let i = 0; i < count; i++) {
    const angle = seededRandom() * Math.PI * 2
    const r =
      WAVE_CONFIG.spawnRadiusMin +
      seededRandom() * (WAVE_CONFIG.spawnRadiusMax - WAVE_CONFIG.spawnRadiusMin)
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    useUnitsStore.getState().addEnemy({ x, y: 0.6, z }, hp)
  }
}

export function useWaveSpawner() {
  const lastSpawnedWave = useRef(0)
  const waveClearedTime = useRef<number | null>(null)
  const firstTurretTriggered = useRef(false)

  useEffect(() => {
    lastSpawnedWave.current = 0
    waveClearedTime.current = null
    firstTurretTriggered.current = false

    const interval = setInterval(() => {
      const { gameState, waveNumber } = useGameStore.getState()
      if (gameState !== 'playing') return

      const enemies = useUnitsStore.getState().enemies
      const buildings = useBuildingsStore.getState().buildings
      const hasTurret = buildings.some(
        (b) => b.type === 'turret' || b.type === 'turret_aa'
      )

      if (waveNumber === 0 && !firstTurretTriggered.current) {
        if (hasTurret) {
          firstTurretTriggered.current = true
          useGameStore.setState({ waveNumber: 1, timeToNextWave: -2 })
        } else {
          useGameStore.setState({ timeToNextWave: -1 })
        }
        return
      }

      if (waveNumber > lastSpawnedWave.current) {
        spawnWave(waveNumber)
        lastSpawnedWave.current = waveNumber
        waveClearedTime.current = null
        useGameStore.setState({ timeToNextWave: -2 })
        return
      }

      if (enemies.length === 0 && waveNumber > 0 && waveNumber === lastSpawnedWave.current) {
        if (waveClearedTime.current === null) {
          waveClearedTime.current = performance.now()
        }
        const elapsed = (performance.now() - waveClearedTime.current) / 1000
        const remaining = Math.max(0, WAVE_CONFIG.countdownSeconds - elapsed)
        useGameStore.setState({ timeToNextWave: Math.ceil(remaining) })

        if (remaining <= 0) {
          useGameStore.setState({ waveNumber: waveNumber + 1 })
        }
      } else if (enemies.length > 0) {
        useGameStore.setState({ timeToNextWave: -2 })
      }
    }, 200)

    return () => clearInterval(interval)
  }, [])
}
