
###### NAVIGATE - BACK :  [[OBSIDIAN GIT]]
----
>[!info]- [[ENIGMAS]]
-----
#### AENIGMAS





Obsidian Git
https://forum.obsidian.md/t/setting-up-obsidian-git-on-windows-for-the-tech-uninitiated-with-images/15297



----

Obsidian
    Git
https://forum.obsidian.md/t/setting-up-obsidian-git-on-windows-for-the-tech-uninitiated-with-images/15297


-----

Installation guide

Macos

- brew install
- git install
- git init


-----


## EXPLANATION

The Obsidian Git plugin is designed to facilitate the backup of your Obsidian.md vault to a remote Git repository, such as a private repository on GitHub. By integrating with Git, this plugin enables version control and allows you to manage your vault's changes, history, and collaboration effectively.

Key Features:
1. Automatic Vault Backup: The plugin allows you to schedule automatic backups of your vault at regular intervals.
2. Pull Changes on Startup: Upon launching Obsidian, the plugin automatically pulls changes from the remote repository, ensuring that your local vault is up to date.
3. Hotkeys for Pushing/Pulling: Assign custom hotkeys to quickly push or pull changes to and from the remote repository.
4. Git Submodules: Enable the submodule feature in the plugin settings to manage different repositories within your vault.
5. Source Control View: Access the Source Control View, which displays staged and unstaged changes, allowing you to selectively stage and commit individual files.
6. History View: Open the History View, which presents the commit history and shows the files that were changed in each commit.
7. Backup Commands: Use the plugin's backup commands to commit changes either with a specific message or without pushing immediately.
8. Remote Operations: Perform various remote operations, such as pushing changes to the remote repository, pulling changes from the remote repository, editing remotes, and cloning existing remote repositories.
9. Local Operations: Initialize a new repository, create new branches, delete branches, and edit the .gitignore file.
10. Authentication: The plugin supports authentication with the remote repository. Refer to the provided documentation for detailed instructions on the setup process.

Note: The plugin also highlights limitations and considerations for mobile users, including the use of isomorphic-git instead of native Git, restrictions on SSH authentication, limited repository size due to memory restrictions, and performance considerations based on device capabilities.

In summary, the Obsidian Git plugin seamlessly integrates Git functionality into Obsidian, allowing you to back up your vault, track changes, collaborate, and manage version control efficiently.

## TUTORIAL [WORK IN PROGRESS]

1. Getting Started with Obsidian Git: 
	1. This tutorial can cover the installation and setup process of the plugin, including linking it to a remote Git repository. It can also explain the basic concepts of version control and how they apply to Obsidian Git.
    
2. Creating and Cloning Repositories: 
	1. Show users how to initialize a new repository within Obsidian using the plugin and how to clone an existing repository from a remote source. This tutorial should cover the similarities between creating and cloning repositories in Obsidian Git and regular Git.
    
3. Staging and Committing Changes: 
	1. Explain the process of staging and committing changes within Obsidian Git, similar to how it's done in regular Git. Demonstrate how to stage specific files or all changes, write commit messages, and review the committed changes.
    
4. Pushing and Pulling Changes: 
	1. Guide users on how to push their local changes to the remote repository and how to pull changes from the remote repository into their local vault. Emphasize the similarities between these actions in Obsidian Git and regular Git.
    
5. Branching and Merging: 
	1. Explore the concept of branching within Obsidian Git and show users how to create new branches, switch between branches, and merge changes from one branch to another. Compare these actions to the branching and merging process in regular Git.
    
6. Resolving Conflicts: 
	1. Discuss how conflicts can occur when merging changes from different branches or when pulling changes from the remote repository. Walk users through the process of identifying and resolving conflicts within Obsidian Git, similar to how it's done in regular Git.
    
7. Managing Remotes and Collaborating: 
	1. Explain how to add, edit, and remove remote repositories within Obsidian Git. Additionally, demonstrate how multiple users can collaborate on the same vault by cloning the repository and pushing/pulling changes.
    
8. Exploring the Source Control and History Views: 
	1. Showcase the Source Control and History Views provided by the plugin. Explain how users can use these views to review changes, compare versions, and navigate through the commit history, similar to the features offered in regular Git tools.
    
9. Customizing Hotkeys and Plugin Settings: 
	1. Guide users on how to customize the hotkeys for frequently used Obsidian Git commands and explore the various settings available in the plugin. This tutorial can also cover advanced configurations and options that enhance the Git experience within Obsidian.

## HOW-TO [WORK IN PROGRESS]

1. How to Install Obsidian Git:
    - Open Obsidian and navigate to the Community Plugins tab in the settings.
    - Search for "Obsidian Git" and click the "Install" button.
    - Once installed, enable the plugin and follow any additional setup instructions.

2. How to Link Obsidian to a Remote Git Repository:    
    - In Obsidian, open the Command Palette (Ctrl/Cmd + P) and search for "Obsidian Git: Edit remotes".
    - Click on "Add remote" and provide the remote repository URL.
    - Optionally, enter your authentication credentials if required.
    - Save the changes and Obsidian will now be linked to the remote repository.

3. How to Stage and Commit Changes:    
    - Open the Source Control View from the command palette or the plugin's menu.
    - In the Source Control View, you'll see a list of changed files.
    - Click on the "+" icon next to a file to stage it for commit.
    - Enter a commit message in the input field at the top of the view.
    - Click the commit button to finalize the commit.

4. How to Push Changes to a Remote Repository:    
    - Open the Source Control View and ensure that you have committed all desired changes.
    - Click on the push button in the Source Control View.
    - The plugin will push your committed changes to the linked remote repository.

5. How to Pull Changes from a Remote Repository:    
    - Open the Source Control View and ensure your local vault is up to date.
    - Click on the pull button in the Source Control View.
    - The plugin will fetch and merge any changes from the remote repository into your local vault.

6. How to Create and Switch Branches:    
    - Open the Command Palette and search for "Obsidian Git: Create new branch".
    - Enter a name for the new branch and confirm.
    - To switch between branches, use the "Obsidian Git: Switch branch" command.

7. How to Merge Changes from One Branch to Another:    
    - Switch to the branch where you want to merge changes.
    - Open the Command Palette and search for "Obsidian Git: Merge branch".
    - Select the branch containing the changes you want to merge.
    - Confirm the merge and resolve any conflicts, if necessary.

8. How to Review Commit History:    
    - Open the History View from the command palette or the plugin's menu.
    - The History View displays a list of commits and their changed files.
    - Click on a commit to see the details and changes made in that commit.

## REFERENCES

LINK : https://github.com/denolehov/obsidian-git


------
