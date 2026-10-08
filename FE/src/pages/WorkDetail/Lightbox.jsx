import { useEffect, useRef } from 'react'
import { FiArrowLeft, FiArrowRight, FiX } from 'react-icons/fi'
import { FrameCounter } from '../../components/ui'

// Native modal <dialog>: page behind is inert (focus trap), Esc closes. Focus returns to the opener on unmount.
// Arrow keys step frames. Mount it only while open.
export default function Lightbox({ images, index, onIndex, onClose, title }) {
  const ref = useRef(null)
  const n = images.length
  const img = images[index]

  useEffect(() => {
    const dialog = ref.current
    const opener = document.activeElement
    dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
      opener?.focus?.()
    }
  }, [])

  const step = (d) => onIndex((index + d + n) % n)

  function onKeyDown(e) {
    if (n < 2) return
    if (e.key === 'ArrowLeft') step(-1)
    else if (e.key === 'ArrowRight') step(1)
    else return
    e.preventDefault()
  }

  return (
    <dialog
      ref={ref}
      className="lightbox"
      aria-label={`${title}, image ${index + 1} of ${n}`}
      // Guard: under StrictMode the effect cleanup's close() queues a close event that lands after the re-open.
      onClose={(e) => !e.currentTarget.open && onClose()}
      onKeyDown={onKeyDown}
      // Click on the backdrop (the dialog itself, not its content) closes.
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="lightbox__bar">
        <FrameCounter index={index + 1} total={n} />
        <button type="button" className="lightbox__btn" onClick={onClose} aria-label="Close" autoFocus>
          <FiX aria-hidden="true" />
        </button>
      </div>

      <figure className="lightbox__figure">
        <img key={img.url} className="lightbox__img" src={img.url} alt={img.alt || ''} decoding="async" />
        {img.alt && <figcaption className="lightbox__caption">{img.alt}</figcaption>}
      </figure>

      {n > 1 && (
        <div className="lightbox__nav">
          <button type="button" className="lightbox__btn" onClick={() => step(-1)} aria-label="Previous image">
            <FiArrowLeft aria-hidden="true" />
          </button>
          <button type="button" className="lightbox__btn" onClick={() => step(1)} aria-label="Next image">
            <FiArrowRight aria-hidden="true" />
          </button>
        </div>
      )}
    </dialog>
  )
}
