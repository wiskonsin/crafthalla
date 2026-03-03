import { useEngineersStore } from '../../stores/useEngineersStore'
import { Engineer } from './Engineer'

export function EngineerManager() {
  const engineers = useEngineersStore((s) => s.engineers)

  return (
    <>
      {engineers.map((e) => (
        <Engineer key={e.id} engineer={e} />
      ))}
    </>
  )
}
