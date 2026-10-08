// Hero contact sheet stills, shared by the 3D scene and the static fallback grid.
// Placeholders (src: null) render as neutral viewfinder frames. To use a real still, set
// src to a 3:2 image in FE/public, e.g. '/stills/still-01.webp' (1600px wide or more).
// The hero is decorative (aria-hidden), so stills need no alt text.
export const stills = Array.from({ length: 12 }, () => ({ src: null }))

// Index of the frame that holds the Signal focus point in the fallback grid.
export const FOCUS = 5
