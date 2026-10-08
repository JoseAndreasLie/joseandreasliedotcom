import { Link } from 'react-router-dom'

// Button({ variant = 'default' | 'primary' | 'ghost', to?, href?, type = 'button', className, ...rest }): mono label button, square, 44px min. `to` renders a router Link, `href` an <a> (external opens new tab), else <button>.
export default function Button({ variant = 'default', to, href, type = 'button', className = '', children, ...rest }) {
  const cls = `btn btn--${variant} ${className}`.trim()
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>
  if (href) {
    const external = /^https?:/.test(href)
    return (
      <a href={href} className={cls} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} {...rest}>
        {children}
      </a>
    )
  }
  return <button type={type} className={cls} {...rest}>{children}</button>
}
