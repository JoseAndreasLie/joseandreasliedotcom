import { motion, useReducedMotion } from 'framer-motion'

// PageTransition({ children }): wrap each route element. Shutter wipe (~500ms: close 250ms + open 250ms) under AnimatePresence mode="wait"; plain 150ms fade under reduced motion.
const ease = [0.77, 0, 0.175, 1]
const half = 0.25

export default function PageTransition({ children }) {
  const reduce = useReducedMotion()

  if (reduce) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <>
      {/* exit is a no-op tween so presence waits for the closing shutter */}
      <motion.div exit={{ opacity: 1 }} transition={{ duration: half }}>
        {children}
      </motion.div>
      <motion.div
        className="shutter shutter--open"
        aria-hidden="true"
        initial={{ transform: 'scaleY(1)' }}
        animate={{ transform: 'scaleY(0)', transition: { duration: half, ease } }}
        exit={{ transform: 'scaleY(0)' }}
      />
      <motion.div
        className="shutter shutter--close"
        aria-hidden="true"
        initial={{ transform: 'scaleY(0)' }}
        animate={{ transform: 'scaleY(0)' }}
        exit={{ transform: 'scaleY(1)', transition: { duration: half, ease } }}
      />
    </>
  )
}
