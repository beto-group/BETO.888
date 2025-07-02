
###### NAVIGATE - BACK :  [[QUICKADD]]
----
>[!info]- [[ENIGMAS]]
-----
#### AENIGMAS




Use this plugin for template generation.

## EXPLANATION

The QuickAdd plugin for Obsidian is a versatile tool that combines four powerful features: templates, captures, macros, and multis. These choices enable users to streamline their note-taking and organization processes within the Obsidian environment.

Templates: With QuickAdd, users can define templates that specify how to create new notes. These templates can be combined with Obsidian's core Templates plugin or other community template plugins. For example, users can create a quick action that generates a new note in a specific location, with a templated title and predefined content.

Captures: The plugin allows for quick content addition to predefined files. Users can set up actions to add specific information, such as a link to the currently open file, to a designated section within their daily notes or other relevant files.

Macros: QuickAdd enables users to combine templates and captures in powerful chained workflows using macros. These macros allow for the automation of various actions. For instance, pressing a hotkey can automatically create a new note using a specific template, while simultaneously adding a reference to it in a "list of matches" note and the daily note.

Multis: Multis provide organizational capabilities by creating folders of other choices. This feature aids in structuring and categorizing templates, captures, and macros.

The QuickAdd format syntax, similar to Obsidian's template syntax, can be utilized throughout the choices. For example, users can employ {{DATE}} to insert the current date into a filename or other relevant fields.

To get started with QuickAdd, users can install the plugin from the community plugin browser in Obsidian or manually install it. Once installed, creating new choices is the first step. Choices can be of four types: Template, Capture, Macro, or Multi. Each choice type serves a specific purpose in enhancing productivity and organization within Obsidian.

The QuickAdd API, format syntax, inline scripts, and macros provide additional customization and automation options for users to create powerful scripts and macros to suit their specific workflow requirements.

Furthermore, QuickAdd offers the flexibility to be used even when Obsidian is minimized or running in the background, thanks to the integration with scripts such as AutoHotKey.

Overall, QuickAdd empowers users to optimize their note-taking and organization processes within Obsidian by providing a comprehensive set of tools for creating templates, capturing information, automating actions, and organizing their choices effectively.


## TUTORIAL [WORK IN PROGRESS]

1. QuickAdd Plugin Tutorial:
    - How to set up and configure the QuickAdd plugin for cookbook management.
    - Demonstrating the use of global shortcuts to create new recipe entries, repas notes, and other relevant entries.
    - Customizing and creating templates for recipe notes using the QuickAdd plugin.
    - Showcasing the use of different shortcuts and templates for creating consistent and efficient recipe layouts.

##### Tutorial: Creating a Cookbook with QuickAdd in Obsidian

Step 1: Install the QuickAdd Plugin
	- Open Obsidian and navigate to the Community Plugins tab in the settings.
	- Search for "QuickAdd" and click the "Install" button.
	- Once installed, enable the plugin.

Step 2: Set Up the Cookbook Structure
	- Create a new folder in your Obsidian vault named "Cookbook."
	- Within the "Cookbook" folder, create sub-folders for different recipe categories (e.g., "Appetizers," "Main Dishes," "Desserts").

Step 3: Create a Recipe Template
	- Open the Command Palette (Ctrl/Cmd + P) and search for "QuickAdd: Edit choices."
	- Click on "Add new choice" and select "Template."
	- Give the choice a name, such as "Recipe Template."
	- In the template content, define the structure of a recipe, including sections like "Ingredients," "Instructions," and "Notes."
	- Utilize QuickAdd format syntax to insert dynamic elements like {{DATE}} for the creation date or {{TIME}} for the current time.

Step 4: Add a Recipe Capture
	- Go back to the "QuickAdd: Edit choices" section in the Command Palette.
	- Click on "Add new choice" and select "Capture."
	- Name the choice, e.g., "Add Recipe to Cookbook."
	- In the capture content, create a prompt for the user to input the recipe details.
	- Use the QuickAdd format syntax to capture specific information like the recipe name, ingredients, and instructions.

Step 5: Create a Macro for Organizing Recipes
	- Return to the "QuickAdd: Edit choices" section in the Command Palette.
	- Click on "Add new choice" and select "Macro."
	- Give the macro a name, e.g., "Organize Recipes."
	- In the macro content, use JavaScript and Obsidian functions to move the captured recipe note to the appropriate category folder within the "Cookbook" directory.

Step 6: Test Your Cookbook Workflow
	- Open a new note in Obsidian and trigger the QuickAdd menu (e.g., using a hotkey or the Command Palette).
	- Choose the "Add Recipe to Cookbook" capture choice and fill in the recipe details as prompted.
	- Verify that the recipe note is created and organized correctly within the designated category folder in your "Cookbook" directory.

Step 7: Explore Further Customizations
	- Experiment with additional choices, such as creating a "Multi" choice to organize the different choice types within the "Cookbook" folder.
	- Customize the template and capture choices to include additional fields or prompts.
	- Explore the QuickAdd API and format syntax for more advanced functionality and automation possibilities.


#### Remember to explore the QuickAdd documentation and experiment with different features to make the most of this powerful plugin.



## HOW-TO

1. How to Install QuickAdd:
    - Open Obsidian and go to the Community Plugins tab in the settings.
    - Search for "QuickAdd" and click the "Install" button.
    - Enable the plugin to start using it.

2. How to Create a Template:
    - Open the Command Palette (Ctrl/Cmd + P) and search for "QuickAdd: Edit choices."
    - Click on "Add new choice" and select "Template."
    - Give the template a name and define its structure using Obsidian's template syntax.
    - Save the template for future use.

3. How to Capture Information:
    - In the "QuickAdd: Edit choices" section of the Command Palette, click on "Add new choice" and select "Capture."
    - Name the capture choice and create prompts for the information you want to capture.
    - Use the QuickAdd format syntax to capture dynamic elements like the current date or time.

4. How to Create Macros:
    - Open the "QuickAdd: Edit choices" section in the Command Palette.
    - Click on "Add new choice" and select "Macro."
    - Give the macro a name and define its actions using JavaScript and Obsidian functions.
    - Use macros to automate tasks, such as moving captured notes to specific folders.

5. How to Organize Choices:
    - To create folders for organizing choices, add a new choice and select "Multi."
    - Name the multi choice and use it as a container for other choices.
    - Drag and drop choices into the multi choice to categorize them.

6. How to Use Format Syntax:
    - Throughout your choices, you can use the QuickAdd format syntax (similar to Obsidian's template syntax) to insert dynamic elements.
    - For example, use {{DATE}} to insert the current date or {{TIME}} to insert the current time.

7. How to Customize Choices:
    - Edit existing choices by opening the "QuickAdd: Edit choices" section in the Command Palette.
    - Modify the content, prompts, or actions to fit your specific requirements.
    - Experiment with different fields, prompts, and formatting options.

8. How to Trigger QuickAdd:    
    - Set a hotkey for the "QuickAdd: Open menu" command in the Obsidian settings.
    - Use the hotkey to open the QuickAdd menu and select the desired choice.

## REFERENCES

LINK : https://github.com/chhoumann/quickadd




------

