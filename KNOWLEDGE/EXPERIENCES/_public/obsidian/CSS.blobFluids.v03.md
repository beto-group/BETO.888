

https://claude.site/artifacts/e4a0d078-7371-4920-999e-079dc23f86f3

<iframe allowfullscreen src="https://claude.site/artifacts/e4a0d078-7371-4920-999e-079dc23f86f3" width="100%" height="666" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />



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
      --color-bg1: rgb(108, 0, 162);
      --color-bg2: rgb(0, 17, 82);
      --color1: 18, 113, 255;
      --color2: 221, 74, 255;
      --color3: 100, 220, 255;
      --color4: 200, 50, 50;
      --color5: 180, 180, 50;
      --color-interactive: 140, 100, 255;
      --circle-size: 120%;
      --blending: hard-light;
      --blur-amount: 40px;
      --noise-displacement: 0px;
      --opacity: 0.8;
    }

    .controls {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      padding: 20px;
      border-radius: 12px;
      z-index: 1000;
      color: white;
      width: 300px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .control-group {
      margin-bottom: 15px;
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
      background: linear-gradient(40deg, var(--color-bg1), var(--color-bg2));
    }

    .gradients-container {
      width: 100%;
      height: 100%;
      filter: blur(var(--blur-amount));
    }

    .g1, .g2, .g3, .g4, .g5 {
      position: absolute;
      width: var(--circle-size);
      height: var(--circle-size);
      top: calc(50% - var(--circle-size) / 2);
      left: calc(50% - var(--circle-size) / 2);
      mix-blend-mode: var(--blending);
      opacity: var(--opacity);
      filter: url(#noise);
    }

    .g1 {
      background: radial-gradient(circle at center, rgba(var(--color1), 0.8) 0, rgba(var(--color1), 0) 50%) no-repeat;
      animation: moveVertical 30s ease infinite;
    }

    .g2 {
      background: radial-gradient(circle at center, rgba(var(--color2), 0.8) 0, rgba(var(--color2), 0) 50%) no-repeat;
      transform-origin: calc(50% - 400px);
      animation: moveInCircle 20s reverse infinite;
    }

    .g3 {
      background: radial-gradient(circle at center, rgba(var(--color3), 0.8) 0, rgba(var(--color3), 0) 50%) no-repeat;
      transform-origin: calc(50% + 400px);
      top: calc(50% - var(--circle-size) / 2 + 200px);
      left: calc(50% - var(--circle-size) / 2 - 500px);
      animation: moveInCircle 40s linear infinite;
    }

    .g4 {
      background: radial-gradient(circle at center, rgba(var(--color4), 0.8) 0, rgba(var(--color4), 0) 50%) no-repeat;
      transform-origin: calc(50% - 200px);
      animation: moveHorizontal 40s ease infinite;
    }

    .g5 {
      background: radial-gradient(circle at center, rgba(var(--color5), 0.8) 0, rgba(var(--color5), 0) 50%) no-repeat;
      width: calc(var(--circle-size) * 1.5);
      height: calc(var(--circle-size) * 1.5);
      top: calc(50% - var(--circle-size));
      left: calc(50% - var(--circle-size));
      transform-origin: calc(50% - 800px) calc(50% + 200px);
      animation: moveInCircle 20s ease infinite;
    }

    .interactive {
      position: absolute;
      background: radial-gradient(circle at center, rgba(var(--color-interactive), 0.8) 0, rgba(var(--color-interactive), 0) 50%) no-repeat;
      mix-blend-mode: var(--blending);
      width: 100%;
      height: 100%;
      top: -50%;
      left: -50%;
      opacity: var(--opacity);
    }

    @keyframes moveInCircle {
      0% { transform: rotate(0deg); }
      50% { transform: rotate(180deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes moveVertical {
      0% { transform: translateY(-50%); }
      50% { transform: translateY(50%); }
      100% { transform: translateY(-50%); }
    }

    @keyframes moveHorizontal {
      0% { transform: translateX(-50%) translateY(-10%); }
      50% { transform: translateX(50%) translateY(10%); }
      100% { transform: translateX(-50%) translateY(-10%); }
    }
  </style>
</head>
<body>
  <div class="controls">
    <div class="control-group">
      <h3>Background Colors</h3>
      <div class="control-item">
        <label>Background Color 1</label>
        <input type="color" id="bgColor1" value="#6c00a2">
      </div>
      <div class="control-item">
        <label>Background Color 2</label>
        <input type="color" id="bgColor2" value="#001152">
      </div>
    </div>

    <div class="control-group">
      <h3>Blob Colors</h3>
      <div class="control-item">
        <label>Blob 1</label>
        <input type="color" id="color1" value="#1271ff">
      </div>
      <div class="control-item">
        <label>Blob 2</label>
        <input type="color" id="color2" value="#dd4aff">
      </div>
      <div class="control-item">
        <label>Blob 3</label>
        <input type="color" id="color3" value="#64dcff">
      </div>
      <div class="control-item">
        <label>Blob 4</label>
        <input type="color" id="color4" value="#c83232">
      </div>
      <div class="control-item">
        <label>Blob 5</label>
        <input type="color" id="color5" value="#b4b432">
      </div>
      <div class="control-item">
        <label>Interactive Blob</label>
        <input type="color" id="colorInteractive" value="#8c64ff">
      </div>
    </div>

    <div class="control-group">
      <h3>Effects</h3>
      <div class="control-item">
        <label>Blend Mode</label>
        <select id="blendMode">
          <option value="hard-light">Hard Light</option>
          <option value="soft-light">Soft Light</option>
          <option value="multiply">Multiply</option>
          <option value="screen">Screen</option>
          <option value="overlay">Overlay</option>
        </select>
      </div>
      <div class="control-item">
        <label>Blur Amount: <span id="blurValue">40px</span></label>
        <input type="range" id="blurAmount" min="0" max="100" value="40">
      </div>
      <div class="control-item">
        <label>Opacity: <span id="opacityValue">0.8</span></label>
        <input type="range" id="opacity" min="0" max="100" value="80">
      </div>
      <div class="control-item">
        <label>Blob Size: <span id="sizeValue">120%</span></label>
        <input type="range" id="blobSize" min="50" max="200" value="120">
      </div>
    </div>
  </div>

  <div class="gradient-bg">
    <div class="gradients-container">
      <div class="g1"></div>
      <div class="g2"></div>
      <div class="g3"></div>
      <div class="g4"></div>
      <div class="g5"></div>
      <div class="interactive"></div>
    </div>
  </div>

  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style="display: none;">
    <defs>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
        <feDisplacementMap in="SourceGraphic" scale="var(--noise-displacement)"/>
      </filter>
    </defs>
  </svg>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Interactive blob movement
      const interBubble = document.querySelector('.interactive');
      let curX = 0;
      let curY = 0;
      let tgX = 0;
      let tgY = 0;

      function move() {
        curX += (tgX - curX) / 20;
        curY += (tgY - curY) / 20;
        interBubble.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
        requestAnimationFrame(() => {
          move();
        });
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
      ['1', '2', '3', '4', '5', 'Interactive'].forEach(num => {
        document.getElementById(`color${num}`).addEventListener('input', (e) => {
          const rgb = hexToRgb(e.target.value);
          document.documentElement.style.setProperty(`--color${num.toLowerCase()}`, rgb);
        });
      });

      // Blend mode
      document.getElementById('blendMode').addEventListener('change', (e) => {
        document.documentElement.style.setProperty('--blending', e.target.value);
      });

      // Blur amount
      document.getElementById('blurAmount').addEventListener('input', (e) => {
        const value = `${e.target.value}px`;
        document.getElementById('blurValue').textContent = value;
        document.documentElement.style.setProperty('--blur-amount', value);
      });

      // Opacity
      document.getElementById('opacity').addEventListener('input', (e) => {
        const value = e.target.value / 100;
        document.getElementById('opacityValue').textContent = value.toFixed(2);
        document.documentElement.style.setProperty('--opacity', value);
      });

      // Blob size
      document.getElementById('blobSize').addEventListener('input', (e) => {
        const value = `${e.target.value}%`;
        document.getElementById('sizeValue').textContent = value;
        document.documentElement.style.setProperty('--circle-size', value);
      });
    });
  </script>
</body>
</html>
```