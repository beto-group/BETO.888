/**
 * processorUtils.js
 * Core pixel manipulation for background removal.
 */

/**
 * Removes background from an ImageData object using boundary-aware flood fill.
 * Starts from corners to identify "outside" background.
 */
function removeBackground(imageData, options = {}) {
    const {
        blackThreshold = 30,    // Max brightness to consider "background black"
        boundaryThreshold = 180, // Min brightness to consider "stopping boundary"
        seedPoints = [[0, 0]]    // Where to start the fill
    } = options;

    const { width, height, data } = imageData;
    const visited = new Uint8Array(width * height);
    const stack = [...seedPoints];

    // Mark seeds as visited
    for (const [x, y] of seedPoints) {
        visited[y * width + x] = 1;
    }

    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const idx = (y * width + x) * 4;

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const brightness = (r + g + b) / 3;

        // If it's a boundary (white line), we stop spreading here
        if (brightness > boundaryThreshold) {
            continue;
        }

        // Clear Alpha if it's dark enough to be background
        if (brightness < blackThreshold) {
            data[idx + 3] = 0;
        }

        // Spread to neighbors (because we are not at a boundary)
        const neighbors = [
            [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
        ];

        for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const vIdx = ny * width + nx;
                if (!visited[vIdx]) {
                    visited[vIdx] = 1;
                    stack.push([nx, ny]);
                }
            }
        }
    }

    return imageData;
}

/**
 * Faster alternative: Simple Chroma-like keying if flood fill is too slow for 120fps.
 * Note: This will remove internal blacks too unless refined.
 */
function fastKeying(imageData, blackThreshold) {
    const { data } = imageData;
    for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness < blackThreshold) {
            data[i + 3] = 0;
        }
    }
    return imageData;
}

return { removeBackground, fastKeying };
