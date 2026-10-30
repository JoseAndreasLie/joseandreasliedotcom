// Adopts the works table created by the old db/schema.sql. IF NOT EXISTS: a no-op on prod, creates it on a fresh DB.
module.exports = {
  async up({ sequelize }) {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS works (
        id          serial PRIMARY KEY,
        slug        text NOT NULL UNIQUE,
        type        text NOT NULL CHECK (type IN ('video', 'photo', 'project', 'writing')),
        title       text NOT NULL,
        summary     text NOT NULL DEFAULT '',
        body        text NOT NULL DEFAULT '',
        cover_url   text,
        media       jsonb NOT NULL DEFAULT '[]',
        links       jsonb NOT NULL DEFAULT '[]',
        tags        text[] NOT NULL DEFAULT '{}',
        shot_on     text,
        date        date NOT NULL DEFAULT current_date,
        published   boolean NOT NULL DEFAULT false,
        created_at  timestamptz NOT NULL DEFAULT now(),
        updated_at  timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS works_published_date_idx ON works (published, date DESC);
    `)
  },
  // Never drops prod data.
  async down() {},
}
