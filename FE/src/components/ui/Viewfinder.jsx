// Viewfinder({ children, active = false, as = 'div', className, ...rest }): corner brackets around children; `active` turns corners Signal.
export default function Viewfinder({ children, active = false, as: Tag = 'div', className = '', ...rest }) {
  return (
    <Tag className={`viewfinder${active ? ' viewfinder--active' : ''} ${className}`.trim()} {...rest}>
      {children}
      <span className="viewfinder__corner viewfinder__corner--tl" aria-hidden="true" />
      <span className="viewfinder__corner viewfinder__corner--tr" aria-hidden="true" />
      <span className="viewfinder__corner viewfinder__corner--bl" aria-hidden="true" />
      <span className="viewfinder__corner viewfinder__corner--br" aria-hidden="true" />
    </Tag>
  )
}
