import { Component, lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { PageTransition } from './components/ui'
import Home from './pages/Home' // eager: / is the main entry, skip a chunk round trip

const About = lazy(() => import('./pages/About'))
const Projects = lazy(() => import('./pages/Projects'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Works = lazy(() => import('./pages/Works'))
const WorkDetail = lazy(() => import('./pages/WorkDetail'))
const Contact = lazy(() => import('./pages/Contact'))
const Admin = lazy(() => import('./pages/Admin'))
const NotFound = lazy(() => import('./pages/NotFound'))

const routes = [
  ['/', Home],
  ['/about', About],
  ['/projects', Projects],
  ['/products', Products],
  ['/products/:slug', ProductDetail],
  ['/works', Works],
  ['/works/:slug', WorkDetail],
  ['/contact', Contact],
  ['/admin', Admin],
  ['*', NotFound],
]

// Catches a failed lazy chunk (stale deploy) so only the page, not the whole app, falls over.
// Remounts per route because <Routes> is keyed by pathname.
class PageBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="container page-stub" role="alert">
        <p className="t-title">This page failed to load</p>
        <div>
          <button type="button" className="btn btn--default" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    )
  }
}

// After the old page has left: jump to top and move focus to main for screen readers.
function onRouteSwap() {
  window.scrollTo({ top: 0, behavior: 'instant' })
  document.getElementById('main')?.focus({ preventScroll: true })
}

export default function App() {
  const location = useLocation()

  return (
    <ThemeProvider>
      <div className="app">
        <a className="skip-link" href="#main">Skip to content</a>
        <Navbar />
        <main id="main" tabIndex={-1}>
          <AnimatePresence mode="wait" initial={false} onExitComplete={onRouteSwap}>
            <Routes location={location} key={location.pathname}>
              {routes.map(([path, Page]) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <PageTransition>
                      <PageBoundary>
                        <Suspense fallback={<p className="container page-loading" role="status">Loading</p>}>
                          <Page />
                        </Suspense>
                      </PageBoundary>
                    </PageTransition>
                  }
                />
              ))}
            </Routes>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}
