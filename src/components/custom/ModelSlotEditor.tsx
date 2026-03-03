import { useState, useEffect } from 'react'
import { useCustomConfigStore } from '../../stores/useCustomConfigStore'
import { CustomSetupPreview } from './CustomSetupPreview'
import { EnemySetupPreview } from './EnemySetupPreview'
import { DragDropZone } from './DragDropZone'
import { Vec3Sliders } from './Vec3Sliders'
import { CUSTOM_MODEL_LABELS, TURRET_TYPES, ENEMY_TYPE } from '../../types/customModels'
import type { CustomModelType } from '../../types/customModels'

const TRIPO_URL = 'https://studio.tripo3d.ai/?via=techhalla&invite_code=QAO5TH&utm_source=X&utm_medium=kol&utm_campaign=kol_techhalla&category=featured&model_type=all&recommended=recommended&use_case=all'

function TripoButton() {
  return (
    <a
      href={TRIPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 18px',
        background: 'linear-gradient(135deg, rgba(0,180,255,0.12) 0%, rgba(0,100,200,0.18) 100%)',
        border: '1px solid rgba(0,180,255,0.3)',
        borderRadius: 6,
        color: '#00e5ff',
        fontFamily: 'Orbitron, sans-serif',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1,
        textDecoration: 'none',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 0.25s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,180,255,0.22) 0%, rgba(0,100,200,0.3) 100%)'
        e.currentTarget.style.borderColor = '#00e5ff'
        e.currentTarget.style.boxShadow = '0 0 16px rgba(0,229,255,0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,180,255,0.12) 0%, rgba(0,100,200,0.18) 100%)'
        e.currentTarget.style.borderColor = 'rgba(0,180,255,0.3)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      Create yours on Tripo AI
      <span style={{ fontSize: 13 }}>→</span>
    </a>
  )
}

export function ModelSlotEditor({ type }: { type: CustomModelType }) {
  const config = useCustomConfigStore((s) => s.config[type])
  const setConfig = useCustomConfigStore((s) => s.setConfig)
  const setFbx = useCustomConfigStore((s) => s.setFbx)
  const setFbxFolder = useCustomConfigStore((s) => s.setFbxFolder)
  const clearFbx = useCustomConfigStore((s) => s.clearFbx)
  const getBlobUrl = useCustomConfigStore((s) => s.getBlobUrl)
  const [glbUrl, setGlbUrl] = useState<string | null>(null)
  const [uniformScale, setUniformScale] = useState(true)

  useEffect(() => {
    let url: string | null = null
    getBlobUrl(type).then((u) => {
      url = u
      setGlbUrl(u)
    })
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [type, config.fbxBlobId, getBlobUrl])

  const handleModelDrop = (files: File[]) => {
    const model = files.find((f) => f.name.toLowerCase().endsWith('.glb'))
    if (!model) return
    if (files.length > 1) {
      setFbxFolder(type, files)
    } else {
      setFbx(type, model)
    }
  }

  const isTurret = TURRET_TYPES.includes(type)

  if (type === ENEMY_TYPE) {
    return (
      <div
        style={{
          padding: 20,
          background: 'rgba(10, 20, 40, 0.85)',
          border: '1px solid rgba(0,180,255,0.25)',
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <span style={{
            fontFamily: 'Orbitron',
            fontSize: 14,
            fontWeight: 600,
            color: '#00e5ff',
            letterSpacing: '0.05em',
          }}>
            {CUSTOM_MODEL_LABELS[type]}
          </span>
          <TripoButton />
        </div>

        <DragDropZone
          id="model-enemy"
          accept=".glb"
          label="GLB (rig + animación)"
          hint="Arrastra o haz clic"
          onDrop={handleModelDrop}
          hasFile={!!config.fbxBlobId}
          fileLabel={config.fbxBlobId ? 'Modelo cargado' : undefined}
          onClear={config.fbxBlobId ? () => clearFbx(type) : undefined}
        />

        {config.fbxBlobId && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
              <Vec3Sliders
                label="Scale"
                value={config.scale}
                onChange={(scale) => setConfig(type, { scale })}
                min={0.01}
                max={5}
                step={0.01}
                allowUniform
                uniformScale={uniformScale}
                onUniformScaleChange={setUniformScale}
              />
              <Vec3Sliders
                label="Rotation (°)"
                value={(config.rotation ?? [0, 0, 0]).map((r) => (r * 180) / Math.PI) as [number, number, number]}
                onChange={(deg) =>
                  setConfig(type, {
                    rotation: deg.map((d) => (d * Math.PI) / 180) as [number, number, number],
                  })
                }
                min={-180}
                max={180}
                step={5}
                format={(v) => Math.round(v).toString()}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ color: '#aaa', fontSize: 11, fontFamily: 'Orbitron, sans-serif', display: 'block', marginBottom: 4 }}>
                Height (Y): {config.position[1].toFixed(2)}
              </label>
              <input
                type="range"
                min={-2}
                max={4}
                step={0.05}
                value={config.position[1]}
                onChange={(e) => {
                  const y = parseFloat(e.target.value)
                  setConfig(type, { position: [config.position[0], y, config.position[2]] })
                }}
                style={{ width: '100%', maxWidth: 300 }}
              />
            </div>
          </>
        )}

        <div style={{ marginTop: 16 }}>
          <EnemySetupPreview url={glbUrl} config={config} />
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: 20,
        background: 'rgba(10, 20, 40, 0.85)',
        border: '1px solid rgba(0,180,255,0.25)',
        borderRadius: 8,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <span style={{
          fontFamily: 'Orbitron',
          fontSize: 14,
          fontWeight: 600,
          color: '#00e5ff',
          letterSpacing: '0.05em',
        }}>
          {CUSTOM_MODEL_LABELS[type]}
        </span>
        <TripoButton />
      </div>

      <DragDropZone
        id={`model-${type}`}
        accept=".glb"
        label="GLB"
        hint="Arrastra o haz clic"
        onDrop={handleModelDrop}
        hasFile={!!config.fbxBlobId}
        fileLabel={config.fbxBlobId ? 'Modelo cargado' : undefined}
        onClear={config.fbxBlobId ? () => clearFbx(type) : undefined}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <Vec3Sliders
            label="Scale"
            value={config.scale}
            onChange={(scale) => setConfig(type, { scale })}
            min={0.1}
            max={3}
            step={0.05}
            allowUniform
            uniformScale={uniformScale}
            onUniformScaleChange={setUniformScale}
          />
          <Vec3Sliders
            label="Rotation (°)"
            value={(config.rotation ?? [0, 0, 0]).map((r) => (r * 180) / Math.PI) as [number, number, number]}
            onChange={(deg) =>
              setConfig(type, {
                rotation: deg.map((d) => (d * Math.PI) / 180) as [number, number, number],
              })
            }
            min={-180}
            max={180}
            step={5}
            format={(v) => Math.round(v).toString()}
          />
        </div>
        <div>
          <Vec3Sliders
            label="Position"
            value={config.position}
            onChange={(position) => setConfig(type, { position })}
            min={-3}
            max={3}
            step={0.05}
          />
          {isTurret && config.muzzleOffset && (
            <Vec3Sliders
              label="Muzzle offset"
              value={config.muzzleOffset}
              onChange={(muzzleOffset) => setConfig(type, { muzzleOffset })}
              min={-2}
              max={2}
              step={0.05}
            />
          )}
        </div>
      </div>
      <CustomSetupPreview type={type} config={config} glbUrl={glbUrl} />
    </div>
  )
}
