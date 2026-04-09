/**
 * Modular Database Storage
 * Supports SQLite (WASM), Metadata Cache (Obsidian), and IndexedDB (Browser)
 */

let SQL_JS = null;

const dbStorage = {
    cache: {
        read: (dc) => {
            try {
                const file = dc.app.workspace.getActiveFile();
                if (!file) return { success: false, message: "No active file" };
                const data = dc.app.metadataCache.getFileCache(file);
                return { success: true, content: JSON.stringify(data, null, 2), message: "Cache Read Success" };
            } catch (e) {
                return { success: false, message: `Cache Error: ${e.message}` };
            }
        }
    },
    sqlite: {
        init: async (dc) => {
            if (SQL_JS) return SQL_JS;

            const adapter = dc.app.vault.adapter;
            const wasmPath = ".datacore/sql-wasm.wasm";
            const jsPath = ".datacore/sql-wasm.js";

            if (!await adapter.exists(wasmPath) || !await adapter.exists(jsPath)) {
                const wasmUrl = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.wasm";
                const jsUrl = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.js";
                const wasmBuf = await (await fetch(wasmUrl)).arrayBuffer();
                await adapter.writeBinary(wasmPath, wasmBuf);
                const jsText = await (await fetch(jsUrl)).text();
                await adapter.write(jsPath, jsText);
            }

            if (!window.initSqlJs) {
                const jsContent = await adapter.read(jsPath);
                const script = document.createElement("script");
                script.innerHTML = jsContent;
                document.body.appendChild(script);
                await new Promise(r => setTimeout(r, 500));
            }

            SQL_JS = await window.initSqlJs({
                locateFile: () => adapter.getResourcePath(wasmPath)
            });
            return SQL_JS;
        },

        query: async (dc, dbPath, sql, params = []) => {
            try {
                const SQL = await dbStorage.sqlite.init(dc);
                const adapter = dc.app.vault.adapter;

                let buffer = null;
                if (await adapter.exists(dbPath)) {
                    const data = await adapter.readBinary(dbPath);
                    buffer = new Uint8Array(data);
                }

                const db = new SQL.Database(buffer || undefined);
                const upperSql = sql.trim().toUpperCase();
                const isWrite = /^(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/.test(upperSql);

                let results = [];
                if (isWrite) {
                    if (params.length === 0 && sql.includes(';')) {
                        sql.split(';').forEach(s => {
                            if (s.trim()) db.run(s);
                        });
                    } else {
                        db.run(sql, params);
                    }

                    const binary = db.export();
                    await adapter.writeBinary(dbPath, binary);
                    db.close();
                    return { success: true, message: "Query executed and saved", content: "OK" };
                } else {
                    const stmt = db.prepare(sql);
                    stmt.bind(params);
                    while (stmt.step()) {
                        results.push(stmt.getAsObject());
                    }
                    stmt.free();
                }

                db.close();
                return { success: true, message: "Query success", content: JSON.stringify(results) };
            } catch (e) {
                return { success: false, message: `SQLite Error: ${e.message}` };
            }
        }
    },
    indexedDB: {
        _open: () => {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open('UniversalShowcaseDB', 1);
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('kv')) {
                        db.createObjectStore('kv');
                    }
                };
                request.onsuccess = (e) => resolve(e.target.result);
                request.onerror = (e) => reject(e.target.error);
            });
        },
        set: async (key, value) => {
            try {
                const db = await dbStorage.indexedDB._open();
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(['kv'], 'readwrite');
                    const store = transaction.objectStore('kv');
                    const request = store.put(value, key);
                    request.onsuccess = () => resolve({ success: true, message: `Set [${key}] in IndexedDB` });
                    request.onerror = () => reject(request.error);
                });
            } catch (e) {
                return { success: false, message: `IndexedDB Error: ${e.message}` };
            }
        },
        get: async (key) => {
            try {
                const db = await dbStorage.indexedDB._open();
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(['kv'], 'readonly');
                    const store = transaction.objectStore('kv');
                    const request = store.get(key);
                    request.onsuccess = () => resolve({ success: true, content: JSON.stringify(request.result), message: `Get [${key}] from IndexedDB` });
                    request.onerror = () => reject(request.error);
                });
            } catch (e) {
                return { success: false, message: `IndexedDB Error: ${e.message}` };
            }
        },
        clear: async () => {
            try {
                const db = await dbStorage.indexedDB._open();
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(['kv'], 'readwrite');
                    const store = transaction.objectStore('kv');
                    const request = store.clear();
                    request.onsuccess = () => resolve({ success: true, message: `Cleared IndexedDB` });
                    request.onerror = () => reject(request.error);
                });
            } catch (e) {
                return { success: false, message: `IndexedDB Error: ${e.message}` };
            }
        }
    }
};

return { dbStorage };
