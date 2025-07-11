


 


## AquariumView


```jsx
// AquariumView Component
const componentFile = "_OPERATION/PRIVATE/DATACORE/13 Aquarium {FireStormFrontier 🫡}/D.q.aquarium.component.md";

// Load styles from the v3 file.
const { Styles } = await dc.require(dc.headerLink(componentFile, "Styles"));
const styles = Styles();

// Load the Aquarium module from the v3 file.
let AquariumModule = null;
try {
  const aquariumModuleImport = await dc.require(dc.headerLink(componentFile, "Aquarium"));
  AquariumModule = aquariumModuleImport.Aquarium;
} catch (e) {
  console.error("Error loading Aquarium module:", e);
}

// Use the CSS provided by Styles, if available.
const css = styles.aquariumCSS || "";

const fishes = [
  { name: 'Brush Teeth' },
  { name: 'Read' },
  { name: 'Exercise' },
  { name: 'Journal' },
  { name: 'Code' },
  { name: 'Vitamins' },
];

function AquariumView() {
  const aquariumRef = dc.useRef();
  const [aquariumInstance, setAquariumInstance] = dc.useState(null);

  // Load lottie-player script if needed.
  dc.useEffect(() => {
    if (!window.customElements.get("lottie-player")) {
      const script = document.createElement("script");
      script.src =
        "https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

  dc.useEffect(() => {
    if (!AquariumModule) {
      console.error("Aquarium module is not loaded.");
      return;
    }
    if (aquariumRef.current) {
      try {
        const newAquarium = new AquariumModule({ aquariumRef: aquariumRef.current, fishes });
        setAquariumInstance(newAquarium);
      } catch (e) {
        console.error("Error initializing Aquarium:", e);
      }
    }
  }, []);

  return (
    <div style={styles.mainContainer}>
      {css && <style>{css}</style>}
      <div className="tank" ref={aquariumRef} style={styles.tank} />
    </div>
  );
}

return { AquariumView };

```


## Aquarium

```jsx
// Aquarium Module (Using v3 references)
const componentFile = "_OPERATION/PRIVATE/DATACORE/13 Aquarium {FireStormFrontier 🫡}/D.q.aquarium.component.md";

function loadScript(src, onload, onerror) {
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.onload = onload;
  script.onerror =
    onerror ||
    function () {
      console.error(`Failed to load script: ${src}`);
    };
  document.body.appendChild(script);
  return script;
}

async function fuzzyFindFile(filename) {
  // Ensure Fuse is loaded
  if (!window.Fuse) {
    await new Promise((resolve) =>
      loadScript("https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js", resolve)
    );
  }

  const files = app.vault.getFiles();
  const fuse = new Fuse(files, {
    keys: ["name"],
    includeScore: true,
    threshold: 0.4,
  });

  const results = fuse.search(filename);
  return results.length > 0 ? results[0].item : null;
}

// Utility to load media files.
async function requireMediaFile(filename) {
  const file = await fuzzyFindFile(filename);
  if (!file) {
    throw new Error(`File "${filename}" not found`);
  }
  return app.vault.getResourcePath(file);
}




// Import Animation from the v3 file.
const { Animation } = await dc.require(dc.headerLink(componentFile, "Animation"));
const backgroundLottie = await requireMediaFile('aquarium.json');
const fishLottie = await requireMediaFile('fish.json');

/**
 * Class representing a fish within the aquarium.
 */
class Fish {
  constructor({ settings, aquarium }) {
    this.aquarium = aquarium;
    this.name = settings.name;
    this.element = this.createFishElement(settings);
    this.swimReverse = false;
    this.width = 0;
    this.height = 0;
    this.x = 0;
    this.y = 0;
    // Use scaleX only to flip the fish graphic.
    this.scaleX = 1;
    this.scaleY = 1;
    this.swimAnimation = new Animation({ behavior: this.swim });
    this.initiateDimensions();
  }

  async initiateDimensions() {
    while (!this.aquarium.movementBounds) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    // Allow a moment for rendering.
    await new Promise(resolve => setTimeout(resolve, 50));
    const { width, height } = this.element.getBoundingClientRect();
    this.width = width;
    this.height = height;
    const b = this.aquarium.movementBounds;
    const maxX = b.right - this.width;
    const maxY = b.bottom - this.height;
    this.x = Math.random() * (maxX - b.left) + b.left;
    this.y = Math.random() * (maxY - b.top) + b.top;
    this.update();
  }

  createFishElement(settings) {
    const fishDiv = document.createElement("div");
    fishDiv.className = "fish";
    fishDiv.style.position = "absolute";

    // Create the lottie-player for the fish graphic.
    const lottiePlayer = document.createElement("lottie-player");
    lottiePlayer.src = fishLottie;
    lottiePlayer.setAttribute("background", "transparent");
    lottiePlayer.setAttribute("speed", "1");
    lottiePlayer.style.width = "100%";
    lottiePlayer.style.height = "100%";
    lottiePlayer.setAttribute("loop", "");
    lottiePlayer.setAttribute("autoplay", "");
    fishDiv.appendChild(lottiePlayer);

    // Create the fish name element.
    const fishNameDiv = document.createElement("div");
    fishNameDiv.className = "fish-name";
    fishNameDiv.innerText = settings.name;
    fishNameDiv.style.color = "black";
    // Initially position it on the right.
    fishNameDiv.style.left = "80px";
    fishDiv.appendChild(fishNameDiv);

    // Create the speech bubble.
    this.speechBubbleDiv = document.createElement("div");
    this.speechBubbleDiv.className = "speech-bubble";
    this.speechBubbleDiv.innerText = settings.name;
    this.speechBubbleDiv.style.display = "none";
    // Initially position the bubble.
    this.speechBubbleDiv.style.left = "10px";
    fishDiv.appendChild(this.speechBubbleDiv);

    this.aquarium.element.appendChild(fishDiv);
    fishDiv.addEventListener("click", this.handleOnClick);
    return fishDiv;
  }

  handleOnClick = () => {
    this.swimAnimation.toggleAnimation();
    if (this.speechBubbleDiv.style.display === "none") {
      this.speechBubbleDiv.innerText = this.name;
      this.speechBubbleDiv.style.display = "block";
      this.element.style.zIndex = 9999;
      const { height } = this.speechBubbleDiv.getBoundingClientRect();
      this.speechBubbleDiv.style.top = -height + "px";
    } else {
      this.speechBubbleDiv.style.display = "none";
      this.element.style.zIndex = 0;
    }
  };

  move = {
    left: (pixels) => {
      const minX = this.aquarium.movementBounds.left;
      this.x = Math.max(this.x - pixels, minX);
      this.update();
    },
    right: (pixels) => {
      const maxX = this.aquarium.movementBounds.right - this.width;
      this.x = Math.min(this.x + pixels, maxX);
      this.update();
    },
    up: (pixels) => {
      const minY = this.aquarium.movementBounds.top;
      this.y = Math.max(this.y - pixels, minY);
      this.update();
    },
    down: (pixels) => {
      const maxY = this.aquarium.movementBounds.bottom - this.height;
      this.y = Math.min(this.y + pixels, maxY);
      this.update();
    }
  };

  // Inside the Fish class, update the swim method:
  swim = () => {  
    if (!this.aquarium.movementBounds) return;
    const b = this.aquarium.movementBounds;
    const leftEdge = b.left;
    const rightEdge = b.right - this.width;
    const horizontalStep = 1.1;

    if (!this.swimReverse) {
        this.move.right(horizontalStep);
        this.scaleX = 1; // Facing right.
    } else {
        this.move.left(horizontalStep);
        this.scaleX = -1; // Facing left.
    }

    // Reverse direction when hitting the edge.
    if (this.x === (this.swimReverse ? leftEdge : rightEdge)) {
        this.swimReverse = !this.swimReverse;
    }

    // Increase vertical drift multiplier from 2 to 4 for more noticeable vertical movement.
    const verticalStep = (Math.random() - 0.5) * 4;
    if (verticalStep > 0) {
        this.move.down(verticalStep);
    } else {
        this.move.up(-verticalStep);
    }
    };


  update = () => {
    // Update fish container's position.
    this.element.style.transition = "transform 0.15s linear";
    this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;

    // Update the fish graphic flip.
    const lottiePlayer = this.element.querySelector("lottie-player");
    if (lottiePlayer) {
      lottiePlayer.style.transition = "transform 0.15s linear";
      lottiePlayer.style.transform = `scale(${this.scaleX}, 1)`;
    }

    // Reposition the fish name.
    const fishNameDiv = this.element.querySelector(".fish-name");
    if (fishNameDiv) {
      if (this.scaleX < 0) {
        fishNameDiv.style.left = "auto";
        fishNameDiv.style.right = "80px";
      } else {
        fishNameDiv.style.left = "80px";
        fishNameDiv.style.right = "auto";
      }
      fishNameDiv.style.transform = "scale(1,1)";
    }

    // Reposition the speech bubble.
    if (this.speechBubbleDiv) {
      if (this.scaleX < 0) {
        this.speechBubbleDiv.style.left = "auto";
        this.speechBubbleDiv.style.right = "10px";
      } else {
        this.speechBubbleDiv.style.left = "10px";
        this.speechBubbleDiv.style.right = "auto";
      }
      this.speechBubbleDiv.style.transform = "scale(1,1)";
    }
  };
}


/**
 * Class representing the aquarium environment.
 */
class Aquarium {
  constructor({ aquariumRef, fishes }) {
    this.element = aquariumRef;

    // Create a background lottie-player.
    const lottiePlayer = document.createElement("lottie-player");
    lottiePlayer.src = backgroundLottie;
    lottiePlayer.setAttribute("background", "transparent");
    lottiePlayer.setAttribute("speed", "1");
    lottiePlayer.style.width = "100%";
    lottiePlayer.style.height = "100%";
    lottiePlayer.setAttribute("loop", "");
    lottiePlayer.setAttribute("autoplay", "");

    // Clear previous content and add background.
    this.element.innerHTML = "";
    this.element.appendChild(lottiePlayer);

    // Grey overlay to visualize the bounding region.
    this.filterOverlay = document.createElement("div");
    this.filterOverlay.style.position = "absolute";
    this.filterOverlay.style.pointerEvents = "none";
    //this.filterOverlay.style.background = "rgba(128, 128, 128, 0.3)";
    this.element.appendChild(this.filterOverlay);

    // Initialize fish and set bounds.
    this.fishes = [];
    this.handleResize();
    fishes.forEach(fishSettings => this.addFish(fishSettings));
    window.addEventListener("resize", this.handleResize);
  }

  addFish = (settings) => {
    this.fishes.push(new Fish({ settings, aquarium: this }));
  };

  // Set a fixed 300px tall movement region at the top of the container.
  handleResize = () => {
    const { width } = this.element.getBoundingClientRect();
    const desiredHeight = 300; // Fixed movement area height.
    const topOffset = 0;       // Adjust if needed.
    this.movementBounds = {
      left: 0,
      top: topOffset-25,
      width: width,
      height: desiredHeight,
      right: width,
      bottom: topOffset + desiredHeight - 111
    };


    // Resize the grey overlay to match the bounds.
    this.filterOverlay.style.left = "0px";
    this.filterOverlay.style.top = topOffset + "px";
    this.filterOverlay.style.width = width + "px";
    this.filterOverlay.style.height = desiredHeight + "px";
  };
}

return { Aquarium };

```



## Animation

```jsx
// Animation Module (Using v3 header)
function AnimationModule() {
  class Animation {
    /**
     * Create an Animation.
     * @param {Object} options - The animation options.
     * @param {Function} options.behavior - The function to execute on each frame.
     * @param {number} [options.duration=20] - The interval in milliseconds between frames.
     */
    constructor({ behavior, duration = 20 }) {
      this.fpsInterval = duration;
      this.then = Date.now();
      this.startTime = this.then;
      this.behavior = behavior;
      this.stop = false;
      this.animate();
    }
  
    animate = () => {
      if (this.stop) return;
      requestAnimationFrame(this.animate);
      this.now = Date.now();
      this.elapsed = this.now - this.then;
      if (this.elapsed > this.fpsInterval) {
        this.then = this.now - (this.elapsed % this.fpsInterval);
        this.behavior();
      }
    };
  
    toggleAnimation() {
      if (this.stop) {
        this.stop = false;
        this.animate();
      } else {
        this.stop = true;
      }
    }
  }
  return { Animation };
}

return AnimationModule();

```


## Styles

```jsx
// Styles Module
function Styles() {
  return {
    mainContainer: {
      display: "flex",
      flexDirection: "column",
      backgroundColor: "var(--background-primary)",
      color: "var(--text-normal)",
      height: "100%",
      boxSizing: "border-box",
    },
    tank: {
      position: "relative",
  width: "600px",
  height: "600px", /* or however tall you want */
  overflow: "hidden",
    },
    fish: {
      backgroundRepeat: "no-repeat",
      width: "15px",
      height: "5vh",
      backgroundSize: "cover",
      position: "absolute",
      top: "200px",
      borderRadius: "0",
    },
    fishName: {
      userSelect: "none",
      position: "absolute",
      width: "70px",
      height: "25px",
      top: "15px",
      left: "80px",
      textAlign: "center",
      fontWeight: "bold",
    },
    fishHover: {
      cursor: "pointer",
      filter: "drop-shadow(0 0 30px white)",
    },
    fishNameHover: {
      textShadow: "rgba(255, 255, 255, 1) 0 0 20px",
      transition: "background-color 3s ease",
    },
    speechBubble: {
      position: "absolute",
      background: "#00aabb",
      borderRadius: ".4em",
      minHeight: "40px",
      top: "-40px",
      left: "10px",
      width: "200px",
      padding: "3px",
    },
    speechBubbleAfter: {
      content: '""',
      position: "absolute",
      bottom: "0",
      left: "85%",
      width: "0",
      height: "0",
      border: "12px solid transparent",
      borderTopColor: "#00aabb",
      borderBottom: "0",
      borderLeft: "0",
      marginLeft: "-6px",
      marginBottom: "-12px",
    },
  };
}

return { Styles };

```

