import { Link } from 'react-router-dom'
import Viewfinder from './Viewfinder'
import FrameCounter from './FrameCounter'
import MetaRow from './MetaRow'

// MediaCard({ to, href?, cover?, alt = '', title, summary?, meta = [], index?, total?, badge?, headingLevel = 3, className }): cover (3:2) in Viewfinder, FrameCounter, title, MetaRow. Whole card is one link (`to` router path or external `href`). No cover renders a neutral frame.
export default function MediaCard({ to, href, cover, alt = '', title, summary, meta = [], index, total, badge, headingLevel = 3, className = '' }) {
  const H = `h${headingLevel}`
  const LinkTag = href ? 'a' : Link
  const linkProps = href ? { href, target: '_blank', rel: 'noreferrer' } : { to }
  return (
    <article className={`media-card ${className}`.trim()}>
      <LinkTag className="media-card__link" {...linkProps}>
        <Viewfinder className="media-card__frame">
          {cover ? (
            <img className="media-card__img" src={cover} alt={alt} loading="lazy" decoding="async" />
          ) : (
            <span className="media-card__empty" aria-hidden="true" />
          )}
        </Viewfinder>
        <div className="media-card__head">
          {index ? <FrameCounter index={index} total={total} /> : <span />}
          {badge}
        </div>
        <H className="media-card__title t-title">{title}</H>
      </LinkTag>
      <MetaRow items={meta} className="media-card__meta" />
      {summary && <p className="media-card__summary">{summary}</p>}
    </article>
  )
}
