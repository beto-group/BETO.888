
https://b_5bC187b2Ze4.v0.build/

<iframe allowfullscreen src="https://b_5bC187b2Ze4.v0.build/" width="100%" height="333" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />


## CODE :



```html
<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel="stylesheet">
  <style>
    html, body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }

    :root {
      --color-bg1: rgb(10, 20, 10);
      --color-bg2: rgb(20, 30, 20);
      --color1: 100, 150, 100;
      --color2: 90, 140, 90;
      --color3: 80, 130, 80;
      --color4: 70, 120, 70;
      --color5: 60, 110, 60;
      --color-interactive: 110, 160, 110;
      --circle-size: 200%;
      --blending: screen;
      --blur-amount: 20px;
      --noise-displacement: 20px;
      --opacity: 0.7;
      --stretch-x: 0.5;
      --stretch-y: 0.5;
      --rotation: 0deg;
      --movement-speed: 1.7;
      --edge-sharpness: 0.5;
      --fluidity: 0.5;
    }

    .controls {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      padding: 20px;
      border-radius: 12px;
      z-index: 1000;
      color: white;
      width: 300px;
      max-height: 90vh;
      overflow-y: auto;
      transition: transform 0.3s ease;
    }

    .controls.collapsed {
      transform: translateX(calc(100% - 40px));
    }

    .toggle-controls {
      position: absolute;
      left: -30px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.9);
      border: none;
      color: white;
      padding: 8px;
      cursor: pointer;
      border-radius: 4px 0 0 4px;
    }

    .control-group {
      margin-bottom: 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 15px;
    }

    .control-group h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      opacity: 0.9;
    }

    .control-item {
      margin-bottom: 8px;
    }

    .control-item label {
      display: block;
      font-size: 12px;
      margin-bottom: 4px;
      opacity: 0.7;
    }

    input[type="range"] {
      width: 100%;
      margin: 2px 0;
    }

    input[type="color"] {
      width: 100%;
      height: 30px;
      border: none;
      border-radius: 4px;
    }

    select {
      width: 100%;
      padding: 4px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }

    .gradient-bg {
      width: 100vw;
      height: 100vh;
      position: relative;
      overflow: hidden;
      background: radial-gradient(circle at center, var(--color-bg2), var(--color-bg1));
    }

    .gradients-container {
      width: 100%;
      height: 100%;
      filter: blur(var(--blur-amount));
    }

    .g-static, .g1, .g2, .g3, .g4, .g5 {
      position: absolute;
      width: var(--circle-size);
      height: var(--circle-size);
      mix-blend-mode: var(--blending);
      opacity: var(--opacity);
      filter: url(#noise);
      transform: scale(var(--stretch-x), var(--stretch-y)) rotate(var(--rotation));
      transition: all calc(1s * var(--fluidity)) ease-in-out;
    }

    .g-static {
      top: calc(50% - var(--circle-size) / 2);
      left: calc(50% - var(--circle-size) / 2);
      background: radial-gradient(
        circle at center,
        rgba(var(--color1), calc(0.8 + var(--edge-sharpness))) 0%,
        rgba(var(--color1), calc(0.5 + var(--edge-sharpness))) 40%,
        rgba(var(--color1), 0) 70%
      ) no-repeat;
    }

    .g1, .g2, .g3, .g4 {
      animation: fluidMovement calc(30s / var(--movement-speed)) infinite;
    }

    .g1 {
      background: radial-gradient(
        circle at center,
        rgba(var(--color2), calc(0.8 + var(--edge-sharpness))) 0%,
        rgba(var(--color2), calc(0.5 + var(--edge-sharpness))) 40%,
        rgba(var(--color2), 0) 70%
      ) no-repeat;
      animation-delay: 0s;
    }

    .g2 {
      background: radial-gradient(
        circle at center,
        rgba(var(--color3), calc(0.8 + var(--edge-sharpness))) 0%,
        rgba(var(--color3), calc(0.5 + var(--edge-sharpness))) 40%,
        rgba(var(--color3), 0) 70%
      ) no-repeat;
      animation-delay: -7.5s;
    }

    .g3 {
      background: radial-gradient(
        circle at center,
        rgba(var(--color4), calc(0.8 + var(--edge-sharpness))) 0%,
        rgba(var(--color4), calc(0.5 + var(--edge-sharpness))) 40%,
        rgba(var(--color4), 0) 70%
      ) no-repeat;
      animation-delay: -15s;
    }

    .g4 {
      background: radial-gradient(
        circle at center,
        rgba(var(--color5), calc(0.8 + var(--edge-sharpness))) 0%,
        rgba(var(--color5), calc(0.5 + var(--edge-sharpness))) 40%,
        rgba(var(--color5), 0) 70%
      ) no-repeat;
      animation-delay: -22.5s;
    }

    .interactive {
      position: absolute;
      background: radial-gradient(
        circle at center,
        rgba(var(--color-interactive), calc(0.8 + var(--edge-sharpness))) 0%,
        rgba(var(--color-interactive), calc(0.5 + var(--edge-sharpness))) 40%,
        rgba(var(--color-interactive), 0) 70%
      ) no-repeat;
      mix-blend-mode: var(--blending);
      width: 100%;
      height: 100%;
      top: -50%;
      left: -50%;
      opacity: var(--opacity);
      transform: scale(var(--stretch-x), var(--stretch-y)) rotate(var(--rotation));
      transition: transform calc(0.5s * var(--fluidity)) cubic-bezier(0.23, 1, 0.32, 1);
    }

    @keyframes fluidMovement {
      0%, 100% { 
        transform: translate(-50%, -50%) scale(var(--stretch-x), var(--stretch-y));
      }
      25% { 
        transform: translate(50%, -50%) scale(calc(var(--stretch-x) * 1.2), calc(var(--stretch-y) * 0.8));
      }
      50% { 
        transform: translate(50%, 50%) scale(var(--stretch-x), var(--stretch-y));
      }
      75% { 
        transform: translate(-50%, 50%) scale(calc(var(--stretch-x) * 0.8), calc(var(--stretch-y) * 1.2));
      }
    }
  </style>
</head>
<body>
  <div class="controls">
    <button class="toggle-controls">☰</button>
    <div class="control-group">
      <h3>Background Colors</h3>
      <div class="control-item">
        <label>Background Color 1</label>
        <input type="color" id="bgColor1" value="#0a140a">
      </div>
      <div class="control-item">
        <label>Background Color 2</label>
        <input type="color" id="bgColor2" value="#141e14">
      </div>
    </div>

    <div class="control-group">
      <h3>Blob Colors</h3>
      <div class="control-item">
        <label>Blob 1 (Static)</label>
        <input type="color" id="color1" value="#649664">
      </div>
      <div class="control-item">
        <label>Blob 2</label>
        <input type="color" id="color2" value="#5a8c5a">
      </div>
      <div class="control-item">
        <label>Blob 3</label>
        <input type="color" id="color3" value="#508250">
      </div>
      <div class="control-item">
        <label>Blob 4</label>
        <input type="color" id="color4" value="#467846">
      </div>
      <div class="control-item">
        <label>Blob 5</label>
        <input type="color" id="color5" value="#3c6e3c">
      </div>
      <div class="control-item">
        <label>Interactive Blob</label>
        <input type="color" id="colorInteractive" value="#6ea06e">
      </div>
    </div>

    <div class="control-group">
      <h3>Shape Controls</h3>
      <div class="control-item">
        <label>Horizontal Stretch: <span id="stretchXValue">0.5</span></label>
        <input type="range" id="stretchX" min="0.1" max="3" step="0.1" value="0.5">
      </div>
      <div class="control-item">
        <label>Vertical Stretch: <span id="stretchYValue">0.5</span></label>
        <input type="range" id="stretchY" min="0.1" max="3" step="0.1" value="0.5">
      </div>
      <div class="control-item">
        <label>Rotation: <span id="rotationValue">0°</span></label>
        <input type="range" id="rotation" min="0" max="360" value="0">
      </div>
    </div>

    <div class="control-group">
      <h3>Motion Controls</h3>
      <div class="control-item">
        <label>Movement Speed: <span id="speedValue">1.7x</span></label>
        <input type="range" id="movementSpeed" min="0.1" max="3" step="0.1" value="1.7">
      </div>
      <div class="control-item">
        <label>Fluidity: <span id="fluidityValue">0.5</span></label>
        <input type="range" id="fluidity" min="0.1" max="1" step="0.1" value="0.5">
      </div>
    </div>

    <div class="control-group">
      <h3>Effects</h3>
      <div class="control-item">
        <label>Blend Mode</label>
        <select id="blendMode">
          <option value="screen" selected>Screen</option>
          <option value="soft-light">Soft Light</option>
          <option value="hard-light">Hard Light</option>
          <option value="multiply">Multiply</option>
          <option value="overlay">Overlay</option>
        </select>
      </div>
      <div class="control-item">
        <label>Blur Amount: <span id="blurValue">20px</span></label>
        <input type="range" id="blurAmount" min="0" max="100" value="20">
      </div>
      <div class="control-item">
        <label>Opacity: <span id="opacityValue">0.7</span></label>
        <input type="range" id="opacity" min="0" max="100" value="70">
      </div>
      <div class="control-item">
        <label>Size: <span id="sizeValue">200%</span></label>
        <input type="range" id="blobSize" min="50" max="400" value="200">
      </div>
      <div class="control-item">
        <label>Noise Displacement: <span id="noiseValue">20px</span></label>
        <input type="range" id="noiseDisplacement" min="0" max="50" value="20">
      </div>
      <div class="control-item">
        <label>Edge Sharpness: <span id="edgeSharpnessValue">0.5</span></label>
        <input type="range" id="edgeSharpness" min="0" max="1" step="0.1" value="0.5">
      </div>
    </div>
  </div>

  <div class="gradient-bg">
    <div class="gradients-container">
      <div class="g-static"></div>
      <div class="g1"></div>
      <div class="g2"></div>
      <div class="g3"></div>
      <div class="g4"></div>
      <div class="interactive"></div>
    </div>
  </div>

  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style="display: none;">
    <defs>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
        <feDisplacementMap  in="SourceGraphic" scale="var(--noise-displacement)"/>
      </filter>
    </defs>
  </svg>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Toggle controls
      const controls = document.querySelector('.controls');
      const toggleButton  = document.querySelector('.toggle-controls');
      
      toggleButton.addEventListener('click', () => {
        controls.classList.toggle('collapsed');
      });

      // Interactive blob movement
      const interBubble = document.querySelector('.interactive');
      let curX = 0;
      let curY = 0;
      let tgX = 0;
      let tgY = 0;

      function move() {
        curX += (tgX - curX) / 20;
        curY += (tgY - curY) / 20;
        interBubble.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px) scale(var(--stretch-x), var(--stretch-y)) rotate(var(--rotation))`;
        requestAnimationFrame(move);
      }

      window.addEventListener('mousemove', (event) => {
        tgX = event.clientX;
        tgY = event.clientY;
      });

      move();

      // Control handlers
      function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
          `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
          null;
      }

      // Background colors
      document.getElementById('bgColor1').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--color-bg1', e.target.value);
      });

      document.getElementById('bgColor2').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--color-bg2', e.target.value);
      });

      // Blob colors
      ['color1', 'color2', 'color3', 'color4', 'color5', 'colorInteractive'].forEach((id, index) => {
        document.getElementById(id).addEventListener('input', (e) => {
          document.documentElement.style.setProperty(`--color${index + 1}`, hexToRgb(e.target.value));
        });
      });

      // Shape controls
      document.getElementById('stretchX').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--stretch-x', e.target.value);
        document.getElementById('stretchXValue').textContent = e.target.value;
      });

      document.getElementById('stretchY').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--stretch-y', e.target.value);
        document.getElementById('stretchYValue').textContent = e.target.value;
      });

      document.getElementById('rotation').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--rotation', `${e.target.value}deg`);
        document.getElementById('rotationValue').textContent = `${e.target.value}°`;
      });

      // Motion controls
      document.getElementById('movementSpeed').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--movement-speed', e.target.value);
        document.getElementById('speedValue').textContent = `${e.target.value}x`;
      });

      document.getElementById('fluidity').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--fluidity', e.target.value);
        document.getElementById('fluidityValue').textContent = e.target.value;
      });

      // Effects
      document.getElementById('blendMode').addEventListener('change', (e) => {
        document.documentElement.style.setProperty('--blending', e.target.value);
      });

      document.getElementById('blurAmount').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--blur-amount', `${e.target.value}px`);
        document.getElementById('blurValue').textContent = `${e.target.value}px`;
      });

      document.getElementById('opacity').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--opacity', e.target.value / 100);
        document.getElementById('opacityValue').textContent = e.target.value / 100;
      });

      document.getElementById('blobSize').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--circle-size', `${e.target.value}%`);
        document.getElementById('sizeValue').textContent = `${e.target.value}%`;
      });

      document.getElementById('noiseDisplacement').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--noise-displacement', `${e.target.value}px`);
        document.getElementById('noiseValue').textContent = `${e.target.value}px`;
      });

      document.getElementById('edgeSharpness').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--edge-sharpness', e.target.value);
        document.getElementById('edgeSharpnessValue').textContent = e.target.value;
      });
    });
  </script>
</body>
</html>
```

