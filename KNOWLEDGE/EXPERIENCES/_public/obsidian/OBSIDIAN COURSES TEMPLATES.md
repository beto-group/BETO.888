


## ENIGMAS
-----


COURSES TEMPLATES

```
---
type: course
aliases: 
- "{ Cheating to develop you visual vocabulary in Excalidraw"
status: todo
recommendedby:
---
___
tags:: 
prev:: [[courses|назад в библиотеку]]
category::
url::
children::
___

<% tp.file.cursor(0) %>
```



COURSES

```
---
type: course
aliases: "{"
---

## В процессе
**status:** ==wip== *(work in progress)*

```dataview
TABLE WITHOUT ID
	file.link AS "Название",
	url,
	category AS "Категория"
FROM !"templates"
WHERE type = "course" AND status = "wip"


## Ожидают прохождения
**status:** ==todo==

```dataview
TABLE WITHOUT ID
	file.link AS "Название",
	url,
	category AS "Категория"
FROM !"templates"
WHERE type = "course" AND status = "todo"

## Завершённые
**status:** ==done==

```dataview
TABLE WITHOUT ID
	file.link AS "Название",
	url,
	category AS "Категория"
FROM !"templates"
WHERE type = "course" AND status = "done"
```
```