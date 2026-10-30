import { useParams } from 'react-router-dom'
import { Button, LoadState, MetaRow, Rule, Viewfinder } from '../../components/ui'
import { get } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import ProductBadge from '../Products/ProductBadge'
import Markdown from '../WorkDetail/Markdown'
import NotFound from '../NotFound'
import './ProductDetail.scss'

const SHOTS = [
  { key: 'screenshot_desktop', label: 'Desktop', ratio: '16:10' },
  { key: 'screenshot_mobile', label: 'Mobile', ratio: '9:19.5' },
]

// Only uploaded screenshots render: a missing slot is left out, never shown as a placeholder.
function Screens({ product, mock }) {
  const shots = SHOTS.filter(({ key }) => product[key])
  if (!shots.length) return null
  return (
    <div className={`pd__screens pd__screens--${shots.length}`}>
      {shots.map(({ key, label, ratio }) => {
        const src = product[key]
        return (
          <figure key={key} className={`pd__shot pd__shot--${label.toLowerCase()}`}>
            <Viewfinder className="pd__frame">
              <img src={src} alt={`${product.name} on ${label.toLowerCase()}${mock ? ', mock data' : ''}`} loading="lazy" decoding="async" />
            </Viewfinder>
            <figcaption className="t-label t-dim">
              {[label, ratio, mock && 'Mock data'].filter(Boolean).join(' · ')}
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const state = useFetch(() => get('products', slug), [slug])
  if (state.status === 'error' && state.error.status === 404) return <NotFound />
  if (state.status !== 'ready') {
    return (
      <div className="pd container">
        <title>Products · Jose Andreas Lie</title>
        <LoadState state={state} noun="This product" />
      </div>
    )
  }

  const product = state.data
  const cs = product.case_study
  const isPrivate = product.status === 'Private'
  const { stack, role } = product
  const sections = cs
    ? [
        ['Problem', cs.problem],
        ['Architecture', cs.architecture],
      ].filter(([, text]) => text)
    : []
  const host = product.url && new URL(product.url).host

  return (
    <article className="pd container">
      <title>{`${product.name} · Jose Andreas Lie`}</title>
      <meta
        name="description"
        content={cs ? `${product.name}: a case study by Jose Andreas Lie. ${product.summary}` : product.summary}
      />

      <header className="pd__head">
        <h1 className="t-display">{product.name}</h1>
        <p className="pd__tagline t-headline">
          <em>{product.tagline}</em>
        </p>
        <div className="pd__status">
          <ProductBadge product={product} />
          <MetaRow items={[product.year, cs ? 'Case study' : 'Web app']} />
        </div>
        <div className="pd__actions">
          {product.url && (
            <Button variant="primary" href={product.url}>
              Open {product.name}
              <span className="visually-hidden"> (opens in a new tab)</span>
            </Button>
          )}
          <Button variant="ghost" to="/products">
            All products
          </Button>
        </div>
      </header>

      <Screens product={product} mock={isPrivate} />

      <Rule />

      <div className="pd__body">
        <div className="pd__text prose">
          {product.writeup && <Markdown>{product.writeup}</Markdown>}
          {sections.map(([title, text]) => (
            <section key={title} className="pd__section">
              <h2 className="t-title">{title}</h2>
              <p>{text}</p>
            </section>
          ))}
          {isPrivate && (
            <p className="pd__note t-dim">
              {product.name} is confidential. The client, the address and every real figure stay private, and any screens on this page use mock data only.
            </p>
          )}
        </div>

        <dl className="pd__spec">
          {stack?.length > 0 && (
            <div>
              <dt className="t-label t-dim">Stack</dt>
              <dd>
                <ul className="pd__tags">
                  {stack.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          {role && (
            <div>
              <dt className="t-label t-dim">Role</dt>
              <dd>{role}</dd>
            </div>
          )}
          {host && (
            <div>
              <dt className="t-label t-dim">Link</dt>
              <dd>
                <a href={product.url} target="_blank" rel="noreferrer">
                  {host}
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  )
}
