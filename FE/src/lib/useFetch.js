import { useEffect, useState } from 'react'

/**
 * Runs `load()` on mount and whenever `deps` change; ignores results from a stale run.
 * Returns { status: 'loading'|'ready'|'error', data?, error?, retry }.
 */
export function useFetch(load, deps) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let live = true
    setState({ status: 'loading' })
    load().then(
      (data) => live && setState({ status: 'ready', data }),
      (error) => live && setState({ status: 'error', error }),
    )
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  return { ...state, retry: () => setAttempt((a) => a + 1) }
}
