


# ViewComponent

```jsx
const { useRef, useEffect, useState } = dc;

// ====================
// DOM TRAVERSAL UTILITIES
// ====================

/** Finds the nearest ancestor element with the specified class name. */
function findNearestAncestorWithClass(element, className) {
  if (!element) return null;
  let current = element.parentNode;
  while (current) {
    if (current.classList && current.classList.contains(className)) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

/** Finds a direct child of parent with the specified class name. */
function findDirectChildByClass(parent, className) {
  if (!parent) return null;
  for (const child of parent.children) {
    if (child.classList && child.classList.contains(className)) {
      return child;
    }
  }
  return null;
}

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

/** Creates a ray from camera through screen coordinates for raycasting */
function getRayFromCamera(screenX, screenY, vpMatrices, eyePos) {
  const { viewMatrix, projectionMatrix, width, height } = vpMatrices;
  
  // Convert screen coordinates to NDC (-1 to 1)
  const ndcX = (screenX / width) * 2 - 1;
  const ndcY = 1 - (screenY / height) * 2;
  
  // Create ray in clip space
  const rayClip = [ndcX, ndcY, -1.0, 1.0];
  
  // Convert to view space
  const projInverse = invertMatrix4x4(projectionMatrix);
  const rayEye = multiplyMatVec(projInverse, rayClip);
  rayEye[2] = -1.0;
  rayEye[3] = 0.0;
  
  // Convert to world space
  const viewInverse = invertMatrix4x4(viewMatrix);
  const rayWorld = multiplyMatVec(viewInverse, rayEye);
  
  // Normalize direction
  const length = Math.sqrt(rayWorld[0] * rayWorld[0] + rayWorld[1] * rayWorld[1] + rayWorld[2] * rayWorld[2]);
  const direction = {
    x: rayWorld[0] / length,
    y: rayWorld[1] / length,
    z: rayWorld[2] / length
  };
  
  return {
    origin: eyePos,
    direction: direction
  };
}

/** Ray-AABB intersection test - returns distance or null if no hit */
function rayIntersectAABB(ray, objPos, objScale) {
  const halfScale = { x: objScale.x / 2, y: objScale.y / 2, z: objScale.z / 2 };
  const min = { x: objPos.x - halfScale.x, y: objPos.y - halfScale.y, z: objPos.z - halfScale.z };
  const max = { x: objPos.x + halfScale.x, y: objPos.y + halfScale.y, z: objPos.z + halfScale.z };
  
  const invDirX = 1.0 / ray.direction.x;
  const invDirY = 1.0 / ray.direction.y;
  const invDirZ = 1.0 / ray.direction.z;
  
  const t1 = (min.x - ray.origin.x) * invDirX;
  const t2 = (max.x - ray.origin.x) * invDirX;
  const t3 = (min.y - ray.origin.y) * invDirY;
  const t4 = (max.y - ray.origin.y) * invDirY;
  const t5 = (min.z - ray.origin.z) * invDirZ;
  const t6 = (max.z - ray.origin.z) * invDirZ;
  
  const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
  const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
  
  if (tmax < 0 || tmin > tmax) {
    return null;
  }
  
  return tmin > 0 ? tmin : tmax;
}

/** Inverts a 4x4 matrix (needed for raycasting) */
function invertMatrix4x4(m) {
  const inv = [];
  
  inv[0] = m[5]*m[10]*m[15] - m[5]*m[11]*m[14] - m[9]*m[6]*m[15] + m[9]*m[7]*m[14] + m[13]*m[6]*m[11] - m[13]*m[7]*m[10];
  inv[4] = -m[4]*m[10]*m[15] + m[4]*m[11]*m[14] + m[8]*m[6]*m[15] - m[8]*m[7]*m[14] - m[12]*m[6]*m[11] + m[12]*m[7]*m[10];
  inv[8] = m[4]*m[9]*m[15] - m[4]*m[11]*m[13] - m[8]*m[5]*m[15] + m[8]*m[7]*m[13] + m[12]*m[5]*m[11] - m[12]*m[7]*m[9];
  inv[12] = -m[4]*m[9]*m[14] + m[4]*m[10]*m[13] + m[8]*m[5]*m[14] - m[8]*m[6]*m[13] - m[12]*m[5]*m[10] + m[12]*m[6]*m[9];
  inv[1] = -m[1]*m[10]*m[15] + m[1]*m[11]*m[14] + m[9]*m[2]*m[15] - m[9]*m[3]*m[14] - m[13]*m[2]*m[11] + m[13]*m[3]*m[10];
  inv[5] = m[0]*m[10]*m[15] - m[0]*m[11]*m[14] - m[8]*m[2]*m[15] + m[8]*m[3]*m[14] + m[12]*m[2]*m[11] - m[12]*m[3]*m[10];
  inv[9] = -m[0]*m[9]*m[15] + m[0]*m[11]*m[13] + m[8]*m[1]*m[15] - m[8]*m[3]*m[13] - m[12]*m[1]*m[11] + m[12]*m[3]*m[9];
  inv[13] = m[0]*m[9]*m[14] - m[0]*m[10]*m[13] - m[8]*m[1]*m[14] + m[8]*m[2]*m[13] + m[12]*m[1]*m[10] - m[12]*m[2]*m[9];
  inv[2] = m[1]*m[6]*m[15] - m[1]*m[7]*m[14] - m[5]*m[2]*m[15] + m[5]*m[3]*m[14] + m[13]*m[2]*m[7] - m[13]*m[3]*m[6];
  inv[6] = -m[0]*m[6]*m[15] + m[0]*m[7]*m[14] + m[4]*m[2]*m[15] - m[4]*m[3]*m[14] - m[12]*m[2]*m[7] + m[12]*m[3]*m[6];
  inv[10] = m[0]*m[5]*m[15] - m[0]*m[7]*m[13] - m[4]*m[1]*m[15] + m[4]*m[3]*m[13] + m[12]*m[1]*m[7] - m[12]*m[3]*m[5];
  inv[14] = -m[0]*m[5]*m[14] + m[0]*m[6]*m[13] + m[4]*m[1]*m[14] - m[4]*m[2]*m[13] - m[12]*m[1]*m[6] + m[12]*m[2]*m[5];
  inv[3] = -m[1]*m[6]*m[11] + m[1]*m[7]*m[10] + m[5]*m[2]*m[11] - m[5]*m[3]*m[10] - m[9]*m[2]*m[7] + m[9]*m[3]*m[6];
  inv[7] = m[0]*m[6]*m[11] - m[0]*m[7]*m[10] - m[4]*m[2]*m[11] + m[4]*m[3]*m[10] + m[8]*m[2]*m[7] - m[8]*m[3]*m[6];
  inv[11] = -m[0]*m[5]*m[11] + m[0]*m[7]*m[9] + m[4]*m[1]*m[11] - m[4]*m[3]*m[9] - m[8]*m[1]*m[7] + m[8]*m[3]*m[5];
  inv[15] = m[0]*m[5]*m[10] - m[0]*m[6]*m[9] - m[4]*m[1]*m[10] + m[4]*m[2]*m[9] + m[8]*m[1]*m[6] - m[8]*m[2]*m[5];
  
  const det = m[0]*inv[0] + m[1]*inv[4] + m[2]*inv[8] + m[3]*inv[12];
  
  if (det === 0) {
    return m; // Return original if not invertible
  }
  
  const invDet = 1.0 / det;
  return inv.map(v => v * invDet);
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
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
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

function registerKeyListeners(canvasRef, gameStarted, setIsAddMenuVisible, setShowInstructions, setShowKeyHelper, setEnableTrails, setEnableWireframe, setShowStats, setTimeOfDay, keysPressed, draggingPyramid, resumeGame, draggingCloneRef, clonedObjectRef, setIsDraggingClone, setClonedObject, vpMatricesRef, eyePosRef, addedObjects) {
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
    if (e.key.toLowerCase() === "h") {
      setShowInstructions((prev) => {
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
    if (e.key.toLowerCase() === "k") {
      setShowKeyHelper(true); // Show when pressed
      e.preventDefault();
      return;
    }
    // Experimental features
    if (e.key.toLowerCase() === "t") {
      setEnableTrails((prev) => !prev);
      e.preventDefault();
      return;
    }
    if (e.key.toLowerCase() === "g") {
      setEnableWireframe((prev) => !prev);
      e.preventDefault();
      return;
    }
    if (e.key.toLowerCase() === "f") {
      setShowStats((prev) => !prev);
      e.preventDefault();
      return;
    }
    if (e.key.toLowerCase() === "n") {
      setTimeOfDay((prev) => (prev + 0.1) % 1);
      e.preventDefault();
      return;
    }
    // Delete object with Backspace/Delete - point at object to delete
    if (e.key === "Backspace" || e.key === "Delete") {
      // First check if pointing at an object via raycast
      const canvas = canvasRef.current;
      if (!canvas || !vpMatricesRef.current || !eyePosRef.current) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = rect.width / 2;
      const mouseY = rect.height / 2;
      
      const ray = getRayFromCamera(mouseX, mouseY, vpMatricesRef.current, eyePosRef.current);
      let closestObjIndex = null;
      let closestDist = Infinity;
      
      addedObjects.current.forEach((obj, idx) => {
        const dist = rayIntersectAABB(ray, obj.pos, obj.scale || { x: 1, y: 1, z: 1 });
        if (dist !== null && dist < closestDist) {
          closestDist = dist;
          closestObjIndex = idx;
        }
      });
      
      if (closestObjIndex !== null) {
        addedObjects.current.splice(closestObjIndex, 1);
        selectedObjectIndex.current = null;
        e.preventDefault();
        return;
      }
    }
    // Clone selected object with C - starts drag mode
    if (e.key.toLowerCase() === "c" && !draggingCloneRef.current) {
      // Check if pointing at an object via raycast
      const canvas = canvasRef.current;
      if (!canvas || !vpMatricesRef.current) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = rect.width / 2;
      const mouseY = rect.height / 2;
      
      const ray = getRayFromCamera(mouseX, mouseY, vpMatricesRef.current, eyePosRef.current);
      let closestObj = null;
      let closestDist = Infinity;
      
      addedObjects.current.forEach((obj, idx) => {
        const dist = rayIntersectAABB(ray, obj.pos, obj.scale || { x: 1, y: 1, z: 1 });
        if (dist !== null && dist < closestDist) {
          closestDist = dist;
          closestObj = { ...obj, index: idx };
        }
      });
      
      if (closestObj) {
        // Create clone and start dragging
        const cloned = {
          ...closestObj,
          pos: { ...closestObj.pos },
          rotation: closestObj.rotation || 0,
          scale: { ...closestObj.scale }
        };
        delete cloned.index;
        
        draggingCloneRef.current = true;
        clonedObjectRef.current = cloned;
        setIsDraggingClone(true);
        setClonedObject(cloned);
        
        e.preventDefault();
        return;
      }
    }
    if (e.key === " " || e.key === "Space") {
      e.preventDefault();
    }
    keysPressed.current[e.key] = true;
    // Handle Shift variations
    if (e.key === "Shift" || e.key === "ShiftLeft" || e.key === "ShiftRight") {
      keysPressed.current["Shift"] = true;
      keysPressed.current["ShiftLeft"] = true;
      keysPressed.current["ShiftRight"] = true;
    }
  };

  const handleKeyUp = (e) => {
    keysPressed.current[e.key] = false;
    // Handle Shift variations - clear all when any Shift is released
    if (e.key === "Shift" || e.key === "ShiftLeft" || e.key === "ShiftRight") {
      keysPressed.current["Shift"] = false;
      keysPressed.current["ShiftLeft"] = false;
      keysPressed.current["ShiftRight"] = false;
    }
    if (e.key === "Meta") {
      if (draggingPyramid) draggingPyramid.current = false;
    }
    // Hide key helper when K is released
    if (e.key.toLowerCase() === "k") {
      setShowKeyHelper(false);
    }
    // Place cloned object when C is released
    if (e.key.toLowerCase() === "c" && draggingCloneRef.current && clonedObjectRef.current) {
      addedObjects.current.push({ ...clonedObjectRef.current });
      draggingCloneRef.current = false;
      clonedObjectRef.current = null;
      setIsDraggingClone(false);
      setClonedObject(null);
      e.preventDefault();
    }
  };
  
  // Handle window blur to prevent stuck keys
  const handleBlur = () => {
    keysPressed.current = {};
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", handleBlur);
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("blur", handleBlur);
  };
}

function registerPointerLockListeners(canvas, setIsPaused, pausedRef, keysPressed) {
  const pointerLockChange = () => {
    if (document.pointerLockElement === canvas) {
      pausedRef.current = false;
      setIsPaused(false);
      console.log("Pointer locked. Resuming game.");
    } else {
      pausedRef.current = true;
      setIsPaused(true);
      keysPressed.current = {}; // Clear all keys when pointer unlocks
      console.log("Pointer unlocked. Game paused.");
    }
  };
  document.addEventListener("pointerlockchange", pointerLockChange);
  return () => document.removeEventListener("pointerlockchange", pointerLockChange);
}

function registerMouseMoveListener(canvas, keysPressed, cameraState, mouseSensitivity, characterState, addedObjects, selectedObjectIndex, objectDragSensitivity, draggingCloneRef, clonedObjectRef, vpMatricesRef, eyePosRef) {
  const handleMouseMove = (e) => {
    if (document.pointerLockElement === canvas) {
      // Handle clone dragging
      if (draggingCloneRef.current && clonedObjectRef.current) {
        // Update clone position based on camera direction
        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();
        const mouseX = rect.width / 2;
        const mouseY = rect.height / 2;
        
        if (vpMatricesRef.current && eyePosRef.current) {
          const ray = getRayFromCamera(mouseX, mouseY, vpMatricesRef.current, eyePosRef.current);
          // Project ray forward a fixed distance (e.g., 5 units)
          const distance = 5;
          clonedObjectRef.current.pos.x = eyePosRef.current.x + ray.direction.x * distance;
          clonedObjectRef.current.pos.y = eyePosRef.current.y + ray.direction.y * distance;
          clonedObjectRef.current.pos.z = eyePosRef.current.z + ray.direction.z * distance;
        }
        return; // Don't process other mouse movements while dragging clone
      }
      
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
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;

  // --- State for full-tab mode ---
  const [isFullTab, setIsFullTab] = useState(true);
  const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `game-engine-wrapper-${instanceId}`;

  // --- State for game & menus ---
  const [gameStarted, setGameStarted] = useState(false);
  const gameStartedRef = useRef(false);
  useEffect(() => { gameStartedRef.current = gameStarted; }, [gameStarted]);

  const [isAddMenuVisible, setIsAddMenuVisible] = useState(false);
  const addMenuVisibleRef = useRef(isAddMenuVisible);
  useEffect(() => { addMenuVisibleRef.current = isAddMenuVisible; }, [isAddMenuVisible]);

  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false);

  const [showInstructions, setShowInstructions] = useState(false);
  const [showKeyHelper, setShowKeyHelper] = useState(false); // Changed to false by default
  
  // --- Experimental Features ---
  const [timeOfDay, setTimeOfDay] = useState(0); // 0-1 for day/night cycle
  const [enableTrails, setEnableTrails] = useState(false);
  const [enableWireframe, setEnableWireframe] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [currentFps, setCurrentFps] = useState(60); // State for display
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());
  
  // --- Clone Dragging State ---
  const [isDraggingClone, setIsDraggingClone] = useState(false);
  const [clonedObject, setClonedObject] = useState(null);
  const draggingCloneRef = useRef(false);
  const clonedObjectRef = useRef(null);

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

  // --- Full-tab mode effect ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isFullTab) return;

    const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
    if (!targetPaneContent) {
      setIsFullTab(false);
      return;
    }

    const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;
    stateRefs.originalParent = container.parentNode;
    stateRefs.placeholder = document.createElement("div");
    stateRefs.placeholder.style.display = "none";
    container.parentNode.insertBefore(stateRefs.placeholder, container);

    stateRefs.parentPositionInfo = {
      element: contentWrapper,
      original: window.getComputedStyle(contentWrapper).position,
    };
    if (stateRefs.parentPositionInfo.original === "static") {
      contentWrapper.style.position = "relative";
    }

    contentWrapper.appendChild(container);
    Object.assign(container.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "9998",
      overflow: "auto",
    });

    return () => {
      if (stateRefs.placeholder?.parentNode) {
        stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
      }
      if (stateRefs.parentPositionInfo?.element) {
        stateRefs.parentPositionInfo.element.style.position =
          stateRefs.parentPositionInfo.original === "static" ? "" : stateRefs.parentPositionInfo.original;
      }
      container.removeAttribute("style");
      Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
    };
  }, [isFullTab]);




  // --- Refs for game state & objects ---
  const addedObjects = useRef([]);
  const characterState = useRef({ pos: { x: 0, y: 0, z: 0 }, verticalVelocity: 0 });
  const cameraState = useRef({ yaw: 0, pitch: 0 });
  const selectedObjectIndex = useRef(null);
  const fovRef = useRef(45 * Math.PI / 180);
  const keysPressed = useRef({});

  // --- Ref for view/projection matrices & canvas size (for overlay positioning) ---
  const vpMatricesRef = useRef({ viewMatrix: null, projectionMatrix: null, width: 800, height: 400 });
  const eyePosRef = useRef({ x: 0, y: 0, z: 0 });

  // --- Gameplay Constants ---
  const gravity = -9.8;
  const moveSpeed = 0.12;
  const sprintMultiplier = 1.8;
  const jumpSpeed = 5.5;
  const mouseSensitivity = 0.005;
  const objectDragSensitivity = 0.01;
  const eyeHeight = 0.8;

  // -------------------------
  // GAME CONTROL FUNCTIONS
  // -------------------------
  const handleExitFullTab = (e) => {
    e.stopPropagation();
    setIsFullTab(false);
  };

  const handleEnterFullTab = () => setIsFullTab(true);

  const resumeGame = () => {
    keysPressed.current = {};
    if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };
  
  const closePauseMenu = () => {
    keysPressed.current = {};
    setIsPaused(false);
    // Don't request pointer lock here - let the canvas click handler do it
  };

  const startGame = () => {
    setGameStarted(true);
    
    // Spawn random objects around the map
    const objectTypes = ["cube", "pyramid", "pane"];
    const objectCount = Math.floor(Math.random() * 11) + 15; // 15-25 objects
    
    for (let i = 0; i < objectCount; i++) {
      const randomType = objectTypes[Math.floor(Math.random() * objectTypes.length)];
      const randomX = (Math.random() - 0.5) * 100; // -50 to 50
      const randomZ = (Math.random() - 0.5) * 100; // -50 to 50
      const randomY = Math.random() * 3; // 0 to 3
      const randomRotation = Math.random() * Math.PI * 2;
      const randomScale = 0.5 + Math.random() * 1.5; // 0.5 to 2.0
      
      addedObjects.current.push({
        type: randomType,
        pos: { x: randomX, y: randomY, z: randomZ },
        rotation: randomRotation,
        scale: { x: randomScale, y: randomScale, z: randomScale },
        texture: null
      });
    }
    
    if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  // -------------------------
  // START GAME LISTENERS (Spacebar, Enter, Click)
  // -------------------------
  useEffect(() => {
    if (gameStarted) return; // Only listen when game hasn't started
    
    const handleStartKeys = (e) => {
      if (e.key === " " || e.key === "Enter") {
        startGame();
        e.preventDefault();
      }
    };
    
    const handleStartClick = () => {
      if (!gameStarted) {
        startGame();
      }
    };
    
    window.addEventListener("keydown", handleStartKeys);
    window.addEventListener("click", handleStartClick);
    
    return () => {
      window.removeEventListener("keydown", handleStartKeys);
      window.removeEventListener("click", handleStartClick);
    };
  }, [gameStarted]);

  // -------------------------
  // OBJECT SPAWNING FUNCTIONS
  // -------------------------
  const handleAddCube = () => spawnObject("cube", characterState, cameraState, addedObjects);
  const handleAddPyramid = () => spawnObject("pyramid", characterState, cameraState, addedObjects);
  const handleAddPane = () => spawnObject("pane", characterState, cameraState, addedObjects);

  // -------------------------
  // NUMPAD SUPPORT FOR ADD MENU
  // -------------------------
  useEffect(() => {
    const handleNumpad = (e) => {
      if (isAddMenuVisible) {
        if (e.key === "1" || e.key === "Numpad1") {
          handleAddCube();
          setIsAddMenuVisible(false);
          resumeGame();
          e.preventDefault();
        } else if (e.key === "2" || e.key === "Numpad2") {
          handleAddPyramid();
          setIsAddMenuVisible(false);
          resumeGame();
          e.preventDefault();
        } else if (e.key === "3" || e.key === "Numpad3") {
          handleAddPane();
          setIsAddMenuVisible(false);
          resumeGame();
          e.preventDefault();
        } else if (e.key === "4" || e.key === "Numpad4") {
          handleAddCube(); // Sphere placeholder
          setIsAddMenuVisible(false);
          resumeGame();
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", handleNumpad);
    return () => window.removeEventListener("keydown", handleNumpad);
  }, [isAddMenuVisible]);

  // -------------------------
  // GLOBAL ESC KEY HANDLER FOR MENUS
  // -------------------------
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        // Close menus in priority order
        if (showInstructions) {
          setShowInstructions(false);
          closePauseMenu(); // Use closePauseMenu instead of resumeGame
          e.preventDefault();
          e.stopPropagation();
        } else if (isAddMenuVisible) {
          setIsAddMenuVisible(false);
          closePauseMenu();
          e.preventDefault();
          e.stopPropagation();
        } else if (isLottieMenuVisible) {
          setIsLottieMenuVisible(false);
          closePauseMenu();
          e.preventDefault();
          e.stopPropagation();
        } else if (showKeyHelper) {
          setShowKeyHelper(false);
          e.preventDefault();
          e.stopPropagation();
        } else if (isPaused && gameStarted) {
          // Just close pause menu, pointer lock will happen on canvas click
          closePauseMenu();
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    window.addEventListener("keydown", handleEscape, true); // Use capture phase
    return () => window.removeEventListener("keydown", handleEscape, true);
  }, [showInstructions, isAddMenuVisible, isLottieMenuVisible, showKeyHelper, isPaused, gameStarted]);

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
    
    const unregisterPointerLock = registerPointerLockListeners(canvas, setIsPaused, pausedRef, keysPressed);
    const unregisterMouseMove = registerMouseMoveListener(
      canvas, keysPressed, cameraState, mouseSensitivity,
      characterState, addedObjects, selectedObjectIndex, objectDragSensitivity,
      draggingCloneRef, clonedObjectRef, vpMatricesRef, eyePosRef
    );
    const unregisterTouchAndWheel = registerTouchAndWheelListeners(canvas, fovRef, keysPressed, selectedObjectIndex, addedObjects);
    const unregisterKeyListeners = registerKeyListeners(canvasRef, gameStarted, setIsAddMenuVisible, setShowInstructions, setShowKeyHelper, setEnableTrails, setEnableWireframe, setShowStats, setTimeOfDay, keysPressed, null, resumeGame, draggingCloneRef, clonedObjectRef, setIsDraggingClone, setClonedObject, vpMatricesRef, eyePosRef, addedObjects);
    
    let lastTime = performance.now();
    function animate(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      
      // FPS tracking - update state for display
      frameCountRef.current++;
      if (now - lastFpsUpdateRef.current >= 1000) {
        const fps = Math.round(frameCountRef.current / ((now - lastFpsUpdateRef.current) / 1000));
        setCurrentFps(fps);
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }
      
      if (!gameStartedRef.current) {
        requestAnimationFrame(animate);
        return;
      }
      
      if (!pausedRef.current) {
        const char = characterState.current;
        const forward = { x: Math.sin(cameraState.current.yaw), z: Math.cos(cameraState.current.yaw) };
        const right = { x: Math.cos(cameraState.current.yaw), z: -Math.sin(cameraState.current.yaw) };
        
        // Check if any movement key is pressed
        const isMoving = keysPressed.current["w"] || keysPressed.current["W"] || keysPressed.current["ArrowUp"] ||
                         keysPressed.current["s"] || keysPressed.current["S"] || keysPressed.current["ArrowDown"] ||
                         keysPressed.current["a"] || keysPressed.current["A"] ||
                         keysPressed.current["d"] || keysPressed.current["D"];
        
        // Only check sprint if actually moving
        const isSprinting = isMoving && (keysPressed.current["Shift"] || keysPressed.current["ShiftLeft"] || keysPressed.current["ShiftRight"]);
        const currentSpeed = moveSpeed * (isSprinting ? sprintMultiplier : 1.0);
        
        if (keysPressed.current["w"] || keysPressed.current["W"] || keysPressed.current["ArrowUp"]) {
          char.pos.x += forward.x * currentSpeed;
          char.pos.z += forward.z * currentSpeed;
        }
        if (keysPressed.current["s"] || keysPressed.current["S"] || keysPressed.current["ArrowDown"]) {
          char.pos.x -= forward.x * currentSpeed;
          char.pos.z -= forward.z * currentSpeed;
        }
        if (keysPressed.current["a"] || keysPressed.current["A"]) {
          char.pos.x += right.x * currentSpeed;
          char.pos.z += right.z * currentSpeed;
        }
        if (keysPressed.current["d"] || keysPressed.current["D"]) {
          char.pos.x -= right.x * currentSpeed;
          char.pos.z -= right.z * currentSpeed;
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
      eyePosRef.current = eyePos; // Store in ref for raycasting
      
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

      // Set sky color based on time of day (night cycle)
      const skyBrightness = 0.0 + (Math.sin(timeOfDay * Math.PI * 2) * 0.15);
      const skyPurple = 0.0 + (Math.sin(timeOfDay * Math.PI * 2) * 0.08);
      webglData.gl.clearColor(skyBrightness * 0.5, skyBrightness * 0.5, skyBrightness + skyPurple, 1.0);

      // Trail effect: use partial clear for motion blur
      if (enableTrails) {
        // Draw a semi-transparent black quad over everything for fade effect
        webglData.gl.enable(webglData.gl.BLEND);
        webglData.gl.blendFunc(webglData.gl.SRC_ALPHA, webglData.gl.ONE_MINUS_SRC_ALPHA);
        webglData.gl.depthMask(false);
        
        // Only clear depth, not color (to keep previous frame)
        webglData.gl.clear(webglData.gl.DEPTH_BUFFER_BIT);
        
        // Draw fade overlay
        webglData.gl.uniform1i(webglData.uUseTexture, 0);
        webglData.gl.uniform4fv(webglData.uColor, [0.0, 0.0, 0.0, 0.15]); // Black with 15% opacity
        
        webglData.gl.depthMask(true);
        webglData.gl.disable(webglData.gl.BLEND);
      } else {
        webglData.gl.clear(webglData.gl.COLOR_BUFFER_BIT | webglData.gl.DEPTH_BUFFER_BIT);
      }
      
      webglData.gl.uniformMatrix4fv(webglData.uProjectionMatrix, false, projectionMatrix);

      // ------------- Draw Character (always colored) -------------
      {
        const charPos = characterState.current.pos;
        const charModelMatrix = translationMatrix(charPos.x, charPos.y, charPos.z);
        const mvChar = multiply4x4(viewMatrix, charModelMatrix);
        webglData.gl.uniformMatrix4fv(webglData.uModelViewMatrix, false, mvChar);
        // Use basic color for character - purple accent
        webglData.gl.uniform1i(webglData.uUseTexture, 0);
        webglData.gl.uniform4fv(webglData.uColor, [0.615, 0.486, 0.808, 1.0]); // #9d7cce
        // Bind position buffer and set pointer
        webglData.gl.bindBuffer(webglData.gl.ARRAY_BUFFER, webglData.buffers.cubeBuffer);
        webglData.gl.vertexAttribPointer(webglData.aVertexPosition, 3, webglData.gl.FLOAT, false, 0, 0);
        // Bind UV buffer (even if not used, supply dummy UVs)
        webglData.gl.bindBuffer(webglData.gl.ARRAY_BUFFER, webglData.buffers.cubeUVBuffer);
        webglData.gl.vertexAttribPointer(webglData.aTextureCoord, 2, webglData.gl.FLOAT, false, 0, 0);
        
        // Draw with or without wireframe
        if (enableWireframe) {
          // Draw as lines with LINE_LOOP for each face (6 faces, 4 vertices each)
          webglData.gl.drawArrays(webglData.gl.LINE_STRIP, 0, 5);
          webglData.gl.drawArrays(webglData.gl.LINE_STRIP, 4, 5);
          webglData.gl.drawArrays(webglData.gl.LINE_STRIP, 8, 5);
          webglData.gl.drawArrays(webglData.gl.LINE_STRIP, 12, 5);
          webglData.gl.drawArrays(webglData.gl.LINE_STRIP, 16, 5);
          webglData.gl.drawArrays(webglData.gl.LINE_STRIP, 20, 5);
        } else {
          webglData.gl.drawArrays(webglData.gl.TRIANGLES, 0, 36);
        }
      }
      
      // ------------- Draw Ground (always colored) -------------
      {
        const groundModelMatrix = translationMatrix(0, 0, 0);
        const mvGround = multiply4x4(viewMatrix, groundModelMatrix);
        webglData.gl.uniformMatrix4fv(webglData.uModelViewMatrix, false, mvGround);
        webglData.gl.uniform1i(webglData.uUseTexture, 0);
        
        // Dynamic ground color based on time of day (more dramatic variation)
        const brightness = 0.1 + (Math.sin(timeOfDay * Math.PI * 2) * 0.15);
        const purpleTint = 0.15 + (Math.cos(timeOfDay * Math.PI * 2) * 0.12);
        webglData.gl.uniform4fv(webglData.uColor, [brightness * 0.7, brightness * 0.6, purpleTint, 1.0]);
        
        webglData.gl.bindBuffer(webglData.gl.ARRAY_BUFFER, webglData.buffers.groundBuffer);
        webglData.gl.vertexAttribPointer(webglData.aVertexPosition, 3, webglData.gl.FLOAT, false, 0, 0);
        webglData.gl.bindBuffer(webglData.gl.ARRAY_BUFFER, webglData.buffers.groundUVBuffer);
        webglData.gl.vertexAttribPointer(webglData.aTextureCoord, 2, webglData.gl.FLOAT, false, 0, 0);
        
        if (enableWireframe) {
          webglData.gl.drawArrays(webglData.gl.LINE_LOOP, 0, 4);
        } else {
          webglData.gl.drawArrays(webglData.gl.TRIANGLES, 0, 6);
        }
      }
      
      // ------------- Draw Added Objects (cube, pyramid, pane) -------------
      // UPDATED: Render added objects with different handling for pane textures.
    addedObjects.current.forEach(obj => {
    let posBuffer, uvBuffer, vertexCount, color;
    if (obj.type === "cube") {
        posBuffer = webglData.buffers.cubeBuffer;
        uvBuffer = webglData.buffers.cubeUVBuffer;
        vertexCount = 36;
        color = [0.694, 0.612, 0.851, 1.0]; // #b19cd9 - lighter purple
    } else if (obj.type === "pyramid") {
        posBuffer = webglData.buffers.pyramidBuffer;
        uvBuffer = webglData.buffers.pyramidUVBuffer;
        vertexCount = 18;
        color = [0.533, 0.533, 0.533, 1.0]; // #888888 - medium gray
    } else if (obj.type === "pane") {
        posBuffer = webglData.buffers.paneBuffer;
        uvBuffer = webglData.buffers.paneUVBuffer;
        vertexCount = 6;
        color = [0.615, 0.486, 0.808, 1.0]; // #9d7cce - primary purple
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
    
    if (enableWireframe) {
      // Draw wireframe based on object type
      if (obj.type === "cube") {
        // 6 faces, draw line strips for each
        for (let i = 0; i < 6; i++) {
          webglData.gl.drawArrays(webglData.gl.LINE_LOOP, i * 6, 4);
        }
      } else if (obj.type === "pyramid") {
        // Draw pyramid wireframe (base + 4 triangular faces)
        webglData.gl.drawArrays(webglData.gl.LINE_LOOP, 0, 3); // base
        webglData.gl.drawArrays(webglData.gl.LINE_STRIP, 3, 4); // edges to apex
        webglData.gl.drawArrays(webglData.gl.LINE_STRIP, 6, 4);
        webglData.gl.drawArrays(webglData.gl.LINE_STRIP, 9, 4);
        webglData.gl.drawArrays(webglData.gl.LINE_STRIP, 12, 4);
      } else {
        // Pane - just outline
        webglData.gl.drawArrays(webglData.gl.LINE_LOOP, 0, 4);
      }
    } else {
      webglData.gl.drawArrays(webglData.gl.TRIANGLES, 0, vertexCount);
    }
    });

      // ------------- Draw Clone Being Dragged (semi-transparent) -------------
      if (draggingCloneRef.current && clonedObjectRef.current) {
        const obj = clonedObjectRef.current;
        let posBuffer, uvBuffer, vertexCount, color;
        
        if (obj.type === "cube") {
          posBuffer = webglData.buffers.cubeBuffer;
          uvBuffer = webglData.buffers.cubeUVBuffer;
          vertexCount = 36;
          color = [0.694, 0.612, 0.851, 0.5]; // Semi-transparent purple
        } else if (obj.type === "pyramid") {
          posBuffer = webglData.buffers.pyramidBuffer;
          uvBuffer = webglData.buffers.pyramidUVBuffer;
          vertexCount = 18;
          color = [0.533, 0.533, 0.533, 0.5]; // Semi-transparent gray
        } else if (obj.type === "pane") {
          posBuffer = webglData.buffers.paneBuffer;
          uvBuffer = webglData.buffers.paneUVBuffer;
          vertexCount = 6;
          color = [0.4, 0.4, 0.4, 0.5]; // Semi-transparent gray
        }
        
        // Enable blending for transparency
        webglData.gl.enable(webglData.gl.BLEND);
        webglData.gl.blendFunc(webglData.gl.SRC_ALPHA, webglData.gl.ONE_MINUS_SRC_ALPHA);
        
        const scale = obj.scale || { x: 1, y: 1, z: 1 };
        const rotation = obj.rotation || 0;
        let modelMatrix = translationMatrix(obj.pos.x, obj.pos.y, obj.pos.z);
        modelMatrix = multiply4x4(modelMatrix, rotationYMatrix(rotation));
        modelMatrix = multiply4x4(modelMatrix, scaleMatrix(scale.x, scale.y, scale.z));
        const mvClone = multiply4x4(viewMatrix, modelMatrix);
        
        webglData.gl.uniformMatrix4fv(webglData.uModelViewMatrix, false, mvClone);
        webglData.gl.uniform1i(webglData.uUseTexture, 0);
        webglData.gl.uniform4fv(webglData.uColor, color);
        
        webglData.gl.bindBuffer(webglData.gl.ARRAY_BUFFER, posBuffer);
        webglData.gl.vertexAttribPointer(webglData.aVertexPosition, 3, webglData.gl.FLOAT, false, 0, 0);
        webglData.gl.bindBuffer(webglData.gl.ARRAY_BUFFER, uvBuffer);
        webglData.gl.vertexAttribPointer(webglData.aTextureCoord, 2, webglData.gl.FLOAT, false, 0, 0);
        
        // Always draw as wireframe for clone preview
        if (obj.type === "cube") {
          for (let i = 0; i < 6; i++) {
            webglData.gl.drawArrays(webglData.gl.LINE_LOOP, i * 6, 4);
          }
        } else if (obj.type === "pyramid") {
          webglData.gl.drawArrays(webglData.gl.LINE_LOOP, 0, 3);
          webglData.gl.drawArrays(webglData.gl.LINE_STRIP, 3, 4);
          webglData.gl.drawArrays(webglData.gl.LINE_STRIP, 6, 4);
          webglData.gl.drawArrays(webglData.gl.LINE_STRIP, 9, 4);
          webglData.gl.drawArrays(webglData.gl.LINE_STRIP, 12, 4);
        } else {
          webglData.gl.drawArrays(webglData.gl.LINE_LOOP, 0, 4);
        }
        
        webglData.gl.disable(webglData.gl.BLEND);
      }
      
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
  
  // Compact mode fallback
  if (!isFullTab) {
    return (
      <div ref={containerRef} style={{
        padding: "16px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        border: "1px dashed var(--background-modifier-border)",
        borderRadius: "8px",
        backgroundColor: "var(--background-primary-alt)",
      }}>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "14px" }}>
          Game Engine is in compact mode.
        </p>
        <button 
          style={{
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: "500",
            color: "var(--text-on-accent)",
            backgroundColor: "var(--interactive-accent)",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          onClick={handleEnterFullTab}
        >
          Enter Full Tab
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={uniqueWrapperClass}>
      <style>
        {`.${uniqueWrapperClass} .subtle-icon {
          opacity: 0;
          transform: scale(0.9);
          transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
        }
        .${uniqueWrapperClass}:hover .subtle-icon {
          opacity: 0.7;
          transform: scale(1);
        }
        .${uniqueWrapperClass} .subtle-icon:hover {
          opacity: 1;
        }
        .${uniqueWrapperClass} .subtle-icon:hover .exit-tooltip {
          visibility: visible;
          opacity: 1;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }`}
      </style>
      <div style={{
        position: "relative",
        height: "100%",
        width: "100%",
        border: "2px solid white",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "#000000"
      }}>
        {/* Exit Full Tab Button */}
        <div
          style={{
            position: "absolute",
            top: "15px",
            right: "20px",
            fontFamily: "monospace",
            fontSize: "14px",
            color: "var(--text-faint)",
            userSelect: "none",
            cursor: "pointer",
            zIndex: 10000,
          }}
          className="subtle-icon"
          onClick={handleExitFullTab}
        >
          {"</>"}
          <span 
            className="exit-tooltip"
            style={{
              visibility: "hidden",
              opacity: 0,
              backgroundColor: "var(--background-secondary-alt)",
              color: "var(--text-normal)",
              textAlign: "center",
              borderRadius: "4px",
              padding: "5px 10px",
              position: "absolute",
              zIndex: 1,
              top: "50%",
              right: "120%",
              transform: "translateY(-50%)",
              fontSize: "12px",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              border: "1px solid var(--background-modifier-border)",
            }}
          >
            Close Full Mode
          </span>
        </div>

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
          backgroundColor: "#000000",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          zIndex: 2,
          padding: "20px",
          boxSizing: "border-box"
        }}>
          <h1 style={{ 
            color: "#9d7cce", 
            marginBottom: "40px",
            fontSize: "2.5rem",
            fontWeight: "300",
            letterSpacing: "4px",
            textTransform: "uppercase",
            textShadow: "0 0 20px rgba(157, 124, 206, 0.5)"
          }}>Game Engine</h1>
          
          <div style={{
            backgroundColor: "rgba(20,20,20,0.8)",
            padding: "30px",
            borderRadius: "4px",
            marginBottom: "30px",
            maxWidth: "500px",
            width: "100%",
            border: "1px solid rgba(157, 124, 206, 0.2)",
            boxShadow: "0 0 30px rgba(157, 124, 206, 0.1)"
          }}>
            <h3 style={{ 
              color: "#b19cd9", 
              marginTop: 0,
              fontSize: "1.1rem",
              fontWeight: "400",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "25px"
            }}>Controls</h3>
            
            <div style={{ color: "#888", textAlign: "left", fontSize: "13px", lineHeight: "2" }}>
              <p style={{ marginBottom: "20px" }}>
                <strong style={{ color: "#9d7cce", letterSpacing: "1px" }}>MOVEMENT</strong><br/>
                <span style={{ color: "#666" }}>{"W A S D"}</span> {"— Move around"}<br/>
                <span style={{ color: "#666" }}>{"Shift"}</span> {"— Sprint (hold)"}<br/>
                <span style={{ color: "#666" }}>{"Space"}</span> {"— Jump"}
              </p>
              
              <p style={{ marginBottom: "20px" }}>
                <strong style={{ color: "#9d7cce", letterSpacing: "1px" }}>OBJECTS</strong><br/>
                <span style={{ color: "#666" }}>{"I"}</span> {"— Add Objects menu"}
              </p>
              
              <p style={{ marginBottom: "20px" }}>
                <strong style={{ color: "#9d7cce", letterSpacing: "1px" }}>EDIT OBJECTS</strong><br/>
                <span style={{ color: "#666" }}>{"⌘"}</span> {"— Move with mouse"}<br/>
                <span style={{ color: "#666" }}>{"⌘ + ⌥"}</span> {"— Rotate"}<br/>
                <span style={{ color: "#666" }}>{"⌘ + ⌃"}</span> {"— Scale"}<br/>
                <span style={{ color: "#666" }}>{"⌘ + ⌃ + Scroll"}</span> {"— Z-axis scale"}
              </p>
              
              <p style={{ marginBottom: "20px" }}>
                <strong style={{ color: "#9d7cce", letterSpacing: "1px" }}>CAMERA</strong><br/>
                <span style={{ color: "#666" }}>{"Mouse"}</span> {"— Look around"}<br/>
                <span style={{ color: "#666" }}>{"⌃ + Scroll"}</span> {"— FOV"}
              </p>
              
              <p style={{ marginBottom: "20px" }}>
                <strong style={{ color: "#9d7cce", letterSpacing: "1px" }}>ADVANCED</strong><br/>
                <span style={{ color: "#666" }}>{"C"}</span> {"— Clone selected"}<br/>
                <span style={{ color: "#666" }}>{"Del"}</span> {"— Delete selected"}<br/>
                <span style={{ color: "#666" }}>{"T/G/N/F"}</span> {"— Effects"}
              </p>
              
              <p style={{ marginBottom: "20px" }}>
                <strong style={{ color: "#9d7cce", letterSpacing: "1px" }}>OTHER</strong><br/>
                <span style={{ color: "#666" }}>{"E"}</span> {"— Texture menu"}<br/>
                <span style={{ color: "#666" }}>{"H"}</span> {"— Show controls"}<br/>
                <span style={{ color: "#666" }}>{"K"}</span> {"— HUD (hold)"}<br/>
                <span style={{ color: "#666" }}>{"Esc"}</span> {"— Pause"}
              </p>
            </div>
          </div>
          
          <button onClick={startGame} style={{ 
            padding: "14px 50px", 
            fontSize: "1rem",
            backgroundColor: "transparent",
            color: "#9d7cce",
            border: "2px solid #9d7cce",
            borderRadius: "2px",
            cursor: "pointer",
            fontWeight: "400",
            letterSpacing: "3px",
            textTransform: "uppercase",
            transition: "all 0.3s ease",
            boxShadow: "0 0 20px rgba(157, 124, 206, 0.3)"
          }}>Start</button>
          
          <p style={{
            marginTop: "20px",
            color: "#666",
            fontSize: "0.8rem",
            letterSpacing: "1px",
            textAlign: "center",
            lineHeight: "1.8"
          }}>
            <span style={{ color: "#9d7cce" }}>Space</span> · <span style={{ color: "#9d7cce" }}>Enter</span> · <span style={{ color: "#9d7cce" }}>Click anywhere</span>
          </p>
          
          <p style={{
            marginTop: "8px",
            color: "#555",
            fontSize: "0.75rem",
            letterSpacing: "1px",
            textAlign: "center"
          }}>
            Random objects will spawn around the map
          </p>
        </div>
      )}
      
      {/* Pause Menu Overlay */}
      {isPaused && gameStarted && (
        <div style={{
          position: "absolute", top: 0, left: 0,
          width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.95)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          zIndex: 2
        }}>
          <h2 style={{ 
            color: "#9d7cce", 
            fontSize: "2rem",
            fontWeight: "300",
            letterSpacing: "4px",
            textTransform: "uppercase",
            marginBottom: "30px",
            textShadow: "0 0 20px rgba(157, 124, 206, 0.4)"
          }}>Paused</h2>
          <button onClick={resumeGame} style={{ 
            padding: "12px 40px", 
            fontSize: "1rem",
            backgroundColor: "transparent",
            color: "#9d7cce",
            border: "2px solid #9d7cce",
            borderRadius: "2px",
            cursor: "pointer",
            fontWeight: "400",
            letterSpacing: "2px",
            textTransform: "uppercase",
            boxShadow: "0 0 15px rgba(157, 124, 206, 0.2)"
          }}>Resume</button>
          <p style={{
            marginTop: "20px",
            color: "#666",
            fontSize: "0.8rem",
            letterSpacing: "1px",
            textAlign: "center"
          }}>
            <span style={{ color: "#9d7cce" }}>ESC</span> to close · Click canvas to resume
          </p>
        </div>
      )}
      
      {/* Add Object Menu Overlay */}
      {isAddMenuVisible && gameStarted && (
        <div onClick={() => { setIsAddMenuVisible(false); resumeGame(); }}
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 3, cursor: "pointer"
          }}>
          <div onClick={e => e.stopPropagation()} style={{
            backgroundColor: "#0a0a0a",
            padding: "35px",
            borderRadius: "2px",
            textAlign: "center",
            cursor: "default",
            minWidth: "320px",
            border: "1px solid rgba(157, 124, 206, 0.3)",
            boxShadow: "0 0 50px rgba(157, 124, 206, 0.3)"
          }}>
            <h4 style={{ 
              color: "#9d7cce", 
              margin: "0 0 8px",
              fontSize: "1.2rem",
              fontWeight: "300",
              letterSpacing: "3px",
              textTransform: "uppercase",
              textShadow: "0 0 15px rgba(157, 124, 206, 0.4)"
            }}>Spawn Object</h4>
            <p style={{
              color: "#666",
              fontSize: "0.75rem",
              margin: "0 0 25px",
              letterSpacing: "1px"
            }}>Use numpad or click</p>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <button onClick={() => { handleAddCube(); setIsAddMenuVisible(false); resumeGame(); }} 
                style={{ 
                  padding: "16px 12px", 
                  fontSize: "0.9rem", 
                  backgroundColor: "rgba(157, 124, 206, 0.05)",
                  color: "#b19cd9",
                  border: "2px solid rgba(157, 124, 206, 0.3)",
                  borderRadius: "2px",
                  cursor: "pointer",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  fontWeight: "400",
                  transition: "all 0.2s ease",
                  position: "relative"
                }}>
                <div style={{ fontSize: "1.1rem", marginBottom: "4px" }}>■</div>
                Cube
                <div style={{ 
                  position: "absolute", 
                  top: "6px", 
                  right: "8px", 
                  fontSize: "0.7rem", 
                  color: "#666",
                  fontWeight: "300"
                }}>1</div>
              </button>
              
              <button onClick={() => { handleAddPyramid(); setIsAddMenuVisible(false); resumeGame(); }} 
                style={{ 
                  padding: "16px 12px", 
                  fontSize: "0.9rem", 
                  backgroundColor: "rgba(157, 124, 206, 0.05)",
                  color: "#b19cd9",
                  border: "2px solid rgba(157, 124, 206, 0.3)",
                  borderRadius: "2px",
                  cursor: "pointer",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  fontWeight: "400",
                  transition: "all 0.2s ease",
                  position: "relative"
                }}>
                <div style={{ fontSize: "1.1rem", marginBottom: "4px" }}>▲</div>
                Pyramid
                <div style={{ 
                  position: "absolute", 
                  top: "6px", 
                  right: "8px", 
                  fontSize: "0.7rem", 
                  color: "#666",
                  fontWeight: "300"
                }}>2</div>
              </button>
              
              <button onClick={() => { handleAddPane(); setIsAddMenuVisible(false); resumeGame(); }} 
                style={{ 
                  padding: "16px 12px", 
                  fontSize: "0.9rem", 
                  backgroundColor: "rgba(157, 124, 206, 0.05)",
                  color: "#b19cd9",
                  border: "2px solid rgba(157, 124, 206, 0.3)",
                  borderRadius: "2px",
                  cursor: "pointer",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  fontWeight: "400",
                  transition: "all 0.2s ease",
                  position: "relative"
                }}>
                <div style={{ fontSize: "1.1rem", marginBottom: "4px" }}>▭</div>
                Pane
                <div style={{ 
                  position: "absolute", 
                  top: "6px", 
                  right: "8px", 
                  fontSize: "0.7rem", 
                  color: "#666",
                  fontWeight: "300"
                }}>3</div>
              </button>
              
              <button onClick={() => { handleAddCube(); setIsAddMenuVisible(false); resumeGame(); }} 
                style={{ 
                  padding: "16px 12px", 
                  fontSize: "0.9rem", 
                  backgroundColor: "rgba(157, 124, 206, 0.05)",
                  color: "#888",
                  border: "2px solid rgba(136, 136, 136, 0.2)",
                  borderRadius: "2px",
                  cursor: "pointer",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  fontWeight: "400",
                  transition: "all 0.2s ease",
                  position: "relative"
                }}>
                <div style={{ fontSize: "1.1rem", marginBottom: "4px" }}>◆</div>
                Sphere
                <div style={{ 
                  position: "absolute", 
                  top: "6px", 
                  right: "8px", 
                  fontSize: "0.7rem", 
                  color: "#555",
                  fontWeight: "300"
                }}>4</div>
              </button>
            </div>
            
            <button onClick={() => { setIsAddMenuVisible(false); resumeGame(); }}
              style={{
                padding: "10px 20px",
                fontSize: "0.75rem",
                backgroundColor: "transparent",
                color: "#555",
                border: "1px solid #333",
                borderRadius: "2px",
                cursor: "pointer",
                letterSpacing: "2px",
                textTransform: "uppercase",
                width: "100%",
                marginTop: "10px"
              }}>
              Cancel (Esc)
            </button>
          </div>
        </div>
      )}
      
      {/* Instructions Overlay */}
      {showInstructions && gameStarted && (
        <div onClick={() => { setShowInstructions(false); resumeGame(); }}
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.95)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 4, cursor: "pointer",
            padding: "20px",
            boxSizing: "border-box"
          }}>
          <div onClick={e => e.stopPropagation()} style={{
            backgroundColor: "#0a0a0a",
            padding: "35px",
            borderRadius: "2px",
            maxWidth: "600px",
            width: "100%",
            cursor: "default",
            maxHeight: "80vh",
            overflowY: "auto",
            border: "1px solid rgba(157, 124, 206, 0.3)",
            boxShadow: "0 0 50px rgba(157, 124, 206, 0.2)"
          }}>
            <h2 style={{ 
              color: "#b19cd9", 
              margin: "0 0 30px",
              fontSize: "1.5rem",
              fontWeight: "300",
              letterSpacing: "3px",
              textTransform: "uppercase"
            }}>Controls</h2>
            
            <div style={{ color: "#888", textAlign: "left", fontSize: "13px", lineHeight: "2" }}>
              <p style={{ marginBottom: "20px" }}>
                <strong style={{ color: "#9d7cce", letterSpacing: "1px", fontSize: "0.9rem" }}>MOVEMENT</strong><br/>
                <span style={{ color: "#666" }}>{"W A S D"}</span> {"— Move around"}<br/>
                <span style={{ color: "#666" }}>{"Shift"}</span> {"— Sprint (hold)"}<br/>
                <span style={{ color: "#666" }}>{"Space"}</span> {"— Jump"}
              </p>
              
              <p style={{ marginBottom: "20px" }}>
                <strong style={{ color: "#9d7cce", letterSpacing: "1px", fontSize: "0.9rem" }}>OBJECTS</strong><br/>
                <span style={{ color: "#666" }}>{"I"}</span> {"— Add Objects menu"}
              </p>
              
              <p style={{ marginBottom: "20px" }}>
                <strong style={{ color: "#9d7cce", letterSpacing: "1px", fontSize: "0.9rem" }}>EDIT OBJECTS</strong><br/>
                <span style={{ color: "#666" }}>{"⌘ + Mouse"}</span> {"— Move object"}<br/>
                <span style={{ color: "#666" }}>{"⌘ + ⌥ + Mouse"}</span> {"— Rotate object"}<br/>
                <span style={{ color: "#666" }}>{"⌘ + ⌃ + Mouse"}</span> {"— Scale object (X/Y)"}<br/>
                <span style={{ color: "#666" }}>{"⌘ + ⌃ + Scroll"}</span> {"— Scale Z-axis"}
              </p>
              
              <p style={{ marginBottom: "20px" }}>
                <strong style={{ color: "#9d7cce", letterSpacing: "1px", fontSize: "0.9rem" }}>CAMERA</strong><br/>
                <span style={{ color: "#666" }}>{"Mouse"}</span> {"— Look around"}<br/>
                <span style={{ color: "#666" }}>{"⌃ + Scroll"}</span> {"— Adjust FOV"}
              </p>
              
              <p style={{ marginBottom: "20px" }}>
                <strong style={{ color: "#9d7cce", letterSpacing: "1px", fontSize: "0.9rem" }}>EXPERIMENTAL</strong><br/>
                <span style={{ color: "#666" }}>{"T"}</span> {"— Motion trails"}<br/>
                <span style={{ color: "#666" }}>{"G"}</span> {"— Wireframe mode"}<br/>
                <span style={{ color: "#666" }}>{"N"}</span> {"— Day/night cycle"}<br/>
                <span style={{ color: "#666" }}>{"F"}</span> {"— Performance stats"}<br/>
                <span style={{ color: "#666" }}>{"C (hold)"}</span> {"— Clone object at crosshair (drag & release)"}<br/>
                <span style={{ color: "#666" }}>{"Delete"}</span> {"— Remove object at crosshair"}
              </p>
              
              <p style={{ marginBottom: "25px" }}>
                <strong style={{ color: "#9d7cce", letterSpacing: "1px", fontSize: "0.9rem" }}>OTHER</strong><br/>
                <span style={{ color: "#666" }}>{"E"}</span> {"— Texture/View menu (near panes)"}<br/>
                <span style={{ color: "#666" }}>{"H"}</span> {"— Toggle help menu"}<br/>
                <span style={{ color: "#666" }}>{"K"}</span> {"— Show HUD (hold)"}<br/>
                <span style={{ color: "#666" }}>{"Esc"}</span> {"— Pause game"}
              </p>
            </div>
            
            <button onClick={() => { setShowInstructions(false); resumeGame(); }} 
              style={{ 
                padding: "12px 30px", 
                fontSize: "0.9rem",
                backgroundColor: "transparent",
                color: "#9d7cce",
                border: "2px solid #9d7cce",
                borderRadius: "2px",
                cursor: "pointer",
                fontWeight: "400",
                width: "100%",
                letterSpacing: "2px",
                textTransform: "uppercase",
                boxShadow: "0 0 15px rgba(157, 124, 206, 0.2)"
              }}>
              Resume
            </button>
            
            <p style={{ 
              color: "#555", 
              fontSize: "11px", 
              marginTop: "20px", 
              marginBottom: 0,
              textAlign: "center",
              letterSpacing: "0.5px"
            }}>
              {"Press H or click outside to close"}
            </p>
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
            backgroundColor: "rgba(0,0,0,0.85)",
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
                backgroundColor: "#0a0a0a",
                padding: "30px",
                borderRadius: "2px",
                textAlign: "center",
                cursor: "default",
                maxWidth: "400px",
                border: "1px solid rgba(157, 124, 206, 0.3)",
                boxShadow: "0 0 40px rgba(157, 124, 206, 0.15)"
            }}
            >
            <h4 style={{ 
              color: "#b19cd9", 
              margin: "0 0 25px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontSize: "1.1rem",
              fontWeight: "300"
            }}>Pane Interaction</h4>

            {/* Load Texture Section */}
            <div style={{ marginBottom: "20px" }}>
                <h5 style={{ 
                  color: "#9d7cce", 
                  margin: "0 0 10px",
                  letterSpacing: "1px",
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  fontWeight: "400"
                }}>Load Texture</h5>
                <input
                type="text"
                value={lottieFilePathInput}
                onChange={(e) => setLottieFilePathInput(e.target.value)}
                placeholder="Enter texture file path"
                style={{ 
                  padding: "10px", 
                  width: "100%", 
                  marginBottom: "10px",
                  backgroundColor: "rgba(20,20,20,0.6)",
                  border: "1px solid rgba(157, 124, 206, 0.2)",
                  color: "#888",
                  borderRadius: "2px",
                  boxSizing: "border-box",
                  fontSize: "0.85rem"
                }}
                />
                <button
                onClick={handleLoadLottie}
                style={{ 
                  padding: "10px 20px",
                  backgroundColor: "transparent",
                  color: "#9d7cce",
                  border: "1px solid #9d7cce",
                  borderRadius: "2px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  width: "100%",
                  fontWeight: "400"
                }}
                >
                Load Texture
                </button>
            </div>

            {/* New Load View Section */}
            <div style={{ marginTop: "20px", marginBottom: "20px" }}>
                <h5 style={{ 
                  color: "#9d7cce", 
                  margin: "0 0 10px",
                  letterSpacing: "1px",
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  fontWeight: "400"
                }}>Load View</h5>
                <input
                type="text"
                value={viewFilePathInput}
                onChange={(e) => setViewFilePathInput(e.target.value)}
                placeholder="Enter view name"
                style={{ 
                  padding: "10px", 
                  width: "100%", 
                  marginBottom: "10px",
                  backgroundColor: "rgba(20,20,20,0.6)",
                  border: "1px solid rgba(157, 124, 206, 0.2)",
                  color: "#888",
                  borderRadius: "2px",
                  boxSizing: "border-box",
                  fontSize: "0.85rem"
                }}
                />
                <button
                onClick={handleLoadView}
                style={{ 
                  padding: "10px 20px",
                  backgroundColor: "transparent",
                  color: "#9d7cce",
                  border: "1px solid #9d7cce",
                  borderRadius: "2px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  width: "100%",
                  fontWeight: "400"
                }}
                >
                Load View
                </button>
            </div>

            <button
                onClick={() => setIsLottieMenuVisible(false)}
                style={{ 
                  padding: "10px 20px", 
                  fontSize: "0.8rem",
                  backgroundColor: "transparent",
                  color: "#666",
                  border: "1px solid #444",
                  borderRadius: "2px",
                  cursor: "pointer",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  width: "100%",
                  marginTop: "10px"
                }}
            >
                Cancel
            </button>
            </div>
        </div>
        )}
      
      {/* On-Screen Key Helper */}
      {showKeyHelper && gameStarted && !isPaused && !isAddMenuVisible && !showInstructions && !isLottieMenuVisible && (
        <div style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          backgroundColor: "rgba(10,10,10,0.85)",
          padding: "15px 20px",
          borderRadius: "2px",
          border: "1px solid rgba(157, 124, 206, 0.2)",
          boxShadow: "0 0 30px rgba(0,0,0,0.5)",
          fontSize: "11px",
          color: "#666",
          fontFamily: "monospace",
          zIndex: 2,
          pointerEvents: "none",
          userSelect: "none",
          lineHeight: "1.8",
          minWidth: "200px"
        }}>
          <div style={{ 
            marginBottom: "10px", 
            color: "#9d7cce",
            fontSize: "10px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            fontWeight: "400",
            borderBottom: "1px solid rgba(157, 124, 206, 0.15)",
            paddingBottom: "8px"
          }}>
            Quick Keys <span style={{ color: "#555", fontSize: "8px" }}>(Hold K)</span>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span style={{ color: "#888" }}>WASD</span>
            <span>Move</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span style={{ color: "#888" }}>Shift</span>
            <span>Sprint</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span style={{ color: "#888" }}>Space</span>
            <span>Jump</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span style={{ color: "#888" }}>Mouse</span>
            <span>Look</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#888" }}>⌃+Scroll</span>
            <span>FOV</span>
          </div>
          
          <div style={{ 
            borderTop: "1px solid rgba(157, 124, 206, 0.1)",
            paddingTop: "8px",
            marginTop: "8px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{ color: "#888" }}>I</span>
              <span>Objects (1-4)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{ color: "#888" }}>E</span>
              <span>Textures</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{ color: "#888" }}>H</span>
              <span>Help</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{ color: "#888" }}>Esc</span>
              <span>Pause</span>
            </div>
          </div>
          
          <div style={{ 
            borderTop: "1px solid rgba(157, 124, 206, 0.1)",
            paddingTop: "8px",
            marginTop: "8px"
          }}>
            <div style={{ 
              color: "#9d7cce",
              fontSize: "9px",
              letterSpacing: "1px",
              marginBottom: "5px"
            }}>EXPERIMENTAL</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{ color: "#888" }}>T</span>
              <span>Trails</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{ color: "#888" }}>G</span>
              <span>Wireframe</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{ color: "#888" }}>N</span>
              <span>Time Cycle</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#888" }}>F</span>
              <span>Stats</span>
            </div>
          </div>
          
          <div style={{ 
            borderTop: "1px solid rgba(157, 124, 206, 0.1)",
            paddingTop: "8px",
            marginTop: "8px"
          }}>
            <div style={{ 
              color: "#9d7cce",
              fontSize: "9px",
              letterSpacing: "1px",
              marginBottom: "5px"
            }}>OBJECT MANIPULATION</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{ color: "#888" }}>⌘+Click</span>
              <span>Select</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{ color: "#888" }}>⌘+Drag</span>
              <span>Move XZ</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{ color: "#888" }}>⌘+Scroll</span>
              <span>Move Y</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{ color: "#888" }}>C</span>
              <span>Clone & Drag</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#888" }}>Del</span>
              <span>Delete at Crosshair</span>
            </div>
          </div>
          
          <div style={{ 
            marginTop: "12px",
            paddingTop: "8px",
            borderTop: "1px solid rgba(157, 124, 206, 0.1)",
            fontSize: "10px",
            color: "#555",
            textAlign: "center"
          }}>
            Hold K to view controls
          </div>
        </div>
      )}
      
      {/* Stats Display */}
      {showStats && gameStarted && !isPaused && (
        <div style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          backgroundColor: "rgba(10,10,10,0.85)",
          padding: "12px 16px",
          borderRadius: "2px",
          border: "1px solid rgba(157, 124, 206, 0.2)",
          boxShadow: "0 0 30px rgba(0,0,0,0.5)",
          fontSize: "11px",
          color: "#666",
          fontFamily: "monospace",
          zIndex: 2,
          pointerEvents: "none",
          userSelect: "none",
          lineHeight: "1.6",
          minWidth: "180px"
        }}>
          <div style={{ 
            color: "#9d7cce",
            fontSize: "10px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            fontWeight: "400",
            marginBottom: "8px",
            borderBottom: "1px solid rgba(157, 124, 206, 0.15)",
            paddingBottom: "6px"
          }}>
            Performance
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span style={{ color: "#888" }}>FPS:</span>
            <span style={{ color: currentFps >= 55 ? "#9d7cce" : "#ff6b6b" }}>{currentFps}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span style={{ color: "#888" }}>Objects:</span>
            <span style={{ color: "#9d7cce" }}>{addedObjects.current.length}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span style={{ color: "#888" }}>Time:</span>
            <span style={{ color: "#9d7cce" }}>{(timeOfDay * 24).toFixed(1)}h</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span style={{ color: "#888" }}>Trails:</span>
            <span style={{ color: enableTrails ? "#9d7cce" : "#444" }}>{enableTrails ? "ON" : "OFF"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#888" }}>Wire:</span>
            <span style={{ color: enableWireframe ? "#9d7cce" : "#444" }}>{enableWireframe ? "ON" : "OFF"}</span>
          </div>
        </div>
      )}
      
      {/* Clone Drag Mode Indicator */}
      {isDraggingClone && gameStarted && !isPaused && (
        <div style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          backgroundColor: "rgba(157, 124, 206, 0.15)",
          padding: "12px 16px",
          borderRadius: "2px",
          border: "1px solid rgba(157, 124, 206, 0.4)",
          boxShadow: "0 0 20px rgba(157, 124, 206, 0.3)",
          fontSize: "11px",
          color: "#9d7cce",
          fontFamily: "monospace",
          zIndex: 3,
          pointerEvents: "none",
          userSelect: "none",
          animation: "pulse 1.5s ease-in-out infinite"
        }}>
          <div style={{ 
            fontSize: "10px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            fontWeight: "400",
            marginBottom: "4px"
          }}>
            CLONING
          </div>
          <div style={{ fontSize: "9px", color: "#b19cd9" }}>
            Release C to place
          </div>
        </div>
      )}
      
      {/* Crosshair Cursor */}
      {gameStarted && !isPaused && !isAddMenuVisible && !showInstructions && !isLottieMenuVisible && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 3,
          userSelect: "none"
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20">
            <line x1="10" y1="2" x2="10" y2="8" stroke="#9d7cce" strokeWidth="1" opacity="0.6" />
            <line x1="10" y1="12" x2="10" y2="18" stroke="#9d7cce" strokeWidth="1" opacity="0.6" />
            <line x1="2" y1="10" x2="8" y2="10" stroke="#9d7cce" strokeWidth="1" opacity="0.6" />
            <line x1="12" y1="10" x2="18" y2="10" stroke="#9d7cce" strokeWidth="1" opacity="0.6" />
            <circle cx="10" cy="10" r="1.5" fill="none" stroke="#9d7cce" strokeWidth="1" opacity="0.4" />
          </svg>
        </div>
      )}
      
      {/* Helper Key Hint - always visible in game */}
      {gameStarted && !isPaused && !isAddMenuVisible && !showInstructions && !isLottieMenuVisible && !showKeyHelper && (
        <div style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          backgroundColor: "rgba(10,10,10,0.7)",
          padding: "8px 14px",
          borderRadius: "2px",
          border: "1px solid rgba(157, 124, 206, 0.15)",
          fontSize: "10px",
          color: "#666",
          fontFamily: "monospace",
          zIndex: 2,
          pointerEvents: "none",
          userSelect: "none",
          animation: "pulse 2s ease-in-out infinite"
        }}>
          <span style={{ color: "#9d7cce" }}>K</span> for keys
        </div>
      )}
      </div>
    </div>
  );
}

return { WorldView };

```
