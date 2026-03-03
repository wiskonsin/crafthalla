interface Vec3SlidersProps {
  label: string
  value: [number, number, number]
  onChange: (v: [number, number, number]) => void
  min?: number
  max?: number
  step?: number
  labels?: [string, string, string]
  format?: (v: number) => string
  /** Si true, muestra checkbox de anclaje para escala uniforme (X=Y=Z) */
  allowUniform?: boolean
  uniformScale?: boolean
  onUniformScaleChange?: (v: boolean) => void
}

const AXIS_LABELS: [string, string, string] = ['X', 'Y', 'Z']

export function Vec3Sliders({
  label,
  value,
  onChange,
  min = 0,
  max = 3,
  step = 0.05,
  labels = AXIS_LABELS,
  format = (v) => v.toFixed(2),
  allowUniform = false,
  uniformScale = false,
  onUniformScaleChange,
}: Vec3SlidersProps) {
  const uniformVal = (value[0] + value[1] + value[2]) / 3

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'rgba(0, 229, 255, 0.9)',
            fontFamily: 'Orbitron',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </span>
        {allowUniform && onUniformScaleChange && (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10,
              color: 'rgba(180, 210, 240, 0.9)',
              fontFamily: 'Orbitron',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={uniformScale}
              onChange={(e) => onUniformScaleChange(e.target.checked)}
              style={{ accentColor: '#00e5ff', cursor: 'pointer' }}
            />
            Anchor
          </label>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {uniformScale && allowUniform ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 16, fontSize: 10, color: 'rgba(180, 210, 240, 0.8)', fontFamily: 'Orbitron' }}>
              =
            </span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={uniformVal}
              onChange={(e) => {
                const v = Number(e.target.value)
                onChange([v, v, v])
              }}
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
              {format(uniformVal)}
            </span>
          </div>
        ) : (
          ([0, 1, 2] as const).map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 16,
                  fontSize: 10,
                  color: 'rgba(180, 210, 240, 0.8)',
                  fontFamily: 'Orbitron',
                }}
              >
                {labels[i]}
              </span>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value[i]}
                onChange={(e) => {
                  const v = [...value] as [number, number, number]
                  v[i] = Number(e.target.value)
                  onChange(v)
                }}
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
                {format(value[i])}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
