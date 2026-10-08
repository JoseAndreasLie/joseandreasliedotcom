import { profile } from '../data/portfolio'
import { Logo, MetaRow } from './ui'
import './Footer.scss'

const links = [
  { label: 'GitHub', href: profile.social.github },
  { label: 'Instagram', href: profile.social.instagram },
  { label: 'LinkedIn', href: profile.social.linkedin },
  { label: 'Email', href: `mailto:${profile.email}` },
  { label: 'CV', href: profile.resume },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__id">
          <Logo size={32} title={null} />
          <MetaRow items={[`© ${new Date().getFullYear()} ${profile.name}`, 'Indonesia']} />
        </div>
        <ul className="footer__links">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
