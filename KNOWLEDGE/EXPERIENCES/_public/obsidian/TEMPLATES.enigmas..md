
###### NAVIGATE - BACK : [[TEMPLATES]]
----
>[!info]- [[ENIGMAS]]
-----
#### AENIGMAS




### Template

[back | up | further]

- **Initial Block in Each Template:**
    
    - **Purpose:**
        - Prompts for the name when manually creating a note (displays a dialog box).
        - Breaks metadata to prevent Dataview from including the template itself in queries.
        - Disappears when creating notes from buttons.
- **Main Content of Templates:**
    
    - Designed for automation.
    - Fields included:
        - `parent (prev)`
        - `children`
        - `author`
        - `category`
    - These fields are for future compatibility with plugins like Breadcrubs and Excalibrain.
    - Customize by adding or removing fields as needed.



- [ ] [[OBSIDIAN BOOK TEMPLATES]]
- [ ] [[OBSIDIAN PODCAST TEMPLATES]]
- [ ] [[OBSIDIAN MOVIES TEMPLATES]]
- [ ] [[OBSIDIAN VIDEO TEMPLATES]]
- [ ] [[OBSIDIAN COURSES TEMPLATES]]
- [ ] [[OBSIDIAN ARTICLES TEMPLATES]]


#### Plugin Recommendation

- **Media Extended Plugin:**
    - Allows you to watch videos and listen to audio directly from Obsidian.
    - You can set timestamps by pressing a hotkey.
    - Optional but recommended if you find it useful.

#### Plugin Setup

1. **Install Media Extended Plugin:**
    
    - Install the "Media Extended" plugin in Obsidian.
2. **Configure Plugin:**
    
    - You may need a small plug-in setting (example stolen from another Obsidian user):
        
        markdown
        
        Copy code
        
        `{{TIMESTAMP}} <% tp.file.cursor(0) %>`
        
    - For this to work, you need to use two hotkeys:
        
        1. **Create a Timestamp:**
            
            sh
            
            Copy code
            
            `# Hotkey to create a timestamp`
            
        2. **Activate Template to Move Cursor:**
            
            sh
            
            Copy code
            
            `# Hotkey to activate the template`
            
    - This setup is a workaround to combine timestamp creation and cursor movement.
        
3. **QuickAdd Integration:**
    
    - Any number of commands can be combined into one using QuickAdd.
    - You have already set this up for films, and the same logic applies here.
4. **Using the Plugin:**
    
    - The plugin is called by the following command:
        
        sh
        
        Copy code
        
        `# Command to call the Media Extended plugin`
        
    - Insert a link to the video and enjoy seamless integration.
        

#### Coloring Nodes on a Graph for Sources

1. **Creating Groups on the Graph:**
    
    - To paint nodes on the graph, create groups. This can be done as follows:

```
graph: 
  groups: 
    - name: Movies 
      query: "'movie'" 
      color: "red"
    - name: Podcasts 
      query: "'podcast'" 
      color: "green"
    - name: Books 
      query: "'book'" 
      color: "blue"
```

        
2. **Example Configuration:**
    
    - This configuration will group and color nodes based on their type (movies, podcasts, books).

---

### Summary

- **Media Extended Plugin:**
    
    - Install to watch videos and listen to audio directly from Obsidian.
    - Set timestamps with hotkeys.
- **Setup Instructions:**
    
    - Install and configure the plugin.
    - Use two hotkeys to create timestamps and move the cursor.
- **QuickAdd Integration:**
    
    - Combine multiple commands into one using QuickAdd.
- **Using the Plugin:**
    
    - Call the plugin with a command, insert a video link, and enjoy.
- **Coloring Nodes on a Graph:**
    
    - Create groups and configure colors to differentiate sources visually.

By following these steps, you can enhance your Obsidian setup to manage and interact with video content efficiently, along with visual enhancements for source differentiation.










----
## EXPLANATION



## TUTORIAL

1. Templater Plugin Tutorial:
    - Introducing the Templater plugin and its capabilities for automating recipe note creation.
    - Creating reusable templates for different types of recipes, including placeholders for ingredients, instructions, and additional sections.
    - Utilizing Templater shortcuts to generate recipe notes with pre-defined structures and formatting.
    - Demonstrating advanced features of Templater, such as conditional statements, loops, and calculations, to enhance recipe note creation.

## HOW-TO



## REFERENCES





------

