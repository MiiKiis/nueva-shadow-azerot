const http = require('http');
const net = require('net');
require('dotenv').config({ path: '.env.local' });

async function checkPortAndSOAP() {
  const soapEndpoint = process.env.ACORE_SOAP_URL || 'http://127.0.0.1:7878';
  const url = new URL(soapEndpoint);
  const host = url.hostname;
  const port = url.port || 80;

  console.log(`\n===========================================`);
  console.log(`🔍 INICIANDO DIAGNÓSTICO DE SOAP - AZEROTHCORE`);
  console.log(`===========================================\n`);
  
  console.log(`1️⃣  Verificando si el puerto ${port} está abierto en ${host}...`);

  const client = new net.Socket();
  client.setTimeout(3000);

  client.on('connect', () => {
    console.log(`✅ ¡ÉXITO! El puerto ${port} está ABIERTO. El worldserver está respondiendo a nivel de red.\n`);
    client.destroy();
    
    // Si el puerto está abierto, intentamos mandar el XML (Sobre SOAP)
    testSoapEnvelope(soapEndpoint);
  });

  client.on('timeout', () => {
    console.log(`❌ ERROR: Timeout. El puerto ${port} no responde.`);
    console.log(`👉 Posible causa: Firewall bloqueando el puerto o el worldserver está trabado.\n`);
    client.destroy();
  });

  client.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      console.log(`❌ ERROR: ECONNREFUSED. La conexión fue rechazada.`);
      console.log(`👉 DIAGNÓSTICO: Tu servidor de World of Warcraft (worldserver) NO está escuchando en el puerto ${port}.`);
      console.log(`👉 SOLUCIÓN A REVISAR:`);
      console.log(`   1. ¿Está prendida la consola del worldserver?`);
      console.log(`   2. En tu archivo worldserver.conf, ¿está "SOAP.Enabled = 1"?`);
      console.log(`   3. En tu archivo worldserver.conf, ¿está "SOAP.Port = ${port}"?`);
      console.log(`   MIRA en la consola de tu emulador al prender, DEBE decir "SOAP-Thread started on port ${port}". Si no dice eso, ¡el SOAP no está activado!\n`);
    } else {
      console.log(`❌ ERROR DESCONOCIDO: ${err.message}\n`);
    }
    client.destroy();
  });

  client.connect(port, host);
}

async function testSoapEnvelope(soapEndpoint) {
  const soapUser = process.env.ACORE_SOAP_USER || '';
  const soapPassword = process.env.ACORE_SOAP_PASSWORD || '';
  
  console.log(`2️⃣  Enviando el 'Sobre' XML (Envelope) de prueba...`);
  console.log(`Usuario SOAP: ${soapUser}`);
  
  const auth = Buffer.from(`${soapUser}:${soapPassword}`).toString('base64');
  const command = `.server info`;
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="urn:AC">
  <SOAP-ENV:Body>
    <ns1:executeCommand>
      <command>${command}</command>
    </ns1:executeCommand>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

  try {
    const response = await fetch(soapEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'executeCommand',
      },
      body: xml,
    });

    const text = await response.text();
    console.log(`\n📥 RESPUESTA DEL SERVIDOR DE WOW (HTTP ${response.status}):`);
    console.log(text);
    
    if (response.ok && !/faultcode|SOAP-ENV:Fault/i.test(text)) {
      console.log(`\n✅ ¡EL SOBRE XML ES CORRECTO Y FUE ACEPTADO!`);
      console.log(`El problema no es el XML ni el código de la web. Las compras deberían funcionar perfectamente ahora.\n`);
    } else {
      console.log(`\n❌ EL SERVIDOR RECHAZÓ EL COMANDO. Error de SOAP Auth o Envelope.`);
      console.log(`Asegúrate de que la cuenta ${soapUser} tenga nivel de GM 3+ (Administrador).\n`);
    }

  } catch (err) {
    console.log(`\n❌ ERROR AL ENVIAR PETICIÓN HTTP: ${err.message}\n`);
  }
}

checkPortAndSOAP();
