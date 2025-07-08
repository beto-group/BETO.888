

### Tab: CodeEditor v2

- **Description**: A powerful code editor with an integrated, automatic version control system (VCS) for any given file.
    
- **Does**:
    - Automatically versions a file on every save, creating a git-like history within a local .datacore directory.
    - Provides a side-by-side diff view to compare any two versions of the file, highlighting insertions and deletions.
    - Allows reverting the file content to any previous version with a single click.
    - Intelligently parses markdown files into navigable tabs for each code block, improving readability and navigation.
    - Offers a full-featured code editing experience using Ace Editor, including a minimap, themes, and search functionality.
    - Acts as a reusable component that can be pointed at any file in the vault via a filename property.
        
- **Can’t**:
    
    - Does not support advanced git features like branching, merging, or custom commit messages.
    - Version history is tied to the file path; renaming the file will start a new, separate history.
    - Requires an internet connection for the initial download of the Ace Editor library and its themes.

<iframe allowfullscreen src="https://www.youtube.com/embed/axsdZMtrIFo" width="100%" height="555" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ></iframe>



![[code_editor_2.png]]




### Components

###### [[D.q.codeeditor.viewer.v2|Code Editor v2 Viewer]]

###### [[D.q.codeeditor.component.v2|Code Editor v2 Component]]

