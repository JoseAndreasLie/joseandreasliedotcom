import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import { profile, skills, whatIDo } from '../data/portfolio'
import './Home.scss'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function Home() {
  return (
    <PageTransition>
      <section className="hero section">
        <motion.div
          className="container"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.p className="eyebrow" variants={item}>
            {profile.location}
          </motion.p>
          <motion.h1 variants={item}>
            {profile.name}
          </motion.h1>
          <motion.p className="hero__titles" variants={item}>
            {profile.titles.join(' · ')}
          </motion.p>
          <motion.p className="hero__bio" variants={item}>
            {profile.bio}
          </motion.p>
          <motion.div className="hero__actions" variants={item}>
            <Link to="/projects" className="btn btn--primary">
              View Projects
            </Link>
            <Link to="/contact" className="btn btn--ghost">
              Get in Touch
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section className="section">
        <div className="container">
          <p className="eyebrow">About</p>
          <h2 className="section-title">Who I Am</h2>
          <motion.p
            className="about__text"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
          >
            {profile.extendedBio}
          </motion.p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="eyebrow">What I Do</p>
          <h2 className="section-title">Focus Areas</h2>
          <div className="grid-cards">
            {whatIDo.map((thing, i) => (
              <motion.div
                key={thing}
                className="grid-cards__item"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                {thing}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ borderBottom: 'none' }}>
        <div className="container">
          <p className="eyebrow">Skills</p>
          <h2 className="section-title">My Tech Stack</h2>
          <div className="skills">
            {skills.map((group, i) => (
              <motion.div
                key={group.group}
                className="skills__group"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <h3>{group.group}</h3>
                <ul>
                  {group.items.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
