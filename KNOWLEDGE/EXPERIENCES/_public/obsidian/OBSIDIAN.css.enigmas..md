
###### NAVIGATE - BACK :  [[OBSIDIAN.css]]
----
>[!info]- [[ENIGMAS]]
---
#### AENIGMAS




Obsidian. CSS
>[!quote]- NARU 
><iframe allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://forum.obsidian.md/t/css-for-highlight-like-blue-topaz-theme/94511" class="iframe-container iframe-generic"> </iframe> 
> 
>https://forum.obsidian.md/t/css-for-highlight-like-blue-topaz-theme/94511

------


Obsidian. CSS 
>[!quote]- NARU
><iframe allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://www.reddit.com/r/ObsidianMD/s/W4K37nFXhs" class="iframe-container iframe-generic"></iframe>
>
>https://www.reddit.com/r/ObsidianMD/s/W4K37nFXhs

----

Obsidian
>[!quote]- NARU
><iframe allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://tfthacker.com/experiment-vault-logo" class="iframe-container iframe-generic"></iframe>
>
>https://tfthacker.com/experiment-vault-logo


WORKFLOW

CREATE a new folder in YOUR VAULT : `0-Vault-Logo`

CREATE A new css file within your obsidian vault css
	add the following

https://github.com/TfTHacker/DashboardPlusPlus/blob/master/.obsidian/snippets/vault-logo.css
```css
/* 
Last updated 2024-11-18
This solution is provided by TfT Hacker. Learn more at https://tfthacker.com
*/

/* Embed an image to the right of the div */
div[data-path="0-Vault-Logo"] * {
  display: none;
}

div[data-path="0-Vault-Logo"] {
  order: -1;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  margin-bottom: 15px;
  width: 100%;
  min-height: 200px;
  border-radius: 15px;
  border: 2px solid #6a3a89;

  background-image: url('https://i.ibb.co/ypY6nFw/beto-logo.png'); /* CHANGE this to your own image 
}
```

IF you want to use style like TFTHACKER
just use a site like : https://www.base64-image.de/


------

OBSIDIAN properties
>[!quote]- NARU
><iframe allowfullscreen src="https://forum.obsidian.md/t/custom-css-to-modify-the-placeholder-text-of-a-property/87549" width="100%" height="555" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ></iframe>
>➫
>https://forum.obsidian.md/t/custom-css-to-modify-the-placeholder-text-of-a-property/87549



----

Obsidian appearance
>[!quote]- NARU
><iframe allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://www.reddit.com/r/ObsidianMD/s/6LiZxG4ydm" class="iframe-container iframe-generic"></iframe>
>
>https://www.reddit.com/r/ObsidianMD/s/6LiZxG4ydm

------

## KNOWLEDGE

[ADD]
	SETTINGS --> APPEARANCE --> SCROLL TILL [AT BOTTOM] --> OPEN CSS SNIPPETS FOLDER
>[!quote]- NARU
>![[Pasted image 20240521142009.png]]


-----


Obsidian CSS
https://github.com/FelipeHCS0055/Color-darker-obsidian-snippets
>[!quote]- NARU
><iframe allowfullscreen src="https://github.com/FelipeHCS0055/Color-darker-obsidian-snippets" width="100%" height="315" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>

------


CSS IS diff for type of obsidian views
- [ ] preview
- [ ] editor
- [ ] publish
- [ ] etc
- [ ] not a 100% if this is right but they are diff based of view



FOR Publish CSS

how do i make my title ###### act like inside the obsidian vault way.
if you would like to add bolded header like inside obsidian but for obsidian publish

CSS SNIPPET
```
h6 a, .markdown-rendered h6 a {
	font-variant: small-caps;
}
```

FROM :
>[!quote]- NARU
>![[Pasted image 20240903141749.png]]
>
>	TO :
>	
>![[Pasted image 20240903141832.png]]

lets go!

----


https://www.youtube.com/watch?v=dH98dTEemGI

-----



GETTING COMFORTABLE WITH OBSIDIAN
https://forum.obsidian.md/t/getting-comfortable-with-obsidian-css/133


COMMON SELECTORS
https://forum.obsidian.md/t/common-selectors-for-custom-css/1984


THEMES
https://forum.obsidian.md/t/meta-post-css-themes-showcase/76


FORUM CSS
https://forum.obsidian.md/tag/custom-css


CSS CUSTOMIZATION ADD VARIABLE? IDK YET
https://github.com/mgmeyers/obsidian-style-settings


-----


## HIDE FOLDERS     
- [ ] utilizing [[CSS SNIPPET]]


##### HIDE FILES IN SPECIFIC FOLDER

```
div[data-path$='.png']{
	display: none;
}
```

##### HIDE CERTAIN FOLDER NAMES
- [ ] useful for NAS weird system

```
div[data-path$='assets'], 
div[data-path$='assets'] + div.nav-folder-children { display: none; }
```

[REFERENCE](https://forum.obsidian.md/t/how-to-hide-the-image-section-in-the-obsidian-tree-directory-section/39688/3)


----

