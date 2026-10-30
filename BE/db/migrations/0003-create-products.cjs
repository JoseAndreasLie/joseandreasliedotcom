module.exports = {
  async up({ sequelize }) {
    await sequelize.query(`
      CREATE TABLE products (
        id                  serial PRIMARY KEY,
        slug                text NOT NULL UNIQUE,
        name                text NOT NULL,
        tagline             text NOT NULL DEFAULT '',
        url                 text,
        status              text NOT NULL DEFAULT 'Live' CHECK (status IN ('Live', 'Private')),
        badge               text,
        stack               text[] NOT NULL DEFAULT '{}',
        role                text NOT NULL DEFAULT '',
        summary             text NOT NULL DEFAULT '',
        year                integer,
        writeup             text NOT NULL DEFAULT '',
        screenshot_desktop  text,
        screenshot_mobile   text,
        case_study          jsonb,
        published           boolean NOT NULL DEFAULT false,
        featured            boolean NOT NULL DEFAULT false,
        position            integer NOT NULL DEFAULT 0,
        created_at          timestamptz NOT NULL DEFAULT now(),
        updated_at          timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX products_published_position_idx ON products (published, position);
    `)
  },
  async down({ sequelize }) {
    await sequelize.query('DROP TABLE products')
  },
}
