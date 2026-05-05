
# ComponentImporter

```jsx
const { useState } = dc;

/**
 * handleImportToVault - Logic for copying component folders between vaults
 */
const handleImportToVault = async ({ 
    componentPath, 
    targetVault, 
    customExportPath, 
    setIsImporting, 
    setShowVaultSelector, 
    setShowSuccessScreen,
    sourceBasePath = "_RESOURCES/DATACORE" 
}) => {
    if (!componentPath) {
        new Notice("Component path not found", 3000);
        return;
    }
    setIsImporting(true);
    setShowVaultSelector(null);
    try {
        // Extract folder name from path (e.g. "01 Component" from "_RESOURCES/DATACORE/01 Component/index.md")
        const pathParts = componentPath.split('/');
        const baseIdx = pathParts.indexOf(sourceBasePath.split('/').pop());
        const folderName = baseIdx !== -1 && pathParts[baseIdx + 1] ? pathParts[baseIdx + 1] : null;

        if (!folderName) {
            throw new Error("Could not determine component folder name");
        }
        const sourcePath = `${sourceBasePath}/${folderName}`;

        const sourceFolder = dc.app.vault.getAbstractFileByPath(sourcePath);
        if (!sourceFolder) {
            throw new Error(`Source folder not found: ${sourcePath}`);
        }
        
        if (targetVault.isCurrent) {
            new Notice("This component is already in the current vault!", 3000);
            setIsImporting(false);
            return;
        }
        
        const getAllFilesInFolder = async (folderPath) => {
            const files = [];
            const folder = dc.app.vault.getAbstractFileByPath(folderPath);
            if (!folder || !folder.children) return files;

            for (const child of folder.children) {
                if (child.children) {
                    const subFiles = await getAllFilesInFolder(child.path);
                    files.push(...subFiles);
                } else {
                    files.push(child);
                }
            }
            return files;
        };

        const filesToCopy = await getAllFilesInFolder(sourcePath);
        if (filesToCopy.length === 0) throw new Error("No files found in component folder");

        const fs = window.require ? window.require('fs') : null;
        const path = window.require ? window.require('path') : null;
        if (!fs || !path) throw new Error("File system access not available. Requires Node.js integration.");

        new Notice(`Copying ${filesToCopy.length} files to ${targetVault.name}...`, 3000);
        let copiedCount = 0;
        let skippedCount = 0;

        const binaryExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'mp4', 'webm', 'ttf', 'woff2', 'pdf', 'zip'];

        for (const file of filesToCopy) {
            try {
                const isBinary = file.extension && binaryExtensions.includes(file.extension.toLowerCase());
                const content = isBinary ? await dc.app.vault.readBinary(file) : await dc.app.vault.read(file);
                
                const relativePath = file.path.replace(sourcePath + '/', '');
                const targetFilePath = path.join(targetVault.path, customExportPath, folderName, relativePath);
                const targetDir = path.dirname(targetFilePath);

                if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
                if (fs.existsSync(targetFilePath)) { skippedCount++; continue; }

                if (isBinary) fs.writeFileSync(targetFilePath, Buffer.from(content));
                else fs.writeFileSync(targetFilePath, content, 'utf8');
                
                copiedCount++;
            } catch (e) { console.error(`Failed to copy ${file.path}:`, e); }
        }

        new Notice(skippedCount > 0 ? `Imported ${copiedCount} files (${skippedCount} skipped)!` : `Imported ${copiedCount} files!`, 5000);
        
        // Extract keyword for viewer
        const keyword = folderName.replace(/^\d+\s+/, '').replace(/\{[^}]*\}/g, '').trim().toLowerCase().replace(/\s+/g, '');
        const fileName = componentPath.split('/').pop();
        const versionMatch = fileName.match(/[\s\.]v(\d+)[\s\.]/i) || fileName.match(/v(\d+)\.md$/i);
        const version = versionMatch ? `v${versionMatch[1]}` : null;
        
        // Attempt to find viewer code
        let viewerCode = null;
        const viewerFileName = version ? `D.q.${keyword}.viewer.${version}.md` : `D.q.${keyword}.viewer.md`;
        const viewerPath = `${sourcePath}/${viewerFileName}`;
        const viewerFile = dc.app.vault.getAbstractFileByPath(viewerPath);
        
        if (viewerFile) {
            const content = await dc.app.vault.read(viewerFile);
            const match = content.match(/```(?:datacorejsx|jsx)?\n([\s\S]*?)```/);
            if (match) viewerCode = match[1].trim();
        }

        setShowSuccessScreen({
            componentName: folderName,
            keyword,
            version,
            targetVault: targetVault.name,
            viewerCode
        });
    } catch (error) {
        new Notice(`Import failed: ${error.message}`, 5000);
    } finally {
        setIsImporting(false);
    }
};

/**
 * VaultSelector - UI for selecting a target vault
 */
const VaultSelector = ({ 
    showVaultSelector, 
    setShowVaultSelector, 
    customExportPath, 
    setCustomExportPath, 
    getAvailableVaults, 
    onImport 
}) => {
    if (!showVaultSelector) return null;
    
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2147483646, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.75)' }} onClick={(e) => { if (e.target === e.currentTarget) setShowVaultSelector(null); }}>
            <div style={{ background: 'rgba(18,12,22,0.95)', border: '1px solid var(--glow)', borderRadius: '16px', width: 'min(90vw, 600px)', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', position: 'relative' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glow-faint)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--glow)', margin: 0, fontVariant: 'small-caps', display: 'flex', alignItems: 'center', gap: '10px' }}><dc.Icon icon="package" style={{ fontSize: '20px' }} />Import Component to Vault</h2>
                    <button onClick={() => setShowVaultSelector(null)} style={{ position: 'absolute', top: '14px', right: '18px', width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', fontSize: '18px', cursor: 'pointer', display: 'grid', placeItems: 'center', transition: 'all .2s', zIndex: 10 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div style={{ padding: '24px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glow-faint)', borderRadius: '12px', marginBottom: '24px' }}>
                        <div style={{ fontSize: '11px', fontVariant: 'small-caps', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700 }}>Selected Component:</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-normal)' }}>{showVaultSelector.name || "Unknown Component"}</div>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-normal)', margin: '0 0 16px 0', fontVariant: 'small-caps', letterSpacing: '0.5px' }}>Target Path</h3>
                        <input type="text" value={customExportPath} onChange={(e) => setCustomExportPath(e.target.value)} placeholder="e.g., _RESOURCES/DATACORE" style={{ width: '100%', padding: '10px 12px', background: 'var(--background-primary)', border: '1px solid var(--background-modifier-border)', borderRadius: '6px', color: 'var(--text-normal)', fontFamily: 'var(--font-monospace)', fontSize: '13px', boxSizing: 'border-box', marginBottom: '8px' }} />
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Component will be imported to: <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '3px', fontFamily: 'var(--font-monospace)', fontSize: '11px' }}>{customExportPath}/[ComponentFolder]</code></div>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-normal)', margin: '0 0 16px 0', fontVariant: 'small-caps', letterSpacing: '0.5px' }}>Select Target Vault</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                            {getAvailableVaults().map((vault, vIndex) => (
                                <div key={vIndex} onClick={() => { if (!vault.isCurrent) onImport(showVaultSelector.path, vault); }} style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: vault.isCurrent ? '2px dashed var(--glow-faint)' : '2px solid var(--glow-faint)', borderRadius: '12px', cursor: vault.isCurrent ? 'not-allowed' : 'pointer', textAlign: 'center', opacity: vault.isCurrent ? 0.5 : 1, transition: 'all 0.2s' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}><dc.Icon icon={vault.isCurrent ? 'map-pin' : 'folder'} style={{ fontSize: '32px' }} /></div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-normal)', marginBottom: '8px' }}>{vault.name}</div>
                                    {vault.isCurrent && <div style={{ display: 'inline-block', padding: '4px 10px', background: 'var(--glow-med)', border: '1px solid var(--glow)', borderRadius: '6px', fontSize: '10px', fontWeight: 900, fontVariant: 'small-caps', color: 'var(--glow)', marginBottom: '8px' }}>Current Vault</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * SuccessScreen - UI for successful import
 */
const SuccessScreen = ({ showSuccessScreen, setShowSuccessScreen }) => {
    if (!showSuccessScreen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2147483647, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.75)' }} onClick={(e) => { if (e.target === e.currentTarget) setShowSuccessScreen(null); }}>
            <div style={{ background: 'rgba(18,12,22,0.95)', border: '1px solid var(--glow)', borderRadius: '16px', width: 'min(90vw, 700px)', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', position: 'relative' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glow-faint)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--glow)', margin: 0, fontVariant: 'small-caps', display: 'flex', alignItems: 'center', gap: '10px' }}><dc.Icon icon="check-circle" style={{ fontSize: '20px' }} />Import Successful!</h2>
                    <button onClick={() => setShowSuccessScreen(null)} style={{ position: 'absolute', top: '14px', right: '18px', width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', fontSize: '18px', cursor: 'pointer', display: 'grid', placeItems: 'center', transition: 'all .2s', zIndex: 10 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div style={{ padding: '24px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glow-faint)', borderRadius: '12px', marginBottom: '24px' }}>
                        <div style={{ fontSize: '11px', fontVariant: 'small-caps', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700 }}>Component Imported:</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-normal)' }}>{showSuccessScreen.componentName} → {showSuccessScreen.targetVault}</div>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-normal)', margin: '0 0 16px 0', fontVariant: 'small-caps', display: 'flex', alignItems: 'center', gap: '8px' }}><dc.Icon icon="code" style={{ fontSize: '16px', color: 'var(--glow)' }} />{showSuccessScreen.viewerCode ? 'Viewer Code' : 'Component Details'}</h3>
                        <div style={{ position: 'relative', background: 'rgba(0,0,0,0.4)', padding: '40px 16px 16px 16px', borderRadius: '8px', border: '1px solid var(--glow-faint)', fontFamily: 'var(--font-monospace)', fontSize: '12px', overflowX: 'auto' }}>
                            <button onClick={() => { let code; if (showSuccessScreen.viewerCode) code = `\`\`\`datacorejsx\n${showSuccessScreen.viewerCode}\n\`\`\``; else code = `@codeblock AND $file.contains("${showSuccessScreen.keyword}.viewer${showSuccessScreen.version ? `.${showSuccessScreen.version}` : ''}")`; navigator.clipboard.writeText(code); new Notice("Code copied to clipboard!", 2000); }} style={{ position: 'absolute', top: '12px', right: '12px', padding: '6px 12px', background: 'var(--glow)', border: 'none', borderRadius: '4px', color: 'var(--background-primary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><dc.Icon icon="clipboard" style={{ fontSize: '12px' }} />Copy</button>
                            <pre style={{ margin: 0, color: 'var(--text-normal)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{showSuccessScreen.viewerCode || `Query: @codeblock AND $file.contains("${showSuccessScreen.keyword}.viewer")`}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

return { handleImportToVault, VaultSelector, SuccessScreen };
```
