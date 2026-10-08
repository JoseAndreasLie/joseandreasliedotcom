import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import { projects } from '../data/portfolio'
import './Projects.scss'

export default function Projects() {
  return (
    <PageTransition>
      <section className="section" style={{ paddingTop: 140 }}>
        <div className="container">
          <p className="eyebrow">Selected Work</p>
          <h2 className="section-title">Projects</h2>
          <div className="projects-grid">
            {projects.map((project, i) => (
              <motion.article
                key={project.name}
                className="project-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
              >
                <h3>{project.name}</h3>
                <p className="project-card__meta">
                  {project.role} · {project.company}
                </p>
                <p className="project-card__goal">{project.goal}</p>
                <ul className="project-card__stack">
                  {project.stack.map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
                <p className="project-card__insight">{project.insight}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
