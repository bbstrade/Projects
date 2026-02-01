import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

import * as fs from 'fs';

const output = `CONVEX_AUTH_PRIVATE_KEY="${privateKey.replace(/\n/g, "\\n")}"\n\nJWKS=${jwks}\n`;
fs.writeFileSync('convex_keys.txt', output);
console.log('Keys written to convex_keys.txt');
