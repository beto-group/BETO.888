

### Tab : Hot Reload Files

- **Description**: A diagnostic and developmental component designed to actively monitor a specified folder within your vault for any file changes. It serves as a practical example of how to leverage the Datacore and Obsidian API to react to file system events in real-time. The component provides immediate visual feedback through UI notices and detailed logs in the developer console, making it an excellent tool for debugging workflows or learning how to build event-driven actions.
    
- **Compatibility Note**: This component relies on the dc.app.vault.on('raw', ...) event listener. This is a core Obsidian API function and should be broadly compatible, but its behavior could be influenced by plugins that heavily modify or intercept vault events.
    
- **Does**:
    - **Live Folder Monitoring**:
        - Actively watches a hard-coded target folder (FOLDER_TO_WATCH) for any changes, including file creation, deletion, and modification.
    
    - **Precise Event Filtering**:        
        - Implements logic to specifically check if a file system event occurred inside the target folder, ignoring all other events across the vault.

    - **Dual-Channel Feedback**:        
        - Displays the most recently detected change directly in its user interface, showing the file path and the time of the event.
        - Simultaneously prints detailed logs to the developer console, showing every vault event and explicitly stating whether it was a "MATCH" or "Ignoring".

    - **Clean & Safe Operation**:        
        - Automatically registers the event listener when the component mounts and, crucially, unregisters it when the component unmounts. This prevents memory leaks and ensures the listener doesn't run unnecessarily in the background.

    - **Simple Configuration**:        
        - The folder to be monitored can be changed by editing a single constant at the top of the script, making it easy to adapt for different testing scenarios.

- **Can’t**:    
    - **Configure from the UI**: The folder path is hard-coded into the component's script. It cannot be changed dynamically through a settings menu or an input field in the interface.
    - **Differentiate Change Types**: It listens for the generic 'raw' event, which triggers on any change. It does not distinguish between a file being created, modified, or deleted.
    - **Perform Complex Actions**: This is a listener and a reporter. By default, it only displays notifications and logs data; it is not built to automatically process files or trigger other complex workflows.
    - **Persist Event History**: The component only displays the last detected change. It does not store or show a history of all changes that have occurred and this state is reset if the view is reloaded.
    - **Watch Multiple Folders Simultaneously**: Each instance of this component is designed to watch only one folder as defined in its FOLDER_TO_WATCH constant.


![alt text](/_RESOURCES/IMAGES/hot_reload_files.webp)





### COMPONENTS

###### [Hot Reload Files Viewer](D.q.hotreloadfiles.viewer.md)

###### [Hot Reload Files Component](D.q.hotreloadfiles.component.md)

