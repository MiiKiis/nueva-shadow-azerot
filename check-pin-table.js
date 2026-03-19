require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function checkPinTable() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_AUTH || 'acore_auth',
  });

  try {
    const [tables] = await pool.query("SHOW TABLES LIKE 'account_security_pin'");
    console.log('Tabla account_security_pin existe:', tables.length > 0);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPinTable();
