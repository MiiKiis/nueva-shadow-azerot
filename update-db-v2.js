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

    if (!columnNames.includes('faction')) {
      console.log('Adding faction column...');
      await pool.query("ALTER TABLE shop_items ADD COLUMN faction VARCHAR(20) DEFAULT 'all' AFTER class_mask");
      console.log('✓ Added faction column.');
    } else {
      console.log('Faction column already exists.');
    }

    console.log('Updating service_type ENUM...');
    // Redefine ENUM to be sure
    await pool.query(`
      ALTER TABLE shop_items 
      MODIFY COLUMN service_type ENUM('none','name_change','race_change','faction_change','level_boost','gold_pack','profession','character_transfer','bundle','experience') NOT NULL DEFAULT 'none'
    `);
    console.log('✓ service_type ENUM updated.');

    console.log('Database update completed successfully.');
  } catch (error) {
    console.error('Error during update:', error.message);
  } finally {
    await pool.end();
  }
}

updateDatabase();
