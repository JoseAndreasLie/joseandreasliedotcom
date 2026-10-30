// Hero contact sheet stills, shared by the 3D scene and the static fallback grid.
// Filled from the newest Behind the Lens covers, repeated to fill the sheet. With nothing published
// yet (or while loading) a slot is null and renders as a neutral viewfinder frame.
// The hero is decorative (aria-hidden), so stills need no alt text.
export const STILL_COUNT = 12

/** works: list('works') rows, newest first. Returns STILL_COUNT image srcs (or nulls). */
export function buildStills(works = []) {
  const covers = works.map((w) => w.cover_url).filter(Boolean)
  return Array.from({ length: STILL_COUNT }, (_, i) => (covers.length ? covers[i % covers.length] : null))
}

// Index of the frame that holds the Signal focus point in the fallback grid.
export const FOCUS = 5
