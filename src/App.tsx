import { useEffect } from 'react'
import { GameCanvas } from './components/game/GameCanvas'
import { TopBar } from './components/ui/TopBar'
import { BuildMenu } from './components/ui/BuildMenu'
import { TurretPanel } from './components/ui/TurretPanel'
import { GeneratorPanel } from './components/ui/GeneratorPanel'
import { BasePanel } from './components/ui/BasePanel'
import { SettingsPanel } from './components/ui/SettingsPanel'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { MainMenu } from './components/ui/MainMenu'
import { GameOverOverlay } from './components/ui/GameOverOverlay'
import { CustomSetupPage } from './components/ui/CustomSetupPage'
import { MusicPlayer } from './components/ui/MusicPlayer'
import { HarvesterPanel } from './components/ui/HarvesterPanel'
import { useGameStore } from './stores/useGameStore'
import { useCustomConfigStore } from './stores/useCustomConfigStore'
import { useTerrainStore } from './stores/useTerrainStore'

function App() {
  const gameState = useGameStore((s) => s.gameState)
  const harvesterPovMode = useGameStore((s) => s.harvesterPovMode)
  const loadFromStorage = useCustomConfigStore((s) => s.loadFromStorage)
  const loadTerrainConfig = useTerrainStore((s) => s.loadFromStorage)

  useEffect(() => {
    loadFromStorage()
    loadTerrainConfig()
  }, [loadFromStorage, loadTerrainConfig])

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
      <LoadingScreen />
      {gameState === 'playing' && !harvesterPovMode && (
        <>
          <TopBar />
          <BuildMenu />
        </>
      )}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <GameCanvas />
        {gameState === 'menu' && <MainMenu />}
        {gameState === 'custom_setup' && <CustomSetupPage />}
        {gameState === 'gameover' && <GameOverOverlay />}
        {gameState === 'playing' && !harvesterPovMode && (
          <>
            <TurretPanel />
            <GeneratorPanel />
            <BasePanel />
          </>
        )}
        {gameState === 'playing' && <HarvesterPanel />}
        <SettingsPanel />

        <div style={{ display: harvesterPovMode ? 'none' : undefined }}>
          <MusicPlayer />
        </div>
      </div>
    </div>
  )
}

export default App
