import { Link } from 'react-router-dom'
import { FrameCounter, LoadState, MetaRow, Viewfinder } from '../../components/ui'
import { list } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import './Projects.scss'

export default function Projects() {
  const state = useFetch(() => list('projects'), [])
  const projects = state.data ?? []

  return (
    <div className="projects container">
      <title>Projects · Jose Andreas Lie</title>
      <meta name="description" content="Selected projects by Jose Andreas Lie: backend, iOS and Android builds from the Apple Developer Academy, industry work and personal projects." />
      <header className="projects__head">
        <h1 className="t-display">
          Selected <em>projects</em>
        </h1>
        <p className="prose t-dim">
          Team builds from the Apple Developer Academy, industry work and personal apps. Backend, iOS and Android.
        </p>
      </header>

      <LoadState state={state} noun="Projects" empty="No projects published yet." />

      {projects.length > 0 && (
        <ol className="projects__list">
          {projects.map((p, i) => (
            <li key={p.slug} className="project" style={{ '--i': i }}>
              <div className="project__rail">
                <FrameCounter index={i + 1} total={projects.length} />
                <MetaRow items={[p.year, p.role]} />
                {p.cover_url && (
                  <Viewfinder className="project__cover">
                    <img src={p.cover_url} alt="" loading="lazy" decoding="async" />
                  </Viewfinder>
                )}
              </div>
              <div className="project__main">
                <h2 className="project__title t-headline">
                  <Link to={`/projects/${encodeURIComponent(p.slug)}`}>{p.title}</Link>
                </h2>
                {p.company && <p className="project__company t-label t-dim">{p.company}</p>}
                {p.summary && <p className="project__summary">{p.summary}</p>}
                {p.notes.length > 0 && (
                  <dl className="project__notes">
                    {p.notes.map((n) => (
                      <div key={n.label}>
                        <dt className="t-label t-dim">{n.label}</dt>
                        <dd>{n.text}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {p.tags.length > 0 && (
                  <ul className="project__tags" aria-label="Stack">
                    {p.tags.map((t) => (
                      <li key={t} className="t-label">
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
                <Link className="project__more t-label" to={`/projects/${encodeURIComponent(p.slug)}`} aria-hidden="true" tabIndex={-1}>
                  Read more →
                </Link>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
