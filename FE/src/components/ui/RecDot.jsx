// RecDot({ pulse = true, label, className }): small Signal REC dot; pulses unless reduced motion. Decorative unless `label` given (then announced).
export default function RecDot({ pulse = true, label, className = '' }) {
  return (
    <span
      className={`rec-dot${pulse ? ' rec-dot--pulse' : ''} ${className}`.trim()}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    />
  )
}
