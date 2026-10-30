export const TYPES = ['video', 'photo']
export const STATUSES = ['Live', 'Private']
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
// host -> required path prefix
const EMBEDS = {
  'youtube.com': '/embed/', 'www.youtube.com': '/embed/', 'youtube-nocookie.com': '/embed/', 'www.youtube-nocookie.com': '/embed/',
  'player.vimeo.com': '/video/',
}
const MEDIA_PATH = /^\/media\/[\w.-]+$/

const isStr = (v) => typeof v === 'string'
const strMax = (v, max) => isStr(v) && v.length <= max
const hasNul = (v) => (isStr(v) ? v.includes('\0') : v !== null && typeof v === 'object' && Object.values(v).some(hasNul))
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
function parseUrl(s) {
  try { return new URL(s) } catch { return null }
}
const URL_MAX = 2048
const isHttpUrl = (s) => strMax(s, URL_MAX) && ['http:', 'https:'].includes(parseUrl(s)?.protocol)
// Image src: our own /media path or an https URL (blocks http, javascript:, data:, etc).
const isImageSrc = (s) => strMax(s, URL_MAX) && (MEDIA_PATH.test(s) || parseUrl(s)?.protocol === 'https:')
const isEmbed = (s) => {
  const u = strMax(s, URL_MAX) && parseUrl(s)
  return !!u && u.protocol === 'https:' && Object.hasOwn(EMBEDS, u.hostname) && u.pathname.startsWith(EMBEDS[u.hostname])
}
const isDate = (s) => isStr(s) && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)) && new Date(s).toISOString().startsWith(s)
const isYear = (v) => Number.isInteger(v) && v >= 1900 && v <= 2100

function mediaError(m) {
  if (!isObj(m)) return 'media item must be an object'
  if (m.kind === 'image') {
    if (!isImageSrc(m.url) || !isImageSrc(m.thumb_url)) return 'image media needs url and thumb_url (/media path or https)'
    if (m.alt !== undefined && !strMax(m.alt, 200)) return 'image alt must be a string of at most 200 chars'
    return null
  }
  if (m.kind === 'embed') return isEmbed(m.url) ? null : 'embed url must be https://(www.)youtube(-nocookie).com/embed/... or https://player.vimeo.com/video/...'
  return 'media kind must be image or embed'
}

// Each check returns an error string or null. `b` has '' already turned into null for nullable fields.
const checkSlug = (b) => (!strMax(b.slug, 100) || !SLUG.test(b.slug) ? 'slug must be lowercase letters, digits and single dashes, at most 100 chars' : null)
const checkRequired = (b, k) => (!strMax(b[k], 200) || !b[k].trim() ? `${k} is required, at most 200 chars` : null)
function checkStrings(b, limits) {
  for (const [k, max] of limits) if (b[k] != null && !strMax(b[k], max)) return `${k} must be a string of at most ${max} chars`
  return null
}
function checkImages(b, keys) {
  for (const k of keys) if (b[k] != null && !isImageSrc(b[k])) return `${k} must be a /media path or https url`
  return null
}
function checkFlags(b, keys) {
  for (const k of keys) if (b[k] !== undefined && typeof b[k] !== 'boolean') return `${k} must be a boolean`
  return null
}
function checkMedia(b) {
  const media = b.media ?? []
  if (!Array.isArray(media) || media.length > 50) return 'media must be an array of at most 50 items'
  for (const m of media) { const e = mediaError(m); if (e) return e }
  return null
}
function checkLinks(b) {
  const links = b.links ?? []
  if (!Array.isArray(links) || links.length > 20 || !links.every((l) => isObj(l) && strMax(l.label, 200) && l.label.trim() && isHttpUrl(l.url))) {
    return 'links must be at most 20 { label, url } with http(s) urls'
  }
  return null
}
function checkList(b, k) {
  const v = b[k] ?? []
  return !Array.isArray(v) || v.length > 30 || !v.every((t) => strMax(t, 50)) ? `${k} must be at most 30 strings of at most 50 chars` : null
}
const checkYear = (b) => (b.year != null && !isYear(b.year) ? 'year must be an integer between 1900 and 2100' : null)
const checkPosition = (b) => (b.position !== undefined && !(Number.isInteger(b.position) && Math.abs(b.position) <= 100_000) ? 'position must be an integer' : null)

const cleanMedia = (media = []) =>
  media.map((m) => (m.kind === 'image' ? { kind: 'image', url: m.url, thumb_url: m.thumb_url, alt: m.alt ?? '' } : { kind: 'embed', url: m.url }))
const cleanLinks = (links = []) => links.map((l) => ({ label: l.label, url: l.url }))

// Shared prologue: object check, NUL check, '' -> null for nullable fields.
function prepare(b, nullable) {
  if (!isObj(b)) return { error: 'body must be a JSON object' }
  if (hasNul(b)) return { error: 'text must not contain NUL characters' }
  for (const k of nullable) if (b[k] === '') b = { ...b, [k]: null }
  return { b }
}
const first = (...errors) => errors.find(Boolean)

// Each validator returns { error } or { value } with every column filled (defaults for omitted optional fields).
// Used for both POST and PUT: PUT is a full replacement.

export function validateWork(body) {
  const { error: e0, b } = prepare(body, ['cover_url', 'shot_on', 'date'])
  if (e0) return { error: e0 }
  const error = first(
    !TYPES.includes(b.type) && `type must be one of ${TYPES.join(', ')}`,
    checkSlug(b),
    checkRequired(b, 'title'),
    checkStrings(b, [['summary', 500], ['body', 100_000], ['shot_on', 100]]),
    checkImages(b, ['cover_url']),
    b.date != null && !isDate(b.date) && 'date must be YYYY-MM-DD',
    checkFlags(b, ['published', 'featured']),
    checkMedia(b), checkLinks(b), checkList(b, 'tags'),
  )
  if (error) return { error }
  return {
    value: {
      slug: b.slug, type: b.type, title: b.title.trim(), summary: b.summary ?? '', body: b.body ?? '',
      cover_url: b.cover_url ?? null, media: cleanMedia(b.media), links: cleanLinks(b.links),
      tags: b.tags ?? [], shot_on: b.shot_on ?? null, date: b.date ?? null,
      published: b.published ?? false, featured: b.featured ?? false,
    },
  }
}

export function validateProject(body) {
  const { error: e0, b } = prepare(body, ['cover_url', 'year'])
  if (e0) return { error: e0 }
  const notes = b.notes ?? []
  const error = first(
    checkSlug(b),
    checkRequired(b, 'title'),
    checkStrings(b, [['company', 200], ['role', 200], ['summary', 500], ['body', 100_000]]),
    checkImages(b, ['cover_url']),
    checkYear(b), checkPosition(b),
    checkFlags(b, ['published', 'featured']),
    checkMedia(b), checkLinks(b), checkList(b, 'tags'),
    (!Array.isArray(notes) || notes.length > 20 || !notes.every((n) => isObj(n) && strMax(n.label, 100) && n.label.trim() && strMax(n.text, 2000)))
      && 'notes must be at most 20 { label, text }',
  )
  if (error) return { error }
  return {
    value: {
      slug: b.slug, title: b.title.trim(), year: b.year ?? null, company: b.company ?? '', role: b.role ?? '',
      summary: b.summary ?? '', body: b.body ?? '', cover_url: b.cover_url ?? null,
      media: cleanMedia(b.media), links: cleanLinks(b.links), tags: b.tags ?? [],
      notes: notes.map((n) => ({ label: n.label, text: n.text })),
      published: b.published ?? false, featured: b.featured ?? false, position: b.position ?? 0,
    },
  }
}

export function validateProduct(body) {
  const { error: e0, b } = prepare(body, ['url', 'badge', 'year', 'screenshot_desktop', 'screenshot_mobile', 'case_study'])
  if (e0) return { error: e0 }
  const cs = b.case_study
  const error = first(
    checkSlug(b),
    checkRequired(b, 'name'),
    b.status !== undefined && !STATUSES.includes(b.status) && `status must be one of ${STATUSES.join(', ')}`,
    b.url != null && !isHttpUrl(b.url) && 'url must be an http(s) url',
    checkStrings(b, [['tagline', 200], ['badge', 100], ['role', 200], ['summary', 500], ['writeup', 100_000]]),
    checkImages(b, ['screenshot_desktop', 'screenshot_mobile']),
    checkYear(b), checkPosition(b),
    checkFlags(b, ['published', 'featured']),
    checkList(b, 'stack'),
    cs != null && (!isObj(cs) || !['problem', 'architecture'].every((k) => cs[k] == null || strMax(cs[k], 20_000)))
      && 'case_study must be { problem, architecture } strings',
  )
  if (error) return { error }
  const caseStudy = cs && (cs.problem || cs.architecture) ? { problem: cs.problem || null, architecture: cs.architecture || null } : null
  return {
    value: {
      slug: b.slug, name: b.name.trim(), tagline: b.tagline ?? '', url: b.url ?? null, status: b.status ?? 'Live',
      badge: b.badge ?? null, stack: b.stack ?? [], role: b.role ?? '', summary: b.summary ?? '', year: b.year ?? null,
      writeup: b.writeup ?? '', screenshot_desktop: b.screenshot_desktop ?? null, screenshot_mobile: b.screenshot_mobile ?? null,
      case_study: caseStudy, published: b.published ?? false, featured: b.featured ?? false, position: b.position ?? 0,
    },
  }
}
