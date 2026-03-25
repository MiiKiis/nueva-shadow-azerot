require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function updateDatabase() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_AUTH || 'acore_auth',
  });

  try {
    const [cols] = await pool.query('SHOW COLUMNS FROM shop_items');
    const columnNames = cols.map(c => c.Field);

    if (!columnNames.includes('item_level')) {
      console.log('Adding item_level column...');
      await pool.query("ALTER TABLE shop_items ADD COLUMN item_level INT UNSIGNED DEFAULT 0 AFTER tier");
      console.log('✓ Added item_level column.');
    } else {
      console.log('item_level column already exists.');
    }

    console.log('Database update completed successfully.');
  } catch (error) {
    console.error('Error during update:', error.message);
  } finally {
    await pool.end();
  }
}

updateDatabase();
