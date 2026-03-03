import { useCameraStore } from '../../stores/useCameraStore'

export function CameraResetButton() {
  const resetCamera = useCameraStore((s) => s.resetCamera)

  return (
    <button
      className="rts-btn"
      onClick={resetCamera}
      style={{
        position: 'absolute',
        top: 50,
        right: 16,
        zIndex: 10,
        padding: '10px 16px',
        fontSize: 11,
      }}
      title="Reset camera to initial view"
    >
      Reset camera
    </button>
  )
}
