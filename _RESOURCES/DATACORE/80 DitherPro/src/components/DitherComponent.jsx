function DitherComponent(props) {
    const { dc, loadScript, isFullTab, isInception, onToggleFullTab, styles, onCodeReloadRequest } = props;
    const { useState, useEffect, useRef } = dc;

    const canvasRef = useRef(null);
    const tpContainerRef = useRef(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    // Hidden file inputs
    const fileInputRef = useRef(null);
    const svgInputRef = useRef(null);

    // State refs to match imperative class logic from prototype
    const state = useRef({
        sourceImage: null,
        customSVGPath: null,
        customSVGViewBox: { x: 0, y: 0, w: 100, h: 100 },
        pane: null,
        TweakpaneClass: null,
        params: {
            mode: 'halftone',
            shape: 'circle',
            cellSize: 10,
            baseScale: 0.9,
            gap: 1,
            bgColor: '#111111',
            useColor: true,
            monoColor: '#ffffff',
            contrast: 0,
            intensity: 1.0,
        }
    }).current;

    // Render loop mapped closely to the provided vanilla script
    const renderCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas || !state.sourceImage || !state.sourceImage.width) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const params = state.params;

        const maxDisplay = 1600;
        const aspect = state.sourceImage.width / state.sourceImage.height;
        let dw = state.sourceImage.width;
        let dh = state.sourceImage.height;
        if (dw > maxDisplay) { dw = maxDisplay; dh = dw / aspect; }

        canvas.width = dw;
        canvas.height = dh;
        ctx.fillStyle = params.bgColor;
        ctx.fillRect(0, 0, dw, dh);

        const tmpCnvs = document.createElement('canvas');
        tmpCnvs.width = dw; tmpCnvs.height = dh;
        const tmpCtx = tmpCnvs.getContext('2d');
        tmpCtx.drawImage(state.sourceImage, 0, 0, dw, dh);
        const imgData = tmpCtx.getImageData(0, 0, dw, dh).data;
        const step = params.cellSize;

        const hex = params.monoColor.replace(/^#/, '');
        const mR = parseInt(hex.substring(0, 2), 16) || 255;
        const mG = parseInt(hex.substring(2, 4), 16) || 255;
        const mB = parseInt(hex.substring(4, 6), 16) || 255;
        const contrastFactor = (259 * (params.contrast + 255)) / (255 * (259 - params.contrast));

        for (let y = 0; y < dh; y += step) {
            for (let x = 0; x < dw; x += step) {
                const pIdx = ((y + Math.floor(step / 2)) * dw + (x + Math.floor(step / 2))) * 4;
                if (pIdx >= imgData.length) continue;

                let r = imgData[pIdx];
                let g = imgData[pIdx + 1];
                let b = imgData[pIdx + 2];
                const a = imgData[pIdx + 3];

                if (a < 20) continue;

                r = contrastFactor * (r - 128) + 128;
                g = contrastFactor * (g - 128) + 128;
                b = contrastFactor * (b - 128) + 128;
                r = Math.max(0, Math.min(255, r));
                g = Math.max(0, Math.min(255, g));
                b = Math.max(0, Math.min(255, b));

                const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

                let scX = params.baseScale;
                let scY = params.baseScale;
                let rot = 0;
                let offX = 0;
                let offY = 0;
                let alpha = 1.0;

                switch (params.mode) {
                    case 'flat': break;
                    case 'halftone': scX = scY = luma * params.baseScale * 1.5; break;
                    case 'inv_halftone': scX = scY = (1.0 - luma) * params.baseScale * 1.5; break;
                    case 'rotation': rot = luma * Math.PI; break;
                    case 'random_size': scX = scY = Math.random() * params.baseScale; break;
                    case 'random_rot': rot = Math.random() * Math.PI * 2; break;
                    case 'glitch': offX = (luma - 0.5) * step * 1.5 * params.intensity; break;
                    case 'opacity': alpha = luma; break;
                    case 'inv_opacity': alpha = 1.0 - luma; break;
                    case 'threshold': if (luma < 0.5) scX = scY = 0; break;
                    case 'crosshatch':
                        rot = (luma > 0.5) ? Math.PI / 4 : -Math.PI / 4;
                        scY = params.baseScale * 1.5; scX = params.baseScale * 0.2; break;
                    case 'stretch_v': scX = params.baseScale * 0.5; scY = luma * params.baseScale * 3; break;
                    case 'stretch_h': scX = luma * params.baseScale * 3; scY = params.baseScale * 0.5; break;
                    case 'flow':
                        const iR = pIdx + step * 4;
                        const iB = pIdx + (dw * step) * 4;
                        let rR = imgData[iR] || 0; let gR = imgData[iR + 1] || 0; let bR = imgData[iR + 2] || 0;
                        let rB = imgData[iB] || 0; let gB = imgData[iB + 1] || 0; let bB = imgData[iB + 2] || 0;
                        const lR = (0.299 * rR + 0.587 * gR + 0.114 * bR) / 255;
                        const lB = (0.299 * rB + 0.587 * gB + 0.114 * bB) / 255;
                        const dx = lR - luma;
                        const dy = lB - luma;
                        rot = Math.atan2(dy, dx) * params.intensity;
                        scX = scY = luma * params.baseScale * 1.2;
                        break;
                    case 'edges':
                        const idxNext = pIdx + step * 4;
                        let rN = imgData[idxNext] || 0; let gN = imgData[idxNext + 1] || 0; let bN = imgData[idxNext + 2] || 0;
                        rN = contrastFactor * (rN - 128) + 128;
                        const lumaN = (0.299 * rN + 0.587 * gN + 0.114 * bN) / 255;
                        const diff = Math.abs(luma - lumaN);
                        scX = scY = diff * 5 * params.baseScale * params.intensity;
                        break;
                    case 'melt':
                        offY = luma * step * 2 * params.intensity;
                        scX = scY = luma * params.baseScale;
                        break;
                    case 'jitter':
                        const jit = (Math.random() - 0.5) * step * 2;
                        if (luma > 0.5) { offX = jit * params.intensity; offY = jit * params.intensity; }
                        scX = scY = luma * params.baseScale;
                        break;
                    case 'checker':
                        const gridX = Math.floor(x / step);
                        const gridY = Math.floor(y / step);
                        if ((gridX + gridY) % 2 === 0) scX = scY = luma * params.baseScale * 1.5;
                        else scX = scY = (1.0 - luma) * params.baseScale * 1.5;
                        break;
                    case 'posterize':
                        let level = 0.2;
                        if (luma > 0.3) level = 0.5;
                        if (luma > 0.6) level = 0.8;
                        if (luma > 0.8) level = 1.0;
                        scX = scY = level * params.baseScale;
                        break;
                    case 'interference':
                        const pattern = Math.sin((x * y) * 0.0001 * params.intensity);
                        scX = scY = (luma + pattern) * 0.5 * params.baseScale * 1.5;
                        break;
                    case 'crt_scan':
                        const line = Math.floor(y / step);
                        if (line % 2 === 0) {
                            scX = params.baseScale * 1.2;
                            scY = params.baseScale * 0.2;
                            offX = 2 * params.intensity;
                        } else {
                            scX = luma * params.baseScale;
                            scY = params.baseScale * 0.8;
                        }
                        break;
                    case 'bio':
                        rot = Math.sin(luma * Math.PI * 2) + (Math.random() * 0.5);
                        scX = scY = (luma + 0.2) * params.baseScale;
                        break;
                    case 'eraser':
                        if (Math.random() > luma * params.intensity) scX = scY = 0;
                        break;
                }

                ctx.save();
                const cx = x + step / 2 + offX;
                const cy = y + step / 2 + offY;
                const size = Math.max(0, step - params.gap);

                ctx.translate(cx, cy);
                ctx.rotate(rot);
                ctx.scale(scX, scY);

                if (params.useColor) {
                    ctx.fillStyle = `rgba(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)},${alpha})`;
                    ctx.strokeStyle = `rgba(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)},${alpha})`;
                } else {
                    ctx.fillStyle = `rgba(${mR},${mG},${mB},${alpha})`;
                    ctx.strokeStyle = `rgba(${mR},${mG},${mB},${alpha})`;
                }

                drawShape(ctx, 0, 0, size, params.shape);
                ctx.restore();
            }
        }
    };

    const drawShape = (ctx, x, y, size, type) => {
        const r = size / 2;
        if (type === 'custom') {
            if (state.customSVGPath) {
                const maxDim = Math.max(state.customSVGViewBox.w, state.customSVGViewBox.h);
                const scale = size / (maxDim || 1);
                ctx.save();
                ctx.scale(scale, scale);
                ctx.translate(-state.customSVGViewBox.w / 2, -state.customSVGViewBox.h / 2);
                ctx.translate(-state.customSVGViewBox.x, -state.customSVGViewBox.y);
                ctx.fill(state.customSVGPath);
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.rect(x - r, y - r, size, size);
                ctx.fillText("?", x, y);
            }
            return;
        }

        ctx.beginPath();
        switch (type) {
            case 'circle': ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); break;
            case 'rect': ctx.rect(x - r, y - r, size, size); ctx.fill(); break;
            case 'triangle': ctx.moveTo(x, y - r); ctx.lineTo(x + r, y + r); ctx.lineTo(x - r, y + r); ctx.closePath(); ctx.fill(); break;
            case 'octagon': drawPoly(ctx, x, y, r, 8, Math.PI / 8); ctx.fill(); break;
            case 'star': drawStar(ctx, x, y, 5, r, r * 0.4); ctx.fill(); break;
            case 'cross': const w = r / 3; ctx.rect(x - w, y - r, w * 2, size); ctx.rect(x - r, y - w, size, w * 2); ctx.fill(); break;
            case 'rect_v': ctx.rect(x - r * 0.3, y - r, size * 0.3, size); ctx.fill(); break;
            case 'rect_h': ctx.rect(x - r, y - r * 0.3, size, size * 0.3); ctx.fill(); break;
            case 'hex_v': drawPoly(ctx, x, y, r, 6, Math.PI / 6); ctx.fill(); break;
            case 'line_diag_r': ctx.moveTo(x - r, y + r); ctx.lineTo(x - r + size * 0.2, y + r); ctx.lineTo(x + r, y - r); ctx.lineTo(x + r - size * 0.2, y - r); ctx.closePath(); ctx.fill(); break;
            case 'line_diag_l': ctx.moveTo(x - r, y - r); ctx.lineTo(x - r + size * 0.2, y - r); ctx.lineTo(x + r, y + r); ctx.lineTo(x + r - size * 0.2, y + r); ctx.closePath(); ctx.fill(); break;
            case 'chevron': const chW = r * 0.4; ctx.moveTo(x - r, y + r * 0.5); ctx.lineTo(x, y - r * 0.5); ctx.lineTo(x + r, y + r * 0.5); ctx.lineTo(x + r, y + r * 0.5 - chW); ctx.lineTo(x, y - r * 0.5 - chW); ctx.lineTo(x - r, y + r * 0.5 - chW); ctx.closePath(); ctx.fill(); break;
            case 'trapezoid': ctx.moveTo(x - r * 0.6, y - r); ctx.lineTo(x + r * 0.6, y - r); ctx.lineTo(x + r, y + r); ctx.lineTo(x - r, y + r); ctx.closePath(); ctx.fill(); break;
            case 'semi_top': ctx.arc(x, y + r * 0.1, r, Math.PI, 0); ctx.closePath(); ctx.fill(); break;
            case 'semi_bottom': ctx.arc(x, y - r * 0.1, r, 0, Math.PI); ctx.closePath(); ctx.fill(); break;
            case 'rect_hollow': ctx.rect(x - r, y - r, size, size); ctx.rect(x + r * 0.5, y - r * 0.5, -size * 0.5, size * 0.5); ctx.fill(); break;
            case 'spiral':
                ctx.lineWidth = size * 0.15; ctx.lineCap = 'round';
                const loops = 2; const increment = (r) / (loops * 10);
                ctx.moveTo(x, y);
                for (let i = 0; i < loops * 20; i++) {
                    const angle = 0.5 * i; const dist = increment * i;
                    ctx.lineTo(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist);
                }
                ctx.stroke();
                break;
            case 'concentric':
                ctx.arc(x, y, r, 0, Math.PI * 2); ctx.arc(x, y, r * 0.7, 0, Math.PI * 2, true);
                ctx.arc(x, y, r * 0.4, 0, Math.PI * 2); ctx.arc(x, y, r * 0.15, 0, Math.PI * 2, true); ctx.fill();
                break;
            case 'gear':
                const teeth = 8; const outerR = r; const innerR = r * 0.7; const holeR = r * 0.3;
                for (let i = 0; i < teeth * 2; i++) {
                    const a = (Math.PI * 2 * i) / (teeth * 2); const rad = (i % 2 === 0) ? outerR : innerR;
                    const px = x + Math.cos(a) * rad; const py = y + Math.sin(a) * rad;
                    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.closePath(); ctx.moveTo(x + holeR, y); ctx.arc(x, y, holeR, 0, Math.PI * 2, true); ctx.fill();
                break;
            case 'flower':
                for (let i = 0; i < 5; i++) {
                    const a = (Math.PI * 2 * i) / 5; const px = x + Math.cos(a) * (r * 0.6); const py = y + Math.sin(a) * (r * 0.6);
                    ctx.moveTo(x, y); ctx.arc(px, py, r * 0.4, 0, Math.PI * 2);
                }
                ctx.fill(); break;
            case 'shuriken':
                const spikes = 4; const outer = r; const inner = r * 0.2; ctx.moveTo(x, y - outer);
                for (let i = 0; i < spikes; i++) {
                    let rot = (Math.PI / 2 * i);
                    ctx.quadraticCurveTo(x + Math.cos(rot + Math.PI / 4) * r * 0.5, y + Math.sin(rot + Math.PI / 4) * r * 0.5, x + Math.cos(rot + Math.PI / 2) * outer, y + Math.sin(rot + Math.PI / 2) * outer);
                    ctx.lineTo(x + Math.cos(rot + Math.PI / 2 + Math.PI / 4) * inner, y + Math.sin(rot + Math.PI / 2 + Math.PI / 4) * inner);
                }
                ctx.fill(); break;
            case 'lightning':
                const w2 = r * 0.6; ctx.moveTo(x + w2, y - r); ctx.lineTo(x - w2 * 0.2, y - r * 0.1); ctx.lineTo(x + w2, y - r * 0.1);
                ctx.lineTo(x - w2, y + r); ctx.lineTo(x + w2 * 0.2, y + r * 0.1); ctx.lineTo(x - w2, y + r * 0.1); ctx.closePath(); ctx.fill();
                break;
            case 'diamond_hollow':
                ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath();
                const hr = r * 0.5; ctx.moveTo(x - hr, y); ctx.lineTo(x, y + hr); ctx.lineTo(x + hr, y); ctx.lineTo(x, y - hr); ctx.closePath(); ctx.fill();
                break;
            case 'windmill':
                for (let i = 0; i < 4; i++) {
                    const ang = (Math.PI / 2) * i;
                    ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * r * 0.2, y + Math.sin(ang) * r * 0.2);
                    ctx.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r); ctx.lineTo(x + Math.cos(ang + 0.5) * r, y + Math.sin(ang + 0.5) * r); ctx.closePath();
                }
                ctx.fill(); break;
            case 'leaf':
                ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x + r, y - r * 0.5, x + r, y); ctx.quadraticCurveTo(x + r, y + r * 0.5, x, y + r);
                ctx.quadraticCurveTo(x - r, y + r * 0.5, x - r, y); ctx.quadraticCurveTo(x - r, y - r * 0.5, x, y - r);
                ctx.rect(x - size * 0.05, y - r, size * 0.1, size * 1.8); ctx.fill(); break;
            case 'ghost':
                ctx.arc(x, y - r * 0.2, r * 0.8, Math.PI, 0); ctx.lineTo(x + r * 0.8, y + r); ctx.lineTo(x + r * 0.4, y + r * 0.7);
                ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.4, y + r * 0.7); ctx.lineTo(x - r * 0.8, y + r); ctx.closePath();
                ctx.moveTo(x - r * 0.3, y - r * 0.2); ctx.arc(x - r * 0.3, y - r * 0.2, r * 0.2, 0, Math.PI * 2);
                ctx.moveTo(x + r * 0.3, y - r * 0.2); ctx.arc(x + r * 0.3, y - r * 0.2, r * 0.2, 0, Math.PI * 2); ctx.fill(); break;
        }
    };

    const drawPoly = (ctx, x, y, rad, sides, offset) => {
        const step = (Math.PI * 2) / sides;
        for (let i = 0; i < sides; i++) {
            const ang = i * step + offset;
            i === 0 ? ctx.moveTo(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad) : ctx.lineTo(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad);
        }
        ctx.closePath();
    };

    const drawStar = (ctx, cx, cy, spikes, outer, inner) => {
        let rot = Math.PI / 2 * 3, x = cx, y = cy, step = Math.PI / spikes;
        ctx.moveTo(cx, cy - outer);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outer; y = cy + Math.sin(rot) * outer; ctx.lineTo(x, y); rot += step;
            x = cx + Math.cos(rot) * inner; y = cy + Math.sin(rot) * inner; ctx.lineTo(x, y); rot += step;
        }
        ctx.lineTo(cx, cy - outer); ctx.closePath();
    };

    const saveImage = () => {
        if (!canvasRef.current) return;
        const l = document.createElement('a');
        l.download = `dither-ascii-pro-${Date.now()}.png`;
        l.href = canvasRef.current.toDataURL();
        l.click();
    };

    // Mount logic
    useEffect(() => {
        let active = true;

        async function init() {
            try {
                // Load Tweakpane as global script since it's commonly packaged that way via CDN
                // the provided URL is a generic UMD build
                await loadScript(dc, 'https://cdn.jsdelivr.net/npm/tweakpane@3.1.9/dist/tweakpane.min.js', { type: 'classic' });

                if (!active) return;
                state.TweakpaneClass = window.Tweakpane;

                if (!state.TweakpaneClass) {
                    throw new Error("Tweakpane failed to load properly into window object.");
                }

                setIsLoaded(true);

                // Setup image
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                    state.sourceImage = img;
                    renderCanvas();
                };
                img.src = 'https://ik.imagekit.io/sqiqig7tz/woman.jpg';

                // Setup GUI
                if (state.pane) state.pane.dispose();
                const pane = new state.TweakpaneClass.Pane({
                    container: tpContainerRef.current,
                    title: 'Dither / ASCII Effect Pro'
                });
                state.pane = pane;

                // Folder 1: Grid & Color
                const f1 = pane.addFolder({ title: 'Grid & Color Settings' });
                f1.addInput(state.params, 'cellSize', { min: 4, max: 40, step: 1, label: 'Cell Size' }).on('change', renderCanvas);
                f1.addInput(state.params, 'gap', { min: 0, max: 20, step: 0.25, label: 'Gap' }).on('change', renderCanvas);
                f1.addInput(state.params, 'contrast', { min: -100, max: 100, step: 1, label: 'Contrast' }).on('change', renderCanvas);
                f1.addInput(state.params, 'bgColor', { label: 'Background' }).on('change', renderCanvas);
                f1.addInput(state.params, 'useColor', { label: 'Original Color' }).on('change', renderCanvas);
                f1.addInput(state.params, 'monoColor', { label: 'Foreground Color' }).on('change', renderCanvas);

                // Folder 2: Algorithms
                const f2 = pane.addFolder({ title: 'Algorithm Mode' });
                f2.addInput(state.params, 'mode', {
                    options: {
                        'Static (Flat)': 'flat',
                        'Stretch Vertical': 'stretch_v',
                        'Stretch Horizontal': 'stretch_h',
                        'Checkerboard (Alt)': 'checker',
                        'Glitch (Luma>Offset)': 'glitch',
                        'Pixel Melt (Drip)': 'melt',
                        'Crosshatch': 'crosshatch',
                        'Rotation (Luma>Angle)': 'rotation',
                        'Halftone (Luma>Size)': 'halftone',
                        'Inverse (Dark>Size)': 'inv_halftone',
                        'Random Size (Chaos)': 'random_size',
                        'Random Rotation': 'random_rot',
                        'Opacity (Luma>Alpha)': 'opacity',
                        'Inv. Opacity (Dark>Alpha)': 'inv_opacity',
                        'Threshold (Hard Cut)': 'threshold',
                        'Flow Field (Direction)': 'flow',
                        'Edge Detect (Outline)': 'edges',
                        'Mosaic Jitter (Scatter)': 'jitter',
                        'Posterize (Levels)': 'posterize',
                        'Interference (Moiré)': 'interference',
                        'CRT TV (Scanline)': 'crt_scan',
                        'Bio-Organic (Cellular)': 'bio',
                        'Eraser (Noise)': 'eraser',
                    },
                    label: 'Mode'
                }).on('change', renderCanvas);

                f2.addInput(state.params, 'baseScale', { min: 0.1, max: 3.0, step: 0.025, label: 'Scale Factor' }).on('change', renderCanvas);
                f2.addInput(state.params, 'intensity', { min: 0, max: 5.0, step: 0.05, label: 'Effect Power' }).on('change', renderCanvas);

                // Folder 3: Geometry
                const f3 = pane.addFolder({ title: 'Shape Geometry' });
                const shapeInput = f3.addInput(state.params, 'shape', {
                    options: {
                        'Custom SVG': 'custom',
                        'Circle': 'circle',
                        'Square': 'rect',
                        'Triangle': 'triangle',
                        'Octagon': 'octagon',
                        'Star': 'star',
                        'Cross': 'cross',
                        'Rect Vertical': 'rect_v',
                        'Rect Horizontal': 'rect_h',
                        'Hexagon Vertical': 'hex_v',
                        'Diagonal /': 'line_diag_r',
                        'Diagonal \\': 'line_diag_l',
                        'Chevron': 'chevron',
                        'Trapezoid': 'trapezoid',
                        'Semi-Circle Top': 'semi_top',
                        'Semi-Circle Bottom': 'semi_bottom',
                        'Square Hollow': 'rect_hollow',
                        'Spiral': 'spiral',
                        'Concentric Circles': 'concentric',
                        'Gear (Cog)': 'gear',
                        'Flower (5 Petals)': 'flower',
                        'Shuriken': 'shuriken',
                        'Lightning': 'lightning',
                        'Diamond Hollow': 'diamond_hollow',
                        'Windmill': 'windmill',
                        'Leaf': 'leaf',
                        'Pacman Ghost': 'ghost'
                    },
                    label: 'Shape'
                });

                const svgBtn = f3.addButton({ title: 'Load SVG File...', hidden: true });

                shapeInput.on('change', (ev) => {
                    svgBtn.hidden = ev.value !== 'custom';
                    renderCanvas();
                });
                svgBtn.on('click', () => {
                    if (svgInputRef.current) svgInputRef.current.click();
                });

                pane.addSeparator();
                pane.addButton({ title: 'Upload Image' }).on('click', () => {
                    if (fileInputRef.current) fileInputRef.current.click();
                });
                pane.addButton({ title: 'Save Image' }).on('click', saveImage);

            } catch (err) {
                console.error("DitherInit:", err);
                setError(err.message);
            }
        }

        init();

        return () => {
            active = false;
            if (state.pane) state.pane.dispose();
        };

    }, []);

    // Handlers for inputs
    const onImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                state.sourceImage = img;
                renderCanvas();
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };

    const onSvgUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const svgContent = ev.target.result;
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgContent, "image/svg+xml");

            const pathElem = doc.querySelector('path');
            const svgElem = doc.querySelector('svg');

            if (!pathElem) {
                alert("Could not find a <path> element in this SVG. Please convert shapes to paths.");
                return;
            }

            const d = pathElem.getAttribute('d');
            state.customSVGPath = new Path2D(d);

            if (svgElem) {
                const viewBox = svgElem.getAttribute('viewBox');
                if (viewBox) {
                    const parts = viewBox.split(/\s+|,/).map(parseFloat);
                    state.customSVGViewBox = { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
                } else {
                    const w = parseFloat(svgElem.getAttribute('width')) || 100;
                    const h = parseFloat(svgElem.getAttribute('height')) || 100;
                    state.customSVGViewBox = { x: 0, y: 0, w: w, h: h };
                }
            }
            renderCanvas();
        };
        reader.readAsText(file);
    };

    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/svg')) {
                // Create artificial event matching file trigger
                onSvgUpload({ target: { files: [file] } });
                state.params.shape = 'custom';
                if (state.pane) state.pane.refresh();
            } else if (file.type.startsWith('image/')) {
                onImageUpload({ target: { files: [file] } });
            }
        }
    };

    return (
        <div style={styles.fullTabWrapper} onDragOver={handleDragOver} onDrop={handleDrop}>

            {/* Hidden Inputs */}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageUpload} />
            <input ref={svgInputRef} type="file" accept=".svg" style={{ display: 'none' }} onChange={onSvgUpload} />

            {!isLoaded && !error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', zIndex: 10 }}>
                    <dc.Icon icon="loader" className="animate-spin" style={{ fontSize: '32px' }} />
                </div>
            )}

            {error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', zIndex: 10, padding: '20px', textAlign: 'center' }}>
                    Error loading component: {error}
                </div>
            )}

            <canvas ref={canvasRef} style={styles.canvas} />

            <div ref={tpContainerRef} style={styles.tweakpaneContainer} />

            {!isInception && (
                <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
                    <button
                        onClick={onToggleFullTab}
                        style={{ padding: '8px', background: 'rgba(0,0,0,0.6)', border: '1px solid #333', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        <dc.Icon icon={isFullTab ? "minimize" : "maximize"} />
                    </button>
                </div>
            )}

            {/* Global CSS injection for tweakpane scrollbar aesthetics inside Datacore */}
            <style>{`
          .tp-container::-webkit-scrollbar { width: 6px; }
          .tp-container::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
          .tp-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        `}</style>

        </div>
    );
}

return { DitherComponent };
