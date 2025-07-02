[WIP]






## ENIGMAS
------

TYPES
- [ ] TABLE
- [ ] LIST
- [ ] CALENDAR
- [ ] TASK


------

Dataview is a powerful plugin for Obsidian that allows you to treat your Obsidian Vault like a database. It provides a JavaScript API and a pipeline-based query language, enabling you to filter, sort, and extract data from your Markdown pages.


EXAMPLES : 
	SHOWCASE TUTORIAL + HOW-TO GUIDES




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