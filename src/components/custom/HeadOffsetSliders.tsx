interface HeadOffsetSlidersProps {
  value: [number, number, number]
  onChange: (v: [number, number, number]) => void
  min?: number
  max?: number
  step?: number
}

/** Convierte [x,y,z] a { distance, height, rotation } en el plano XZ */
function xyzToSpherical([x, y, z]: [number, number, number]) {
  const distance = Math.sqrt(x * x + z * z)
  const height = y
  const rotation = Math.atan2(x, z)
  return { distance, height, rotation }
}

/** Convierte distance, height, rotation a [x,y,z] */
function sphericalToXyz(distance: number, height: number, rotation: number): [number, number, number] {
  return [distance * Math.sin(rotation), height, distance * Math.cos(rotation)]
}

export function HeadOffsetSliders({
  value,
  onChange,
  min = -2,
  max = 2,
  step = 0.05,
}: HeadOffsetSlidersProps) {
  const { distance, height, rotation } = xyzToSpherical(value)
  const rotationDeg = (rotation * 180) / Math.PI

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(0, 229, 255, 0.9)',
          marginBottom: 8,
          fontFamily: 'Orbitron',
          letterSpacing: '0.05em',
        }}
      >
        Head offset
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { label: 'Distance', val: distance, set: (v: number) => onChange(sphericalToXyz(v, height, rotation)) },
          { label: 'Height', val: height, set: (v: number) => onChange(sphericalToXyz(distance, v, rotation)) },
          {
            label: 'Rotation (°)',
            val: rotationDeg,
            set: (v: number) => onChange(sphericalToXyz(distance, height, (v * Math.PI) / 180)),
          },
        ].map(({ label, val, set }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 70,
                fontSize: 10,
                color: 'rgba(180, 210, 240, 0.8)',
                fontFamily: 'Orbitron',
              }}
            >
              {label}
            </span>
            <input
              type="range"
              min={label === 'Rotation (°)' ? -180 : min}
              max={label === 'Rotation (°)' ? 180 : max}
              step={label === 'Rotation (°)' ? 5 : step}
              value={val}
              onChange={(e) => set(Number(e.target.value))}
              style={{
                flex: 1,
                height: 6,
                accentColor: '#00e5ff',
                background: 'linear-gradient(90deg, rgba(0, 150, 255, 0.2), rgba(0, 229, 255, 0.4))',
                borderRadius: 3,
                cursor: 'pointer',
              }}
            />
            <span
              style={{
                width: 36,
                fontSize: 10,
                color: 'rgba(200, 220, 240, 0.9)',
                fontFamily: 'monospace',
                textAlign: 'right',
              }}
            >
              {label === 'Rotation (°)' ? Math.round(val).toString() : val.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
