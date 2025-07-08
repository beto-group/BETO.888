
### Tab: Kanban v2

- **Description**: A live, file-based Kanban board that treats markdown files in your vault as columns and their separated content as cards.
    
- **Does**:
    
    - Treats individual vault files as columns (lanes) on the board.
    - Parses markdown files, using horizontal rules (---) to separate content into draggable cards.
    - Allows dragging-and-dropping cards between columns, which physically moves the card's text from one file to another.
    - Supports in-place editing, adding, and deleting cards, with all changes saved directly to the corresponding source files.
    - Lets you dynamically add new files as columns to the board by picking from a list or dropping a file onto the board.
        
- **Can’t**:
    
    - Relies on a strict file structure; files must contain a `#### [[ENIGMAS]]` header for cards to be correctly parsed.
    - Directly modifies files via string manipulation, which can be brittle and carries a risk of data corruption if card content isn't unique or an error occurs.
    - Lacks a persistent UI for configuration; the initial set of columns must be defined in the component's code block.

<iframe allowfullscreen src="https://www.youtube.com/embed/LG4uf3WJ1S4" width="100%" height="555" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ></iframe>




![[kanban.webp]]


### Components

###### [[D.q.kanban.viewer|Kanban Viewer]]

###### [[D.q.kanban.component|Kanban Component]]

