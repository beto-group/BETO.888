---
permalink: dataview.enigmas
---

###### NAVIGATE - BACK :  [[DATAVIEW]]
----
>[!info]- [[ENIGMAS]]
----
#### AENIGMAS


Obsidian dataview plugin
>[!quote]- NARU 
><iframe allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://www.reddit.com/r/ObsidianMD/comments/1j10tvh/announcing_datacards_plugin_beta_transform_your" class="iframe-container iframe-generic"> </iframe> 
> 
>https://www.reddit.com/r/ObsidianMD/comments/1j10tvh/announcing_datacards_plugin_beta_transform_your

------ 

### Dataview  
    Embed other plugins within  
>[!quote]- NARU  
><iframe allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://forum.obsidian.md/t/meta-bind-within-dataviewjs/94626?u=beto" class="iframe-container iframe-generic"> </iframe>  
>  
>https://forum.obsidian.md/t/meta-bind-within-dataviewjs/94626?u=beto  

-----

### Dataview. Problem  
>[!quote]- NARU  
><iframe allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://forum.obsidian.md/t/dataview-freezing-my-entire-vault/92617?u=beto" class="iframe-container iframe-generic"> </iframe>  
>  
>https://forum.obsidian.md/t/dataview-freezing-my-entire-vault/92617?u=beto  

-----

Dataview. Js 
>[!quote]- NARU
><iframe allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://forum.obsidian.md/t/a-clock-widget-using-only-dataviewjs/93730?u=beto" class="iframe-container iframe-generic"></iframe>
>
>https://forum.obsidian.md/t/a-clock-widget-using-only-dataviewjs/93730?u=beto

------

Dataview is 
>[!quote]- NARU
><iframe allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://forum.obsidian.md/t/automatic-update-of-link-to-current-daily-note-when-opening-an-older-daily-note/93277/4?u=beto" class="iframe-container iframe-generic"></iframe>
>
>https://forum.obsidian.md/t/automatic-update-of-link-to-current-daily-note-when-opening-an-older-daily-note/93277/4?u=beto

------

Dataview js 
>[!quote]- NARU
><iframe allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://forum.obsidian.md/t/dataviewjs-help-div/93459/2?u=beto" class="iframe-container iframe-generic"></iframe>
>
>https://forum.obsidian.md/t/dataviewjs-help-div/93459/2?u=beto

------

Dataview
>[!quote]- NARU
><iframe allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://forum.obsidian.md/t/implementing-a-lightweight-database-in-a-single-note-with-only-dataview-plugin/86253?u=beto" class="iframe-container iframe-generic"></iframe>
>
>https://forum.obsidian.md/t/implementing-a-lightweight-database-in-a-single-note-with-only-dataview-plugin/86253?u=beto

------

woah found these guys
	they provide views for obsidian using 
		custom html + plugins [dataview + tree link + etc etc depending on views i guess]
https://docs.dhtmlx.com/

---

Dataview
https://forum.obsidian.md/t/dataview-progress-bar-for-tasks-in-current-page/77024

----

[[WORK FOR DATAVIEW CREATOR]]

----


Dataview
https://forum.obsidian.md/t/help-me-correct-this-dataview-js-script/89471


----

### Automating Source Lists in Obsidian

#### Prerequisite

- **Read the Existing Article:**
    - There is already an article where the functionality of this plugin is dismantled. It is worth reading it first because the material will be further built taking into account the fact that you can understand the syntax of requests.

#### Templates and Usage

- **Overview:**
    - Here are the templates. Use them as they are. They are simple and follow the same logic. If something seems superfluous, throw it away.

#### Example Templates

1. **Book Template (`book_template.md`):**
    
    markdown
    
    Copy code
    
    `--- type: book status: unread --- # Cheating to develop you visual vocabulary in Excalidraw  **Author:**  **Published:**  **Category:**  **Notes:**`
    
2. **Article Template (`article_template.md`):**
    
    markdown
    
    Copy code
    
    `--- type: article status: unread --- # Cheating to develop you visual vocabulary in Excalidraw  **Author:**  **Published in:**  **Category:**  **Notes:**`
    
3. **Podcast Template (`podcast_template.md`):**
    
    markdown
    
    Copy code
    
    `--- type: podcast status: unread --- # Cheating to develop you visual vocabulary in Excalidraw  **Host:**  **Episode:**  **Published:**  **Category:**  **Notes:**`
    

#### Dataview Queries

1. **Books:**
    
    markdown
    
    Copy code
    
    `# Books  ```dataview table author as "Author", status as "Status" from "Sources/Books" sort file.name asc`
    
    Copy code
    
2. **Articles:**
    
    markdown
    
    Copy code
    
    `# Articles  ```dataview table author as "Author", published as "Published in", status as "Status" from "Sources/Articles" sort file.name asc`
    
    Copy code
    
3. **Podcasts:**
    
    markdown
    
    Copy code
    
    `# Podcasts  ```dataview table host as "Host", episode as "Episode", status as "Status" from "Sources/Podcasts" sort file.name asc`
    
    Copy code
    

#### Implementation Steps

1. **Install Required Plugins:**
    
    - Dataview
    - Templater
2. **Create Template Files:**
    
    - Place the provided template content into appropriate files, such as `book_template.md`, `article_template.md`, and `podcast_template.md`.
3. **Organize Source Notes:**
    
    - Create a folder structure:
        
        markdown
        
        Copy code
        
        `📂 Sources     📂 Books     📂 Articles     📂 Podcasts`
        
4. **Use Dataview Queries:**
    
    - Add the provided Dataview queries to your summary notes to dynamically generate lists of your sources.




---



This plugin allows you to filter recipes, use the calendar view, and manage your resources/filters.

## EXPLANATION

Dataview is a powerful plugin for Obsidian that allows you to treat your Obsidian Vault like a database. It provides a JavaScript API and a pipeline-based query language, enabling you to filter, sort, and extract data from your Markdown pages.

**Examples of Dataview**

The plugin offers a variety of uses, for instance, you can:

- Show all games in a specific folder, sorted by rating, and display certain metadata.
- List games that fall into certain categories.
- List all markdown tasks in uncompleted projects.
- Show all files in a specific folder that you read in a certain year, grouped by a category and sorted by rating.

**Usage of Dataview**

Dataview operates on two main aspects: data and querying.

**Data:**

Dataview generates data from your vault by extracting information from Markdown frontmatter and Inline fields.

- Markdown frontmatter is arbitrary YAML enclosed by '---' at the top of a markdown document, storing metadata about that document.
- Inline fields are a Dataview feature that lets you write metadata directly inline in your markdown document using the 'Key:: Value' syntax.

**Querying:**

Once you've annotated documents with metadata, you can then query it using any of Dataview's four query modes:

1. Dataview Query Language (DQL): A pipeline-based expression language that supports basic use cases.
2. Inline Expressions: DQL expressions embedded directly inside markdown, evaluated in preview mode.
3. DataviewJS: A high-powered JavaScript API giving full access to the Dataview index and some convenient rendering utilities.
4. Inline JS Expressions: Execute arbitrary JS inline.

**Security Note**
Please note that JavaScript queries are very powerful and can potentially rewrite, create, or delete files, as well as make network calls. Therefore, it's advised to write JavaScript queries yourself or use scripts that you understand or that come from reputable sources.

Additionally, there's a comprehensive community talk held by SkepticMystic that provides an overview of the Dataview plugin. The talk covers a broad introduction to Dataview, metadata, Dataview queries, and more. The original slides and YouTube video provide in-depth explanations.

## TUTORIAL [WORK in PROGRESS]

**1. How to Set Up Dataview:**
	- Tutorial on how to install and set up the Dataview plugin in Obsidian.

**2. Understanding Frontmatter and Inline Fields:**
	- A tutorial that explains the concept of Markdown frontmatter and Inline fields and demonstrates how to use them in Obsidian notes.

**3. Using Dataview Query Language (DQL):**
	- A beginner's guide to using DQL, starting with simple queries and gradually introducing more complex ones.

**4. Creating and Using Inline Expressions:**
	- This tutorial will guide users on how to embed DQL expressions directly inside markdown, with these expressions evaluated in preview mode.

**5. Exploring DataviewJS:**
	- A tutorial for users familiar with JavaScript, showing how to utilize the high-powered JavaScript API provided by Dataview.

**6. Using Inline JS Expressions:**
	- An advanced tutorial teaching users how to execute arbitrary JavaScript inline, enhancing the power of their queries.

**7. How to Group and Sort Data with Dataview:**
	- A practical guide showing users how to group and sort their data using Dataview, with real examples from their own Obsidian vault.

**8. Using Dataview for Task Management:**
	- A tutorial showing how to use Dataview to create dynamic task lists and project overviews.

**9. Extracting Metadata with Dataview:**
	- A tutorial demonstrating how to extract and utilize metadata from notes using Dataview.

**10. Managing Reading Lists with Dataview:**
	- A tutorial explaining how to manage and organize a reading list using Dataview. This would show how to add books, track reading progress, and sort books by different criteria.

**11. Security in Dataview:**
	- An important tutorial discussing the security implications of using JavaScript queries in Dataview, with best practices for keeping data safe.

Each tutorial should include step-by-step instructions, screenshots or video walkthroughs, and opportunities for users to practice what they've learned.

## HOW-TO [WORK IN PROGRESS]

**1. How to Set Up Dataview:**
	- Navigate to Obsidian's community plugins pane, install and activate the Dataview plugin.

**2. Understanding Frontmatter and Inline Fields:**
	- Enclose YAML in '---' at the top of a markdown note to create Frontmatter. Use 'Key:: Value' syntax within your note for Inline fields.

**3. Using Dataview Query Language (DQL):**
	- Write a DQL query within code blocks using 'dataview'. For instance:
```
\```dataview
TABLE file.name AS "File", rating AS "Rating" FROM #book
\```
```

**4. Creating and Using Inline Expressions:**
	- To embed DQL expressions in your markdown text, surround them with ` = `. Example: We are on page `= this.file.name`.

**5. Exploring DataviewJS:**
	- Run complex queries using JavaScript within a 'dataviewjs' code block. Example:
```
\```dataviewjs
dv.taskList(dv.pages().file.tasks.where(t => !t.completed));
\```
```

**6. Using Inline JS Expressions:**
	- Execute JS inline in your markdown surrounded by `$=`. Example: This page was last modified at `$= dv.current().file.mtime`.

**7. How to Group and Sort Data with Dataview:**
	- Use the 'sort' and 'group by' commands in a DQL query within a 'dataview' code block.

**8. Using Dataview for Task Management:**
	- To see active tasks, create a 'task' query within a 'dataview' code block.

**9. Extracting Metadata with Dataview:**
	- Add metadata in the Frontmatter or Inline fields. Then, query it using DQL or JS queries.

**10. Managing Reading Lists with Dataview:**
	- Create a note for each book in your reading list and add metadata such as the author, status, etc. Then, manage and sort your list using DQL or JS queries.

**11. Security in Dataview:**
	- Only run JS queries that you understand or trust. They have the same access level as any Obsidian plugin. For security, regular DQL queries are sandboxed.

## REFERENCES

LINK : https://github.com/blacksmithgu/obsidian-dataview

HELP BUILD BASIC QUERIES : https://s-blu.github.io/basic-dataview-query-builder/

MORE INFO : https://publish.obsidian.md/hub/04+-+Guides%2C+Workflows%2C+%26+Courses/Guides/An+Introduction+to+Dataview

w





----


DIDNT KNOW YOU COULD DO THIS BUT NOW I DO
U CAN DO SCRIPT UTILIZING .JS 




FOUND THESE FROM [HERE](https://forum.obsidian.md/t/gtd-with-obsidian-a-ready-to-go-gtd-system-with-task-sequencing-quick-add-template-waiting-on-someday-maybe-and-more/65502)



PROGRESS BAR

```javascript
const tasks = dv.current().file.tasks
const percent = Math.round(tasks.filter(x => x.completed).length / tasks.length * 100)
dv.paragraph(`![](https://progress-bar.dev/${percent|| 0}/?width=200&title=Progress&color=333333)`)
```


------