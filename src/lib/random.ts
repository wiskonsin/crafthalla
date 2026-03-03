import seedrandom from 'seedrandom'
import { GAME_SEED } from '../config/constants'

let rng = seedrandom(GAME_SEED.toString())

export function setSeed(seed: number) {
  rng = seedrandom(seed.toString())
}

export function seededRandom(): number {
  return rng()
}

export function seededRandomRange(min: number, max: number): number {
  return min + rng() * (max - min)
}
