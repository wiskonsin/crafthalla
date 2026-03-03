/** Efectos de sonido con Web Audio API (sin dependencias externas) */

let ctx: AudioContext | null = null

function getContext(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  return ctx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.15) {
  try {
    const c = getContext()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.frequency.value = freq
    osc.type = type
    gain.gain.setValueAtTime(volume, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + duration)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + duration)
  } catch {
    // Silently fail if audio is blocked
  }
}

export type SoundName = 'turretShot' | 'enemyKill' | 'buildingPlace' | 'explosion' | 'waveStart'

const soundFns: Record<SoundName, (v: number) => void> = {
  turretShot: (v) => playTone(800, 0.05, 'square', v * 0.7),
  enemyKill: (v) => playTone(400, 0.1, 'sine', v),
  buildingPlace: (v) => playTone(600, 0.08, 'sine', v),
  explosion: (v) => {
    playTone(150, 0.2, 'sawtooth', v * 1.2)
    setTimeout(() => playTone(80, 0.15, 'sine', v * 0.8), 50)
  },
  waveStart: (v) => playTone(523, 0.15, 'sine', v),
}

/** Llama desde el juego; usa playSoundIfEnabled para respetar ajustes */
export function playSound(name: SoundName, volume = 1) {
  soundFns[name](0.12 * volume)
}
