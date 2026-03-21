require('dotenv').config({ path: '.env.local' });

async function testSoapMail() {
  const soapEndpoint = process.env.ACORE_SOAP_URL || 'http://127.0.0.1:7878/';
  const soapUser = process.env.ACORE_SOAP_USER;
  const soapPassword = process.env.ACORE_SOAP_PASSWORD;

  const auth = Buffer.from(`${soapUser}:${soapPassword}`).toString('base64');
  
  // Test both send items and setskill
  const commands = [
    `.send items MIIKIIS "Agradecimiento" "gracias por tu apoyo esto ayuda al servidor" 6948`,
    `.setskill MIIKIIS 164 450 450`
  ];

  for (const command of commands) {
    console.log(`Executing: ${command}`);
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
      console.log(`Response for ${command}:`, text);
    } catch (err) {
      console.error(`Error for ${command}:`, err);
    }
  }
}

testSoapMail();
