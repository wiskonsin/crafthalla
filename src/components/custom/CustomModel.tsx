import { GlbModel } from './GlbModel'
import type { CustomModelConfig, CustomModelType } from '../../types/customModels'

interface CustomModelProps {
  url: string
  config: CustomModelConfig
  showMuzzle?: boolean
  modelType?: CustomModelType
  onAnimationStatus?: (loaded: boolean, count: number, names: string[]) => void
  onModelInfo?: (info: import('../../types/modelDebug').EnemyModelDebugInfo) => void
  animationPlaying?: boolean
  headIndicatorExternal?: boolean
}

/** GLB only. */
export function CustomModel(props: CustomModelProps) {
  const { config, ...rest } = props
  const headOffset = props.modelType === 'enemy' ? (config.headOffset ?? [0, 0.5, 0.6]) : null
  const showHead = !!headOffset

  return (
    <GlbModel
      {...rest}
      config={config}
      showMuzzle={!!config.muzzleOffset}
      showHead={showHead && !props.headIndicatorExternal}
      headOffset={headOffset}
      modelType={props.modelType}
      onAnimationStatus={props.onAnimationStatus}
      onModelInfo={props.onModelInfo}
      animationPlaying={props.animationPlaying}
    />
  )
}
