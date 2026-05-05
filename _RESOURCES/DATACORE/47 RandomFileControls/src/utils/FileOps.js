/**
 * FileOps Utility for Component 47
 * Provides recursive vault operations.
 */

const FileOps = {
    /**
     * Delete files matching a specific extension or pattern.
     */
    async scrubFolder(basePath, extension = '.svg') {
        const v = dc.app.vault;
        const root = v.getAbstractFileByPath(basePath);
        if (!root || !root.children) throw new Error("Invalid path or not a folder.");

        let count = 0;
        const process = async (folder) => {
            for (const file of [...folder.children]) {
                if (file.children) {
                    await process(file);
                } else if (file.name.endsWith(extension) || file.name === '.DS_Store') {
                    await v.delete(file);
                    count++;
                }
            }
        };

        await process(root);
        return { status: 'success', deletedCount: count };
    },

    /**
     * Recursively map a folder and generate a clean tree for the clipboard.
     */
    async mapFolder(basePath) {
        const v = dc.app.vault;
        const root = v.getAbstractFileByPath(basePath);
        if (!root || !root.children) throw new Error("Invalid path or not a folder.");

        let tree = [];
        const process = (folder, depth = 0) => {
            const indent = "  ".repeat(depth);
            tree.push(`${indent}📁 ${folder.name}/`);
            
            const children = [...folder.children].sort((a,b) => {
                if (a.children && !b.children) return -1;
                if (!a.children && b.children) return 1;
                return a.name.localeCompare(b.name);
            });

            for (const file of children) {
                if (file.children) {
                    process(file, depth + 1);
                } else {
                    tree.push(`${indent}  📄 ${file.name}`);
                }
            }
        };

        process(root);
        const result = tree.join("\n");
        await navigator.clipboard.writeText(result);
        return { status: 'success', message: 'Tree copied to clipboard', lines: tree.length };
    },

    /**
     * Batch rename files using regex.
     */
    async renameBatch(basePath, find, replace) {
        const v = dc.app.vault;
        const root = v.getAbstractFileByPath(basePath);
        if (!root || !root.children) throw new Error("Invalid path or not a folder.");

        const regex = new RegExp(find, 'g');
        let count = 0;
        
        const process = async (folder) => {
            for (const file of [...folder.children]) {
                if (file.children) {
                    await process(file);
                } else if (regex.test(file.name)) {
                    const newName = file.name.replace(regex, replace);
                    const newPath = file.parent.path + "/" + newName;
                    await v.rename(file, newPath);
                    count++;
                }
            }
        };

        await process(root);
        return { status: 'success', renamedCount: count };
    }
};

return { FileOps };
