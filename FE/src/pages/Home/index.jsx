import { Component, lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { Button, FrameCounter, MediaCard, RecDot, Section, Viewfinder } from '../../components/ui'
import { getWorks } from '../../lib/api'
import { products } from '../../data/products'
import { profile } from '../../data/portfolio'
import { stills, FOCUS } from './stills'
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
function StillGrid({ hidden }) {
  return (
    <div className={`still-grid${hidden ? ' is-hidden' : ''}`}>
      {stills.map((s, i) => (
        <Viewfinder key={i} className="still-grid__frame" active={i === FOCUS}>
          {s.src ? (
            <img className="still-grid__img" src={s.src} alt="" decoding="async" />
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

function Hero() {
  const [sceneReady, setSceneReady] = useState(false)
  const [contextLost, setContextLost] = useState(false)
  const use3D = useSyncExternalStore(subscribe, motionAllowed) && hasWebGL2() && !contextLost

  return (
    <section className="hero container" aria-labelledby="hero-title">
      <div className="hero__stage" aria-hidden="true">
        <StillGrid hidden={use3D && sceneReady} />
        {use3D && (
          <SceneBoundary>
            <Suspense fallback={null}>
              <HeroScene onReady={() => setSceneReady(true)} onLost={() => setContextLost(true)} />
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
          <Button to="/works" variant="primary">
            See the works
          </Button>
          <Button to="/contact">Get in touch</Button>
        </div>
      </div>
    </section>
  )
}

const workMeta = (w) => [w.date?.slice(0, 4), w.type, w.shot_on]

function FeaturedWorks() {
  const [state, setState] = useState({ status: 'loading', works: [], total: 0 })

  useEffect(() => {
    let live = true
    getWorks()
      .then((all) => live && setState({ status: 'ok', works: all.slice(0, 3), total: all.length }))
      .catch(() => live && setState({ status: 'error', works: [], total: 0 }))
    return () => {
      live = false
    }
  }, [])

  const { status, works, total } = state

  return (
    <Section title="Latest works" id="latest-works">
      {status === 'loading' && (
        <ul className="home-grid" aria-busy="true" aria-label="Loading works">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Viewfinder className="home-skeleton">
                <span className="media-card__empty" />
              </Viewfinder>
            </li>
          ))}
        </ul>
      )}
      {status === 'error' && (
        <p className="home-note">
          The works feed is offline right now. <Link to="/works">Try the works page</Link> in a moment.
        </p>
      )}
      {status === 'ok' && works.length === 0 && <p className="home-note">No works published yet.</p>}
      {works.length > 0 && (
        <ul className="home-grid">
          {works.map((w, i) => (
            <li key={w.slug}>
              <MediaCard
                to={`/works/${w.slug}`}
                cover={w.cover_url}
                title={w.title}
                summary={w.summary}
                meta={workMeta(w)}
                index={i + 1}
                total={total}
              />
            </li>
          ))}
        </ul>
      )}
      <div className="home-more">
        <Button to="/works" variant="ghost">
          All works
        </Button>
      </div>
    </Section>
  )
}

function FeaturedProducts() {
  return (
    <Section title="Live products" id="live-products">
      <ul className="home-grid">
        {products.map((p, i) => (
          <li key={p.slug}>
            <MediaCard
              to={`/products/${p.slug}`}
              cover={p.screenshots?.desktop}
              alt={p.screenshots?.desktop ? `${p.name} on desktop` : ''}
              title={p.name}
              summary={p.summary}
              meta={[p.status, p.tagline]}
              index={i + 1}
              total={products.length}
              badge={
                p.badge && (
                  <span className="home-badge t-label">
                    <RecDot pulse={false} /> {p.badge}
                  </span>
                )
              }
            />
          </li>
        ))}
      </ul>
      <div className="home-more">
        <Button to="/products" variant="ghost">
          All products
        </Button>
      </div>
    </Section>
  )
}

export default function Home() {
  return (
    <>
      <title>{`${profile.name} · Engineer who also shoots`}</title>
      <meta
        name="description"
        content={`${profile.name}: ${profile.titles.join(' and ')} in Indonesia. An engineer who also shoots.`}
      />
      <Hero />
      <FeaturedWorks />
      <FeaturedProducts />
    </>
  )
}
