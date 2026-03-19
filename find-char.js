require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function findTestChar() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_CHARACTERS || 'acore_characters',
  });

  try {
    const [chars] = await pool.query('SELECT name FROM characters LIMIT 5');
    console.log('Personajes sugeridos para pruebas:', chars.map(c => c.name));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

findTestChar();
