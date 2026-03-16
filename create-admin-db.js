const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

function expMod(base, exp, mod) {
    let res = BigInt(1);
    base = base % mod;
    while (exp > 0) {
        if (exp % BigInt(2) === BigInt(1)) res = (res * base) % mod;
        base = (base * base) % mod;
        exp = exp / BigInt(2);
    }
    return res;
}

function calculateVerifier(username, password, salt) {
    const N = Buffer.from(
        '894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8F' +
        'AB3C82872A3E9BB7', 
        'hex'
    );
    const g = BigInt(7);
    const userPassHash = crypto.createHash('sha1')
        .update(`${username.toUpperCase()}:${password.toUpperCase()}`)
        .digest();
    const xHash = crypto.createHash('sha1')
        .update(salt)
        .update(userPassHash)
        .digest();
    let x = BigInt('0x' + Buffer.from(xHash).reverse().toString('hex'));
    // N is already a BE hex string string or BE buffer. We want the BigInt value.
    const nBI = BigInt('0x' + N.toString('hex'));
    const vBI = expMod(g, x, nBI);
    let vHex = vBI.toString(16);
    if (vHex.length % 2 !== 0) vHex = '0' + vHex;
    const vBuf = Buffer.from(vHex, 'hex').reverse();
    const finalV = Buffer.alloc(32, 0);
    vBuf.copy(finalV);
    return finalV;
}

async function main() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    });

    const username = 'ADMIN';
    const password = 'ADMIN';
    const email = 'admin@azerothcore.org';

    try {
        console.log(`Creando cuenta admin: ${username}...`);
        
        const salt = crypto.randomBytes(32);
        const verifier = calculateVerifier(username, password, salt);

        // 1. Check if exists
        const [rows] = await pool.query('SELECT id FROM account WHERE username = ?', [username]);
        let accountId;

        if (rows.length > 0) {
            accountId = rows[0].id;
            console.log(`Actualizando contraseña para cuenta existente (ID: ${accountId})...`);
            await pool.query(
                'UPDATE account SET salt = ?, verifier = ?, email = ? WHERE id = ?',
                [salt, verifier, email, accountId]
            );
        } else {
            console.log(`Insertando nueva cuenta...`);
            const [result] = await pool.query(
                'INSERT INTO account (username, salt, verifier, email, expansion) VALUES (?, ?, ?, ?, ?)',
                [username.toUpperCase(), salt, verifier, email, 2]
            );
            accountId = result.insertId;
        }

        // 2. Ensure admin access (GM Rank 3)
        // Check if access already exists
        const [access] = await pool.query('SELECT id FROM account_access WHERE id = ?', [accountId]);
        if (access.length === 0) {
            await pool.query(
                'INSERT INTO account_access (id, gmlevel, RealmID) VALUES (?, ?, ?)',
                [accountId, 3, -1]
            );
        } else {
            await pool.query(
                'UPDATE account_access SET gmlevel = ? WHERE id = ?',
                [3, accountId]
            );
        }

        console.log('¡ÉXITO! Cuenta admin creada correctamente.');
        console.log(`ID: ${accountId}`);
        console.log(`User: ${username}`);
        console.log(`Pass: ${password}`);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            console.log('La cuenta ADMIN ya existe.');
        } else {
            console.error('Error al crear cuenta:', err);
        }
    } finally {
        await pool.end();
    }
}

main();
