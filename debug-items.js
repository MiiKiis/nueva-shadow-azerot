require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function checkItems() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_AUTH || 'acore_auth',
  });

  try {
    const [rows] = await pool.query('SELECT name, service_type, service_data FROM shop_items');
    fs.writeFileSync('items_out.txt', JSON.stringify(rows, null, 2));
    console.log('Result saved to items_out.txt');
  } catch (error) {
    fs.writeFileSync('items_out.txt', 'Error: ' + error.message);
  } finally {
    await pool.end();
  }
}

checkItems();
