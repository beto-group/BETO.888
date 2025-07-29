


## ENIGMAS
----


PODCAST TEMPLATE

```
---
type: podcast
podcast: {{podcast}}
aliases: 
- "` Cheating to develop you visual vocabulary in Excalidraw"
cover: {{artwork}}
status: todo
recommendedby:
---
___
tags:: 
prev:: [[podcasts|назад в библиотеку]]
category::
url::
children::
___
{{podcast}}
![cover|150]({{artwork}})
___

<% tp.file.cursor(0) %>
```

```
---
type: podcast
aliases: 
- "`"
---

## В процессе
**status:** ==wip== *(work in progress)*
```dataview
TABLE WITHOUT ID
	("![|80](" + cover + ")") as "Обложка",
	file.link AS "Название",
	podcast AS "Подкаст",
	category AS "Категория"
FROM !"templates"
WHERE type = "podcast" AND status = "wip"

## Ожидают прослушивания
**status:** ==todo==
```dataview
TABLE WITHOUT ID
	("![|80](" + cover + ")") as "Обложка",
	file.link AS "Название",
	podcast AS "Подкаст",
	category AS "Категория"
FROM !"templates"
WHERE type = "podcast" AND status = "todo"

## Завершённые
**status:** ==done==
```dataview
TABLE WITHOUT ID
	("![|80](" + cover + ")") as "Обложка",
	file.link AS "Название",
	podcast AS "Подкаст",
	category AS "Категория"
FROM !"templates"
WHERE type = "podcast" AND status = "done"
```



### Podcast Template

#### Overview

- **Nominal Template:**
    
    - This template exists for manually creating podcast notes.
    - To utilize its full functionality, install the **Podnotes** plugin.
- **Podnotes Plugin:**
    
    - Allows you to listen to podcasts directly from Obsidian.
    - Enables adding clickable time codes during playback.
    - Add your podcast in the plugin settings.

#### Usage

- **Start Podcast from the Panel:**
    
    - Use the panel to play the podcast.
- **Personal Note:**
    
    - I've already implemented this system in my setup, and it's incredibly useful.

#### Plugin Settings

- **Settings Configuration:**
    - Adjust the settings as needed for your use.

#### Commands and Hotkeys

- **Create Podcast Note Command:**
    
    - Ensure the podcast is playing, then use the following command to create a note:
        
        sh
        
        Copy code
        
        `# Command to create a podcast note (configured in settings or plugin command palette)`
        
- **Hotkey for Creating Time Code:**
    
    - Assign a hotkey for creating time codes during playback.

By setting up the **Podnotes** plugin and configuring it as outlined, you can efficiently manage your podcast notes within Obsidian.
