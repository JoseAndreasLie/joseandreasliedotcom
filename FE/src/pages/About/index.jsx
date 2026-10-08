import { Button, MetaRow, RecDot, Section } from '../../components/ui'
import { education, experience, organizations, profile, skills } from '../../data/portfolio'
import './About.scss'

function Timeline({ entries }) {
  return (
    <ol className="timeline">
      {entries.map((e) => {
        const current = e.period.endsWith('Present')
        return (
          <li key={`${e.role}${e.period}`} className="timeline__item">
            <p className="timeline__when meta-row">
              {current && <RecDot label="Current role" />}
              {e.period.replace('Present', 'Now')}
            </p>
            <div className="timeline__body">
              <h3 className="t-title">{e.role}</h3>
              <p className="t-dim">{e.company}</p>
              <ul className="timeline__points">
                {e.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function About() {
  return (
    <div className="about">
      <title>About · Jose Andreas Lie</title>
      <meta
        name="description"
        content={`About ${profile.name}: ${profile.titles.join(' and ')} in ${profile.location}. Experience, skills, education and CV.`}
      />

      <header className="about__intro container">
        <h1 className="t-display">
          I build the product, and lead the <em>team</em> that ships it.
        </h1>
        <MetaRow items={[profile.titles.join(' · '), profile.location]} />
        <div className="about__bio prose">
          <p>{profile.bio}</p>
          <p>{profile.extendedBio}</p>
        </div>
        <div className="about__actions">
          <Button variant="primary" href={profile.resume} download>
            Download CV
          </Button>
          <Button to="/contact">Get in touch</Button>
        </div>
      </header>

      <Section label="Experience" id="experience">
        <Timeline entries={experience} />
      </Section>

      <Section label="Skills" id="skills">
        <div className="skills">
          {skills.map((g) => (
            <div key={g.group} className="skills__group">
              <h3 className="t-label t-dim">{g.group}</h3>
              <ul>
                {g.items.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Education" id="education">
        <ol className="timeline">
          {education.map((e) => (
            <li key={e.school} className="timeline__item">
              <MetaRow className="timeline__when" items={[e.period, e.status]} />
              <div className="timeline__body">
                <h3 className="t-title">{e.school}</h3>
                <p className="t-dim">{e.location}</p>
                <p>
                  {e.degree} · {e.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section label="Organizations" id="organizations">
        <Timeline entries={organizations} />
      </Section>
    </div>
  )
}
