require('dotenv').config({ path: '.env.local' });

async function testSoap() {
  const soapEndpoint = process.env.ACORE_SOAP_URL;
  const soapUser = process.env.ACORE_SOAP_USER;
  const soapPassword = process.env.ACORE_SOAP_PASSWORD;

  console.log('--- Probando Conexión SOAP ---');
  console.log('URL:', soapEndpoint);
  console.log('Usuario:', soapUser);

  const command = '.help';
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="urn:AC">
  <SOAP-ENV:Body>
    <ns1:executeCommand>
      <command>${command}</command>
    </ns1:executeCommand>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

  const auth = Buffer.from(`${soapUser}:${soapPassword}`).toString('base64');

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
    console.log('Status HTTP:', response.status);

    if (response.ok) {
      if (text.includes('SOAP-ENV:Fault') || text.includes('faultcode')) {
        console.error('ERROR: El servidor SOAP respondió con un fallo.');
        console.log('Respuesta:', text);
      } else {
        console.log('¡ÉXITO! Conexión SOAP establecida correctamente.');
        const match = text.match(/<result>(.*?)<\/result>/s);
        if (match) {
          console.log('Respuesta del servidor:', match[1].trim());
        } else {
          console.log('Respuesta completa:', text);
        }
      }
    } else {
      console.error('ERROR: No se pudo conectar al servidor SOAP.');
      console.log('Respuesta:', text);
    }
  } catch (error) {
    console.error('ERROR de red:', error.message);
  }
}

testSoap();
