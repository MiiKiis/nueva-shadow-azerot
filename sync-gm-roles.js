require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function syncGMRoles() {
  console.log('--- Iniciando sincronización de roles GM (BlizzCMS -> AzerothCore) ---');

  // DB config
  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const cmsDb = process.env.DB_NAME_CMS || 'blizzcms';
  const authDb = process.env.DB_NAME_AUTH || 'acore_auth';

  let cmsPool, authPool;

  try {
    cmsPool = mysql.createPool({ host: dbHost, user: dbUser, password: dbPassword, database: cmsDb });
    authPool = mysql.createPool({ host: dbHost, user: dbUser, password: dbPassword, database: authDb });

    // 1. Obtener todos los usuarios con role = 1 en blizzcms.users
    console.log(`Buscando administradores en la tabla ${cmsDb}.users...`);
    const [cmsAdmins] = await cmsPool.query('SELECT id, username FROM users WHERE role = 1');
    
    if (cmsAdmins.length === 0) {
      console.log('No se encontraron usuarios con role = 1 en el CMS.');
      return;
    }

    console.log(`¡Se encontraron ${cmsAdmins.length} administrador(es)! Sincronizando en ${authDb}.account_access...`);

    let syncCount = 0;
    for (const admin of cmsAdmins) {
      const accountId = admin.id;
      const username = admin.username;

      // Check if already in account_access
      const [existing] = await authPool.query('SELECT gmlevel FROM account_access WHERE id = ?', [accountId]);
      
      if (existing.length > 0) {
        if (existing[0].gmlevel < 3) {
          // Update existing to 3
          await authPool.query('UPDATE account_access SET gmlevel = 3, RealmID = -1 WHERE id = ?', [accountId]);
          console.log(`[Actualizado] Usuario '${username}' (ID: ${accountId}) elevado a GM nivel 3.`);
          syncCount++;
        } else {
          console.log(`[Omitido] Usuario '${username}' (ID: ${accountId}) ya es GM nivel ${existing[0].gmlevel}.`);
        }
      } else {
        // Does not exist, insert
        await authPool.query(
          'INSERT INTO account_access (id, gmlevel, RealmID, comment) VALUES (?, 3, -1, ?)',
          [accountId, `Sincronizado vía web (${username})`]
        );
        console.log(`[Insertado] Usuario '${username}' (ID: ${accountId}) agregado como GM nivel 3.`);
        syncCount++;
      }
    }

    console.log(`--- Sincronización completada. Total modificados/añadidos: ${syncCount} ---`);
    console.log('Si ejecutas este script con un cron job o tarea programada, las bases se mantendrán iguales siempre.');
    
  } catch (error) {
    console.error('Error durante la sincronización:', error);
  } finally {
    if (cmsPool) await cmsPool.end();
    if (authPool) await authPool.end();
  }
}

syncGMRoles();
