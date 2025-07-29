

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


