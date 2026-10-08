// URL guards for API supplied media and links.

// Same rule as the BE: YouTube /embed/ on youtube.com or youtube-nocookie.com (bare or www), Vimeo player /video/.
const YOUTUBE = /^(?:www\.)?(?:youtube\.com|youtube-nocookie\.com)$/

/** Returns the URL only if it is an https YouTube or Vimeo player embed, else null. */
export function safeEmbed(url) {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return null
    const ok =
      (YOUTUBE.test(u.hostname) && u.pathname.startsWith('/embed/')) ||
      (u.hostname === 'player.vimeo.com' && u.pathname.startsWith('/video/'))
    return ok ? u.href : null
  } catch {
    return null
  }
}

/** Same origin paths and http(s)/mailto URLs pass; anything else (javascript:, data:, //host, /\host) is null. */
export function safeHref(url) {
  if (typeof url !== 'string') return null
  if (url.startsWith('/')) {
    if (url.includes('\\')) return null
    const origin = globalThis.location?.origin || 'https://jose.web.id'
    try {
      return new URL(url, origin).origin === origin ? url : null
    } catch {
      return null
    }
  }
  try {
    const u = new URL(url)
    return ['http:', 'https:', 'mailto:'].includes(u.protocol) ? u.href : null
  } catch {
    return null
  }
}
