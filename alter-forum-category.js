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
  await c.query(`ALTER TABLE forum_topics MODIFY COLUMN category ENUM('general','support','guides','guild','reports') NOT NULL DEFAULT 'general'`);
  console.log('✅ forum_topics.category enum updated with reports');
  await c.end();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
