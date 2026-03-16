/**
 * Script para actualizar contraseña de cuenta existente
 * Ejecutar: node update-password.js
 */

import mysql from 'mysql2/promise';
import crypto from 'crypto';

const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'blizzcms',
  password: 'teamoevelin2026',
  database: 'acore_auth',
};

// SRP6 Prime (N) - Standard for WoW 3.3.5a
const SRP6_N = Buffer.from(
  '894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8F' +
  'AB3C82872A3E9BB7',
  'hex'
);

const SRP6_G = BigInt(7);

function bufferToLittleEndianBigInt(buffer) {
  return BigInt('0x' + buffer.reverse().toString('hex'));
}

function bigIntToLittleEndianBuffer(value, length = 32) {
  let hex = value.toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  
  const buf = Buffer.from(hex, 'hex');
  const result = Buffer.alloc(length, 0);
  
  const copyLength = Math.min(buf.length, length);
  buf.copy(result, 0, Math.max(0, buf.length - length));
  
  return result.reverse();
}

function generateSrp6Data(username, password) {
  const salt = crypto.randomBytes(32);
  
  const uppercase_user_pass = `${username.toUpperCase()}:${password.toUpperCase()}`;
  const I_P = crypto.createHash('sha1').update(uppercase_user_pass).digest();
  const x = crypto.createHash('sha1').update(Buffer.concat([salt, I_P])).digest();
  
  const x_big = bufferToLittleEndianBigInt(x);
  const N_big = bufferToLittleEndianBigInt(SRP6_N.slice());
  const v_big = modPow(SRP6_G, x_big, N_big);
  
  const verifier = bigIntToLittleEndianBuffer(v_big, 32);
  
  return { salt, verifier };
}

function modPow(base, exp, mod) {
  let result = BigInt(1);
  base = base % mod;
  
  while (exp > BigInt(0)) {
    if (exp % BigInt(2) === BigInt(1)) {
      result = (result * base) % mod;
    }
    exp = exp >> BigInt(1);
    base = (base * base) % mod;
  }
  
  return result;
}

async function updatePassword() {
  const connection = await mysql.createConnection(DB_CONFIG);

  try {
    const username = 'milkis';
    const newPassword = 'Yafetharuquipa12.';

    console.log(`Actualizando contraseña para: ${username}`);

    // Generar nuevo SRP6
    const { salt, verifier } = generateSrp6Data(username, newPassword);

    // Actualizar en la BD
    const result = await connection.query(
      'UPDATE account SET salt = ?, verifier = ? WHERE UPPER(username) = UPPER(?)',
      [salt, verifier, username]
    );

    if (result[0].affectedRows > 0) {
      console.log('✅ Contraseña actualizada exitosamente!');
      console.log(`Username: ${username}`);
      console.log(`Nueva contraseña: ${newPassword}`);
    } else {
      console.log('❌ Usuario no encontrado');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

updatePassword();
