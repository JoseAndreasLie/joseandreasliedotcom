// MetaRow({ items: Array<string|number|null>, as = 'p', className }): mono EXIF line, falsy items dropped, joined by ' · '. e.g. ['2026', 'video', 'SONY FX3'].
export default function MetaRow({ items = [], as: Tag = 'p', className = '' }) {
  const parts = items.filter((x) => x !== null && x !== undefined && x !== '')
  if (!parts.length) return null
  return <Tag className={`meta-row ${className}`.trim()}>{parts.join(' · ')}</Tag>
}
