// Logo({ size = 40, title = 'Jose Andreas Lie', className }): JAL monogram in viewfinder brackets + Signal REC dot. Uses currentColor. Pass title={null} when a visible label sits next to it.
export default function Logo({ size = 40, title = 'Jose Andreas Lie', className = '' }) {
  return (
    <svg
      className={`logo ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
    >
      <path
        d="M3 13V3h10M35 3h10v10M45 35v10H35M13 45H3V35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <text
        x="23"
        y="30.5"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Newsreader, Georgia, serif"
        fontSize="17"
        letterSpacing="-0.5"
      >
        JAL
      </text>
      <circle cx="37.5" cy="10.5" r="2.5" fill="var(--signal, #E5482D)" />
    </svg>
  )
}
