// Run: node create-forum-tables.js
require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_AUTH,
    connectTimeout: 8000,
  });

  await c.query(`
    CREATE TABLE IF NOT EXISTS \`forum_topics\` (
      \`id\`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`title\`       VARCHAR(200) NOT NULL,
      \`category\`    ENUM('general','support','guides','guild','reports','suggestions','announcements') NOT NULL DEFAULT 'general',
      \`author_id\`   INT UNSIGNED NOT NULL,
      \`pinned\`      TINYINT(1) NOT NULL DEFAULT 0,
      \`locked\`      TINYINT(1) NOT NULL DEFAULT 0,
      \`completed\`   TINYINT(1) NOT NULL DEFAULT 0,
      \`views\`       INT UNSIGNED NOT NULL DEFAULT 0,
      \`created_at\`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_topic_category\` (\`category\`),
      KEY \`idx_topic_author\`   (\`author_id\`),
      CONSTRAINT \`fk_topic_author\` FOREIGN KEY (\`author_id\`) REFERENCES \`account\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await c.query(`
    CREATE TABLE IF NOT EXISTS \`forum_comments\` (
      \`id\`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`topic_id\`    INT UNSIGNED NOT NULL,
      \`author_id\`   INT UNSIGNED NOT NULL,
      \`comment\`     TEXT NOT NULL,
      \`created_at\`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_comment_topic\`  (\`topic_id\`),
      KEY \`idx_comment_author\` (\`author_id\`),
      CONSTRAINT \`fk_comment_topic\`  FOREIGN KEY (\`topic_id\`)  REFERENCES \`forum_topics\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_comment_author\` FOREIGN KEY (\`author_id\`) REFERENCES \`account\`(\`id\`)       ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const [[{ topics }]] = await c.query('SELECT COUNT(*) AS topics FROM forum_topics');
  const [[{ comments }]] = await c.query('SELECT COUNT(*) AS comments FROM forum_comments');
  console.log(`✅ forum_topics ready   (rows: ${topics})`);
  console.log(`✅ forum_comments ready (rows: ${comments})`);

  await c.end();
})().catch(e => {
  console.error('❌ FAIL', e.code || '', e.message);
  process.exit(1);
});
