import { create } from 'zustand'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

interface CameraStoreState {
  controlsRef: React.RefObject<OrbitControlsImpl | null> | null
  setControlsRef: (ref: React.RefObject<OrbitControlsImpl | null> | null) => void
  resetCamera: () => void
}

export const useCameraStore = create<CameraStoreState>((set, get) => ({
  controlsRef: null,

  setControlsRef: (ref) => set({ controlsRef: ref }),

  resetCamera: () => {
    const ref = get().controlsRef
    ref?.current?.reset()
  },
}))
