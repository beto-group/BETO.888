

https://claude.site/artifacts/53d60fba-7e3b-4c15-9b32-3c259115fd65
<iframe allowfullscreen src="https://claude.site/artifacts/53d60fba-7e3b-4c15-9b32-3c259115fd65" width="100%" height="333" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />


#### CODE

```html

<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #1a1a1a;
      overflow: hidden;
    }

    .blob-container {
      position: relative;
      width: 100vw;
      height: 100vh;
    }

    .center-blob {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 300px;
      height: 300px;
      background: radial-gradient(circle at center, 
        rgba(200, 200, 200, 0.7) 0%,
        rgba(100, 100, 100, 0.3) 50%,
        rgba(50, 50, 50, 0) 100%
      );
      filter: blur(10px);
      border-radius: 50%;
    }

    .wandering-blob {
      position: absolute;
      background: radial-gradient(circle at center,
        rgba(180, 180, 180, 0.4) 0%,
        rgba(180, 180, 180, 0.1) 50%,
        rgba(180, 180, 180, 0) 100%
      );
      mix-blend-mode: screen;
      filter: blur(8px);
      border-radius: 50%;
    }

    .wandering-blob:nth-child(2) {
      width: 200px;
      height: 200px;
      animation: wander1 25s infinite;
    }

    .wandering-blob:nth-child(3) {
      width: 180px;
      height: 180px;
      animation: wander2 28s infinite;
    }

    .wandering-blob:nth-child(4) {
      width: 220px;
      height: 220px;
      animation: wander3 30s infinite;
    }

    .wandering-blob:nth-child(5) {
      width: 160px;
      height: 160px;
      animation: wander4 22s infinite;
    }

    .wandering-blob:nth-child(6) {
      width: 190px;
      height: 190px;
      animation: wander5 27s infinite;
    }

    @keyframes wander1 {
      0% { transform: translate(-80vw, -40vh) scale(0.8); opacity: 0; }
      20% { transform: translate(60vw, -30vh) scale(1.2); opacity: 0.5; }
      40% { transform: translate(-30vw, 40vh) scale(0.9); opacity: 0.3; }
      60% { transform: translate(40vw, 35vh) scale(1.1); opacity: 0.4; }
      80% { transform: translate(-50vw, -20vh) scale(1); opacity: 0.5; }
      100% { transform: translate(-80vw, -40vh) scale(0.8); opacity: 0; }
    }

    @keyframes wander2 {
      0% { transform: translate(70vw, 30vh) scale(0.9); opacity: 0; }
      20% { transform: translate(-50vw, 40vh) scale(1.1); opacity: 0.4; }
      40% { transform: translate(20vw, -35vh) scale(1); opacity: 0.5; }
      60% { transform: translate(-60vw, -25vh) scale(0.8); opacity: 0.3; }
      80% { transform: translate(40vw, 20vh) scale(1.2); opacity: 0.4; }
      100% { transform: translate(70vw, 30vh) scale(0.9); opacity: 0; }
    }

    @keyframes wander3 {
      0% { transform: translate(0, -70vh) scale(1); opacity: 0; }
      20% { transform: translate(-65vw, 20vh) scale(0.8); opacity: 0.5; }
      40% { transform: translate(45vw, 30vh) scale(1.2); opacity: 0.4; }
      60% { transform: translate(-30vw, -40vh) scale(0.9); opacity: 0.3; }
      80% { transform: translate(55vw, -25vh) scale(1.1); opacity: 0.5; }
      100% { transform: translate(0, -70vh) scale(1); opacity: 0; }
    }

    @keyframes wander4 {
      0% { transform: translate(-60vw, 0) scale(1.1); opacity: 0; }
      20% { transform: translate(30vw, 45vh) scale(0.9); opacity: 0.4; }
      40% { transform: translate(50vw, -35vh) scale(1); opacity: 0.5; }
      60% { transform: translate(-40vw, -30vh) scale(1.2); opacity: 0.3; }
      80% { transform: translate(20vw, 40vh) scale(0.8); opacity: 0.4; }
      100% { transform: translate(-60vw, 0) scale(1.1); opacity: 0; }
    }

    @keyframes wander5 {
      0% { transform: translate(50vw, -50vh) scale(0.9); opacity: 0; }
      20% { transform: translate(-45vw, -30vh) scale(1.1); opacity: 0.5; }
      40% { transform: translate(35vw, 40vh) scale(0.8); opacity: 0.3; }
      60% { transform: translate(-55vw, 25vh) scale(1.2); opacity: 0.4; }
      80% { transform: translate(25vw, -35vh) scale(1); opacity: 0.5; }
      100% { transform: translate(50vw, -50vh) scale(0.9); opacity: 0; }
    }
  </style>
</head>
<body>
  <div class="blob-container">
    <div class="center-blob"></div>
    <div class="wandering-blob"></div>
    <div class="wandering-blob"></div>
    <div class="wandering-blob"></div>
    <div class="wandering-blob"></div>
    <div class="wandering-blob"></div>
  </div>
</body>
</html>
```