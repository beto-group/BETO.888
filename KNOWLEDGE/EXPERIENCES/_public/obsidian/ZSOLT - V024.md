
# Excalidraw Presentations in Obsidian
LINK : https://www.youtube.com/watch?v=nMYUnnVkw2g



### How to Create Presentations in Obsidian Excalidraw

Hey guys, I'd like to show you how you can use Excalidraw in Obsidian to create a presentation. Here's how you do it:

#### Creating a Template

1. **Create a Rectangle**: Start by creating a rectangle sized exactly to the dimensions of your presentation screen. This helps in positioning objects and ensuring they fit within the screen. It also makes sure that the "zoom to fit" function works correctly.
2. **Navigation Link**: Add a link in the bottom right-hand corner of the slide for navigation.
3. **Switch to Preview Mode**: To see how your links are rendered, switch to preview mode.
4. **Modify Front Matter**: Add the following setting to your front matter:
    
    vbnet
    
    Copy code
    
    `excalidual_link_prefix: ""`
    
    This removes the default Excalidraw link prefix (a diamond shape) which doesn't look nice on slides.

#### Managing Templates

1. **Save Templates**: Save your templates in a dedicated folder or use a naming convention for easy management.
2. **Authoring Templates**: Create a separate folder for each presentation. Each page in the document will be a separate file named slide1, slide2, etc.

#### Creating Slides

1. **Organize Slides**: Store your slides as individual files within your presentation folder.
2. **Copy Slides**: Use the file manager to copy and add new slides to your presentation.

#### Presentation Options

1. **Present Directly from Excalidraw**:
    
    - Go to the first slide.
    - Click "Full Screen".
    - Switch to "View Mode" (shortcut: Alt + R).
    - Use the navigation button in the bottom right to move through slides.
    - Set up hotkeys for back and forward navigation using Obsidian's feature to move between documents.
2. **Using Obsidian Slides Core Plugin**:
    
    - Create a file called "Presentations".
    - Embed your drawings into this file.
    - Ensure each slide is sized at 100% for proper display.
    - Apply a CSS snippet to ensure slides show full screen during presentations:
        
        css
        
        Copy code
        
        `.slide-container {   height: 100vh;   width: 100vw;   overflow: hidden; }`
        
    - Turn this snippet on or off depending on your preference for slide margins.

### Conclusion

Using Excalidraw for presentations in Obsidian offers a cool and flexible way to create and manage your slides. I hope you enjoy this feature! Thank you.

4o

redo keep it bulleit point and to the point too much long sentence at time

ChatGPT

### How to Create Presentations in Obsidian Excalidraw

Hey guys, I'd like to show you how you can use Excalidraw in Obsidian to create a presentation. Here's how you do it:

#### Creating a Template

- **Create a Rectangle**: Size it to your presentation screen dimensions. Helps with positioning and ensuring objects fit.
- **Add Navigation Link**: Place a link in the bottom right corner for navigation.
- **Switch to Preview Mode**: To see how links are rendered.
- **Modify Front Matter**:
    
    yaml
    
    Copy code
    
    `excalidual_link_prefix: ""`
    
    Removes the default Excalidraw link prefix.

#### Managing Templates

- **Save Templates**: Use a dedicated folder or naming convention for templates.
- **Create Folders**: Each presentation should have its own folder with slides named sequentially (slide1, slide2, etc.).

#### Creating Slides

- **Organize Slides**: Store slides as individual files in your presentation folder.
- **Copy Slides**: Use the file manager to duplicate and add new slides.

#### Presentation Options

1. **Present Directly from Excalidraw**:
    
    - Open the first slide.
    - Click "Full Screen".
    - Switch to "View Mode" (shortcut: Alt + R).
    - Use the navigation button in the bottom right to move through slides.
    - Set up hotkeys for navigation using Obsidian's document history feature.
2. **Using Obsidian Slides Core Plugin**:
    
    - Create a file named "Presentations".
    - Embed your drawings into this file.
    - Size each slide at 100%.
    - Apply a CSS snippet for full-screen display during presentations:
        
        css
        
        Copy code
        
        `.slide-container {   height: 100vh;   width: 100vw;   overflow: hidden; }`
        
    - Turn the CSS snippet on or off based on your preference for slide margins.



