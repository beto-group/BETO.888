function ScannerComponent(props) {
  const { dc, loadScript, isFullTab, isInception, onToggleFullTab } = props;
  const { useState, useEffect, useRef } = dc;

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [speedLabel, setSpeedLabel] = useState("120");
  const [isPlaying, setIsPlaying] = useState(true);

  const streamContainerRef = useRef(null);
  const cardLineRef = useRef(null);
  const particleCanvasRef = useRef(null);
  const scannerCanvasRef = useRef(null);

  // --- References to the three logic modules ---
  const controllersRef = useRef({
    cardStream: null,
    particleSystem: null,
    particleScanner: null,
    THREE: null
  }).current;

  /**
   * MODULE 1: ASCII Generation
   */
  const generateCode = (width, height) => {
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pick = (arr) => arr[randInt(0, arr.length - 1)];

    const header = [
      "// compiled preview • scanner demo",
      "/* generated for visual effect – not executed */",
      "const SCAN_WIDTH = 8;",
      "const FADE_ZONE = 35;",
      "const MAX_PARTICLES = 2500;",
      "const TRANSITION = 0.05;",
    ];

    const helpers = [
      "function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }",
      "function lerp(a, b, t) { return a + (b - a) * t; }",
      "const now = () => performance.now();",
      "function rng(min, max) { return Math.random() * (max - min) + min; }",
    ];

    const particleBlock = (idx) => [
      `class Particle${idx} {`,
      "  constructor(x, y, vx, vy, r, a) {",
      "    this.x = x; this.y = y;",
      "    this.vx = vx; this.vy = vy;",
      "    this.r = r; this.a = a;",
      "  }",
      "  step(dt) { this.x += this.vx * dt; this.y += this.vy * dt; }",
      "}",
    ];

    const scannerBlock = [
      "const scanner = {",
      "  x: Math.floor(window.innerWidth / 2),",
      "  width: SCAN_WIDTH,",
      "  glow: 3.5,",
      "};",
      "",
      "function drawParticle(ctx, p) {",
      "  ctx.globalAlpha = clamp(p.a, 0, 1);",
      "  ctx.drawImage(gradient, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);",
      "}",
    ];

    const loopBlock = [
      "function tick(t) {",
      "  // requestAnimationFrame(tick);",
      "  const dt = 0.016;",
      "  // update & render",
      "}",
    ];

    const misc = [
      "const state = { intensity: 1.2, particles: MAX_PARTICLES };",
      "const bounds = { w: window.innerWidth, h: 300 };",
      "const gradient = document.createElement('canvas');",
      "const ctx = gradient.getContext('2d');",
      "ctx.globalCompositeOperation = 'lighter';",
      "// ascii overlay is masked with a 3-phase gradient",
    ];

    const library = [];
    header.forEach((l) => library.push(l));
    helpers.forEach((l) => library.push(l));
    for (let b = 0; b < 3; b++) particleBlock(b).forEach((l) => library.push(l));
    scannerBlock.forEach((l) => library.push(l));
    loopBlock.forEach((l) => library.push(l));
    misc.forEach((l) => library.push(l));

    for (let i = 0; i < 40; i++) {
      const n1 = randInt(1, 9);
      const n2 = randInt(10, 99);
      library.push(`const v${i} = (${n1} + ${n2}) * 0.${randInt(1, 9)};`);
    }
    for (let i = 0; i < 20; i++) {
      library.push(`if (state.intensity > ${1 + (i % 3)}) { scanner.glow += 0.01; }`);
    }

    let flow = library.join(" ").replace(/\s+/g, " ").trim();
    const totalChars = width * height;
    while (flow.length < totalChars + width) {
      const extra = pick(library).replace(/\s+/g, " ").trim();
      flow += " " + extra;
    }

    let out = "";
    let offset = 0;
    for (let row = 0; row < height; row++) {
      let line = flow.slice(offset, offset + width);
      if (line.length < width) line = line + " ".repeat(width - line.length);
      out += line + (row < height - 1 ? "\n" : "");
      offset += width;
    }
    return out;
  };

  const calculateCodeDimensions = (cardWidth, cardHeight) => {
    const fontSize = 11;
    const lineHeight = 13;
    const charWidth = 6;
    const width = Math.floor(cardWidth / charWidth);
    const height = Math.floor(cardHeight / lineHeight);
    return { width, height, fontSize, lineHeight };
  };

  /**
   * MODULE 2: Card Stream Controller Port
   */
  class CardStreamController {
    constructor(container, cardLine, updateSpeedLabel) {
      this.container = container;
      this.cardLine = cardLine;
      this.updateSpeedLabel = updateSpeedLabel;

      this.position = 0;
      this.velocity = 120;
      this.direction = -1;
      this.isAnimating = true;
      this.isDragging = false;
      this.active = true;

      this.lastTime = 0;
      this.lastMouseX = 0;
      this.mouseVelocity = 0;
      this.friction = 0.95;
      this.minVelocity = 30;

      this.containerWidth = 0;
      this.cardLineWidth = 0;

      // Binders for unmount
      this.onDragBound = this.onDrag.bind(this);
      this.endDragBound = this.endDrag.bind(this);
      this.onResizeBound = this.calculateDimensions.bind(this);
    }

    init() {
      this.populateCardLine();
      this.calculateDimensions();
      this.setupEventListeners();
      this.updateCardPosition();
      this.lastTime = performance.now();
      this.animate();
      this.periodicIntervalId = setInterval(() => { if (this.active) this.updateAsciiContent() }, 200);
      this.updateClippingLoop();
    }

    destroy() {
      this.active = false;
      if (this.periodicIntervalId) clearInterval(this.periodicIntervalId);
      document.removeEventListener("mousemove", this.onDragBound);
      document.removeEventListener("mouseup", this.endDragBound);
      document.removeEventListener("touchmove", this.onDragBound);
      document.removeEventListener("touchend", this.endDragBound);
      window.removeEventListener("resize", this.onResizeBound);
    }

    calculateDimensions() {
      if (!this.container) return;
      this.containerWidth = this.container.offsetWidth || window.innerWidth;
      const cardWidth = 400;
      const cardGap = 60;
      const cardCount = this.cardLine.children.length;
      this.cardLineWidth = (cardWidth + cardGap) * cardCount;
    }

    setupEventListeners() {
      this.cardLine.addEventListener("mousedown", (e) => this.startDrag(e));
      document.addEventListener("mousemove", this.onDragBound);
      document.addEventListener("mouseup", this.endDragBound);

      this.cardLine.addEventListener("touchstart", (e) => this.startDrag(e.touches[0]), { passive: false });
      document.addEventListener("touchmove", this.onDragBound, { passive: false });
      document.addEventListener("touchend", this.endDragBound);

      this.cardLine.addEventListener("wheel", (e) => this.onWheel(e), { passive: false });
      this.cardLine.addEventListener("selectstart", (e) => e.preventDefault());
      this.cardLine.addEventListener("dragstart", (e) => e.preventDefault());
      window.addEventListener("resize", this.onResizeBound);
    }

    startDrag(e) {
      e.preventDefault();
      this.isDragging = true;
      this.isAnimating = false;
      this.lastMouseX = e.clientX;
      this.mouseVelocity = 0;

      const transform = window.getComputedStyle(this.cardLine).transform;
      if (transform !== "none") {
        const matrix = new DOMMatrix(transform);
        this.position = matrix.m41;
      }

      this.cardLine.style.animation = "none";
      this.cardLine.classList.add("dragging");
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    }

    onDrag(e) {
      if (!this.isDragging || !this.active) return;
      e.preventDefault();
      const deltaX = e.clientX - this.lastMouseX;
      this.position += deltaX;
      this.mouseVelocity = deltaX * 60;
      this.lastMouseX = e.clientX;

      this.cardLine.style.transform = `translateX(${this.position}px)`;
      this.updateCardClipping();
    }

    endDrag() {
      if (!this.isDragging || !this.active) return;
      this.isDragging = false;
      this.cardLine.classList.remove("dragging");

      if (Math.abs(this.mouseVelocity) > this.minVelocity) {
        this.velocity = Math.abs(this.mouseVelocity);
        this.direction = this.mouseVelocity > 0 ? 1 : -1;
      } else {
        this.velocity = 120;
      }

      this.isAnimating = true;
      this.updateSpeedIndicator();
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    animate() {
      if (!this.active) return;
      const currentTime = performance.now();
      const deltaTime = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      if (this.isAnimating && !this.isDragging) {
        if (this.velocity > this.minVelocity) {
          this.velocity *= this.friction;
        } else {
          this.velocity = Math.max(this.minVelocity, this.velocity);
        }

        this.position += this.velocity * this.direction * deltaTime;
        this.updateCardPosition();
        this.updateSpeedIndicator();
      }
      requestAnimationFrame(() => this.animate());
    }

    updateCardPosition() {
      if (!this.active) return;
      const containerWidth = this.containerWidth;
      const cardLineWidth = this.cardLineWidth;

      if (this.position < -cardLineWidth) {
        this.position = containerWidth;
      } else if (this.position > containerWidth) {
        this.position = -cardLineWidth;
      }

      this.cardLine.style.transform = `translateX(${this.position}px)`;
      this.updateCardClipping();
    }

    updateSpeedIndicator() {
      const rawSpeed = Math.round(this.velocity);
      this.updateSpeedLabel(rawSpeed);
    }

    toggleAnimation(externalPlayState) {
      this.isAnimating = externalPlayState;
      if (this.isAnimating) {
        this.cardLine.style.animation = "none";
      }
    }

    resetPosition() {
      this.position = this.containerWidth;
      this.velocity = 120;
      this.direction = -1;
      this.isAnimating = true;
      this.isDragging = false;

      this.cardLine.style.animation = "none";
      this.cardLine.style.transform = `translateX(${this.position}px)`;
      this.cardLine.classList.remove("dragging");
      this.updateSpeedIndicator();
    }

    changeDirection() {
      this.direction *= -1;
      this.updateSpeedIndicator();
    }

    onWheel(e) {
      if (!this.active) return;
      e.preventDefault();
      const scrollSpeed = 20;
      const delta = e.deltaY > 0 ? scrollSpeed : -scrollSpeed;
      this.position += delta;
      this.updateCardPosition();
      this.updateCardClipping();
    }

    createCardWrapper(index) {
      const wrapper = document.createElement("div");
      wrapper.className = "cardscanner-card-wrapper";

      const normalCard = document.createElement("div");
      normalCard.className = "cardscanner-card cardscanner-card-normal";

      const cardImages = [
        "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=400&h=250&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=400&h=250&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=400&h=250&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&h=250&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&h=250&auto=format&fit=crop",
      ];

      const cardImage = document.createElement("img");
      cardImage.className = "cardscanner-card-image";
      cardImage.src = cardImages[index % cardImages.length];
      cardImage.alt = "Credit Card";
      normalCard.appendChild(cardImage);

      const asciiCard = document.createElement("div");
      asciiCard.className = "cardscanner-card cardscanner-card-ascii";

      const asciiContent = document.createElement("div");
      asciiContent.className = "cardscanner-ascii-content";

      const { width, height, fontSize, lineHeight } = calculateCodeDimensions(400, 250);
      asciiContent.style.fontSize = fontSize + "px";
      asciiContent.style.lineHeight = lineHeight + "px";
      asciiContent.textContent = generateCode(width, height);

      asciiCard.appendChild(asciiContent);
      wrapper.appendChild(normalCard);
      wrapper.appendChild(asciiCard);

      return wrapper;
    }

    updateCardClipping() {
      if (!this.active) return;

      // Get boundaries from the actual parent frame rather than global window, to support Datacore sizing natively
      const containerBounds = this.container.getBoundingClientRect();

      const scannerX = containerBounds.width / 2;
      const scannerWidth = 8;
      const scannerLeft = scannerX - scannerWidth / 2;
      const scannerRight = scannerX + scannerWidth / 2;
      let anyScanningActive = false;

      this.cardLine.querySelectorAll(".cardscanner-card-wrapper").forEach((wrapper) => {
        const rect = wrapper.getBoundingClientRect();

        // Map rect properties relative to container
        const cardLeft = rect.left - containerBounds.left;
        const cardRight = rect.right - containerBounds.left;
        const cardWidth = rect.width;

        const normalCard = wrapper.querySelector(".cardscanner-card-normal");
        const asciiCard = wrapper.querySelector(".cardscanner-card-ascii");

        if (cardLeft < scannerRight && cardRight > scannerLeft) {
          anyScanningActive = true;
          const scannerIntersectLeft = Math.max(scannerLeft - cardLeft, 0);
          const scannerIntersectRight = Math.min(scannerRight - cardLeft, cardWidth);

          const normalClipRight = (scannerIntersectLeft / cardWidth) * 100;
          const asciiClipLeft = (scannerIntersectRight / cardWidth) * 100;

          normalCard.style.setProperty("--clip-right", `${normalClipRight}%`);
          asciiCard.style.setProperty("--clip-left", `${asciiClipLeft}%`);

          if (!wrapper.hasAttribute("data-scanned") && scannerIntersectLeft > 0) {
            wrapper.setAttribute("data-scanned", "true");
            const scanEffect = document.createElement("div");
            scanEffect.className = "cardscanner-scan-effect";
            wrapper.appendChild(scanEffect);
            setTimeout(() => { if (scanEffect.parentNode) scanEffect.parentNode.removeChild(scanEffect); }, 600);
          }
        } else {
          if (cardRight < scannerLeft) {
            normalCard.style.setProperty("--clip-right", "100%");
            asciiCard.style.setProperty("--clip-left", "100%");
          } else if (cardLeft > scannerRight) {
            normalCard.style.setProperty("--clip-right", "0%");
            asciiCard.style.setProperty("--clip-left", "0%");
          }
          wrapper.removeAttribute("data-scanned");
        }
      });

      if (controllersRef.particleScanner) {
        controllersRef.particleScanner.setScanningActive(anyScanningActive);
      }
    }

    updateClippingLoop() {
      if (!this.active) return;
      this.updateCardClipping();
      requestAnimationFrame(() => this.updateClippingLoop());
    }

    updateAsciiContent() {
      if (!this.cardLine || !this.active) return;
      this.cardLine.querySelectorAll(".cardscanner-ascii-content").forEach((content) => {
        if (Math.random() < 0.15) {
          const { width, height } = calculateCodeDimensions(400, 250);
          content.textContent = generateCode(width, height);
        }
      });
    }

    populateCardLine() {
      this.cardLine.innerHTML = "";
      const cardsCount = 30;
      for (let i = 0; i < cardsCount; i++) {
        const cardWrapper = this.createCardWrapper(i);
        this.cardLine.appendChild(cardWrapper);
      }
    }
  }


  /**
   * MODULE 3: Canvas Particle Scanner Port
   */
  class ParticleScanner {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = this.canvas.getContext("2d");
      this.animationId = null;
      this.active = true;

      const rect = this.canvas.getBoundingClientRect();
      this.w = rect.width;
      this.h = rect.height; // Expected 300px
      this.particles = [];
      this.count = 0;
      this.maxParticles = 800;
      this.intensity = 0.8;
      this.lightBarX = this.w / 2;
      this.lightBarWidth = 3;
      this.fadeZone = 60;

      this.scanTargetIntensity = 1.8;
      this.scanTargetParticles = 2500;
      this.scanTargetFadeZone = 35;

      this.scanningActive = false;

      this.baseIntensity = this.intensity;
      this.baseMaxParticles = this.maxParticles;
      this.baseFadeZone = this.fadeZone;

      this.currentIntensity = this.intensity;
      this.currentMaxParticles = this.maxParticles;
      this.currentFadeZone = this.fadeZone;
      this.transitionSpeed = 0.05;

      this.onResizeBound = this.onResize.bind(this);
      window.addEventListener("resize", this.onResizeBound);

      this.setupCanvas();
      this.createGradientCache();
      this.initParticles();
      this.animate();
    }

    setupCanvas() {
      if (!this.canvas) return;
      const parent = this.canvas.parentElement;
      this.w = parent.offsetWidth;
      this.h = 300;
      this.canvas.width = this.w;
      this.canvas.height = this.h;
      this.ctx.clearRect(0, 0, this.w, this.h);
    }

    onResize() {
      if (!this.active) return;
      const parent = this.canvas.parentElement;
      this.w = parent.offsetWidth;
      this.lightBarX = this.w / 2;
      this.setupCanvas();
    }

    createGradientCache() {
      this.gradientCanvas = document.createElement("canvas");
      this.gradientCtx = this.gradientCanvas.getContext("2d");
      this.gradientCanvas.width = 16;
      this.gradientCanvas.height = 16;
      const half = this.gradientCanvas.width / 2;
      const gradient = this.gradientCtx.createRadialGradient(half, half, 0, half, half, half);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.3, "rgba(196, 181, 253, 0.8)");
      gradient.addColorStop(0.7, "rgba(139, 92, 246, 0.4)");
      gradient.addColorStop(1, "transparent");
      this.gradientCtx.fillStyle = gradient;
      this.gradientCtx.beginPath();
      this.gradientCtx.arc(half, half, half, 0, Math.PI * 2);
      this.gradientCtx.fill();
    }

    randomFloat(min, max) { return Math.random() * (max - min) + min; }

    createParticle() {
      const intensityRatio = this.intensity / this.baseIntensity;
      const MathPI = Math.PI;
      const speedMultiplier = 1 + (intensityRatio - 1) * 1.2;
      const sizeMultiplier = 1 + (intensityRatio - 1) * 0.7;

      return {
        x: this.lightBarX + this.randomFloat(-this.lightBarWidth / 2, this.lightBarWidth / 2),
        y: this.randomFloat(0, this.h),
        vx: this.randomFloat(0.2, 1.0) * speedMultiplier,
        vy: this.randomFloat(-0.15, 0.15) * speedMultiplier,
        radius: this.randomFloat(0.4, 1) * sizeMultiplier,
        alpha: this.randomFloat(0.6, 1),
        decay: this.randomFloat(0.005, 0.025) * (2 - intensityRatio * 0.5),
        originalAlpha: 0,
        life: 1.0,
        time: 0,
        startX: 0,
        twinkleSpeed: this.randomFloat(0.02, 0.08) * speedMultiplier,
        twinkleAmount: this.randomFloat(0.1, 0.25),
      };
    }

    initParticles() {
      for (let i = 0; i < this.maxParticles; i++) {
        const particle = this.createParticle();
        particle.originalAlpha = particle.alpha;
        particle.startX = particle.x;
        this.count++;
        this.particles[this.count] = particle;
      }
    }

    updateParticle(particle) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.time++;
      particle.alpha = particle.originalAlpha * particle.life + Math.sin(particle.time * particle.twinkleSpeed) * particle.twinkleAmount;
      particle.life -= particle.decay;
      if (particle.x > this.w + 10 || particle.life <= 0) {
        this.resetParticle(particle);
      }
    }

    resetParticle(particle) {
      particle.x = this.lightBarX + this.randomFloat(-this.lightBarWidth / 2, this.lightBarWidth / 2);
      particle.y = this.randomFloat(0, this.h);
      particle.vx = this.randomFloat(0.2, 1.0);
      particle.vy = this.randomFloat(-0.15, 0.15);
      particle.alpha = this.randomFloat(0.6, 1);
      particle.originalAlpha = particle.alpha;
      particle.life = 1.0;
      particle.time = 0;
      particle.startX = particle.x;
    }

    drawParticle(particle) {
      if (particle.life <= 0) return;
      let fadeAlpha = 1;
      if (particle.y < this.fadeZone) {
        fadeAlpha = particle.y / this.fadeZone;
      } else if (particle.y > this.h - this.fadeZone) {
        fadeAlpha = (this.h - particle.y) / this.fadeZone;
      }
      fadeAlpha = Math.max(0, Math.min(1, fadeAlpha));
      this.ctx.globalAlpha = particle.alpha * fadeAlpha;
      this.ctx.drawImage(this.gradientCanvas, particle.x - particle.radius, particle.y - particle.radius, particle.radius * 2, particle.radius * 2);
    }

    drawLightBar() {
      const verticalGradient = this.ctx.createLinearGradient(0, 0, 0, this.h);
      verticalGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
      verticalGradient.addColorStop(this.fadeZone / this.h, "rgba(255, 255, 255, 1)");
      verticalGradient.addColorStop(1 - this.fadeZone / this.h, "rgba(255, 255, 255, 1)");
      verticalGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      this.ctx.globalCompositeOperation = "lighter";
      const targetGlowIntensity = this.scanningActive ? 3.5 : 1;
      if (!this.currentGlowIntensity) this.currentGlowIntensity = 1;

      this.currentGlowIntensity += (targetGlowIntensity - this.currentGlowIntensity) * this.transitionSpeed;

      const glowIntensity = this.currentGlowIntensity;
      const lineWidth = this.lightBarWidth;
      const glow1Alpha = this.scanningActive ? 1.0 : 0.8;
      const glow2Alpha = this.scanningActive ? 0.8 : 0.6;
      const glow3Alpha = this.scanningActive ? 0.6 : 0.4;

      const coreGradient = this.ctx.createLinearGradient(this.lightBarX - lineWidth / 2, 0, this.lightBarX + lineWidth / 2, 0);
      coreGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
      coreGradient.addColorStop(0.3, `rgba(255, 255, 255, ${0.9 * glowIntensity})`);
      coreGradient.addColorStop(0.5, `rgba(255, 255, 255, ${1 * glowIntensity})`);
      coreGradient.addColorStop(0.7, `rgba(255, 255, 255, ${0.9 * glowIntensity})`);
      coreGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      this.ctx.globalAlpha = 1;
      this.ctx.fillStyle = coreGradient;

      const radius = 15;
      this.ctx.beginPath();
      this.ctx.roundRect(this.lightBarX - lineWidth / 2, 0, lineWidth, this.h, radius);
      this.ctx.fill();

      const glow1Gradient = this.ctx.createLinearGradient(this.lightBarX - lineWidth * 2, 0, this.lightBarX + lineWidth * 2, 0);
      glow1Gradient.addColorStop(0, "rgba(139, 92, 246, 0)");
      glow1Gradient.addColorStop(0.5, `rgba(196, 181, 253, ${0.8 * glowIntensity})`);
      glow1Gradient.addColorStop(1, "rgba(139, 92, 246, 0)");

      this.ctx.globalAlpha = glow1Alpha;
      this.ctx.fillStyle = glow1Gradient;
      const glow1Radius = 25;
      this.ctx.beginPath();
      this.ctx.roundRect(this.lightBarX - lineWidth * 2, 0, lineWidth * 4, this.h, glow1Radius);
      this.ctx.fill();

      const glow2Gradient = this.ctx.createLinearGradient(this.lightBarX - lineWidth * 4, 0, this.lightBarX + lineWidth * 4, 0);
      glow2Gradient.addColorStop(0, "rgba(139, 92, 246, 0)");
      glow2Gradient.addColorStop(0.5, `rgba(139, 92, 246, ${0.4 * glowIntensity})`);
      glow2Gradient.addColorStop(1, "rgba(139, 92, 246, 0)");

      this.ctx.globalAlpha = glow2Alpha;
      this.ctx.fillStyle = glow2Gradient;
      const glow2Radius = 35;
      this.ctx.beginPath();
      this.ctx.roundRect(this.lightBarX - lineWidth * 4, 0, lineWidth * 8, this.h, glow2Radius);
      this.ctx.fill();

      if (this.scanningActive) {
        const glow3Gradient = this.ctx.createLinearGradient(this.lightBarX - lineWidth * 8, 0, this.lightBarX + lineWidth * 8, 0);
        glow3Gradient.addColorStop(0, "rgba(139, 92, 246, 0)");
        glow3Gradient.addColorStop(0.5, "rgba(139, 92, 246, 0.2)");
        glow3Gradient.addColorStop(1, "rgba(139, 92, 246, 0)");
        this.ctx.globalAlpha = glow3Alpha;
        this.ctx.fillStyle = glow3Gradient;
        const glow3Radius = 45;
        this.ctx.beginPath();
        this.ctx.roundRect(this.lightBarX - lineWidth * 8, 0, lineWidth * 16, this.h, glow3Radius);
        this.ctx.fill();
      }

      this.ctx.globalCompositeOperation = "destination-in";
      this.ctx.globalAlpha = 1;
      this.ctx.fillStyle = verticalGradient;
      this.ctx.fillRect(0, 0, this.w, this.h);
    }

    renderLoop() {
      if (!this.active) return;
      const targetIntensity = this.scanningActive ? this.scanTargetIntensity : this.baseIntensity;
      const targetMaxParticles = this.scanningActive ? this.scanTargetParticles : this.baseMaxParticles;
      const targetFadeZone = this.scanningActive ? this.scanTargetFadeZone : this.baseFadeZone;

      this.currentIntensity += (targetIntensity - this.currentIntensity) * this.transitionSpeed;
      this.currentMaxParticles += (targetMaxParticles - this.currentMaxParticles) * this.transitionSpeed;
      this.currentFadeZone += (targetFadeZone - this.currentFadeZone) * this.transitionSpeed;

      this.intensity = this.currentIntensity;
      this.maxParticles = Math.floor(this.currentMaxParticles);
      this.fadeZone = this.currentFadeZone;

      this.ctx.globalCompositeOperation = "source-over";
      this.ctx.clearRect(0, 0, this.w, this.h);
      this.drawLightBar();
      this.ctx.globalCompositeOperation = "lighter";
      for (let i = 1; i <= this.count; i++) {
        if (this.particles[i]) {
          this.updateParticle(this.particles[i]);
          this.drawParticle(this.particles[i]);
        }
      }

      const currentIntensity = this.intensity;
      const currentMaxParticles = this.maxParticles;

      if (Math.random() < currentIntensity && this.count < currentMaxParticles) {
        const particle = this.createParticle();
        particle.originalAlpha = particle.alpha;
        particle.startX = particle.x;
        this.count++;
        this.particles[this.count] = particle;
      }

      const intensityRatio = this.intensity / this.baseIntensity;
      if (intensityRatio > 1.1 && Math.random() < (intensityRatio - 1.0) * 1.2) {
        const particle = this.createParticle();
        particle.originalAlpha = particle.alpha;
        particle.startX = particle.x;
        this.count++;
        this.particles[this.count] = particle;
      }
      if (intensityRatio > 1.3 && Math.random() < (intensityRatio - 1.3) * 1.4) {
        const particle = this.createParticle();
        particle.originalAlpha = particle.alpha;
        particle.startX = particle.x;
        this.count++;
        this.particles[this.count] = particle;
      }
      if (intensityRatio > 1.5 && Math.random() < (intensityRatio - 1.5) * 1.8) {
        const particle = this.createParticle();
        particle.originalAlpha = particle.alpha;
        particle.startX = particle.x;
        this.count++;
        this.particles[this.count] = particle;
      }
      if (intensityRatio > 2.0 && Math.random() < (intensityRatio - 2.0) * 2.0) {
        const particle = this.createParticle();
        particle.originalAlpha = particle.alpha;
        particle.startX = particle.x;
        this.count++;
        this.particles[this.count] = particle;
      }

      if (this.count > currentMaxParticles + 200) {
        const excessCount = Math.min(15, this.count - currentMaxParticles);
        for (let i = 0; i < excessCount; i++) {
          delete this.particles[this.count - i];
        }
        this.count -= excessCount;
      }
    }

    animate() {
      if (!this.active) return;
      this.renderLoop();
      this.animationId = requestAnimationFrame(() => this.animate());
    }

    setScanningActive(active) {
      this.scanningActive = active;
    }

    destroy() {
      this.active = false;
      window.removeEventListener("resize", this.onResizeBound);
      if (this.animationId) cancelAnimationFrame(this.animationId);
      this.particles = [];
      this.count = 0;
    }
  }


  /**
   * MODULE 4: THREE.js Background Particle System Port
   */
  class ParticleSystem {
    constructor(canvas, THREE) {
      this.THREE = THREE;
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.particles = null;
      this.particleCount = 400;
      this.canvas = canvas;
      this.active = true;
      this.animationId = null;

      this.onResizeBound = this.onWindowResize.bind(this);
      window.addEventListener("resize", this.onResizeBound);

      this.init();
    }

    init() {
      this.scene = new this.THREE.Scene();

      const parent = this.canvas.parentElement;
      const w = parent.offsetWidth;

      this.camera = new this.THREE.OrthographicCamera(-w / 2, w / 2, 125, -125, 1, 1000);
      this.camera.position.z = 100;

      this.renderer = new this.THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
      this.renderer.setSize(w, 250);
      this.renderer.setClearColor(0x000000, 0);

      this.createParticles();
      this.animate();
    }

    createParticles() {
      const geometry = new this.THREE.BufferGeometry();
      const positions = new Float32Array(this.particleCount * 3);
      const colors = new Float32Array(this.particleCount * 3);
      const sizes = new Float32Array(this.particleCount);
      const velocities = new Float32Array(this.particleCount);

      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");

      const half = canvas.width / 2;
      const hue = 217;
      const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
      gradient.addColorStop(0.025, "#fff");
      gradient.addColorStop(0.1, `hsl(${hue}, 61%, 33%)`);
      gradient.addColorStop(0.25, `hsl(${hue}, 64%, 6%)`);
      gradient.addColorStop(1, "transparent");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(half, half, half, 0, Math.PI * 2);
      ctx.fill();

      const texture = new this.THREE.CanvasTexture(canvas);
      const parent = this.canvas.parentElement;
      const w = parent.offsetWidth;

      for (let i = 0; i < this.particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * w * 2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 250;
        positions[i * 3 + 2] = 0;
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;

        const orbitRadius = Math.random() * 200 + 100;
        sizes[i] = (Math.random() * (orbitRadius - 60) + 60) / 8;
        velocities[i] = Math.random() * 60 + 30;
      }

      geometry.setAttribute("position", new this.THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new this.THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("size", new this.THREE.BufferAttribute(sizes, 1));

      this.velocities = velocities;

      const alphas = new Float32Array(this.particleCount);
      for (let i = 0; i < this.particleCount; i++) {
        alphas[i] = (Math.random() * 8 + 2) / 10;
      }
      geometry.setAttribute("alpha", new this.THREE.BufferAttribute(alphas, 1));
      this.alphas = alphas;

      const material = new this.THREE.ShaderMaterial({
        uniforms: {
          pointTexture: { value: texture },
          size: { value: 15.0 },
        },
        vertexShader: `
                attribute float alpha;
                varying float vAlpha;
                varying vec3 vColor;
                uniform float size;
                void main() {
                  vAlpha = alpha;
                  vColor = color;
                  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                  gl_PointSize = size;
                  gl_Position = projectionMatrix * mvPosition;
                }
              `,
        fragmentShader: `
                uniform sampler2D pointTexture;
                varying float vAlpha;
                varying vec3 vColor;
                void main() {
                  gl_FragColor = vec4(vColor, vAlpha) * texture2D(pointTexture, gl_PointCoord);
                }
              `,
        transparent: true,
        blending: this.THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true,
      });

      this.particles = new this.THREE.Points(geometry, material);
      this.scene.add(this.particles);
    }

    animate() {
      if (!this.active) return;
      this.animationId = requestAnimationFrame(() => this.animate());

      if (this.particles) {
        const positions = this.particles.geometry.attributes.position.array;
        const alphas = this.particles.geometry.attributes.alpha.array;
        const time = Date.now() * 0.001;

        const parent = this.canvas.parentElement;
        const w = parent.offsetWidth;

        for (let i = 0; i < this.particleCount; i++) {
          positions[i * 3] += this.velocities[i] * 0.016;

          if (positions[i * 3] > w / 2 + 100) {
            positions[i * 3] = -w / 2 - 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 250;
          }

          positions[i * 3 + 1] += Math.sin(time + i * 0.1) * 0.5;

          const twinkle = Math.floor(Math.random() * 10);
          if (twinkle === 1 && alphas[i] > 0) {
            alphas[i] -= 0.05;
          } else if (twinkle === 2 && alphas[i] < 1) {
            alphas[i] += 0.05;
          }

          alphas[i] = Math.max(0, Math.min(1, alphas[i]));
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
        this.particles.geometry.attributes.alpha.needsUpdate = true;
      }

      this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
      if (!this.active) return;
      const parent = this.canvas.parentElement;
      const w = parent.offsetWidth;
      this.camera.left = -w / 2;
      this.camera.right = w / 2;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, 250);
    }

    destroy() {
      this.active = false;
      window.removeEventListener("resize", this.onResizeBound);
      if (this.animationId) cancelAnimationFrame(this.animationId);
      if (this.renderer) this.renderer.dispose();
      if (this.particles) {
        this.scene.remove(this.particles);
        this.particles.geometry.dispose();
        this.particles.material.dispose();
      }
    }
  }

  /**
   * REACT LIFECYCLE
   */

  useEffect(() => {
    let active = true;

    async function mount() {
      try {
        // 1. Map ESM dependencies 
        let importMap = document.getElementById('three-import-map-cardscanner');
        if (!importMap) {
          importMap = document.createElement('script');
          importMap.id = 'three-import-map-cardscanner';
          importMap.type = 'importmap';
          importMap.textContent = JSON.stringify({
            imports: {
              "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
            }
          });
          document.head.appendChild(importMap);
        }

        await new Promise(r => setTimeout(r, 50));

        // 2. Load Three.js 
        const THREE = await loadScript(dc, 'https://unpkg.com/three@0.160.0/build/three.module.js', { type: 'module' });

        if (!active) return;
        setIsLoaded(true);
        controllersRef.THREE = THREE;

        // 3. Initialize Controller Modules
        if (streamContainerRef.current && cardLineRef.current) {
          controllersRef.cardStream = new CardStreamController(streamContainerRef.current, cardLineRef.current, setSpeedLabel);
          controllersRef.cardStream.init();
        }

        if (scannerCanvasRef.current) {
          controllersRef.particleScanner = new ParticleScanner(scannerCanvasRef.current);
        }

        if (particleCanvasRef.current) {
          controllersRef.particleSystem = new ParticleSystem(particleCanvasRef.current, THREE);
        }

      } catch (e) {
        console.error("CardScanner Setup Error", e);
        if (active) setError(String(e));
      }
    }

    mount();

    return () => {
      active = false;
      if (controllersRef.cardStream) controllersRef.cardStream.destroy();
      if (controllersRef.particleScanner) controllersRef.particleScanner.destroy();
      if (controllersRef.particleSystem) controllersRef.particleSystem.destroy();
    };
  }, []);

  // Bound Control Bindings
  const handleToggleAnimation = () => {
    if (controllersRef.cardStream) {
      const nextState = !isPlaying;
      setIsPlaying(nextState);
      controllersRef.cardStream.toggleAnimation(nextState);
    }
  };
  const handleResetPosition = () => { if (controllersRef.cardStream) { controllersRef.cardStream.resetPosition(); setIsPlaying(true); } };
  const handleChangeDirection = () => { if (controllersRef.cardStream) controllersRef.cardStream.changeDirection(); };

  return (
    <div className="cardscanner-root">
      {!isLoaded && !error && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'monospace', color: '#fff' }}>
          Loading Scanner Assets...
        </div>
      )}

      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', zIndex: 10, padding: '20px', textAlign: 'center' }}>
          Error loading Component: {error}
        </div>
      )}

      <div className="cardscanner-controls">
        {!isInception && (
          <button className="cardscanner-control-btn" onClick={onToggleFullTab}>
            <dc.Icon icon={isFullTab ? "minimize" : "maximize"} />
          </button>
        )}
        <button className="cardscanner-control-btn" onClick={handleToggleAnimation}>
          {isPlaying ? "⏸️ Pause" : "▶️ Play"}
        </button>
        <button className="cardscanner-control-btn" onClick={handleResetPosition}>🔄 Reset</button>
        <button className="cardscanner-control-btn" onClick={handleChangeDirection}>↔️ Direction</button>
      </div>

      <div className="cardscanner-speed-indicator">
        Speed: <span>{speedLabel}</span> px/s
      </div>

      <div className="cardscanner-container" ref={streamContainerRef}>
        <canvas id="cardscanner-particleCanvas" className="cardscanner-particleCanvas" ref={particleCanvasRef}></canvas>
        <canvas id="cardscanner-scannerCanvas" className="cardscanner-scannerCanvas" ref={scannerCanvasRef}></canvas>

        <div className="cardscanner-scanner"></div>

        <div className="cardscanner-card-stream">
          <div className="cardscanner-card-line" ref={cardLineRef}></div>
        </div>
      </div>

      <div className="inspiration-credit" style={{ position: 'absolute', bottom: '20px', width: '100%', textAlign: 'center', color: '#ff9a9c', fontFamily: 'monospace', zIndex: 100 }}>
        Inspired by <a href="https://evervault.com/" target="_blank" style={{ color: '#ff9a9c' }}>@evervault.com</a>
      </div>
    </div>
  );
}

return { ScannerComponent };
