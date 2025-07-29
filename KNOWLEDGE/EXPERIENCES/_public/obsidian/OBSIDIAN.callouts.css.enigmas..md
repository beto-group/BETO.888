---
permalink:
---

###### NAVI. ATE - BACK : [[OBSIDIAN.callouts.css]]
---
>[!info]- [[ENIGMAS]]
---
#### AENIGMAS



**Obsidian. CSS**  
    Callouts  
>[!quote]- NARU  
><iframe allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://www.reddit.com/r/ObsidianMD/s/kdQOXJNL2w" class="iframe-container iframe-generic"> </iframe>  
>  
>https://www.reddit.com/r/ObsidianMD/s/kdQOXJNL2w  

------  

Obsidian callouts
    Css
>[!quote]- NARU 
><iframe allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://forum.obsidian.md/t/callouts-template-adding-a-styled-footer-section/94614?u=beto" class="iframe-container iframe-generic"> </iframe> 
> 
>https://forum.obsidian.md/t/callouts-template-adding-a-styled-footer-section/94614?u=beto

----

here css i use within own 
[[OBSIDIAN.publish]]


```css

/*  CUSTOM ABOUT CALLOUTS  */


/*  FIRST  */

[data-callout="todo"] {
    background-color: #dbc2f5 !important; /* Light purple */
    border: 1px solid #caa9eb; /* Slightly darker purple border */
    border-radius: 8px;
    padding: 15px 20px;
    color: #ffffff !important; /* White text for contrast */
  }
  
  [data-callout="todo"] .callout-title {
    font-size: 1.3em;
    font-weight: bold;
    color: #b389df !important; /* Light-medium purple for title and icon */
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  [data-callout="todo"] .callout-content {
    font-size: 1em;
    color: #d1b0e6 !important; /* Softer purple for content */
  }
  
  [data-callout="todo"] .callout-icon svg {
    stroke: #b389df !important; /* Matches the title's color */
    stroke-width: 2px;
    width: 24px;
    height: 24px;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  
  
  
  
  /*  SECOND  */
  
  [data-callout="question"] {
    background-color: #6a3a89 !important; /* Darker medium purple background */
    border: 1px solid #542c6e; /* Slightly darker border for depth */
    border-radius: 8px;
    padding: 15px 20px;
    color: #ffffff !important; /* White text for contrast */
  }
  
  [data-callout="question"] .callout-title {
    font-size: 1.3em;
    font-weight: bold;
    color: rgb(144, 88, 188) !important; /* Retained specified RGB value for title */
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  [data-callout="question"] .callout-content {
    font-size: 1em;
    color: #9d76c0 !important; /* Softer purple for content text */
  }
  
  [data-callout="question"] .callout-icon svg {
    stroke: rgb(144, 88, 188) !important; /* Matches the title's color */
    stroke-width: 2px;
    width: 24px;
    height: 24px;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  
  
  
  /*  THIRD  */
  
  [data-callout="danger"] {
    background-color: #310d4f !important; /* Significantly darker purple */
    border: 1px solid #24093a; /* Even darker purple border */
    border-radius: 8px;
    padding: 15px 20px;
    color: #ffffff !important; /* White text for contrast */
  }
  
  [data-callout="danger"] .callout-title {
    font-size: 1.3em;
    font-weight: bold;
    color: #5b2474 !important; /* Slightly lighter dark purple for title and icon */
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  [data-callout="danger"] .callout-content {
    font-size: 1em;
    color: #8e66b1 !important; /* Softer purple for the content */
  }
  
  [data-callout="danger"] .callout-icon svg {
    stroke: #5b2474 !important; /* Matches the title's color */
    stroke-width: 2px;
    width: 24px;
    height: 24px;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  


```

----
