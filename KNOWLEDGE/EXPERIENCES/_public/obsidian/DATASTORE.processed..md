

## Explanation

### What is Datastore?

The "datastore" in Datacore is an in-memory inverted index for all files within your Obsidian vault. It serves as a fast and efficient database that tracks metadata for every block, section, link, tag, and frontmatter within the files. The purpose of the datastore is to allow quick searches for various types of metadata, significantly improving performance for certain types of queries.

### Key Features of Datastore

1. **Specific Page Searches**: The datastore allows instantaneous retrieval of metadata from specific files.
2. **Type-based Searches**: It can efficiently locate all objects of a specific type, such as "pages," "PDFs," or "images."
3. **Link and Tag Tracking**: It records the exact location of every link or tag reference and can quickly produce these references.
4. **Field-Based Searches**: It tracks every definition of fields, enabling quick searches for pages containing specific fields such as "status" or "last read."
5. **Optimized Metadata**: Some specific fields, like task completions, are optimized for fast lookups.
6. **Parent/Child Relationships**: Datastore supports retrieving relationships between pages and sections, allowing quick navigation between them.

### Purpose of Queries

Queries in Datacore enable filtering and retrieval of metadata based on specified conditions. They allow users to find sections, pages, blocks, or other objects, and combine them for more complex searches using `and` or `or` operators.

---

## Tutorial

### Basic Datacore Querying

#### Step 1: Query Pages with a Specific Tag

Let’s say you want to find all pages tagged with `game` that have a rating of 9 or higher.

**Query:**

```graphql
@page and #game and rating >= 9
```

#### Step 2: Query Specific Types of Objects

To retrieve all blocks within your vault:

```css
@block
```

This fetches all markdown blocks across your vault.

#### Step 3: Use of Links in Queries

You can find all pages that link to a specific document, such as `MyDocument`:

``` lua
linkedto([[MyDocument]])
```
#### Step 4: Fetch Objects in Specific Paths

To find all objects in a particular folder like `Games`, use the `path()` function:

```
path("Games")
```
#### Step 5: Combining Queries

If you want to find all blocks tagged `#book` within a specific path:

```java
`@block and #book and path("Books")`
```
---

## How-to Guides

### How to Find Pages with Specific Tags and Metadata

1. Open Datacore’s query editor.
2. Use the query syntax to combine tag and field-based searches. For example:

```scss
    
    @page and #tag and exists(field_name)
    
```
    
    This will return all pages with the specified tag and the metadata field.

### How to Search for Parent-Child Relationships

1. Use the `parentof()` function to find parent objects of a specific block or section. Example:

```less
    
    parentof(@codeblock)
    
```

    This query retrieves the sections or pages containing the specified codeblocks.
    
2. If you want to include both the parent and child results, use `supertree()`:
    
    less
    
    Copy code
```
    
    supertree(@codeblock)
    
```

### How to Combine Multiple Queries

1. Use `and` to require multiple conditions:
    
    scss
    
    Copy code
    
    `@page and #tag and exists(field_name)`
    
    This fetches pages tagged with `#tag` that also contain the specified field.
    
2. Use `or` for alternatives:

```less

@page or @section
    
`````
    
    This returns both pages and sections.
    

---

## Reference

### Supported Query Types

- **@file**: Returns all files.
- **@page**: Returns all markdown pages.
- **@section**: Returns all sections within markdown pages.
- **@block**: Fetches all markdown blocks.
- **@block-list**: Lists markdown blocks containing lists.
- **@codeblock**: Returns all codeblocks.
- **@datablock**: Fetches Datacore-specific datablocks marked with `yaml:data`.
- **@list-item**: Returns list items in markdown.
- **@task**: Fetches all task items (e.g., `- [ ]`).

### Functions

- **#tag**: Fetches all objects tagged with the given tag (e.g., `#game`).
- **linked()**: Finds objects that link to or from a given page.
- **path()**: Fetches all objects in the specified path (e.g., `path("folder")`).
- **exists()**: Finds all objects with a specific metadata field defined.
- **parentof()**: Fetches parent objects of matching child objects.
- **childof()**: Fetches child objects of the matching parent objects.

### Query Combinators

- **and**: Combines two queries, returning results that match both.
- **or**: Combines two queries, returning results that match either or both.
- **Negation (!)**: Inverts a query, matching everything the original query does not match. E.g., `!#book` returns everything that isn't tagged `#book`.

### Performance Tips

- Focus on using fast queries (specific pages, types, or tags) to avoid slowdowns.
- Use negation queries (`!`) cautiously, as they can be slow if not narrowed down.