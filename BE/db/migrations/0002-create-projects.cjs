module.exports = {
  async up({ sequelize }) {
    await sequelize.query(`
      CREATE TABLE projects (
        id          serial PRIMARY KEY,
        slug        text NOT NULL UNIQUE,
        title       text NOT NULL,
        year        integer,
        company     text NOT NULL DEFAULT '',
        role        text NOT NULL DEFAULT '',
        summary     text NOT NULL DEFAULT '',
        body        text NOT NULL DEFAULT '',
        cover_url   text,
        media       jsonb NOT NULL DEFAULT '[]',
        links       jsonb NOT NULL DEFAULT '[]',
        tags        text[] NOT NULL DEFAULT '{}',
        notes       jsonb NOT NULL DEFAULT '[]',
        published   boolean NOT NULL DEFAULT false,
        featured    boolean NOT NULL DEFAULT false,
        position    integer NOT NULL DEFAULT 0,
        created_at  timestamptz NOT NULL DEFAULT now(),
        updated_at  timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX projects_published_position_idx ON projects (published, position);
    `)
  },
  async down({ sequelize }) {
    await sequelize.query('DROP TABLE projects')
  },
}
