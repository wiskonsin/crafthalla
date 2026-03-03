import { useState, useCallback } from 'react'

interface DragDropZoneProps {
  id: string
  accept: string
  label: string
  hint: string
  onDrop: (files: File[]) => void
  hasFile?: boolean
  fileLabel?: string
  onClear?: () => void
}

export function DragDropZone({
  id,
  accept,
  label,
  hint,
  onDrop,
  hasFile = false,
  fileLabel,
  onClear,
}: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length) onDrop(files)
    },
    [onDrop]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : []
      if (files.length) onDrop(files)
      e.target.value = ''
    },
    [onDrop]
  )

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        position: 'relative',
        minHeight: 72,
        borderRadius: 6,
        border: `2px dashed ${isDragging ? 'rgba(0, 229, 255, 0.6)' : 'rgba(0, 180, 255, 0.25)'}`,
        background: isDragging ? 'rgba(0, 150, 255, 0.08)' : 'rgba(5, 15, 30, 0.6)',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        cursor: 'pointer',
      }}
      onClick={() => document.getElementById(`file-input-${id}`)?.click()}
    >
      <input
        id={`file-input-${id}`}
        type="file"
        accept={accept}
        multiple={accept.includes('png')}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <span
        style={{
          fontFamily: 'Orbitron',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: 'rgba(0, 229, 255, 0.9)',
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      {hasFile && fileLabel ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              color: 'rgba(180, 210, 240, 0.9)',
              maxWidth: 140,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {fileLabel}
          </span>
          {onClear && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClear()
              }}
              style={{
                padding: '2px 8px',
                fontSize: 10,
                background: 'rgba(255, 68, 68, 0.2)',
                border: '1px solid rgba(255, 68, 68, 0.4)',
                borderRadius: 2,
                color: '#ff6b6b',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        <span style={{ fontSize: 10, color: 'rgba(180, 210, 240, 0.6)' }}>{hint}</span>
      )}
    </div>
  )
}
