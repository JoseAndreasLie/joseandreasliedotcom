import Rule from './Rule'

// Section({ title?, label?, id?, rule = true, as = 'section', className, children }): container + vertical rhythm + optional top Rule. One heading only: `title` = serif h2, or `label` = mono h2.
export default function Section({ title, label, id, rule = true, as: Tag = 'section', className = '', children }) {
  const headingId = id ? `${id}-title` : undefined
  return (
    <Tag id={id} className={`section container ${className}`.trim()} aria-labelledby={title || label ? headingId : undefined}>
      {rule && <Rule />}
      {title && <h2 id={headingId} className="section__title t-headline">{title}</h2>}
      {!title && label && <h2 id={headingId} className="section__label t-label">{label}</h2>}
      {children}
    </Tag>
  )
}
