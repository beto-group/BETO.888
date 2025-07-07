


## ENIGMAS
-----

MOVEIS TEMPLATE
```
---
type: movie
aliases: 
- "% Cheating to develop you visual vocabulary in Excalidraw"
cover: {{VALUE:Poster}}
status: todo
recommendedby:
---
___
tags:: 
prev:: [[movies|назад в библиотеку]]
category::
author:: {{VALUE:directorLink}}
children::
___
![cover|150]({{VALUE:Poster}})
___

<% tp.file.cursor(0) %>
```


MOVIES

```
---
type: movie
aliases: "%"
---
%%cssClass: cards%%
## В процессе
**status:** ==wip== *(work in progress)*
```dataview
TABLE WITHOUT ID
	("![|80](" + cover + ")") as "Обложка",
	file.link AS "Название",
	author AS "Режиссёр",
	category AS "Категория"
FROM !"templates"
WHERE type = "movie" AND status = "wip"

## Ожидают просмотра
**status:** ==todo==
```dataview
TABLE WITHOUT ID
	("![|80](" + cover + ")") as "Обложка",
	file.link AS "Название",
	author AS "Режиссёр",
	category AS "Категория"
FROM !"templates"
WHERE type = "movie" AND status = "todo"

## Завершённые
**status:** ==done==
```dataview
TABLE WITHOUT ID
	("![|80](" + cover + ")") as "Обложка",
	file.link AS "Название",
	author AS "Режиссёр",
	category AS "Категория"
FROM !"templates"
WHERE type = "movie" AND status = "done"
```



#### Plugin Availability

- **No Built-in Plugin:**
    - Obsidian does not have a native plugin for finding movies.

#### Alternative Solution

- **Minimal Theme Implementation:**
    - The Minimal theme provides a workaround.
    - Movie data will be downloaded from IMDb, so the names will be in English.
    - Instructions are available on how to set this up.

#### Setup Instructions

1. **Request API Key:**
    
    - First, go to the IMDb website and request an API key.
2. **Install QuickAdd Plugin:**
    
    - Install the "QuickAdd" plugin in Obsidian.
3. **Prepare Script:**
    
    - At the root of your knowledge base, create a folder named `Scripts`.
    - Download and place the required script file into the `Scripts` folder using your file manager (not through Obsidian).
4. **Configure QuickAdd Plugin:**
    
    - Go to the settings of the "QuickAdd" plugin.
    - Click "Manage Macros".
    - Create a macro (e.g., named "create film").
    - Press "Configure".
    - Add a script.
    - Press the gear icon and enter the API key you received by email.
    - Close the API key window and press "Template".
    - Select your movie template and set the template for the file name (e.g., the name of the movie).
5. **Macro Setup:**
    
    - Return to the main menu of the "QuickAdd" plugin settings.
    - Choose the created macro.
    - Enter the name of the macro and click "Add Choice".
    - Click the gear icon and ensure everything is set as shown in the instructions.
    - Lock the zipper to add the "add movie" command to the command palette.

#### Command to Create Movie Note

- Use the command palette to create a note on the film:
    
    sh
    
    Copy code
    
    `# Command to create a note on the film`
