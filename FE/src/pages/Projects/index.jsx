import { FrameCounter, MetaRow } from '../../components/ui'
import { projects } from '../../data/projects'
import './Projects.scss'

export default function Projects() {
  return (
    <div className="projects container">
      <title>Projects · Jose Andreas Lie</title>
      <meta name="description" content="Selected projects by Jose Andreas Lie: backend, iOS and Android builds from the Apple Developer Academy, industry work and personal projects." />
      <header className="projects__head">
        <h1 className="t-display">
          Selected <em>projects</em>
        </h1>
        <p className="prose t-dim">
          Team builds from the Apple Developer Academy, an HRIS internship and a personal Android app. Backend, iOS and Android.
        </p>
      </header>

      <ol className="projects__list">
        {projects.map((p, i) => (
          <li key={p.slug} className="project" style={{ '--i': i }}>
            <div className="project__rail">
              <FrameCounter index={i + 1} total={projects.length} />
              <MetaRow items={[p.year, p.role]} />
            </div>
            <div className="project__main">
              <h2 className="project__title t-headline">{p.title}</h2>
              <p className="project__company t-label t-dim">{p.company}</p>
              <p className="project__summary">{p.summary}</p>
              <dl className="project__notes">
                {p.notes.map((n) => (
                  <div key={n.label}>
                    <dt className="t-label t-dim">{n.label}</dt>
                    <dd>{n.text}</dd>
                  </div>
                ))}
              </dl>
              <ul className="project__tags" aria-label="Stack">
                {p.tags.map((t) => (
                  <li key={t} className="t-label">
                    {t}
                  </li>
                ))}
              </ul>
              {p.links.length > 0 && (
                <ul className="project__links">
                  {p.links.map((l) => (
                    <li key={l.url}>
                      <a href={l.url} target="_blank" rel="noreferrer">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
