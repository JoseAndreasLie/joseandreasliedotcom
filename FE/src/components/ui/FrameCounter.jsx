// FrameCounter({ index: number (1 based), total?: number, className }): renders 'FR 012 / 040' (or 'FR 012' without total).
const pad = (n) => String(n).padStart(3, '0')

export default function FrameCounter({ index, total, className = '' }) {
  const text = total ? `FR ${pad(index)} / ${pad(total)}` : `FR ${pad(index)}`
  return (
    <span className={`frame-counter ${className}`.trim()} aria-label={total ? `Frame ${index} of ${total}` : `Frame ${index}`}>
      {text}
    </span>
  )
}
