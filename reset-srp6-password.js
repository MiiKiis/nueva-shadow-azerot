const mysql = require('mysql2/promise');
const crypto = require('crypto');
const fs = require('fs');

const SRP6_N = Buffer.from(
  '894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8F' +
  'AB3C82872A3E9BB7',
  'hex'
);
const SRP6_G = 7n;

function loadEnv(path) {
  const env = {};
  const text = fs.readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i > 0) env[line.slice(0, i)] = line.slice(i + 1);
  }
  return env;
}

function bufferToLittleEndianBigInt(buffer) {
  return BigInt('0x' + Buffer.from(buffer).reverse().toString('hex'));
}

function bigIntToLittleEndianBuffer(value, length = 32) {
  let hex = value.toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;

  const buf = Buffer.from(hex, 'hex');
  const result = Buffer.alloc(length, 0);
  const srcStart = Math.max(0, buf.length - length);
  const src = buf.slice(srcStart);
  src.copy(result, 0);
  return result.reverse();
}

function modExpBig(base, exp, mod) {
  if (mod === 1n) return 0n;
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }
  return result;
}

function calculateVerifier(username, password, salt) {
  const userPass = `${username.toUpperCase()}:${password.toUpperCase()}`;
  const i_p = crypto.createHash('sha1').update(userPass).digest();
  const xHash = crypto.createHash('sha1').update(salt).update(i_p).digest();
  const x = bufferToLittleEndianBigInt(xHash);
  const N = bufferToLittleEndianBigInt(SRP6_N);
  const v = modExpBig(SRP6_G, x, N);
  return bigIntToLittleEndianBuffer(v, 32);
}

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error('Uso: node reset-srp6-password.js <username> <password>');
    process.exit(1);
  }

  const env = loadEnv('.env.local');
  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD || env.DB_PASS,
    database: env.DB_AUTH || 'acore_auth',
  });

  const salt = crypto.randomBytes(32);
  const verifier = calculateVerifier(username, password, salt);

  const [result] = await conn.query(
    'UPDATE account SET salt = ?, verifier = ?, username = UPPER(?) WHERE UPPER(username) = UPPER(?)',
    [salt, verifier, username, username]
  );

  if (result.affectedRows === 0) {
    console.error('Usuario no encontrado:', username);
    await conn.end();
    process.exit(1);
  }

  console.log('Password SRP6 actualizada para:', username.toUpperCase());
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
