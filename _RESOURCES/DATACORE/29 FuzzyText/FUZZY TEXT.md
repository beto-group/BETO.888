
### Tab: Fuzzy Text

- **Description**: A highly stylized and performant component that renders text with a dynamic, "fuzzy" horizontal glitch effect. It uses the HTML5 Canvas API to create an animated, shimmering text block that can be configured to react to user interaction, making it an excellent tool for creating eye-catching headers and titles. Redesign from [ReactBits](https://www.reactbits.dev/)

- **Does**:   

    - **Dynamic Text Rendering**: Takes any string as input and renders it to a `<canvas>` element.
    - **Fuzzy Glitch Animation**: Applies a continuous, randomized horizontal distortion to the text, creating a shimmering or "fuzzy" visual effect. The animation runs efficiently using requestAnimationFrame.
    - **Interactive Hover Effect**: When enabled, the intensity of the fuzz effect increases as the user hovers their mouse over the text, creating a responsive and engaging interaction.
    - **Highly Customizable Appearance**: The visual style of the text can be fully customized through props, including:
        - fontSize (supports responsive values like clamp())
        - fontWeight
        - fontFamily
        - color
    - **Configurable Animation Intensity**: The strength of the base animation and the hover effect can be fine-tuned using the baseIntensity and hoverIntensity props.
    - **Intelligent Font & Size Handling**: It waits for document fonts to be ready before rendering to ensure custom fonts are displayed correctly. It also precisely measures the text to create a tightly fitting canvas that adapts to the content.

- **Can’t**:
   
    - **Render Multi-Line Text**: The component joins all child elements into a single line of text. It does not support line breaks or paragraph rendering.
    - **Render Complex Content**: It is designed to render plain text only. It cannot render HTML elements, links, or other components as its children.
    - **Be Selected as Standard Text**: Because the text is rendered on a canvas, it cannot be selected, copied, or interacted with like normal DOM text.
    - **Provide Animation Controls**: The animation is hard-coded to run continuously. It does not offer props to pause, stop, or change the speed of the animation.


-----

![fuzzytext.webp](_resources/images/fuzzy_text.webp)





### Components

###### [Fuzzy Text Viewer](D.q.fuzzytext.viewer.md)

###### [Fuzzy Text Component](D.q.fuzzytext.component.md)


