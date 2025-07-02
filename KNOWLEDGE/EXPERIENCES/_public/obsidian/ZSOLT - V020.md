
TITLE : Obsidian-Excalidraw Walkthrough Part 9/10: Excalidraw Automate
LINK : https://www.youtube.com/watch?v=VRZVujfVab0




### Obsidian Excalidraw Walkthrough: Part 9 - Excalidraw Automate

#### Introduction

Welcome back! In this part, we'll discuss Excalidraw Automate, a powerful programming interface for generating drawings. This interface can be used in templater, dataview.js, and even in your own plugins. Let's dive into some of its capabilities and examples.

#### Getting Started

1. **Accessing Excalidraw Automate:**
    
    - Excalidraw Automate is available through the `window.excalidrawAutomate` object in JavaScript.
    - This can be used in templater, dataview.js, and custom plugins like Ozone's Image in Editor plugin.
2. **Documentation and Help:**
    
    - Detailed help is available online, including API documentation and examples to help you get started.

#### Simple Example

Let's start with a simple example to demonstrate the basics.

1. **Basic Script:**
    
    - This script creates two objects and connects them with an arrow.
    - Example script:
        
        javascript
        
        Copy code
        
        `const ea = window.excalidrawAutomate; ea.reset(); ea.addText(100, 50, 'Connect Objects'); const a = ea.addDiamond(200, 150, 100, 100); const b = ea.addEllipse(400, 150, 100, 100); ea.connectObjects(a, b, 'arrow', 'red');`
        
2. **Running the Script:**
    
    - Use templater or another method to run the script.
    - The result will be a drawing with a diamond and an ellipse connected by a red arrow.

#### More Complex Example

Let's look at a more complex example that generates a mind map.

1. **Mind Map Builder:**
    
    - This example uses a script to convert an outline into a mind map.
    - Example script (simplified):
        
        javascript
        
        Copy code
        
        `const ea = window.excalidrawAutomate; // Logic to parse outline and generate mind map nodes and connections ea.generateMindMap(outlineData);`
        
2. **Running the Script:**
    
    - Open a file with an outline format.
    - Run the mind map builder script.
    - The result will be a mind map with nodes and connections based on the outline.

#### Using with Data View

Excalidraw Automate can also be used with Data View to visualize data dynamically.

1. **Data View Example:**
    
    - Create a source file with tasks or other data.
    - Example source data:
        
        markdown
        
        Copy code
        
        `- [ ] Task 1 - [ ] Task 2 - [ ] Task 3`
        
2. **Script to Visualize Data:**
    
    - Example script to create a family tree from task data:
        
        javascript
        
        Copy code
        
        `const ea = window.excalidrawAutomate; // Logic to parse task data and generate a family tree ea.generateFamilyTree(taskData);`
        
3. **Running the Script:**
    
    - Run the script to visualize the data as a family tree.

#### Exporting Drawings

Excalidraw Automate allows exporting drawings to various formats.

1. **Export to SVG or PNG:**
    
    - Example script to export a drawing:
        
        javascript
        
        Copy code
        
        `const svg = ea.exportToSVG(); // Logic to save or display the SVG`
        
2. **Use Cases:**
    
    - Dynamically create and display drawings such as weather diagrams or other visual data.

#### Future Enhancements

Some ideas for future enhancements include:

- Improving charting capabilities to automatically create charts and graphs.
- Converting Mermaid diagrams into Excalidraw format for further customization.

#### Conclusion

Excalidraw Automate provides a powerful interface for generating and manipulating drawings programmatically. Whether you're creating simple diagrams or complex visualizations, this tool offers immense flexibility and potential.





