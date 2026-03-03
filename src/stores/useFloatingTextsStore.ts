import { create } from 'zustand'

export interface FloatingText {
  id: string
  text: string
  color: string
  position: { x: number; y: number; z: number }
  createdAt: number
}

interface FloatingTextsState {
  texts: FloatingText[]
  addText: (text: string, color: string, position: { x: number; y: number; z: number }) => void
  removeText: (id: string) => void
  reset: () => void
}

let nextId = 1

export const useFloatingTextsStore = create<FloatingTextsState>((set) => ({
  texts: [],

  addText: (text, color, position) => {
    const id = `ft-${nextId++}`
    set((s) => ({
      texts: [...s.texts, { id, text, color, position, createdAt: Date.now() }],
    }))
  },

  removeText: (id) => {
    set((s) => ({ texts: s.texts.filter((t) => t.id !== id) }))
  },

  reset: () => {
    nextId = 1
    set({ texts: [] })
  },
}))
