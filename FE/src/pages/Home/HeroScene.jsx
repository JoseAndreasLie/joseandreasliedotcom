// Lazy chunk: everything that pulls in three lives here so the main bundle stays light.
// Floating contact sheet: stills as planes at varied depth, camera drifts with the cursor on a
// spring and always looks at the Signal dot, so the dot reads as the fixed focus point.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { stills } from './stills'

const COLS = 4
const W = 1.5
const H = 1
const GAP = 0.28
const FOCUS = new THREE.Vector3(0, 0, 1.1) // column gap at the sheet's center, in front of it
const SHEET_W = 8 // sheet extent incl. jitter and drift margin, world units
const SHEET_H = 4
const COPY_W = 360 // px kept clear on the left for the hero copy (Home.scss: min-width 320 + gap)
const TAN = Math.tan(THREE.MathUtils.degToRad(16)) // half of fov 32

// Deterministic jitter so the sheet looks hand laid but never reshuffles.
const rand = (i, k) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453
  return x - Math.floor(x)
}

const rows = Math.ceil(stills.length / COLS)
const layout = stills.map((s, i) => {
  const c = i % COLS
  const r = Math.floor(i / COLS)
  return {
    src: s.src,
    x: (c - (COLS - 1) / 2) * (W + GAP) + (rand(i, 1) - 0.5) * 0.3,
    y: ((rows - 1) / 2 - r) * (H + GAP) + (rand(i, 2) - 0.5) * 0.2,
    z: 0.4 - rand(i, 3) * 2.4,
    rz: (rand(i, 4) - 0.5) * 0.06,
    ry: (rand(i, 5) - 0.5) * 0.2,
    phase: rand(i, 6) * Math.PI * 2,
  }
})

function readPalette() {
  const cs = getComputedStyle(document.documentElement)
  const v = (n) => cs.getPropertyValue(n).trim()
  return { surface: v('--surface'), dim: v('--text-dim'), rule: v('--rule'), signal: v('--signal') }
}

// Neutral frame with viewfinder corners and a frame counter, drawn to match the current theme.
function placeholder(i, p) {
  const cv = document.createElement('canvas')
  cv.width = 960
  cv.height = 640
  const ctx = cv.getContext('2d')
  ctx.fillStyle = p.surface
  ctx.fillRect(0, 0, 960, 640)
  ctx.strokeStyle = p.rule
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, 958, 638)

  const inset = 36
  const arm = 44
  ctx.strokeStyle = p.dim
  ctx.lineWidth = 3
  for (const [x, y, dx, dy] of [
    [inset, inset, 1, 1],
    [960 - inset, inset, -1, 1],
    [inset, 640 - inset, 1, -1],
    [960 - inset, 640 - inset, -1, -1],
  ]) {
    ctx.beginPath()
    ctx.moveTo(x, y + dy * arm)
    ctx.lineTo(x, y)
    ctx.lineTo(x + dx * arm, y)
    ctx.stroke()
  }

  ctx.fillStyle = p.dim
  ctx.font = '500 38px "JetBrains Mono", ui-monospace, monospace'
  ctx.letterSpacing = '4px'
  ctx.fillText(`FR ${String(i + 1).padStart(3, '0')}`, inset + 32, 640 - inset - 28)

  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function loadStill(src) {
  const tex = new THREE.TextureLoader().load(src)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Theme toggles flip data-theme on <html>; late webfonts need a redraw of the frame labels.
function usePaletteKey() {
  const [key, setKey] = useState(0)
  useEffect(() => {
    const bump = () => setKey((k) => k + 1)
    const mo = new MutationObserver(bump)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    document.fonts?.ready.then(bump)
    return () => mo.disconnect()
  }, [])
  return key
}

const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t))

function Still({ data, index, texture, clock }) {
  const mesh = useRef()
  useFrame(() => {
    const t = clock.current
    // Develop in: each frame rises from deep in the sheet, staggered by position.
    const k = easeOutExpo(Math.max(0, (t - 0.15 - index * 0.06) / 1.4))
    const m = mesh.current
    m.position.set(
      data.x,
      data.y + Math.sin(t * 0.35 + data.phase) * 0.035,
      data.z - (1 - k) * 3,
    )
    m.rotation.set(Math.sin(t * 0.25 + data.phase) * 0.015, data.ry, data.rz)
    m.material.opacity = k
  })
  return (
    <mesh ref={mesh}>
      <planeGeometry args={[W, H]} />
      <meshBasicMaterial map={texture} transparent opacity={0} />
    </mesh>
  )
}

function Focus({ color, clock }) {
  const ring = useRef()
  useFrame(() => {
    // Slow REC pulse on the ring only; the dot stays solid.
    const s = 1 + Math.sin(clock.current * 2.4) * 0.12
    ring.current.scale.set(s, s, 1)
  })
  return (
    <group position={FOCUS}>
      <mesh>
        <circleGeometry args={[0.045, 32]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={ring}>
        <ringGeometry args={[0.1, 0.11, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

function Sheet() {
  const paletteKey = usePaletteKey()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const palette = useMemo(readPalette, [paletteKey])
  const textures = useMemo(
    () => layout.map((d, i) => (d.src ? loadStill(d.src) : placeholder(i, palette))),
    [palette],
  )
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures])

  // Fit the sheet to the canvas. On wide heroes the projection is shifted (film offset) so the
  // sheet sits in the right two thirds, leaving the left for the copy, while the camera still
  // pivots on the Signal dot.
  const { width, height } = useThree((st) => st.size)
  const camera = useThree((st) => st.camera)
  const aspect = width / height
  const fill = Math.min(0.6, 1 - COPY_W / width)
  const dist = Math.max(SHEET_W / (2 * TAN * aspect * fill), SHEET_H / (2 * TAN * 0.95))
  useEffect(() => {
    // filmOffset moves the frustum by filmOffset / (filmWidth * 2 * tan * aspect) of its width; shift by (1 - fill) / 2.
    camera.filmOffset = -camera.getFilmWidth() * (1 - fill) * TAN * aspect
    camera.updateProjectionMatrix()
  }, [camera, fill, aspect])

  const clock = useRef(0)
  const pointer = useRef({ x: 0, y: 0 })
  const cam = useRef({ x: 0, y: 0, vx: 0, vy: 0 })

  useEffect(() => {
    const onMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame(({ camera }, delta) => {
    // Clamp so a resumed loop (tab back, scrolled back) does not jump.
    const dt = Math.min(delta, 1 / 30)
    clock.current += dt
    // Spring, damping ratio about 0.85: soft follow, no visible bounce.
    const s = cam.current
    const k = 28
    const c = 2 * Math.sqrt(k) * 0.85
    const tx = pointer.current.x * 0.6
    const ty = pointer.current.y * 0.4
    s.vx += (k * (tx - s.x) - c * s.vx) * dt
    s.vy += (k * (ty - s.y) - c * s.vy) * dt
    s.x += s.vx * dt
    s.y += s.vy * dt
    camera.position.set(FOCUS.x + s.x, FOCUS.y + s.y, dist)
    camera.lookAt(FOCUS)
  })

  return (
    <>
      {layout.map((d, i) => (
        <Still key={i} data={d} index={i} texture={textures[i]} clock={clock} />
      ))}
      <Focus color={palette.signal} clock={clock} />
    </>
  )
}

export default function HeroScene({ onReady, onLost }) {
  const wrap = useRef()
  const lostCleanup = useRef()
  const [inView, setInView] = useState(true)
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible')

  // Render only while the hero is on screen and the tab is visible.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting))
    io.observe(wrap.current)
    const onVis = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVis)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      lostCleanup.current?.()
    }
  }, [])

  // GPU reset or driver crash: hand the hero back to the static sheet.
  const onCreated = ({ gl }) => {
    const el = gl.domElement
    const lost = () => onLost()
    el.addEventListener('webglcontextlost', lost)
    lostCleanup.current = () => el.removeEventListener('webglcontextlost', lost)
    onReady()
  }

  return (
    <div ref={wrap} className="hero-scene">
      <Canvas
        flat
        dpr={[1, 2]}
        frameloop={inView && visible ? 'always' : 'never'}
        camera={{ fov: 32, position: [0, 0, 8], near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={onCreated}
      >
        <Sheet />
      </Canvas>
    </div>
  )
}
