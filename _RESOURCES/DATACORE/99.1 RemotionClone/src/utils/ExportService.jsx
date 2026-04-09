const ExportService = {
    async init() {
        if (this._initialized) return;

        try {
            const utilsPath = "_RESOURCES/DATACORE/28 LoadScript/D.q.loadscript.component.md";
            const { loadScript } = await dc.require(dc.headerLink(utilsPath, "LoadScriptUpgrade"));

            // Only need html-to-image now
            await Promise.all([
                loadScript(dc, '78 RemotionClone/_resources/DATACORE/lib/html2canvas.min.js', { globalName: 'html2canvas' }),
                loadScript(dc, 'https://unpkg.com/html-to-image@1.11.11/dist/html-to-image.js', { globalName: 'htmlToImage' })
            ]);

            this._initialized = true;
        } catch (err) {
            console.error("[Export] Init failed:", err);
            throw err;
        }
    },

    async robustFetch(url, type = 'text') {
        if (!url) return null;
        if (url.startsWith('//')) url = 'https:' + url;
        if (!url.startsWith('http')) return null;

        try {
            const r = await fetch(url);
            if (r.ok) return type === 'buffer' ? await r.arrayBuffer() : await r.text();
        } catch (e) { }
        return null;
    },

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
        return window.btoa(binary);
    },

    _fontCache: new Map(),

    async getFullStyles() {
        const links = Array.from(document.querySelectorAll('link[rel*="stylesheet"]'));
        const styleChunks = [];

        for (const link of links) {
            const href = link.href;
            if (!href || !href.startsWith('http')) continue;

            let cssText = await this.robustFetch(href, 'text');
            if (!cssText) continue;

            const urlRegex = /url\((?:['"]?)(.*?)(?:['"]?)\)/g;
            let match;
            const updates = [];
            while ((match = urlRegex.exec(cssText)) !== null) {
                const url = match[1];
                if (url.toLowerCase().match(/\.(woff2|woff|ttf|otf)/)) {
                    updates.push({ original: match[0], url });
                }
            }

            for (const item of updates) {
                try {
                    let base64 = this._fontCache.get(item.url);
                    if (!base64) {
                        const buffer = await this.robustFetch(item.url, 'buffer');
                        if (buffer) {
                            base64 = this.arrayBufferToBase64(buffer);
                            this._fontCache.set(item.url, base64);
                        }
                    }

                    if (base64) {
                        let mime = 'font/woff2';
                        if (item.url.endsWith('.ttf')) mime = 'font/ttf';
                        else if (item.url.endsWith('.woff')) mime = 'font/woff';
                        cssText = cssText.split(item.original).join(`url("data:${mime};base64,${base64}")`);
                    }
                } catch (e) { }
            }
            styleChunks.push(cssText);
        }
        return styleChunks.join('\n');
    },

    async renderVideo({ stageElement, duration, fps, width, height, scale = 1, onProgress, seek, signal, crf = 23, format = 'mp4' }) {
        await this.init();

        // Node.js Native Modules
        let fs, path, child_process;
        try {
            const req = window.require || require;
            fs = req('fs');
            path = req('path');
            child_process = req('child_process');
        } catch (e) {
            throw new Error("Node.js access failed. Cannot run native export.");
        }

        // Setup Temp Directory
        const timestamp = Date.now();
        let basePath = null;
        if (dc?.app?.vault?.adapter?.getBasePath) {
            basePath = dc.app.vault.adapter.getBasePath();
        } else {
            basePath = process.cwd();
        }

        const tempDirName = `.tmp_export_${timestamp}`;
        const tempDir = path.join(basePath, tempDirName);
        const outputFileName = `video_export_${timestamp}.${format}`;
        const outputPath = path.join(basePath, outputFileName);

        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        let restrictedLinks = [];
        let mountPoints = [];

        try {
            console.log(`[Export] Native mode (${format}). Scale: ${scale}x. Temp dir: ${tempDir}`);
            console.log("[Export] Preparing Styles...");

            const bundledStyles = await this.getFullStyles();
            const normalizationCSS = `
                * { box-sizing: border-box !important; -webkit-font-smoothing: antialiased; }
                body, html { margin: 0 !important; padding: 0 !important; overflow: hidden; background: #000; }
                .remotion-content-item, [style*="position: absolute"], [style*="position:absolute"] {
                    white-space: nowrap !important;
                    width: max-content !important;
                    display: block !important;
                }
                /* Remove preview border and shadow during export */
                #remotion-stage {
                    border: none !important;
                    box-shadow: none !important;
                    transform: none !important; /* Reset transform to ensure pure capture */
                }
            `;
            const finalInjectedStyles = bundledStyles + "\n" + normalizationCSS;

            const links = Array.from(document.querySelectorAll('link[rel*="stylesheet"]'));
            restrictedLinks = links.filter(link => link.href && link.href.startsWith('http'));
            mountPoints = restrictedLinks.map(l => ({ parent: l.parentNode, next: l.nextSibling, el: l }));
            restrictedLinks.forEach(l => l.remove());

            await document.fonts.ready;

            console.time("[Export] Frame Capture");

            for (let i = 0; i < duration; i++) {
                if (signal?.aborted) throw new DOMException("Abort", "AbortError");
                seek(i);

                // Allow DOM update
                if (i % 30 === 0) await new Promise(r => setTimeout(r, 0));

                const blob = await htmlToImage.toBlob(stageElement, {
                    width, height, // Logical dimensions
                    pixelRatio: scale, // Scaling factor
                    skipFonts: false, // Essential for correct text metrics!
                    onClone: (clonedDoc) => {
                        const style = clonedDoc.createElement('style');
                        style.textContent = finalInjectedStyles;
                        clonedDoc.head.appendChild(style);
                        const walker = clonedDoc.createTreeWalker(clonedDoc.body, NodeFilter.SHOW_ELEMENT);
                        let node;
                        while (node = walker.nextNode()) {
                            const s = node.style;
                            if (s.position === 'absolute' || node.getAttribute('style')?.includes('position: absolute')) {
                                s.whiteSpace = 'nowrap';
                                s.width = 'max-content';
                                s.display = 'block';
                            }
                        }
                        clonedDoc.body.style.width = width + 'px';
                        clonedDoc.body.style.height = height + 'px';
                        clonedDoc.body.style.margin = '0';

                        // Manually rasterize <video> elements
                        const videos = Array.from(clonedDoc.getElementsByTagName('video'));
                        const originals = Array.from(stageElement.getElementsByTagName('video'));

                        videos.forEach((clonedVideo, index) => {
                            const originalVideo = originals[index];
                            if (originalVideo && !originalVideo.paused && originalVideo.currentTime > 0) {
                                // Create a canvas to capture the frame
                                const canvas = clonedDoc.createElement('canvas');
                                canvas.width = originalVideo.videoWidth || originalVideo.clientWidth;
                                canvas.height = originalVideo.videoHeight || originalVideo.clientHeight;

                                const ctx = canvas.getContext('2d');
                                try {
                                    ctx.drawImage(originalVideo, 0, 0, canvas.width, canvas.height);

                                    // Copy all styles
                                    canvas.style.cssText = clonedVideo.style.cssText;
                                    canvas.className = clonedVideo.className;

                                    // Replace video with canvas in the clone
                                    if (clonedVideo.parentNode) {
                                        clonedVideo.parentNode.replaceChild(canvas, clonedVideo);
                                    }
                                } catch (e) {
                                    console.warn("Failed to rasterize video frame", e);
                                }
                            }
                        });

                        // Ensure cleaner capture
                        // We removed the transform reset to preserve 3D stage effects if any
                        if (clonedDoc.getElementById('remotion-stage')) {
                            // clonedDoc.getElementById('remotion-stage').style.transform = 'none'; 
                        }
                    },
                    style: { width: `${width}px`, height: `${height}px`, margin: 0, padding: 0 },
                    backgroundColor: '#000000'
                });

                const arrayBuffer = await blob.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer); // Node.js Buffer
                const frameFile = path.join(tempDir, `frame_${i.toString().padStart(4, '0')}.png`);
                fs.writeFileSync(frameFile, buffer);

                if (onProgress) onProgress({
                    percent: Math.floor((i / duration) * 90),
                    frame: i,
                    totalFrames: duration,
                    phase: 'capture'
                });
            }
            console.timeEnd("[Export] Frame Capture");

            // Encoding Phase
            console.log("[Export] Starting FFmpeg...");
            if (onProgress) onProgress({
                percent: 92,
                frame: duration,
                totalFrames: duration,
                phase: 'encoding'
            });
            // Command to create MP4
            // Note: Use absolute paths for inputs to avoid confusion

            // Hardcoded path for macOS Homebrew environment
            const ffmpegPath = '/opt/homebrew/bin/ffmpeg';
            const framePattern = path.join(tempDir, 'frame_%04d.png');

            let encodingArgs = '';
            if (format === 'mp4') {
                encodingArgs = `-c:v libx264 -pix_fmt yuv420p -crf ${crf}`;
            } else if (format === 'webm') {
                // VP9 good quality
                encodingArgs = `-c:v libvpx-vp9 -pix_fmt yuv420p -b:v 0 -crf ${Math.max(15, crf + 10)}`;
            } else if (format === 'mov') {
                // ProRes 4444 HQ
                encodingArgs = `-c:v prores_ks -profile:v 3 -pix_fmt yuv444p10le`;
            }

            // Quote paths to handle spaces
            const cmd = `"${ffmpegPath}" -y -framerate ${fps} -i "${framePattern}" ${encodingArgs} "${outputPath}"`;

            await new Promise((resolve, reject) => {
                child_process.exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`[Export] FFmpeg Error: ${error.message}`);
                        reject(error);
                        return;
                    }
                    if (stderr) console.log(`[FFmpeg stderr] ${stderr}`);
                    resolve();
                });
            });

            console.log(`[Export] Success! Saved to: ${outputPath}`);

            // Notify User (Optional: Reveal file)
            // If MacOS
            // child_process.exec(`open -R "${outputPath}"`);

            if (onProgress) onProgress({
                percent: 100,
                frame: duration,
                totalFrames: duration,
                phase: 'done'
            });

            // Cleanup Temp
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            } catch (e) { console.warn("[Export] Cleanup failed", e); }

        } catch (err) {
            if (err.name === 'AbortError' || (err.message && err.message.includes('Abort'))) {
                console.log("[Export] Cancelled by user.");
            } else {
                console.error("Export Failed", err);
            }
            // Cleanup on fail or abort
            try { if (fs && fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) { }
            throw err; // Re-throw so caller knows it failed/cancelled
        } finally {
            if (mountPoints && mountPoints.length) {
                mountPoints.forEach(m => {
                    try {
                        if (m.next && m.next.parentNode === m.parent) m.parent.insertBefore(m.el, m.next);
                        else m.parent.appendChild(m.el);
                    } catch (e) { document.head.appendChild(m.el); }
                });
            }
        }
    }
};

return { ExportService };
