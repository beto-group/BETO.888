
TITLE : Obsidian-Excalidraw 1.2.0 Walkthrough Part 7/10: Markdown Features
LINK : https://www.youtube.com/watch?v=R0IAg0s-wQE



### Obsidian XColidraw Walkthrough: Part 7 - Markdown Features

#### Introduction

In this part, we'll explore the following markdown features in XColidraw:

- Front matter
- Tags and backlinks
- File history

#### Front Matter

1. **Viewing and Editing Front Matter:**
    
    - Click on "More Options" in XColidraw.
    - Change the XColidraw file to a markdown view.
    - Switch to edit mode to view and edit the front matter.
2. **Adding Front Matter:**
    
    - You can add any front matter key, such as aliases, tags, or descriptions.
    - Example:
        
        yaml
        
        Copy code
        
        `--- alias: example_alias tags: [project] description: This is a description ---`
        
3. **Preservation of Front Matter:**
    
    - Anything written above the "text elements" section in the front matter is preserved.
4. **Example of Adding Aliases:**
    
    - Add aliases in the front matter:
        
        yaml
        
        Copy code
        
        `--- alias: example_alias ---`
        

#### Tags and Backlinks

1. **Adding Tags:**
    
    - Add tags directly in the front matter:
        
        yaml
        
        Copy code
        
        `--- tags: [project] ---`
        
2. **Real-time Updates:**
    
    - Changes made in the markdown file are reflected in the XColidraw drawing.
    - Example: Adding text in the markdown file appears in the drawing.
3. **Mandatory Key:**
    
    - Ensure to include the key `excalidraw-plugin` in the front matter for the plugin to work correctly.
4. **Optional Keys:**
    
    - `excalidraw-link-prefix` and `excalidraw-link-brackets` are optional keys.
    - Example:
        
        yaml
        
        Copy code
        
        `--- excalidraw-link-prefix: "hand" excalidraw-link-brackets: true ---`
        
5. **Customizing Link Prefix and Brackets:**
    
    - Customize the link prefix and include square brackets around links.
    - Example: Change prefix to a hand symbol and enable brackets.

#### Links and Backlinks

1. **Working with Links:**
    
    - Links work as expected and can be rendered with a custom prefix.
    - Example: Use a hand symbol as a prefix for links.
2. **Viewing Backlinks:**
    
    - Open a document referenced in your XColidraw drawing to see backlinks.
    - Example: View backlinks in the Obsidian graph view to see relationships between documents.
3. **Graph View:**
    
    - Open graph view to see the visual representation of links.
    - Example: Clicking on nodes in graph view opens the relevant drawings or documents.

#### File History

1. **Accessing File History:**
    
    - Right-click on a file and choose "Version History" to view file history.
    - Note: This feature requires Obsidian Sync to be enabled.
2. **Version History:**
    
    - Obsidian Sync provides full file version history for up to a year.
    - Useful for reverting to earlier versions of drawings if needed.

#### Conclusion

- This part covered essential markdown features in XColidraw, including front matter, tags, backlinks, and file history.
- These features enhance the integration of XColidraw drawings within your Obsidian notes.
- Stay tuned for the next part where we'll discuss templates.
