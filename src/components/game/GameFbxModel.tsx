import { GameGlbModel } from './GameGlbModel'
import { GameEnemyGlbModel } from './GameEnemyGlbModel'
import type { CustomModelConfig, CustomModelType } from '../../types/customModels'

interface GameCustomModelProps {
  url: string
  config: CustomModelConfig
  opacity?: number
  modelType?: CustomModelType
}

/** GLB only. Routes to GameEnemyGlbModel for enemies, GameGlbModel for rest. */
export function GameCustomModel(props: GameCustomModelProps) {
  const { config, ...rest } = props
  if (props.modelType === 'enemy') {
    return <GameEnemyGlbModel {...rest} config={config} />
  }
  return <GameGlbModel {...rest} config={config} opacity={props.opacity} />
}
