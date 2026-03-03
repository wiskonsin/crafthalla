import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GameSettings {
  soundEnabled: boolean
  soundVolume: number
  showFps: boolean
  cameraSensitivity: number
  uiScale: number
  lowPerfMode: boolean
}

interface SettingsState extends GameSettings {
  setSoundEnabled: (v: boolean) => void
  setSoundVolume: (v: number) => void
  setShowFps: (v: boolean) => void
  setCameraSensitivity: (v: number) => void
  setUiScale: (v: number) => void
  setLowPerfMode: (v: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      soundVolume: 1,
      showFps: false,
      cameraSensitivity: 1,
      uiScale: 1,
      lowPerfMode: false,
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setSoundVolume: (v) => set({ soundVolume: Math.max(0, Math.min(1, v)) }),
      setShowFps: (v) => set({ showFps: v }),
      setCameraSensitivity: (v) => set({ cameraSensitivity: Math.max(0.5, Math.min(2, v)) }),
      setUiScale: (v) => set({ uiScale: Math.max(0.8, Math.min(1.3, v)) }),
      setLowPerfMode: (v) => set({ lowPerfMode: v }),
    }),
    { name: 'rts-settings' }
  )
)
