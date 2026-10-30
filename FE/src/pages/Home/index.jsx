import { Component, lazy, Suspense, useMemo, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { Button, FrameCounter, MediaCard, RecDot, Section, Viewfinder } from '../../components/ui'
import { list } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import { profile } from '../../data/portfolio'
import { buildStills, FOCUS } from './stills'
import ProductBadge from '../Products/ProductBadge'
import './Home.scss'

// Separate chunk: three + R3F never load on mobile, reduced motion or without WebGL2.
const HeroScene = lazy(() => import('./HeroScene'))

const MOTION_QUERY = '(min-width: 768px) and (prefers-reduced-motion: no-preference)'
const subscribe = (cb) => {
  const mq = matchMedia(MOTION_QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const motionAllowed = () => matchMedia(MOTION_QUERY).matches

let webgl2
function hasWebGL2() {
  if (webgl2 === undefined) {
    try {
      const gl = document.createElement('canvas').getContext('webgl2')
      webgl2 = !!gl
      gl?.getExtension('WEBGL_lose_context')?.loseContext() // free the probe context now
    } catch {
      webgl2 = false
    }
  }
  return webgl2
}

// A failed chunk load or WebGL context leaves the static sheet in place instead of crashing the page.
class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

// Static contact sheet: the mobile, reduced motion and no WebGL view, and the placeholder while the 3D chunk loads.
function StillGrid({ stills, hidden }) {
  return (
    <div className={`still-grid${hidden ? ' is-hidden' : ''}`}>
      {stills.map((src, i) => (
        <Viewfinder key={i} className="still-grid__frame" active={i === FOCUS}>
          {src ? (
            <img className="still-grid__img" src={src} alt="" decoding="async" />
          ) : (
            <span className="still-grid__empty">
              <FrameCounter index={i + 1} />
            </span>
          )}
        </Viewfinder>
      ))}
    </div>
  )
}

// Italic accent on the family name.
const first = profile.name.split(' ').slice(0, -1).join(' ')
const last = profile.name.split(' ').at(-1)

function Hero({ stills }) {
  const [sceneReady, setSceneReady] = useState(false)
  const [contextLost, setContextLost] = useState(false)
  const use3D = useSyncExternalStore(subscribe, motionAllowed) && hasWebGL2() && !contextLost

  return (
    <section className="hero container" aria-labelledby="hero-title">
      <div className="hero__stage" aria-hidden="true">
        <StillGrid stills={stills} hidden={use3D && sceneReady} />
        {use3D && (
          <SceneBoundary>
            <Suspense fallback={null}>
              <HeroScene stills={stills} onReady={() => setSceneReady(true)} onLost={() => setContextLost(true)} />
            </Suspense>
          </SceneBoundary>
        )}
      </div>

      <div className="hero__copy">
        <h1 id="hero-title" className="hero__name t-display">
          {first} <em>{last}</em>
        </h1>
        <p className="hero__titles">{profile.titles.join(' · ')}</p>
        <p className="hero__rec t-label">
          <RecDot /> Rec · Indonesia · An engineer who also shoots
        </p>
        <div className="hero__actions">
          <Button to="/projects" variant="primary">
            See the projects
          </Button>
          <Button to="/lens">Behind the Lens</Button>
          <Button to="/contact">Get in touch</Button>
        </div>
      </div>
    </section>
  )
}

// Three cards in a row, with a skeleton, a quiet error line and an "all" link. Shared by every Home section.
function CardSection({ title, id, state, items, empty, more, render }) {
  return (
    <Section title={title} id={id}>
      {state.status === 'loading' && (
        <ul className="home-grid" aria-busy="true" aria-label={`Loading ${title.toLowerCase()}`}>
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Viewfinder className="home-skeleton">
                <span className="media-card__empty" />
              </Viewfinder>
            </li>
          ))}
        </ul>
      )}
      {state.status === 'error' && (
        <p className="home-note">
          This section is offline right now. <Link to={more.to}>Try the full page</Link> in a moment.
        </p>
      )}
      {state.status === 'ready' && items.length === 0 && <p className="home-note">{empty}</p>}
      {items.length > 0 && (
        <ul className="home-grid">
          {items.map((row, i) => (
            <li key={row.slug}>{render(row, i)}</li>
          ))}
        </ul>
      )}
      <div className="home-more">
        <Button to={more.to} variant="ghost">
          {more.label}
        </Button>
      </div>
    </Section>
  )
}

// Featured rows first (admin toggle); with none featured, the first three in order.
const pick = (rows = []) => {
  const featured = rows.filter((r) => r.featured)
  return (featured.length ? featured : rows).slice(0, 3)
}

export default function Home() {
  const works = useFetch(() => list('works'), [])
  const projects = useFetch(() => list('projects'), [])
  const products = useFetch(() => list('products'), [])
  // Stable identity so the 3D sheet only rebuilds its textures when the covers change.
  const stills = useMemo(() => buildStills(works.data), [works.data])

  return (
    <>
      <title>{`${profile.name} · Engineer who also shoots`}</title>
      <meta
        name="description"
        content={`${profile.name}: ${profile.titles.join(' and ')} in Indonesia. An engineer who also shoots.`}
      />
      <Hero stills={stills} />
      <CardSection
        title="Featured projects"
        id="featured-projects"
        state={projects}
        items={pick(projects.data)}
        empty="No projects published yet."
        more={{ to: '/projects', label: 'All projects' }}
        render={(p, i) => (
          <MediaCard
            to={`/projects/${p.slug}`}
            cover={p.cover_url}
            title={p.title}
            summary={p.summary}
            meta={[p.year, p.role]}
            index={i + 1}
            total={projects.data.length}
          />
        )}
      />
      <CardSection
        title="Behind the Lens"
        id="behind-the-lens"
        state={works}
        items={(works.data ?? []).slice(0, 3)}
        empty="No frames published yet."
        more={{ to: '/lens', label: 'All frames' }}
        render={(w, i) => (
          <MediaCard
            to={`/lens/${w.slug}`}
            cover={w.cover_url}
            title={w.title}
            summary={w.summary}
            meta={[w.date?.slice(0, 4), w.type, w.shot_on]}
            index={i + 1}
            total={works.data.length}
          />
        )}
      />
      <CardSection
        title="Live products"
        id="live-products"
        state={products}
        items={pick(products.data)}
        empty="No products published yet."
        more={{ to: '/products', label: 'All products' }}
        render={(p, i) => (
          <MediaCard
            to={`/products/${p.slug}`}
            cover={p.screenshot_desktop}
            alt={p.screenshot_desktop ? `${p.name} on desktop` : ''}
            title={p.name}
            summary={p.summary}
            meta={[p.tagline]}
            index={i + 1}
            total={products.data.length}
            badge={<ProductBadge product={p} />}
          />
        )}
      />
    </>
  )
}
