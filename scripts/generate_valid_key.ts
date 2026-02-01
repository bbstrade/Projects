
import { generateKeyPairSync } from "crypto";

// Generate a valid PKCS#8 key pair
const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8', // THIS IS CRITICAL
        format: 'pem'
    }
});

console.log("\nCopy everything between the lines below:\n");
console.log("----------------------------------------");
console.log(privateKey);
console.log("----------------------------------------");
console.log("\nGo to Convex Dashboard -> Settings -> Environment Variables");
console.log("Edit JWT_PRIVATE_KEY and paste the above key.");
