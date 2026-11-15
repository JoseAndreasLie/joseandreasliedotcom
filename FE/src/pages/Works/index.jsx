import { Link, useSearchParams } from 'react-router-dom'
import { LoadState, MediaCard, Viewfinder, Button, Rule } from '../../components/ui'
import { list } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import { SITE } from '../../data/portfolio'
import { TYPES, cardMeta } from './works'
import './Works.scss'

const FILTERS = [['', 'All'], ...TYPES.map((t) => [t, t[0].toUpperCase() + t.slice(1)])]
const SKELETONS = 6

export default function Works() {
  const [params] = useSearchParams()
  const raw = params.get('type')
  const type = TYPES.includes(raw) ? raw : ''
  const label = FILTERS.find(([t]) => t === type)[1]

  const state = useFetch(() => list('works', { type: type || undefined }), [type])
  const works = state.status === 'ready' ? state.data : []

  const n = works.length
  const status =
    state.status === 'loading' ? 'Loading' : state.status === 'error' ? 'Offline' : `${n} ${n === 1 ? 'post' : 'posts'}`

  return (
    <div className="works container">
      <title>{type ? `${label} · Behind the Lens · ${SITE}` : `Behind the Lens · ${SITE}`}</title>
      <meta name="description" content="Behind the Lens: photoshoots and video edits by Jose Andreas Lie, newest first." />

      <header className="works__head">
        <h1 className="t-display">
          Behind the <em>Lens</em>
        </h1>
        <p className="works__lede">Photoshoots and video edits, away from the keyboard. Newest first.</p>
      </header>

      <div className="works__bar">
        <nav aria-label="Filter by photo or video">
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

      {state.status === 'error' && <LoadState state={state} noun="Photos and videos" />}

      {state.status === 'ready' && n === 0 && (
        <div className="works__state">
          <Viewfinder className="works__state-frame">
            <p className="t-label">Nothing here yet</p>
          </Viewfinder>
          <h2 className="t-headline">{type ? `No ${type}s yet.` : 'Nothing published yet.'}</h2>
          <p className="t-dim">{type ? 'Try another type, or see everything.' : 'New work lands here as it ships.'}</p>
          {type && <Button to="/lens">Show everything</Button>}
        </div>
      )}

      {state.status === 'ready' && n > 0 && (
        <ul className="works__grid">
          {works.map((w, i) => (
            <li key={w.id ?? w.slug} className="works__item" style={{ '--i': Math.min(i, 8) }}>
              <MediaCard
                to={`/lens/${encodeURIComponent(w.slug)}`}
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
