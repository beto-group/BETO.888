#!/usr/bin/env node

/**
 * Obsidian CLI Bridge
 * Translates terminal commands into obsidian:// uri calls.
 */

const { exec } = require('child_process');

const args = process.argv.slice(2);
const command = args[0] || 'ping';
const payload = args[1] || '{}';

// 1. Configuration
const VAULT_NAME = "888";
const PROTOCOL_ACTION = "cli-lab";

// 2. Build URI
// Pattern: obsidian://cli-lab?command=X&payload=Y&vault=888
const uri = `obsidian://${PROTOCOL_ACTION}?` + 
    `vault=${encodeURIComponent(VAULT_NAME)}&` +
    `command=${encodeURIComponent(command)}&` +
    `payload=${encodeURIComponent(payload)}`;

// 3. Execute
console.log(`\x1b[35m[CLI Bridge]\x1b[0m Sending command: \x1b[1m${command}\x1b[m`);
console.log(`\x1b[34m[URI]\x1b[0m ${uri}\n`);

exec(`open "${uri}"`, (error) => {
    if (error) {
        console.error(`\x1b[31m[Error]\x1b[0m Failed to trigger Obsidian bridge: ${error.message}`);
        process.exit(1);
    }
    console.log(`\x1b[32m[Success]\x1b[0m Protocol triggered via native 'open'.`);
});
