import { DataTypes } from 'sequelize'
import { sequelize } from './db.js'

// Columns mirror db/migrations; the migrations own the schema, these only map it.
const { STRING, TEXT, INTEGER, BOOLEAN, DATEONLY, JSONB, ARRAY } = DataTypes
// Factories, not shared objects: Sequelize mutates each attribute definition (sets its column name).
const text = () => ({ type: TEXT, allowNull: false, defaultValue: '' })
const nullable = () => ({ type: TEXT, allowNull: true })
const json = () => ({ type: JSONB, allowNull: false, defaultValue: [] })
const list = () => ({ type: ARRAY(TEXT), allowNull: false, defaultValue: [] })
const flag = () => ({ type: BOOLEAN, allowNull: false, defaultValue: false })
const year = () => ({ type: INTEGER, allowNull: true })
const position = () => ({ type: INTEGER, allowNull: false, defaultValue: 0 })
const slug = () => ({ type: STRING, allowNull: false, unique: true })
const table = (tableName) => ({ tableName, createdAt: 'created_at', updatedAt: 'updated_at' })

export const Work = sequelize.define('Work', {
  slug: slug(),
  type: { type: TEXT, allowNull: false },
  title: text(),
  summary: text(),
  body: text(),
  cover_url: nullable(),
  media: json(),
  links: json(),
  tags: list(),
  shot_on: nullable(),
  date: { type: DATEONLY }, // NOT NULL in the DB; omitted on create so current_date applies
  published: flag(),
  featured: flag(),
}, table('works'))

export const Project = sequelize.define('Project', {
  slug: slug(),
  title: text(),
  year: year(),
  company: text(),
  role: text(),
  summary: text(),
  body: text(),
  cover_url: nullable(),
  media: json(),
  links: json(),
  tags: list(),
  notes: json(),
  published: flag(),
  featured: flag(),
  position: position(),
}, table('projects'))

export const Product = sequelize.define('Product', {
  slug: slug(),
  name: text(),
  tagline: text(),
  url: nullable(),
  status: { type: TEXT, allowNull: false, defaultValue: 'Live' },
  badge: nullable(),
  stack: list(),
  role: text(),
  summary: text(),
  year: year(),
  writeup: text(),
  screenshot_desktop: nullable(),
  screenshot_mobile: nullable(),
  case_study: { type: JSONB, allowNull: true },
  published: flag(),
  featured: flag(),
  position: position(),
}, table('products'))
