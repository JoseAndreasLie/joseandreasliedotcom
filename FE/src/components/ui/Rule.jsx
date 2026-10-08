// Rule({ className }): 1px hairline <hr> in --rule.
export default function Rule({ className = '' }) {
  return <hr className={`rule ${className}`.trim()} />
}
