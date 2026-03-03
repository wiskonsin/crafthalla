import { useEffect, useState } from 'react'
import { useGameStore } from '../../stores/useGameStore'
import { useCustomConfigStore } from '../../stores/useCustomConfigStore'
import { useTerrainStore } from '../../stores/useTerrainStore'
import { ModelSlotEditor } from '../custom/ModelSlotEditor'
import { TerrainEditor } from '../custom/TerrainEditor'
import { CUSTOM_MODEL_LABELS } from '../../types/customModels'
import type { CustomModelType } from '../../types/customModels'

type TabType = CustomModelType | 'terrain'

const MODEL_TYPES: CustomModelType[] = [
  'central',
  'generator',
  'turret',
  'turret_aa',
  'subBase',
  'engineer',
  'enemy',
  'harvester',
]

export function CustomSetupPage() {
  const setGameState = useGameStore((s) => s.setGameState)
  const loadFromStorage = useCustomConfigStore((s) => s.loadFromStorage)
  const saveToStorage = useCustomConfigStore((s) => s.saveToStorage)
  const loadTerrainFromStorage = useTerrainStore((s) => s.loadFromStorage)
  const saveTerrainToStorage = useTerrainStore((s) => s.saveToStorage)
  const [selectedTab, setSelectedTab] = useState<TabType>('terrain')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([loadFromStorage(), loadTerrainFromStorage()]).finally(() => setLoading(false))
  }, [loadFromStorage, loadTerrainFromStorage])

  const handlePlayCustom = async () => {
    await Promise.all([saveToStorage(), saveTerrainToStorage()])
    useGameStore.setState({ useCustomModels: true, gameState: 'playing' })
  }

  if (loading) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#0a0e1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}
      >
        <span style={{ color: '#888' }}>Loading...</span>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #0a0e1a 0%, #1a1a2e 50%, #0d1220 100%)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(0,180,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1
          style={{
            fontFamily: 'Orbitron',
            fontSize: 24,
            fontWeight: 700,
            color: '#00e5ff',
          }}
        >
          Custom Model Setup
        </h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="rts-btn"
            onClick={() => setGameState('menu')}
            style={{ padding: '10px 20px', fontSize: 12 }}
          >
            Back
          </button>
          <button
            className="rts-btn rts-btn-electric"
            onClick={handlePlayCustom}
            style={{ padding: '10px 24px', fontSize: 13, letterSpacing: '0.12em' }}
          >
            Save & Play Custom
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 200,
            padding: 16,
            borderRight: '1px solid rgba(0,180,255,0.2)',
            overflowY: 'auto',
          }}
        >
          <button
            className={`rts-btn ${selectedTab === 'terrain' ? 'selected' : ''}`}
            onClick={() => setSelectedTab('terrain')}
            style={{
              width: '100%',
              marginBottom: 8,
              padding: '10px 14px',
              fontSize: 11,
              textAlign: 'left',
            }}
          >
            Terrain & Rocks
          </button>
          <div style={{ height: 1, background: 'rgba(0,180,255,0.15)', margin: '8px 0' }} />
          {MODEL_TYPES.map((t) => (
            <button
              key={t}
              className={`rts-btn ${selectedTab === t ? 'selected' : ''}`}
              onClick={() => setSelectedTab(t)}
              style={{
                width: '100%',
                marginBottom: 8,
                padding: '10px 14px',
                fontSize: 11,
                textAlign: 'left',
              }}
            >
              {CUSTOM_MODEL_LABELS[t]}
            </button>
          ))}
        </div>

        <div
          style={{
            flex: 1,
            padding: 24,
            overflowY: selectedTab === 'terrain' ? 'hidden' : 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {selectedTab === 'terrain' ? (
            <TerrainEditor />
          ) : (
            <div style={{ flex: 1 }}>
              <ModelSlotEditor type={selectedTab} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
