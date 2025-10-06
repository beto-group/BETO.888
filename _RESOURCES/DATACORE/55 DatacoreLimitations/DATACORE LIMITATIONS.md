
### Tab: Datacore Limitations

- **Description**: An interactive, terminal-based security auditing tool designed to empirically test the boundaries and capabilities of the Datacore JavaScript environment. It runs a comprehensive suite of tests to demonstrate exactly what scripts can access, revealing both the power available to developers and the critical security implications for users.
    
- **Does**:
    - **Immersive Terminal Experience**:
        - Loads the xterm.js library to provide a realistic, interactive command-line interface directly within an Obsidian tab, complete with theming and a command prompt.
   
    - **Comprehensive Security Audit**:     
        - Executes a pre-programmed battery of tests by typing run tests. These tests probe the environment across four key areas: Node.js capabilities, file system security, Obsidian API access, and network risk.
        - Provides real-time, color-coded feedback for each test (SUCCESS, FAILURE, VULNERABLE, SECURE), offering an immediate and clear picture of the environment's state.

    - **Capability & Vulnerability Demonstration**:        
        - **Demonstrates Node.js Access**: Proves that scripts have access to powerful Node.js core modules like child_process (executing shell commands) and os (system information).
        - **Exposes Sandbox Escapes**: Actively attempts—and succeeds at—bypassing the file system sandbox. It demonstrates that scripts can read files outside the vault (via path traversal) and use the shell to write files to the user's home directory.
        - **Verifies Data Exfiltration Risk**: Confirms that scripts have unrestricted network access and can combine that with Obsidian API access to read vault data and send it to an external server.

    - **Definitive Verdict**:        
        - Concludes the audit with a summary that explicitly warns the user: the environment provides immense power but does **not** provide an effective security sandbox, and untrusted scripts should be treated with the same caution as running any application on your computer.

- **Can’t**:    
    - **Run on Mobile**: It relies heavily on Node.js core modules (child_process, fs, os) that are only available in the desktop version of Obsidian.
    - **Function as a General Shell**: Users cannot type arbitrary bash or shell commands. The terminal only accepts the predefined run tests command.
    - **Patch the Vulnerabilities**: Its purpose is purely diagnostic—to prove what is currently possible in the environment—not to fix or mitigate the security risks it uncovers.
    - **Run Offline (Initial Load)**: It dynamically loads the xterm.js library from a CDN, requiring an internet connection the first time the component is mounted.


![datacore_limitations.webp](/_RESOURCES/IMAGES/datacore_limitations.webp)

### COMPONENTS

###### [Datacore Limitations Viewer](D.q.datacorelimitations.viewer.md)

###### [Datacore Limitations Components](D.q.datacorelimitations.component.md)
