import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Button, Rule } from '../../components/ui'
import { createWork, login, updateWork, uploadImage } from '../../lib/api'

const TYPES = ['video', 'photo', 'project', 'writing']
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
// Mirrors BE/src/validate.js embed rule: host -> required path prefix.
const EMBED_PATHS = {
  'youtube.com': '/embed/',
  'www.youtube.com': '/embed/',
  'youtube-nocookie.com': '/embed/',
  'www.youtube-nocookie.com': '/embed/',
  'player.vimeo.com': '/video/',
}

const slugify = (s) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

function parseUrl(s) {
  try {
    return new URL(s)
  } catch {
    return null
  }
}
const isEmbedUrl = (s) => {
  const u = parseUrl(s)
  const prefix = u && Object.hasOwn(EMBED_PATHS, u.hostname) && EMBED_PATHS[u.hostname]
  return u?.protocol === 'https:' && !!prefix && u.pathname.startsWith(prefix) && s.length <= 2048
}
const isHttpUrl = (s) => ['http:', 'https:'].includes(parseUrl(s)?.protocol)
const parseTags = (s) => [...new Set(s.split(',').map((t) => t.trim()).filter(Boolean))]
// Mirrors BE length caps.
const MAX_URL = 2048
const MAX_MEDIA = 50

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toForm(w) {
  return {
    slug: w?.slug ?? '',
    type: w?.type ?? 'photo',
    title: w?.title ?? '',
    summary: w?.summary ?? '',
    body: w?.body ?? '',
    cover_url: w?.cover_url ?? '',
    media: w?.media ?? [],
    links: w?.links ?? [],
    tags: (w?.tags ?? []).join(', '),
    shot_on: w?.shot_on ?? '',
    date: w?.date ?? today(),
    published: w?.published ?? false,
  }
}

// PUT is a full replacement on the BE, so every field is always sent.
function toPayload(f) {
  return {
    slug: f.slug.trim(),
    type: f.type,
    title: f.title.trim(),
    summary: f.summary,
    body: f.body,
    cover_url: f.cover_url.trim() || null,
    media: f.media,
    links: f.links.map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
    tags: parseTags(f.tags),
    shot_on: f.shot_on.trim() || null,
    date: f.date || null,
    published: f.published,
  }
}

function validate(f) {
  const e = {}
  if (!f.title.trim()) e.title = 'Title is required.'
  if (!f.slug.trim()) e.slug = 'Slug is required.'
  else if (!SLUG_RE.test(f.slug.trim())) e.slug = 'Use lowercase letters, digits and single dashes, e.g. lombok-film.'
  const c = f.cover_url.trim()
  if (c && !/^\/media\/[\w.-]+$/.test(c) && parseUrl(c)?.protocol !== 'https:') e.cover_url = 'Use a /media path or an https URL.'
  const tags = parseTags(f.tags)
  if (tags.length > 30 || tags.some((t) => t.length > 50)) e.tags = 'Up to 30 tags, 50 characters each.'
  if (f.media.length > MAX_MEDIA) e.media = `Up to ${MAX_MEDIA} media items. Remove some.`
  if (f.links.length > 20) e.links = 'Up to 20 links.'
  else if (f.links.some((l) => !l.label.trim() || !isHttpUrl(l.url.trim()))) e.links = 'Every link needs a label and an http(s) URL.'
  return e
}

// Server 400 messages start with the field name ("slug must be ..."); route them inline when they do.
const FIELD_OF_ERROR = /^(slug|title|type|cover_url|date|links|media|tags|summary|body|shot_on)\b/
const INLINE = ['title', 'slug', 'cover_url', 'tags', 'media', 'links']

export default function WorkForm({ work, onSaved, onCancel }) {
  const isNew = !work
  const [f, setF] = useState(() => toForm(work))
  const [slugEdited, setSlugEdited] = useState(!isNew)
  const [touched, setTouched] = useState({})
  const [serverErrors, setServerErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [embed, setEmbed] = useState('')
  const [embedError, setEmbedError] = useState('')
  const [uploads, setUploads] = useState([]) // { id, name, progress, error }
  const [relogin, setRelogin] = useState(false) // token expired mid edit: sign in inline, keep the form
  const [password, setPassword] = useState('')
  const [reloginError, setReloginError] = useState('')
  const formRef = useRef(null)
  const fileRef = useRef(null)
  const headingRef = useRef(null)

  useEffect(() => headingRef.current?.focus(), [])

  const errors = { ...validate(f), ...serverErrors }
  const show = (k) => (touched[k] || touched._submit) && errors[k]

  const set = (k, v) => {
    setF((prev) => {
      const next = { ...prev, [k]: v }
      if (k === 'title' && !slugEdited) next.slug = slugify(v)
      return next
    })
    if (serverErrors[k] || (k === 'title' && serverErrors.slug)) setServerErrors({})
  }
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }))

  const field = (k, label, input, hint) => (
    <div className={`afield${show(k) ? ' afield--error' : ''}`}>
      <label htmlFor={`w-${k}`} className="t-label">
        {label}
      </label>
      {input}
      {hint && !show(k) && (
        <p id={`w-${k}-hint`} className="afield__hint">
          {hint}
        </p>
      )}
      {show(k) && (
        <p id={`w-${k}-err`} className="afield__error">
          {errors[k]}
        </p>
      )}
    </div>
  )
  const aria = (k, hasHint) => ({
    id: `w-${k}`,
    'aria-invalid': show(k) ? true : undefined,
    'aria-describedby': show(k) ? `w-${k}-err` : hasHint ? `w-${k}-hint` : undefined,
  })

  // Media
  const setMedia = (fn) => setF((prev) => ({ ...prev, media: fn(prev.media) }))

  const onFiles = async (e) => {
    const files = [...e.target.files]
    e.target.value = ''
    // ponytail: sequential uploads, parallel if bulk photo sets get slow.
    for (const file of files) {
      const id = `${file.name}-${file.lastModified}-${Math.random()}`
      setUploads((u) => [...u, { id, name: file.name, progress: 0, error: '' }])
      const patch = (p) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, ...p } : x)))
      try {
        const { url, thumb_url } = await uploadImage(file, (progress) => patch({ progress }))
        setF((prev) => ({
          ...prev,
          media: [...prev.media, { kind: 'image', url, thumb_url, alt: '' }],
          cover_url: prev.cover_url || url,
        }))
        setUploads((u) => u.filter((x) => x.id !== id))
      } catch (err) {
        if (err.status === 401) {
          setRelogin(true)
          patch({ error: 'Session expired. Sign in below, then upload again.' })
          continue
        }
        patch({ error: err.message })
      }
    }
  }

  const addEmbed = () => {
    const url = embed.trim()
    if (f.media.length >= MAX_MEDIA) {
      setEmbedError(`Up to ${MAX_MEDIA} media items.`)
      return
    }
    if (!isEmbedUrl(url)) {
      setEmbedError('Use an https embed URL: youtube.com/embed/…, youtube-nocookie.com/embed/… or player.vimeo.com/video/…')
      return
    }
    setMedia((m) => [...m, { kind: 'embed', url }])
    setEmbed('')
    setEmbedError('')
  }

  const move = (i, d) =>
    setMedia((m) => {
      const j = i + d
      if (j < 0 || j >= m.length) return m
      const next = [...m]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  // Links
  const setLink = (i, k, v) => {
    setF((prev) => ({ ...prev, links: prev.links.map((l, j) => (j === i ? { ...l, [k]: v } : l)) }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setTouched((t) => ({ ...t, _submit: true }))
    setServerErrors({})
    setFormError('')
    const clientErrors = validate(f)
    const firstKey = INLINE.find((k) => clientErrors[k])
    if (firstKey) {
      formRef.current.querySelector(`#w-${firstKey}, [data-field="${firstKey}"]`)?.focus()
      return
    }
    setSaving(true)
    try {
      const payload = toPayload(f)
      const saved = isNew ? await createWork(payload) : await updateWork(work.id, payload)
      onSaved(saved, isNew)
    } catch (err) {
      // Sync so the fieldset is enabled again before we move focus into it.
      flushSync(() => setSaving(false))
      if (err.status === 401) {
        setRelogin(true)
        return
      }
      if (err.status === 409) {
        setServerErrors({ slug: 'That slug is already used by another work. Pick a different one.' })
        setTouched((t) => ({ ...t, slug: true }))
        formRef.current.querySelector('#w-slug')?.focus()
        return
      }
      const k = err.status === 400 && err.message.match(FIELD_OF_ERROR)?.[1]
      if (k && INLINE.includes(k)) setServerErrors({ [k]: err.message })
      else setFormError(err.message)
    }
  }

  const uploading = uploads.some((u) => !u.error)

  const reauth = async () => {
    if (!password) return setReloginError('Enter the admin password.')
    setReloginError('')
    try {
      await login(password)
      setPassword('')
      setRelogin(false)
      setFormError('Signed in again. Save to keep your changes.')
    } catch (err) {
      setReloginError(err.status === 401 ? 'Wrong password.' : err.message)
    }
  }

  return (
    <form ref={formRef} className="admin-form" onSubmit={submit} noValidate>
      <header className="admin__bar">
        <h1 ref={headingRef} tabIndex={-1} className="t-headline">
          {isNew ? 'New work' : 'Edit work'}
        </h1>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Back to list
        </Button>
      </header>

      <fieldset className="admin-form__group" disabled={saving}>
        <legend className="t-label t-dim">Basics</legend>
        {field(
          'title',
          'Title',
          <input {...aria('title')} maxLength={200} value={f.title} onChange={(e) => set('title', e.target.value)} onBlur={blur('title')} required />,
        )}
        <div className="admin-form__row">
          {field(
            'slug',
            'Slug',
            <input
              {...aria('slug', true)}
              value={f.slug}
              onChange={(e) => {
                setSlugEdited(true)
                set('slug', e.target.value)
              }}
              onBlur={blur('slug')}
              maxLength={100}
              spellCheck={false}
              autoCapitalize="off"
              required
            />,
            isNew && !slugEdited ? 'Suggested from the title. Edit to override.' : `URL: /works/${f.slug || 'slug'}`,
          )}
          {field(
            'type',
            'Type',
            <select {...aria('type')} value={f.type} onChange={(e) => set('type', e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>,
          )}
        </div>
        <div className="admin-form__row">
          {field('date', 'Date', <input {...aria('date')} type="date" value={f.date} onChange={(e) => set('date', e.target.value)} />)}
          {field(
            'shot_on',
            'Shot on',
            <input {...aria('shot_on', true)} maxLength={100} value={f.shot_on} onChange={(e) => set('shot_on', e.target.value)} placeholder="SONY FX3" />,
            'Optional. Camera or gear.',
          )}
        </div>
        {field(
          'tags',
          'Tags',
          <input {...aria('tags', true)} value={f.tags} onChange={(e) => set('tags', e.target.value)} onBlur={blur('tags')} placeholder="travel, lombok" />,
          'Comma separated.',
        )}
        <label className="admin-switch">
          <input type="checkbox" role="switch" checked={f.published} onChange={(e) => set('published', e.target.checked)} />
          <span className="admin-switch__track" aria-hidden="true" />
          <span className="t-label">Published</span>
          <span className="t-dim" aria-hidden="true">
            {f.published ? 'Live on the site' : 'Draft, hidden from the site'}
          </span>
        </label>
      </fieldset>

      <fieldset className="admin-form__group" disabled={saving}>
        <legend className="t-label t-dim">Text</legend>
        {field(
          'summary',
          'Summary',
          <textarea {...aria('summary', true)} maxLength={500} rows={2} value={f.summary} onChange={(e) => set('summary', e.target.value)} />,
          'One or two sentences for cards.',
        )}
        {field(
          'body',
          'Body',
          <textarea {...aria('body', true)} maxLength={100000} className="admin-form__body" rows={14} value={f.body} onChange={(e) => set('body', e.target.value)} />,
          'Markdown.',
        )}
      </fieldset>

      <fieldset className="admin-form__group" disabled={saving}>
        <legend className="t-label t-dim">Media</legend>

        <div className="admin-cover">
          <div className="admin-cover__preview">
            {f.cover_url ? <img src={f.cover_url} alt="" /> : <span className="t-label t-dim">No cover</span>}
          </div>
          {field(
            'cover_url',
            'Cover URL',
            <input
              {...aria('cover_url', true)}
              value={f.cover_url}
              onChange={(e) => set('cover_url', e.target.value)}
              onBlur={blur('cover_url')}
              maxLength={MAX_URL}
              spellCheck={false}
            />,
            'Set from an uploaded image below, or paste a URL.',
          )}
        </div>

        <div className="admin-upload">
          <input
            ref={fileRef}
            id="w-files"
            type="file"
            accept="image/*"
            multiple
            onChange={onFiles}
            tabIndex={-1}
            aria-label="Upload images"
            className="visually-hidden"
          />
          <Button onClick={() => fileRef.current.click()} disabled={saving || f.media.length >= MAX_MEDIA}>
            Upload images
          </Button>
          <span className="afield__hint">Max 20 MB each. Resized to webp. Added to the gallery below.</span>
        </div>

        {uploads.length > 0 && (
          <ul className="admin-uploads" aria-live="polite">
            {uploads.map((u) => (
              <li key={u.id}>
                <span className="admin-uploads__name">{u.name}</span>
                {u.error ? (
                  <>
                    <span className="afield__error">{u.error}</span>
                    <Button variant="ghost" onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))}>
                      Dismiss
                    </Button>
                  </>
                ) : (
                  <>
                    <progress value={u.progress} max={1} aria-label={`Uploading ${u.name}`} />
                    <span className="t-label t-dim">{u.progress < 1 ? `${Math.round(u.progress * 100)}%` : 'Processing'}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className={`afield${embedError ? ' afield--error' : ''}`}>
          <label htmlFor="w-embed" className="t-label">
            Video embed URL
          </label>
          <div className="admin-inline">
            <input
              id="w-embed"
              type="url"
              value={embed}
              onChange={(e) => {
                setEmbed(e.target.value)
                setEmbedError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addEmbed()
                }
              }}
              placeholder="https://www.youtube.com/embed/..."
              maxLength={MAX_URL}
              spellCheck={false}
              aria-invalid={embedError ? true : undefined}
              aria-describedby={embedError ? 'w-embed-err' : 'w-embed-hint'}
            />
            <Button onClick={addEmbed}>Add embed</Button>
          </div>
          {embedError ? (
            <p id="w-embed-err" className="afield__error">
              {embedError}
            </p>
          ) : (
            <p id="w-embed-hint" className="afield__hint">
              YouTube or Vimeo embed link (https).
            </p>
          )}
        </div>

        {show('media') && <p className="afield__error" data-field="media" tabIndex={-1}>{errors.media}</p>}
        {f.media.length > 0 && (
          <ol className="admin-media">
            {f.media.map((m, i) => (
              <li key={`${m.url}-${i}`} className="admin-media__item">
                <div className="admin-media__thumb">
                  {m.kind === 'image' ? <img src={m.thumb_url} alt="" /> : <span className="t-label">Embed</span>}
                </div>
                <div className="admin-media__info">
                  {m.kind === 'image' ? (
                    <div className="afield">
                      <label htmlFor={`w-alt-${i}`} className="t-label">
                        Alt text
                      </label>
                      <input
                        id={`w-alt-${i}`}
                        value={m.alt}
                        onChange={(e) => setMedia((ms) => ms.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                        maxLength={200}
                        placeholder="Describe the image"
                      />
                    </div>
                  ) : (
                    <code className="admin-media__url">{m.url}</code>
                  )}
                  <div className="admin-media__actions">
                    {m.kind === 'image' &&
                      (f.cover_url === m.url ? (
                        <span className="admin-pill admin-pill--live">Cover</span>
                      ) : (
                        <Button variant="ghost" onClick={() => set('cover_url', m.url)}>
                          Set as cover
                        </Button>
                      ))}
                    <Button variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move item ${i + 1} up`}>
                      Up
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => move(i, 1)}
                      disabled={i === f.media.length - 1}
                      aria-label={`Move item ${i + 1} down`}
                    >
                      Down
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setMedia((ms) => ms.filter((_, j) => j !== i))
                        if (f.cover_url === m.url) set('cover_url', '')
                      }}
                      aria-label={`Remove item ${i + 1}`}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </fieldset>

      <fieldset className="admin-form__group" disabled={saving}>
        <legend className="t-label t-dim">Links</legend>
        {f.links.map((l, i) => (
          <div key={i} className="admin-link">
            <div className="afield">
              <label htmlFor={`w-link-label-${i}`} className="t-label">
                Label
              </label>
              <input
                id={`w-link-label-${i}`}
                data-field={i === 0 ? 'links' : undefined}
                value={l.label}
                onChange={(e) => setLink(i, 'label', e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="afield">
              <label htmlFor={`w-link-url-${i}`} className="t-label">
                URL
              </label>
              <input
                id={`w-link-url-${i}`}
                type="url"
                value={l.url}
                onChange={(e) => setLink(i, 'url', e.target.value)}
                maxLength={MAX_URL}
                placeholder="https://"
                spellCheck={false}
              />
            </div>
            <Button
              variant="ghost"
              onClick={() => setF((prev) => ({ ...prev, links: prev.links.filter((_, j) => j !== i) }))}
              aria-label={`Remove link ${i + 1}`}
            >
              Remove
            </Button>
          </div>
        ))}
        {show('links') && <p className="afield__error">{errors.links}</p>}
        <div>
          <Button disabled={f.links.length >= 20} onClick={() => setF((prev) => ({ ...prev, links: [...prev.links, { label: '', url: '' }] }))}>Add link</Button>
        </div>
      </fieldset>

      <Rule />
      {relogin && (
        <div className="admin-relogin" role="alert">
          <p>Your session expired. Your edits are kept here. Sign in to continue.</p>
          <div className={`afield${reloginError ? ' afield--error' : ''}`}>
            <label htmlFor="w-relogin" className="t-label">
              Password
            </label>
            <div className="admin-inline">
              <input
                id="w-relogin"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    reauth()
                  }
                }}
                autoFocus
                aria-invalid={reloginError ? true : undefined}
                aria-describedby={reloginError ? 'w-relogin-err' : undefined}
              />
              <Button variant="primary" onClick={reauth}>
                Sign in
              </Button>
            </div>
            <p id="w-relogin-err" className="afield__error" aria-live="polite">
              {reloginError}
            </p>
          </div>
        </div>
      )}
      <div className="admin-form__submit">
        <Button type="submit" variant="primary" disabled={saving || uploading || relogin}>
          {saving ? 'Saving' : isNew ? 'Create work' : 'Save changes'}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <p className="admin__status" role="status" aria-live="polite">
          {uploading ? 'Wait for uploads to finish.' : formError && <span className="afield__error">{formError}</span>}
        </p>
      </div>
    </form>
  )
}
