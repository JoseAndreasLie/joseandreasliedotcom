// Works becomes photo + video only ("Behind the Lens"). Project works move to projects; writing is dropped.
module.exports = {
  async up({ sequelize }) {
    await sequelize.transaction(async (transaction) => {
      await sequelize.query(`
        INSERT INTO projects (slug, title, year, summary, body, cover_url, media, links, tags, published, position, created_at, updated_at)
        SELECT slug, title, extract(year FROM date)::int, summary, body, cover_url, media, links, tags, published, 100, created_at, updated_at
        FROM works WHERE type = 'project'
        ON CONFLICT (slug) DO NOTHING;
        DELETE FROM works WHERE type IN ('project', 'writing');
        ALTER TABLE works DROP CONSTRAINT IF EXISTS works_type_check;
        ALTER TABLE works ADD CONSTRAINT works_type_check CHECK (type IN ('video', 'photo'));
        ALTER TABLE works ADD COLUMN featured boolean NOT NULL DEFAULT false;
      `, { transaction })
    })
  },
  // Moved project rows stay in projects; down only restores the looser constraint.
  async down({ sequelize }) {
    await sequelize.query(`
      ALTER TABLE works DROP COLUMN featured;
      ALTER TABLE works DROP CONSTRAINT works_type_check;
      ALTER TABLE works ADD CONSTRAINT works_type_check CHECK (type IN ('video', 'photo', 'project', 'writing'));
    `)
  },
}
