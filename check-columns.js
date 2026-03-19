require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function checkColumns() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_AUTH || 'acore_auth',
  });

  try {
    const [columns] = await pool.query('SHOW COLUMNS FROM shop_items');
    console.log('Columnas encontradas en shop_items:', columns.map(c => c.Field));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkColumns();
