import { MediaCard } from '../../components/ui'
import ProductBadge from './ProductBadge'
import { products } from '../../data/products'
import './Products.scss'

export default function Products() {
  return (
    <div className="products container">
      <title>Live Products · Jose Andreas Lie</title>
      <meta name="description" content="Live products by Jose Andreas Lie: Splitter, an expense splitter for groups, Badminton matchmaking, and Echo, a private money ledger in production." />
      <header className="products__head">
        <h1 className="t-display">
          Live <em>products</em>
        </h1>
        <p className="products__intro prose t-dim">
          Small tools built for real groups and a real client. Two are open to anyone. One runs privately in production.
        </p>
      </header>

      <ol className="products__grid">
        {products.map((p, i) => (
          <li key={p.slug} style={{ '--i': i }}>
            <MediaCard
              to={`/products/${p.slug}`}
              cover={p.screenshots.desktop}
              alt={p.screenshots.desktop ? `${p.name} on desktop` : ''}
              title={p.name}
              summary={p.summary}
              meta={[p.tagline]}
              index={i + 1}
              total={products.length}
              badge={<ProductBadge product={p} />}
              headingLevel={2}
            />
          </li>
        ))}
      </ol>
    </div>
  )
}
