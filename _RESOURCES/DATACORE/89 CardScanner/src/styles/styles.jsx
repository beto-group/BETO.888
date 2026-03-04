const STYLES_RAW = `
@import url("https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap");

.cardscanner-root * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.cardscanner-root {
  background: #000000;
  height: 100%;
  width: 100%;
  overflow: hidden;
  font-family: "Arial", sans-serif;
  position: relative;
}

.cardscanner-controls {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  gap: 10px;
  z-index: 100;
}

.cardscanner-control-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 25px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  font-size: 14px;
}

.cardscanner-control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.cardscanner-speed-indicator {
  position: absolute;
  top: 20px;
  right: 20px;
  color: white;
  font-size: 16px;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(5px);
  z-index: 100;
}

.cardscanner-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cardscanner-card-stream {
  position: absolute;
  width: 100%;
  height: 180px;
  display: flex;
  align-items: center;
  overflow: visible;
  z-index: 20;
}

.cardscanner-card-line {
  display: flex;
  align-items: center;
  gap: 60px;
  white-space: nowrap;
  cursor: grab;
  user-select: none;
  will-change: transform;
}

.cardscanner-card-line:active {
  cursor: grabbing;
}

.cardscanner-card-line.dragging {
  cursor: grabbing;
}

.cardscanner-card-wrapper {
  position: relative;
  width: 400px;
  height: 250px;
  flex-shrink: 0;
}

.cardscanner-card {
  position: absolute;
  top: 0;
  left: 0;
  width: 400px;
  height: 250px;
  border-radius: 15px;
  overflow: hidden;
}

.cardscanner-card-normal {
  background: transparent;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0;
  color: white;
  z-index: 2;
  position: relative;
  overflow: hidden;
  clip-path: inset(0 0 0 var(--clip-right, 0%));
}

.cardscanner-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 15px;
  transition: all 0.3s ease;
  filter: brightness(1.1) contrast(1.1);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

.cardscanner-card-ascii {
  background: transparent;
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;
  width: 400px;
  height: 250px;
  border-radius: 15px;
  overflow: hidden;
  clip-path: inset(0 calc(100% - var(--clip-left, 0%)) 0 0);
}

.cardscanner-ascii-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  color: rgba(220, 210, 255, 0.6);
  font-family: "Courier New", monospace;
  font-size: 11px;
  line-height: 13px;
  overflow: hidden;
  white-space: pre;
  animation: glitch 0.1s infinite linear alternate-reverse;
  margin: 0;
  padding: 0;
  text-align: left;
  vertical-align: top;
  box-sizing: border-box;
  -webkit-mask-image: linear-gradient(
    to right,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 0.8) 30%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(0, 0, 0, 0.4) 80%,
    rgba(0, 0, 0, 0.2) 100%
  );
  mask-image: linear-gradient(
    to right,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 0.8) 30%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(0, 0, 0, 0.4) 80%,
    rgba(0, 0, 0, 0.2) 100%
  );
}

@keyframes glitch {
  0% { opacity: 1; }
  15% { opacity: 0.9; }
  16% { opacity: 1; }
  49% { opacity: 0.8; }
  50% { opacity: 1; }
  99% { opacity: 0.9; }
  100% { opacity: 1; }
}

.cardscanner-scanner {
  display: none;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 300px;
  border-radius: 30px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(0, 255, 255, 0.8),
    rgba(0, 255, 255, 1),
    rgba(0, 255, 255, 0.8),
    transparent
  );
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.8), 0 0 40px rgba(0, 255, 255, 0.4);
  animation: scanPulse 2s ease-in-out infinite alternate;
  z-index: 10;
}

@keyframes scanPulse {
  0% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scaleY(1);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scaleY(1.1);
  }
}

.cardscanner-scan-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 255, 255, 0.4),
    transparent
  );
  animation: scanEffect 0.6s ease-out;
  pointer-events: none;
  z-index: 5;
}

@keyframes scanEffect {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}

.cardscanner-particleCanvas {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  width: 100%;
  height: 250px;
  z-index: 0;
  pointer-events: none;
}

.cardscanner-scannerCanvas {
  position: absolute;
  top: 50%;
  left: -3px;
  transform: translateY(-50%);
  width: 100%;
  height: 300px;
  z-index: 15;
  pointer-events: none;
}
`;

return { STYLES_RAW };
