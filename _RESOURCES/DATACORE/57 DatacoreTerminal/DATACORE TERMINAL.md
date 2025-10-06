

### Tab : Datacore Terminal

- **Description**: A powerful, standalone bridge that exposes the computer's underlying system shell, allowing you to run, monitor, and manage any command-line process directly from within Obsidian. It is designed for both interactive use and deep automation via URI commands, effectively turning Obsidian into a control center for external scripts and tools.

- **Does**:    
    - **Full System Shell Access**:
        - Leverages Node.js's child_process module to spawn processes in the user's default shell (e.g., Bash, Zsh, PowerShell).
        - Can execute any command that the user has permission to run on their operating system, from simple file listings (ls -la) to complex scripts (python my_script.py).

    - **Interactive Process Management**:        
        - Provides a UI to view all processes started from the component, displaying their command, Process ID (PID), and live status (running/stopped).
        - Streams stdout and stderr directly into a live-updating log for each process, allowing real-time monitoring.
        - Includes a "Kill Process" button to forcefully terminate any misbehaving or long-running tasks.

    - **Dual Execution Modes**:        
        - **Interactive Mode**: A user-facing modal prompts for a command, which then executes and displays its full output in a separate results modal for easy viewing and copying.
        - **Silent URI Mode**: Exposes a global window.startSystemProcess() function, designed to be called by the "Advanced URI" plugin. This mode automatically hides the Obsidian window, runs the command in the background, copies the output to the clipboard, and displays a summary notice upon completion.

    - **Standalone, Dependency-Free UI**:        
        - Implements its own custom Modal and Notice components from scratch, removing any reliance on the obsidian API for its user interface. This makes the component more robust and self-contained.

    - **Seamless Obsidian Integration**:        
        - Registers a command in the Obsidian command palette ("Process Manager: Start a new process...") for quick, keyboard-driven access to its functionality.

- **Can’t**:    
    - **Run on Mobile or in Restricted Mode**: Its core functionality is built on Node.js modules that are only available on the desktop version of Obsidian with plugin execution enabled.
    - **Provide an Interactive Shell (stdin)**: It is designed for firing off commands and viewing their output. It does not provide an interactive TTY, so you cannot pipe input to a running process or respond to prompts.
    - **Guarantee Security (It's a Feature, Not a Bug)**: This component intentionally breaks the sandbox. It executes commands with the same permissions as your user account. It cannot prevent a malicious command from reading, modifying, or deleting files anywhere on your system. **It should only be used to run trusted commands.**
    - **Persist Process State**: The list of managed processes is held in component state and will be cleared if Obsidian is reloaded or closed, even if the underlying detached processes continue to run on the operating system.


![datacore_terminal.webp](/_RESOURCES/IMAGES/datacore_terminal.webp)



### COMPONENTS

###### [Datacore Terminal Viewer](D.q.datacoreterminal.viewer.md)

###### [Datacore Terminal Component](D.q.datacoreterminal.component.md)

