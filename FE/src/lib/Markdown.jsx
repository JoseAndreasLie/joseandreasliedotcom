import ReactMarkdown from 'react-markdown'
import { safeHref } from './media'

// Markdown: raw HTML skipped, URLs pass react-markdown's default sanitizer plus safeHref. A body `#` becomes h2 so the page keeps one h1.
const components = {
  h1: 'h2',
  a: ({ href, children }) => {
    const safe = safeHref(href)
    if (!safe) return <span>{children}</span>
    const external = /^https?:/.test(safe)
    return (
      <a href={safe} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    )
  },
  img: ({ src, alt }) => <img src={src} alt={alt || ''} loading="lazy" decoding="async" />,
}

// Shared by WorkDetail (frames, projects) and ProductDetail.
export default function Markdown({ children }) {
  return (
    <ReactMarkdown skipHtml components={components}>
      {children}
    </ReactMarkdown>
  )
}
