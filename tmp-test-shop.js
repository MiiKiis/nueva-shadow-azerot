require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function checkTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  try {
    const [dbs] = await connection.query('SHOW DATABASES');
    for (const row of dbs) {
      const db = row.Database;
      if (['acore_auth', 'acore_characters', 'acore_world', 'blizzcms', 'shadow_azeroth'].includes(db)) {
        const [tables] = await connection.query(`SHOW TABLES IN ?? LIKE '%shop%'`, [db]);
        console.log(`Tablas shop en ${db}:`, tables.map(t => Object.values(t)[0]));
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

checkTables();
