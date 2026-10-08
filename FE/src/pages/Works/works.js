// Shared by Works and WorkDetail.
export const TYPES = ['video', 'photo', 'project', 'writing']

export const year = (date) => (date ? String(date).slice(0, 4) : null)

/** Card meta: 2026 · VIDEO · SONY FX3 */
export const cardMeta = (w) => [year(w.date), w.type?.toUpperCase(), w.shot_on]

/** '2026-01-31' -> '31 Jan 2026' (UTC, so the day never shifts). */
export function formatDate(date) {
  if (!date) return null
  const d = new Date(`${String(date).slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}
