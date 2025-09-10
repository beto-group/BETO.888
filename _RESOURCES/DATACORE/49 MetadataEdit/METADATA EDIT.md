


### Tab: Metadata Edit

- **Description**: A powerful, spreadsheet-like interface for viewing and manipulating the YAML frontmatter of multiple Obsidian notes simultaneously. This tool is designed for advanced users who need to perform bulk operations on metadata. It allows for adding, editing, and deleting properties across a selection of files, with intelligent type inference and a clean, tabbed interface for switching between individual file contexts.
    
- **Does**:
    - **Multi-File Management**:
        - Allows users to add multiple file paths to the editor, creating a "workspace" of notes to manage.
        - Displays each file in a separate tab for quick context switching.

    - **Intuitive Property Editing**:
        - Renders each frontmatter key-value pair in a clear, editable table for the selected file.
        - Automatically infers the data type of each property (text, number, checkbox, list, date, datetime) and provides the appropriate input control.
        - Features a dedicated ListEditor for easily adding or removing items from array-type properties.

    - **Bulk Operations**:
        - **Bulk Edit**: Select a property from a dropdown of all unique keys found across the selected files and apply a new value to all of them at once.
        - **Bulk Add**: Define a new property (key, type, and value) and add it to the frontmatter of all selected files simultaneously.
        - **Bulk Delete**: Select a property and remove it from the frontmatter of all selected files in a single action, after a confirmation prompt.

    - **Advanced List Manipulation**:
        - When bulk-editing list properties, provides advanced modes to replace the entire list, append new unique items, or remove specific items across all files.

    - **Live Updates**:
        - Actively listens for changes to the metadata of any file in the workspace and provides a status update, ensuring the editor's view remains synchronized with the vault.

- **Can’t**:
    - Edit the body content of the notes; it is strictly a frontmatter editor.
    - Create new files directly. Users must add paths to existing files.
    - Visually represent or manage complex nested objects within the frontmatter; it is optimized for key-value pairs and simple lists.
    - Automatically discover files based on tags or queries; files must be added manually by their path.


![alt text](/_RESOURCES/IMAGES/metadata_edit.webp)





###### [Metadata Edit Viewer](D.q.metadataedit.viewer.md)

###### [Metadata Edit Components](D.q.metadataedit.component.md)
