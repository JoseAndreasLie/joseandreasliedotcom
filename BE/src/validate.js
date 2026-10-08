export const TYPES = ['video', 'photo', 'project', 'writing']
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

// Returns { error } or { value } with every column filled (defaults for omitted optional fields).
// Used for both POST and PUT: PUT is a full replacement.
export function validateWork(b) {
  if (!isObj(b)) return { error: 'body must be a JSON object' }
  if (hasNul(b)) return { error: 'text must not contain NUL characters' }
  if (!TYPES.includes(b.type)) return { error: `type must be one of ${TYPES.join(', ')}` }
  if (!strMax(b.slug, 100) || !SLUG.test(b.slug)) return { error: 'slug must be lowercase letters, digits and single dashes, at most 100 chars' }
  if (!strMax(b.title, 200) || !b.title.trim()) return { error: 'title is required, at most 200 chars' }
  for (const [k, max] of [['summary', 500], ['body', 100_000]]) {
    if (b[k] !== undefined && !strMax(b[k], max)) return { error: `${k} must be a string of at most ${max} chars` }
  }
  for (const k of ['cover_url', 'shot_on', 'date']) if (b[k] === '') b = { ...b, [k]: null }
  if (b.cover_url != null && !isImageSrc(b.cover_url)) return { error: 'cover_url must be a /media path or https url' }
  if (b.shot_on != null && !strMax(b.shot_on, 100)) return { error: 'shot_on must be a string of at most 100 chars' }
  if (b.date != null && !isDate(b.date)) return { error: 'date must be YYYY-MM-DD' }
  if (b.published !== undefined && typeof b.published !== 'boolean') return { error: 'published must be a boolean' }

  const media = b.media ?? []
  if (!Array.isArray(media) || media.length > 50) return { error: 'media must be an array of at most 50 items' }
  for (const m of media) { const e = mediaError(m); if (e) return { error: e } }

  const links = b.links ?? []
  if (!Array.isArray(links) || links.length > 20 || !links.every((l) => isObj(l) && strMax(l.label, 200) && l.label.trim() && isHttpUrl(l.url))) {
    return { error: 'links must be at most 20 { label, url } with http(s) urls' }
  }
  const tags = b.tags ?? []
  if (!Array.isArray(tags) || tags.length > 30 || !tags.every((t) => strMax(t, 50))) return { error: 'tags must be at most 30 strings of at most 50 chars' }

  return {
    value: {
      slug: b.slug, type: b.type, title: b.title.trim(), summary: b.summary ?? '', body: b.body ?? '',
      cover_url: b.cover_url ?? null,
      media: media.map((m) => (m.kind === 'image' ? { kind: 'image', url: m.url, thumb_url: m.thumb_url, alt: m.alt ?? '' } : { kind: 'embed', url: m.url })),
      links: links.map((l) => ({ label: l.label, url: l.url })),
      tags, shot_on: b.shot_on ?? null, date: b.date ?? null, published: b.published ?? false,
    },
  }
}
