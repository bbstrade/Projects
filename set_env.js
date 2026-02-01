
const fs = require('fs');
const { spawn } = require('child_process');

(async () => {
    try {
        const fileContent = fs.readFileSync('convex_keys.txt', 'utf8');
        const match = fileContent.match(/CONVEX_AUTH_PRIVATE_KEY="([^"]+)"/);

        if (!match) {
            throw new Error("Could not find CONVEX_AUTH_PRIVATE_KEY in convex_keys.txt");
        }

        const finalKey = match[1];
        console.log('Extracted key, length:', finalKey.length);

        // Use standard double quotes for the value
        const quotedKey = `"${finalKey}"`;

        // We use '--' to tell the CLI to stop parsing flags, so the key (starting with -) is treated as a value.
        // We use shell: true to handle the command string.
        const commands = [
            ['convex', 'env', 'set', 'JWT_PRIVATE_KEY', '--', quotedKey],
            ['convex', 'env', 'set', 'CONVEX_AUTH_PRIVATE_KEY', '--', quotedKey],
            ['convex', 'env', 'set', 'JWT_PRIVATE_KEY', '--prod', '--', quotedKey],
            ['convex', 'env', 'set', 'CONVEX_AUTH_PRIVATE_KEY', '--prod', '--', quotedKey]
        ];

        for (const args of commands) {
            console.log(`Running: npx ${args.join(' ').substring(0, 80)}...`);

            const child = spawn('npx.cmd', args, {
                stdio: 'inherit',
                shell: true
            });

            await new Promise((resolve) => {
                child.on('close', resolve);
            });
        }

    } catch (err) {
        console.error(err);
    }
})();
