import { useRef, useState } from 'react'
import emailjs from '@emailjs/browser'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import { profile } from '../data/portfolio'
import './Contact.scss'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export default function Contact() {
  const formRef = useRef(null)
  const [status, setStatus] = useState('idle')

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      setStatus('missing-config')
      return
    }

    setStatus('sending')
    emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, PUBLIC_KEY).then(
      () => {
        setStatus('sent')
        formRef.current.reset()
      },
      () => setStatus('error')
    )
  }

  return (
    <PageTransition>
      <section className="section contact" style={{ paddingTop: 140, borderBottom: 'none' }}>
        <div className="container contact__grid">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="eyebrow">Contact</p>
            <h2 className="section-title">Let&rsquo;s Connect</h2>
            <p className="contact__text">
              Open to backend engineering roles, collaborations, and interesting problems. Reach out directly or use the form.
            </p>
            <ul className="contact__list">
              <li>
                <span>Email</span>
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </li>
              <li>
                <span>Phone</span>
                <a href={`tel:${profile.phone.replace(/\s/g, '')}`}>{profile.phone}</a>
              </li>
              <li>
                <span>LinkedIn</span>
                <a href={profile.social.linkedin} target="_blank" rel="noreferrer">
                  jose-andreas-lie
                </a>
              </li>
            </ul>
          </motion.div>

          <motion.form
            ref={formRef}
            className="contact__form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <label>
              Name
              <input type="text" name="user_name" required />
            </label>
            <label>
              Email
              <input type="email" name="user_email" required />
            </label>
            <label>
              Message
              <textarea name="message" rows={5} required />
            </label>
            <button type="submit" className="btn btn--primary" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending...' : 'Send Message'}
            </button>

            {status === 'sent' && <p className="contact__status contact__status--ok">Message sent. Thank you.</p>}
            {status === 'error' && <p className="contact__status contact__status--err">Something went wrong. Try again.</p>}
            {status === 'missing-config' && (
              <p className="contact__status contact__status--err">
                Email service not configured yet. Set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID and VITE_EMAILJS_PUBLIC_KEY in a .env file.
              </p>
            )}
          </motion.form>
        </div>
      </section>
    </PageTransition>
  )
}
