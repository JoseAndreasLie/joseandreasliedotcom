import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { FiMoon, FiSun } from 'react-icons/fi'
import { useTheme } from '../context/ThemeContext'
import { Logo } from './ui'
import './Navbar.scss'

const links = [
  { to: '/works', label: 'Works' },
  { to: '/products', label: 'Products' },
  { to: '/projects', label: 'Projects' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { pathname } = useLocation()
  // Menu is open only for the path it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState(null)
  const open = openOn === pathname
  const close = () => setOpenOn(null)
  const menuBtn = useRef(null)

  // Links sit before the Menu button in the DOM (desktop order), so on open move focus to the first link.
  useEffect(() => {
    if (!open) return
    document.querySelector('#nav-menu a')?.focus()
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpenOn(null)
      menuBtn.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <header className={`navbar${open ? ' navbar--open' : ''}`}>
      <div className="container navbar__inner">
        <Link to="/" className="navbar__brand">
          <Logo size={36} title={null} />
          <span className="navbar__name">Jose Andreas Lie</span>
        </Link>

        <nav className="navbar__nav" aria-label="Main">
          <ul id="nav-menu" className="navbar__links">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} className="navbar__link" onClick={close}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="navbar__actions">
          <button
            type="button"
            className="navbar__icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${next} theme`}
          >
            {theme === 'dark' ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
          </button>
          <button
            type="button"
            ref={menuBtn}
            className="navbar__menu"
            aria-expanded={open}
            aria-controls="nav-menu"
            onClick={() => setOpenOn(open ? null : pathname)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>
    </header>
  )
}
