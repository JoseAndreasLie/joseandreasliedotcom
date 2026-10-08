import { useRef, useState } from 'react'
import emailjs from '@emailjs/browser'
import { Button, MetaRow, Rule } from '../../components/ui'
import { profile } from '../../data/portfolio'
import './Contact.scss'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate({ user_name, user_email, message }) {
  const e = {}
  if (!user_name.trim()) e.user_name = 'Enter your name.'
  if (!user_email.trim()) e.user_email = 'Enter your email so I can reply.'
  else if (!EMAIL_RE.test(user_email.trim())) e.user_email = 'That email looks incomplete. Check for a typo.'
  if (!message.trim()) e.message = 'Write a short message.'
  return e
}

const EMPTY = { user_name: '', user_email: '', message: '' }

const FIELDS = [
  { name: 'user_name', label: 'Name', type: 'text', autoComplete: 'name' },
  { name: 'user_email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'message', label: 'Message', multiline: true },
]

export default function Contact() {
  const formRef = useRef(null)
  const [values, setValues] = useState(EMPTY)
  const [touched, setTouched] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | sent | error | missing-config

  const errors = validate(values)
  const sending = status === 'sending'
  const whatsapp = `https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}`

  const onChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }))
    if (status === 'sent' || status === 'error') setStatus('idle')
  }
  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }))

  const onSubmit = (e) => {
    e.preventDefault()
    if (sending) return
    setTouched({ user_name: true, user_email: true, message: true })
    const first = FIELDS.find((f) => errors[f.name])
    if (first) {
      formRef.current.elements[first.name].focus()
      return
    }
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      setStatus('missing-config')
      return
    }
    setStatus('sending')
    // send() with explicit params (same names as the old sendForm fields) so disabling inputs can't drop them.
    emailjs.send(SERVICE_ID, TEMPLATE_ID, values, { publicKey: PUBLIC_KEY }).then(
      () => {
        setStatus('sent')
        setValues(EMPTY)
        setTouched({})
      },
      () => setStatus('error'),
    )
  }

  return (
    <div className="container contact">
      <title>Contact · Jose Andreas Lie</title>
      <meta
        name="description"
        content="Contact Jose Andreas Lie for project management and fullstack roles, collaborations and interesting problems. Email, WhatsApp, LinkedIn or the form."
      />

      <header className="contact__head">
        <h1 className="t-display">
          Say <em>hello</em>
        </h1>
        <p className="contact__lede">
          Open to project management and fullstack roles, collaborations and interesting problems. Write directly or use the form.
        </p>
      </header>

      <div className="contact__grid">
        <aside className="contact__direct" aria-labelledby="contact-direct">
          <h2 id="contact-direct" className="t-label t-dim">
            Direct
          </h2>
          <ul className="contact__list">
            <li>
              <span className="t-label t-dim">Email</span>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </li>
            <li>
              <span className="t-label t-dim">WhatsApp</span>
              <a href={whatsapp} target="_blank" rel="noreferrer">
                {profile.phone}
              </a>
            </li>
            <li>
              <span className="t-label t-dim">LinkedIn</span>
              <a href={profile.social.linkedin} target="_blank" rel="noreferrer">
                @joseandreaslie
              </a>
            </li>
          </ul>
          <MetaRow items={[profile.location, 'UTC+7']} />
        </aside>

        <form ref={formRef} className="contact__form" onSubmit={onSubmit} noValidate aria-labelledby="contact-form">
          <h2 id="contact-form" className="t-label t-dim">
            Form
          </h2>
          <Rule />
          {FIELDS.map((f) => {
            const err = touched[f.name] && errors[f.name]
            const Tag = f.multiline ? 'textarea' : 'input'
            return (
              <div key={f.name} className={`cfield${err ? ' cfield--error' : ''}`}>
                <label htmlFor={`c-${f.name}`} className="t-label">
                  {f.label}
                </label>
                <Tag
                  id={`c-${f.name}`}
                  name={f.name}
                  type={f.type}
                  rows={f.multiline ? 6 : undefined}
                  autoComplete={f.autoComplete}
                  value={values[f.name]}
                  onChange={onChange}
                  onBlur={onBlur}
                  disabled={sending}
                  required
                  aria-invalid={err ? true : undefined}
                  aria-describedby={err ? `c-${f.name}-err` : undefined}
                />
                {err && (
                  <p id={`c-${f.name}-err`} className="cfield__error">
                    {err}
                  </p>
                )}
              </div>
            )
          })}

          <div className="contact__actions">
            <Button type="submit" variant="primary" disabled={sending}>
              {sending ? 'Sending' : 'Send message'}
            </Button>
            <p className="contact__status" role="status" aria-live="polite">
              {status === 'sending' && 'Sending your message.'}
              {status === 'sent' && 'Message sent. Thank you, I will reply soon.'}
              {status === 'error' && (
                <span className="contact__status--err">
                  Could not send. Try again, or email <a href={`mailto:${profile.email}`}>{profile.email}</a>.
                </span>
              )}
              {status === 'missing-config' && (
                <span className="contact__status--err">
                  The form is not connected yet. Email <a href={`mailto:${profile.email}`}>{profile.email}</a> instead.
                </span>
              )}
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
