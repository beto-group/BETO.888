---
permalink: dashboard.enigmas
---

###### NAVIGATE - BACK :  [[DASHBOARD]]
----
>[!info]- [[ENIGMAS]]
-----
#### AENIGMAS


GOOD WAY TO MAKE OBSIDIAN DASHBOARDS
https://www.youtube.com/watch?v=zUCPEEy7G9w
>[!quote]- NARU
><iframe allowfullscreen src="https://www.youtube.com/embed/zUCPEEy7G9w" width="100%" height="500" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ></iframe>

-----

#### Main Properties

- **Starting Point:** This is where you always start your work.
- **Accessibility:** From this point, you should be able to reach any note in the system.
    - **Connected System:** Ensure no notes are unrelated.
    - **Minimize Clicks:** Reduce the number of clicks needed to access each note by consolidating information and creating generalizations.

#### Recommended Contents

1. **Types of Sources:**
    
    - Notes categorizing different types of sources (e.g., books, films, articles).
2. **Help Note:**
    
    - A note with guidance on how to navigate and use the system.
3. **Content Map:**
    
    - A note forming your content map, linking to various topics and notes.
4. **Information Processing Algorithm:**
    
    - A note detailing the key operations you perform on different sources.
5. **Trackers:**
    
    - Habit trackers and other tracking notes, if you use them for self-monitoring.

#### Display Methods

1. **Plain Note:**
    
    - A simple, organized note listing all necessary links.
2. **Kanban Board:**
    
    - Visualize tasks and notes using a Kanban board for a more dynamic interface.
3. **Excalidraw:**
    
    - Create a visual map or diagram using Excalidraw for a graphical representation.
4. **Custom CSS:**
    
    - Apply custom CSS to enhance the visual appeal and organization of your dashboard.
5. **Dashboard:**
    
    - Create a functional and interactive dashboard to serve as the first entry point.


-----

### Setting Up Your Obsidian Dashboard

#### Step-by-Step Guide

1. **Download Required Files:**
    
    - **dashboard.css**
    - **dashboard-ReadLineLength.css**
2. **Place Files in Snippets Folder:**
    
    - Navigate to your knowledge base folder: `.../your_folder_with_database_knowledge/.obsidian/snippets/`
    - If the `snippets` folder does not exist, create it.
    - Place the downloaded files in the `snippets` folder.
3. **Enable Snippets in Settings:**
    
    - Open Obsidian.
    - Go to `Settings` > `Appearance` > `CSS Snippets`.
    - Enable `dashboard` and `dashboard-ReadLineLength`.
4. **Configure Dashboard Metadata:**
    
    - In your dashboard note, add the following to the metadata:
        
        markdown
        
        Copy code
        
        `--- cssclass: dashboard ---`
        
5. **Example Dashboard Layout:**
    
    **Editing Mode:**
    
    markdown
    
    Copy code

```
---
cssclass: dashboard
---
# Dashboard

## Sources
- [[Books]]
- [[Films]]
- [[Articles]]
- [[Podcasts]]

## Content Map
- [[Data Science]]
- [[Philosophy]]
- [[Personal Development]]

## Process
- [[Information Processing]]
- [[Trackers]]
```
    
6. **Inspect and Refine Links:**
    
    - Ensure the links to your notes such as `Projects` and `Index` are properly set up.
7. **Optional Plugins:**
    
    - **Homepage Plugin:**
        - Add a hotkey command and button for quick access to your homepage.
        - Provides additional behavior customization for the homepage.
    - **Banners Plugin:**
        - Allows you to add a banner image at the top of your page for visual appeal.
8. **Additional Ideas:**
    
    - Use the dashboard style in other parts of your knowledge base for a consistent look and feel.

### Notes

----

- **Minimal Theme:** Consider using a minimal theme for a clean and simple interface.

### Ensuring Full-Width Dashboard in Obsidian

#### Method 1: Make All Notes Full Width

1. **Open Obsidian Settings:**
    
    - Go to `Settings` > `Editor`.
    - Disable the option to limit the width of the editor.
    
    This will make all your notes extend to the full available width.
    

#### Method 2: Add `max` to `cssclass`

1. **Modify Metadata:**
    - In your dashboard note, update the metadata as follows:
        
        markdown
        
        Copy code
        
        `--- cssclass: dashboard, max ---`
        

#### Method 2.1: Update the Dashboard Snippet

1. **Modify `dashboard.css`:**
    
    - Open the `dashboard.css` file you placed in the snippets folder.
    - Add the following code to ensure the dashboard always stretches to the full width:
        
        css
        
        Copy code
        
        `.dashboard {   --line-width: var(--max-width);   --container-table-width: var(--max-width);   --container-img-width: var(--max-width);   --container-iframe-width: var(--max-width);   --container-map-width: var(--max-width);   --container-chart-width: var(--max-width); }`
        
2. **Enable Snippets:**
    
    - Make sure the `dashboard.css` snippet is enabled in `Settings` > `Appearance` > `CSS Snippets`.

-----

### Setting Up a Flexible Dashboard in Obsidian with Modular CSS Layout

#### Step-by-Step Guide

1. **Download Required Snippets:**
    
- [MCL Wide Views.css](https://github.com/efemkay/obsidian-modular-css-layout/blob/main/MCL%20Wide%20Views.css)
    
- [MCL Multi Column.css](https://github.com/efemkay/obsidian-modular-css-layout/blob/main/MCL%20Multi%20Column.css)


2. **Place Files in Snippets Folder:**
    
    - Navigate to your knowledge base folder: `.../your_folder_with_database_knowledge/.obsidian/snippets/`
    - If the `snippets` folder does not exist, create it.
    - Place the downloaded files in the `snippets` folder.
3. **Enable Snippets in Settings:**
    
    - Open Obsidian.
    - Go to `Settings` > `Appearance` > `CSS Snippets`.
    - Enable `MCL Wide Views` and `MCL Multi Column`.
4. **Configure Dashboard Metadata:**
    
    - In your dashboard note, add the following to the metadata to utilize the three-column grid and wide-page layout:
        
        markdown
        
        Copy code
        
        `--- cssclass: three-column-grid-list, wide-page ---`
        

### Example Dashboard Layout

**Editing Mode:**

markdown

Copy code

`--- cssclass: three-column-grid-list, wide-page --- # Dashboard  ## Sources - [[Books]] - [[Films]] - [[Articles]] - [[Podcasts]]  ## Content Map - [[Data Science]] - [[Philosophy]] - [[Personal Development]]  ## Process - [[Information Processing]] - [[Trackers]]`


The solution is more universal (it should not depend on the topic) and implies flexibility. You can take a look at the page on how to use the cssclass from these snippets [Modular CSS Layout](https://github.com/efemkay/obsidian-modular-css-layout).

-----

- **Alternative Implementations:** Explore different dashboard layouts and styles to find what works best for you.

By following these steps, you can create an efficient and visually appealing dashboard in Obsidian, enhancing your productivity and organization.


------

https://medium.com/obsidian-observer/dashboard-a-simple-organization-and-navigation-method-for-obsidian-vaults-2b1982d023a0

------


https://tfthacker.com/DashboardPlusPLus

-----
