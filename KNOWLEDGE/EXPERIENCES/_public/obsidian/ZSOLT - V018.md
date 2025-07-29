
TITLE : Obsidian-Excalidraw 1.2.0 Walkthrough Part 5/10: Embedding and portability
LINK : https://www.youtube.com/watch?v=MaJ5jJwBRWs


### Obsidian XColidraw Walkthrough: Part 5 - Embedding Drawings and Portability

#### Embedding Drawings

1. **Embedding a Drawing:**
    
    - Open an empty markdown document.
    - Drag the desired drawing file into the document.
    - Add an exclamation mark before the file link to transclude the image.
    - Example: `![[drawing.excalidraw]]`
2. **Viewing Drawings in Edit Mode:**
    
    - Install and enable the **Ozones Image Editor** plugin.
    - Turn on the "Render Excalidraw in editor" switch to view drawings in edit mode.
    - Note: This plugin is particular about file naming.
3. **File Naming:**
    
    - If the file name does not include `.excalidraw`, the image may not display.
    - Adding `.md` to the file name can also work.
    - Example: `drawing.md`

#### Additional Embedding Features

1. **Embedding the Most Recent Drawing:**
    
    - Use the embed function to transclude the most recently edited drawing.
    - Example: Mind map drawing will be added by default.
2. **Embedding Specific Drawings:**
    
    - Use the command palette to embed any drawing from your vault.
    - Example: Embed a SWOT analysis drawing.
3. **Formatting Embedded Drawings:**
    
    - Add formatting options after the pipe character (`|`).
    - Example: `![[drawing.excalidraw|400x400]]` sets the width and height.
    - Example: `![[drawing.excalidraw|right]]` aligns the image to the right.
4. **Wrap Text Around Images:**
    
    - Example: `![[drawing.excalidraw|right-wrap]]` wraps text around the image.

#### Customizing Drawings

1. **Editing Drawings:**
    
    - Open the drawing in XColidraw.
    - Make changes such as resizing or altering colors.
    - Changes reflect in the embedded image.
2. **Transparent Backgrounds:**
    
    - Change the background to transparent for better integration.
    - Example: Transparent background in dark mode.
3. **Setting Export Options:**
    
    - Go to XColidraw settings and adjust export options.
    - Example: Export images with a theme or background.

#### Portability

1. **Exporting Drawings:**
    
    - Export drawings to `.excalidraw`, `.svg`, or `.png` formats.
    - Use the "More Options" menu to export the drawing.
    - Example: Export to `.svg` or `.png`.
2. **Automatic File Name Syncing:**
    
    - XColidraw keeps file names in sync with drawings.
    - Renaming or moving a drawing also updates the export files.
3. **Automatic Export:**
    
    - Enable automatic export to `.svg` or `.png` in settings.
    - Automatically create copies of drawings whenever they are modified.
    - Useful for embedding drawings in other platforms.

#### Conclusion

- This part covered how to embed drawings in markdown documents and maintain portability.
- The features demonstrated help in integrating drawings seamlessly and keeping them updated.
- Stay tuned for the next part where we will explore further customization and advanced features.