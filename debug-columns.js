require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const fs = require('fs');

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
    const columnNames = columns.map(c => c.Field);
    fs.writeFileSync('columns_out.txt', JSON.stringify(columnNames, null, 2));
    console.log('Result saved to columns_out.txt');
  } catch (error) {
    fs.writeFileSync('columns_out.txt', 'Error: ' + error.message);
  } finally {
    await pool.end();
  }
}

checkColumns();
