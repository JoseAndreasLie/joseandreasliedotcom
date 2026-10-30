import { Sequelize } from 'sequelize'

// underscored: created_at / updated_at, matching the columns the migrations create.
export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  define: { underscored: true }, // snake_case columns; timestamps named per model in models.js
})
