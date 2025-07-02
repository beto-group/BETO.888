


# ViewComponent

```jsx
const { useRef, useEffect, useState } = dc;

// ====================
// HELPER FUNCTIONS
// ====================

/** Creates a rotation matrix about the Y-axis. */
function rotationYMatrix(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    c, 0,  s, 0,
    0, 1,  0, 0,
   -s, 0,  c, 0,
    0, 0,  0, 1,
  ]);
}

/** Creates a scale matrix for uniform scaling. */
function scaleMatrix(s) {
  if (typeof s === 'number') {
    return new Float32Array([
      s, 0, 0, 0,
      0, s, 0, 0,
      0, 0, s, 0,
      0, 0, 0, 1
    ]);
  } else {
    return new Float32Array([
      s.x,  0,    0,    0,
       0,  s.y,   0,    0,
       0,   0,  s.z,   0,
       0,   0,   0,    1
    ]);
  }
}


/** Multiplies two 4x4 matrices (a * b). */
function multiply4x4(a, b) {
  const out = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[i + k * 4] * b[k + j * 4];
      }
      out[i + j * 4] = sum;
    }
  }
  return out;
}

/** Creates a translation matrix from x, y, z components. */
function translationMatrix(tx, ty, tz) {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    tx, ty, tz, 1
  ]);
}

/** Creates a projection matrix. */
function makeProjectionMatrix(width, height, fovRef) {
  const fov = fovRef.current;
  const aspect = width / height;
  const zNear = 0.1;
  const zFar = 100.0;
  const f = 1.0 / Math.tan(fov / 2);
  const out = new Float32Array(16);
  out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
  out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
  out[8] = 0; out[9] = 0; out[10] = (zFar+zNear)/(zNear-zFar); out[11] = -1;
  out[12] = 0; out[13] = 0; out[14] = (2*zFar*zNear)/(zNear-zFar); out[15] = 0;
  return out;
}

/** Creates a "look-at" view matrix. */
function lookAtVec(eye, center, up) {
  const f = {
    x: center.x - eye.x,
    y: center.y - eye.y,
    z: center.z - eye.z
  };
  const fMag = Math.hypot(f.x, f.y, f.z);
  f.x /= fMag; f.y /= fMag; f.z /= fMag;
  const s = {
    x: f.y * up.z - f.z * up.y,
    y: f.z * up.x - f.x * up.z,
    z: f.x * up.y - f.y * up.x
  };
  const sMag = Math.hypot(s.x, s.y, s.z);
  s.x /= sMag; s.y /= sMag; s.z /= sMag;
  const u = {
    x: s.y * f.z - s.z * f.y,
    y: s.z * f.x - s.x * f.z,
    z: s.x * f.y - s.y * f.x
  };
  const out = new Float32Array(16);
  out[0] = s.x;  out[1] = u.x;  out[2] = -f.x; out[3] = 0;
  out[4] = s.y;  out[5] = u.y;  out[6] = -f.y; out[7] = 0;
  out[8] = s.z;  out[9] = u.z;  out[10] = -f.z; out[11] = 0;
  out[12] = -(s.x * eye.x + s.y * eye.y + s.z * eye.z);
  out[13] = -(u.x * eye.x + u.y * eye.y + u.z * eye.z);
  out[14] =  (f.x * eye.x + f.y * eye.y + f.z * eye.z);
  out[15] = 1;
  return out;
}

/** Creates and compiles a shader. */
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** Creates and links a shader program. */
function createProgram(gl, vs, fs) {
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

/** Helper: Computes the final model transformation for an object */
function computeFinalModel(obj) {
  const modelMatrix = translationMatrix(obj.pos.x, obj.pos.y, obj.pos.z);
  const rotMatrix = rotationYMatrix(obj.rotation || 0);
  const scaleMat = scaleMatrix(obj.scale || 1.0);
  const modelRS = multiply4x4(rotMatrix, scaleMat);
  return multiply4x4(modelMatrix, modelRS);
}

/** Multiplies a 4x4 matrix by a 4D vector. */
function multiplyMatVec(mat, vec) {
  const result = [0, 0, 0, 0];
  for (let row = 0; row < 4; row++) {
    result[row] =
      vec[0] * mat[row + 0] +
      vec[1] * mat[row + 4] +
      vec[2] * mat[row + 8] +
      vec[3] * mat[row + 12];
  }
  return result;
}


/**
 * Given a world-space position (an array [x,y,z]), the current view and projection matrices,
 * and canvas dimensions, compute its screen coordinates.
 */
function computeScreenPosition(worldPos, viewMatrix, projMatrix, canvasWidth, canvasHeight) {
  const pos4 = [worldPos[0], worldPos[1], worldPos[2], 1];
  const viewPos = multiplyMatVec(viewMatrix, pos4);
  const clipPos = multiplyMatVec(projMatrix, viewPos);
  const ndc = clipPos.map((c, i) => (i < 3 && clipPos[3] !== 0 ? c / clipPos[3] : c));
  const screenX = (ndc[0] * 0.5 + 0.5) * canvasWidth;
  const screenY = (1 - (ndc[1] * 0.5 + 0.5)) * canvasHeight;
  return { left: screenX, top: screenY };
}

/** Loads a media file from the vault and returns its resource URL. */

async function requireMediaFile(path) {
  const mediaFile = await app.vault.getFileByPath(path);
  return app.vault.getResourcePath(mediaFile);
}

/** Determines if a value is a power of 2. */
function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

/** Loads an image as a WebGL texture. */
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Added: Flip the image's Y axis so that it isn't rendered upside down.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // Use a 1x1 pixel placeholder until the image loads.
  const level = 0,
    internalFormat = gl.RGBA,
    width = 1,
    height = 1,
    border = 0,
    srcFormat = gl.RGBA,
    srcType = gl.UNSIGNED_BYTE;
  const placeholderPixel = new Uint8Array([255, 255, 255, 255]); // white pixel
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
    width, height, border, srcFormat, srcType, placeholderPixel);

  const image = new Image();
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
      srcFormat, srcType, image);
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;
  return texture;
}


// ====================
// WEBGL SETUP & GEOMETRY
// ====================

/** Initializes WebGL context, shaders, and geometry (with UV buffers) */
function initWebGL(canvas, fovRef) {
  const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.error("WebGL not supported.");
    return null;
  }

  // Set clear color, enable depth test, and set viewport.
  gl.clearColor(0.1, 0.1, 0.3, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.viewport(0, 0, canvas.width, canvas.height);

  // --- SHADERS (updated to support textures) ---
  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;
    
    uniform mat4 uProjectionMatrix;
    uniform mat4 uModelViewMatrix;
    
    varying highp vec2 vTextureCoord;
    
    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
    }
  `;
  const fsSource = `
    precision mediump float;
    
    varying highp vec2 vTextureCoord;
    uniform bool uUseTexture;
    uniform sampler2D uSampler;
    uniform vec4 uColor;
    
    void main(void) {
      if (uUseTexture) {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
      } else {
        gl_FragColor = uColor;
      }
    }
  `;
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vertexShader || !fragmentShader) return null;
  const shaderProgram = createProgram(gl, vertexShader, fragmentShader);
  if (!shaderProgram) return null;
  gl.useProgram(shaderProgram);

  // Get attributes and uniform locations.
  const aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(aVertexPosition);
  const aTextureCoord = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(aTextureCoord);

  const uProjectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  const uModelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
  const uColor = gl.getUniformLocation(shaderProgram, "uColor");
  const uSampler = gl.getUniformLocation(shaderProgram, "uSampler");
  const uUseTexture = gl.getUniformLocation(shaderProgram, "uUseTexture");

  // --- GEOMETRY BUFFERS (with positions and UV data) ---
  const buffers = {};

  // --- Cube Buffer (for character and cubes) ---
  // Cube positions (36 vertices, 3 components each)
  const cubePositions = new Float32Array([
    // Front face
    -0.5, -0.5,  0.5,
     0.5, -0.5,  0.5,
     0.5,  0.5,  0.5,
    -0.5, -0.5,  0.5,
     0.5,  0.5,  0.5,
    -0.5,  0.5,  0.5,
    // Back face
    -0.5, -0.5, -0.5,
    -0.5,  0.5, -0.5,
     0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5, -0.5, -0.5,
    // Top face
    -0.5,  0.5, -0.5,
    -0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5,
     0.5,  0.5,  0.5,
     0.5,  0.5, -0.5,
    // Bottom face
    -0.5, -0.5, -0.5,
     0.5, -0.5, -0.5,
     0.5, -0.5,  0.5,
    -0.5, -0.5, -0.5,
     0.5, -0.5,  0.5,
    -0.5, -0.5,  0.5,
    // Right face
     0.5, -0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5,  0.5,  0.5,
     0.5, -0.5, -0.5,
     0.5,  0.5,  0.5,
     0.5, -0.5,  0.5,
    // Left face
    -0.5, -0.5, -0.5,
    -0.5, -0.5,  0.5,
    -0.5,  0.5,  0.5,
    -0.5, -0.5, -0.5,
    -0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5,
  ]);
  buffers.cubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.cubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubePositions, gl.STATIC_DRAW);

  // Cube UVs (each face: [0,0, 1,0, 1,1, 0,0, 1,1, 0,1])
  const faceUV = [0,0, 1,0, 1,1, 0,0, 1,1, 0,1];
  const cubeUVs = new Float32Array([
    ...faceUV, ...faceUV, ...faceUV, ...faceUV, ...faceUV, ...faceUV
  ]);
  buffers.cubeUVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.cubeUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeUVs, gl.STATIC_DRAW);

  // --- Pyramid Buffer (for pyramid objects) ---
  const pyramidPositions = new Float32Array([
    // Four side triangles (each with 3 vertices)
    0.0,  1.0,  0.0,   -1.0, -1.0, -1.0,    1.0, -1.0, -1.0,
    0.0,  1.0,  0.0,    1.0, -1.0, -1.0,    1.0, -1.0,  1.0,
    0.0,  1.0,  0.0,    1.0, -1.0,  1.0,   -1.0, -1.0,  1.0,
    0.0,  1.0,  0.0,   -1.0, -1.0,  1.0,   -1.0, -1.0, -1.0,
    // Base (two triangles)
    -1.0, -1.0, -1.0,    1.0, -1.0, -1.0,    1.0, -1.0,  1.0,
    -1.0, -1.0, -1.0,    1.0, -1.0,  1.0,   -1.0, -1.0,  1.0,
  ]);
  buffers.pyramidBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pyramidBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, pyramidPositions, gl.STATIC_DRAW);

  // Pyramid UVs:
  // For side triangles (4 triangles): use [0.5,1, 0,0, 1,0]
  // For base: first triangle [0,0, 1,0, 1,1], second triangle [0,0, 1,1, 0,1]
  const sideUV = [0.5,1, 0,0, 1,0];
  const baseUV1 = [0,0, 1,0, 1,1];
  const baseUV2 = [0,0, 1,1, 0,1];
  const pyramidUVs = new Float32Array([
    ...sideUV, ...sideUV, ...sideUV, ...sideUV, ...baseUV1, ...baseUV2
  ]);
  buffers.pyramidUVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pyramidUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, pyramidUVs, gl.STATIC_DRAW);

  // --- Pane Buffer (for pane objects) ---
  const panePositions = new Float32Array([
    -0.5, -0.5, 0.0,
     0.5, -0.5, 0.0,
     0.5,  0.5, 0.0,
    -0.5, -0.5, 0.0,
     0.5,  0.5, 0.0,
    -0.5,  0.5, 0.0,
  ]);
  buffers.paneBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.paneBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, panePositions, gl.STATIC_DRAW);

  const paneUVs = new Float32Array([
    0,0, 1,0, 1,1,
    0,0, 1,1, 0,1,
  ]);
  buffers.paneUVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.paneUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, paneUVs, gl.STATIC_DRAW);

  // --- Ground Buffer ---
  const groundPositions = new Float32Array([
    -50, 0, -50,
     50, 0, -50,
     50, 0,  50,
    -50, 0, -50,
     50, 0,  50,
    -50, 0,  50,
  ]);
  buffers.groundBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.groundBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, groundPositions, gl.STATIC_DRAW);

  const groundUVs = new Float32Array([
    0,0, 1,0, 1,1,
    0,0, 1,1, 0,1,
  ]);
  buffers.groundUVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.groundUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, groundUVs, gl.STATIC_DRAW);

  return {
    gl,
    shaderProgram,
    aVertexPosition,
    aTextureCoord,
    uProjectionMatrix,
    uModelViewMatrix,
    uColor,
    uSampler,
    uUseTexture,
    buffers
  };
}

// ====================
// INPUT & GAME CONTROL FUNCTIONS
// ====================

function registerKeyListeners(canvasRef, gameStarted, setIsAddMenuVisible, keysPressed, draggingPyramid, resumeGame) {
  if (!gameStarted) return;
  const handleKeyDown = (e) => {
    if (document.pointerLockElement !== canvasRef.current) return;
    if (e.key.toLowerCase() === "i") {
      setIsAddMenuVisible((prev) => {
        if (prev) {
          resumeGame();
          return false;
        } else {
          document.exitPointerLock();
          return true;
        }
      });
      e.preventDefault();
      return;
    }
    if (e.key === " " || e.key === "Space") {
      e.preventDefault();
    }
    keysPressed.current[e.key] = true;
  };

  const handleKeyUp = (e) => {
    keysPressed.current[e.key] = false;
    if (e.key === "Meta") {
      if (draggingPyramid) draggingPyramid.current = false;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
  };
}

function registerPointerLockListeners(canvas, setIsPaused, pausedRef) {
  const pointerLockChange = () => {
    if (document.pointerLockElement === canvas) {
      pausedRef.current = false;
      setIsPaused(false);
      console.log("Pointer locked. Resuming game.");
    } else {
      pausedRef.current = true;
      setIsPaused(true);
      console.log("Pointer unlocked. Game paused.");
    }
  };
  document.addEventListener("pointerlockchange", pointerLockChange);
  return () => document.removeEventListener("pointerlockchange", pointerLockChange);
}

function registerMouseMoveListener(canvas, keysPressed, cameraState, mouseSensitivity, characterState, addedObjects, selectedObjectIndex, objectDragSensitivity) {
  const handleMouseMove = (e) => {
    if (document.pointerLockElement === canvas) {
      if (keysPressed.current["Meta"]) {
        if (selectedObjectIndex.current === null) {
          const charPos = characterState.current.pos;
          let foundIndex = null;
          let minAngle = Infinity;
          const cameraYaw = cameraState.current.yaw;
          const cameraForward = { x: Math.sin(cameraYaw), z: Math.cos(cameraYaw) };
          addedObjects.current.forEach((obj, index) => {
            const toObj = { x: obj.pos.x - charPos.x, z: obj.pos.z - charPos.z };
            const toObjMag = Math.hypot(toObj.x, toObj.z);
            if (toObjMag === 0) return;
            const normToObj = { x: toObj.x / toObjMag, z: toObj.z / toObjMag };
            const dot = cameraForward.x * normToObj.x + cameraForward.z * normToObj.z;
            const angle = Math.acos(Math.min(Math.max(dot, -1), 1));
            const threshold = 15 * Math.PI / 180;
            if (angle < threshold && angle < minAngle) {
              minAngle = angle;
              foundIndex = index;
            }
          });
          if (foundIndex !== null) {
            selectedObjectIndex.current = foundIndex;
          }
        }
        if (selectedObjectIndex.current !== null) {
          let obj = addedObjects.current[selectedObjectIndex.current];
          if (keysPressed.current["Meta"] && keysPressed.current["Control"]) {
            const scalingSensitivityX = 0.01;
            const scalingSensitivityY = 0.01;
            // Update x-scale with horizontal mouse movement.
            obj.scale.x = Math.max(0.1, obj.scale.x + e.movementX * scalingSensitivityX);
            // Update y-scale with vertical mouse movement.
            obj.scale.y = Math.max(0.1, obj.scale.y + e.movementY * scalingSensitivityY);
            // Optionally, if your object's vertical position should follow the y-scale:
            if (typeof obj.baseYOffset === "number") {
                obj.pos.y = obj.baseYOffset * obj.scale.y;
            }
          } else if (keysPressed.current["Meta"] && keysPressed.current["Alt"]) {
            const rotationSensitivity = 0.01;
            obj.rotation = (obj.rotation || 0) - e.movementX * rotationSensitivity;
          } else if (keysPressed.current["Meta"]) {
            const yaw = cameraState.current.yaw;
            const cameraRight = { x: Math.cos(yaw), z: -Math.sin(yaw) };
            const cameraForward = { x: Math.sin(yaw), z: Math.cos(yaw) };
            const deltaX = e.movementX * objectDragSensitivity;
            const deltaY = e.movementY * objectDragSensitivity;
            obj.pos.x -= cameraRight.x * deltaX + cameraForward.x * deltaY;
            obj.pos.z -= cameraRight.z * deltaX + cameraForward.z * deltaY;
          }
        }
      } else {
        selectedObjectIndex.current = null;
        cameraState.current.yaw   -= e.movementX * mouseSensitivity;
        cameraState.current.pitch -= e.movementY * mouseSensitivity;
        const maxPitch = 80 * Math.PI / 180;
        if (cameraState.current.pitch > maxPitch) cameraState.current.pitch = maxPitch;
        if (cameraState.current.pitch < -maxPitch) cameraState.current.pitch = -maxPitch;
      }
    }
  };
  document.addEventListener("mousemove", handleMouseMove);
  return () => document.removeEventListener("mousemove", handleMouseMove);
}

function registerTouchAndWheelListeners(canvas, fovRef, keysPressed, selectedObjectIndex, addedObjects) {
  let initialPinchDistance = null;
  const touchStart = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistance = Math.hypot(dx, dy);
    }
  };
  const touchMove = (e) => {
    if (e.touches.length === 2 && initialPinchDistance !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDistance = Math.hypot(dx, dy);
      const delta = currentDistance - initialPinchDistance;
      fovRef.current += -delta * 0.005;
      const minFov = 20 * Math.PI / 180;
      const maxFov = 80 * Math.PI / 180;
      if (fovRef.current < minFov) fovRef.current = minFov;
      if (fovRef.current > maxFov) fovRef.current = maxFov;
      initialPinchDistance = currentDistance;
      e.preventDefault();
    }
  };
  const touchEnd = (e) => {
    if (e.touches.length < 2) initialPinchDistance = null;
  };

  const wheelHandler = (e) => {
    // When ctrlKey + Meta + Control are pressed, update the selected object's z-scale.
    if (e.ctrlKey && keysPressed.current["Meta"] && keysPressed.current["Control"]) {
      e.preventDefault();
      const currentIndex = selectedObjectIndex.current;
      if (currentIndex !== null) {
        const obj = addedObjects.current[currentIndex];
        const scalingSensitivityZ = 0.01;
        obj.scale.z = Math.max(0.1, obj.scale.z - e.deltaY * scalingSensitivityZ);
      }
    } else if (e.ctrlKey) {
      // If only ctrlKey is pressed (without Meta+Control), handle FOV adjustment as before.
      fovRef.current += e.deltaY * 0.001;
      const minFov = 20 * Math.PI / 180;
      const maxFov = 80 * Math.PI / 180;
      if (fovRef.current < minFov) fovRef.current = minFov;
      if (fovRef.current > maxFov) fovRef.current = maxFov;
      e.preventDefault();
    }
  };

  canvas.addEventListener("touchstart", touchStart);
  canvas.addEventListener("touchmove", touchMove);
  canvas.addEventListener("touchend", touchEnd);
  canvas.addEventListener("wheel", wheelHandler);

  return () => {
    canvas.removeEventListener("touchstart", touchStart);
    canvas.removeEventListener("touchmove", touchMove);
    canvas.removeEventListener("touchend", touchEnd);
    canvas.removeEventListener("wheel", wheelHandler);
  };
}


/** Spawns a new object in front of the character.
 * The type can be "cube", "pyramid", or "pane".
 */
function spawnObject(type, characterState, cameraState, addedObjects) {
  const charPos = characterState.current.pos;
  const forward = {
    x: Math.sin(cameraState.current.yaw),
    z: Math.cos(cameraState.current.yaw)
  };
  const spawnOffset = 2;
  let baseOffset;
  if (type === "pyramid") {
    baseOffset = 1.0;
  } else if (type === "pane") {
    baseOffset = 0.5;
  } else {
    baseOffset = 0.5;
  }
  // For scaling we now use nonuniform scaling (from our previous update)
  const newObject = {
    type,
    pos: {
      x: charPos.x + forward.x * spawnOffset,
      y: baseOffset,
      z: charPos.z + forward.z * spawnOffset
    },
    rotation: 0,
    scale: { x: 1.0, y: 1.0, z: 1.0 },
    baseYOffset: baseOffset,
    // For texture-based interactions:
    lottieSrc: null,
    texture: null,
    // New properties for view rendering:
    viewLoaded: false,      // flag indicating the view has been loaded
    viewContainer: null     // the offscreen DOM container in which the view is rendered
  };
  addedObjects.current.push(newObject);
}




// Helper that returns a canvas element from a DOM node.
// If the node is already a canvas, return it.
// Otherwise, try to capture it into a canvas using html2canvas.
async function getSourceCanvas(viewContainer) {
  if (!viewContainer) return null;
  
  // If the container is already a canvas, simply return it
  if (viewContainer instanceof HTMLCanvasElement) {
    return viewContainer;
  }
  
  // If a canvas already exists in the container, return it.
  const existingCanvas = viewContainer.querySelector('canvas');
  if (existingCanvas) return existingCanvas;
  
  // If html2canvas is available on the window, use it.
  if (window.html2canvas) {
    try {
      // Capture viewContainer into a canvas.
      const capturedCanvas = await window.html2canvas(viewContainer);
      return capturedCanvas;
    } catch (err) {
      console.error("html2canvas capture failed:", err);
      return null;
    }
  } else {
    console.error("html2canvas library is not loaded.");
    return null;
  }
}

function updateViewTexture(gl, obj) {
  // Look for a canvas element within the view container.
  const sourceCanvas = obj.viewContainer.querySelector("canvas");

  if (!sourceCanvas) {
    console.error("updateViewTexture: No valid canvas element found within the view container.");
    return;
  }
  
  // Bind the texture and set the desired parameters.
  gl.bindTexture(gl.TEXTURE_2D, obj.texture);
  // Flip the image's Y axis to match WebGL texture coordinate system.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  try {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      sourceCanvas
    );
  } catch (err) {
    console.error("updateViewTexture: texImage2D error:", err);
    return;
  }

  // Check if the canvas dimensions are a power of 2.
  if (isPowerOf2(sourceCanvas.width) && isPowerOf2(sourceCanvas.height)) {
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
}





function isLottieMedia(url) {
  if (!url) return false;
  const baseUrl = url.split("?")[0];
  return baseUrl.toLowerCase().endsWith(".json");
}


function updateLottieTexture(gl, obj) {
  if (!obj.offscreenCanvas) return;
  gl.bindTexture(gl.TEXTURE_2D, obj.texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  // Update the texture with the current image from the offscreen canvas.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, obj.offscreenCanvas);
  // Generate mipmaps if the canvas dimensions are powers of 2.
  if (isPowerOf2(obj.offscreenCanvas.width) && isPowerOf2(obj.offscreenCanvas.height)) {
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
}

dc.renderReact = function(component, container) {
  if (dc.preact && typeof dc.preact.render === "function") {
    dc.preact.render(component, container);
  } else {
    throw new Error("dc.preact.render is not defined. Please ensure that preact is loaded.");
  }
};



// ====================
// WORLDVIEW COMPONENT
// ====================
function WorldView() {
  const canvasRef = useRef(null);
  const overlayPaneIndex = useRef(null);

  // --- State for game & menus ---
  const [gameStarted, setGameStarted] = useState(false);
  const gameStartedRef = useRef(false);
  useEffect(() => { gameStartedRef.current = gameStarted; }, [gameStarted]);

  const [isAddMenuVisible, setIsAddMenuVisible] = useState(false);
  const addMenuVisibleRef = useRef(isAddMenuVisible);
  useEffect(() => { addMenuVisibleRef.current = isAddMenuVisible; }, [isAddMenuVisible]);

  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false);

  // --- State for Lottie Interaction ---
  const [isLottieMenuVisible, setIsLottieMenuVisible] = useState(false);
  const [lottieFilePathInput, setLottieFilePathInput] = useState("images/sampleTexture.png");
  const [lottieOverlayPos, setLottieOverlayPos] = useState({ left: -9999, top: -9999, size: 300 });
  const [viewFilePathInput, setViewFilePathInput] = useState("LOTTIE.view.v.2.5");
  const [isViewMenuVisible, setIsViewMenuVisible] = useState(false);


  // Load Lottie player / ReactDOM script if not registered.
  useEffect(() => {
    // Check if the Lottie player is already registered;
    // if not, load it from the CDN.
    if (!window.customElements.get("lottie-player")) {
        const lottieScript = document.createElement("script");
        lottieScript.src =
        "https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js";
        lottieScript.async = true;
        document.body.appendChild(lottieScript);
        // Cleanup when the component unmounts.
        return () => {
        document.body.removeChild(lottieScript);
        };
    }
    }, []);

    useEffect(() => {
        // If you also need to load html2canvas from the web,
        // check if it is not already loaded
        if (!window.html2canvas) {
            const html2canvasScript = document.createElement("script");
            html2canvasScript.src =
            "https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js";
            html2canvasScript.async = true;
            document.body.appendChild(html2canvasScript);
            // Cleanup when the component unmounts.
            return () => {
            document.body.removeChild(html2canvasScript);
            };
        }
    }, []);




  // --- Refs for game state & objects ---
  const addedObjects = useRef([]);
  const characterState = useRef({ pos: { x: 0, y: 0, z: 0 }, verticalVelocity: 0 });
  const cameraState = useRef({ yaw: 0, pitch: 0 });
  const selectedObjectIndex = useRef(null);
  const fovRef = useRef(45 * Math.PI / 180);
  const keysPressed = useRef({});

  // --- Ref for view/projection matrices & canvas size (for overlay positioning) ---
  const vpMatricesRef = useRef({ viewMatrix: null, projectionMatrix: null, width: 800, height: 400 });

  // --- Gameplay Constants ---
  const gravity = -9.8;
  const moveSpeed = 0.1;
  const jumpSpeed = 5.0;
  const mouseSensitivity = 0.005;
  const objectDragSensitivity = 0.01;
  const eyeHeight = 0.8;

  // -------------------------
  // GAME CONTROL FUNCTIONS
  // -------------------------
  const resumeGame = () => {
    keysPressed.current = {};
    if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  const startGame = () => {
    setGameStarted(true);
    if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  // -------------------------
  // OBJECT SPAWNING FUNCTIONS
  // -------------------------
  const handleAddCube = () => spawnObject("cube", characterState, cameraState, addedObjects);
  const handleAddPyramid = () => spawnObject("pyramid", characterState, cameraState, addedObjects);
  const handleAddPane = () => spawnObject("pane", characterState, cameraState, addedObjects);

  // -------------------------
  // KEY LISTENER FOR INTERACTION (E key)
  // -------------------------
  useEffect(() => {
    const handleEKey = (e) => {
        if (e.key.toLowerCase() === "e") {
        if (document.pointerLockElement === canvasRef.current && gameStarted) {
            document.exitPointerLock();
            let paneIndex = selectedObjectIndex.current;
            // If no pane is already selected, try to find one based on angle.
            if (paneIndex === null) {
            const charPos = characterState.current.pos;
            const cameraYaw = cameraState.current.yaw;
            const cameraForward = { x: Math.sin(cameraYaw), z: Math.cos(cameraYaw) };
            let minAngle = Infinity;
            let foundIndex = null;
            addedObjects.current.forEach((obj, index) => {
                if (obj.type === "pane") {
                const toObj = { x: obj.pos.x - charPos.x, z: obj.pos.z - charPos.z };
                const toObjMag = Math.hypot(toObj.x, toObj.z);
                if (toObjMag === 0) return;
                const normToObj = { x: toObj.x / toObjMag, z: toObj.z / toObjMag };
                const dot = cameraForward.x * normToObj.x + cameraForward.z * normToObj.z;
                const angle = Math.acos(Math.min(Math.max(dot, -1), 1));
                const threshold = 15 * Math.PI / 180;
                if (angle < threshold && angle < minAngle) {
                    minAngle = angle;
                    foundIndex = index;
                }
                }
            });
            if (foundIndex !== null) {
                paneIndex = foundIndex;
                selectedObjectIndex.current = paneIndex;
            }
            }
            // If a pane was found, save that index in overlayPaneIndex for persistent overlay tracking.
            if (paneIndex !== null) {
            overlayPaneIndex.current = paneIndex;
            setIsLottieMenuVisible(true);
            e.preventDefault();
            }
        }
        }
    };
    window.addEventListener("keydown", handleEKey);
    return () => window.removeEventListener("keydown", handleEKey);
    }, [gameStarted]);



  // -------------------------
  // ANIMATION & RENDER LOOP
  // -------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas element not found.");
      return;
    }
    
    const webglData = initWebGL(canvas, fovRef);
    if (!webglData) return;
    
    canvas.addEventListener("click", () => { canvas.requestPointerLock(); });
    
    const unregisterPointerLock = registerPointerLockListeners(canvas, setIsPaused, pausedRef);
    const unregisterMouseMove = registerMouseMoveListener(
      canvas, keysPressed, cameraState, mouseSensitivity,
      characterState, addedObjects, selectedObjectIndex, objectDragSensitivity
    );
    const unregisterTouchAndWheel = registerTouchAndWheelListeners(canvas, fovRef, keysPressed, selectedObjectIndex, addedObjects);
    const unregisterKeyListeners = registerKeyListeners(canvasRef, gameStarted, setIsAddMenuVisible, keysPressed, null, resumeGame);
    
    let lastTime = performance.now();
    function animate(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      
      if (!gameStartedRef.current) {
        requestAnimationFrame(animate);
        return;
      }
      
      if (!pausedRef.current) {
        const char = characterState.current;
        const forward = { x: Math.sin(cameraState.current.yaw), z: Math.cos(cameraState.current.yaw) };
        const right = { x: Math.cos(cameraState.current.yaw), z: -Math.sin(cameraState.current.yaw) };
        if (keysPressed.current["w"] || keysPressed.current["W"] || keysPressed.current["ArrowUp"]) {
          char.pos.x += forward.x * moveSpeed;
          char.pos.z += forward.z * moveSpeed;
        }
        if (keysPressed.current["s"] || keysPressed.current["S"] || keysPressed.current["ArrowDown"]) {
          char.pos.x -= forward.x * moveSpeed;
          char.pos.z -= forward.z * moveSpeed;
        }
        if (keysPressed.current["a"] || keysPressed.current["A"]) {
          char.pos.x += right.x * moveSpeed;
          char.pos.z += right.z * moveSpeed;
        }
        if (keysPressed.current["d"] || keysPressed.current["D"]) {
          char.pos.x -= right.x * moveSpeed;
          char.pos.z -= right.z * moveSpeed;
        }
        if ((keysPressed.current[" "] || keysPressed.current["Space"]) && char.pos.y === 0) {
          char.verticalVelocity = jumpSpeed;
        }
        char.verticalVelocity += gravity * dt;
        char.pos.y += char.verticalVelocity * dt;
        if (char.pos.y < 0) { char.pos.y = 0; char.verticalVelocity = 0; }
      }
      
      const eyePos = {
        x: characterState.current.pos.x,
        y: characterState.current.pos.y + eyeHeight,
        z: characterState.current.pos.z
      };
      const forwardDir = {
        x: Math.sin(cameraState.current.yaw) * Math.cos(cameraState.current.pitch),
        y: Math.sin(cameraState.current.pitch),
        z: Math.cos(cameraState.current.yaw) * Math.cos(cameraState.current.pitch)
      };
      const viewTarget = {
        x: eyePos.x + forwardDir.x,
        y: eyePos.y + forwardDir.y,
        z: eyePos.z + forwardDir.z
      };
      const viewMatrix = lookAtVec(eyePos, viewTarget, { x: 0, y: 1, z: 0 });
      const projectionMatrix = makeProjectionMatrix(canvas.width, canvas.height, fovRef);
      vpMatricesRef.current = { viewMatrix, projectionMatrix, width: canvas.width, height: canvas.height };

      webglData.gl.clear(webglData.gl.COLOR_BUFFER_BIT | webglData.gl.DEPTH_BUFFER_BIT);
      webglData.gl.uniformMatrix4fv(webglData.uProjectionMatrix, false, projectionMatrix);

      // ------------- Draw Character (always colored) -------------
      {
        const charPos = characterState.current.pos;
        const charModelMatrix = translationMatrix(charPos.x, charPos.y, charPos.z);
        const mvChar = multiply4x4(viewMatrix, charModelMatrix);
        webglData.gl.uniformMatrix4fv(webglData.uModelViewMatrix, false, mvChar);
        // Use basic color for character
        webglData.gl.uniform1i(webglData.uUseTexture, 0);
        webglData.gl.uniform4fv(webglData.uColor, [0.0, 0.4, 1.0, 1.0]);
        // Bind position buffer and set pointer
        webglData.gl.bindBuffer(webglData.gl.ARRAY_BUFFER, webglData.buffers.cubeBuffer);
        webglData.gl.vertexAttribPointer(webglData.aVertexPosition, 3, webglData.gl.FLOAT, false, 0, 0);
        // Bind UV buffer (even if not used, supply dummy UVs)
        webglData.gl.bindBuffer(webglData.gl.ARRAY_BUFFER, webglData.buffers.cubeUVBuffer);
        webglData.gl.vertexAttribPointer(webglData.aTextureCoord, 2, webglData.gl.FLOAT, false, 0, 0);
        webglData.gl.drawArrays(webglData.gl.TRIANGLES, 0, 36);
      }
      
      // ------------- Draw Ground (always colored) -------------
      {
        const groundModelMatrix = translationMatrix(0, 0, 0);
        const mvGround = multiply4x4(viewMatrix, groundModelMatrix);
        webglData.gl.uniformMatrix4fv(webglData.uModelViewMatrix, false, mvGround);
        webglData.gl.uniform1i(webglData.uUseTexture, 0);
        webglData.gl.uniform4fv(webglData.uColor, [0.0, 0.7, 0.0, 1.0]);
        webglData.gl.bindBuffer(webglData.gl.ARRAY_BUFFER, webglData.buffers.groundBuffer);
        webglData.gl.vertexAttribPointer(webglData.aVertexPosition, 3, webglData.gl.FLOAT, false, 0, 0);
        webglData.gl.bindBuffer(webglData.gl.ARRAY_BUFFER, webglData.buffers.groundUVBuffer);
        webglData.gl.vertexAttribPointer(webglData.aTextureCoord, 2, webglData.gl.FLOAT, false, 0, 0);
        webglData.gl.drawArrays(webglData.gl.TRIANGLES, 0, 6);
      }
      
      // ------------- Draw Added Objects (cube, pyramid, pane) -------------
      // UPDATED: Render added objects with different handling for pane textures.
    addedObjects.current.forEach(obj => {
    let posBuffer, uvBuffer, vertexCount, color;
    if (obj.type === "cube") {
        posBuffer = webglData.buffers.cubeBuffer;
        uvBuffer = webglData.buffers.cubeUVBuffer;
        vertexCount = 36;
        color = [1.0, 0.0, 0.0, 1.0];
    } else if (obj.type === "pyramid") {
        posBuffer = webglData.buffers.pyramidBuffer;
        uvBuffer = webglData.buffers.pyramidUVBuffer;
        vertexCount = 18;
        color = [0.5, 0.0, 0.5, 1.0];
    } else if (obj.type === "pane") {
        posBuffer = webglData.buffers.paneBuffer;
        uvBuffer = webglData.buffers.paneUVBuffer;
        vertexCount = 6;
        color = [1.0, 1.0, 0.0, 1.0];
    }


    if (overlayPaneIndex.current !== null) {
    const obj = addedObjects.current[overlayPaneIndex.current];
    if (obj && obj.type === "pane" && obj.lottieSrc && isLottieMedia(obj.lottieSrc)) {
        const finalModel = computeFinalModel(obj);
        // Define local pane corners for a 1x1 quad (centered at origin)
        const corners = [
        [-0.5, -0.5, 0, 1],
        [0.5, -0.5, 0, 1],
        [0.5,  0.5, 0, 1],
        [-0.5,  0.5, 0, 1]
        ];
        let xCoords = [], yCoords = [];
        corners.forEach(corner => {
        const transformed = multiplyMatVec(finalModel, corner);
        const screenPos = computeScreenPosition(
            [transformed[0], transformed[1], transformed[2]],
            viewMatrix, projectionMatrix, canvas.width, canvas.height
        );
        xCoords.push(screenPos.left);
        yCoords.push(screenPos.top);
        });
        const minX = Math.min(...xCoords);
        const maxX = Math.max(...xCoords);
        const minY = Math.min(...yCoords);
        const maxY = Math.max(...yCoords);
        const overlayWidth = maxX - minX;
        const overlayHeight = maxY - minY;
        const overlaySize = Math.min(overlayWidth, overlayHeight);
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        setLottieOverlayPos({ left: centerX, top: centerY, size: overlaySize });
    } else {
        setLottieOverlayPos({ left: -9999, top: -9999, size: 0 });
    }
    }


    // Compute model transformation
    const modelMatrix = translationMatrix(obj.pos.x, obj.pos.y, obj.pos.z);
    const rotMatrix = rotationYMatrix(obj.rotation || 0);
    const scaleMat = scaleMatrix(obj.scale || 1.0);
    const modelRS = multiply4x4(rotMatrix, scaleMat);
    const finalModel = multiply4x4(modelMatrix, modelRS);
    const mvObj = multiply4x4(viewMatrix, finalModel);
    webglData.gl.uniformMatrix4fv(webglData.uModelViewMatrix, false, mvObj);

    // UPDATED: Differentiate between image and Lottie JSON on pane objects.
    // Inside addedObjects.current.forEach(obj => { ... })
    if (obj.lottieSrc && isLottieMedia(obj.lottieSrc)) {
        // (Existing code for Lottie rendering remains here.)
        if (!obj.texture) {
            obj.texture = webglData.gl.createTexture();
            webglData.gl.bindTexture(webglData.gl.TEXTURE_2D, obj.texture);
            webglData.gl.texParameteri(webglData.gl.TEXTURE_2D, webglData.gl.TEXTURE_MIN_FILTER, webglData.gl.LINEAR);
            webglData.gl.texParameteri(webglData.gl.TEXTURE_2D, webglData.gl.TEXTURE_WRAP_S, webglData.gl.CLAMP_TO_EDGE);
            webglData.gl.texParameteri(webglData.gl.TEXTURE_2D, webglData.gl.TEXTURE_WRAP_T, webglData.gl.CLAMP_TO_EDGE);
        }
        updateLottieTexture(webglData.gl, obj);
        webglData.gl.uniform1i(webglData.uUseTexture, 1);
        webglData.gl.activeTexture(webglData.gl.TEXTURE0);
        webglData.gl.bindTexture(webglData.gl.TEXTURE_2D, obj.texture);
        } else if (obj.viewLoaded && obj.viewContainer) {
        // NEW: For pane objects with a rendered view.
        if (!obj.texture) {
            obj.texture = webglData.gl.createTexture();
            webglData.gl.bindTexture(webglData.gl.TEXTURE_2D, obj.texture);
            webglData.gl.texParameteri(webglData.gl.TEXTURE_2D, webglData.gl.TEXTURE_MIN_FILTER, webglData.gl.LINEAR);
            webglData.gl.texParameteri(webglData.gl.TEXTURE_2D, webglData.gl.TEXTURE_WRAP_S, webglData.gl.CLAMP_TO_EDGE);
            webglData.gl.texParameteri(webglData.gl.TEXTURE_2D, webglData.gl.TEXTURE_WRAP_T, webglData.gl.CLAMP_TO_EDGE);
        }
        updateViewTexture(webglData.gl, obj);
        webglData.gl.uniform1i(webglData.uUseTexture, 1);
        webglData.gl.activeTexture(webglData.gl.TEXTURE0);
        webglData.gl.bindTexture(webglData.gl.TEXTURE_2D, obj.texture);
        } else {
        webglData.gl.uniform1i(webglData.uUseTexture, 0);
        webglData.gl.uniform4fv(webglData.uColor, color);
    }




    
    // Bind geometry buffers.
    webglData.gl.bindBuffer(webglData.gl.ARRAY_BUFFER, posBuffer);
    webglData.gl.vertexAttribPointer(webglData.aVertexPosition, 3, webglData.gl.FLOAT, false, 0, 0);
    webglData.gl.bindBuffer(webglData.gl.ARRAY_BUFFER, uvBuffer);
    webglData.gl.vertexAttribPointer(webglData.aTextureCoord, 2, webglData.gl.FLOAT, false, 0, 0);
    webglData.gl.drawArrays(webglData.gl.TRIANGLES, 0, vertexCount);
    });

      
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    
    return () => {
      unregisterKeyListeners && unregisterKeyListeners();
      unregisterPointerLock && unregisterPointerLock();
      unregisterMouseMove && unregisterMouseMove();
      unregisterTouchAndWheel && unregisterTouchAndWheel();
    };
  }, [gameStarted]);

  // -------------------------
  // Lottie Overlay Position Updater
  // -------------------------
  // UPDATED: Lottie Overlay Position Updater with Debug Logging



    async function handleLoadView() {
        const viewName = viewFilePathInput.trim();
        const fileName = viewName.endsWith(".md") ? viewName : viewName + ".md";
        try {
            // Use dc.require to load the view component.
            const { View } = await dc.require(dc.headerLink(fileName, "ViewComponent"));
            // Create a React element from the view.
            const viewElement = <View />;
            // Get the selected pane object.
            const idx = selectedObjectIndex.current;
            if (idx !== null) {
            const obj = addedObjects.current[idx];
            if (obj && obj.type === "pane") {
                // Create an offscreen container if not already created.
                if (!obj.viewContainer) {
                obj.viewContainer = document.createElement("div");
                obj.viewContainer.style.position = "absolute";
                obj.viewContainer.style.width = "512px";  // set desired resolution
                obj.viewContainer.style.height = "512px";
                // Optionally, set a background color or border to help html2canvas capture visible pixels.
                obj.viewContainer.style.backgroundColor = "#fff";
                obj.viewContainer.style.left = "-9999px";
                document.body.appendChild(obj.viewContainer);
                }
                // Render the view into the offscreen container using dc.renderReact:
                dc.renderReact(viewElement, obj.viewContainer);
                obj.viewLoaded = true;
                // Optionally clear any previous Lottie settings.
                obj.lottieSrc = null;
                obj.lottieAnimation = null;
            }
            }
            setIsViewMenuVisible(false);
            if (canvasRef.current) {
            canvasRef.current.requestPointerLock();
            }
        } catch (err) {
            console.error("Error loading view:", err);
        }
    }








  // -------------------------
  // Lottie Menu Handler
  // -------------------------
  // UPDATED: Lottie Menu Handler
    const handleLoadLottie = () => {
        requireMediaFile(lottieFilePathInput)
            .then((url) => {
            console.debug("Loaded media URL:", url);
            const idx = selectedObjectIndex.current;
            if (idx !== null) {
                const obj = addedObjects.current[idx];
                if (obj && obj.type === "pane") {
                // Save the URL to mark this as a Lottie file.
                obj.lottieSrc = url;
                // If no Lottie animation has been set up for this pane, create one.
                if (!obj.lottieAnimation) {
                    // Create an offscreen container (hidden from view).
                    obj.offscreenContainer = document.createElement("div");
                    obj.offscreenContainer.style.position = "absolute";
                    obj.offscreenContainer.style.width = "512px"; // or desired resolution
                    obj.offscreenContainer.style.height = "512px";
                    obj.offscreenContainer.style.left = "-9999px";
                    document.body.appendChild(obj.offscreenContainer);
        
                    // Initialize the Lottie animation using the offscreen container.
                    const animation = lottie.loadAnimation({
                    container: obj.offscreenContainer,
                    renderer: 'canvas',
                    loop: true,
                    autoplay: true,
                    path: url
                    });
        
                    obj.lottieAnimation = animation;
        
                    // After a short delay, retrieve the offscreen canvas that lottie created.
                    setTimeout(() => {
                    const canvasEl = obj.offscreenContainer.querySelector('canvas');
                    if (canvasEl) {
                        obj.offscreenCanvas = canvasEl;
                    }
                    }, 100); // Adjust delay as needed
                }
                }
            }
            setIsLottieMenuVisible(false);
            if (canvasRef.current) {
                canvasRef.current.requestPointerLock();
            }
            })
            .catch((err) => {
            console.error("Error loading media file:", err);
            });
        };





  // -------------------------
  // RENDER COMPONENT (Canvas & Overlays)
  // -------------------------
  return (
    <div style={{
      position: "relative",
      height: "39vh",
      border: "2px solid white",
      borderRadius: "8px",
      overflow: "hidden"
    }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
      
      {/* Start Menu Overlay */}
      {(!gameStarted) && (
        <div style={{
          position: "absolute", top: 0, left: 0,
          width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.7)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          zIndex: 2
        }}>
          <h2 style={{ color: "white" }}>Start Game</h2>
          <button onClick={startGame} style={{ padding: "10px 20px", fontSize: "1rem" }}>Start</button>
        </div>
      )}
      
      {/* Pause Menu Overlay */}
      {isPaused && gameStarted && (
        <div style={{
          position: "absolute", top: 0, left: 0,
          width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          zIndex: 2
        }}>
          <h2 style={{ color: "white" }}>Paused</h2>
          <button onClick={resumeGame} style={{ padding: "10px 20px", fontSize: "1rem" }}>Resume</button>
        </div>
      )}
      
      {/* Add Object Menu Overlay */}
      {isAddMenuVisible && gameStarted && (
        <div onClick={() => { setIsAddMenuVisible(false); resumeGame(); }}
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 3, cursor: "pointer"
          }}>
          <div onClick={e => e.stopPropagation()} style={{
            backgroundColor: "#222", padding: "10px 15px",
            borderRadius: "8px", textAlign: "center",
            cursor: "default", maxWidth: "200px"
          }}>
            <h4 style={{ color: "white", margin: "0 0 10px" }}>Add Object</h4>
            <button onClick={handleAddCube} style={{ padding: "5px 10px", fontSize: "0.9rem", marginBottom: "5px" }}>Add Cube</button><br />
            <button onClick={handleAddPyramid} style={{ padding: "5px 10px", fontSize: "0.9rem", marginBottom: "5px" }}>Add Pyramid</button><br />
            <button onClick={handleAddPane} style={{ padding: "5px 10px", fontSize: "0.9rem" }}>Add Pane</button>
            <p style={{ color: "white", marginTop: "8px", fontSize: "0.8rem" }}>Click outside to return to game</p>
          </div>
        </div>
      )}
      
      {/* Lottie Interaction Menu Overlay */}
      {isLottieMenuVisible && gameStarted && (
        <div
            onClick={() => {
            setIsLottieMenuVisible(false);
            resumeGame();
            }}
            style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3,
            cursor: "pointer"
            }}
        >
            <div
            onClick={(e) => e.stopPropagation()}
            style={{
                backgroundColor: "#222",
                padding: "10px 15px",
                borderRadius: "8px",
                textAlign: "center",
                cursor: "default",
                maxWidth: "300px"
            }}
            >
            <h4 style={{ color: "white", margin: "0 0 10px" }}>Pane Interaction</h4>

            {/* Load Texture Section */}
            <div style={{ marginBottom: "10px" }}>
                <h5 style={{ color: "white", margin: "0 0 5px" }}>Load Texture</h5>
                <input
                type="text"
                value={lottieFilePathInput}
                onChange={(e) => setLottieFilePathInput(e.target.value)}
                placeholder="Enter texture file path"
                style={{ padding: "5px", width: "90%", marginBottom: "5px" }}
                />
                <button
                onClick={handleLoadLottie}
                style={{ padding: "5px 10px", marginBottom: "5px" }}
                >
                Load Texture
                </button>
            </div>

            {/* New Load View Section */}
            <div style={{ marginTop: "10px" }}>
                <h5 style={{ color: "white", margin: "0 0 5px" }}>Load View</h5>
                <input
                type="text"
                value={viewFilePathInput}
                onChange={(e) => setViewFilePathInput(e.target.value)}
                placeholder="Enter view name"
                style={{ padding: "5px", width: "90%", marginBottom: "5px" }}
                />
                <button
                onClick={handleLoadView}
                style={{ padding: "5px 10px", marginBottom: "5px" }}
                >
                Load View
                </button>
            </div>

            <br />
            <button
                onClick={() => setIsLottieMenuVisible(false)}
                style={{ padding: "5px 10px", fontSize: "0.9rem" }}
            >
                Cancel
            </button>
            </div>
        </div>
        )}
        

      
      <h2 style={{ padding: "10px" }}>First-Person Game: Character, Objects, & Pointer Lock</h2>
      <p style={{ padding: "0 10px 10px" }}>
        Click to lock pointer; use WASD/Arrow keys to move (A/D strafe, Space to jump);
        move the mouse to look around.<br />
        Hold Command to manipulate an added object:
        Command only to drag, Command + Option to rotate, Command + Control to scale;
        pinch or Control+mouse wheel to adjust FOV;<br />
        Escape releases pointer lock and pauses the game;
        press I to open the add object menu;<br />
        Press E (while hovering over a pane) to open the texture interaction menu.
      </p>
    </div>
  );
}

return { WorldView };

```
