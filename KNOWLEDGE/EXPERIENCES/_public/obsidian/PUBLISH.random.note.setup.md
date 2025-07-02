---
permalink: publish.random.note.setup
---


If you manage a large collection of Markdown files (for example, in a static site or a personal knowledge base), manually maintaining a list of permalinks for features like a random note picker can be time-consuming and error-prone. A Python script automates this process by:

- **Scanning Multiple Directories:** Easily process files across different folders.
- **Extracting Metadata:** Pull out the `permalink` attribute from the YAML frontmatter in each Markdown file.
- **Filtering Files:** Use custom inclusion and exclusion rules (via regex and path substrings) to keep only the desired files.
- **Generating JSON Output:** Create a ready-to-use JSON file containing valid permalinks for further use in your site or app.

This script streamlines the process and lets you focus on building features with up-to-date data from your files.

----

#### Quick Guide


1. Run the script.
	- [[PUBLISH.random.note.python.script]]


2. **Input Directories:**  
    - When prompted, enter multiple directory paths (separated by commas) where your Markdown files are located.
	- **Tip:** On Unix-based systems (Linux/Mac), run the `pwd` command in your terminal to get the complete path. On Windows, use `echo %cd%` in Command Prompt to obtain your current directory.
    
3. **Set Filters:**
    
    - **Regex Pattern:** Enter a regex to exclude unwanted permalinks (default: `.*\.(namzu|sud|enigmas)$`).
    - **Exclude Paths:** Provide comma-separated substrings for paths you want to skip (e.g., `drafts,private`).
    - **Include Paths:** Optionally, provide comma-separated substrings to restrict scanning to specific folders (e.g., `folder1,folder2`).

4. **Output:**  
	- The script processes your files and writes the valid permalinks to a JSON file named `random_note_permalinks.json`.
	- This JSON file contains two lists: one for **included** permalinks and one for **excluded** permalinks.
	- You can review both lists to quickly check if any links are undesired or if any mistakes occurred during processing.


-----

Once you have your file : `random_note_permalinks.json`

----

#### How to Set Up Your Random Note Component with Bolt.new

**1. Create Your Bolt.new Account and Component**

- Visit: [https://bolt.new/~/sb1-gcamlmub](https://bolt.new/~/sb1-gcamlmub)
- Sign up for an account if you haven't already.
- This platform lets you build and deploy custom web components quickly.

**2. Update Your Component Files**

- **Replace the JSON Data:**
    - Open the file located at `/public/code/random_note_permalinks.json`.
    - Paste your generated JSON (with your permalinks) into this file.

- **Set Your Base URL:**
    - Open `/src/config/constants.ts`.
    - Find the `BASE_URL` constant and change it to your own website URL.
    - If you need help, you can ask the AI tool to help with this step.

**3. Deploy Your Component**

- Use Bolt.new’s built-in deploy feature.
- Once deployed, you’ll receive a unique URL for your component.

**4. Embed Your Component on Your Website**

- Copy the deployment URL provided by Bolt.new.
- Insert an `<iframe>` in your website’s HTML with the `src` attribute set to this URL.
- Your website will now display the component with your random note functionality.



By following these steps, you’ll have a live component on your website that uses your custom permalink data. Enjoy the streamlined integration!


-----

#### Limitations of This Implementation

- **Manual Updates Required:**
    - This process is not automatic. Every time you add new pages, you'll need to rerun your Python script to generate an updated JSON file.

- **Component Refresh Needed:**
    - After updating the JSON file, you'll also need to update your Bolt.new component with the new data.

- **Iframe Update:**
    - Once the component is redeployed with the updated JSON, remember to update the iframe’s URL on your website to point to the new deployment.