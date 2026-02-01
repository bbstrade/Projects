
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

(async () => {
    try {
        const fileContent = fs.readFileSync('convex_keys.txt', 'utf8');
        const match = fileContent.match(/CONVEX_AUTH_PRIVATE_KEY="([^"]+)"/);

        if (!match) {
            throw new Error("Could not find CONVEX_AUTH_PRIVATE_KEY in convex_keys.txt");
        }

        // REPLACING literal \n with REAL newlines
        // The error 'Invalid byte 92' (\) means it found '\' where it expected base64 or control chars.
        // This confirms the string currently has literal backslashes from the \n escaping.
        const rawKey = match[1];
        const realKey = rawKey.replace(/\\n/g, '\n');

        console.log('Original key length:', rawKey.length);
        console.log('Fixed key (real newlines) length:', realKey.length);

        // Path to convex CLI
        const convexCli = path.resolve('node_modules', 'convex', 'bin', 'main.js');

        const commands = [
            ['env', 'set', 'JWT_PRIVATE_KEY', '--', realKey],
            ['env', 'set', 'CONVEX_AUTH_PRIVATE_KEY', '--', realKey],
            ['env', 'set', 'JWT_PRIVATE_KEY', '--prod', '--', realKey],
            ['env', 'set', 'CONVEX_AUTH_PRIVATE_KEY', '--prod', '--', realKey]
        ];

        for (const args of commands) {
            console.log(`Running: node convex/bin/main.js ${args.join(' ').substring(0, 50)}...`);

            // Spawn NODE directly with the CLI script. 
            // shell: false ensures args are passed exactly as is (no shell expansion/splitting).
            const child = spawn(process.execPath, [convexCli, ...args], {
                stdio: 'inherit',
                shell: false
            });

            await new Promise((resolve, reject) => {
                child.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error(`Command failed with code ${code}`));
                });
                child.on('error', reject);
            });
        }

        console.log("All keys set successfully!");

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
