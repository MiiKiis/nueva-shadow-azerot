require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function checkAccountLength() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_AUTH || 'acore_auth',
  });

  try {
    const [rows] = await pool.query('SELECT username, LENGTH(salt) as salt_len, LENGTH(verifier) as verifier_len FROM account WHERE id = 171');
    fs.writeFileSync('account_len.txt', JSON.stringify(rows, null, 2));
    console.log('Result saved to account_len.txt');
  } catch (error) {
    fs.writeFileSync('account_len.txt', 'Error: ' + error.message);
  } finally {
    await pool.end();
  }
}

checkAccountLength();
