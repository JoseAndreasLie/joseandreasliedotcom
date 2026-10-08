import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import { experience, education, organizations, goingNext } from '../data/portfolio'
import './Experience.scss'

export default function Experience() {
  return (
    <PageTransition>
      <section className="section" style={{ paddingTop: 140 }}>
        <div className="container">
          <p className="eyebrow">Career</p>
          <h2 className="section-title">Work Experience</h2>
          <div className="timeline">
            {experience.map((job, i) => (
              <motion.div
                key={job.role + job.period}
                className="timeline__item"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <div className="timeline__head">
                  <h3>{job.role}</h3>
                  <span>{job.period}</span>
                </div>
                <p className="timeline__company">{job.company}</p>
                <ul>
                  {job.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="eyebrow">Leadership</p>
          <h2 className="section-title">Organizations</h2>
          <div className="timeline">
            {organizations.map((org, i) => (
              <motion.div
                key={org.role}
                className="timeline__item"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <div className="timeline__head">
                  <h3>{org.role}</h3>
                  <span>{org.period}</span>
                </div>
                <p className="timeline__company">{org.company}</p>
                <ul>
                  {org.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="eyebrow">Academics</p>
          <h2 className="section-title">Education</h2>
          {education.map((edu) => (
            <motion.div
              key={edu.school}
              className="edu-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5 }}
            >
              <h3>{edu.school}</h3>
              <p>{edu.location}</p>
              <p>{edu.degree}, {edu.detail}</p>
              <span>{edu.period}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="section" style={{ borderBottom: 'none' }}>
        <div className="container">
          <p className="eyebrow">Looking Ahead</p>
          <h2 className="section-title">Where I&rsquo;m Going</h2>
          <ul className="going-next">
            {goingNext.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                {item}
              </motion.li>
            ))}
          </ul>
        </div>
      </section>
    </PageTransition>
  )
}
