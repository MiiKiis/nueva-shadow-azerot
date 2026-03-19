require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function checkGMLevel() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_AUTH || 'acore_auth',
  });

  try {
    const [user] = await pool.query('SELECT id FROM account WHERE username = ?', [process.env.ACORE_SOAP_USER]);
    if (user.length > 0) {
        const [gm] = await pool.query('SELECT * FROM account_access WHERE id = ?', [user[0].id]);
        console.log('GM Level de MIIKIIS:', gm);
    } else {
        console.error('Usuario MIIKIIS no encontrado en DB de Auth. Tal vez no es el username de la DB?');
        const [accounts] = await pool.query('SELECT username FROM account LIMIT 5');
        console.log('Sugerencias de usuarios:', accounts.map(a => a.username));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkGMLevel();
