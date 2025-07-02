


## ENIGMAS
----


### Setting Up a Journal System in Obsidian

#### Purpose of the Journal

1. **Recording Thoughts and Experiences:**
    
    - Document emotions, thoughts, and daily activities.
    - Reflect on events, self-observations, and travel experiences.
2. **Aggregating Tasks and Ideas:**
    
    - Collect tasks and ideas from your knowledge base.

### Required Plugins

1. **Templater:** For creating templates.
2. **Calendar:** A minimalist calendar for Obsidian.
3. **Periodic Notes:** Makes the calendar clickable.
4. **Dataview:** For aggregating tasks and ideas.

### Plugin Configuration

1. **Templater:**
    
    - Create templates for daily and weekly notes.
    - **Settings:**
        - **Automatic jump cursor:** Allows cursor to move to specified line.
        - **Trigger Templater on new file creation:** Applies the specified template for a given folder when creating a new note.
    - **Example Template for Daily Notes (`daily.md`):**
        
        markdown
        
        Copy code
        
        `# 📅 2024-11-20  ## Thoughts and Reflections -   ## Emotions and Experiences -   ## Daily Summary - What I did today: - Significant events: - Observations and self-reflections:  <% tp.file.cursor(0) %>`
        
2. **Calendar:**
    
    - Turn on the display of weeks.
3. **Periodic Notes:**
    
    - Add daily and weekly notes.
    - Specify the folders for storing these notes.
    - **Example Settings:**
        - **Daily Notes Folder:** `Journal/Daily`
        - **Weekly Notes Folder:** `Journal/Weekly`
4. **Dataview:**
    
    - For aggregating information from periodic notes.

### Template Examples

**Daily Note Template (`daily.md`):**


# Daily Summary

```dataview
table date as "Date", summary as "Summary"
from "Journal/Daily"


**Weekly Summary Aggregation (`weekly_summary.md`):**
```markdown
# Weekly Summary

```dataview
table date as "Date", summary as "Summary"
from "Journal/Weekly"
markdown
Copy code

### Final Steps

1. **Create the Snippets Folder:**
   - If not already created, create a snippets folder: `.../your_folder_with_database_knowledge/.obsidian/snippets/`

2. **Activate Snippets in Settings:**
   - Go to `Settings` > `Appearance` > `CSS Snippets` and enable the necessary snippets.

3. **Creating a Journal Entry:**
   - Click on the date in the Calendar plugin to automatically create a new daily or weekly note using the pre-defined template.

### Example Journal Workflow

1. **Daily Entry:**
   - Click on the date in the calendar.
   - The daily note template appears.
   - Fill in your thoughts, experiences, and daily summary.

2. **Weekly Entry:**
   - Click on the week in the calendar.
   - The weekly note template appears.
   - Fill in your weekly review and summary.

3. **Aggregating Entries:**
   - Use the Dataview plugin to automatically summarize and display your daily and weekly entries in `daily_summary.md` and `weekly_summary.md`.

By following these steps, you will have an organized and efficient journal system in Obsidian, enabling you to capture your thoughts and experiences while also aggregating tasks and ideas seamlessly.