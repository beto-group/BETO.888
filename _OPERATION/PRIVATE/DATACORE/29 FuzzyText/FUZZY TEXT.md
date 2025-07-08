
### Tab: FuzzyText

- **Description**: A highly stylized text rendering component that uses an HTML canvas to create a "fuzzy" or "glitchy" analog distortion effect. The intensity of the effect can be configured to change on mouse hover.
   
- **Does**:

    - Renders any given text onto an HTML canvas element.
    - Applies a per-scanline horizontal displacement effect to the text, creating a noisy, analog, "fuzzy" appearance.
    - Can be configured to increase the intensity of the fuzz effect when the user hovers their mouse over the text.
    - Dynamically calculates the text size and bounding box to ensure the effect is applied correctly, regardless of the font or content.
    - Is customizable via props for font size, weight, color, and the intensity of the fuzz effect for both its base and hover states.

- **Can’t**:
   
    - Render complex layouts with mixed formatting (like bold and italic within the same block). It applies one style to all of its text content.
    - Be selected or copied like standard HTML text, as it is rendered on a canvas.
    - Wrap text automatically; it's designed for single-line or pre-formatted text blocks.


![[fuzzytext.webp]]





### Components

###### [[D.q.fuzzytext.viewer|Fuzzy Text Viewer]]

###### [[D.q.fuzzytext.component|Fuzzy Text Component]]


