


great ressource
https://blacksmithgu.github.io/datacore/




# Datacore

Datacore is a power tool for [Obsidian.md](https://obsidian.md/), allowing you to create dynamic views that gather and edit data from the files in your vault.

### Getting Started

_If you just want to see something on your screen as fast as possible, follow the [quickstart](https://blacksmithgu.github.io/datacore/quickstart)! Otherwise, read on._

All you need to get started is to download the Datacore plugin from the Obsidian Community plugins page. You may need to enable Community Plugins before you are able to add Datacore, and then enable the plugin in the Plugins tab of Obsidian. Once installed, Datacore will start indexing your vault, which may take several minutes - your text editor will have a section in the gutter showing the current status of the index. Datacore is usable as soon as you install it, but results will not be complete until indexing finishes. Future starts of your vault will use saved data and index will be much faster.

Once Datacore is installed, it's immediately ready to use!

- To learn more about what metadata is available in Datacore and what you can add, check out [Metadata](https://blacksmithgu.github.io/datacore/data).
- For learning how to make datacore queries, check out [Datacore Queries](https://blacksmithgu.github.io/datacore/data/query).
- To learn about how to create dynamic views, check out [Javascript Views](https://blacksmithgu.github.io/datacore/code-views).

Datacore is currently in a power-user stage focused on javascript/typescript savvy users - non-javscript views similar to DataviewQL will be coming in the future!

### Datacore as an API

The datacore API typings are available via the npm package `@blacksmithgu/datacore`. If you are developing an Obsidian plugin that you want to interop with Datacore on, you can simply:

```
# Yarn:yarn add @blacksmithgu/datacore# npm:npm install @blacksmithgu/datacore
```



# Quickstart

Want to just see something on your screen? Follow this (hopefully simple) guide to get something you can put your eyeballs on. Note that this is using the Datacore Javascript API - the non-Javascript functionality is not available yet, so if you don't know Javascript, the plugin may not be ready for you!

## Installation

Install Datacore from the Obsidian community plugins viewer, then enable it in your community plugins view. Datacore will then be immediately available, though it may take some time to index your vault in the background before all results are visible.

> **Note: Beta Version**
> 
> You can also install the beta version of the plugin directly from source, though we only recommend doing this if you "know what you are doing" and want some feature in the beta branch.
> 
> To install beta plugins, install the Obsidian BRAT plugin and add datacore to it using the plugin URL of `https://github.com/blacksmithgu/datacore`.

## The Most Trivial of Views

To immediately get something on the screen, add a datacore code block to any page of your choice. Here's a starter one which just live-updates to show how many markdown pages you have in your vault:

````
```datacorejsx// All datacore views should return a React component; in practice, this is going to bereturn function View() {    const pages = dc.useQuery("@page").length;    return <p>You have {pages} pages in your vault!</p>;}```
````

Alternatively, if a trivial component that shows how many pages you have is too pedestrian, here is the classic table view:

````
```datacorejsx// A list of columns to show in the table.const COLUMNS = [    { id: "Name", value: page => page.$link },    { id: "Rating", value: page => page.value("rating") }];return function View() {    // Selecting `#game` pages, for example.    const pages = dc.useQuery("@page and #game");    // Uses the built in table component for showing objects in a table!    return <dc.Table columns={COLUMNS} rows={pages} />;}```
````

For more of an explanation of how each of the pieces here is working, check out:

- [Queries](https://blacksmithgu.github.io/datacore/data/query) for writing queries that fetch data from your vault.
- [Views](https://blacksmithgu.github.io/datacore/code-views) for writing the code to actually create views over your queried data.




# Metadata

Datacore is a _metadata_ index - it stores information about every page, section, block, list item, canvas file, and other file in your vault in an internal database which can be quickly searched for generating nice-looking views. You access this metadata using the [query language](https://blacksmithgu.github.io/datacore/data/query), and then compile it into useful views using the [embedded views](https://blacksmithgu.github.io/datacore/code-views).

## What Does Metadata Look Like?

Every single thing that datacore tracks has a large list of _metadata_ - for example, the simple markdown page below:

```
---length: 35 hoursrating: 10time-played: 2013-06-10---# Dark Souls#game, #game/hardThe game that eventually lead to [[Dark Souls 2]] and [[Elden Ring]]!
```

Will look like the following in Datacore:

```
{    $name: "Dark Souls",    $path: "games/Dark Souls.md",    $tags: ["#game", "#game/hard"],    $links: [{ path: "games/Dark Souls 2.md" }, { path: "games/Elden Ring.md" }],    $types: ["page", "markdown", "file", "taggable", "linkable"],    $frontmatter: {        "length": "35 hours",        "rating": 10,        "time-played": "2013-06-10"    },    /** ... many more fields ... */},
```

Most fields in the metadata start with a dollar sign (`$`), meaning they are _intrinsic_ - automatically provided by Obsidian and Datacore. This includes things like a files path, tags and links in the file, titles, sections, and so on. Explicit properties you put in your `Properties` block or via inline fields are _user_ metadata - `length`, `rating`, and `time-played` in the example above.

When writing queries against this metadata, you can reference fields directly by name - so `$path` to reference the intrinsic file path, or `length` to reference your user-defined property `length`.

> **Aside: Why the dollar sign?**
> 
> Datacore prepends all of it's intrinsic fields with dollar signs to differentiate them from user metadata. This allows for someone to have a property named `path` for example, separate from `$path`.

## What Is Available?

The data available depends on the specific type. The sections below describe metadata that is generally available for everything - for specific types, you can look at it's corresponding metadata reference page.

### Object Types (`$types`)

All datacore objects have multiple 'types', which describe what they are.

- Markdown Pages, for example, have the types `page`, as well as the type `markdown` to denote that they came from a markdown page.
- Sections have the type `section`, as well as the type `markdown`.
- Tasks have the types `task` and `list-item`, as well as `markdown`.

When writing queries, you can filter results by their type (using the `@type` [query](https://blacksmithgu.github.io/datacore/data/query)), allowing you to limit results just down to pages, or sections, or tasks, for example.

### Parent & Children (`$parent`)

The datacore index is heirarchical - each page has a list of sections; each section has a list of blocks; and blocks may have list items, tasks, or other sub-items inside of them. If you look at a full page object, for example, you can see the full list of sections as `$sections`. Similarly, for a given section, you can find it's parent page using `$parent`.

### Tags (`$tags`)

Generally, everything taggable has the `$tags` field, which is an exact list of the (de-duplicated) tags in the document.

### Links (`$links`)

Similarly, everything you can put links has the `$links` field, which is an exact list of every link that the object links to. The links stored here are automatically deduplicated, so you even if you link to a given document many times it will only show up once.

### File (`$file`) / Path (`$path`)

All objects are tagged with the file path (`$file`) that they came from. For objects that _are_ files, like markdown pages, images, or canvas files, this data is also available as `$path`.





# Queries

Datacore comes with a query language which can be used to filter down the set of result objects. Queries produce sets of results - sections, blocks, pages, etc. They can be combined with `and` and `or`.

## Using Queries

You'll usually be using queries with the datacore `query` and `useQuery` functions:

```
// Inside of a react component, watch the results of a query live. Automatically updates// whenever the query results change.const pages = dc.useQuery("@page");// In a plugin context or in more advanced usage, you can run a query a single time with `query`.const pages = dc.query("@page and rating > 9");
```

## Basic Query Types

### `@type`

You can fetch all objects of a specific type (section, page, etc) using a `@type` query. To fetch all pages, use `@page`; to fetch all blocks, use `@block`. The full set of currently supported types is below:

- `@file`: All files.
- `@page`: All markdown pages.
- `@section`: All markdown sections in markdown pages.
- `@block`: All markdown blocks in markdown pages.
- `@block-list`: All markdown blocks that contain lists in them.
- `@codeblock`: All markdown codeblocks.
- `@datablock`: All datacore 'datablocks', which are special codeblocks annotated with `yaml:data`.
- `@list-item`: All list items in markdown pages.
- `@task`: All task items (of the form `- [ ]`).

Type queries are usually combined with other queries to filter to specific types - for example, `@section and #tag` will return sections tagged with `#tag`.

### `#tag`

You can fetch all objects tagged with a given tag using `#tag` - for example, `#game` or `#philosophy/natural`.

### `connected()`

You can fetch objects that link TO or link FROM a given page. To find all pages that link TO a document, use `linkedto([[link]])`; to find pages that link FROM a document, use `linkedfrom([[link]])`. If you want all links regardless of direction, just use `connected([[link]])`.

### `path()`

You can fetch all objects at the given path/folder in your vault using `path("path/to/folder")`. To fetch all files in your `Games` folder, for example, use `path("Games")`.

### `exists()`

You can fetch all objects which have a specific metadata field defined with `exists`. For example, `exists(rating)` will return all pages which have `rating` defined.

### `parentof()`

Datacore supports searching for the _parents_ of certain objects - for example, if you want to find all pages that contain json codeblocks. This is implemented via `parentof()`, which takes a query that matches objects and instead matches all parents of those objects. For example, if `#pizza` would match a collection of blocks and sections, `parentof(#pizza)` would match the sections and pages that contain those blocks/sections.

`parentof()` is best described via examples:

```
// Find all pages that contain datacore codeblocks.@page and parentof(@codeblock and $languages.contains("datacorejs"))// Find pages which have `Daily` sections.@page and parentof(@section and $name = "Daily")
```

By default, `parentof()` is exclusive, meaning it will only return the parents of the input query; if you want to also return the matches of the input query, use `supertree()`:

```
// Return all of the parent sections/pages of codeblocks.parentof(@codeblock)// Return the parent sections and pages of codeblocks, and the codeblocks themselves.supertree(@codeblock)
```

### `childof()`

The complementary operation to `parentof()`; given an input query, produces all of the children of the matching objects. `@page` produces all pages; `childof(@page)` produces all sections, blocks, list items, and so on.

Like `parentof()`, `childof()` is exclusive by default and will not return matches from the input query. If you want to also get matches from the input query, use `subtree()`.

```
// Return all sections, blocks, etc that are children of markdown pages.childof(@page)// Return page objects and all of the sections, blocks, etc in them.subtree(@page)
```

### Expressions

You can execute arbitrary [expressions](https://blacksmithgu.github.io/datacore/expressions) in a search; the expression will be checked against each object in the datacore index to find matches. For example,

```
// Find all objects with a rating field that is 9 or greater.rating >= 9// Find all sections which have a name NOT equal to 'Daily'.@section and $name != "Daily"// Find all sections whose name contains `Daily`.@section and $name.contains("Daily")
```

## Query Combinators

You can combine queries with the standard suite of operations.

### `and`

You can combine two queries with `and`: `@block and #book` matches all `@blocks` tagged `#book`. Queries combined with `and` only return results that match both subqueries.

### `or`

Queries combined with `or` match objects that match either or both of the subqueries: `@block or #book` matches all `@blocks`, all objects tagged `#block`, and blocks tagged `#book`.

### `!not`

You can negate a query with `!`: negated queries match everything that the original query does not match. So `!#book` matches every object that is NOT tagged `#book`.

Negated queries can be slow since they can produce an enormous number of results - to keep performance up, make sure to keep your query specific - for example, instead of `!#book`, use `!#book and @block`.

---

## Example Queries

**Find all pages tagged game which have a rating of 9 or above.**

```
@page and #game and rating >= 9
```

**Find all uncompleted tasks which are in sections named 'Daily'.**

```
@task and $completed = false and childof(@section and $name = "Daily")
```

**Find all project pages that link to a coworker**

```
@page and #project and linksto([[Coworker]])
```






# Fields

Datacore supports loading and querying by user-provided frontmatter and inline fields, known generally as a "field".

## How Are User Fields Specified?

You can specify custom metadata in two ways:

1. **Properties**: Also known as frontmatter, you can add properties to top level pages which datacore will make available for searches and queries.
2. **Inline Fields**: You can add 'inline' metadata anywhere in the page via the `[key:: value]` syntax.

> _Note_: Properties are officially supported by Obsidian but inline fields are not; when possible, consider using properties and tags over inline fields.

## In Queries and Expressions

You can reference fields directly by name in queries and datacore expressions. This is case-insensitive.

```
// References the 'rating' field directly.@page and rating >= 7// You can also reference intrinsic fields (fields prefixed with `$`):@block and $tags.contains("#test")// Use the implicit 'row' in order to handle fields with spaces in their names:@section and row["last reviewed"] >= date(now) - dur(7d)
```

## In Javascript

Most datacore javascript types support the "fields" API, which is a general set of methods for accessing frontmatter and inline fields efficiently. Any datacore type with the `fields` type (queryable as `@fields`) supports these methods for loading metadata:

|**Method**|**Explanation**|**Example**|
|---|---|---|
|`fields()`|Load full metadata for all fields available on the object. Returns a list of `Field` objects, which include the original key name, value, and raw unparsed value.|See field reference below.|
|`field(name)`|Load a field by the given name in a _case insensitive_ manner.|`page.field("rating") => { key: "Rating", value: 7, raw: "7" }`|
|`value(name)`|Load the value of a field by the given name in a _case insensitive_ manner. `page.value("rating") => 7`||

Both user-defined fields (like a `Rating` field in the Properties block), and intrinsic fields (prefixed with a `$`) can be loaded.

## Examples

```
// Load the 'rating' field from the current page.dc.currentFile().value("rating")// Get the raw, unparsed value of a field from frontmatter.dc.currentFile().field("complex-date").raw
```

## Field Type Reference

```
export interface Field {    /** The canonical key name for the field (i.e., as it actually shows up in the data structure). */    key: string;    /** The value of the field. */    value: Literal;    /** The raw value of the field before parsing, if relevant. */    raw?: string;    /** If present, describes where the field came from in precise detail, allowing the field to be edited. */    provenance?: Provenance;}
```




# Pages

Datacore tracks all markdown pages as well as a substantial amount of metadata about them. Markdown pages can be queried by the `@page` type.

## Available Data

|**Field**|**Description**|**Example**|
|---|---|---|
|`$path`|The full path of this markdown page, relative to the Vault Root.|`games/Dark Souls.md`|
|`$ctime`|The time that the file was created in the local filesystem.|`January 1st, 2024 5:37PM`|
|`$mtime`|The time that the file was last modified in the local filesystem.|`January 1st, 2024 5:37PM`|
|`$extension`|The file extension of the file - usually going to be `md` or `markdown` for markdown.|`md` or `markdown`|
|`$size`|The total size of the file, in bytes.|`537`|
|`$position`|The 'position' of the markdown element, which for pages is just the entire size of the page. Datacore positions are recorded as `{ start, end }` line numbers, where start is inclusive and end is exclusive.|`{ start: 0, end: 7 }`|
|`$lineCount`|The total number of lines in the page.|`13`|
|`$name`|The name of the page as you would see it in Obsidian.|`Dark Souls`|
|`$link`|A Link object that links to this page.|`[[Dark Souls]]`|
|`$tags`|A list of unique tags in the file.|`["#game", "#todo/revisit"]`|
|`$sections`|A list of all of the [markdown sections](https://blacksmithgu.github.io/datacore/data/sections) in the file. An implicit section is created for the first section of the markdown file before any section headers.|See [markdown sections](https://blacksmithgu.github.io/datacore/data/sections).|
|`$frontmatter`|A list of all of the frontmatter / "Properties" fields. See the section below for details.|`{ "field 1": { key: "field 1", value: "value", raw: "raw unparsed value" }, ... }`|
|`$infields`|A list of all of inline fields. See the section below for details.|`{ "field 1": { key: "field 1", value: "value", raw: "raw unparsed value", position: ... }, ... }`|
|_User Data_|Frontmatter data and inline fields can be accessed directly on pages in a case-insensitive manner.|See below.|

## Frontmatter & Inline Fields

Datacore tracks frontmatter and inline fields on pages using the `$frontmatter` and `$infields` metadata properties, which are maps from (lower-case) field name to their value. You can directly use these types if you wish, but it is generally easier to use the shorthand methods:

## In Queries / Expressions

You can reference page fields in queries and expressions directly by case-insensitive name:

```
@page and rating >= 7@page and row["spaced field"].contains("thing")
```

## In Javascript

In javascript, you can use the [fields API](https://blacksmithgu.github.io/datacore/data/fields) to easily access typed fields. This is case-insensitive:

```
page.value("rating") => 7page.value("genre") => "Fantasy"
```

## JSON Reference

A compact view of every piece of metadata available on a markdown page:

```
{    $types: ["file", "markdown", "page", "taggable", "linkable", "links", "fields"],    $typename: "Page",    $id: "<path-to-file>",    $file: "<path-to-file>",    $frontmatter: [        "key 1": {            key: "key 1",            value: "<parsed value>",            raw: "<raw unparsed text value>"        },        ...    ],    $infields: [        "field 1": {            key: "field 1",            value: "<parsed value>",            raw: "<raw unparsed text value>",            position: { start: 0, end: 1 }        },        ...    ],    $path: "<path-to-file>",    $ctime: "<unix epoch seconds when file was created>",    $mtime: "<unix epoch seconds when file was last modified>",    $extension: "<file extension - usually 'md'>",    $size: "<size of file in bytes>",    // Start and end position of the whole file in lines - this usually means start is 0 and end is the number of lines in the file + 1.    // Start position is inclusive; end is exclusive.    $position: { start: 0, end: 1 },    $tags: ["#tag1", "#tag2/thing"],    $links: [ /* list of Link objects in this page. */ ],    $sections: [ /* list of sections in this page. */ ],    /** Derived Fields. */    $lineCount: 1, // Number of lines in the file.    $name: "File Name", // Name of the file as it would show up in Obsidian.    $link: <link-to-file>, // Link object that links to this file.}
```




# Sections

Datacore tracks each section in markdown files and canvases; sections can be queried by the `@section` type.

|**Field**|**Description**|**Example**|
|---|---|---|
|`$ordinal`|The position of this section in the file. The first section has ordinal 0, then 1, and so on.|`1`|
|`$title`|The name of the section.|`Details`|
|`$name`|Alias for `$title`; gives the name of the section.|`Details`|
|`$level`|The section level (i.e., the number of `#` preceding it).|1 - 6|
|`$position`|The position of the section. Datacore positions are recorded as `{ start, end }` line numbers, where start is inclusive and end is exclusive.|`{ start: 0, end: 7 }`|
|`$lineCount`|The length of the section in lines.|`7`|
|`$tags`|A list of unique tags in the section.|`["#game", "#todo/revisit"]`|
|`$links`|A list of all unique links in the section.|A list of links.|
|`$link`|A Link object that links to this section.|`[[Dark Souls#Thoughts]]`|
|`$blocks`|A list of markdown blocks inside this section. See the documentation for [blocks](https://blacksmithgu.github.io/datacore/data/blocks).|See documentation.|
|`$infields`|A list of inline fields for this section.|`{ "field 1": { key: "field 1", value: "value", raw: "raw unparsed value", position: ... }, ... }`|
|_User Data_|Inline fields can be accessed directly on sections in a case-insensitive manner.|See below.|

## Inline Fields

Inline fields on sections can be loaded using the [field syntax](https://blacksmithgu.github.io/datacore/data/fields):

```
// In queries and expressions, you can just reference the field directly:@section and row["last reviewed"] > date(now) - dur(7d)// In javascript, use the field API:section.value("last reviewed")
```

## JSON Reference

A compact view of every piece of metadata available on a section:

```
{    $types: ["markdown", "section", "taggable", "linkable", "links", "fields"],    $typename: "Section",    $id: "<unique id>",    $file: "<path-to-file-containing-section>",    $infields: [        "field 1": {            key: "field 1",            value: "<parsed value>",            raw: "<raw unparsed text value>",            position: { start: 0, end: 1 }        },        ...    ],    $ordinal: <number>,    $title: "<section title>",    $name: "<section title>",    $level: "<1-6 level of section>",    $lineCount: 1, // Number of lines in the file.    // Start and end position of the section in lines. Start position is inclusive; end is exclusive.    $position: { start: 0, end: 1 },    $link: <link-to-file>, // Link object that links to this file.    $tags: ["#tag1", "#tag2/thing"],    $links: [ /* list of Link objects in this section. */ ],    $blocks: [ /* list of blocks in this section. */ ],}
```



# Blocks

Datacore tracks every markdown block in markdown files and in canvas files. The metadata available depends on the type of block.

## Metadata for all Blocks

|**Field**|**Description**|**Example**|
|---|---|---|
|`$type`|The _type_ of block - such as a list block or codeblock, etc.|`list` or `codeblock` or `datablock` or `paragraph` or `yaml`|
|`$ordinal`|The position of this block in the file. The first block has ordinal 0, the second 1, and so on.|Non-negative integer (`0`, `1`, etc.)|
|`$position`|The position of the block. Datacore positions are recorded as `{ start, end }` line numbers, where start is inclusive and end is exclusive.|`{ start: 0, end: 7 }`|
|`$tags`|A list of unique tags in the block.|`["#game", "#todo/revisit"]`|
|`$links`|A list of all unique links in the section.|A list of links.|
|`$link`|A Link object that links to this block, if the block has a block ID that can be linked to. Otherwise, is undefined.|`[[Dark Souls#^blockId]]`|
|`$blockId`|The unique block ID for the given block, if one is defined.|`blockId`|
|`$infields`|A list of inline fields for this block.|`{ "field 1": { key: "field 1", value: "value", raw: "raw unparsed value", position: ... }, ... }`|

## Inline Fields

Inline fields on blocks can be loaded using the [field syntax](https://blacksmithgu.github.io/datacore/data/fields):

```
// In queries and expressions, you can just reference the field directly:@block and genre = "Fantasy"@block and row["last reviewed"] > date(now) - dur(7d)// In javascript, use the field API:block.value("last reviewed")
```

## Block Types

### Paragraphs (`paragraph`)

A paragraph of text; these blocks have no additional metadata.

```
A contiguous set of text linesis considered a paragraph.An empty line splits the text upinto two separate paragraphs.
```

### YAML (`yaml`)

Used for frontmatter blocks. This data is directly stored in the page as `$frontmatter`, so this block itself has no additional metadata.

```
---key: valuekey2: value2---
```

### List Blocks (`list-block`)

Contains a list of items or task items. List blocks have the `block-list` type and can be queried by `@block-list`.

```
- Item 1- Item 2- [ ] Task 1- [ ] Task 2
```

|**Field**|**Description**|
|---|---|
|`$elements`|The list item elements in the list block. See below for details.|

#### List Items (`list-item`)

Datacore tracks all list items and tasks in your vault; they are available as the type `list-item` and can be queried as `@list-item`.

```
- Regular list item.- Another regular list item.    - A sublist item.
```

|**Field**|**Description**|**Example**|
|---|---|---|
|`$type`|The _type_ of list item - either `task` or `list`.|`task` or `list`|
|`$position`|The position of the list item. Datacore positions are recorded as `{ start, end }` line numbers, where start is inclusive and end is exclusive.|`{ start: 0, end: 7 }`|
|`$line`|The line number that this list item starts on.|`7`|
|`$lineCount`|The number of lines in the list item.|`2`|
|`$tags`|A list of unique tags in the list item.|`["#game", "#todo/revisit"]`|
|`$links`|A list of all unique links in the list item.|A list of links.|
|`$infields`|A list of inline fields for this list item.|`{ "field 1": { key: "field 1", value: "value", raw: "raw unparsed value", position: ... }, ... }`|
|`$blockId`|If set, the block ID that can be used to link to this specific list item.|An Obsidian _block ID_ like `ssa82hr`|
|`$parentLine`|The line number of the parent item of this list item. For top-level list items, this will be a negative number equal to the line number of the start of the list block.|`14` or `-7`|
|`$symbol`|The list item symbol used for this list item.|`-` or `*` or `+` or `1.`|
|`$text`|The full text of the list item, not including any list markup.|`TODO: Do something. [key:: value]`|
|`$cleantext`|"Cleaned up" version of `text` which has indentation and inline fields removed.|`TODO: Do something.`|
|`$elements`|A list of all sub items under this list item.|See this type.|

Like most other types, inline field values can be fetched from list items using [field syntax](https://blacksmithgu.github.io/datacore/data/fields).

#### Tasks (`task`)

Task list items have all properties of regular list items and are also considered list items; however, they have the additional `task` type can be queried via `@task`.

```
- [ ] An uncompleted task.- [?] A questionable task.    - [X] A completed task.
```

They also have the following additional fields:

|**Field**|**Description**|**Example**|
|---|---|---|
|`$type`|Tasks always have the type `task`.|`task`|
|`$status`|The status inside the brackets for the task.|`X` or `x` or `?` or (empty)|
|`$completed`|true if `$status` is `x` or `X`, and false otherwise.|`true` or `false`|

### Codeblocks (`codeblock`)

A markdown codeblock, which can be defined using either backticks or tab indentation. Codeblocks have the `codeblock` type and can be queried by `@codeblock`.

````
```json{ "a codeblock": "with some stuff in it" }```
````

|**Field**|**Description**|**Example**|
|---|---|---|
|`$languages`|The list of languages specified for the codeblock; may be empty if no language was specified.|`["javascript", "json"]`|
|`$contentPosition`|The start and end lines of the actual code inside of the code block - this position skips any wrapping characters like backticks. Like other positions, start is inclusive and end is exclusive.|`{ start: 4, end: 7 }`|
|`$style`|Whether the codeblock is defined by backticks (```) or by indentation.|`fenced` or `indent`|

### Datablocks (`datablock`)

Datablocks are specially annotated codeblocks which have been annotated with the `yaml:data` language:

````
```yaml:datakey: valuekey2: value2```
````

Datablocks can be directly searched over (using the `@datablock` query or `datablock` type) and all of their data is available as fields.

```
// Fetch all datablocks which have a 'rating' field.const datablocks = dc.query("@datablock and exists(rating)");// Fetch data specifically from the values in the datablock.datablocks[0].value("rating")
```

Datablocks are best used for tracking regular data - for example, an exercise block:

````
```yaml:datatype: exercisedate: 2025-01-10lifts:    squat: 240```
````

Which could then be queried via:

```
@datablock and type = "exercise"
```




# Javascript Views

Datacore supports Javascript, JSX, Typescript, and TSX. To add code to a page, use an embedded codeblock with the language `datacorejs`, `datacorejsx`, `datacorets`, or `datacoretsx` respectively. Datacore also has a plugin API available via the global `window.datacore`.

## DatacoreJS Codeblocks

Datacore javascript codeblocks execute JS scripts to produce embedded tables, lists, and so on. These views can be fully interactive with buttons, time-base elements, and custom CSS. They use `preact` (essentially a smaller variant of `React`) for rendering. The most basic codeblock looks like so:

````
```datacorejsxreturn function View() {    return <p>Hello!</p>;}```
````

Codeblocks should be annotated with `datacorejsx` to use JSX, and they should return a React Component (the `return function View()` in the example), which will be rendered. Codeblocks have access to the `dc` global variable, which provides a very rich API for querying state via React Hooks.

> **Note: React Components**
> 
> React components are not covered in great depth here - we recommend reading up on how React works using the very excellent [React documentation](https://react.dev/learn). The core idea is simply that components are declarative - they return the full HTML that should be rendered, and React then intelligently renders only the parts which changed and only calls the function when state changes somewhere.

### Fetching Data

The most fundamental hook for fetching data is `dc.useQuery()` - this accepts a Datacore query and produces an array of matching objects, like so:

```
return function View() {    const games = dc.useQuery("#game and @page and rating > 7");    return <p>You have written about {games.length} games!</p>;}
```

If you only want the metadata for a specific file, you can use `dc.useFile()` or `dc.useCurrentFile()`:

```
return function View() {    // Returns full page metadata for the current file, and updates the view whenever the current    // file changes.    const current = dc.useCurrentFile();    // Returns file metadata for a file at a specific path.    const other = dc.useFile("secret/data.md");    return <p>You are on {current.$path}; you are loading from {other.$path}.</p>;}
```

> **Note: When Does My View Update?**
> 
> Datacore uses React Hooks to automatically update views. Most datacore hooks like `dc.useCurrentFile()` and `dc.useQuery()` internally set up event listeners for when the datacore index changes. When it does, they update some internal state which causes your view to automatically re-render. This is similar to how the React `useState` hook will cause your view to re-render if you update the state!
> 
> For more advanced users, note that this means you can directly control when things re-render if you wish, by directly using load apis like `dc.query()` and manually reacting to index updates - either by subscribing to the event or using the low level `dc.useIndexUpdates()` hook to just trigger on every index update.

### Processing your Data

Datacore queries always produce lists of matching objects. You should maximize putting logic into the query for performance reasons, but you may want to do grouping, flattening, complex filtering, or other logic before rendering. If so, you should generally use React memoization to do this:

```
return function View() {    // Fetch all pages tagged #game.    const games = dc.useQuery("#game and @page");    // We want to manually construct a histogram of games by the rating we gave them.    const ratingBuckets = dc.useMemo(() => {        const ratings = {};        for (const game of games) {            if (!game.value("rating")) continue;            // Convert all ratings to strings since who knows what people put in metadata these days.            const rating = game.value("rating") + "";            ratings[rating] = (ratings[rating] ?? 0) + 1;        }        return ratings;    }, [games]);    // Then show those buckets!    return (        <ul>            {Object.keys(ratingBuckets).map(rating => (                <li>Rating {rating}: {ratingBuckets[rating] ?? 0} entries.</li>            ))}        </ul>    );}
```

### Displaying Your Data

To display your data, you can output arbitrary HTML using the Javascript JSX syntax (also covered in the React documentation). For example, to render some paragraphs:

```
return function View() {    return <div>        <p>Hello!</p>        <p>Goodbye!</p>    </div>;}
```

Injecting data into JSX views is done via `{}` interpolation; for example:

```
return function View() {    const data = dc.useCurrentFile();    return <p>The file you are on is "{data.$path}".</p>;}
```

You can run arbitrary javascript inside interpolated blocks:

```
return function View() {    const data = dc.useCurrentFile();    return <p>The first character is {data.$name.substring(0, 1)}!</p>}
```

You can even `map` over arrays to allow for creating lists and so on:

```
return function View() {    const data = [1, 2, 3, 4];    return <ol>        {data.map(index => (            <li>{index}</li>        ))}    </ol>;}
```

## Splitting Up Complex Views

For large views, you can split up large blocks of complicated JSX into separate functions.

```
function ListItem({ text }) {    return <li>Some text: {text}</li>;}return function View() {    return <ul>        <ListItem text="text!" />        <ListItem text="more text!" />        <ListItem text="even more text!" />    </ul>;}
```

## Sharing Code

You can split code up into common snippets that can then be imported by other scripts using `dc.require`. Common snippets can either be placed directly into `js/ts` files in your vault, OR they can be placed into codeblocks and imported by the name of the section the codeblock is in. For example, in file `scripts/lists.md`:

```
# ListItem```jsxfunction ListItem({ text }) {    return <li>Some text: {text}</li>;}// The return is important here - dc.require literally calls this code as a function and yields// whatever this codeblock returns. If you are used to 'import'-style includes in modern ECMAScript,// this may look a bit weird.return { ListItem };```
```

Then, from another script elsewhere:

```
const { ListItem } = await dc.require(dc.headerLink("scripts/lists.md", "ListItem"));return function View() {    return <ListItem text="whoa!" />;}
```




# Codeblock API

Datacore views are built around the datacore codeblock (also known as "local") API, which is available in any datacore codeblock as `dc`. The codeblock API provides access to a large number of useful utility functions and components with which you can build our more complicated views.

Datacore codeblocks are built on React, so the basic structure of any codeblock will generally look like:

````
```datacorejsx// Return a react functional component which renders your view.return function View() {    // Call functions on the datacore API, 'dc'.    const data = dc.useQuery("#book");    // And then return a view, possibly using more datacore API calls.    return <dc.List rows={data} renderer={book => book.$link} />;}```
````

## Query Hooks

Datacore provides several methods for querying for data, including by the full query language and by path explicitly.

### `dc.useCurrentFile()`

Loads the metadata for the file that the view is in - this will usually be `MarkdownPage`, but can also be a `CanvasPage`. Using this hook will automatically refresh the view whenever the current file changes.

```
return function View() {    const file = dc.useCurrentFile();    return <p>Hello, {file.$name}!</p>;}
```

`dc.useCurrentFile` accepts an optional settings argument, which currently allows you to configure how often the view should update via the `debounce` property.

```
// Only update the view at most once per 10 seconds (1000ms).const file = dc.useCurrentFile({ debounce: 10000 });
```

### `dc.useCurrentPath()`

Loads the path of the file that the view is in - this will usually be `MarkdownPage`, but can also be a `CanvasPage`. Using this hook will automatically refresh the view whenever the current file changes.

```
return function View() {    const path = dc.useCurrentPath();    return <p>The file is at {path}!</p>;}
```

Like `useCurrentFile`, `dc.useCurrentPath` accepts an optional settings argument which can configure a `debounce`:

```
// Only update the view at most once per 10 seconds (1000ms).const path = dc.useCurrentPath({ debounce: 10000 });
```

### `dc.useQuery()`

Query for a list of results using the [query language](https://blacksmithgu.github.io/datacore/data/query). This will return a vanilla javascript list containing all of the results that match the query, which can be a wide range of different data types. This hook will cause the view to update whenever the query returns new results.

```
return function View() {    const books = dc.useQuery("#book and @page");    return <dc.List rows={books} renderer={book => book.$link} />;}
```

`dc.useQuery` accepts an optional second argument containing configuration; currently, the only configuration option is `debounce`, which allows you to control how fast the view is allowed to update to reflect new results:

```
return function View() {    // Only allow the view to update every 10000ms (aka, 10 seconds).    const books = dc.useQuery("#book and @page", { debounce: 10000 });    return <dc.List rows={books} renderer={book => book.$link} />;}
```

### `dc.useFullQuery()`

Variant of `dc.useQuery` which returns a full search result object, which mainly provides a bit of useful extra metadata about how the search performed. Specifically, it returns the following data:

```
export interface SearchResult<O> {    /** The query used to search. */    query: IndexQuery;    /** All of the returned results. */    results: O[];    /** The amount of time in seconds that the search took. */    duration: number;    /** The maximum revision of any document in the result, which is useful for diffing. */    revision: number;}
```

`dc.useFullQuery` can otherwise be used identically to `dc.useQuery`:

```
return function View() {    // Only allow the view to update every 10000ms (aka, 10 seconds).    const bookResult = dc.useFullQuery("#book and @page", { debounce: 10000 });    return <dc.Stack>        <p>The search took {bookResult.duration.toFixed(2)}s to run.</p>        <dc.List rows={bookResult.results} renderer={book => book.$link} />    </dc.Stack>;}
```

### `dc.useIndexUpdates()`

A minimal query which just returns the current `revision` of the datacore index. The index `revision` is a monotonically increasing number which is incremented every time something in your vault changes. This call is mainly useful if you are making heavy usage of direct `dc.query` calls (which don't cause the view to refresh on their own), as it will cause the view to re-render every time something changes in your vault.

```
return function View() {    // Revision will update on every index update.    const revision = dc.useIndexUpdates();    // Run some complex query that will be re-run on every revision update.    const complexQuery = dc.useMemo(() => {        const thing = dc.query(/* ... */);        // ...    }, [revision]);}
```

Like the other hooks, `dc.useIndexUpdates` accepts an optional settings parameter, which allows you to set a debounce:

```
// Only update at most once every ten seconds.const revision = dc.useIndexUpdates({ debounce: 10000 });
```

## Common React Hooks

Datacore forwards the most common React hooks through it's API to make them available. The full list, with brief explanations of each, is:

- `dc.useState`: Create a React state variable that can be read and updated.
- `dc.useReducer`: Create a React reducer which accepts messages to update internal state.
- `dc.useMemo`: Memoize a value so it only updates when a dependency array changes.
- `dc.useCallback`: Memoize a function so it only is re-created when a dependency array changes.
- `dc.useEffect`: Run a specific 'side-effect' whenever a dependency array changes.
- `dc.createContext`: Create a react context which allows passing state down many layers without prop drilling.
- `dc.useContext`: Use a previously created context.
- `dc.useRef`: A state-like variable that allows directly storing a value without causing React re-renders.

Datacore also provides a few other useful hooks for specifically interacting with datacore utilities:

### `dc.useArray()`

Accepts a regular array, wraps it in a data array, executes a function on the data array, and then converts back to a normal array. This is primarily useful for when you want to take advantage of [Data Array](https://blacksmithgu.github.io/datacore/code-views/data-array) utilities while otherwise using vanilla javascript arrays for compatibility with preact/react.

```
return function View() {    const pages = dc.useQuery("@page and #book");    const grouped = dc.useArray(pages, array => array.groupBy(book => book.value("genre")));    return <dc.List rows={grouped} renderer={book => book.$link} />}
```

`dc.useArray` also accepts a dependency array if you depend on state other than the array itself:

```
const [searchTerm, setSearchTerm] = dc.useState("");const pages = dc.useQuery("@page and #book");const filteredPages = dc.useArray(    pages,    array => array.filter(book => book.$title.includes(searchTerm)),    [searchTerm]);
```

## Direct Queries

The datacore API also provides several methods for directly querying the index outside of a hook. These can be called from anywhere, but note that, because they are not hooks, they will _not_ cause your view to update if the query would update. To have your queries re-run every time the index changes, combine it with `dc.useIndexUpdates`, which will trigger a re-render on every vault change:

```
return function View() {    // Revision will update on every index update.    const revision = dc.useIndexUpdates();    // Run some complex query that will be re-run on every revision update.    const complexQuery = dc.useMemo(() => {        const thing = dc.query(/* ... */);        // ...    }, [revision]);}
```

### `dc.query()`

Execute a [query](https://blacksmithgu.github.io/datacore/data/query) against the datacore index, returning a list of all matched [results](https://blacksmithgu.github.io/datacore/data). Will raise an exception if the query is malformed.

```
dc.query("@page") => // list of all pagesdc.query("@page and #book and rating > 7") => // all pages tagged book with a rating higher than 7.
```

### `dc.tryQuery()`

Equivalent to `dc.query`, but returns a datacore `Result` instead of raising an exception.

```
dc.tryQuery("@page") => { successful: true, value: [/* list of pages */] }dc.tryQuery("fakefunction(@page)") => { successful: false, error: "malformed query..." }
```

### `dc.fullquery()`

Equivalent to `dc.query`, but returns several additional pieces of metadata about how long the query took to execute:

```
dc.fullquery("@page") => {    // Parsed query representation.    query: { type: "type", type: "page" },    // Actual results, like you would get from `dc.query`.    results: [/* list of pages */],    // Query runtime in seconds, accurate to the millisecond.    duration: 0.01,    // Index revision the query was executed against.    revision: 317,}
```

### `dc.tryFullQuery()`

Equivalent to `dc.fullquery`, but returns a datacore `Result` instead of raising an exception on an invalid query.

```
dc.tryFullQuery("@page") => {    successful: true,    value: {        // Parsed query representation.        query: { type: "type", type: "page" },        // Actual results, like you would get from `dc.query`.        results: [/* list of pages */],        // Query runtime in seconds, accurate to the millisecond.        duration: 0.01,        // Index revision the query was executed against.        revision: 317,    }}dc.tryFullQuery("malformed(@page)") => {    successful: false,    error: "malformed query ...",}
```

## Links

Utilities for creating datacore `Link` types and normalizing paths.

### `dc.resolvePath()`

Resolves a local or absolute path to an absolute path, optionally from a given source path.

```
// Can resolve by file name.dc.resolvePath("Test") = "location/To/Test.md"// Can resolve from an alternative source path, in case there are multiple `Test` files.dc.resolvePath("Test", "utils/Index.md") = "utils/Test.md"// If it cannot find the file, returns the input path unchanged.dc.resolvePath("noexist") = "noexist"
```

### `dc.fileLink()`

Create a datacore `Link` from a path to a file. The path can be local or absolute (though it is generally recommended to use absolute paths everywhere to avoid ambigious links). Datacore will render `Link` objects automatically as Obsidian links, and some APIs may require `Link` objects.

```
dc.fileLink("Test.md") = // Link object representing [[Test]].
```

### `dc.headerLink()`

Create a datacore `Link` pointing to a header in a file.

```
dc.headerLink("Terraria.md", "Review") = // equivalent to [[Terraria#Review]].
```

### `dc.blockLink()`

Create a datacore `Link` pointing to a specific block in a file. Note that blocks can only be linked to if they have a block ID - generally visible by looking for `^blockId` notation at the end of the block.

```
dc.blockLink("Daily Thoughts.md", "38ha12d") = // equivalent to [[Daily Thoughts#^38ha12d]]
```

### `dc.parseLink()`

Parses a full link into a datacore `Link`. Throws an error if the syntax is malformed.

```
dc.parseLink("[[Test]]") = // link representing [[Test]].dc.parseLink("[malformed]") = // throws an exception
```

### `dc.tryParseLink()`

Returns a datacore `Result` containing the result of trying to parse a string link.

```
dc.tryParseLink("[[Test]]") = // { successful: true, value: [[Test]] }dc.tryParseLink("[malformed]") = // { successful: false, error: "malformed input..." }
```

## Expressions

Methods for evaluating arbitrary datacore expressions, and returning their results.

### `dc.evaluate()`

Evaluates a datacore [expression](https://blacksmithgu.github.io/datacore/expressions), returning what it evaluates to. If the expression cannot be parsed or is invalid, will raise an exception. `dc.evaluate` accepts one, two, or three arguments:

```
// Single argument version takes only the expression.dc.evaluate("1 + 2") = 3// Two argument version allows you to provide variables.dc.evaluate("x + y", { x: 1, y: 2 }) = 3// Three argument version allows you to specify a source path to resolve// links from, if you don't want to use the current file.dc.evaluate("[[Test]].value", {}, "path/to/other/file.md") = // the value of property 'value' in [[Test]]
```

### `dc.tryEvaluate()`

Equivalent to `dc.evaluate()`, but returns a datacore `Result` type instead of just the value.

```
dc.tryEvaluate("1 + 2") = { value: 3, successful: true }dc.tryEvaluate("fakefunction(3)") = { successful: false, error: "unrecognized function..." }
```

## Type Coercion / Parsing

Parses

### `dc.coerce.string()`

Converts any other type to a string.

```
dc.coerce.string(16) = "16"dc.coerce.string(true) = "true"
```

### `dc.coerce.boolean()`

Parses `true` and `false` strings into booleans; returns undefined for most other types.

```
dc.coerce.boolean(true) = truedc.coerce.boolean("true") = truedc.coerce.boolean("blah") = undefined
```

### `dc.coerce.number()`

Parses strings into numbers; returns undefined for most other types.

```
dc.coerce.number(15) = 15dc.coerce.number("49.2") = 49.2dc.coerce.number("oof") = undefined
```

### `dc.coerce.date()`

Parses strings into dates; returns undefined for most other types.

```
dc.coerce.date("2025-05-10") = // <DateTime representing 2025-05-10>dc.coerce.date("2025-05-10T11:12:13") = // <DateTime representing 2025-05-10 at 11:12 (and 13 seconds)>dc.coerce.date("random text") = undefined
```

### `dc.coerce.duration()`

Parses strings into durations; returns undefined for most other types

```
dc.coerce.duration("14 hours") = // <Duration representing 14 hours>dc.coerce.duration("30m") = // <Duration representing 30 minutes>dc.coerce.duration("other text") = undefined
```

### `dc.coerce.link()`

Parses strings into links; returns undefined for most other types.

```
dc.coerce.link("[[Test]]") = // Link to 'Test'dc.coerce.link("![[Embed|Display]]") = // Embedded link to 'Embed' with display 'Display'.dc.coerce.link("oof") = undefined
```

### `dc.coerce.array()`

If the input is an array, returns that array unchanged; otherwise, wraps the value in an array.

```
dc.coerce.array([1, 2]) = [1, 2]dc.coerce.array(1) = [1]
```




# List Views (dc.List)

List views, available as `dc.List`, generate pageable lists of results. They support grouping, heirarchies, paging, and several view modes. They come in three varieties:

- **Unordered** (`unordered`): A bullet-point style list.
- **Ordered** (`ordered`): A numbered list of items.
- **Block**: (`block`): A list with no additional formatting - just shows elements in a vertical list of 'blocks'.

## Quickstart

Most common usages of lists will use `rows` and `renderer`:

```
return function View() {    // Start by fetching your data via a query.    const data = dc.useQuery("#book and @page");    // Pass the full data to `rows`, and specify what to show in the list via `renderer`:    return <dc.List rows={data} renderer={book => book.$link} />;}
```

Lists are also commonly used for rendering embeds:

```
return function View() {    const data = dc.useQuery("#important-note and @block");    // Uses `dc.embed` to render an embed of all of the given blocks, with paging for performnace.    return <dc.List rows={data} paging={true} renderer={dc.embed} />;}
```

For the full set of available options, read on.

## Basic Usage (`rows`)

The list view is available in the local API as `dc.List`; it at a minimum requires a list of elements to show (`rows`):

```
const ITEMS = ["First", "Second", "Third"];return function View() {    return <dc.List rows={ITEMS} />;}
```

Which will produce a simple list like so:

- First
- Second
- Third

## List Types (`type`)

You can control which of the list types you want via the `type` property.

```
const ITEMS = ["First", "Second", "Third"];return function View() {    return <dc.List type="ordered" rows={ITEMS} />;}
```

The three options available are:

- **Unordered** (`unordered`): A bullet-point style list. This is the default.
- **Ordered** (`ordered`): A numbered list of items. Numbering starts at 1 and increments.
- **Block**: (`block`): A list with no additional formatting - just shows elements in a vertical list of 'blocks'.
    - Block formatting is best for embeds or other use cases where you do not want visible formatting from a regular list.

## Specifying How To Render Data (`renderer`)

When working with queries and any other non-trivial object, you will likely want to specify exactly what to render and how. This can be done via the `renderer` prop, which accepts a function that maps each row to the value or JSX to render.

```
return function View() {    // This will give back a set of MarkdownPage objects, which are not useful to render on their own.    const books = dc.useQuery("#book and @page");    // Render books by rendering their links.    return <dc.List rows={books} renderer={book => book.$link} />;}
```

Some built-in rendering functions already exist, such as `dc.embed`, which renders embeds of files automatically:

```
return function View() {    // Fetch all blocks referencing a specific tag.    const notes = dc.useQuery("#life-notes and @block");    // Render the notes as embeds in block format for minimal formatting.    return <dc.List type="block" rows={notes} renderer={dc.embed} />;}
```

## Paging (`paging`)

You can add paging to any list using the `paging` prop, which accepts several options.

```
// Explicitly disable paging.<dc.List paging={false} ... />// Enable paging, with the page size equal to your default page size in the Datacore settings.<dc.List paging={true} ... />// Enable paging with the specific page size.<dc.List paging={10} ... />
```

If `paging` is not specified, it defaults to whatever your default paging configuration is in the Datacore settings.

### Scroll on Page (`scrollOnPaging`)

By default, changing the page will retain the current scroll position, meaning you will continue to look at your current page position when you change pages. For large pages, this can mean needing to manually scroll back to the top of the table after each page; this can instead happen automatically by setting `scrollOnPaging`:

```
// Always scroll to the top of the view when the page changes.<dc.List scrollOnPaging={true} ... />// Only scroll to the top of the page if the old page had at least 10 entries.<dc.List scrollOnPaging={10} ... />
```

## Grouping (`groupings`)

List views automatically support rendering grouped data; grouped data can be created most easily using [Data Array](https://blacksmithgu.github.io/datacore/code-views/data-array) syntax.

```
return function View() {    // Fetch all books and then group them by genre.    const books = dc.useQuery("#book and @page");    const booksByGenre = dc.useArray(books, array => array.groupBy(book => book.value("genre")));    // No extra configuration is required by default to show groups.    return <dc.List rows={booksByGenre} renderer={book => book.$link} />;}
```

By default, grouped data will render the grouping headers using the default text renderer. If you'd like to add embellishments, such as converting each of the 'genres' in the above examples into links, you can use the `groupings` prop:

```
return function View() {    // Fetch all books and then group them by genre.    const books = dc.useQuery("#book and @page");    const booksByGenre = dc.useArray(books, array => array.groupBy(book => book.value("genre")));    // Render each grouping key as a file link instead of just text.    return <dc.List rows={booksByGenre} renderer={book => book.$link} groupings={(key) => dc.fileLink(key)} />;}
```

You can also choose to construct an explicit `GroupingConfig` instead of passing a function:

```
const LINK_GROUPING = {    render: (key, rows) => dc.fileLink(key)};return function View() {    // Fetch all books and then group them by genre.    const books = dc.useQuery("#book and @page");    const booksByGenre = dc.useArray(books, array => array.groupBy(book => book.value("genre")));    // Render each grouping key as a file link instead of just text.    return <dc.List rows={booksByGenre} renderer={book => book.$link} groupings={LINK_GROUPING} />;}
```

If you group multiple times, you can specify a separate rendering for each grouping level by passing an array of grouping configurations to `groupings`.

## Heirarchies (`childSource` / `maxChildDepth`)

Lists can recursively contain sublists to create full heirarchies of entries. By default, datacore will look for the `$children` and `children` properties on rows to determine sublists to render. For example, this will produce a nested list of two top level items (`Hello` and `Goodbye`), each with three subitems.

```
const DATA = [    {        title: "Hello",        children: [            { title: "One" },            { title: "Two" },            { title: "Three" }        ]    },    {        title: "Goodbye",        children: [            { title: "Four" },            { title: "Five" },            { title: "Six" }        ]    }];return function View() {    return <dc.List rows={DATA} renderer={item => item.title} />;}
```

If you want to use another field instead, you can override the `childSource` property to provide either a different property, list of properties, or even an arbitrary function:

```
return function View() {    // Provide an alternative property to use.    return <dc.List rows={...} childSource={"items"} ... />;    // Provide a list of alternative properties.    return <dc.List rows={...} childSource={["items", "things"]} ... />;    // Provide an arbitrary function.    return <dc.List rows={...} childSource={item => item.value("doodads")} ... />;}
```

You can also control the maximum depth of children to show via `maxChildDepth`; this defaults to a small constant (less than 20) by default.

```
return function View() {    // Show only at most two levels of children.    return <dc.List rows={...} childSource={"items"} maxChildDepth={2} ... />;}
```

Children and grouping can be combined to create very interesting views, such as this one which dynamically generates a list of books as well as all pages/sections immediately linking to that book:

```
// Finds all things linked to book that themselves can be linked to.function findLinked(book) {	return dc.query(`[[${book.$path}]] and $types.econtains("linkable")`);}return function View() {    // Groups both by     const books = dc.useQuery("@page and #book");    const groupedBooks = dc.useArray(books, array => array.groupBy(book => book.value("genre") ?? "No Genre"));    return <dc.List rows={groupedBooks} renderer={(book) => book.$link} maxChildDepth={1} childSource={findLinked} />;}
```

## Full Reference

The full set of available properties is provided below:

```
export interface ListState<T> {    /**     * Whether the list should be ordered, unordered, or block.     *     * Block lists do not use an actual list element and instead just render a series of contiguous     * div elements with no other annotations.     */    type?: "ordered" | "unordered" | "block";    /** The full collection of elements in the list. */    rows: Grouping<T>;    /** Allows for grouping header lines to be overridden with custom rendering/logic. */    groupings?: GroupingConfig<T> | GroupingConfig<T>[] | ((key: Literal, rows: Grouping<T>) => Literal | VNode);    /**     * Custom render function to use for rendering each leaf element. Can produce either JSX or a plain value which will be     * rendered as a literal.     */    renderer?: (row: T) => React.ReactNode | Literal;    /** Controls whether paging is enabled for this element. If true, uses default page size. If a number, paging is enabled with the given page size. */    paging?: boolean | number;    /**     * Whether the view will scroll to the top automatically on page changes. If true, will always scroll on page changes.     * If a number, will scroll only if the number is greater than the current page size.     **/    scrollOnPaging?: boolean | number;    /** Maximum level of children that will be rendered; a level of 0 means no children expansion will occur. */    maxChildDepth?: number;    /**     * Property name, list of property names, or function to be applied to obtain children for a given entry.     * Defaults to the `$children` and `children` props.     *     * If null, child extraction is disabled and no children will be fetched. If undefined, uses the default.     */    childSource?: null | string | string[] | ((row: T) => T[]);}export interface GroupingConfig<T> {    /** How a grouping with the given key and set of rows should be rendered. */    render?: (key: Literal, rows: Grouping<T>) => Literal | VNode;}
```




# Table Views (dc.Table)

Table views, available as `dc.Table`, make two dimensional tables of results. They support grouping, paging, as well as some custom styling.

## Basic Usage (`rows` and `columns`)

Tables at a minimum need some data to show (`rows`), and the list of columns to display (`columns`). Each column requires at a minimum a unique `id` and `value` - for example:

```
const COLUMNS = [    {        // A unique ID which identifies this specific column.        id: "link",        // The value to show in the column.        value: (row) => row.$link    },    { id: "Rating", value: (row) => row.value("rating") },    { id: "Genre", value: (row) => row.value("genre") }]return function View() {    // Start by fetching your data via a query.    const data = dc.useQuery("#book and @page");    // Pass the full data to `rows`, along with your columns.    return <dc.Table rows={data} columns={COLUMNS} />;}
```

## Columns

Each table column, at a minimum, requires a unique `id` field and a `value` function which extracts the value to actually show in the table. For example, a column which displays the genre of a row may look like:

```
{    id: "Genre",    value: (row) => row.value("genre")}
```

The `id` of a column must be a simple string; the `value` must be a simple javascript object/primitive and should not contain any React or JSX.

### Cell Rendering (`render`)

If you do want to add special JSX or interactivity to a column, you can do so via the `render` prop:

```
{    id: "Genre",    value: (row) => row.value("genre"),    // Render accepts the column value and (optionally) the full row; it can produce arbitrary    // renderable values or JSX.    render: (value, row) => dc.fileLink(value)}
```

### Title Rendering (`title`)

Columns will use the `id` field as the column name by default; if you want an alternative name or would like to add JSX to the title field, you can overwrite the `title` property:

```
{    id: "Genre",    // You can use arbitrary JSX for the title; you can also just use another string if desired.    title: (        <h1>Genre!</h1>    )    value: (row) => row.value("genre"),}
```

### Column Width (`width`)

Columns use the default HTML sizing algorithm by default, which assigns more width to columns that have more content in them. This tends to be an acceptable default, but you can override it if you want more consistency or customization in your table layout. Column width can be configured by overriding the `width` property:

```
{    id: "Genre",    width: "50%",    value: (row) => row.value("genre"),}
```

Columns have a few configuration options:

- **Fixed Values**: You can give fixed pixel sizes to a column by setting it's width to a number of pixels, such as `500px` or `200px`.
- **Percentages**: You can allocate a certain percent of the whole table to a column using percentages, such as `50%` or `70%`.
- **Maximum/Minimum**: You can allocate as much space as possible using `maximum`, and as little space as possible using `minimum`. These options will generally reduce the column to be exactly big enough to store the column and no more; in some cases, it may introduce wrapping in the current column or in other columns.

## Paging (`paging` / `scrollOnPaging`)

You can add paging to any table using the `paging` prop, which accepts several options.

```
// Explicitly disable paging.<dc.Table paging={false} ... />// Enable paging, with the page size equal to your default page size in the Datacore settings.<dc.Table paging={true} ... />// Enable paging with the specific page size.<dc.Table paging={10} ... />
```

If `paging` is not specified, it defaults to whatever your default paging configuration is in the Datacore settings.

### Scroll on Page (`scrollOnPaging`)

By default, changing the page will retain the current scroll position, meaning you will continue to look at your current page position when you change pages. For large pages, this can mean needing to manually scroll back to the top of the table after each page; this can instead happen automatically by setting `scrollOnPaging`:

```
// Always scroll to the top of the view when the page changes.<dc.Table scrollOnPaging={true} ... />// Only scroll to the top of the page if the old page had at least 10 entries.<dc.Table scrollOnPaging={10} ... />
```

## Grouping (`groupings`)

Table views automatically support rendering grouped data; grouped data can be created most easily using [Data Array](https://blacksmithgu.github.io/datacore/code-views/data-array) syntax.

```
const COLUMNS = [    { id: "link", value: (row) => row.$link },    { id: "Rating", value: (row) => row.value("rating") },    { id: "Genre", value: (row) => row.value("genre") }]return function View() {    // Fetch all books and then group them by genre.    const books = dc.useQuery("#book and @page");    const booksByGenre = dc.useArray(books, array => array.groupBy(book => book.value("genre")));    // No extra configuration is required by default to show groups.    return <dc.Table rows={booksByGenre} columns={COLUMNS} />;}
```

By default, grouped data will render the grouping headers using the default text renderer. If you'd like to add embellishments, such as converting each of the 'genres' in the above examples into links, you can use the `groupings` prop:

```
const COLUMNS = [    { id: "link", value: (row) => row.$link },    { id: "Rating", value: (row) => row.value("rating") },    { id: "Genre", value: (row) => row.value("genre") }]return function View() {    // Fetch all books and then group them by genre.    const books = dc.useQuery("#book and @page");    const booksByGenre = dc.useArray(books, array => array.groupBy(book => book.value("genre")));    // Assigns `groupings` to render the grouping headers using custom logic.    return <dc.Table rows={booksByGenre} columns={COLUMNS} groupings={(key) => dc.fileLink(key)} />;}
```

You can also choose to construct an explicit `GroupingConfig` instead of passing a function:

```
const LINK_GROUPING = {    render: (key, rows) => dc.fileLink(key)};const COLUMNS = [    { id: "link", value: (row) => row.$link },    { id: "Rating", value: (row) => row.value("rating") },    { id: "Genre", value: (row) => row.value("genre") }]return function View() {    // Fetch all books and then group them by genre.    const books = dc.useQuery("#book and @page");    const booksByGenre = dc.useArray(books, array => array.groupBy(book => book.value("genre")));    // Assigns `groupings` to render the grouping headers using custom logic.    return <dc.Table rows={booksByGenre} columns={COLUMNS} groupings={LINK_GROUPING} />;}
```

If you group multiple times, you can specify a separate rendering for each grouping level by passing an array of grouping configurations to `groupings`.

## Full Reference

The full set of available properties is provided below:

```
export interface TableViewProps<T> {    /** The columns to render in the table. */    columns: TableColumn<T>[];    /** The rows to render; may potentially be grouped or just a plain array. */    rows: Grouping<T>;    /** Allows for grouping header columns to be overridden with custom rendering/logic. */    groupings?: GroupingConfig<T> | GroupingConfig<T>[] | ((key: Literal, rows: Grouping<T>) => Literal | ReactNode);    /**     * If set to a boolean - enables or disables paging.     * If set to a number, paging will be enabled with the given number of rows per page.     */    paging?: boolean | number;    /**     * Whether the view will scroll to the top automatically on page changes. If true, will always scroll on page changes.     * If a number, will scroll only if the number is greater than the current page size.     **/    scrollOnPaging?: boolean | number;}export interface TableColumn<T, V = Literal> {    /** The unique ID of this table column; you cannot have multiple columns with the same ID in a given table. */    id: string;    /** The title which will display at the top of the column if present. */    title?: string | ReactNode | (() => string | ReactNode);    /** If present, the CSS width to apply to the column. 'minimum' will set the column size to it's smallest possible value, while 'maximum' will do the opposite. */    width?: "minimum" | "maximum" | string;    /** Value function which maps the row to the value being rendered. */    value: (object: T) => V;    /** Called to render the given column value. Can depend on both the specific value and the row object. */    render?: (value: V, object: T) => Literal | ReactNode;}export interface GroupingConfig<T> {    /** How a grouping with the given key and set of rows should be handled. */    render?: (key: Literal, rows: Grouping<T>) => Literal | ReactNode;}
```


# Data Arrays

To make common data manipulation operations simple, datacore provides the `DataArray` abstraction, which is a [proxied](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) wrapper around a regular list with a large set of additional functions.

## Creation

Data arrays are mainly present in two places.

### Via `dc.useArray`

The most common route for using data arrays is the `dc.useArray` hook, which takes in a regular array of data, converts it to a data array, performs operations on it, and then converts it back to a regular array:

```
return function View() {    // Start with some data you want to process...    const books = dc.useQuery("#books and @page");    // Use `dc.useArray` to get a data array for processing.    const groupedBooks = dc.useArray(books, array =>        array.sort(book => book.$name)             .groupBy(book => book.value("genre")));    // Then render it.    return <dc.List rows={groupedBooks} />;}
```

### Via `dc.array`

You can also directly make `DataArray`s via the utility function `dc.array(data)`, which accepts a regular array as input and produces a data array.

```
return function View() {    // da is a `DataArray`.    const da = dc.array([1, 2, 3]);    // da2 is still a `DataArray`.    const da2 = da.map(x => x + 4).limit(2);    // To get a regular array back, use `.array()`.    const data = da2.array();}
```

## Indexing and Swizzling

Data arrays support regular indexing just like normal arrays (like `array[0]`), but importantly, they also support query-language-style "swizzling": if you index into a data array with a field name (like `array.field`), it automatically maps every element in the array to `field`, flattening `field` if it itself is also an array.

```
const data = dc.array(dc.query("#books and @page"));data.$name // => List of all book names.data.$ctime // => List of all book created times.
```

## Raw Interface

The full interface for the data array implementation is provided below for reference:

```
/** A function which maps an array element to some value. */export type ArrayFunc<T, O> = (elem: T, index: number, arr: T[]) => O;/** A function which compares two types. */export type ArrayComparator<T> = (a: T, b: T) => number;/** * Proxied interface which allows manipulating array-based data. All functions on a data array produce a NEW array * (i.e., the arrays are immutable). */export interface DataArray<T> {    /** The total number of elements in the array. */    length: number;    /** Filter the data array down to just elements which match the given predicate. */    where(predicate: ArrayFunc<T, boolean>): DataArray<T>;    /** Alias for 'where' for people who want array semantics. */    filter(predicate: ArrayFunc<T, boolean>): DataArray<T>;    /** Map elements in the data array by applying a function to each. */    map<U>(f: ArrayFunc<T, U>): DataArray<U>;    /** Map elements in the data array by applying a function to each, then flatten the results to produce a new array. */    flatMap<U>(f: ArrayFunc<T, U[]>): DataArray<U>;    /** Mutably change each value in the array, returning the same array which you can further chain off of. */    mutate(f: ArrayFunc<T, any>): DataArray<any>;    /** Limit the total number of entries in the array to the given value. */    limit(count: number): DataArray<T>;    /**     * Take a slice of the array. If `start` is undefined, it is assumed to be 0; if `end` is undefined, it is assumed     * to be the end of the array.     */    slice(start?: number, end?: number): DataArray<T>;    /** Concatenate the values in this data array with those of another iterable / data array / array. */    concat(other: Iterable<T>): DataArray<T>;    /** Return the first index of the given (optionally starting the search) */    indexOf(element: T, fromIndex?: number): number;    /** Return the first element that satisfies the given predicate. */    find(pred: ArrayFunc<T, boolean>): T | undefined;    /** Find the index of the first element that satisfies the given predicate. Returns -1 if nothing was found. */    findIndex(pred: ArrayFunc<T, boolean>, fromIndex?: number): number;    /** Returns true if the array contains the given element, and false otherwise. */    includes(element: T): boolean;    /**     * Return a string obtained by converting each element in the array to a string, and joining it with the     * given separator (which defaults to ', ').     */    join(sep?: string): string;    /**     * Return a sorted array sorted by the given key; an optional comparator can be provided, which will     * be used to compare the keys in leiu of the default dataview comparator.     */    sort<U>(key: ArrayFunc<T, U>, direction?: "asc" | "desc", comparator?: ArrayComparator<U>): DataArray<T>;    /**     * Return an array where elements are grouped by the given key; the resulting array will have objects of the form     * { key: <key value>, rows: DataArray }.     */    groupBy<U>(key: ArrayFunc<T, U>, comparator?: ArrayComparator<U>): DataArray<{ key: U; rows: DataArray<T> }>;    /**     * Return distinct entries. If a key is provided, then rows with distinct keys are returned.     */    distinct<U>(key?: ArrayFunc<T, U>, comparator?: ArrayComparator<U>): DataArray<T>;    /** Return true if the predicate is true for all values. */    every(f: ArrayFunc<T, boolean>): boolean;    /** Return true if the predicate is true for at least one value. */    some(f: ArrayFunc<T, boolean>): boolean;    /** Return true if the predicate is FALSE for all values. */    none(f: ArrayFunc<T, boolean>): boolean;    /** Return the first element in the data array. Returns undefined if the array is empty. */    first(): T;    /** Return the last element in the data array. Returns undefined if the array is empty. */    last(): T;    /** Map every element in this data array to the given key, and then flatten it.*/    to(key: string): DataArray<any>;    /**     * Recursively expand the given key, flattening a tree structure based on the key into a flat array. Useful for handling     * hierarchical data like tasks with 'subtasks'.     */    expand(key: string): DataArray<any>;    /** Run a lambda on each element in the array. */    forEach(f: ArrayFunc<T, void>): void;    /** Convert this to a plain javascript array. */    array(): T[];    /** Allow iterating directly over the array. */    [Symbol.iterator](): Iterator<T>;    /** Map indexes to values. */    [index: number]: any;    /** Automatic flattening of fields. Equivalent to implicitly calling `array.to("field")` */    [field: string]: any;}
```



# Expressions

Datacore has an internal "expression language", which can be used essentially as a simple scripting language in various parts of Datacore. The most common use cases is in [queries](https://blacksmithgu.github.io/datacore/data), for filtering down to a desired set of pages, though they can also be used via the [Javascript View API](https://blacksmithgu.github.io/datacore/code-views) and will be used in the upcoming YAML-based view format.

Datacore expressions vaguely resemble Javascript, with some special syntax considerations for dates, durations, and links. A reference table of all of the available operations is [below](https://blacksmithgu.github.io/datacore/expressions#syntax-reference).

## Syntax Reference

```
// Literals1                   (number)true/false          (boolean)"text"              (text)date(2021-04-18)    (date)dur(1 day)          (duration)[[Link]]            (link)[1, 2, 3]           (list){ a: 1, b: 2 }      (object)// Lambdas(x1, x2) => ...     (lambda)// Referencesfield               (directly refer to a field)simple-field        (refer to fields with spaces/punctuation in them like "Simple Field!")a.b                 (if a is an object, retrieve field named 'b')a[expr]             (if a is an object or array, retrieve field with name specified by expression 'expr')f(a, b, ...)        (call a function called `f` on arguments a, b, ...)a.f(b, c, ...)      (postfix function syntax; equivalent to f(a, b, c, ...))// Arithmetica + b               (addition)a - b               (subtraction)a * b               (multiplication)a / b               (division)a % b               (modulo / remainder of division)// Comparisona > b               (check if a is greater than b)a < b               (check if a is less than b)a = b               (check if a equals b)a != b              (check if a does not equal b)a <= b              (check if a is less than or equal to b)a >= b              (check if a is greater than or equal to b)// Stringsa + b               (string concatenation)a * num             (repeat string <num> times)// Special Operations[[Link]].value      (fetch `value` from page `Link`)
```



# Functions

Datacore comes with a default set of functions, which can be used in expressions for various purposes.

## Usage

To use a function in an expression, simply use it's name and provide a list of arguments:

```
func(argument1, argument2, argument3)// i.e.,:lower("YES")  // -> "yes"replace("yes", "e", "a")  // -> "yas"
```

Datacore also supports 'postfix' function calling style, allowing you to chain them instead. When using postfix function style, the object you are calling the function on implicitly becomes the first argument:

```
"YES".lower() // Same as lower("YES")"YES".lower().replace("e", "a") // Same as replace(lower("YES"), "e", "a")
```

Datacore functions support "vectorization", meaning you can also replace any argument with a _list_ of arguments instead; the function will return a list of results instead of a single value:

```
lower(["YES", "NO"]) // -> ["yes", "no"]["YES", "NO"].lower() // vectorization + postfix calling style.
```

## Constructors

Constructors which create values.

### `object(key1, value1, ...)`

Creates a new object with the given keys and values. Keys and values should alternate in the call, and keys should always be strings/text.

```
object() => empty objectobject("a", 6) => object which maps "a" to 6object("a", 4, "c", "yes") => object which maps a to 4, and c to "yes"
```

Objects can also be created using object literal syntax, which is usually preferred:

```
{} => // empty object{ a: 6 } // object which maps "a" to 6{ a: 4, c: "yes" } // a => 4, and c => "yes"
```

### `list(value1, value2, ...)`

Creates a new list with the given values in it. `array` can be used an alias for `list`.

```
list() => empty listlist(1, 2, 3) => list with 1, 2, and 3array("a", "b", "c") => list with "a", "b", and "c"
```

Note that you can also make lists directly with list syntax, which is generally preferred:

```
[] // => empty list[1, 2, 3] // => list with 1, 2, and 3
```

### `date(any)`

Parses a date from the provided string, date, or link object, if possible, returning null otherwise.

```
date("2020-04-18") // = <date object representing April 18th, 2020>date([[2021-04-16]]) // = <date object for the given page, referring to file.day>// Postfix style:"2020-04-18".date()
```

### `date(text, format)`

Parses a date from text to luxon `DateTime` with the specified format. Note localized formats might not work. Uses [Luxon tokens](https://moment.github.io/luxon/#/formatting?id=table-of-tokens).

```
date("12/31/2022", "MM/dd/yyyy") => DateTime for December 31th, 2022date("210313", "yyMMdd") => DateTime for March 13th, 2021date("946778645000", "x") => DateTime for "2000-01-02T03:04:05"// Postfix style:"210313".date("yyMMdd") = DateTime for March 13th, 2021
```

### `dur(any)`

Parses a duration from the provided string or duration, returning null on failure.

```
dur(8 minutes) = <8 minutes>dur("8 minutes, 4 seconds") = <8 minutes, 4 seconds>dur(dur(8 minutes)) = dur(8 minutes) = <8 minutes>// Postfix style:"8 minutes, 4 seconds".dur() = <8 minutes, 4 seconds>
```

### `number(string)`

Pulls the first number out of the given string, returning it if possible. Returns null if there are no numbers in the string.

```
number("18 years") = 18number(34) = 34number("hmm") = null// Postfix style."18 years".number() = 18
```

### `string(any)`

Converts any value into a "reasonable" string representation. This sometimes produces less pretty results than just directly using the value in a query - it is mostly useful for coercing dates, durations, numbers, and so on into strings for manipulation.

```
string(18) = "18"string(dur(8 hours)) = "8 hours"string(date(2021-08-15)) = "August 15th, 2021"// Postfix style:18.string() = "18"
```

### `link(path, [display])`

Construct a link object from the given file path or name. If provided with two arguments, the second argument is the display name for the link.

```
link("Hello") // => link to page named 'Hello'link("Hello", "Goodbye") // => link to page named 'Hello', displays as 'Goodbye'// Postfix style:"Hello".link() // => link to page named 'Hello'
```

### `embed(link, [embed?])`

Convert a link object into an embedded link; practically speaking, this affects how Datacore will try to render the link in various views. Embedded links will be rendered as an Obsidian embed where possible, where as unembedded link just render as a clickable, textual link.

```
embed(link("Hello.png")) => embedded link to the "Hello.png" image, which will render as an actual image.// Postfix style:link("Hello.png").embed()
```

### `elink(url, [display])`

Construct a link to an external url (like `www.google.com`). If provided with two arguments, the second argument is the display name for the link.

```
elink("www.google.com") => link element to google.comelink("www.google.com", "Google") => link element to google.com, displays as "Google"// Postfix style:"www.google.com".elink()
```

### `typeof(any)`

Get the type of any object for inspection. Can be used in conjunction with other operators to change behavior based on type.

```
typeof(8) => "number"typeof("text") => "string"typeof([1, 2, 3]) => "array"typeof({ a: 1, b: 2 }) => "object"typeof(date(2020-01-01)) => "date"typeof(dur(8 minutes)) => "duration"
```

---

## Numeric Operations

### `round(number, [digits])`

Round a number to a given number of digits. If the second argument is not specified, rounds to the nearest whole number; otherwise, rounds to the given number of digits.

```
round(16.555555) = 17round(16.555555, 2) = 16.56
```

### `trunc(number)`

Truncates ("cuts off") the decimal point from a number.

```
trunc(12.937) = 12trunc(-93.33333) = -93trunc(-0.837764) = 0
```

### `floor(number)`

Always rounds down and returns the largest integer less than or equal to a given number. This means that negative numbers become more negative.

```
floor(12.937) = 12floor(-93.33333) = -94floor(-0.837764) = -1
```

### `ceil(number)`

Always rounds up and returns the smallest integer greater than or equal to a given number. This means negative numbers become less negative.

```
ceil(12.937) = 13ceil(-93.33333) = -93ceil(-0.837764) = 0
```

### `min(a, b, ..)`

Compute the minimum value of a list of arguments, or an array.

```
min(1, 2, 3) = 1min([1, 2, 3]) = 1min("a", "ab", "abc") = "a"
```

### `max(a, b, ...)`

Compute the maximum value of a list of arguments, or an array.

```
max(1, 2, 3) = 3max([1, 2, 3]) = 3max("a", "ab", "abc") = "abc"
```

### `sum(array)`

Sums all numeric values in the array. If you have null values in your sum, you can eliminate them via the `nonnull` function.

```
sum([1, 2, 3]) = 6sum([]) = nullsum(nonnull([null, 1, 8])) = 9// Postfix style:[1, 2, 3].sum() = 6
```

### `product(array)`

Calculates the product of a list of numbers. If you have null values in your average, you can eliminate them via the `nonnull` function.

```
product([1,2,3]) = 6product([]) = nullproduct(nonnull([null, 1, 2, 4])) = 8// Postfix style:[1, 2, 3].product() = 6
```

### `reduce(array, operand)`

A generic function to reduce a list into a single value, valid operands are `"+"`, `"-"`, `"*"`, `"/"` and the boolean operands `"&"` and `"|"`. Note that using `"+"` and `"*"` equals the `sum()` and `product()` functions, and using `"&"` and `"|"` matches `all()` and `any()`.

```
reduce([100, 20, 3], "-") = 77reduce([200, 10, 2], "/") = 10reduce(values, "*") = Multiplies every element of values, same as product(values)reduce(values, this.operand) = Applies the local field operand to each of the valuesreduce(["⭐", 3], "*") = "⭐⭐⭐", same as "⭐" * 3reduce([1]), "+") = 1, has the side effect of reducing the list into a single element// Postfix style.[1].reduce("+")
```

Reduce can also take a lambda function, which it will apply element by element, left to right:

```
reduce([100, 20, 3], (accum, curr) => accum * curr) = 6000 // multiplies elements.// Postfix style.[100, 200, 300, 100].reduce((accum, curr) => max(accum, curr)) = 300 // max of an array via reduce.
```

### `average(array)`

Computes the numeric average of numeric values. If you have null values in your average, you can eliminate them via the `nonnull` function.

```
average([1, 2, 3]) = 2average([]) = nullaverage(nonnull([null, 1, 2])) = 1.5// Postfix style.[1, 2, 3].average() = 2
```

### `minby(array, function)`

Compute the minimum value of an array, using the provided function.

```
minby([1, 2, 3], (k) => k) = 1minby([1, 2, 3], (k) => 0 - k) => 3minby(this.file.tasks, (k) => k.due) => (earliest due)// Postfix style.this.file.tasks.minby((k) => k.due) => (earliest due)
```

### `maxby(array, function)`

Compute the maximum value of an array, using the provided function.

```
maxby([1, 2, 3], (k) => k) = 3maxby([1, 2, 3], (k) => 0 - k) => 1maxby(this.file.tasks, (k) => k.due) => (latest due)// Postfix style.this.file.tasks.maxby((k) => k.due) => (latest due)
```

--

## Objects, Arrays, and String Operations

Operations that manipulate values inside of container objects.

### `contains()` and friends

There are three distinct variants of `contains`, whose behavior mostly matters on how they treat strings and lists.

#### `contains(object|list|string, value)`

Checks if the given container type has the given value in it. This function behave slightly differently based on whether the first argument is an object, a list, or a string. This function is case-sensitive.

- For objects, checks if the object has a key with the given name. For example,
    
    ```
    file.contains("$ctime") = truefile.contains("day") = true (if file has a 'date' field, false otherwise)
    ```
    
- For lists, checks if any of the array elements equals the given value. For example,
    
    ```
    [1, 2, 3].contains(3) = true[].contains(1) = false```js
    ```
    
- For strings, checks if the given value is a substring (i.e., inside) the string.
    
    ```
    "hello".contains("lo") = true"yes".contains("no") = false
    ```
    

#### `icontains(object|list|string, value)`

Case insensitive version of `contains()`.

#### `econtains(object|list|string, value)`

"Exact contains" checks if the exact match is found in the string/list. This function is case sensitive.

- For strings, it behaves exactly like [`contains()`](https://blacksmithgu.github.io/datacore/expressions/functions#containsobjectliststring-value).
    
    ```
    "Hello".econtains("Lo") = false"Hello".econtains("lo") = true
    ```
    
- For lists, it checks if the exact word is in the list.
    
    ```
    ["These", "are", "words"].econtains("word") = false["These", "are", "words"].econtains("words") = true
    ```
    
- For objects, it checks if the exact key name is present in the object. It does **not** do recursive checks.
    
    ```
    {key:"value", pairs:"here"}.econtains("here") = false:key:"value", pairs:"here"}.econtains("key") = true{key:"value", recur:{recurkey: "val"}}.econtains("value") = false{key:"value", recur:{recurkey: "val"}}.econtains("Recur") = false{key:"value", recur:{recurkey: "val"}}.econtains("recurkey") = false
    ```
    

### `containsword(list|string, value)`

Checks if `value` has an exact word match in a string.

```
"word".containsword("word") = true"word".containsword("Word") = true"words".containsword("Word") = false"Hello there!".containsword("hello") = true"Hello there!".containsword("HeLLo") = true"Hello there chaps!".containsword("chap") = false"Hello there chaps!".containsword("chaps") = true
```

Note that `containsword` does not work directly on lists - passing a list argument will apply the functiont to each element in the list:

```
["hello", "hello there", "no"].containsword("hello") = [true, true, false]
```

If you want to look for a word in any element in the list, combine `containsword` with `any`:

```
["hello", "hello there", "no"].containsword("hello").any() = true
```

### `extract(object, key1, key2, ...)`

Pulls multiple fields out of an object, creating a new object with just those fields.

```
extract(file, "$ctime", "$mtime") = { "$ctime": file.ctime, "$mtime": file.mtime }// Postfix style.file.extract("$ctime", "$mtime") = { "$ctime": file.ctime, "$mtime": file.mtime }
```

### `sort(list)`

Sorts a list, returning a new list in sorted order.

```
sort([3, 2, 1]) = [1, 2, 3]sort(["a", "b", "aa"]) = ["a", "b", "aa"]// Postfix style.["a", "b", "aa"].sort() = ["a", "b", "aa"]
```

### `reverse(list)`

Reverses a list, returning a new list in reversed order.

```
reverse([1, 2, 3]) = [3, 2, 1]reverse(["a", "b", "c"]) = ["c", "b", "a"]// Postfix style.["a", "b", "c"].reverse() = ["c", "b", "a"]
```

### `length(object|array)`

Returns the number of fields in an object, or the number of entries in an array.

```
length([]) = 0length([1, 2, 3]) = 3length({"hello": 1, "goodbye": 2}) = 2// Postfix style.[1, 2, 3].length() = 3
```

### `nonnull(array)`

Return a new array with all null values removed.

```
nonnull([]) = []nonnull([null, false]) = [false]nonnull([1, 2, 3]) = [1, 2, 3]// Postfix style.[null, false].nonnull() = [false]
```

### `all(array)`

Returns `true` only if ALL values in the array are truthy. You can also pass multiple arguments to this function, in which case it returns `true` only if all arguments are truthy.

```
all([1, 2, 3]) = trueall([true, false]) = falseall(true, false) = falseall(true, true, true) = true// Postfix style.[true, true, true].all() = true
```

You can pass a function as second argument to return only true if all elements in the array matches the predicate.

```
all([1, 2, 3], (x) => x > 0) = trueall([1, 2, 3], (x) => x > 1) = falseall(["apple", "pie", 3], (x) => typeof(x) = "string") = false// Postfix style.["apple", "pie", 3].all((x) => typeof(x) = "string") = false
```

### `any(array)`

Returns `true` if ANY of the values in the array are truthy. You can also pass multiple arguments to this function, in which case it returns `true` if any of the arguments are truthy.

```
any([1, 2, 3]) = trueany([true, false]) = trueany([false, false, false]) = falseany(true, false) = trueany(false, false) = false// Postfix style.[true, false].any() = true
```

You can pass a function as second argument to return only true if any element in the array matches the predicate.

```
any([1, 2, 3], (x) => x > 2) = trueany([1, 2, 3], (x) => x = 0) = false// Postfix style.[1, 2, 3].any((x) => x = 0) = false
```

### `none(array)`

Returns `true` if NONE of the values in the array are truthy.

```
none([]) = truenone([false, false]) = truenone([false, true]) = falsenone([1, 2, 3]) = false// Postfix style.[1, 2, 3].none() = false
```

You can pass a function as second argument to return only true if none of the elements in the array matches the predicate.

```
none([1, 2, 3], (x) => x = 0) = truenone([true, true], (x) => x = false) = truenone(["Apple", "Pi", "Banana"], (x) => startswith(x, "A")) = false// Postfix style.["Apple", "Pi", "Banana"].none((x) => startswith(x, "A")) = false
```

### `join(array, [delimiter])`

Joins elements in an array into a single string (i.e., rendering them all on the same line). If provided with a second argument, then each element will be separated by the given separator.

```
join([1, 2, 3]) = "1, 2, 3"join([1, 2, 3], " ") = "1 2 3"join(6) = "6"join([]) = ""// Postfix style.[1, 2, 3].join(" ") = "1 2 3"
```

### `filter(array, predicate)`

Filters elements in an array according to the predicate, returning a new list of the elements which matched.

```
filter([1, 2, 3], (x) => x >= 2) = [2, 3]filter(["yes", "no", "yas"], (x) => startswith(x, "y")) = ["yes", "yas"]// Postfix style.["yes", "no", "yas"].filter((x) => startswith(x, "y")) = ["yes", "yas"]
```

### `map(array, func)`

Applies the function to each element in the array, returning a list of the mapped results.

```
map([1, 2, 3], (x) => x + 2) = [3, 4, 5]map(["yes", "no"], (x) => x + "?") = ["yes?", "no?"]// Postfix style.["yes", "no"].map((x) => x + "?") = ["yes?", "no?"]
```

### `flat(array, [depth])`

Concatenates sub-levels of the array to the desired depth. Default is 1 level, but it can concatenate multiple levels. E.g. Can be used to reduce array depth on `rows` lists after doing `GROUP BY`.

```
flat([1, 2, 3, [4, 5], 6]) => [1, 2, 3, 4, 5, 6]flat([1, [21, 22], [[311, 312, 313]]], 4) => list(1, 21, 22, 311, 312, 313)flat(rows.file.outlinks)) => All the file outlinks at first level in output// Postfix style.rows.file.outlinks.flat() => All the file outlinks at first level in output
```

### `slice(array, [start, [end]])`

Returns a shallow copy of a portion of an array into a new array object selected from `start` to `end` (`end` not included) where `start` and `end` represents the index of items in that array.

```
slice([1, 2, 3, 4, 5], 3) = [4, 5] => All items from given position, 0 as firstslice(["ant", "bison", "camel", "duck", "elephant"], 0, 2) = ["ant", "bison"] => First two itemsslice([1, 2, 3, 4, 5], -2) = [4, 5] => counts from the end, last two itemsslice(someArray) => a copy of someArray// Postfix style.[1, 2, 3, 4, 5].slice(-2) = [4, 5] => counts from the end, last two items
```

---

## String Operations

### `regextest(pattern, string)`

Checks if the given regex pattern can be found in the string (using the JavaScript regex engine).

```
regextest("\w+", "hello") = trueregextest(".", "a") = trueregextest("yes|no", "maybe") = falseregextest("what", "what's up dog?") = true
```

### `regexmatch(pattern, string)`

Checks if the given regex pattern matches the _entire_ string, using the JavaScript regex engine. This differs from `regextest` in that regextest can match just parts of the text.

```
regexmatch("\w+", "hello") = trueregexmatch(".", "a") = trueregexmatch("yes|no", "maybe") = falseregexmatch("what", "what's up dog?") = false
```

### `regexreplace(string, pattern, replacement)`

Replaces all instances where the _regex_ `pattern` matches in `string`, with `replacement`. This uses the JavaScript replace method under the hood, so you can use special characters like `$1` to refer to the first capture group, and so on.

```
regexreplace("yes", "[ys]", "a") = "aea"regexreplace("Suite 1000", "\d+", "-") = "Suite -"
```

### `replace(string, pattern, replacement)`

Replace all instances of `pattern` in `string` with `replacement`.

```
replace("what", "wh", "h") = "hat"replace("The big dog chased the big cat.", "big", "small") = "The small dog chased the small cat."replace("test", "test", "no") = "no"// Postfix style."The big dog chased the big cat.".replace("big", "small") = "The small dog chased the small cat."
```

### `lower(string)`

Convert a string to all lower case.

```
lower("Test") = "test"lower("TEST") = "test"// Postfix style."Test".lower() = "test"
```

### `upper(string)`

Convert a string to all upper case.

```
upper("Test") = "TEST"upper("test") = "TEST"// Postfix style."Test".upper() = "TEST"
```

### `split(string, delimiter, [limit])`

Split a string on the given delimiter string. If a third argument is provided, it limits the number of splits that occur. The delimiter string is interpreted as a regular expression. If there are capture groups in the delimiter, matches are spliced into the result array, and non-matching captures are empty strings.

```
split("hello world", " ") = ["hello", "world"]split("hello  world", "\s") = ["hello", "world"]split("hello there world", " ", 2) = ["hello", "there"]split("hello there world", "(t?here)") = ["hello ", "there", " world"]split("hello there world", "( )(x)?") = ["hello", " ", "", "there", " ", "", "world"]// Postfix style."hello there world".split("( )(x)?") = ["hello", " ", "", "there", " ", "", "world"]
```

### `startswith(string, prefix)`

Checks if a string starts with the given prefix.

```
startswith("yes", "ye") = truestartswith("path/to/something", "path/") = truestartswith("yes", "no") = false// Postfix style."yes".startswith("no") = false
```

### `endswith(string, suffix)`

Checks if a string ends with the given suffix.

```
endswith("yes", "es") = trueendswith("path/to/something", "something") = trueendswith("yes", "ye") = false// Postfix style."yes".endswith("ye") = false
```

### `padleft(string, length, [padding])`

Pads a string up to the desired length by adding padding on the left side. If you omit the padding character, spaces will be used by default.

```
padleft("hello", 7) = "  hello"padleft("yes", 5, "!") = "!!yes"// Postfix style."yes".padleft(5, "!") = "!!yes"
```

### `padright(string, length, [padding])`

Equivalent to `padleft`, but pads to the right instead.

```
padright("hello", 7) = "hello  "padright("yes", 5, "!") = "yes!!"// Postfix style."yes".padright(5, "!") = "yes!!"
```

### `substring(string, start, [end])`

Take a slice of a string, starting at `start` and ending at `end` (or the end of the string if unspecified).

```
substring("hello", 0, 2) = "he"substring("hello", 2, 4) = "ll"substring("hello", 2) = "llo"substring("hello", 0) = "hello"// Postfix style."hello".substring(0, 2) = "he"
```

### `truncate(string, length, [suffix])`

Truncate a string to be at most the given length, including the `suffix` (which defaults to `...`). Generally useful to cut off long text in tables.

```
truncate("Hello there!", 8) = "Hello..."truncate("Hello there!", 8, "/") = "Hello t/"truncate("Hello there!", 10) = "Hello t..."truncate("Hello there!", 10, "!") = "Hello the!"truncate("Hello there!", 20) = "Hello there!"// Postfix style."Hello there!".truncate(8) = "Hello..."
```

## Utility Functions

### `default(field, value)`

If `field` is null, return `value`; otherwise return `field`. Useful for replacing null values with defaults. For example, to show projects which haven't been completed yet, use `"incomplete"` as their default value:

```
default(dateCompleted, "incomplete")
```

Default is vectorized in both arguments; if you need to use default explicitly on a list argument, use `ldefault`, which is the same as default but is not vectorized.

```
default([1, 2, null], 3) = [1, 2, 3]ldefault([1, 2, null], 3) = [1, 2, null]
```

### `choice(bool, left, right)`

A primitive if statement - if the first argument is truthy, returns left; otherwise, returns right.

```
choice(true, "yes", "no") = "yes"choice(false, "yes", "no") = "no"choice(x > 4, y, z) = y if x > 4, else z
```

### `hash(seed, [text], [variant])`

Generate a hash based on the `seed`, and the optional extra `text` or a variant `number`. The function generates a fixed number based on the combination of these parameters, which can be used to randomize the sort order of files or lists/tasks. If you choose a `seed` based on a date, i.e. "2024-03-17", or another timestamp, i.e. "2024-03-17 19:13", you can make the "randomness" be fixed related to that timestamp. `variant` is a number, which in some cases is needed to make the combination of `text` and `variant` become unique.

```
hash(dateformat(date(today), "YYYY-MM-DD"), file.name) = ... A unique value for a given date in timehash(dateformat(date(today), "YYYY-MM-DD"), file.name, position.start.line) = ... A unique "random" value in a TASK query
```

This function can be used in a `SORT` statement to randomize the order. If you're using a `TASK` query, since the file name could be the same for multiple tasks, you can add some number like the starting line number (as shown above) to make it a unique combination. If using something like `FLATTEN file.lists as item`, the similar addition would be to do `item.position.start.line` as the last parameter.

### `striptime(date)`

Strip the time component of a date, leaving only the year, month, and day. Good for date comparisons if you don't care about the time.

```
striptime(file.ctime) = file.cdaystriptime(file.mtime) = file.mday
```

### `dateformat(date|datetime, string)`

Format a date using a formatting string. Uses [Luxon tokens](https://moment.github.io/luxon/#/formatting?id=table-of-tokens).

```
dateformat(file.ctime,"yyyy-MM-dd") = "2022-01-05"dateformat(file.ctime,"HH:mm:ss") = "12:18:04"dateformat(date(now),"x") = "1407287224054"dateformat(file.mtime,"ffff") = "Wednesday, August 6, 2014, 1:07 PM Eastern Daylight Time"
```

**Note:** `dateformat()` returns a string, not a date, so you can't compare it against the result from a call to `date()` or a variable like `file.day` which already is a date. To make those comparisons you can format both arguments.

### `durationformat(duration, string)`

Format a duration using a formatting string. The following tokens are available:

- `S` for milliseconds
- `s` for seconds
- `m` for minutes
- `h` for hours
- `d` for days
- `w` for weeks
- `M` for months
- `y` for years

```
durationformat(dur("3 days 7 hours 43 seconds"), "ddd'd' hh'h' ss's'") = "003d 07h 43s"durationformat(dur("365 days 5 hours 49 minutes"), "yyyy ddd hh mm ss") = "0001 000 05 49 00"durationformat(dur("2000 years"), "M months") = "24000 months"durationformat(dur("14d"), "s 'seconds'") = "1209600 seconds"// Postfix format.dur("14d").durationformat("s 'seconds'") = "1209600 seconds"
```

### `currencyformat(number, [currency])`

Presents the number depending on your current locale, according to the `currency` code, from [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217#List_of_ISO_4217_currency_codes).

```
number = 123456.789currencyformat(number, "EUR") =  €123,456.79   // in locale: en_UScurrencyformat(number, "EUR") =  123.456,79 €  // in locale: de_DEcurrencyformat(number, "EUR") =  € 123 456,79  // in locale: nb// Postfix format.number.currencyformat("EUR") =  € 123 456,79  // in locale: nb
```

### `localtime(date)`

Converts a date in a fixed timezone to a date in the current timezone.

### `meta(link)`

Get an object containing metadata of a link. When you access a property on a link what you get back is the property value from the linked file. The `meta` function makes it possible to access properties of the link itself.

There are several properties on the object returned by `meta`:

#### `meta(link).display`

Get the display text of a link, or null if the link does not have defined display text.

```
meta([[2021-11-01|Displayed link text]]).display = "Displayed link text"meta([[2021-11-01]]).display = null
```

#### `meta(link).embed`

True or false depending on whether the link is an embed. Those are links that begin with an exclamation mark, like `![[Some Link]]`.

#### `meta(link).path`

Get the path portion of a link.

```
meta([[My Project]]).path = "My Project"meta([[My Project#Next Actions]]).path = "My Project"meta([[My Project#^9bcbe8]]).path = "My Project"
```

#### `meta(link).subpath`

Get the subpath of a link. For links to a heading within a file the subpath will be the text of the heading. For links to a block the subpath will be the block ID. If neither of those cases applies then the subpath will be null.

```
meta([[My Project#Next Actions]]).subpath = "Next Actions"meta([[My Project#^9bcbe8]]).subpath = "9bcbe8"meta([[My Project]]).subpath = null
```

#### `meta(link).type`

Has the value "file", "header", or "block" depending on whether the link links to an entire file, a heading within a file, or to a block within a file.

```
meta([[My Project]]).type = "file"meta([[My Project#Next Actions]]).type = "header"meta([[My Project#^9bcbe8]]).type = "block"
```