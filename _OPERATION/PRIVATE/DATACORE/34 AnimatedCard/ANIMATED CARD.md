
### Tab: AnimatedCard

- **Description**: A highly polished 3D component that renders a single, interactive card. The card's front face plays a sequence of videos from a weighted playlist, creating a dynamic, "living" texture.

- **Does**:
   
    - Renders a 3D card model using Babylon.js with distinct textures for the front, back, and edges.
    - Uses a local video file as a "live" texture for the card's front face.
    - Implements a weighted playlist system to randomly select the next video to play, with an override to force a "rare" video by holding Shift while clicking.
    - Pre-loads the next video in the background while the current one is playing for a seamless transition.
    - Features idle-state auto-rotation that stops upon user interaction and resumes after a period of inactivity.
    - Includes a refresh button to restart the video playlist from the beginning.

- **Can’t**:
   
    - Display more than one card at a time.
    - Use anything other than a video as the animated texture (e.g., GIFs, Lottie animations).
    - Save its state; the video sequence and rotation reset on every view load.
    - Have its content (video files, card textures) or behavior (rotation speed, weights) configured without editing the code.


<iframe allowfullscreen src="https://www.youtube.com/embed/fcnKYyVMmCc" width="100%" height="555" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ></iframe>




![animated_card.webp](/_RESOURCES/IMAGES/animated_card.webp)


### Components

###### [Animated Card Viewer](D.q.animatedcard.viewer.md)

###### [Animated Card Component](D.q.animatedcard.component.md)

