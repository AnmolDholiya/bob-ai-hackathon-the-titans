// ─────────────────────────────────────────────────────────────────────────────
// VideoBackground — fullscreen video layer for PortMind
//
// To activate the video: place your maritime MP4 at
//   src/frontend/public/assets/so_last_upload_is_video_take_t.mp4
// Vite serves everything in /public at the root, so the src below resolves
// to /assets/so_last_upload_is_video_take_t.mp4 at runtime.
//
// The dark-blue fallback colour is always present behind the video element
// so the UI remains usable while the video loads or if the file is absent.
// ─────────────────────────────────────────────────────────────────────────────

const VIDEO_SRC = '/assets/so_last_upload_is_video_take_t.mp4'

export default function VideoBackground() {
  return (
    <>
      {/* Layer 0 — real fullscreen video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          pointerEvents: 'none',
          /* Dark-blue fallback colour while video loads / if file absent */
          background: '#020d1e',
        }}
        aria-hidden="true"
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      {/* Layer 1 — blue/cyan cinematic overlay; keeps video clearly visible */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: [
            'linear-gradient(',
            '  180deg,',
            '  rgba(2, 18, 48, 0.40)  0%,',
            '  rgba(2, 28, 65, 0.30) 30%,',
            '  rgba(1, 20, 50, 0.45) 65%,',
            '  rgba(2, 13, 30, 0.18) 100%',
            ')',
          ].join(''),
        }}
        aria-hidden="true"
      />
    </>
  )
}
