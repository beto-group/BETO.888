
###### NAVIGATE - BACK :  [[GIT VERSION HISTORY DIFF]]
----
>[!info]- [[ENIGMAS]]
-----
#### AENIGMAS



## EXPLANATION

The Version Git Diff plugin for Obsidian provides enhanced functionality to view and compare different versions of your notes, specifically focusing on Sync, File Recovery, and Git versions. Please note that this plugin uses private APIs and may not be fully stable, so it's important to use it at your own risk.

Key Features:
1. Display Diffs: The plugin allows you to view and compare the differences between versions of your notes in the Sync, File Recovery, and Git contexts.
2. Git Version History: You can access the Git version history for the currently active file, provided that you have the Obsidian Git plugin installed.
3. Modal View: When selecting a specific version, the plugin opens it in a modal, allowing you to examine the content.
4. Render as Markdown or Plain Text: You can choose to render the selected version as either formatted markdown or plain text.
5. Overwrite with Version: In addition to viewing the selected version, you have the option to replace the current file with that version.
6. Colour-Blind Mode: The plugin offers a colour-blind mode to improve visibility and accessibility for users with color vision impairments.
7. Sync History View: The plugin adds a command to open Obsidian's native Sync history view, which is typically accessed through the file menu.
8. Note Previews: Before reverting to a specific state, the plugin displays the note content as diffs to provide insight into the changes made. This is to ensure that the diffs are not misleading.

Usage:
- The plugin's interface consists of two columns displaying different versions.
- The chosen version on the right side should be newer than the one on the left side to accurately visualize the diffs.
- The file recovery diffs are typically considered more reliable, as they occur less frequently. However, the Sync diffs may also be useful.
- For Sync versions, only the Sync-related changes are displayed. For File Recovery and Git versions, the current state of the file from disk is also shown as the latest version.

Please keep in mind that due to the use of private APIs, the stability of this plugin may be uncertain. However, if you find it useful, it can provide valuable insights into the version history and changes of your notes within the Obsidian environment.

## TUTORIAL

#### Tutorial: Exploring Note Version History with Version Git Diff

Step 1: Install Version Git Diff Plugin
- Open Obsidian and navigate to the Community Plugins tab in the settings.
- Search for "Version Git Diff" and click the "Install" button.
- Enable the plugin to start using it.

Step 2: Set Up Git Integration
- Ensure that you have the Obsidian Git plugin installed and configured with your Git repository. This is required for the Version Git Diff plugin to work.

Step 3: Access Version Git Diff
- Open a note in your Obsidian vault that has a Git history.
- In the top menu, go to "Command Palette" or use the associated hotkey.
- Search for "Version Git Diff" and select it.

Step 4: Explore Sync Diffs
- In the Version Git Diff interface, you'll see the Sync column on the left side.
- Click on different versions in the Sync column to view the diffs between them.
- Note the changes highlighted in the rendered version or plain text, depending on your preference.
- Use the colour-blind mode if needed to improve visibility.

Step 5: Compare File Recovery Versions
- Switch to the File Recovery column on the right side.
- Select different versions to see the diffs between them.
- Observe the changes in the rendered version or plain text.

Step 6: Examine Git Version History
- Move to the Git column in the middle.
- Click on various Git versions to explore the diffs.
- Take note of the changes in the rendered version or plain text.

Step 7: Revert to a Previous Version
- After reviewing the diffs and choosing a version you want to revert to, click on it.
- A modal will open, displaying the selected version.
- You can choose to overwrite the current note with the content of this version if desired.

Step 8: Access Obsidian's Sync History View
- In the Version Git Diff interface, you'll find an option to open Obsidian's native Sync history view.
- Click on it to access the Sync history, which provides additional insights into your note's version history.

By following this tutorial, you can leverage the Version Git Diff plugin to explore and compare different versions of your notes, including Sync, File Recovery, and Git versions. This allows you to gain a better understanding of the changes made to your notes over time and revert to previous versions if needed. Happy exploring!



#### Remember to experiment with different note versions, utilize the rendered or plain text views, and leverage the colour-blind mode if needed. These simple steps will allow you to effectively compare, review, and revert to different versions of your notes using the Version Git Diff plugin in Obsidian.

## HOW-TO

1. How to Compare Sync Versions:
    - Open a note in Obsidian that has undergone sync changes.
    - Access the Version Git Diff interface using the plugin.
    - Click on different versions in the Sync column to view the differences between them.
    - Observe the highlighted changes in the rendered version or plain text.

2. How to Explore File Recovery Versions:    
    - Open a note in Obsidian that has been recovered from a previous state.
    - Access the Version Git Diff interface using the plugin.
    - Switch to the File Recovery column.
    - Select different versions to see the diffs and understand the changes made.

3. How to Review Git Version History:    
    - Open a note in Obsidian that is being tracked by Git.
    - Access the Version Git Diff interface using the plugin.
    - Explore the Git column to see the different versions of the note.
    - Click on various Git versions to examine the diffs and understand the modifications made.

4. How to Revert to a Previous Version:    
    - Open a note in Obsidian that you want to revert to a previous state.
    - Access the Version Git Diff interface using the plugin.
    - Click on the desired version to open it in a modal.
    - Review the content and changes in the selected version.
    - Choose to overwrite the current note with the content of the selected version, if desired.


## REFERENCES

LINK : https://github.com/kometenstaub/obsidian-version-history-diff


------
