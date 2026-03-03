import { useRef, useState, useEffect, useCallback } from 'react'

const TRACKS = [
  { name: 'OST-3', src: '/music/OST-3.mp3' },
  { name: 'OST1', src: '/music/OST1.mp3' },
  { name: 'OST2', src: '/music/OST2.mp3' },
  { name: 'OST4', src: '/music/OST4.mp3' },
]

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [trackIndex, setTrackIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.35)
  const [collapsed, setCollapsed] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = new Audio(TRACKS[0].src)
    audio.volume = volume
    audio.preload = 'auto'
    audioRef.current = audio

    audio.addEventListener('ended', () => {
      setTrackIndex((prev) => (prev + 1) % TRACKS.length)
    })

    audio.addEventListener('timeupdate', () => {
      setProgress(audio.currentTime)
      setDuration(audio.duration || 0)
    })

    return () => {
      audio.pause()
      audio.src = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const wasPlaying = !audio.paused
    audio.src = TRACKS[trackIndex].src
    audio.volume = volume
    if (wasPlaying || playing) {
      audio.play().catch(() => {})
      setPlaying(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIndex])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (audio && audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const tryPlay = () => {
      const audio = audioRef.current
      if (audio && audio.paused) {
        audio.play().then(() => setPlaying(true)).catch(() => {})
      }
      document.removeEventListener('click', tryPlay)
      document.removeEventListener('keydown', tryPlay)
    }
    document.addEventListener('click', tryPlay, { once: true })
    document.addEventListener('keydown', tryPlay, { once: true })
    return () => {
      document.removeEventListener('click', tryPlay)
      document.removeEventListener('keydown', tryPlay)
    }
  }, [])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch(() => {})
      setPlaying(true)
    } else {
      audio.pause()
      setPlaying(false)
    }
  }, [])

  const next = useCallback(() => {
    setTrackIndex((prev) => (prev + 1) % TRACKS.length)
  }, [])

  const prev = useCallback(() => {
    setTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length)
  }, [])

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    audio.currentTime = x * duration
  }, [duration])

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          position: 'fixed',
          bottom: 12,
          right: 12,
          zIndex: 200,
          background: 'rgba(10,14,26,0.85)',
          border: '1px solid rgba(0,180,255,0.3)',
          borderRadius: 8,
          padding: '8px 14px',
          color: playing ? '#00e5ff' : '#668',
          cursor: 'pointer',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 11,
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 14 }}>{playing ? '♫' : '♪'}</span>
        {playing && <span>{TRACKS[trackIndex].name}</span>}
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        zIndex: 200,
        background: 'rgba(10,14,26,0.92)',
        border: '1px solid rgba(0,180,255,0.3)',
        borderRadius: 10,
        padding: '12px 16px',
        minWidth: 260,
        backdropFilter: 'blur(12px)',
        fontFamily: 'Orbitron, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: '#00e5ff', fontSize: 11, fontWeight: 600 }}>
          {TRACKS[trackIndex].name}
        </span>
        <button
          onClick={() => setCollapsed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#668',
            cursor: 'pointer',
            fontSize: 14,
            padding: '0 4px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div
        onClick={seek}
        style={{
          height: 4,
          background: 'rgba(0,180,255,0.15)',
          borderRadius: 2,
          marginBottom: 10,
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${duration ? (progress / duration) * 100 : 0}%`,
            background: 'linear-gradient(90deg, #00e5ff, #0088cc)',
            borderRadius: 2,
            transition: 'width 0.3s linear',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#556', fontSize: 9 }}>
          {fmt(progress)} / {fmt(duration)}
        </span>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={prev} style={btnStyle}>⏮</button>
          <button onClick={togglePlay} style={{ ...btnStyle, fontSize: 16 }}>
            {playing ? '⏸' : '▶'}
          </button>
          <button onClick={next} style={btnStyle}>⏭</button>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={volume * 100}
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
          style={{ width: 50, accentColor: '#00e5ff' }}
        />
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#aac',
  cursor: 'pointer',
  fontSize: 13,
  padding: '2px 6px',
}
