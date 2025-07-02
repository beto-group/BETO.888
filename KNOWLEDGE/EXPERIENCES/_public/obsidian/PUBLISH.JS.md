
## ENIMGAS
-----

VERSION OF PUBLISH FOR CREATING EXCALIDRAW HOVER SVGS [IFRAME CAPABLE]

```
const baseUrl = `${window.location.origin}/`;

const detectDeviceType = () => {
  const userAgent = navigator.userAgent;
  const mobileKeywords = ['Mobile', 'Android', 'iPhone', 'iPad', 'Windows Phone'];
  const isMobile = mobileKeywords.some(keyword => userAgent.includes(keyword));
  const isTablet = /iPad/i.test(userAgent) || (isMobile && !/Mobile/i.test(userAgent));
  const isDesktop = !isMobile && !isTablet;
  return { isDesktop, isMobile, isTablet };
};

const device = detectDeviceType();

const addNavigationToDiv = (container) => {
  const svgElement = container?.querySelector('.excalidraw-svg');
  if (!svgElement) return;

  container.classList.add("excalidraw-svg-container");
  svgElement.removeAttribute("width");
  svgElement.removeAttribute("height");

  let zoomLevel = 1;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;

  const applyTransform = () => {
    svgElement.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    svgElement.style.transformOrigin = 'center center';
  };

  const createButton = (id, svgPath) => {
    const button = document.createElement('button');
    button.id = id;
    button.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="${svgPath}" fill="white"/>
      </svg>
    `;
    return button;
  };

  const resetButton = createButton('resetButton', 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z');
  const zoomInButton = createButton('zoomInButton', 'M12 5v14M5 12h14');
  const zoomOutButton = createButton('zoomOutButton', 'M5 12h14');

  container.appendChild(resetButton);

  const buttonContainer = document.createElement('div');
  buttonContainer.style.position = 'absolute';
  buttonContainer.style.bottom = '10px';
  buttonContainer.style.right = '10px';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexDirection = 'column';
  buttonContainer.style.gap = '5px';
  buttonContainer.appendChild(zoomInButton);
  buttonContainer.appendChild(zoomOutButton);
  container.appendChild(buttonContainer);

  // Event listeners for buttons
  resetButton.addEventListener('click', () => {
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    applyTransform();
  });

  zoomInButton.addEventListener('click', () => {
    zoomLevel = Math.min(zoomLevel + 0.5, 10);
    applyTransform();
  });

  zoomOutButton.addEventListener('click', () => {
    const zoomFactor = 0.5;
    const prevZoomLevel = zoomLevel;

    zoomLevel = Math.max(zoomLevel - zoomFactor, 1);

    const zoomRatio = zoomLevel / prevZoomLevel;
    const rect = svgElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;

    panX = centerX - (centerX - panX) * zoomRatio;
    panY = centerY - (centerY - panY) * zoomRatio;

    if (zoomLevel === 1) {
      panX = 0;
      panY = 0;
    }

    applyTransform();
  });

  // Event listeners for touch actions
  resetButton.addEventListener('touchstart', (event) => {
    event.preventDefault();
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    applyTransform();
  }, { passive: false });

  zoomInButton.addEventListener('touchstart', (event) => {
    event.preventDefault();
    zoomLevel = Math.min(zoomLevel + 0.5, 10);
    applyTransform();
  }, { passive: false });

  zoomOutButton.addEventListener('touchstart', (event) => {
    event.preventDefault();
    const zoomFactor = 0.5;
    const prevZoomLevel = zoomLevel;

    zoomLevel = Math.max(zoomLevel - zoomFactor, 1);

    const zoomRatio = zoomLevel / prevZoomLevel;
    const rect = svgElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;

    panX = centerX - (centerX - panX) * zoomRatio;
    panY = centerY - (centerY - panY) * zoomRatio;

    if (zoomLevel === 1) {
      panX = 0;
      panY = 0;
    }

    applyTransform();
  }, { passive: false });

  document.addEventListener('wheel', (event) => {
    if (event.ctrlKey) {
      event.preventDefault();
    }
  }, { passive: false });

  container.addEventListener('mousedown', (event) => event.preventDefault(), { passive: false });
  container.addEventListener('touchstart', (event) => event.preventDefault(), { passive: false });

  const handleWheelZoom = (event) => {
    if (event.ctrlKey) {
      event.preventDefault();
      const { offsetX, offsetY, deltaY } = event;
      const scaleAmount = -deltaY / 200;
      const prevZoomLevel = zoomLevel;

      zoomLevel += scaleAmount;
      zoomLevel = Math.min(Math.max(1, zoomLevel), 10);

      const zoomRatio = zoomLevel / prevZoomLevel;

      panX = offsetX - (offsetX - panX) * zoomRatio;
      panY = offsetY - (offsetY - panY) * zoomRatio;

      applyTransform();
    }
  };

  const handleMousePanning = (event) => {
    isPanning = true;
    panStartX = event.clientX;
    panStartY = event.clientY;
  };

  const handleMouseMove = (event) => {
    if (!isPanning) return;
    const deltaX = event.clientX - panStartX;
    const deltaY = event.clientY - panStartY;

    panX += deltaX;
    panY += deltaY;
    panStartX = event.clientX;
    panStartY = event.clientY;

    requestAnimationFrame(applyTransform);
  };

  const handleMouseUp = () => {
    isPanning = false;
  };

  const handleTouchStart = (event) => {
    if (event.touches.length === 1) {
      isPanning = true;
      panStartX = event.touches[0].clientX;
      panStartY = event.touches[0].clientY;
    } else if (event.touches.length === 2) {
      initialDistance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );
    }
  };

  const handleTouchMove = (event) => {
    if (event.touches.length === 1 && isPanning) {
      const deltaX = event.touches[0].clientX - panStartX;
      const deltaY = event.touches[0].clientY - panStartY;

      panX += deltaX;
      panY += deltaY;
      panStartX = event.touches[0].clientX;
      panStartY = event.touches[0].clientY;

      requestAnimationFrame(applyTransform);
    } else if (event.touches.length === 2) {
      event.preventDefault();
      const currentDistance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );
      const deltaDistance = currentDistance - initialDistance;
      const prevZoomLevel = zoomLevel;

      zoomLevel += deltaDistance * 0.01;
      zoomLevel = Math.min(Math.max(1, zoomLevel), 10);

      const zoomRatio = zoomLevel / prevZoomLevel;
      const rect = svgElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2 - rect.left;
      const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2 - rect.top;

      panX -= (centerX - rect.width / 2) * (zoomRatio - 1);
      panY -= (centerY - rect.height / 2) * (zoomRatio - 1);

      requestAnimationFrame(applyTransform);
      initialDistance = currentDistance;
    }
  };

  container.addEventListener('wheel', handleWheelZoom);
  container.addEventListener('mousedown', handleMousePanning);
  container.addEventListener('mousemove', handleMouseMove);
  container.addEventListener('mouseup', handleMouseUp);
  container.addEventListener('mouseleave', handleMouseUp);
  container.addEventListener('touchstart', handleTouchStart);
  container.addEventListener('touchmove', handleTouchMove);
  container.addEventListener('touchend', handleMouseUp);

  const iframes = container.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    iframe.style.pointerEvents = 'auto';
    iframe.setAttribute('loading', 'lazy');
    iframe.addEventListener('mouseover', () => {
      container.removeEventListener('mousedown', handleMousePanning);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    });
    iframe.addEventListener('mouseout', () => {
      container.addEventListener('mousedown', handleMousePanning);
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchmove', handleTouchMove);
    });
  });

  applyTransform();
};

const processIMG = async (img) => {
  img.setAttribute('loading', 'lazy');
  const svgURL = img.src;
  const container = img.parentElement;

  try {
    const response = await fetch(svgURL);
    if (!response.ok) {
      throw new Error('Failed to fetch SVG');
    }
    const svgContent = await response.text();
    const svgContainer = document.createElement('div');
    svgContainer.classList.add('excalidraw-svg-container');
    svgContainer.innerHTML = svgContent;

    const iframes = svgContainer.querySelectorAll(`iframe[src^="obsidian://open?vault="]`);
    iframes.forEach(iframe => {
      iframe.setAttribute("src", unescape(iframe.getAttribute("src").replace(/.*&file=/, baseUrl).replaceAll(" ", "+")));
      iframe.setAttribute('loading', 'lazy');
    });

    container.removeChild(img);
    container.appendChild(svgContainer);

    iframes.forEach(iframe => {
      iframe.onload = () => {
        iframe.style.visibility = 'visible';
      };
      iframe.style.visibility = 'hidden';
    });

    svgContainer.querySelectorAll(`a[href^="obsidian://open?vault="`).forEach(el => {
      el.setAttribute("href", unescape(el.getAttribute("href").replace(/.*&file=/, baseUrl).replaceAll(" ", "+")));
    });

    svgContainer.querySelectorAll('a').forEach(link => {
      link.setAttribute('target', '_blank');
    });

    addNavigationToDiv(svgContainer);
  } catch (error) {
    console.error('Error: ' + error);
  }
};

const addImgMutationObserver = () => {
  const targetElement = document.body;
  const handleImgAddition = (mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node instanceof Element && node.querySelector(`img[alt$=".svg"]`)) {
            const imgElement = node.querySelector(`img[alt$=".svg"]`);
            imgElement.setAttribute('loading', 'lazy');
            requestAnimationFrame(() => processIMG(imgElement));
          }
        });
      }
    }
  };
  const observer = new MutationObserver(handleImgAddition);
  const config = { childList: true, subtree: true };
  observer.observe(targetElement, config);
};

document.body.querySelectorAll(`img[alt$=".svg"]`).forEach(img => {
  img.setAttribute('loading', 'lazy');
  requestAnimationFrame(() => processIMG(img));
});

addImgMutationObserver();

// Prefetch important resources
const prefetchLink = document.createElement('link');
prefetchLink.rel = 'prefetch';
prefetchLink.href = 'https://example.com/important-resource.js';
document.head.appendChild(prefetchLink);

const prefetchLink2 = document.createElement('link');
prefetchLink2.rel = 'prefetch';
prefetchLink2.href = 'https://example.com/another-important-resource.css';
document.head.appendChild(prefetchLink2);

// Reducing DOM Size
const optimizeDOM = () => {
  // Simplify SVG structure by removing unnecessary groups or paths
  document.querySelectorAll('svg.excalidraw-svg g').forEach(g => {
    if (!g.hasChildNodes()) {
      g.remove();
    }
  });

  // Optimize button creation
  const buttonConfig = [
    { id: 'resetButton', path: 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z' },
    { id: 'zoomInButton', path: 'M12 5v14M5 12h14' },
    { id: 'zoomOutButton', path: 'M5 12h14' }
  ];

  buttonConfig.forEach(config => {
    if (!document.getElementById(config.id)) {
      const button = document.createElement('button');
      button.id = config.id;
      button.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="${config.path}" fill="white"/>
        </svg>
      `;
      buttonContainer.appendChild(button);
    }
  });

  // Add buttons to container
  if (!buttonContainer.parentNode) {
    container.appendChild(buttonContainer);
  }
};

document.addEventListener('DOMContentLoaded', optimizeDOM);
```

-----