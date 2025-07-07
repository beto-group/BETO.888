


## ENIGMAS
----

### Example: Book Template

- **Book Template (`book_template.md`):**

```
---
type: book
aliases: 
- "& Cheating to develop you visual vocabulary in Excalidraw"
cover: {{coverUrl}}
start:
end:
status: todo
recommendedby:
---
___
tags:: 
prev:: [[books|назад в библиотеку]]
category::
author:: [[{{author}}]]
children::
___
PDF
![cover|150]({{coverUrl}})
___

<% tp.file.cursor(0) %>
```


Library View (`books.md`):
```
---
type: book
aliases: "&"
---
%%cssClass: cards%%

## В процессе
**status:** ==wip== *(work in progress)*

```dataview
TABLE WITHOUT ID
	("![|80](" + cover + ")") as "Обложка",
	file.link AS "Название",
	author AS "Автор(ы)",
	start AS "Начал",
	category AS "Категория"
FROM !"templates"
WHERE type = "book" AND status = "wip"

Ожидают прочтения
**status:** ==todo==
dataview
TABLE WITHOUT ID
	("![|80](" + cover + ")") as "Обложка",
	file.link AS "Название",
	author as "Автор(ы)",
	recommendedby AS "Рекомендовано",
	category AS "Категория"
FROM !"templates"
WHERE type = "book" AND status = "todo"


## Завершённые
**status:** ==done==
```dataview
TABLE WITHOUT ID
	("![|80](" + cover + ")") as "Обложка",
	file.link AS "Название",
	author AS "Автор(ы)",
	start AS "Начал",
	end AS "Закончил",
	category AS "Категория"
FROM !"templates"
WHERE type = "book" AND status = "done"
```


#### Plugin Configuration

- **Book Search Plugin:**
  - Ensure the template location is specified in the settings.
  - Use the command to create a book note.

---

### Summary

- **Book Template:**
  - Prompts for the title, sets up metadata, and integrates seamlessly with the Dataview plugin.

- **Library View:**
  - Displays books in progress, books to read, and completed books using Dataview queries.

- **Plugin Configuration:**
  - Set up the Book Search plugin and specify the template location in settings.
  - Use commands to automate the creation of book notes.






-----