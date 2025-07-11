

### Tab: Aquarium View {From FireStormFrontier 🫡]}

- **Description**: A whimsical, animated component that renders a virtual fish tank. Each "fish" represents a hardcoded task or item, swimming around a Lottie-animated background.
- **Does**:
    
    - Renders a visually appealing aquarium scene using a Lottie animation for the background.
    - Dynamically creates multiple "fish," each with a text label (e.g., 'Brush Teeth', 'Read').
    - Animates each fish to swim back and forth across the screen with random vertical movement.
    - Allows a user to click on a fish to pause its movement and display a speech bubble with its name.
    - Dynamically loads required libraries and assets (Lottie player, Fuse.js, animation files) from the vault or a CDN.

- **Can’t**:
   
    - Pull the list of "fish" from a dynamic source like a Datacore query; the items are hardcoded in the component.
    - Save the state of the fish (e.g., which ones are paused). The state resets on every view load.
    - Function offline due to its dependency on CDN-hosted libraries.
    - **Note:** The component is marked as "broken" and may not render correctly in all environments, likely due to changes in how dependencies are loaded or rendered.


<iframe allowfullscreen src="https://www.youtube.com/embed/2COrqMzSXZw" width="100%" height="555" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ></iframe>



![aquarium_view_broken.webp](/_RESOURCES/IMAGES/aquarium_view_broken.webp)



### Components

###### [Aquarium Viewer {FireStormFrontier 🫡}](D.q.Aquarium.viewer.md)

###### [Aquarium Component {FireStormFrontier 🫡}](D.q.Aquarium.component.md)