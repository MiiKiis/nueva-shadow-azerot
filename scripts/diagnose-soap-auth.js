require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const mysql = require('mysql2/promise');

const SOAP_VARIANTS = [
  { namespace: 'urn:AC', prefixedMethod: true, soapAction: 'executeCommand' },
  { namespace: 'urn:MaNGOS', prefixedMethod: true, soapAction: 'executeCommand' },
  { namespace: 'urn:TC', prefixedMethod: true, soapAction: 'executeCommand' },
  { namespace: 'urn:AC', prefixedMethod: false, soapAction: 'urn:AC#executeCommand' },
  { namespace: 'urn:MaNGOS', prefixedMethod: false, soapAction: 'urn:MaNGOS#executeCommand' },
];

function readEnvRaw(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || /^\s*#/.test(line)) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1);
    out[k] = v;
  }
  return out;
}

function buildSoapEnvelope(command, variant) {
  const method = variant.prefixedMethod ? 'ns1:executeCommand' : 'executeCommand';
  return `<?xml version="1.0" encoding="utf-8"?>\n<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="${variant.namespace}">\n  <SOAP-ENV:Body>\n    <${method}>\n      <command>${command}</command>\n    </${method}>\n  </SOAP-ENV:Body>\n</SOAP-ENV:Envelope>`;
}

function parseFault(text) {
  if (!text) return '';
  const m = text.match(/<faultstring>([\s\S]*?)<\/faultstring>/i);
  return m ? String(m[1]).trim() : '';
}

async function probeSoap(endpoint, user, pass) {
  const authUsers = Array.from(new Set([String(user || ''), String(user || '').toUpperCase()]));
  const probes = [];

  for (const authUser of authUsers) {
    const auth = Buffer.from(`${authUser}:${pass}`).toString('base64');
    for (const variant of SOAP_VARIANTS) {
      const xml = buildSoapEnvelope('server info', variant);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'text/xml; charset=utf-8',
            SOAPAction: variant.soapAction,
          },
          body: xml,
        });
        const text = await response.text();
        const fault = parseFault(text);
        const hasFault = /faultcode|SOAP-ENV:Fault|<result>false<\/result>/i.test(text);
        const ok = response.ok && !hasFault;
        probes.push({
          authUser,
          namespace: variant.namespace,
          method: variant.prefixedMethod ? 'prefixed' : 'plain',
          soapAction: variant.soapAction,
          status: response.status,
          ok,
          fault: fault || null,
        });
        if (ok) return { ok: true, probes };
      } catch (err) {
        probes.push({
          authUser,
          namespace: variant.namespace,
          method: variant.prefixedMethod ? 'prefixed' : 'plain',
          soapAction: variant.soapAction,
          status: null,
          ok: false,
          fault: `NETWORK: ${String(err?.message || err)}`,
        });
        return { ok: false, probes };
      }
    }
  }

  return { ok: false, probes };
}

async function checkDbAccess(dbEnv, soapUser) {
  const result = {
    connected: false,
    error: null,
    account: null,
    accessRows: [],
    hints: [],
  };

  let conn;
  try {
    conn = await mysql.createConnection({
      host: dbEnv.DB_HOST,
      port: Number(dbEnv.DB_PORT || 3306),
      user: dbEnv.DB_USER,
      password: dbEnv.DB_PASSWORD || dbEnv.DB_PASS || '',
      database: dbEnv.DB_AUTH || 'acore_auth',
    });
    result.connected = true;

    const [acctRows] = await conn.query(
      'SELECT id, username FROM account WHERE UPPER(username) = UPPER(?) LIMIT 1',
      [soapUser]
    );

    const account = Array.isArray(acctRows) && acctRows.length > 0 ? acctRows[0] : null;
    result.account = account || null;
    if (!account) {
      result.hints.push('El usuario SOAP no existe en acore_auth.account.');
      return result;
    }

    const accessQueries = [
      { sql: 'SELECT id AS account_id, gmlevel AS security, RealmID AS realm FROM account_access WHERE id = ?', arg: account.id },
      { sql: 'SELECT AccountID AS account_id, SecurityLevel AS security, RealmID AS realm FROM account_access WHERE AccountID = ?', arg: account.id },
    ];

    for (const q of accessQueries) {
      try {
        const [rows] = await conn.query(q.sql, [q.arg]);
        if (Array.isArray(rows) && rows.length > 0) {
          result.accessRows = rows;
          break;
        }
      } catch {
        // Try next schema flavor.
      }
    }

    if (!result.accessRows.length) {
      result.hints.push('No hay fila en account_access para la cuenta SOAP.');
      return result;
    }

    const maxSec = result.accessRows.reduce((m, r) => Math.max(m, Number(r.security || 0)), 0);
    if (maxSec < 3) {
      result.hints.push(`Nivel de seguridad insuficiente: ${maxSec}. Recomendado >= 3.`);
    }
    if (!result.accessRows.some(r => Number(r.realm) === -1)) {
      result.hints.push('No hay acceso global RealmID=-1; valida RealmID del realm activo.');
    }

    return result;
  } catch (err) {
    result.error = String(err?.message || err);
    if (/auth_gssapi_client/i.test(result.error)) {
      result.hints.push('El driver mysql2 local no soporta auth_gssapi_client. Ejecuta las queries en el VPS o cambia plugin del usuario DB.');
    }
    return result;
  } finally {
    if (conn) await conn.end();
  }
}

function printSection(title) {
  console.log(`\n${'='.repeat(70)}\n${title}\n${'='.repeat(70)}`);
}

async function main() {
  const envRaw = readEnvRaw('.env.local');
  const soapUrl = process.env.ACORE_SOAP_URL || '';
  const soapUser = process.env.ACORE_SOAP_USER || '';
  const soapPass = process.env.ACORE_SOAP_PASSWORD || '';

  printSection('SOAP AUTH DIAGNOSTIC');
  console.log(JSON.stringify({
    soapUrl,
    hasSoapUser: Boolean(soapUser),
    hasSoapPassword: Boolean(soapPass),
    soapUserLen: soapUser.length,
    soapPassLen: soapPass.length,
    userHasWhitespace: /\s/.test(soapUser),
    passHasLeadingOrTrailingWhitespace: soapPass !== soapPass.trim(),
    userWrappedInQuotes: /^(".*"|'.*')$/.test(String(envRaw.ACORE_SOAP_USER || '').trim()),
    passWrappedInQuotes: /^(".*"|'.*')$/.test(String(envRaw.ACORE_SOAP_PASSWORD || '').trim()),
  }, null, 2));

  if (!soapUrl || !soapUser || !soapPass) {
    console.log('\nFATAL: faltan variables SOAP en .env.local');
    process.exit(1);
  }

  printSection('SOAP PROBES (auth + namespace + method)');
  const soap = await probeSoap(soapUrl, soapUser, soapPass);
  for (const p of soap.probes) {
    console.log(`[${p.status === null ? 'NET' : p.status}] user=${p.authUser} ns=${p.namespace} method=${p.method} action=${p.soapAction} ok=${p.ok} fault=${p.fault || '-'}`);
  }

  printSection('DB PRIVILEGE CHECK');
  const db = await checkDbAccess(process.env, soapUser);
  console.log(JSON.stringify(db, null, 2));

  printSection('SUMMARY');
  const had401 = soap.probes.some(p => Number(p.status) === 401 || Number(p.status) === 403);
  const hadSuccess = soap.probes.some(p => p.ok);
  if (hadSuccess) {
    console.log('OK: una variante SOAP fue aceptada.');
  } else if (had401) {
    console.log('FAIL AUTH: SOAP devuelve 401/403. Revisa usuario/password SOAP y account_access.');
  } else if (soap.probes.some(p => p.status === null)) {
    console.log('FAIL NETWORK: no se pudo conectar al endpoint SOAP desde esta maquina.');
  } else {
    console.log('FAIL SOAP: no hubo exito; revisar faultstring y variants.');
  }

  if (db.hints && db.hints.length) {
    console.log('\nHints DB:');
    for (const h of db.hints) console.log(`- ${h}`);
  }
}

main().catch((err) => {
  console.error('Diagnostic crashed:', err);
  process.exit(1);
});
