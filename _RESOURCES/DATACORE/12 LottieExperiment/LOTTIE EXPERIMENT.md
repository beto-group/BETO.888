
### Tab: Lottie Experiment

- **Description**: An experimental component that demonstrates how to layer multiple Lottie animations and add simple hover-based interactivity.
    
- **Does**:
    
    - Renders multiple Lottie animations layered on top of each other using absolute positioning.
    - Uses fuzzy search to locate the required .json files from anywhere in the vault by their filename.
    - Adds interactivity to one of the animations, causing it to pause on mouse hover and resume playing on mouse leave.
    - Dynamically loads the Lottie player library from a CDN when needed.
        
- **Can’t**:
    
    - The filenames for the animations are hardcoded and cannot be changed via a UI.
    - Lacks advanced playback controls like a timeline scrubber or speed adjustments.
    - The layout of the layered animations is fixed within the component's code.
    - Requires an internet connection for the initial download of the Lottie player library.


<iframe allowfullscreen src="https://www.youtube.com/embed/BoJ_ciW3WZE" width="100%" height="555" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ></iframe>



![lottie_experiment.webp](/_RESOURCES/IMAGES/lottie_experiment.webp)


### Components

###### [Lottie Experiment Viewer](D.q.lottieexperiment.viewer.md)

###### [Lottie Experiment Component](D.q.lottieexperiment.component.md)

