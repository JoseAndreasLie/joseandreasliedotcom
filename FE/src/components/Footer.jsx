import { FiGithub, FiLinkedin, FiInstagram, FiMail } from 'react-icons/fi'
import { profile } from '../data/portfolio'
import './Footer.scss'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p>&copy; {new Date().getFullYear()} {profile.name}</p>
        <div className="footer__socials">
          <a href={profile.social.github} target="_blank" rel="noreferrer" aria-label="GitHub">
            <FiGithub />
          </a>
          <a href={profile.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <FiLinkedin />
          </a>
          <a href={profile.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
            <FiInstagram />
          </a>
          <a href={`mailto:${profile.email}`} aria-label="Email">
            <FiMail />
          </a>
        </div>
      </div>
    </footer>
  )
}
