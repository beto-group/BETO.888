# BETO.888 - An Evolving Obsidian Experience

![BETO.888 Cover](_RESOURCES/GIF/beto.888.cover.gif)

Welcome to **BETO.888**, an ever-evolving Obsidian Vault from **BETO.GROUP**. This vault is designed to be a powerful, dynamic toolkit for thought, creation, and personal development. It's a space where ideas are forged and reality is shaped by what you *do* and desire.

Our mission is simple and cyclical: **Discover, Learn, Develop, Teach, Repeat.**

---

> [!TIP]
> **To update the vault** in the future, navigate to its folder in your terminal and run git pull.
> 
> **Once the vault is open,** we recommend exploring the [DATACORE.showcase](DATACORE.showcase.md) note and the Bookmarked items in the left panel to get oriented.

---

## ✨ Features

This vault is more than just a collection of notes; it's a feature-rich platform for your Obsidian environment.

*   🛠️ **Datacore Components:** A powerful, growing library of interactive tools and components built to enhance your workflow, organization, and creative expression. See them in action in the [DATACORE.showcase](DATACORE.showcase.md).
*   🖼️ **Assets Library:** A curated collection of versatile visuals, icons, and images ready to be used in your own projects and notes.
*   📜 **Embedded Guides:** Your vault comes with this README, a full [FAQ](https://www.beto.group/faq), and our [LICENSE GUIDE](_OPERATION/PUBLIC/LICENSE%20GUIDE) to ensure you have all the information you need right at your fingertips.
*   🔮 **[COMING SOON] The "Enigmas" Collection:** A future expansion will add curated knowledge packs on diverse topics (Health, Wealth, Experiences) designed to spark deep exploration.

-------
##  License

This is a critical part of using our work. We've made it as simple as possible.

*   **Core Principle:** All software within this vault is released under the **permissive MIT License**.
*   **Your Freedom:** You are free to use, modify, distribute, and even sell this work or derivatives of it, for any purpose, including commercially.
*   **Your Sole Obligation:** You **must** include our original copyright notice and the full MIT license text (found in the `LICENSE.md` file) in any substantial distribution of this work.

> [!WARNING]
> This is a summary. For full legal clarity, please read the `LICENSE.md` file included in this vault and **[TOS - SECTION 1](https://www.beto.group/terms_of_service#1.+Licensing+Model)**.

---
## 🚀 Quick Start & Installation
**Prerequisites:** You must have the Obsidian.md application installed on your device. Git is optional for Method 1, required for Method 2 or 3.

Choose one of three methods to install this vault: a full direct download, a full Git clone, or a lightweight Git clone for a smaller version.

#### Method 1: Direct Download (Simple & Quick)
This is the easiest method if you don't use Git.

1.  **Download the ZIP file:**
    - Go to the top of the repository page: [https://github.com/BETO-GROUP/BETO.888](https://github.com/BETO-GROUP/BETO.888)
    - Click the green `<> Code` button.
    - Select `Download ZIP`.

2.  **Unzip the folder:**
    - Find the downloaded `.zip` file on your computer and unzip it.
    - This will create a folder named `BETO.888-main`. You can rename it to just `BETO.888` for simplicity.

3.  **Open in Obsidian:**
    - Launch the Obsidian application.
    - Click on "Open another vault" (the vault icon in the left-hand ribbon).
    - Select "Open folder as vault".
    - Navigate to the folder you just unzipped (`BETO.888-main` or `BETO.888`) and select it.

---

#### Method 2: Using Git - Full Version (Recommended for updates)
This method uses Git to clone the full repository. The main advantage is that it's much easier to get future updates.

1.  **Clone the Vault:**
    - Make sure you have Git installed.
    - Open your computer's terminal (or Command Prompt / PowerShell on Windows) and run the following command. This will download the repository into a new `BETO.888` folder.
    ```shell
    git clone https://github.com/BETO-GROUP/BETO.888
    ```

2.  **Open in Obsidian:**
    - Launch the Obsidian application.
    - Click on "Open another vault".
    - Select "Open folder as vault".
    - Navigate to the `BETO.888` folder you just cloned and select it.

---

#### Method 3: Using Git - Lite Version (Smaller download)
This method uses Git to clone a lightweight version of the repository with fewer files, ideal for smaller storage needs.

1.  **Clone the Lite Vault:**
    - Make sure you have Git installed.
    - Open your computer's terminal (or Command Prompt / PowerShell on Windows) and run the following command. This will download a smaller version of the repository into a new `BETO.888` folder, specifically from the `lite` branch.
    ```shell
    git clone -b lite https://github.com/BETO-GROUP/BETO.888
    ```

2.  **Open in Obsidian:**
    - Launch the Obsidian application.
    - Click on "Open another vault".
    - Select "Open folder as vault".
    - Navigate to the `BETO.888` folder you just cloned and select it.



#### Method 3: Using Git - Lightweight Version (Smaller disk footprint)

This method uses Git to clone only the essential files to your local disk, saving space and reducing clutter in your workspace. You'll still have the full history for updates.

1. **Prepare your environment:**
    - Make sure you have Git installed (version 2.25+ recommended for simpler commands).
    - Open your computer's terminal (or Command Prompt / PowerShell on Windows).

2. **Clone the vault without checking out files:**  
    This command downloads the full repository history but leaves your local folder empty of files for now.

```shell
git clone --no-checkout https://github.com/BETO-GROUP/BETO.888
cd BETO.888
```
  
3. **Configure for specific folders:**  
    Next, tell Git which parts of the vault you want to see on your disk. This example only pulls the necessary _RESOURCES/DATACORE folder.
	
```shell
git sparse-checkout init --cone
git sparse-checkout set _RESOURCES/DATACORE
```

    If you later decide you need other top-level folders, you can add them, e.g., git sparse-checkout set --add .obsidian
	    or desiring only specific Datacore Component add /Folder name within `git sparse-checkout set` command

4. **Populate your vault**:
    Now, tell Git to actually put the selected files into your folder.

```shell
git checkout main
```

5. **Open in Obsidian:**
    
    - Launch the Obsidian application.
    - Click on "Open another vault".
    - Select "Open folder as vault".
    - Navigate to the BETO.888 folder you just cloned and select it. You will only see the _RESOURCES folder and its contents.
	    - remember you might not have installed `.obsidian` folder so wont have obsidian plugin/styling available either manual install or run a `git-sparse-checkout set .obsiidian` to add basic obsidian vault configs


---

---

That's it! The BETO.888 vault will open, and your journey begins.

----
## 🤝 Contributing & Community

BETO.GROUP thrives on its community. Your participation and feedback are what fuel our evolution.

*   **Principle:** *Nullius in verba* — "Take nobody's word for it." We prove our commitment through action, and we value contributions over words.
*   **Join the Conversation:** The best place to connect, ask questions, and share your work is our **[Discord Server](https://discord.gg/6rDp4q4Y2B)**.
*   **Provide Feedback:** Found a bug? Have a brilliant idea? Share it in the `#feedback` channel on Discord. In line with our **Reciprocity Ethos**, valuable contributions are highly appreciated and may be recognized with community perks.
*   **Stay Updated:** To see the latest changes, check the [CHANGE LOG](_OPERATION/PUBLIC/DEVLOG/CHANGE%20LOG.md) note.

---

## ⚠️ Important Considerations

*   **This is an experimental project.** It is currently a one-person passion project, and as such, it is a perpetual "Work in Progress." Expect the occasional bug; they are part of the adventure.
*   **Feedback on latest versions:** While all feedback is welcome, we prioritize insights on the most recent release of the vault.

---

## **THANK YOU FOR BELIEVING IN THE VISION! 🫡**

