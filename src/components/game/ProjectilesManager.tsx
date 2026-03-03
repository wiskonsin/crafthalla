import { useProjectilesStore } from '../../stores/useProjectilesStore'
import { Projectile } from './Projectile'

export function ProjectilesManager() {
  const projectiles = useProjectilesStore((s) => s.projectiles)

  return (
    <>
      {projectiles.map((p) => (
        <Projectile
          key={p.id}
          id={p.id}
          position={[p.position.x, p.position.y, p.position.z]}
          targetEnemyId={p.targetEnemyId}
        />
      ))}
    </>
  )
}
