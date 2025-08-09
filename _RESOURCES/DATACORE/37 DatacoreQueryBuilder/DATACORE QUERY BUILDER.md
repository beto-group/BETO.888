

### Tab: Datacore Query Builder

- **Description**: An interactive developer tool for building, testing, and exploring Datacore queries in real-time. It provides a rich text editor with live-updating results, context-aware helpers for query construction, and an expandable view to inspect the raw data of returned objects.
    
- **Does**:
    
    - Executes Datacore queries live as the user types and immediately displays the results or any errors.
    - Provides a toolbar with buttons to quickly add base types (@page, @task), functions (path(), exists()), and other query constructs.
    - Features context-aware "helper" pop-ups that suggest available tags, folders, files, and properties as you type.
    - Includes a "Field Query" wizard (triggered by typing $) to guide users in building filters with comparison operators (e.g., rating >= 7).
    - Allows users to click on logical operators (AND, OR) directly in the query to change them or add negation (!not).
    - Displays results in a paginated list, with each item being expandable to view its full, raw JSON data object.
    - Offers a "Show Fields" button on each result to inspect the available fields and methods on the data object.
        
- **Can’t**:
    
    - Save or bookmark queries for later use within the UI.
    - Modify or delete data directly from the results view; it is a read-only explorer.
    - Export query results to formats like CSV or JSON.
    - Run multiple queries simultaneously in separate tabs or panels.
    - Create visual representations of the data (like charts or graphs).
        



<iframe allowfullscreen src="https://www.youtube.com/embed/Qf5Uad8JLrY" width="100%" height="555" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ></iframe>

![alt text](/_RESOURCES/IMAGES/datacore_query_builder.webp)


###### [Datacore Query Builder Viewer](D.q.datacorequerybuilder.viewer.md)

###### [Datacore Query Builder Viewer](D.q.datacorequerybuilder.component)