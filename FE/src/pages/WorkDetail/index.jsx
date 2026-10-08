import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Markdown from 'react-markdown'
import { FiArrowLeft, FiArrowUpRight } from 'react-icons/fi'
import { Viewfinder, MetaRow, FrameCounter, Button, Rule } from '../../components/ui'
import { getWork } from '../../lib/api'
import { formatDate } from '../Works/works'
import { safeEmbed, safeHref } from './media'
import Lightbox from './Lightbox'
import './WorkDetail.scss'

const SITE = 'Jose Andreas Lie'

// Markdown: raw HTML skipped, URLs pass react-markdown's default sanitizer plus safeHref. A body `#` becomes h2 so the page keeps one h1.
const md = {
  h1: 'h2',
  a: ({ href, children }) => {
    const safe = safeHref(href)
    if (!safe) return <span>{children}</span>
    const external = /^https?:/.test(safe)
    return (
      <a href={safe} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    )
  },
  img: ({ src, alt }) => <img src={src} alt={alt || ''} loading="lazy" decoding="async" />,
}

function BackLink() {
  return (
    <Link className="work__back" to="/works">
      <FiArrowLeft aria-hidden="true" /> All works
    </Link>
  )
}

export default function WorkDetail() {
  const { slug } = useParams()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading' })
  const [open, setOpen] = useState(null)

  useEffect(() => {
    let live = true
    setState({ status: 'loading' })
    getWork(slug).then(
      (work) => live && setState({ status: 'ready', work }),
      (error) => live && setState({ status: 'error', error }),
    )
    return () => {
      live = false
    }
  }, [slug, attempt])

  if (state.status === 'loading') {
    return (
      <div className="work container" aria-busy="true">
        <title>{`Works · ${SITE}`}</title>
        <BackLink />
        <p className="visually-hidden" role="status">
          Loading work
        </p>
        <div className="work__skeleton" aria-hidden="true">
          <span className="work__skeleton-line work__skeleton-line--short" />
          <span className="work__skeleton-line work__skeleton-line--title" />
          <span className="work__skeleton-line" />
          <Viewfinder className="work__frame work__frame--wide">
            <span className="work__skeleton-fill" />
          </Viewfinder>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    const missing = state.error.status === 404
    return (
      <div className="work container">
        <title>{`${missing ? 'Not found' : 'Error'} · Works · ${SITE}`}</title>
        <BackLink />
        <div className="work__state">
          <Viewfinder className="work__state-frame">
            <p className="t-label">{missing ? 'FR 404' : 'No signal'}</p>
          </Viewfinder>
          <h1 className="t-headline">{missing ? 'This frame does not exist.' : 'This work could not load.'}</h1>
          <p className="t-dim">
            {missing ? 'It may have been moved, renamed or taken down.' : state.error.message}
          </p>
          {missing ? (
            <Button to="/works">Browse all works</Button>
          ) : (
            <Button variant="primary" onClick={() => setAttempt((a) => a + 1)}>
              Try again
            </Button>
          )}
        </div>
      </div>
    )
  }

  const w = state.work
  const media = Array.isArray(w.media) ? w.media : []
  const embeds = media.map((m) => m?.kind === 'embed' && safeEmbed(m.url)).filter(Boolean)
  const images = media.filter((m) => m?.kind === 'image' && m.url)
  const links = (w.links || []).map((l) => ({ ...l, url: safeHref(l?.url) })).filter((l) => l.url)
  const tags = (w.tags || []).filter(Boolean)
  const date = formatDate(w.date)

  return (
    <article className="work container">
      <title>{`${w.title} · Works · ${SITE}`}</title>
      {w.summary && <meta name="description" content={w.summary} />}

      <BackLink />

      <header className="work__head">
        <MetaRow items={[date, w.type?.toUpperCase(), w.shot_on]} />
        <h1 className="t-display work__title">{w.title}</h1>
        {w.summary && <p className="work__summary">{w.summary}</p>}
      </header>

      {embeds.map((src, i) => (
        <Viewfinder key={src} className="work__frame work__frame--wide">
          <iframe
            className="work__embed"
            src={src}
            title={embeds.length > 1 ? `${w.title}, video ${i + 1}` : `${w.title}, video`}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </Viewfinder>
      ))}

      {!embeds.length && !images.length && w.cover_url && (
        <Viewfinder className="work__frame work__frame--cover">
          <img className="work__cover" src={w.cover_url} alt="" decoding="async" />
        </Viewfinder>
      )}

      {images.length > 0 && (
        <section className="work__gallery" aria-labelledby="work-gallery">
          <h2 id="work-gallery" className="visually-hidden">
            Gallery
          </h2>
          <ul className="work__sheet">
            {images.map((m, i) => (
              <li key={`${m.url}-${i}`}>
                <button
                  type="button"
                  className="work__thumb"
                  aria-haspopup="dialog"
                  onClick={() => setOpen(i)}
                >
                  <span className="visually-hidden">
                    {`Open image ${i + 1} of ${images.length}${m.alt ? `: ${m.alt}` : ''}`}
                  </span>
                  <Viewfinder className="work__thumb-frame">
                    <img src={m.thumb_url || m.url} alt="" loading="lazy" decoding="async" />
                  </Viewfinder>
                  <span aria-hidden="true">
                    <FrameCounter index={i + 1} total={images.length} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Rule />

      <div className="work__body">
        {w.body ? (
          <div className="work__prose prose">
            <Markdown skipHtml components={md}>
              {w.body}
            </Markdown>
          </div>
        ) : (
          <div />
        )}

        {(links.length > 0 || tags.length > 0) && (
          <aside className="work__side" aria-label="Links and tags">
            {links.length > 0 && (
              <div className="work__group">
                <h2 className="t-label t-dim">Links</h2>
                <ul className="work__links">
                  {links.map((l) => {
                    const external = /^https?:/.test(l.url)
                    return (
                      <li key={l.url}>
                        <a
                          href={l.url}
                          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        >
                          {l.label || l.url}
                          <FiArrowUpRight aria-hidden="true" />
                          {external && <span className="visually-hidden"> (opens in a new tab)</span>}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            {tags.length > 0 && (
              <div className="work__group">
                <h2 className="t-label t-dim">Tags</h2>
                <ul className="work__tags">
                  {tags.map((t) => (
                    <li key={t} className="t-label">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        )}
      </div>

      {open !== null && (
        <Lightbox images={images} index={open} onIndex={setOpen} onClose={() => setOpen(null)} title={w.title} />
      )}
    </article>
  )
}
