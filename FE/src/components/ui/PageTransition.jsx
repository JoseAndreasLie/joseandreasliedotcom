import { useLocation } from 'react-router-dom'

// PageTransition({ children }): wrap each route element. A Graphite shutter blade opens over the new page (250ms, CSS only;
// instant under reduced motion via the global rule). Skipped on the first page of a visit so nothing covers first paint.
export default function PageTransition({ children }) {
  const { key } = useLocation()
  return (
    <>
      {children}
      {key !== 'default' && <div className="shutter" aria-hidden="true" />}
    </>
  )
}
