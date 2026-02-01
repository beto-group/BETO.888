
/**
 * Smart Path Resolver for Datacore
 * Handles resolution for both bundled headers and vault-absolute files.
 */

export const smartResolve = (dc, fileName, headerName = null) => {
    // 1. Try to find the file globally
    const resolvedPath = dc.resolvePath(fileName) || fileName;

    // 2. If it's a bundled component (headerLink usage)
    if (headerName) {
        return dc.headerLink(resolvedPath, headerName);
    }

    // 3. Ensure vault-absolute path for file calls
    // Obsidian requires a leading slash for absolute paths in many contexts
    return resolvedPath.startsWith('/') ? resolvedPath : '/' + resolvedPath;
};

export const smartRequire = async (dc, fileName, headerName = null) => {
    // Try header first if headerName provided
    if (headerName) {
        try {
            const path = smartResolve(dc, fileName, headerName);
            return await dc.require(path);
        } catch (e) {
            console.warn(`[SmartLookup] Header ${headerName} in ${fileName} failed, falling back to file require.`, e);
        }
    }

    // Fallback to file require
    const path = smartResolve(dc, fileName);
    return await dc.require(path);
};
