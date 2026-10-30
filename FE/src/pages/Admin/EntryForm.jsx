import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Button, Rule } from '../../components/ui'
import { create, login, update, uploadImage } from '../../lib/api'

// One form for every admin resource. Fields shown per resource come from KINDS; form keys are shared:
// `title` is a product's name, `body` its writeup and `tags` its stack (mapped in toForm / toPayload).
const KINDS = {
  works: { noun: 'frame', path: '/lens', fields: ['type', 'date', 'shot_on', 'media', 'links'], tags: 'Tags', body: 'Body' },
  projects: { noun: 'project', path: '/projects', fields: ['year', 'company', 'role', 'position', 'media', 'links', 'notes'], tags: 'Stack', body: 'Write-up' },
  products: {
    noun: 'product',
    path: '/products',
    fields: ['tagline', 'url', 'status', 'badge', 'year', 'role', 'position', 'screens', 'case_study'],
    tags: 'Stack',
    body: 'Write-up',
  },
}
const TYPES = ['photo', 'video']
const STATUSES = ['Live', 'Private']
const SHOTS = [
  ['screenshot_desktop', 'Desktop screenshot', '16:10, e.g. 1600 × 1000.'],
  ['screenshot_mobile', 'Mobile screenshot', '9:19.5, e.g. 780 × 1690.'],
]
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
const parseTags = (s) => [
  ...new Set(
    s
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  ),
]
// Mirrors BE length caps.
const MAX_URL = 2048
const MAX_MEDIA = 50

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const isImageSrc = (s) => /^\/media\/[\w.-]+$/.test(s) || parseUrl(s)?.protocol === 'https:'

function toForm(resource, r) {
  const product = resource === 'products'
  return {
    slug: r?.slug ?? '',
    type: r?.type ?? 'photo',
    title: (product ? r?.name : r?.title) ?? '',
    summary: r?.summary ?? '',
    body: (product ? r?.writeup : r?.body) ?? '',
    cover_url: r?.cover_url ?? '',
    media: r?.media ?? [],
    links: r?.links ?? [],
    tags: ((product ? r?.stack : r?.tags) ?? []).join(', '),
    shot_on: r?.shot_on ?? '',
    date: r?.date ?? today(),
    published: r?.published ?? false,
    featured: r?.featured ?? false,
    year: r?.year ?? '',
    company: r?.company ?? '',
    role: r?.role ?? '',
    position: r?.position ?? 0,
    notes: r?.notes ?? [],
    tagline: r?.tagline ?? '',
    url: r?.url ?? '',
    status: r?.status ?? 'Live',
    badge: r?.badge ?? '',
    screenshot_desktop: r?.screenshot_desktop ?? '',
    screenshot_mobile: r?.screenshot_mobile ?? '',
    problem: r?.case_study?.problem ?? '',
    architecture: r?.case_study?.architecture ?? '',
  }
}

// PUT is a full replacement on the BE, so every field is always sent.
function toPayload(resource, f) {
  const common = { slug: f.slug.trim(), summary: f.summary, published: f.published, featured: f.featured }
  const year = f.year === '' ? null : Number(f.year)
  const position = Number(f.position) || 0
  const links = f.links.map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
  const trimmed = (k) => f[k].trim() || null
  if (resource === 'works') {
    return {
      ...common,
      type: f.type,
      title: f.title.trim(),
      body: f.body,
      cover_url: trimmed('cover_url'),
      media: f.media,
      links,
      tags: parseTags(f.tags),
      shot_on: trimmed('shot_on'),
      date: f.date || null,
    }
  }
  if (resource === 'projects') {
    return {
      ...common,
      title: f.title.trim(),
      year,
      company: f.company.trim(),
      role: f.role.trim(),
      body: f.body,
      cover_url: trimmed('cover_url'),
      media: f.media,
      links,
      tags: parseTags(f.tags),
      position,
      notes: f.notes.map((n) => ({ label: n.label.trim(), text: n.text.trim() })),
    }
  }
  return {
    ...common,
    name: f.title.trim(),
    tagline: f.tagline.trim(),
    url: trimmed('url'),
    status: f.status,
    badge: trimmed('badge'),
    stack: parseTags(f.tags),
    role: f.role.trim(),
    year,
    writeup: f.body,
    position,
    screenshot_desktop: trimmed('screenshot_desktop'),
    screenshot_mobile: trimmed('screenshot_mobile'),
    case_study: { problem: f.problem.trim() || null, architecture: f.architecture.trim() || null },
  }
}

function validate(resource, f) {
  const has = (k) => KINDS[resource].fields.includes(k)
  const e = {}
  if (!f.title.trim()) e.title = `${resource === 'products' ? 'Name' : 'Title'} is required.`
  if (!f.slug.trim()) e.slug = 'Slug is required.'
  else if (!SLUG_RE.test(f.slug.trim())) e.slug = 'Use lowercase letters, digits and single dashes, e.g. lombok-film.'
  const c = f.cover_url.trim()
  if (has('media') && c && !isImageSrc(c)) e.cover_url = 'Use a /media path or an https URL.'
  const tags = parseTags(f.tags)
  if (tags.length > 30 || tags.some((t) => t.length > 50)) e.tags = 'Up to 30 entries, 50 characters each.'
  if (has('year') && f.year !== '' && !(Number.isInteger(Number(f.year)) && f.year >= 1900 && f.year <= 2100)) e.year = 'A year like 2025, or empty.'
  if (has('position') && !Number.isInteger(Number(f.position))) e.position = 'A whole number.'
  if (has('url') && f.url.trim() && !isHttpUrl(f.url.trim())) e.url = 'Use an http(s) URL, or leave empty.'
  if (has('screens')) for (const [k] of SHOTS) if (f[k].trim() && !isImageSrc(f[k].trim())) e[k] = 'Use a /media path or an https URL.'
  if (has('media') && f.media.length > MAX_MEDIA) e.media = `Up to ${MAX_MEDIA} media items. Remove some.`
  if (has('links')) {
    if (f.links.length > 20) e.links = 'Up to 20 links.'
    else if (f.links.some((l) => !l.label.trim() || !isHttpUrl(l.url.trim()))) e.links = 'Every link needs a label and an http(s) URL.'
  }
  if (has('notes') && f.notes.some((n) => !n.label.trim() || !n.text.trim())) e.notes = 'Every note needs a label and text.'
  return e
}

// Server 400 messages start with the field name ("slug must be ..."); route them inline when they do.
// A product's name / stack land on the shared title / tags inputs.
const FIELD_OF_ERROR =
  /^(slug|title|name|type|cover_url|date|links|media|tags|stack|summary|body|writeup|shot_on|year|position|url|notes|screenshot_desktop|screenshot_mobile)\b/
const ALIAS = { name: 'title', stack: 'tags', writeup: 'body' }
const INLINE = ['title', 'slug', 'year', 'position', 'url', 'cover_url', 'screenshot_desktop', 'screenshot_mobile', 'tags', 'media', 'links', 'notes']

export default function EntryForm({ resource, row, onSaved, onCancel }) {
  const kind = KINDS[resource]
  const has = (k) => kind.fields.includes(k)
  const isNew = !row
  const [f, setF] = useState(() => toForm(resource, row))
  const [slugEdited, setSlugEdited] = useState(!isNew)
  const [touched, setTouched] = useState({})
  const [serverErrors, setServerErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [embed, setEmbed] = useState('')
  const [embedError, setEmbedError] = useState('')
  const [uploads, setUploads] = useState([]) // { id, name, progress, error }
  const [shotBusy, setShotBusy] = useState('') // screenshot key being uploaded
  const [relogin, setRelogin] = useState(false) // token expired mid edit: sign in inline, keep the form
  const [password, setPassword] = useState('')
  const [reloginError, setReloginError] = useState('')
  const formRef = useRef(null)
  const fileRef = useRef(null)
  const headingRef = useRef(null)

  useEffect(() => headingRef.current?.focus(), [])

  const errors = { ...validate(resource, f), ...serverErrors }
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

  // Links and notes: lists of { label, url } / { label, text }
  const setItem = (list, i, k, v) => {
    setF((prev) => ({ ...prev, [list]: prev[list].map((l, j) => (j === i ? { ...l, [k]: v } : l)) }))
  }
  const setLink = (i, k, v) => setItem('links', i, k, v)

  // Product screenshots: one image per slot, the full size url is kept.
  const uploadShot = (k) => async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setShotBusy(k)
    try {
      const { url } = await uploadImage(file)
      set(k, url)
    } catch (err) {
      if (err.status === 401) setRelogin(true)
      setServerErrors({ [k]: err.status === 401 ? 'Session expired. Sign in below, then upload again.' : err.message })
      setTouched((t) => ({ ...t, [k]: true }))
    } finally {
      setShotBusy('')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setTouched((t) => ({ ...t, _submit: true }))
    setServerErrors({})
    setFormError('')
    const clientErrors = validate(resource, f)
    const firstKey = INLINE.find((k) => clientErrors[k])
    if (firstKey) {
      formRef.current.querySelector(`#w-${firstKey}, [data-field="${firstKey}"]`)?.focus()
      return
    }
    setSaving(true)
    try {
      const payload = toPayload(resource, f)
      const saved = isNew ? await create(resource, payload) : await update(resource, row.id, payload)
      onSaved(saved, isNew)
    } catch (err) {
      // Sync so the fieldset is enabled again before we move focus into it.
      flushSync(() => setSaving(false))
      if (err.status === 401) {
        setRelogin(true)
        return
      }
      if (err.status === 409) {
        setServerErrors({ slug: `That slug is already used by another ${kind.noun}. Pick a different one.` })
        setTouched((t) => ({ ...t, slug: true }))
        formRef.current.querySelector('#w-slug')?.focus()
        return
      }
      const m = err.status === 400 && err.message.match(FIELD_OF_ERROR)?.[1]
      const k = m && (ALIAS[m] ?? m)
      if (k && INLINE.includes(k)) setServerErrors({ [k]: err.message })
      else setFormError(err.message)
    }
  }

  const uploading = uploads.some((u) => !u.error) || !!shotBusy

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
          {isNew ? `New ${kind.noun}` : `Edit ${kind.noun}`}
        </h1>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Back to list
        </Button>
      </header>

      <fieldset className="admin-form__group" disabled={saving}>
        <legend className="t-label t-dim">Basics</legend>
        {field(
          'title',
          resource === 'products' ? 'Name' : 'Title',
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
            isNew && !slugEdited ? 'Suggested from the title. Edit to override.' : `URL: ${kind.path}/${f.slug || 'slug'}`,
          )}
          {has('type') &&
            field(
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
          {has('status') &&
            field(
              'status',
              'Status',
              <select {...aria('status')} value={f.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>,
            )}
        </div>
        {has('tagline') &&
          field(
            'tagline',
            'Tagline',
            <input {...aria('tagline', true)} maxLength={200} value={f.tagline} onChange={(e) => set('tagline', e.target.value)} />,
            'Short line under the name, e.g. Expense splitter for groups.',
          )}
        {(has('url') || has('badge')) && (
          <div className="admin-form__row">
            {field(
              'url',
              'Live URL',
              <input
                {...aria('url', true)}
                type="url"
                maxLength={MAX_URL}
                value={f.url}
                onChange={(e) => set('url', e.target.value)}
                onBlur={blur('url')}
                placeholder="https://"
                spellCheck={false}
              />,
              'Empty for private products.',
            )}
            {field(
              'badge',
              'Badge',
              <input
                {...aria('badge', true)}
                maxLength={100}
                value={f.badge}
                onChange={(e) => set('badge', e.target.value)}
                placeholder="Private · in production"
              />,
              'Optional. Replaces the status label.',
            )}
          </div>
        )}
        {has('date') && (
          <div className="admin-form__row">
            {field('date', 'Date', <input {...aria('date')} type="date" value={f.date} onChange={(e) => set('date', e.target.value)} />)}
            {field(
              'shot_on',
              'Shot on',
              <input {...aria('shot_on', true)} maxLength={100} value={f.shot_on} onChange={(e) => set('shot_on', e.target.value)} placeholder="SONY FX3" />,
              'Optional. Camera or gear.',
            )}
          </div>
        )}
        {(has('company') || has('role')) && (
          <div className="admin-form__row">
            {has('company') &&
              field(
                'company',
                'Company or team',
                <input {...aria('company')} maxLength={200} value={f.company} onChange={(e) => set('company', e.target.value)} />,
              )}
            {field(
              'role',
              'Role',
              <input {...aria('role')} maxLength={200} value={f.role} onChange={(e) => set('role', e.target.value)} placeholder="Lead Backend Engineer" />,
            )}
          </div>
        )}
        {has('year') && (
          <div className="admin-form__row">
            {field(
              'year',
              'Year',
              <input
                {...aria('year', true)}
                type="number"
                inputMode="numeric"
                min={1900}
                max={2100}
                value={f.year}
                onChange={(e) => set('year', e.target.value)}
                onBlur={blur('year')}
              />,
              'Optional.',
            )}
            {field(
              'position',
              'Order',
              <input
                {...aria('position', true)}
                type="number"
                inputMode="numeric"
                value={f.position}
                onChange={(e) => set('position', e.target.value)}
                onBlur={blur('position')}
              />,
              'Lower comes first.',
            )}
          </div>
        )}
        {field(
          'tags',
          kind.tags,
          <input
            {...aria('tags', true)}
            value={f.tags}
            onChange={(e) => set('tags', e.target.value)}
            onBlur={blur('tags')}
            placeholder={resource === 'works' ? 'travel, lombok' : 'React, Node.js'}
          />,
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
        <label className="admin-switch">
          <input type="checkbox" role="switch" checked={f.featured} onChange={(e) => set('featured', e.target.checked)} />
          <span className="admin-switch__track" aria-hidden="true" />
          <span className="t-label">Featured</span>
          <span className="t-dim" aria-hidden="true">
            {f.featured ? 'Shown on the home page' : 'Not on the home page'}
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
          kind.body,
          <textarea
            {...aria('body', true)}
            maxLength={100000}
            className="admin-form__body"
            rows={14}
            value={f.body}
            onChange={(e) => set('body', e.target.value)}
          />,
          'Markdown.',
        )}
        {has('case_study') && (
          <>
            {field(
              'problem',
              'Case study: problem',
              <textarea {...aria('problem', true)} maxLength={20000} rows={4} value={f.problem} onChange={(e) => set('problem', e.target.value)} />,
              'Optional. Mostly for private products.',
            )}
            {field(
              'architecture',
              'Case study: architecture',
              <textarea
                {...aria('architecture', true)}
                maxLength={20000}
                rows={4}
                value={f.architecture}
                onChange={(e) => set('architecture', e.target.value)}
              />,
              'Optional. Keep client names and real figures out.',
            )}
          </>
        )}
      </fieldset>

      {has('screens') && (
        <fieldset className="admin-form__group" disabled={saving}>
          <legend className="t-label t-dim">Screenshots</legend>
          {SHOTS.map(([k, label, hint]) => (
            <div key={k} className="admin-cover">
              <div className="admin-cover__preview">{f[k] ? <img src={f[k]} alt="" /> : <span className="t-label t-dim">None</span>}</div>
              <div className="admin-cover__fields">
                {field(
                  k,
                  label,
                  <input {...aria(k, true)} value={f[k]} onChange={(e) => set(k, e.target.value)} onBlur={blur(k)} maxLength={MAX_URL} spellCheck={false} />,
                  `${hint} Upload, or paste a URL. Empty slots are hidden on the site.`,
                )}
                <div className="admin-inline">
                  <input
                    id={`w-${k}-file`}
                    type="file"
                    accept="image/*"
                    onChange={uploadShot(k)}
                    tabIndex={-1}
                    aria-label={`Upload ${label.toLowerCase()}`}
                    className="visually-hidden"
                  />
                  <Button onClick={() => document.getElementById(`w-${k}-file`).click()} disabled={!!shotBusy}>
                    {shotBusy === k ? 'Uploading' : 'Upload'}
                  </Button>
                  {f[k] && (
                    <Button variant="ghost" onClick={() => set(k, '')}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </fieldset>
      )}

      {has('media') && (
        <fieldset className="admin-form__group" disabled={saving}>
          <legend className="t-label t-dim">Media</legend>

          <div className="admin-cover">
            <div className="admin-cover__preview">{f.cover_url ? <img src={f.cover_url} alt="" /> : <span className="t-label t-dim">No cover</span>}</div>
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

          {show('media') && (
            <p className="afield__error" data-field="media" tabIndex={-1}>
              {errors.media}
            </p>
          )}
          {f.media.length > 0 && (
            <ol className="admin-media">
              {f.media.map((m, i) => (
                <li key={`${m.url}-${i}`} className="admin-media__item">
                  <div className="admin-media__thumb">{m.kind === 'image' ? <img src={m.thumb_url} alt="" /> : <span className="t-label">Embed</span>}</div>
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
                      <Button variant="ghost" onClick={() => move(i, 1)} disabled={i === f.media.length - 1} aria-label={`Move item ${i + 1} down`}>
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
      )}

      {has('notes') && (
        <fieldset className="admin-form__group" disabled={saving}>
          <legend className="t-label t-dim">Notes</legend>
          <p className="afield__hint">Short labelled facts, e.g. Outcome: Published on the App Store.</p>
          {f.notes.map((n, i) => (
            <div key={i} className="admin-link">
              <div className="afield">
                <label htmlFor={`w-note-label-${i}`} className="t-label">
                  Label
                </label>
                <input
                  id={`w-note-label-${i}`}
                  data-field={i === 0 ? 'notes' : undefined}
                  value={n.label}
                  onChange={(e) => setItem('notes', i, 'label', e.target.value)}
                  maxLength={100}
                  placeholder="Outcome"
                />
              </div>
              <div className="afield">
                <label htmlFor={`w-note-text-${i}`} className="t-label">
                  Text
                </label>
                <textarea id={`w-note-text-${i}`} rows={2} value={n.text} onChange={(e) => setItem('notes', i, 'text', e.target.value)} maxLength={2000} />
              </div>
              <Button
                variant="ghost"
                onClick={() => setF((prev) => ({ ...prev, notes: prev.notes.filter((_, j) => j !== i) }))}
                aria-label={`Remove note ${i + 1}`}
              >
                Remove
              </Button>
            </div>
          ))}
          {show('notes') && <p className="afield__error">{errors.notes}</p>}
          <div>
            <Button disabled={f.notes.length >= 20} onClick={() => setF((prev) => ({ ...prev, notes: [...prev.notes, { label: '', text: '' }] }))}>
              Add note
            </Button>
          </div>
        </fieldset>
      )}

      {has('links') && (
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
            <Button disabled={f.links.length >= 20} onClick={() => setF((prev) => ({ ...prev, links: [...prev.links, { label: '', url: '' }] }))}>
              Add link
            </Button>
          </div>
        </fieldset>
      )}

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
          {saving ? 'Saving' : isNew ? `Create ${kind.noun}` : 'Save changes'}
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
