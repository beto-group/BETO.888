const fs = require('fs');
const path = require('path');

const fsStorage = {
    write: (filePath, content) => {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(filePath, content, 'utf8');
            return { success: true, message: `FS Write Success` };
        } catch (e) {
            return { success: false, message: `FS Write Error: ${e.message}` };
        }
    },
    read: (filePath) => {
        try {
            if (!fs.existsSync(filePath)) return { success: false, message: "File not found" };
            const content = fs.readFileSync(filePath, 'utf8');
            return { success: true, content, message: `FS Read Success` };
        } catch (e) {
            return { success: false, message: `FS Read Error: ${e.message}` };
        }
    }
};

return { fsStorage };
