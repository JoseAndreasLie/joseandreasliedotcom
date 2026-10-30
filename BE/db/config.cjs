// sequelize-cli config. Every env reads DATABASE_URL (server .env, or TEST_DATABASE_URL via test/helpers.js).
const env = { use_env_variable: 'DATABASE_URL', dialect: 'postgres', logging: false }
module.exports = { development: env, test: env, production: env }
