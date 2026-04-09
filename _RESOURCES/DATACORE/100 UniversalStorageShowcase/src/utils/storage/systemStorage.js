const { exec } = require('child_process');

const systemStorage = {
    shell: {
        execute: (cmd) => {
            return new Promise((resolve) => {
                exec(cmd, (err, stdout, stderr) => {
                    if (err) resolve({ success: false, message: stderr || err.message });
                    else resolve({ success: true, content: stdout, message: "Shell Execute Success" });
                });
            });
        }
    },
    uri: {
        generate: (vault, action, params) => {
            const query = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
            const uri = `obsidian://advanced-uri?vault=${encodeURIComponent(vault)}&${action}&${query}`;
            return { success: true, content: uri, message: "URI Generated" };
        }
    }
};

return { systemStorage };
