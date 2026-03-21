require('dotenv').config({ path: '.env.local' });

const soapEndpoint = process.env.ACORE_SOAP_URL;
const soapUser     = process.env.ACORE_SOAP_USER;
const soapPassword = process.env.ACORE_SOAP_PASSWORD;

async function sendSoapCommand(command) {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="urn:AC">
  <SOAP-ENV:Body>
    <ns1:executeCommand>
      <command>${command}</command>
    </ns1:executeCommand>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

  const auth = Buffer.from(`${soapUser}:${soapPassword}`).toString('base64');

  const response = await fetch(soapEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type':  'text/xml; charset=utf-8',
      'SOAPAction':    'executeCommand',
    },
    body: xml,
  });

  const text = await response.text();
  return { status: response.status, ok: response.ok, text };
}

async function main() {
  console.log('\n🔍 Shadow Azeroth - Test SOAP\n' + '='.repeat(40));
  console.log('URL:     ', soapEndpoint  || '❌ ACORE_SOAP_URL no definida');
  console.log('Usuario: ', soapUser      || '❌ ACORE_SOAP_USER no definido');
  console.log('Password:', soapPassword  ? '✅ configurada' : '❌ ACORE_SOAP_PASSWORD no definida');
  console.log('='.repeat(40));

  if (!soapEndpoint || !soapUser || !soapPassword) {
    console.error('\n❌ Variables de entorno SOAP incompletas. Revisa .env.local\n');
    process.exit(1);
  }

  // Test 1: server info
  try {
    console.log('\n📡 Test 1: server info');
    const res = await sendSoapCommand('server info');
    if (res.ok && !res.text.includes('faultcode')) {
      const match = res.text.match(/<result>([\s\S]*?)<\/result>/);
      console.log('✅ CONEXIÓN EXITOSA');
      console.log('Respuesta:', match ? match[1].trim() : res.text.substring(0, 200));
    } else {
      console.error('❌ Error SOAP:', res.status, res.text.substring(0, 300));
    }
  } catch (e) {
    console.error('❌ Error de red:', e.message);
    console.error('   → ¿Está el worldserver corriendo? ¿Está abierto el puerto 7878?');
    process.exit(1);
  }

  // Test 2: announce (simula donación)
  try {
    console.log('\n📢 Test 2: .announce');
    const res = await sendSoapCommand('.announce [Test] Shadow Azeroth SOAP funcionando correctamente.');
    if (res.ok && !res.text.includes('faultcode')) {
      console.log('✅ Announce enviado. Deberías ver el mensaje en el juego.');
    } else {
      console.error('❌ Error en announce:', res.text.substring(0, 300));
    }
  } catch (e) {
    console.error('❌ Error announce:', e.message);
  }

  console.log('\n' + '='.repeat(40));
}

main();
