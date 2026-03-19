require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function testPurchase() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_AUTH || 'acore_auth',
  });

  try {
    console.log('--- Revisando items de la tienda ---');
    const [items] = await pool.query('SELECT * FROM shop_items LIMIT 5');
    console.log(`Encontrados ${items.length} items (limitado a 5).`);
    console.log(JSON.stringify(items, null, 2));

    console.log('--- Revisando últimas compras ---');
    try {
        const [purchases] = await pool.query('SELECT * FROM shop_purchases ORDER BY id DESC LIMIT 5');
        console.log(`Últimas 5 compras:`, purchases);
    } catch (e) {
        console.log('Tabla shop_purchases no existe aún o vacía:', e.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testPurchase();
