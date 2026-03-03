import { useRef } from 'react'
import { useHarvestersStore } from '../../stores/useHarvestersStore'
import { useMineralRocksStore } from '../../stores/useMineralRocksStore'
import { HARVESTER_CONFIG } from '../../config/constants'

function dist2D(a: { x: number; z: number }, b: { x: number; z: number }) {
  const dx = a.x - b.x
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dz * dz)
}

interface Props {
  harvesterId: string
}

export function HarvesterJourneyView({ harvesterId }: Props) {
  const harvester = useHarvestersStore((s) => s.harvesters.find((h) => h.id === harvesterId))
  const rocks = useMineralRocksStore((s) => s.rocks)

  const lastRockPos = useRef<{ x: number; z: number } | null>(null)
  const lastTotalDist = useRef(1)

  if (!harvester) return null

  const h = harvester
  const home = h.homePosition
  const pos = h.position

  const targetRock = h.targetRockId
    ? rocks.find((r) => r.id === h.targetRockId)
    : null

  if (targetRock) {
    lastRockPos.current = { x: targetRock.position.x, z: targetRock.position.z }
    lastTotalDist.current = dist2D(home, targetRock.position)
  }

  const rockPos = targetRock?.position ?? lastRockPos.current
  const totalDist = rockPos ? dist2D(home, rockPos) : lastTotalDist.current
  const distFromHome = dist2D(home, pos)

  let progress: number
  if (h.state === 'idle' || h.state === 'depositing') {
    progress = totalDist > 0.1 ? Math.min(1, distFromHome / totalDist) : 0
  } else if (h.state === 'gathering') {
    progress = 1
  } else if (h.state === 'moving_to_rock') {
    progress = totalDist > 0.1 ? Math.min(1, distFromHome / totalDist) : 0
  } else if (h.state === 'returning') {
    progress = totalDist > 0.1 ? Math.min(1, distFromHome / totalDist) : 0
  } else {
    progress = 0
  }

  const cargoPercent = h.cargo / HARVESTER_CONFIG.carryCapacity
  const oreRemaining = targetRock?.minerals ?? 0
  const oreMax = targetRock?.maxMinerals ?? 1
  const orePercent = oreMax > 0 ? oreRemaining / oreMax : 0

  const truckX = 60 + progress * 280

  const isGathering = h.state === 'gathering'
  const isReturning = h.state === 'returning' || (h.state === 'depositing' && progress > 0.01)

  return (
    <div className="rts-journey-view">
      <svg
        viewBox="0 0 400 100"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="jv-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(30,50,40,0.6)" />
            <stop offset="100%" stopColor="rgba(12,14,28,0.9)" />
          </linearGradient>
          <linearGradient id="jv-ore-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#44ddff" />
            <stop offset="100%" stopColor="#1188aa" />
          </linearGradient>
          <linearGradient id="jv-cargo-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22aacc" />
            <stop offset="100%" stopColor="#44ddff" />
          </linearGradient>
          <filter id="jv-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ground line */}
        <rect x="0" y="68" width="400" height="32" fill="url(#jv-ground)" />
        <line x1="30" y1="68" x2="370" y2="68" stroke="rgba(0,180,255,0.12)" strokeWidth="1" />

        {/* Path dashes */}
        <line
          x1="60" y1="68" x2="340" y2="68"
          stroke="rgba(0,180,255,0.08)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />

        {/* Progress trail */}
        {isReturning ? (
          <line
            x1={truckX} y1="68" x2="340" y2="68"
            stroke="rgba(0,212,255,0.15)"
            strokeWidth="2"
          />
        ) : (
          <line
            x1="60" y1="68" x2={truckX} y2="68"
            stroke="rgba(0,212,255,0.2)"
            strokeWidth="2"
          />
        )}

        {/* ── BASE (left) ── */}
        <g transform="translate(30, 30)">
          {/* Building shape */}
          <rect x="-14" y="14" width="28" height="24" rx="2" fill="rgba(60,80,100,0.7)" stroke="rgba(0,180,255,0.25)" strokeWidth="0.8" />
          <rect x="-10" y="8" width="20" height="8" rx="1" fill="rgba(50,70,90,0.8)" stroke="rgba(0,180,255,0.2)" strokeWidth="0.6" />
          <rect x="-6" y="4" width="12" height="6" rx="1" fill="rgba(45,65,85,0.9)" stroke="rgba(0,180,255,0.15)" strokeWidth="0.5" />
          {/* Antenna */}
          <line x1="0" y1="4" x2="0" y2="-4" stroke="rgba(0,200,255,0.5)" strokeWidth="0.8" />
          <circle cx="0" cy="-5" r="1.5" fill="rgba(0,212,255,0.6)" />
          {/* Windows */}
          <rect x="-8" y="18" width="4" height="4" rx="0.5" fill="rgba(0,180,255,0.15)" />
          <rect x="-2" y="18" width="4" height="4" rx="0.5" fill="rgba(0,180,255,0.15)" />
          <rect x="4" y="18" width="4" height="4" rx="0.5" fill="rgba(0,180,255,0.15)" />
          {/* Label */}
          <text x="0" y="48" textAnchor="middle" fill="rgba(0,212,255,0.5)" fontSize="7" fontFamily="Orbitron, monospace" fontWeight="600">
            BASE
          </text>
        </g>

        {/* ── ORE ROCK (right) ── */}
        <g transform="translate(350, 36)">
          {/* Rock shape - angular/crystalline */}
          <polygon
            points="-16,22 -20,8 -12,-4 0,-10 12,-4 18,6 16,22"
            fill={`rgba(${targetRock ? '40,100,90' : '40,40,50'},0.8)`}
            stroke={targetRock ? 'rgba(0,220,200,0.35)' : 'rgba(100,100,120,0.3)'}
            strokeWidth="0.8"
          />
          {/* Crystal accents */}
          {targetRock && (
            <>
              <polygon points="-4,-6 0,-14 4,-6" fill="rgba(0,220,255,0.3)" stroke="rgba(0,220,255,0.5)" strokeWidth="0.5" />
              <polygon points="6,0 10,-6 12,2" fill="rgba(0,200,230,0.25)" stroke="rgba(0,200,230,0.4)" strokeWidth="0.5" />
              {isGathering && (
                <circle cx="0" cy="4" r="6" fill="none" stroke="rgba(0,220,255,0.4)" strokeWidth="0.5" filter="url(#jv-glow)">
                  <animate attributeName="r" values="4;8;4" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
            </>
          )}

          {/* Ore bar background */}
          <rect x="-14" y="26" width="28" height="4" rx="2" fill="rgba(0,0,0,0.4)" />
          {/* Ore bar fill */}
          <rect x="-14" y="26" width={28 * orePercent} height="4" rx="2" fill="url(#jv-ore-fill)" />

          {/* Ore label */}
          <text x="0" y="38" textAnchor="middle" fill="rgba(0,212,255,0.5)" fontSize="7" fontFamily="Orbitron, monospace" fontWeight="600">
            {targetRock ? `${Math.floor(oreRemaining)}` : 'N/A'}
          </text>
          <text x="0" y="46" textAnchor="middle" fill="rgba(0,180,255,0.35)" fontSize="5.5" fontFamily="Orbitron, monospace">
            ORE
          </text>
        </g>

        {/* ── TRUCK ── */}
        <g transform={`translate(${truckX}, 48)`}>
          {/* Shadow */}
          <ellipse cx="0" cy="22" rx="12" ry="2" fill="rgba(0,0,0,0.3)" />

          {/* Truck body */}
          <rect x="-10" y="6" width="20" height="12" rx="2" fill="rgba(180,150,80,0.85)" stroke="rgba(200,170,60,0.5)" strokeWidth="0.6" />
          {/* Cabin */}
          <rect x={isReturning ? '-14' : '5'} y="2" width="9" height="10" rx="1.5" fill="rgba(160,130,60,0.9)" stroke="rgba(200,170,60,0.4)" strokeWidth="0.5" />
          {/* Cabin window */}
          <rect x={isReturning ? '-12' : '7'} y="3.5" width="5" height="4" rx="1" fill="rgba(0,180,255,0.2)" />
          {/* Wheels */}
          <circle cx="-6" cy="19" r="2.5" fill="rgba(30,30,35,0.9)" stroke="rgba(80,80,90,0.5)" strokeWidth="0.5" />
          <circle cx="6" cy="19" r="2.5" fill="rgba(30,30,35,0.9)" stroke="rgba(80,80,90,0.5)" strokeWidth="0.5" />

          {/* Cargo indicator on truck bed */}
          <rect x="-8" y="8" width="16" height="3" rx="1" fill="rgba(0,0,0,0.3)" />
          <rect x="-8" y="8" width={16 * cargoPercent} height="3" rx="1" fill="url(#jv-cargo-fill)" opacity="0.8" />

          {/* Cargo text */}
          <text x="0" y="-2" textAnchor="middle" fill="#fff" fontSize="7" fontFamily="Orbitron, monospace" fontWeight="700">
            {Math.floor(h.cargo)}/{HARVESTER_CONFIG.carryCapacity}
          </text>
        </g>

        {/* ── DISTANCE label ── */}
        <text x="200" y="82" textAnchor="middle" fill="rgba(0,180,255,0.3)" fontSize="6" fontFamily="Orbitron, monospace">
          {Math.floor(totalDist)}m
        </text>

        {/* ── STATE indicator ── */}
        <text x="200" y="94" textAnchor="middle" fill="rgba(0,212,255,0.4)" fontSize="6.5" fontFamily="Orbitron, monospace" fontWeight="600">
          {h.state === 'moving_to_rock' ? `OUTBOUND  ${Math.floor(progress * 100)}%` :
           h.state === 'returning' ? `INBOUND  ${Math.floor((1 - progress) * 100)}%  ` :
           h.state === 'gathering' ? 'EXTRACTING' :
           h.state === 'depositing' ? 'DEPOSITING' :
           'STANDBY'}
        </text>
      </svg>
    </div>
  )
}
