import RecDot from './RecDot'

// ProductBadge({ product }): live status reads as a REC light, Echo carries its private badge.
export default function ProductBadge({ product }) {
  return (
    <span className="product-badge t-label">
      <RecDot pulse={product.status === 'Live'} />
      {product.badge ?? product.status}
    </span>
  )
}
