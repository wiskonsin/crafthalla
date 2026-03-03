import { useRef, useState, useEffect, useCallback } from 'react'
import { useTerrainStore } from '../../stores/useTerrainStore'
import { TerrainPreview } from './TerrainPreview'

const TERRAIN_PROMPT = `DIRECTIVE:
Generate a professional, high-resolution 8K texture tile of a natural ground surface featuring a blend of grass and soil. The texture must be perfectly seamless and tillable on both X and Y axes, ensuring no repetition artifacts or visible seams when tiled infinitely.

SUBJECT:
A detailed top-down (orthographic) view of a temperate meadow floor. The surface is an organic mixture of low-growing grass and exposed earth.

PALETTE & TEXTURE:
Grass: The grass consists of various temperate species with a muted, natural green color (Munsell-style "medium green"). Avoid bright emerald or deep forest greens. The texture should show individual blades and small clusters, suggesting a well-used but healthy turf.
Soil: The exposed earth is a rich, balanced medium brown (like damp loam or potting soil). Avoid dark, near-black mud or pale, sandy browns. The soil texture should show small clods, fine particles, and natural undulations.
Blend: The transition between grass and dirt must be natural, soft, and stochastic (randomized), with patches of varying sizes across the tile. No harsh lines or predictable patterns.

LAYOUT:
Homogeneous and balanced distribution. No large rocks, unique branches, footprints, or distinctive features that would create a recognizable pattern when tiled. The surface is generally flat with natural micro-topography.

TECHNICAL SPECS:
Perspective: Perfectly Top-Down, Orthographic (90-degree angle).
Style: Ultra-Photorealistic, Macro Terrain Photography.
Lighting: Flat, diffused global illumination (as on a bright, overcast day). This minimizes harsh shadows and ensures uniform lighting across the tile, crucial for seamless repetition.
Properties: Perfectly Seamless, Infinite Tiling, PBR-Ready (with distinct diffuse, roughness, and displacement map potential).

NEGATIVE PROMPT:
Neon colors, bright green, very dark brown, black soil, pale sand, harsh directional shadows, visible seams, repetitive patterns, large rocks, water puddles, branches, clutter.`

const ROCK_PROMPT = `DIRECTIVE:
Generate a professional, seamless 8K texture tile of a light-colored rock surface embedded with crystalline cyan mineral deposits. The image must be perfectly repeatable on both X and Y axes (seamless tiling) with absolutely no visible seams or repetition artifacts.

SUBJECT:
An orthographic, high-definition top-down view of a light-reflecting geological formation. The base material is a polished, pale off-white limestone or light grey granite with subtle quartz speckles. Interspersed naturally throughout the rock are crystalline veins and small geodesic pockets of a translucent, aquamarine-cyan mineral (resembling clear blue opal or ice).

LAYOUT:
The cyan minerals must form organic, delicate, fractal vein patterns that spread across the light rock surface. The distribution must be balanced and stochastic, ensuring the pattern flows continuously and seamlessly across all tile edges (left-to-right, top-to-bottom) without creating recognizable clusters when tiled.

TECHNICAL SPECS:
Perspective: Perfectly Top-Down, Orthographic (90-degree angle).
Style: Hyper-Realistic, Macro Mineral Photography, Bright and Airy.
Lighting: Diffused, bright studio lighting (high-key), mimicking a clear daylight environment. Soft reflections and subtle translucency effects within the cyan crystals. High micro-contrast on the pale rock texture.
Properties: Seamless, Tiling, PBR-ready, High Luminous Value.

NEGATIVE PROMPT:
Dark colors, black rock, obsidian, harsh shadows, heavy texture, dirt, moss, visible seams, obvious repetition, dull finish.`

const presetThumbs: Record<string, string> = {
  normal: '/tiles/grass.png',
  exoplanet: '/tiles/exo.png',
  rock_default: '/tiles/rock.png',
}

function TileOption({
  label,
  thumb,
  selected,
  onClick,
}: {
  label: string
  thumb: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: selected
          ? 'rgba(0,180,255,0.2)'
          : 'rgba(255,255,255,0.04)',
        border: selected
          ? '2px solid #00b4ff'
          : '2px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: 6,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.2s',
        width: 100,
      }}
    >
      <img
        src={thumb}
        alt={label}
        style={{
          width: 72,
          height: 72,
          borderRadius: 6,
          objectFit: 'cover',
        }}
      />
      <span
        style={{
          color: selected ? '#00e5ff' : '#aaa',
          fontSize: 10,
          fontFamily: 'Orbitron, sans-serif',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </button>
  )
}

function PromptBox({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [text])

  return (
    <div style={{
      background: 'rgba(5,10,20,0.6)',
      border: '1px solid rgba(0,180,255,0.15)',
      borderRadius: 8,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'rgba(0,180,255,0.06)',
        borderBottom: '1px solid rgba(0,180,255,0.1)',
      }}>
        <span style={{
          color: '#00e5ff',
          fontSize: 10,
          fontFamily: 'Orbitron, sans-serif',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          {label}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? 'rgba(0,229,255,0.25)' : 'rgba(255,255,255,0.08)',
            border: copied ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.18)',
            color: copied ? '#00e5ff' : '#bbb',
            padding: '5px 14px',
            borderRadius: 4,
            fontSize: 10,
            cursor: 'pointer',
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 600,
            transition: 'all 0.2s',
            letterSpacing: 0.5,
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div
        className="rts-prompt-scroll"
        style={{
          padding: '10px 14px',
          height: 220,
          overflowY: 'auto',
          fontSize: 10.5,
          lineHeight: 1.6,
          color: 'rgba(180,200,220,0.75)',
          fontFamily: "'Consolas', 'Monaco', monospace",
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          userSelect: 'text',
        }}
      >
        {text}
      </div>
    </div>
  )
}

export function TerrainEditor() {
  const {
    terrainPreset,
    rockPreset,
    grassEnabled,
    customTerrainBlobId,
    customRockBlobId,
    setTerrainPreset,
    setRockPreset,
    setGrassEnabled,
    uploadTerrainTile,
    uploadRockTile,
    clearCustomTerrain,
    clearCustomRock,
    getBlobUrl,
  } = useTerrainStore()

  const terrainInputRef = useRef<HTMLInputElement>(null)
  const rockInputRef = useRef<HTMLInputElement>(null)

  const [customTerrainThumb, setCustomTerrainThumb] = useState<string | null>(null)
  const [customRockThumb, setCustomRockThumb] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (customTerrainBlobId) {
      getBlobUrl(customTerrainBlobId).then((url) => setCustomTerrainThumb(url))
    } else {
      setCustomTerrainThumb(null)
    }
  }, [customTerrainBlobId, getBlobUrl])

  useEffect(() => {
    if (customRockBlobId) {
      getBlobUrl(customRockBlobId).then((url) => setCustomRockThumb(url))
    } else {
      setCustomRockThumb(null)
    }
  }, [customRockBlobId, getBlobUrl])

  const handleTerrainFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadTerrainTile(file)
    } finally {
      setUploading(false)
      if (terrainInputRef.current) terrainInputRef.current.value = ''
    }
  }

  const handleRockFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadRockTile(file)
    } finally {
      setUploading(false)
      if (rockInputRef.current) rockInputRef.current.value = ''
    }
  }

  const sectionStyle: React.CSSProperties = {
    marginBottom: 28,
  }

  const labelStyle: React.CSSProperties = {
    color: '#00e5ff',
    fontSize: 13,
    fontFamily: 'Orbitron, sans-serif',
    fontWeight: 600,
    marginBottom: 10,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  }

  const smallBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#ccc',
    padding: '6px 12px',
    borderRadius: 6,
    fontSize: 10,
    cursor: 'pointer',
    fontFamily: 'Orbitron, sans-serif',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
    <div style={{ display: 'flex', gap: 28 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
      <div style={sectionStyle}>
        <span style={labelStyle}>Ground Tile</span>
        <div style={rowStyle}>
          <TileOption
            label="Normal"
            thumb={presetThumbs.normal}
            selected={terrainPreset === 'normal'}
            onClick={() => setTerrainPreset('normal')}
          />
          <TileOption
            label="Exoplanet"
            thumb={presetThumbs.exoplanet}
            selected={terrainPreset === 'exoplanet'}
            onClick={() => setTerrainPreset('exoplanet')}
          />
          {customTerrainThumb && (
            <TileOption
              label="Custom"
              thumb={customTerrainThumb}
              selected={terrainPreset === 'custom'}
              onClick={() => setTerrainPreset('custom')}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'flex-end' }}>
            <button
              style={smallBtnStyle}
              onClick={() => terrainInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Processing...' : 'Upload Tile'}
            </button>
            {customTerrainBlobId && (
              <button
                style={{ ...smallBtnStyle, color: '#ff6666', borderColor: 'rgba(255,100,100,0.3)' }}
                onClick={clearCustomTerrain}
              >
                Remove Custom
              </button>
            )}
          </div>
        </div>
        <input
          ref={terrainInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={handleTerrainFile}
        />
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>Rock Texture</span>
        <div style={rowStyle}>
          <TileOption
            label="Default"
            thumb={presetThumbs.rock_default}
            selected={rockPreset === 'default'}
            onClick={() => setRockPreset('default')}
          />
          {customRockThumb && (
            <TileOption
              label="Custom"
              thumb={customRockThumb}
              selected={rockPreset === 'custom'}
              onClick={() => setRockPreset('custom')}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'flex-end' }}>
            <button
              style={smallBtnStyle}
              onClick={() => rockInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Processing...' : 'Upload Tile'}
            </button>
            {customRockBlobId && (
              <button
                style={{ ...smallBtnStyle, color: '#ff6666', borderColor: 'rgba(255,100,100,0.3)' }}
                onClick={clearCustomRock}
              >
                Remove Custom
              </button>
            )}
          </div>
        </div>
        <input
          ref={rockInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={handleRockFile}
        />
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>Grass</span>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            onClick={() => setGrassEnabled(!grassEnabled)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              background: grassEnabled
                ? 'rgba(0,180,255,0.5)'
                : 'rgba(255,255,255,0.1)',
              border: grassEnabled
                ? '1px solid #00b4ff'
                : '1px solid rgba(255,255,255,0.2)',
              position: 'relative',
              transition: 'all 0.25s',
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                background: grassEnabled ? '#00e5ff' : '#666',
                position: 'absolute',
                top: 2,
                left: grassEnabled ? 22 : 3,
                transition: 'all 0.25s',
                boxShadow: grassEnabled ? '0 0 6px rgba(0,229,255,0.5)' : 'none',
              }}
            />
          </div>
          <span style={{ color: grassEnabled ? '#00e5ff' : '#666', fontSize: 12, fontFamily: 'Orbitron, sans-serif', transition: 'color 0.25s' }}>
            {grassEnabled ? 'ON' : 'OFF'}
          </span>
        </label>
      </div>
      </div>

      <div style={{ flex: 1.2, minWidth: 0 }}>
        <div style={{
          marginBottom: 12,
          color: 'rgba(140,160,190,0.5)',
          fontSize: 9,
          fontFamily: 'Orbitron, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
        }}>
          Prompts for Nano Banana 2
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <PromptBox label="Terrain Tile Prompt" text={TERRAIN_PROMPT} />
          <PromptBox label="Rock Tile Prompt" text={ROCK_PROMPT} />
        </div>
        <a
          href="https://referral.freepik.com/mzHqDWB"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginTop: 16,
            padding: '14px 24px',
            background: 'linear-gradient(135deg, rgba(0,180,255,0.12) 0%, rgba(0,100,200,0.18) 100%)',
            border: '1px solid rgba(0,180,255,0.3)',
            borderRadius: 8,
            color: '#00e5ff',
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1.5,
            textDecoration: 'none',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.25s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,180,255,0.22) 0%, rgba(0,100,200,0.3) 100%)'
            e.currentTarget.style.borderColor = '#00e5ff'
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0,229,255,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,180,255,0.12) 0%, rgba(0,100,200,0.18) 100%)'
            e.currentTarget.style.borderColor = 'rgba(0,180,255,0.3)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          Create yours on Freepik
          <span style={{ fontSize: 16 }}>→</span>
        </a>
      </div>
    </div>
    <TerrainPreview />
    </div>
  )
}
