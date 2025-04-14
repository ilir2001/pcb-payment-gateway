import https from 'https';
import fs from 'fs';

export function getHttpsAgent(sslCert: string, sslKey: string, sslCa: string): https.Agent {
  return new https.Agent({
    cert: fs.readFileSync(sslCert),
    key: fs.readFileSync(sslKey),
    ca: fs.readFileSync(sslCa),
    // rejectUnauthorized: false,
  });
}