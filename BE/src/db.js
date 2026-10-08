import pg from 'pg'

// Return DATE columns as 'YYYY-MM-DD' strings (default would be a local-midnight JS Date).
pg.types.setTypeParser(pg.types.builtins.DATE, (v) => v)

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
