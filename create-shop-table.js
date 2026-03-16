// Run: node create-shop-table.js
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
    CREATE TABLE IF NOT EXISTS \`shop_items\` (
      \`id\`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`item_id\`         INT UNSIGNED NOT NULL,
      \`name\`            VARCHAR(100) NOT NULL,
      \`image\`           VARCHAR(100) NULL DEFAULT 'inv_misc_questionmark',
      \`price\`           INT UNSIGNED NOT NULL,
      \`currency\`        ENUM('vp','dp') NOT NULL DEFAULT 'vp',
      \`quality\`         ENUM('comun','poco_comun','raro','epico','legendario') NOT NULL DEFAULT 'comun',
      \`category\`        ENUM('pve','pvp','misc') NOT NULL DEFAULT 'misc',
      \`tier\`            TINYINT UNSIGNED NOT NULL DEFAULT 0,
      \`class_mask\`      INT UNSIGNED NOT NULL DEFAULT 0,
      \`soap_item_entry\` INT UNSIGNED NULL,
      \`soap_item_count\` TINYINT UNSIGNED NOT NULL DEFAULT 1,
      PRIMARY KEY (\`id\`),
      KEY \`idx_shop_category_tier\` (\`category\`, \`tier\`),
      KEY \`idx_shop_class_mask\` (\`class_mask\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const [rows] = await c.query('SELECT COUNT(*) AS cnt FROM shop_items');
  console.log('✅ shop_items table ready. Current rows:', rows[0].cnt);

  await c.end();
})().catch(e => {
  console.error('❌ FAIL', e.code || '', e.message);
  process.exit(1);
});
