import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

// index.html sets data-theme before paint (saved choice, else prefers-color-scheme).
function initialTheme() {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'light' || attr === 'dark') return attr
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () =>
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('theme', next)
      } catch {
        // storage blocked: theme still applies for this visit
      }
      return next
    })

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react/only-export-components
export function useTheme() {
  return useContext(ThemeContext)
}
