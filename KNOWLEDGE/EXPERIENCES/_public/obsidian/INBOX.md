

## ENIGMAS
----

[[OBSIDIAN INBOX TEMPLATES]]

----

#### Introduction

If you are building a knowledge base from sources, you may use the inbox feature rarely. However, adding it from the beginning prevents future confusion about where to place fleeting notes.

#### Using Plugins

While Obsidian can be effective without plugins, using them can optimize routine actions and enhance efficiency. Therefore, it's rational to incorporate plugins into your workflow.

#### Setting Up the Inbox with Templater

1. **Install the Templater Plugin:**
    
    - Go to `Settings` > `Community plugins` > `Browse`.
    - Search for "Templater" and install it.
    - Enable the Templater plugin.
2. **Create an Inbox Template:**
    
    - Create a new template note named `_inbox template`.
    - Place this template in the `templates` folder.
    - The template content is simple:
        
        markdown
        
        Copy code
        
        `# 📥`
        
3. **Configure Templater Settings:**
    
    - Go to `Settings` > `Templater`.
    - Set the `Template Folder Location` to the folder where you placed `_inbox template`.
4. **Assign Hotkey to Create Inbox Note:**
    
    - Change the default `Ctrl + N` (new note) hotkey to create a new note using the Templater template.
    - Go to `Settings` > `Hotkeys`.
    - Find the `New note` command and remove its hotkey.
    - Find the `Templater: Create new note from template` command and set the hotkey to `Ctrl + N`.
    - Configure the Templater command to use `_inbox template`.
5. **Viewing Inbox Notes:**
    
    - You can view the list of inbox notes by clicking on the 📥 tag in the tag panel.
    - For a more convenient display, you can use the Dataview plugin (instructions for Dataview will follow later).

### Example of Inbox Template

**Template Content (_inbox template):**

markdown

Copy code

`# 📥`

**Metadata Configuration:**

markdown

Copy code

`--- cssclass: dashboard ---`

### Instructions for Creating a New Inbox Note

1. **Create a New Inbox Note:**
    
    - Press `Ctrl + N`.
    - A new note will be created with the 📥 tag, indicating it is an inbox note.
2. **Accessing Inbox Notes:**
    
    - Click on the 📥 tag in the tag panel to see all notes marked as inbox notes.

### Summary

By setting up an inbox system using the Templater plugin, you ensure that fleeting notes are efficiently managed and easily accessible. This setup helps maintain an organized knowledge base in Obsidian, streamlining your workflow and improving productivity.




----

**Create an Inbox in Obsidian**

- **Create an Inbox Folder:**
    1. Click the "New folder" icon.
    2. Name the folder "inbox". Adding an underscore (_inbox) will move it to the top for easy access.



----