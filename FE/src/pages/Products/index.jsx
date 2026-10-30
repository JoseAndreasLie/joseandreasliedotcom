import { LoadState, MediaCard } from '../../components/ui'
import ProductBadge from './ProductBadge'
import { list } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import './Products.scss'

export default function Products() {
  const state = useFetch(() => list('products'), [])
  const products = state.data ?? []

  return (
    <div className="products container">
      <title>Live Products · Jose Andreas Lie</title>
      <meta
        name="description"
        content="Live products by Jose Andreas Lie: small tools built for real groups, and private software running in production for clients."
      />
      <header className="products__head">
        <h1 className="t-display">
          Live <em>products</em>
        </h1>
        <p className="products__intro prose t-dim">
          Small tools built for real groups and real clients. Some are open to anyone, some run privately in production.
        </p>
      </header>

      <LoadState state={state} noun="Products" empty="No products published yet." />

      {products.length > 0 && (
        <ol className="products__grid">
          {products.map((p, i) => (
            <li key={p.slug} style={{ '--i': i }}>
              <MediaCard
                to={`/products/${p.slug}`}
                cover={p.screenshot_desktop}
                alt={p.screenshot_desktop ? `${p.name} on desktop` : ''}
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
      )}
    </div>
  )
}
