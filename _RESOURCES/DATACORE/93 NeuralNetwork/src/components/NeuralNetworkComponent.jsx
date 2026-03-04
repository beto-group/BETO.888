const { useState, useEffect, useRef } = dc;

function NeuralNetworkComponent({ onCodeReloadRequest, isFullTab, onToggleFullTab, domUtils, styles, ControlsMenu }) {
  const STYLES = styles;
  const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `interactive-wrapper-${instanceId}`;

  // UI State
  const [density, setDensity] = useState(100);
  const [themeIndex, setThemeIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Engine State & Refs
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef({
    three: null,
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    composer: null,
    nodesMesh: null,
    connectionsMesh: null,
    starField: null,
    clock: null,
    animationId: null,
    neuralNetwork: null,
    config: {
      paused: false,
      activePaletteIndex: 0,
      currentFormation: 0,
      numFormations: 3,
      densityFactor: 1
    },
    palettes: [],
    pulseUniforms: {},
    interactionPlane: null,
    raycaster: null,
    pointer: null,
    interactionPoint: null,
    lastPulseIndex: 0,
    isActive: false
  });

  const [isLoaded, setIsLoaded] = useState(false);

  const neuralStyle = `
        .${uniqueWrapperClass} {
            --glass-bg: rgba(255, 255, 255, 0.03);
            --glass-border: rgba(255, 255, 255, 0.08);
            --glass-highlight: rgba(255, 255, 255, 0.2);
            --neon-accent: #667eea;
            --text-main: rgba(255, 255, 255, 0.9);
            --text-muted: rgba(255, 255, 255, 0.6);
            
            width: 100%;
            height: 100%;
            background: #050508;
            font-family: 'Outfit', sans-serif;
            color: var(--text-main);
            overflow: hidden;
            position: relative;
        }
        
        .${uniqueWrapperClass} canvas {
            display: block;
            width: 100%;
            height: 100%;
            cursor: crosshair;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 1;
        }

        .${uniqueWrapperClass} .glass-panel {
            backdrop-filter: blur(24px) saturate(120%);
            -webkit-backdrop-filter: blur(24px) saturate(120%);
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%);
            border: 1px solid var(--glass-border);
            border-top: 1px solid var(--glass-highlight);
            border-left: 1px solid var(--glass-highlight);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.02);
            border-radius: 24px;
            color: var(--text-main);
            transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            position: absolute;
            z-index: 10;
            overflow: hidden;
        }

        .${uniqueWrapperClass} .glass-panel::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
            transform: skewX(-15deg);
            transition: 0.5s;
            pointer-events: none;
        }

        .${uniqueWrapperClass} .glass-panel:hover {
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.05);
            transform: translateY(-2px);
            border-color: rgba(255, 255, 255, 0.15);
        }

        .${uniqueWrapperClass} .glass-panel:hover::before {
            left: 150%;
            transition: 0.7s ease-in-out;
        }

        .${uniqueWrapperClass} #instructions-container {
            top: 32px;
            left: 32px;
            width: 280px;
            padding: 24px;
        }

        .${uniqueWrapperClass} #instruction-title {
            font-weight: 500;
            font-size: 18px;
            margin-bottom: 8px;
            letter-spacing: -0.02em;
            background: linear-gradient(135deg, #fff 30%, #a5b4fc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }

        .${uniqueWrapperClass} .instruction-text {
            font-size: 14px;
            line-height: 1.5;
            color: var(--text-muted);
            font-weight: 300;
        }

        .${uniqueWrapperClass} #theme-selector {
            top: 32px;
            right: 32px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            width: 220px;
        }

        .${uniqueWrapperClass} #theme-selector-title {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: var(--text-muted);
            font-weight: 600;
            margin-bottom: 4px;
        }

        .${uniqueWrapperClass} .theme-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            justify-items: center;
        }

        .${uniqueWrapperClass} .theme-button {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            position: relative;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 4px 10px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.2);
        }

        .${uniqueWrapperClass} #theme-1 { background: radial-gradient(circle at 30% 30%, #a78bfa, #4c1d95); }
        .${uniqueWrapperClass} #theme-2 { background: radial-gradient(circle at 30% 30%, #fb7185, #9f1239); }
        .${uniqueWrapperClass} #theme-3 { background: radial-gradient(circle at 30% 30%, #38bdf8, #0c4a6e); }

        .${uniqueWrapperClass} .theme-button::after {
            content: '';
            position: absolute;
            top: -4px;
            left: -4px;
            right: -4px;
            bottom: -4px;
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.8);
            opacity: 0;
            transform: scale(1.1);
            transition: all 0.3s ease;
        }

        .${uniqueWrapperClass} .theme-button:hover {
            transform: scale(1.15) translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.4), inset 0 2px 6px rgba(255,255,255,0.6);
        }

        .${uniqueWrapperClass} .theme-button.active::after {
            opacity: 1;
            transform: scale(1);
            border-color: rgba(255,255,255,0.9);
            box-shadow: 0 0 15px rgba(255,255,255,0.3);
        }

        .${uniqueWrapperClass} #density-controls {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 8px;
        }

        .${uniqueWrapperClass} .density-label {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            color: var(--text-muted);
            font-weight: 300;
        }

        .${uniqueWrapperClass} #density-value {
            color: white;
            font-weight: 500;
            text-shadow: 0 0 10px rgba(255,255,255,0.3);
        }

        .${uniqueWrapperClass} .density-slider {
            -webkit-appearance: none;
            width: 100%;
            height: 6px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            outline: none;
            box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);
            /* Important logic to keep slider linear gradient working via direct style */
        }

        .${uniqueWrapperClass} .density-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #fff;
            cursor: pointer;
            box-shadow: 0 0 15px rgba(255,255,255,0.8), 0 2px 5px rgba(0,0,0,0.3);
            transition: all 0.2s ease;
            margin-top: -6px;
            position: relative;
            z-index: 2;
        }

        .${uniqueWrapperClass} .density-slider::-webkit-slider-runnable-track {
            width: 100%;
            height: 6px;
            cursor: pointer;
            background: linear-gradient(90deg, rgba(255,255,255,0.3) var(--val, 100%), rgba(255,255,255,0.05) var(--val, 100%));
            border-radius: 3px;
        }

        .${uniqueWrapperClass} .density-slider::-webkit-slider-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 0 20px rgba(255,255,255,1);
        }

        .${uniqueWrapperClass} #control-buttons {
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 16px;
            z-index: 20;
            padding: 8px;
            background: rgba(0,0,0,0.1);
        }

        .${uniqueWrapperClass} .control-button {
            backdrop-filter: blur(20px) saturate(140%);
            -webkit-backdrop-filter: blur(20px) saturate(140%);
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-top: 1px solid rgba(255, 255, 255, 0.25);
            color: var(--text-main);
            padding: 12px 24px;
            border-radius: 50px;
            cursor: pointer;
            font-family: 'Outfit', sans-serif;
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            transition: all 0.3s ease;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3), inset 0 0 10px rgba(255,255,255,0.02);
            overflow: hidden;
            position: relative;
            min-width: 100px;
            text-align: center;
        }

        .${uniqueWrapperClass} .control-button:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.4);
            transform: translateY(-4px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 255, 255, 0.1);
            text-shadow: 0 0 8px rgba(255,255,255,0.6);
        }

        .${uniqueWrapperClass} .control-button:active {
            transform: translateY(-1px);
        }

        .${uniqueWrapperClass} .control-button span {
            position: relative;
            z-index: 2;
        }
        
        /* Fixes for Datacore controls menu */
        .${uniqueWrapperClass} .controls-menu {
            z-index: 1000;
        }
    `;

  // Initialize Engine Setup (Part 1 - Dynamic Load)
  useEffect(() => {
    let isMounted = true;

    if (!isFullTab) return;

    if (window.THREE && window.THREE_ADDONS) {
      setIsLoaded(true);
      return;
    }

    const handleThreeReady = () => {
      if (isMounted) setIsLoaded(true);
    };

    window.addEventListener('three_ready', handleThreeReady);

    if (!document.getElementById('three-module-loader')) {
      console.log("Injecting Three.js module loader...");
      const script = document.createElement('script');
      script.id = 'three-module-loader';
      script.type = 'module';
      script.textContent = `
            import * as THREE from 'https://esm.sh/three@0.162.0';
            window.THREE = THREE;
            
            import { OrbitControls } from 'https://esm.sh/three@0.162.0/examples/jsm/controls/OrbitControls.js';
            import { EffectComposer } from 'https://esm.sh/three@0.162.0/examples/jsm/postprocessing/EffectComposer.js';
            import { RenderPass } from 'https://esm.sh/three@0.162.0/examples/jsm/postprocessing/RenderPass.js';
            import { UnrealBloomPass } from 'https://esm.sh/three@0.162.0/examples/jsm/postprocessing/UnrealBloomPass.js';
            import { OutputPass } from 'https://esm.sh/three@0.162.0/examples/jsm/postprocessing/OutputPass.js';
            
            window.THREE_ADDONS = { OrbitControls, EffectComposer, RenderPass, UnrealBloomPass, OutputPass };
            window.dispatchEvent(new Event('three_ready'));
        `;
      document.head.appendChild(script);
    }

    return () => {
      isMounted = false;
      window.removeEventListener('three_ready', handleThreeReady);
    };
  }, [isFullTab]);

  // Engine Core (Part 2 - Initialize Scene)
  useEffect(() => {
    if (!isFullTab || !isLoaded || !canvasRef.current || !containerRef.current || engineRef.current.isActive) return;

    console.log("Initializing Quantum Engine...");
    engineRef.current.isActive = true;

    const THREE = window.THREE;
    const { OrbitControls, EffectComposer, RenderPass, UnrealBloomPass, OutputPass } = window.THREE_ADDONS;

    // Constants extracted from the original script
    const colorPalettes = [
      [
        new THREE.Color(0x667eea), new THREE.Color(0x764ba2),
        new THREE.Color(0xf093fb), new THREE.Color(0x9d50bb), new THREE.Color(0x6e48aa)
      ],
      [
        new THREE.Color(0xf857a6), new THREE.Color(0xff5858),
        new THREE.Color(0xfeca57), new THREE.Color(0xff6348), new THREE.Color(0xff9068)
      ],
      [
        new THREE.Color(0x4facfe), new THREE.Color(0x00f2fe),
        new THREE.Color(0x43e97b), new THREE.Color(0x38f9d7), new THREE.Color(0x4484ce)
      ]
    ];
    engineRef.current.palettes = colorPalettes;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);
    engineRef.current.scene = scene;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    camera.position.set(0, 8, 28);
    engineRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    engineRef.current.renderer = renderer;

    // --- STARFIELD ---
    function createStarfield() {
      const count = 8000;
      const positions = [];
      const colors = [];
      const sizes = [];
      for (let i = 0; i < count; i++) {
        const r = THREE.MathUtils.randFloat(50, 150);
        const phi = Math.acos(1 - 2 * (i + 0.5) / count); // Use Fibonacci sphere for more even distribution
        const theta = Math.PI * (3 - Math.sqrt(5)) * i; // Golden angle
        positions.push(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        );
        const colorChoice = Math.random();
        if (colorChoice < 0.7) colors.push(1, 1, 1);
        else if (colorChoice < 0.85) colors.push(0.7, 0.8, 1);
        else colors.push(1, 0.9, 0.8);
        sizes.push(THREE.MathUtils.randFloat(0.1, 0.3));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
                    attribute float size;
                    attribute vec3 color;
                    varying vec3 vColor;
                    uniform float uTime;
                    void main() {
                        vColor = color;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        float twinkle = sin(uTime * 2.0 + position.x * 100.0) * 0.3 + 0.7;
                        gl_PointSize = size * twinkle * (300.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
        fragmentShader: `
                    varying vec3 vColor;
                    void main() {
                        vec2 center = gl_PointCoord - 0.5;
                        float dist = length(center);
                        if (dist > 0.5) discard;
                        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                        gl_FragColor = vec4(vColor, alpha * 0.8);
                    }
                `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      return new THREE.Points(geo, mat);
    }

    const starField = createStarfield();
    scene.add(starField);
    engineRef.current.starField = starField;

    // --- CONTROLS ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.6;
    controls.minDistance = 8;
    controls.maxDistance = 80;
    controls.autoRotate = !engineRef.current.config.paused;
    controls.autoRotateSpeed = 0.2;
    controls.enablePan = false;
    engineRef.current.controls = controls;

    // --- POST PROCESSING ---
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.8, 0.6, 0.7
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
    engineRef.current.composer = composer;

    // --- UNIFORMS & SHADERS ---
    const pulseUniforms = {
      uTime: { value: 0.0 },
      uPulsePositions: {
        value: [
          new THREE.Vector3(1e3, 1e3, 1e3),
          new THREE.Vector3(1e3, 1e3, 1e3),
          new THREE.Vector3(1e3, 1e3, 1e3)
        ]
      },
      uPulseTimes: { value: [-1e3, -1e3, -1e3] },
      uPulseColors: {
        value: [
          new THREE.Color(1, 1, 1),
          new THREE.Color(1, 1, 1),
          new THREE.Color(1, 1, 1)
        ]
      },
      uPulseSpeed: { value: 18.0 },
      uBaseNodeSize: { value: 0.6 }
    };
    engineRef.current.pulseUniforms = pulseUniforms;

    const noiseFunctions = `
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
            
            float snoise(vec3 v) {
                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                
                vec3 i = floor(v + dot(v, C.yyy));
                vec3 x0 = v - i + dot(i, C.xxx);
                
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min(g.xyz, l.zxy);
                vec3 i2 = max(g.xyz, l.zxy);
                
                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;
                
                i = mod289(i);
                vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                    
                float n_ = 0.142857142857;
                vec3 ns = n_ * D.wyz - D.xzx;
                
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_);
                
                vec4 x = x_ * ns.x + ns.yyyy;
                vec4 y = y_ * ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                
                vec4 b0 = vec4(x.xy, y.xy);
                vec4 b1 = vec4(x.zw, y.zw);
                
                vec4 s0 = floor(b0) * 2.0 + 1.0;
                vec4 s1 = floor(b1) * 2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                
                vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
                vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
                
                vec3 p0 = vec3(a0.xy, h.x);
                vec3 p1 = vec3(a0.zw, h.y);
                vec3 p2 = vec3(a1.xy, h.z);
                vec3 p3 = vec3(a1.zw, h.w);
                
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                p0 *= norm.x;
                p1 *= norm.y;
                p2 *= norm.z;
                p3 *= norm.w;
                
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
            }
        `;

    const nodeShader = {
      vertexShader: `
                ${noiseFunctions}
                attribute float nodeSize;
                attribute float nodeType;
                attribute vec3 nodeColor;
                attribute float distanceFromRoot;
                
                uniform float uTime;
                uniform vec3 uPulsePositions[3];
                uniform float uPulseTimes[3];
                uniform float uPulseSpeed;
                uniform float uBaseNodeSize;
                
                varying vec3 vColor;
                varying float vNodeType;
                varying vec3 vPosition;
                varying float vPulseIntensity;
                varying float vDistanceFromRoot;
                varying float vGlow;

                float getPulseIntensity(vec3 worldPos, vec3 pulsePos, float pulseTime) {
                    if (pulseTime < 0.0) return 0.0;
                    float timeSinceClick = uTime - pulseTime;
                    if (timeSinceClick < 0.0 || timeSinceClick > 4.0) return 0.0;
                    float pulseRadius = timeSinceClick * uPulseSpeed;
                    float distToClick = distance(worldPos, pulsePos);
                    float pulseThickness = 3.0;
                    float waveProximity = abs(distToClick - pulseRadius);
                    return smoothstep(pulseThickness, 0.0, waveProximity) * smoothstep(4.0, 0.0, timeSinceClick);
                }

                void main() {
                    vNodeType = nodeType;
                    vColor = nodeColor;
                    vDistanceFromRoot = distanceFromRoot;
                    vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                    vPosition = worldPos;
                    float totalPulseIntensity = 0.0;
                    for (int i = 0; i < 3; i++) {
                        totalPulseIntensity += getPulseIntensity(worldPos, uPulsePositions[i], uPulseTimes[i]);
                    }
                    vPulseIntensity = min(totalPulseIntensity, 1.0);
                    float breathe = sin(uTime * 0.7 + distanceFromRoot * 0.15) * 0.15 + 0.85;
                    float baseSize = nodeSize * breathe;
                    float pulseSize = baseSize * (1.0 + vPulseIntensity * 2.5);
                    vGlow = 0.5 + 0.5 * sin(uTime * 0.5 + distanceFromRoot * 0.2);
                    vec3 modifiedPosition = position;
                    if (nodeType > 0.5) {
                        float noise = snoise(position * 0.08 + uTime * 0.08);
                        modifiedPosition += normal * noise * 0.15;
                    }
                    vec4 mvPosition = modelViewMatrix * vec4(modifiedPosition, 1.0);
                    gl_PointSize = pulseSize * uBaseNodeSize * (1000.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
      fragmentShader: `
                uniform float uTime;
                uniform vec3 uPulseColors[3];
                
                varying vec3 vColor;
                varying float vNodeType;
                varying vec3 vPosition;
                varying float vPulseIntensity;
                varying float vDistanceFromRoot;
                varying float vGlow;
                
                void main() {
                    vec2 center = 2.0 * gl_PointCoord - 1.0;
                    float dist = length(center);
                    if (dist > 1.0) discard;
                    float glow1 = 1.0 - smoothstep(0.0, 0.5, dist);
                    float glow2 = 1.0 - smoothstep(0.0, 1.0, dist);
                    float glowStrength = pow(glow1, 1.2) + glow2 * 0.3;
                    float breatheColor = 0.9 + 0.1 * sin(uTime * 0.6 + vDistanceFromRoot * 0.25);
                    vec3 baseColor = vColor * breatheColor;
                    vec3 finalColor = baseColor;
                    if (vPulseIntensity > 0.0) {
                        vec3 pulseColor = mix(vec3(1.0), uPulseColors[0], 0.4);
                        finalColor = mix(baseColor, pulseColor, vPulseIntensity * 0.8);
                        finalColor *= (1.0 + vPulseIntensity * 1.2);
                        glowStrength *= (1.0 + vPulseIntensity);
                    }
                    float coreBrightness = smoothstep(0.4, 0.0, dist);
                    finalColor += vec3(1.0) * coreBrightness * 0.3;
                    float alpha = glowStrength * (0.95 - 0.3 * dist);
                    float camDistance = length(vPosition - cameraPosition);
                    float distanceFade = smoothstep(100.0, 15.0, camDistance);
                    if (vNodeType > 0.5) {
                        finalColor *= 1.1;
                        alpha *= 0.9;
                    }
                    finalColor *= (1.0 + vGlow * 0.1);
                    gl_FragColor = vec4(finalColor, alpha * distanceFade);
                }
            `
    };

    const connectionShader = {
      vertexShader: `
                ${noiseFunctions}
                attribute vec3 startPoint;
                attribute vec3 endPoint;
                attribute float connectionStrength;
                attribute float pathIndex;
                attribute vec3 connectionColor;
                
                uniform float uTime;
                uniform vec3 uPulsePositions[3];
                uniform float uPulseTimes[3];
                uniform float uPulseSpeed;
                
                varying vec3 vColor;
                varying float vConnectionStrength;
                varying float vPulseIntensity;
                varying float vPathPosition;
                varying float vDistanceFromCamera;

                float getPulseIntensity(vec3 worldPos, vec3 pulsePos, float pulseTime) {
                    if (pulseTime < 0.0) return 0.0;
                    float timeSinceClick = uTime - pulseTime;
                    if (timeSinceClick < 0.0 || timeSinceClick > 4.0) return 0.0;
                    
                    float pulseRadius = timeSinceClick * uPulseSpeed;
                    float distToClick = distance(worldPos, pulsePos);
                    float pulseThickness = 3.0;
                    float waveProximity = abs(distToClick - pulseRadius);
                    
                    return smoothstep(pulseThickness, 0.0, waveProximity) * smoothstep(4.0, 0.0, timeSinceClick);
                }
                
                void main() {
                    float t = position.x;
                    vPathPosition = t;
                    vec3 midPoint = mix(startPoint, endPoint, 0.5);
                    float pathOffset = sin(t * 3.14159) * 0.15;
                    vec3 perpendicular = normalize(cross(normalize(endPoint - startPoint), vec3(0.0, 1.0, 0.0)));
                    if (length(perpendicular) < 0.1) perpendicular = vec3(1.0, 0.0, 0.0);
                    midPoint += perpendicular * pathOffset;
                    vec3 p0 = mix(startPoint, midPoint, t);
                    vec3 p1 = mix(midPoint, endPoint, t);
                    vec3 finalPos = mix(p0, p1, t);
                    float noiseTime = uTime * 0.15;
                    float noise = snoise(vec3(pathIndex * 0.08, t * 0.6, noiseTime));
                    finalPos += perpendicular * noise * 0.12;
                    vec3 worldPos = (modelMatrix * vec4(finalPos, 1.0)).xyz;
                    float totalPulseIntensity = 0.0;
                    for (int i = 0; i < 3; i++) {
                        totalPulseIntensity += getPulseIntensity(worldPos, uPulsePositions[i], uPulseTimes[i]);
                    }
                    vPulseIntensity = min(totalPulseIntensity, 1.0);
                    vColor = connectionColor;
                    vConnectionStrength = connectionStrength;
                    
                    vDistanceFromCamera = length(worldPos - cameraPosition);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
                }
            `,
      fragmentShader: `
                uniform float uTime;
                uniform vec3 uPulseColors[3];
                
                varying vec3 vColor;
                varying float vConnectionStrength;
                varying float vPulseIntensity;
                varying float vPathPosition;
                varying float vDistanceFromCamera;
                
                void main() {
                    float flowPattern1 = sin(vPathPosition * 25.0 - uTime * 4.0) * 0.5 + 0.5;
                    float flowPattern2 = sin(vPathPosition * 15.0 - uTime * 2.5 + 1.57) * 0.5 + 0.5;
                    float combinedFlow = (flowPattern1 + flowPattern2 * 0.5) / 1.5;
                    
                    vec3 baseColor = vColor * (0.8 + 0.2 * sin(uTime * 0.6 + vPathPosition * 12.0));
                    float flowIntensity = 0.4 * combinedFlow * vConnectionStrength;
                    vec3 finalColor = baseColor;
                    if (vPulseIntensity > 0.0) {
                        vec3 pulseColor = mix(vec3(1.0), uPulseColors[0], 0.3);
                        finalColor = mix(baseColor, pulseColor * 1.2, vPulseIntensity * 0.7);
                        flowIntensity += vPulseIntensity * 0.8;
                    }
                    finalColor *= (0.7 + flowIntensity + vConnectionStrength * 0.5);
                    float baseAlpha = 0.7 * vConnectionStrength;
                    float flowAlpha = combinedFlow * 0.3;
                    float alpha = baseAlpha + flowAlpha;
                    alpha = mix(alpha, min(1.0, alpha * 2.5), vPulseIntensity);
                    float distanceFade = smoothstep(100.0, 15.0, vDistanceFromCamera);
                    gl_FragColor = vec4(finalColor, alpha * distanceFade);
                }
            `
    };

    // Network Generation Classes & Functions definition attached to ref to use across hooks and listeners
    class Node {
      constructor(position, level = 0, type = 0) {
        this.position = position;
        this.connections = [];
        this.level = level;
        this.type = type;
        this.size = type === 0 ? THREE.MathUtils.randFloat(0.8, 1.4) : THREE.MathUtils.randFloat(0.5, 1.0);
        this.distanceFromRoot = 0;
      }
      addConnection(node, strength = 1.0) {
        if (!this.isConnectedTo(node)) {
          this.connections.push({ node, strength });
          node.connections.push({ node: this, strength });
        }
      }
      isConnectedTo(node) {
        return this.connections.some(conn => conn.node === node);
      }
    }

    const generateNeuralNetwork = (formationIndex, densityFactor = 1.0) => {
      let nodes = [];
      let rootNode;

      function generateCrystallineSphere() {
        rootNode = new Node(new THREE.Vector3(0, 0, 0), 0, 0);
        rootNode.size = 2.0;
        nodes.push(rootNode);
        const layers = 5;
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        for (let layer = 1; layer <= layers; layer++) {
          const radius = layer * 4;
          const numPoints = Math.floor(layer * 12 * densityFactor);
          for (let i = 0; i < numPoints; i++) {
            const phi = Math.acos(1 - 2 * (i + 0.5) / numPoints);
            const theta = 2 * Math.PI * i / goldenRatio;
            const pos = new THREE.Vector3(
              radius * Math.sin(phi) * Math.cos(theta),
              radius * Math.sin(phi) * Math.sin(theta),
              radius * Math.cos(phi)
            );
            const isLeaf = layer === layers || Math.random() < 0.3;
            const node = new Node(pos, layer, isLeaf ? 1 : 0);
            node.distanceFromRoot = radius;
            nodes.push(node);
            if (layer > 1) {
              const prevLayerNodes = nodes.filter(n => n.level === layer - 1 && n !== rootNode);
              prevLayerNodes.sort((a, b) => pos.distanceTo(a.position) - pos.distanceTo(b.position));
              for (let j = 0; j < Math.min(3, prevLayerNodes.length); j++) {
                const dist = pos.distanceTo(prevLayerNodes[j].position);
                const strength = 1.0 - (dist / (radius * 2));
                node.addConnection(prevLayerNodes[j], Math.max(0.3, strength));
              }
            } else {
              rootNode.addConnection(node, 0.9);
            }
          }
          const layerNodes = nodes.filter(n => n.level === layer && n !== rootNode);
          for (let i = 0; i < layerNodes.length; i++) {
            const node = layerNodes[i];
            const nearby = layerNodes.filter(n => n !== node)
              .sort((a, b) => node.position.distanceTo(a.position) - node.position.distanceTo(b.position))
              .slice(0, 5);
            for (const nearNode of nearby) {
              const dist = node.position.distanceTo(nearNode.position);
              if (dist < radius * 0.8 && !node.isConnectedTo(nearNode)) {
                node.addConnection(nearNode, 0.6);
              }
            }
          }
        }
        const outerNodes = nodes.filter(n => n.level >= 3);
        for (let i = 0; i < Math.min(20, outerNodes.length); i++) {
          const n1 = outerNodes[Math.floor(Math.random() * outerNodes.length)];
          const n2 = outerNodes[Math.floor(Math.random() * outerNodes.length)];
          if (n1 !== n2 && !n1.isConnectedTo(n2) && Math.abs(n1.level - n2.level) > 1) {
            n1.addConnection(n2, 0.4);
          }
        }
      }

      function generateHelixLattice() {
        rootNode = new Node(new THREE.Vector3(0, 0, 0), 0, 0);
        rootNode.size = 1.8;
        nodes.push(rootNode);
        const numHelices = 4;
        const height = 30;
        const maxRadius = 12;
        const nodesPerHelix = Math.floor(50 * densityFactor);
        const helixArrays = [];
        for (let h = 0; h < numHelices; h++) {
          const helixPhase = (h / numHelices) * Math.PI * 2;
          const helixNodes = [];
          for (let i = 0; i < nodesPerHelix; i++) {
            const t = i / (nodesPerHelix - 1);
            const y = (t - 0.5) * height;
            const radiusScale = Math.sin(t * Math.PI) * 0.7 + 0.3;
            const radius = maxRadius * radiusScale;
            const angle = helixPhase + t * Math.PI * 6;
            const pos = new THREE.Vector3(radius * Math.cos(angle), y, radius * Math.sin(angle));
            const level = Math.ceil(t * 5);
            const isLeaf = i > nodesPerHelix - 5 || Math.random() < 0.25;
            const node = new Node(pos, level, isLeaf ? 1 : 0);
            node.distanceFromRoot = Math.sqrt(radius * radius + y * y);
            node.helixIndex = h;
            node.helixT = t;
            nodes.push(node);
            helixNodes.push(node);
          }
          helixArrays.push(helixNodes);
          rootNode.addConnection(helixNodes[0], 1.0);
          for (let i = 0; i < helixNodes.length - 1; i++) {
            helixNodes[i].addConnection(helixNodes[i + 1], 0.85);
          }
        }
        for (let h = 0; h < numHelices; h++) {
          const currentHelix = helixArrays[h];
          const nextHelix = helixArrays[(h + 1) % numHelices];
          for (let i = 0; i < currentHelix.length; i += 5) {
            const t = currentHelix[i].helixT;
            const targetIdx = Math.round(t * (nextHelix.length - 1));
            if (targetIdx < nextHelix.length) {
              currentHelix[i].addConnection(nextHelix[targetIdx], 0.7);
            }
          }
        }
        for (const helix of helixArrays) {
          for (let i = 0; i < helix.length; i += 8) {
            const node = helix[i];
            const innerNodes = nodes.filter(n => n !== node && n !== rootNode && n.distanceFromRoot < node.distanceFromRoot * 0.5);
            if (innerNodes.length > 0) {
              const nearest = innerNodes.sort((a, b) => node.position.distanceTo(a.position) - node.position.distanceTo(b.position))[0];
              node.addConnection(nearest, 0.5);
            }
          }
        }
        const allHelixNodes = nodes.filter(n => n !== rootNode);
        for (let i = 0; i < Math.floor(30 * densityFactor); i++) {
          const n1 = allHelixNodes[Math.floor(Math.random() * allHelixNodes.length)];
          const nearby = allHelixNodes.filter(n => {
            const dist = n.position.distanceTo(n1.position);
            return n !== n1 && dist < 8 && dist > 3 && !n1.isConnectedTo(n);
          });
          if (nearby.length > 0) {
            const n2 = nearby[Math.floor(Math.random() * nearby.length)];
            n1.addConnection(n2, 0.45);
          }
        }
      }

      function generateFractalWeb() {
        rootNode = new Node(new THREE.Vector3(0, 0, 0), 0, 0);
        rootNode.size = 1.6;
        nodes.push(rootNode);
        const branches = 6;
        const maxDepth = 4;

        function createBranch(startNode, direction, depth, strength, scale) {
          if (depth > maxDepth) return;
          const branchLength = 5 * scale;
          const endPos = new THREE.Vector3().copy(startNode.position).add(direction.clone().multiplyScalar(branchLength));
          const isLeaf = depth === maxDepth || Math.random() < 0.3;
          const newNode = new Node(endPos, depth, isLeaf ? 1 : 0);
          newNode.distanceFromRoot = rootNode.position.distanceTo(endPos);
          nodes.push(newNode);
          startNode.addConnection(newNode, strength);
          if (depth < maxDepth) {
            const subBranches = 3;
            for (let i = 0; i < subBranches; i++) {
              const angle = (i / subBranches) * Math.PI * 2;
              const perpDir1 = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
              const perpDir2 = direction.clone().cross(perpDir1).normalize();
              const newDir = new THREE.Vector3()
                .copy(direction)
                .add(perpDir1.clone().multiplyScalar(Math.cos(angle) * 0.7))
                .add(perpDir2.clone().multiplyScalar(Math.sin(angle) * 0.7))
                .normalize();
              createBranch(newNode, newDir, depth + 1, strength * 0.7, scale * 0.75);
            }
          }
        }

        for (let i = 0; i < branches; i++) {
          const phi = Math.acos(1 - 2 * (i + 0.5) / branches);
          const theta = Math.PI * (1 + Math.sqrt(5)) * i;
          const direction = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.sin(phi) * Math.sin(theta),
            Math.cos(phi)
          ).normalize();
          createBranch(rootNode, direction, 1, 0.9, 1.0);
        }

        const leafNodes = nodes.filter(n => n.level >= 2);
        for (let i = 0; i < leafNodes.length; i++) {
          const node = leafNodes[i];
          const nearby = leafNodes.filter(n => {
            const dist = n.position.distanceTo(node.position);
            return n !== node && dist < 10 && !node.isConnectedTo(n);
          }).sort((a, b) => node.position.distanceTo(a.position) - node.position.distanceTo(b.position)).slice(0, 3);
          for (const nearNode of nearby) {
            if (Math.random() < 0.5 * densityFactor) {
              node.addConnection(nearNode, 0.5);
            }
          }
        }
        const midLevelNodes = nodes.filter(n => n.level >= 2 && n.level <= 3);
        for (const node of midLevelNodes) {
          if (Math.random() < 0.3) {
            const innerNodes = nodes.filter(n => n !== node && n.distanceFromRoot < node.distanceFromRoot * 0.6);
            if (innerNodes.length > 0) {
              const target = innerNodes[Math.floor(Math.random() * innerNodes.length)];
              if (!node.isConnectedTo(target)) {
                node.addConnection(target, 0.4);
              }
            }
          }
        }
      }

      switch (formationIndex % 3) {
        case 0: generateCrystallineSphere(); break;
        case 1: generateHelixLattice(); break;
        case 2: generateFractalWeb(); break;
      }

      if (densityFactor < 1.0) {
        const targetCount = Math.ceil(nodes.length * Math.max(0.3, densityFactor));
        const toKeep = new Set([rootNode]);
        const sortedNodes = nodes.filter(n => n !== rootNode).sort((a, b) => {
          const scoreA = a.connections.length * (1 / (a.distanceFromRoot + 1));
          const scoreB = b.connections.length * (1 / (b.distanceFromRoot + 1));
          return scoreB - scoreA;
        });
        for (let i = 0; i < Math.min(targetCount - 1, sortedNodes.length); i++) {
          toKeep.add(sortedNodes[i]);
        }
        nodes = nodes.filter(n => toKeep.has(n));
        nodes.forEach(node => {
          node.connections = node.connections.filter(conn => toKeep.has(conn.node));
        });
      }

      return { nodes, rootNode };
    };

    const createNetworkVisualization = (formationIndex, densityFactor = 1.0) => {
      if (engineRef.current.nodesMesh) {
        scene.remove(engineRef.current.nodesMesh);
        engineRef.current.nodesMesh.geometry.dispose();
        engineRef.current.nodesMesh.material.dispose();
      }
      if (engineRef.current.connectionsMesh) {
        scene.remove(engineRef.current.connectionsMesh);
        engineRef.current.connectionsMesh.geometry.dispose();
        engineRef.current.connectionsMesh.material.dispose();
      }

      const neuralNetwork = generateNeuralNetwork(formationIndex, densityFactor);
      engineRef.current.neuralNetwork = neuralNetwork;

      if (!neuralNetwork || neuralNetwork.nodes.length === 0) return;

      const nodesGeometry = new THREE.BufferGeometry();
      const nodePositions = [];
      const nodeTypes = [];
      const nodeSizes = [];
      const nodeColors = [];
      const distancesFromRoot = [];
      const palette = engineRef.current.palettes[engineRef.current.config.activePaletteIndex];

      neuralNetwork.nodes.forEach((node) => {
        nodePositions.push(node.position.x, node.position.y, node.position.z);
        nodeTypes.push(node.type);
        nodeSizes.push(node.size);
        distancesFromRoot.push(node.distanceFromRoot);
        const colorIndex = Math.min(node.level, palette.length - 1);
        const baseColor = palette[colorIndex % palette.length].clone();
        baseColor.offsetHSL(
          THREE.MathUtils.randFloatSpread(0.03),
          THREE.MathUtils.randFloatSpread(0.08),
          THREE.MathUtils.randFloatSpread(0.08)
        );
        nodeColors.push(baseColor.r, baseColor.g, baseColor.b);
      });

      nodesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(nodePositions, 3));
      nodesGeometry.setAttribute('nodeType', new THREE.Float32BufferAttribute(nodeTypes, 1));
      nodesGeometry.setAttribute('nodeSize', new THREE.Float32BufferAttribute(nodeSizes, 1));
      nodesGeometry.setAttribute('nodeColor', new THREE.Float32BufferAttribute(nodeColors, 3));
      nodesGeometry.setAttribute('distanceFromRoot', new THREE.Float32BufferAttribute(distancesFromRoot, 1));

      const nodesMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone(engineRef.current.pulseUniforms),
        vertexShader: nodeShader.vertexShader,
        fragmentShader: nodeShader.fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const nodesMesh = new THREE.Points(nodesGeometry, nodesMaterial);
      scene.add(nodesMesh);
      engineRef.current.nodesMesh = nodesMesh;

      const connectionsGeometry = new THREE.BufferGeometry();
      const connectionColors = [];
      const connectionStrengths = [];
      const connectionPositions = [];
      const startPoints = [];
      const endPoints = [];
      const pathIndices = [];
      const processedConnections = new Set();
      let pathIndex = 0;

      neuralNetwork.nodes.forEach((node, nodeIndex) => {
        node.connections.forEach(connection => {
          const connectedNode = connection.node;
          const connectedIndex = neuralNetwork.nodes.indexOf(connectedNode);
          if (connectedIndex === -1) return;
          const key = [Math.min(nodeIndex, connectedIndex), Math.max(nodeIndex, connectedIndex)].join('-');
          if (!processedConnections.has(key)) {
            processedConnections.add(key);
            const startPoint = node.position;
            const endPoint = connectedNode.position;
            const numSegments = 20;
            for (let i = 0; i < numSegments; i++) {
              const t = i / (numSegments - 1);
              connectionPositions.push(t, 0, 0);
              startPoints.push(startPoint.x, startPoint.y, startPoint.z);
              endPoints.push(endPoint.x, endPoint.y, endPoint.z);
              pathIndices.push(pathIndex);
              connectionStrengths.push(connection.strength);
              const avgLevel = Math.min(Math.floor((node.level + connectedNode.level) / 2), palette.length - 1);
              const baseColor = palette[avgLevel % palette.length].clone();
              baseColor.offsetHSL(
                THREE.MathUtils.randFloatSpread(0.03),
                THREE.MathUtils.randFloatSpread(0.08),
                THREE.MathUtils.randFloatSpread(0.08)
              );
              connectionColors.push(baseColor.r, baseColor.g, baseColor.b);
            }
            pathIndex++;
          }
        });
      });

      connectionsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connectionPositions, 3));
      connectionsGeometry.setAttribute('startPoint', new THREE.Float32BufferAttribute(startPoints, 3));
      connectionsGeometry.setAttribute('endPoint', new THREE.Float32BufferAttribute(endPoints, 3));
      connectionsGeometry.setAttribute('connectionStrength', new THREE.Float32BufferAttribute(connectionStrengths, 1));
      connectionsGeometry.setAttribute('connectionColor', new THREE.Float32BufferAttribute(connectionColors, 3));
      connectionsGeometry.setAttribute('pathIndex', new THREE.Float32BufferAttribute(pathIndices, 1));

      const connectionsMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone(engineRef.current.pulseUniforms),
        vertexShader: connectionShader.vertexShader,
        fragmentShader: connectionShader.fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const connectionsMesh = new THREE.LineSegments(connectionsGeometry, connectionsMaterial);
      scene.add(connectionsMesh);
      engineRef.current.connectionsMesh = connectionsMesh;

      palette.forEach((color, i) => {
        if (i < 3) {
          connectionsMaterial.uniforms.uPulseColors.value[i].copy(color);
          nodesMaterial.uniforms.uPulseColors.value[i].copy(color);
        }
      });
    };

    // Attach to ref for UI handler access later
    engineRef.current.createNetworkVisualization = createNetworkVisualization;

    // Interaction Setup
    engineRef.current.raycaster = new THREE.Raycaster();
    engineRef.current.pointer = new THREE.Vector2();
    engineRef.current.interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    engineRef.current.interactionPoint = new THREE.Vector3();
    engineRef.current.clock = new THREE.Clock();

    const triggerPulse = (clientX, clientY) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const pointer = engineRef.current.pointer;
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      engineRef.current.raycaster.setFromCamera(pointer, camera);
      engineRef.current.interactionPlane.normal.copy(camera.position).normalize();
      engineRef.current.interactionPlane.constant = -engineRef.current.interactionPlane.normal.dot(camera.position) + camera.position.length() * 0.5;

      if (engineRef.current.raycaster.ray.intersectPlane(engineRef.current.interactionPlane, engineRef.current.interactionPoint)) {
        const time = engineRef.current.clock.getElapsedTime();
        const nm = engineRef.current.nodesMesh;
        const cm = engineRef.current.connectionsMesh;

        if (nm && cm) {
          engineRef.current.lastPulseIndex = (engineRef.current.lastPulseIndex + 1) % 3;
          const lpi = engineRef.current.lastPulseIndex;

          nm.material.uniforms.uPulsePositions.value[lpi].copy(engineRef.current.interactionPoint);
          nm.material.uniforms.uPulseTimes.value[lpi] = time;
          cm.material.uniforms.uPulsePositions.value[lpi].copy(engineRef.current.interactionPoint);
          cm.material.uniforms.uPulseTimes.value[lpi] = time;

          const palette = engineRef.current.palettes[engineRef.current.config.activePaletteIndex];
          const randomColor = palette[Math.floor(Math.random() * palette.length)];
          nm.material.uniforms.uPulseColors.value[lpi].copy(randomColor);
          cm.material.uniforms.uPulseColors.value[lpi].copy(randomColor);
        }
      }
    };

    const handleCanvasClick = (e) => {
      if (e.target.closest('.glass-panel, #control-buttons')) return;
      if (!engineRef.current.config.paused) triggerPulse(e.clientX, e.clientY);
    };

    const handleCanvasTouch = (e) => {
      if (e.target.closest('.glass-panel, #control-buttons')) return;
      // Prevent default if it's purely our canvas touch to avoid scroll, but be careful with typical div scrolling
      if (e.touches.length > 0 && !engineRef.current.config.paused) {
        triggerPulse(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloomPass.resolution.set(w, h);
    };

    canvasRef.current.addEventListener('click', handleCanvasClick);
    canvasRef.current.addEventListener('touchstart', handleCanvasTouch, { passive: false });
    window.addEventListener('resize', handleResize);

    // INITIALIZE FIRST FORMATION
    createNetworkVisualization(engineRef.current.config.currentFormation, engineRef.current.config.densityFactor);

    // RENDER LOOP
    const animate = () => {
      engineRef.current.animationId = requestAnimationFrame(animate);
      const t = engineRef.current.clock.getElapsedTime();

      if (!engineRef.current.config.paused) {
        if (engineRef.current.nodesMesh) {
          engineRef.current.nodesMesh.material.uniforms.uTime.value = t;
          engineRef.current.nodesMesh.rotation.y = Math.sin(t * 0.04) * 0.05;
        }
        if (engineRef.current.connectionsMesh) {
          engineRef.current.connectionsMesh.material.uniforms.uTime.value = t;
          engineRef.current.connectionsMesh.rotation.y = Math.sin(t * 0.04) * 0.05;
        }
      }

      engineRef.current.starField.rotation.y += 0.0002;
      engineRef.current.starField.material.uniforms.uTime.value = t;

      engineRef.current.controls.update();
      engineRef.current.composer.render();
    };

    animate();

    return () => {
      console.log("Cleaning up Quantum Engine...");
      engineRef.current.isActive = false;

      if (engineRef.current.animationId) {
        cancelAnimationFrame(engineRef.current.animationId);
      }

      if (canvasRef.current) {
        canvasRef.current.removeEventListener('click', handleCanvasClick);
        canvasRef.current.removeEventListener('touchstart', handleCanvasTouch);
      }
      window.removeEventListener('resize', handleResize);

      if (engineRef.current.renderer) {
        engineRef.current.renderer.dispose();
      }
      if (engineRef.current.controls) {
        engineRef.current.controls.dispose();
      }
      if (engineRef.current.nodesMesh) {
        scene.remove(engineRef.current.nodesMesh);
        engineRef.current.nodesMesh.geometry.dispose();
        engineRef.current.nodesMesh.material.dispose();
      }
      if (engineRef.current.connectionsMesh) {
        scene.remove(engineRef.current.connectionsMesh);
        engineRef.current.connectionsMesh.geometry.dispose();
        engineRef.current.connectionsMesh.material.dispose();
      }
      if (engineRef.current.starField) {
        scene.remove(engineRef.current.starField);
        engineRef.current.starField.geometry.dispose();
        engineRef.current.starField.material.dispose();
      }
    };

  }, [isFullTab, isLoaded]);

  if (!isFullTab) {
    return (
      <div style={STYLES.compactWrapper} className={uniqueWrapperClass}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={STYLES.subtitle}><strong>Neural Network</strong> ({instanceId})</span>
          <div
            style={STYLES.iconButton}
            onClick={onToggleFullTab}
            title="Enter Full Mode"
          >
            <dc.Icon icon="maximize" style={{ width: "16px", height: "16px" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050508', color: '#fff' }}>
        Loading Quantum Engine...
      </div>
    );
  }

  // UI Handlers
  const updateTheme = (paletteIndex) => {
    setThemeIndex(paletteIndex);
    engineRef.current.config.activePaletteIndex = paletteIndex;

    if (!engineRef.current.nodesMesh || !engineRef.current.connectionsMesh || !engineRef.current.neuralNetwork) return;

    const THREE = window.THREE;
    const palette = engineRef.current.palettes[paletteIndex];
    const nodeColorsAttr = engineRef.current.nodesMesh.geometry.attributes.nodeColor;

    for (let i = 0; i < nodeColorsAttr.count; i++) {
      const node = engineRef.current.neuralNetwork.nodes[i];
      if (!node) continue;
      const colorIndex = Math.min(node.level, palette.length - 1);
      const baseColor = palette[colorIndex % palette.length].clone();
      baseColor.offsetHSL(
        THREE.MathUtils.randFloatSpread(0.03),
        THREE.MathUtils.randFloatSpread(0.08),
        THREE.MathUtils.randFloatSpread(0.08)
      );
      nodeColorsAttr.setXYZ(i, baseColor.r, baseColor.g, baseColor.b);
    }
    nodeColorsAttr.needsUpdate = true;

    const connectionColors = [];
    const processedConnections = new Set();
    engineRef.current.neuralNetwork.nodes.forEach((node, nodeIndex) => {
      node.connections.forEach(connection => {
        const connectedNode = connection.node;
        const connectedIndex = engineRef.current.neuralNetwork.nodes.indexOf(connectedNode);
        if (connectedIndex === -1) return;
        const key = [Math.min(nodeIndex, connectedIndex), Math.max(nodeIndex, connectedIndex)].join('-');
        if (!processedConnections.has(key)) {
          processedConnections.add(key);
          const numSegments = 20;
          for (let i = 0; i < numSegments; i++) {
            const avgLevel = Math.min(Math.floor((node.level + connectedNode.level) / 2), palette.length - 1);
            const baseColor = palette[avgLevel % palette.length].clone();
            baseColor.offsetHSL(
              THREE.MathUtils.randFloatSpread(0.03),
              THREE.MathUtils.randFloatSpread(0.08),
              THREE.MathUtils.randFloatSpread(0.08)
            );
            connectionColors.push(baseColor.r, baseColor.g, baseColor.b);
          }
        }
      });
    });

    engineRef.current.connectionsMesh.geometry.setAttribute('connectionColor', new THREE.Float32BufferAttribute(connectionColors, 3));
    engineRef.current.connectionsMesh.geometry.attributes.connectionColor.needsUpdate = true;

    palette.forEach((color, i) => {
      if (i < 3) {
        engineRef.current.nodesMesh.material.uniforms.uPulseColors.value[i].copy(color);
        engineRef.current.connectionsMesh.material.uniforms.uPulseColors.value[i].copy(color);
      }
    });
  };

  const handleThemeClick = (idx) => {
    updateTheme(idx);
  };

  const handleDensityChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setDensity(val);
    engineRef.current.config.densityFactor = val / 100;

    // Debounce map generation
    if (engineRef.current.densityTimeout) {
      clearTimeout(engineRef.current.densityTimeout);
    }
    engineRef.current.densityTimeout = setTimeout(() => {
      if (engineRef.current.createNetworkVisualization) {
        engineRef.current.createNetworkVisualization(engineRef.current.config.currentFormation, engineRef.current.config.densityFactor);
      }
    }, 400);
  };

  const handleMorphClick = () => {
    engineRef.current.config.currentFormation = (engineRef.current.config.currentFormation + 1) % engineRef.current.config.numFormations;
    if (engineRef.current.createNetworkVisualization) {
      engineRef.current.createNetworkVisualization(engineRef.current.config.currentFormation, engineRef.current.config.densityFactor);
    }
    if (engineRef.current.controls) {
      engineRef.current.controls.autoRotate = false;
      setTimeout(() => {
        if (engineRef.current.controls && !engineRef.current.config.paused) engineRef.current.controls.autoRotate = true;
      }, 2500);
    }
  };

  const handleFreezeClick = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    engineRef.current.config.paused = newPausedState;
    if (engineRef.current.controls) {
      engineRef.current.controls.autoRotate = !newPausedState;
    }
  };

  const handleResetClick = () => {
    if (engineRef.current.controls) {
      engineRef.current.controls.reset();
      engineRef.current.controls.autoRotate = false;
      setTimeout(() => {
        if (engineRef.current.controls && !engineRef.current.config.paused) engineRef.current.controls.autoRotate = true;
      }, 2000);
    }
    if (engineRef.current.camera) {
      engineRef.current.camera.position.set(0, 8, 28);
    }
  };


  return (
    <div style={{ width: '100%', height: '100%' }} ref={containerRef}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600&display=swap" rel="stylesheet" />
      <style>{neuralStyle}</style>

      <div className={uniqueWrapperClass}>
        <ControlsMenu
          onReload={onCodeReloadRequest}
          onToggle={onToggleFullTab}
          styles={STYLES}
        />

        <div id="instructions-container" className="glass-panel">
          <div id="instruction-title">Quantum Neural Network</div>
          <div className="instruction-text">Click to send energy pulses. <br />Drag to explore the structure.</div>
        </div>

        <div id="theme-selector" className="glass-panel">
          <div style={{ flex: 1 }}>
            <div id="theme-selector-title">Crystal Theme</div>
            <div className="theme-grid">
              <button className={`theme-button ${themeIndex === 0 ? 'active' : ''}`} id="theme-1" aria-label="Purple Nebula" onClick={() => handleThemeClick(0)}></button>
              <button className={`theme-button ${themeIndex === 1 ? 'active' : ''}`} id="theme-2" aria-label="Sunset Fire" onClick={() => handleThemeClick(1)}></button>
              <button className={`theme-button ${themeIndex === 2 ? 'active' : ''}`} id="theme-3" aria-label="Ocean Aurora" onClick={() => handleThemeClick(2)}></button>
            </div>
          </div>
          <div id="density-controls" style={{ flex: 1 }}>
            <div className="density-label"><span>Density</span><span id="density-value">{density}%</span></div>
            <input type="range" min="30" max="100" value={density} className="density-slider" id="density-slider"
              aria-label="Network Density" style={{ '--val': density + '%' }} onChange={handleDensityChange} />
          </div>
        </div>

        <div id="control-buttons">
          <button id="change-formation-btn" className="control-button" onClick={handleMorphClick}><span>Morph</span></button>
          <button id="pause-play-btn" className="control-button" onClick={handleFreezeClick}><span>{isPaused ? 'Play' : 'Freeze'}</span></button>
          <button id="reset-camera-btn" className="control-button" onClick={handleResetClick}><span>Reset</span></button>
        </div>

        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
}

return { NeuralNetworkComponent };