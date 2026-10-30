import Viewfinder from './Viewfinder'
import Button from './Button'

// LoadState({ state, empty, noun }): loading / error / empty block for a useFetch() result. Renders nothing once data is in.
// state: useFetch() return. empty: message when data is []. noun: what failed to load ("Projects").
export default function LoadState({ state, empty, noun }) {
  if (state.status === 'ready' && state.data.length > 0) return null
  if (state.status === 'loading') {
    return (
      <p className="load-state t-label t-dim" role="status">
        Loading
      </p>
    )
  }
  const failed = state.status === 'error'
  return (
    <div className="load-state">
      <Viewfinder className="load-state__frame">
        <p className="t-label">{failed ? 'No signal' : 'FR 000'}</p>
      </Viewfinder>
      <h2 className="t-headline">{failed ? `${noun} could not load.` : empty}</h2>
      {failed && (
        <>
          <p className="t-dim">{state.error.message}</p>
          <Button variant="primary" onClick={state.retry}>
            Try again
          </Button>
        </>
      )}
    </div>
  )
}
