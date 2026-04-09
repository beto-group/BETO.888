const { exec } = require('child_process');

const syncStorage = {
    git: {
        commit: (dir, msg) => {
            return new Promise((resolve) => {
                const cmd = `cd "${dir}" && git add . && git commit -m "${msg || 'Auto-sync'}"`;
                exec(cmd, (err, stdout, stderr) => {
                    if (err) resolve({ success: false, message: stderr || err.message });
                    else resolve({ success: true, content: stdout, message: "Git Commit Success" });
                });
            });
        },
        status: (dir) => {
            return new Promise((resolve) => {
                exec(`cd "${dir}" && git status --short`, (err, stdout, stderr) => {
                    if (err) resolve({ success: false, message: stderr || err.message });
                    else resolve({ success: true, content: stdout || "Clean", message: "Git Status Success" });
                });
            });
        }
    }
};

return { syncStorage };
