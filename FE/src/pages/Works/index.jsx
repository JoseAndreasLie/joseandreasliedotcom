import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MediaCard, Viewfinder, Button, Rule } from '../../components/ui'
import { getWorks } from '../../lib/api'
import { TYPES, cardMeta } from './works'
import './Works.scss'

const FILTERS = [['', 'All'], ...TYPES.map((t) => [t, t[0].toUpperCase() + t.slice(1)])]
const SKELETONS = 6

export default function Works() {
  const [params] = useSearchParams()
  const raw = params.get('type')
  const type = TYPES.includes(raw) ? raw : ''
  const label = FILTERS.find(([t]) => t === type)[1]

  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let live = true
    setState({ status: 'loading' })
    getWorks({ type: type || undefined }).then(
      (works) => live && setState({ status: 'ready', works }),
      (error) => live && setState({ status: 'error', error }),
    )
    return () => {
      live = false
    }
  }, [type, attempt])

  const n = state.works?.length ?? 0
  const status =
    state.status === 'loading' ? 'Loading' : state.status === 'error' ? 'Offline' : `${n} ${n === 1 ? 'frame' : 'frames'}`

  return (
    <div className="works container">
      <title>{type ? `${label} · Works · Jose Andreas Lie` : 'Works · Jose Andreas Lie'}</title>
      <meta name="description" content="Video edits, photoshoots, projects and writing by Jose Andreas Lie, newest first." />

      <header className="works__head">
        <h1 className="t-display">Works</h1>
        <p className="works__lede">Video edits, photoshoots, projects and writing. Newest frame first.</p>
      </header>

      <div className="works__bar">
        <nav aria-label="Filter works by type">
          <ul className="works__filters">
            {FILTERS.map(([t, name]) => (
              <li key={name}>
                <Link
                  className="works__filter"
                  to={{ search: t ? `?type=${t}` : '' }}
                  aria-current={t === type ? 'page' : undefined}
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="works__count t-label" role="status">
          {status}
        </p>
      </div>
      <Rule />

      {state.status === 'loading' && (
        <ul className="works__grid" aria-hidden="true">
          {Array.from({ length: SKELETONS }, (_, i) => (
            <li key={i} className="works__skeleton">
              <Viewfinder className="works__skeleton-frame">
                <span />
              </Viewfinder>
              <span className="works__skeleton-line works__skeleton-line--short" />
              <span className="works__skeleton-line" />
              <span className="works__skeleton-line works__skeleton-line--short" />
            </li>
          ))}
        </ul>
      )}

      {state.status === 'error' && (
        <div className="works__state">
          <Viewfinder className="works__state-frame">
            <p className="t-label">No signal</p>
          </Viewfinder>
          <h2 className="t-headline">Works could not load.</h2>
          <p className="t-dim">{state.error.message}</p>
          <Button variant="primary" onClick={() => setAttempt((a) => a + 1)}>
            Try again
          </Button>
        </div>
      )}

      {state.status === 'ready' && n === 0 && (
        <div className="works__state">
          <Viewfinder className="works__state-frame">
            <p className="t-label">FR 000</p>
          </Viewfinder>
          <h2 className="t-headline">{type ? `No ${type} works yet.` : 'Nothing published yet.'}</h2>
          <p className="t-dim">{type ? 'Try another type, or see everything.' : 'New frames land here as they ship.'}</p>
          {type && <Button to="/works">Show all works</Button>}
        </div>
      )}

      {state.status === 'ready' && n > 0 && (
        <ul className="works__grid">
          {state.works.map((w, i) => (
            <li key={w.id ?? w.slug} className="works__item" style={{ '--i': Math.min(i, 8) }}>
              <MediaCard
                to={`/works/${encodeURIComponent(w.slug)}`}
                cover={w.cover_url}
                title={w.title}
                summary={w.summary}
                meta={cardMeta(w)}
                index={i + 1}
                total={n}
                headingLevel={2}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
