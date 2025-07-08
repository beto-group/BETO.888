
### Tab: ExternalInputBlocker

- **Description**: A utility component designed to "trap" user input within its boundaries, preventing most of Obsidian's native hotkeys and commands from firing while it is active.

- **Does**:

    - Visually indicates its "active" state with a green glowing border when focused.
    - When active, it intercepts and blocks keyboard shortcuts (e.g., Cmd/Ctrl + P for the command palette).
    - Achieves this by temporarily overwriting key methods in Obsidian's command execution API (app.commands).
    - Explicitly allows certain essential commands to pass through, such as Cmd/Ctrl + W to close the tab.
    - Restores all original commands and functionality automatically when the component loses focus.

- **Can’t**:
   
    - Block every single possible way a command can be triggered; the creator notes it's a work-in-progress with known bypasses.
    - Be used as a general-purpose component, as its sole function is to demonstrate and test this input-blocking behavior.
    - Function without access to the dc.app object provided by the Datacore environment.


![external_input_blocker.webp](/_RESOURCES/IMAGES/external_input_blocker.webp)




### Components

###### [External Input Blocker Viewer](D.q.externalinputblocker.viewer.md)

###### [External Input Blocker Component](D.q.externalinputblocker.component.md)


