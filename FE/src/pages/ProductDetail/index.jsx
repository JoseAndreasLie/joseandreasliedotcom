import { useParams } from 'react-router-dom'
import { Button, MetaRow, Rule, Viewfinder } from '../../components/ui'
import { getProduct } from '../../data/products'
import ProductBadge from '../Products/ProductBadge'
import NotFound from '../NotFound'
import './ProductDetail.scss'

const SHOTS = [
  { key: 'desktop', label: 'Desktop', ratio: '16:10' },
  { key: 'mobile', label: 'Mobile', ratio: '9:19.5' },
]

function Screens({ product, mock }) {
  return (
    <div className="pd__screens">
      {SHOTS.map(({ key, label, ratio }) => {
        const src = product.screenshots[key]
        return (
          <figure key={key} className={`pd__shot pd__shot--${key}`}>
            <Viewfinder className="pd__frame">
              {src ? (
                <img src={src} alt={`${product.name} on ${label.toLowerCase()}${mock ? ', mock data' : ''}`} loading="lazy" decoding="async" />
              ) : (
                <span className="pd__empty t-label t-dim">Screenshot pending</span>
              )}
            </Viewfinder>
            <figcaption className="t-label t-dim">
              {[label, ratio, src && mock && 'Mock data'].filter(Boolean).join(' · ')}
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const product = getProduct(slug)
  if (!product) return <NotFound />

  const cs = product.caseStudy
  const stack = cs?.stack ?? product.stack
  const role = cs?.role ?? product.role
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
        content={cs ? `${product.name}: a private money ledger case study by Jose Andreas Lie. Problem, architecture, stack and role.` : product.summary}
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

      <Screens product={product} mock={!!cs} />

      <Rule />

      <div className="pd__body">
        <div className="pd__text prose">
          {product.writeup.map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
          {sections.map(([title, text]) => (
            <section key={title} className="pd__section">
              <h2 className="t-title">{title}</h2>
              <p>{text}</p>
            </section>
          ))}
          {cs && (
            <p className="pd__note t-dim">
              Echo is confidential. The client, the address and every real figure stay private, and the screens on this page use mock data only.
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
