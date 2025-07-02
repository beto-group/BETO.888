
###### NAVIGATE - BACK : [[DATACORE]]
-----






I'll provide an overview of the codebase based on the given code snippets. This appears to be a project called "Datacore," which is described as a reactive data engine for Obsidian.md, a note-taking application.

Key components and features:

1. Core Structure:

- The main plugin class is DatacorePlugin, which extends Obsidian's Plugin class.

- It initializes a Datacore instance, which seems to be the central state manager.

- An API (DatacoreApi) is exposed for querying and interacting with the plugin.

- Indexing and Data Management:

- The plugin indexes Markdown files, parsing them for tags, links, frontmatter, sections, and blocks.

- It uses a Datastore to manage the indexed data.

- There's a FileImporter class that handles multi-threaded file parsing with debouncing.

- Query System:

- Datacore implements a query language for searching and filtering data.

- It includes an expression evaluator, binary operations, and custom functions.

- Queries can be executed on the indexed data, returning Indexable objects.

- React-based UI:

- The plugin uses Preact (a lightweight alternative to React) for rendering UI components.

- It provides hooks like useQuery, useFile, and useCurrentFile for reactive data fetching.

- There are components for rendering Markdown, literals, and custom UI elements.

- Javascript/TypeScript Support:

- Datacore supports executing Javascript, JSX, TypeScript, and TSX code blocks within Obsidian notes.

- It uses a ScriptCache for loading and caching scripts.

- There's a transpilation step for TypeScript code.

- File System Interaction:

- The plugin interacts with Obsidian's file system, watching for file changes and updates.

- It maintains a FolderIndex for efficient path resolution and file lookup.

- Settings and Configuration:

- The plugin has configurable settings, stored in a Settings object.

- There's a settings tab for user configuration.

- Error Handling and Logging:

- The code includes error boundaries and logging mechanisms for debugging and user feedback.

- Build and Development:

- The project uses esbuild for bundling and TypeScript for type checking.

- It includes Jest for testing and Prettier for code formatting.

Key files and their roles:


```jsx
/** Reactive data engine for your Obsidian.md vault. */
export default class DatacorePlugin extends Plugin {
    /** Plugin-wide default settings. */
    public settings: Settings;

    /** Central internal state. */
    public core: Datacore;
    /** Externally visible API for querying. */
    public api: DatacoreApi
    async onload() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) ?? {});
        this.addSettingTab(new GeneralSettingsTab(this.app, this));

        // Initialize the core API for usage in all views and downstream apps.
        this.addChild((this.core = new Datacore(this.app, this.manifest.version, this.settings)));
        this.api = new DatacoreApi(this.core);

        // Add a visual aid for what datacore is currently doing.
        this.mountIndexState(this.addStatusBarItem(), this.core);

        // Primary visual elements (DatacoreJS and Datacore blocks).
        this.registerMarkdownCodeBlockProcessor(
            "datacorejs",
            async (source: string, el, ctx) => this.api.executeJs(source, el, ctx, ctx.sourcePath),
            -100
        );

        this.registerMarkdownCodeBlockProcessor(
            "datacorejsx",
            async (source: string, el, ctx) => this.api.executeJsx(source, el, ctx, ctx.sourcePath),
            -100
        );

        this.registerMarkdownCodeBlockProcessor(
            "datacorets",
            async (source: string, el, ctx) => this.api.executeTs(source, el, ctx, ctx.sourcePath),
            -100
        );

        this.registerMarkdownCodeBlockProcessor(
            "datacoretsx",
            async (source: string, el, ctx) => this.api.executeTsx(source, el, ctx, ctx.sourcePath),
            -100
        );
        // Register JS highlighting for codeblocks.
        this.register(this.registerCodeblockHighlighting());

        // Initialize as soon as the workspace is ready.
        if (!this.app.workspace.layoutReady) {
            this.app.workspace.onLayoutReady(async () => this.core.initialize());
        } else {
            this.core.initialize();
        }

        // Make the API globally accessible from any context.
        window.datacore = this.api;

        // bon appetit
        console.log(`Datacore: version ${this.manifest.version} (requires obsidian ${this.manifest.minAppVersion})`);
    }
    onunload() {
        console.log(`Datacore: version ${this.manifest.version} unloaded.`);
    }

    /** Register codeblock highlighting and return a closure which unregisters. */
    registerCodeblockHighlighting(): () => void {
        window.CodeMirror.defineMode("datacorejs", (config) => window.CodeMirror.getMode(config, "javascript"));
        window.CodeMirror.defineMode("datacorejsx", (config) => window.CodeMirror.getMode(config, "jsx"));
        window.CodeMirror.defineMode("datacorets", (config) => window.CodeMirror.getMode(config, "javascript"));
        window.CodeMirror.defineMode("datacoretsx", (config) => window.CodeMirror.getMode(config, "jsx"));

        return () => {
            window.CodeMirror.defineMode("datacorejs", (config) => window.CodeMirror.getMode(config, "null"));
            window.CodeMirror.defineMode("datacorejsx", (config) => window.CodeMirror.getMode(config, "null"));
            window.CodeMirror.defineMode("datacorets", (config) => window.CodeMirror.getMode(config, "null"));
            window.CodeMirror.defineMode("datacoretsx", (config) => window.CodeMirror.getMode(config, "null"));
        };
    }

    /** Update the given settings to new values. */
    async updateSettings(settings: Partial<Settings>) {
        Object.assign(this.settings, settings);
        await this.saveData(this.settings);
    }
    /** Render datacore indexing status using the index. */
    private mountIndexState(root: HTMLElement, core: Datacore): void {
        render(createElement(IndexStatusBar, { datacore: core }), root);

        this.register(() => render(null, root));
    }
}
```



This file defines the Datacore class, which is the central state manager and handles initialization, events, and access to core functionality.

```jsx
/** Exterally visible API for datacore. */
export class DatacoreApi {
    public constructor(public core: Datacore) {}

    ///////////////
    // Local API //
    ///////////////

    /** Construct a local API for the file at the given path. */
    public local(path: string): DatacoreLocalApi {
        return new DatacoreLocalApi(this, path);
    }

    /////////////////////////
    // Querying + Fetching //
    /////////////////////////

    /** Load a markdown file by full path or link. */
    public page(path: string | Link): MarkdownPage | undefined {
        const realPath = path instanceof Link ? path.path : path;

        return this.core.datastore.load(realPath) as MarkdownPage | undefined;
    }

    /** Execute a textual or typed index query, returning all results. */
    public query(query: string | IndexQuery): Indexable[] {
        return this.tryQuery(query).orElseThrow();
    }

    /** Execute a textual or typed index query, returning all results. */
    public tryQuery(query: string | IndexQuery): Result<Indexable[], string> {
        return this.tryFullQuery(query).map((result) => result.results);
    }

    /** Execute a textual or typed index query, returning results plus performance metadata. */
    public fullquery(query: string | IndexQuery): SearchResult<Indexable> {
        return this.tryFullQuery(query).orElseThrow();
    }
```



This file contains the DatacoreApi class, which provides the external interface for querying and interacting with the plugin.

```jsx
import { ErrorMessage, SimpleErrorBoundary, CURRENT_FILE_CONTEXT, DatacoreContextProvider } from "ui/markdown";
import { App, MarkdownRenderChild } from "obsidian";
import { DatacoreLocalApi } from "api/local-api";
import { h, render, Fragment, VNode } from "preact";
import { unmountComponentAtNode } from "preact/compat";
import { ScriptLanguage, asyncEvalInContext, transpile } from "utils/javascript";
import { LoadingBoundary, ScriptContainer } from "./loading-boundary";
import { Datacore } from "index/datacore";
```


This file sets up the React-based rendering system and imports necessary components for Javascript execution.

```jsx
/** Local API provided to specific codeblocks when they are executing. */
export class DatacoreLocalApi {
    private scriptCache: ScriptCache;

    public constructor(public api: DatacoreApi, public path: string) {
        this.scriptCache = new ScriptCache(this.core.datastore);
    }

    /** The current file path for the local API. */
    public currentPath(): string {
        return this.path;
    }

    /** The full markdown file metadata for the current file. */
    public currentFile(): MarkdownPage {
        return this.api.page(this.path)!;
    }

    /** Get acess to luxon functions. */
    get luxon(): typeof luxon {
        return luxon;
    }

    /** Get access to preact functions. */
    get preact(): typeof preact {
        return preact;
    }

    /** Central Obsidian app object. */
    get app(): App {
        return this.core.app;
    }

    /** The internal plugin central datastructure. */
    get core(): Datacore {
        return this.api.core;
    }

    //////////////////////////////
    // Script loading utilities //
    //////////////////////////////

    /**
     * Asynchronously load a javascript block from the given path or link; you can either load from JS/TS/JSX/TSX files
     * directly, or from codeblocks by loading from the section the codeblock is inside of. There are a few stipulations
     * to loading:
     * - You cannot load cyclical dependencies.
     * - This is similar to vanilla js `require()`, not `import ... `. Your scripts you are requiring need to explicitly
     *   return the things they are exporting, like the example below. The `export` keyword does not work.
     *
     * ```js
     * function MyElement() {
     *  ...
     * }
     *
     * return { MyElement };
     * ```
     */
    public async require(path: string | Link): Promise<any> {
        const result = await this.scriptCache.load(path, { dc: this });
        return result.orElseThrow();
    }
    ///////////////////////
    // General utilities //
    ///////////////////////

    /** Utilities for coercing types into one specific type for easier programming. */
    public coerce = Coerce;

    /** Resolve a local or absolute path or link to an absolute path. */
    public resolvePath(path: string | Link, sourcePath?: string): string {
        return this.api.resolvePath(path, sourcePath ?? this.path);
    }

    /** Try to parse the given query, returning a monadic success/failure result. */
    public tryParseQuery(query: string | IndexQuery): Result<IndexQuery, string> {
        return this.api.tryParseQuery(query);
    }

    /** Try to parse the given query, throwing an error if it is invalid. */
    public parseQuery(query: string | IndexQuery): IndexQuery {
        return this.tryParseQuery(query).orElseThrow((e) => "Failed to parse query: " + e);
    }

    /** Create a file link pointing to the given path. */
    public fileLink(path: string): Link {
        return Link.file(path);
    }

    /** Create a link to a header with the given name. */
    public headerLink(path: string, header: string): Link {
        return Link.header(path, header);
    }

    /** Create a link to a block with the given path and block ID. */
    public blockLink(path: string, block: string): Link {
        return Link.block(path, block);
    }
    ...
    /** Use the file metadata for the current file. Automatically updates the view when the current file metadata changes. */
    public useCurrentFile(settings?: { debounce?: number }): MarkdownPage {
        return useFileMetadata(this.core, this.path, settings) as MarkdownPage;
    }

    /** Use the current path. Automatically updates the view if the path changes (though that would be weird). */
    public useCurrentPath(settings?: { debounce?: number }): string {
        const meta = this.useCurrentFile(settings);
        return meta.$path;
    }

    /** Use the file metadata for a specific file. Automatically updates the view when the file changes. */
    public useFile(path: string, settings?: { debounce?: number }): Indexable | undefined {
        return useFileMetadata(this.core, path, settings)!;
    }

    /** Automatically refresh the view whenever the index updates; returns the latest index revision ID. */
    public useIndexUpdates(settings?: { debounce?: number }): number {
        return useIndexUpdates(this.core, settings);
    }

    /**
     * Run a query, automatically re-running it whenever the vault changes. Returns more information about the query
     * execution, such as index revision and total search duration.
     */
    public useFullQuery(query: string | IndexQuery, settings?: { debounce?: number }): SearchResult<Indexable> {
        return useFullQuery(this.core, this.parseQuery(query), settings);
    }
    /** Run a query, automatically re-running it whenever the vault changes. */
    public useQuery(query: string | IndexQuery, settings?: { debounce?: number }): Indexable[] {
        // Hooks need to be called in a consistent order, so we don't nest the `useQuery` call in the DataArray.wrap _just_ in case.
        return useQuery(this.core, this.parseQuery(query), settings);
    }

    /////////////////////
    // Visual Elements //
    /////////////////////

    /** Vertical flexbox container; good for putting items together in a column. */
    public Stack = Stack;
    /** Horizontal flexbox container; good for putting items together in a row. */
    public Group = Group;

    /** Renders a literal value in a pretty way that respects settings. */
    public Literal = (({ value, sourcePath, inline }: { value: Literal; sourcePath?: string; inline?: boolean }) => {
        const implicitSourcePath = hooks.useContext(CURRENT_FILE_CONTEXT);
        return <Lit value={value} sourcePath={sourcePath ?? implicitSourcePath ?? this.path} inline={inline} />;
    }).bind(this);

    /** Renders markdown using the Obsidian markdown renderer, optionally attaching additional styles. */
    public Markdown = (({
        content,
        sourcePath,
        inline,
        style,
        className,
    }: {
        content: string;
        sourcePath?: string;
        inline?: boolean;
        style?: CSSProperties;
        className?: string;
    }) => {
        const implicitSourcePath = hooks.useContext(CURRENT_FILE_CONTEXT);
        return (
            <Markdown
                content={content}
                sourcePath={sourcePath ?? implicitSourcePath ?? this.path}
                inline={inline}
                style={style}
                cls={className}
            />
        );
    }).bind(this);
```



This file defines the DatacoreLocalApi class, which provides a rich set of functions and components for use within codeblocks executed in Obsidian notes.

The project seems well-structured, with a clear separation of concerns between indexing, querying, UI rendering, and script execution. It's designed to be extensible and performant, with features like multi-threading for file parsing and caching for script execution.




The DatacoreApi is a crucial component of the Datacore plugin, serving as the primary interface for external interactions with the plugin's functionality. Let's dive deep into its structure and capabilities:

- Core Structure:

The DatacoreApi class is defined in the api.ts file:





```jsx
export class DatacoreApi {
    public constructor(public core: Datacore) {}

    ///////////////
    // Local API //
    ///////////////

    /** Construct a local API for the file at the given path. */
    public local(path: string): DatacoreLocalApi {
        return new DatacoreLocalApi(this, path);
    }

    /////////////////////////
    // Querying + Fetching //
    /////////////////////////

    /** Load a markdown file by full path or link. */
    public page(path: string | Link): MarkdownPage | undefined {
        const realPath = path instanceof Link ? path.path : path;

        return this.core.datastore.load(realPath) as MarkdownPage | undefined;
    }

    /** Execute a textual or typed index query, returning all results. */
    public query(query: string | IndexQuery): Indexable[] {
        return this.tryQuery(query).orElseThrow();
    }

    /** Execute a textual or typed index query, returning all results. */
    public tryQuery(query: string | IndexQuery): Result<Indexable[], string> {
        return this.tryFullQuery(query).map((result) => result.results);
    }

    /** Execute a textual or typed index query, returning results plus performance metadata. */
    public fullquery(query: string | IndexQuery): SearchResult<Indexable> {
        return this.tryFullQuery(query).orElseThrow();
    }
    /** Execute a textual or typed index query, returning results plus performance metadata. */
    public tryFullQuery(query: string | IndexQuery): Result<SearchResult<Indexable>, string> {
        const parsedQuery = typeof query === "string" ? QUERY.query.tryParse(query) : query;
        return this.core.datastore.search(parsedQuery);
    }

    ///////////////////////
    // General utilities //
    ///////////////////////

    /** Utilities for coercing types into one specific type for easier programming. */
    public coerce = Coerce;

    /** Resolve a local or absolute path or link to an absolute path. */
    public resolvePath(path: string | Link, sourcePath?: string): string {
        const rawpath = path instanceof Link ? path.path : path;
        if (rawpath.startsWith("/")) return rawpath.substring(1);

        const absolute = this.core.metadataCache.getFirstLinkpathDest(rawpath, sourcePath ?? "");
        if (absolute) return absolute.path;

        return rawpath;
    }

    /** Try to parse the given query, returning a monadic success/failure result. */
    public tryParseQuery(query: string | IndexQuery): Result<IndexQuery, string> {
        if (!(typeof query === "string")) return Result.success(query);

        const result = QUERY.query.parse(query);
        if (result.status) return Result.success(result.value);
        else return Result.failure(Parsimmon.formatError(query, result));
    }
    /** Try to parse the given query, throwing an error if it is invalid. */
    public parseQuery(query: string | IndexQuery): IndexQuery {
        return this.tryParseQuery(query).orElseThrow((e) => "Failed to parse query: " + e);
    }

    /** Create a file link pointing to the given path. */
    public fileLink(path: string): Link {
        return Link.file(path);
    }

    /** Create a link to a header with the given name. */
    public headerLink(path: string, header: string): Link {
        return Link.header(path, header);
    }

    /** Create a link to a block with the given path and block ID. */
    public blockLink(path: string, block: string): Link {
        return Link.block(path, block);
    }

    /** Try to parse the given link, throwing an error if it is invalid. */
    public parseLink(linktext: string): Link {
        return this.tryParseLink(linktext).orElseThrow((e) => "Failed to parse link: " + e);
    }

    /** Try to parse a link, returning a monadic success/failure result. */
    public tryParseLink(linktext: string): Result<Link, string> {
        const parsed = PRIMITIVES.embedLink.parse(linktext);
        if (!parsed.status) return Result.failure(Parsimmon.formatError(linktext, parsed));

        return Result.success(parsed.value);
    }
    /** Create a data array from a regular array. */
    public array<T>(input: T[] | DataArray<T>): DataArray<T> {
        return DataArray.wrap(input);
    }

    /////////////////////
    // Visual Elements //
    /////////////////////

    /**
     * Run the given DatacoreJS script, rendering it into the given container. This function
     * will return quickly; actual rendering is done asynchronously in the background.
     *
     * Returns a markdown render child representing the rendered object.
     */
    public executeJs(
        source: string,
        container: HTMLElement,
        component: Component | MarkdownPostProcessorContext,
        sourcePath: string
    ): MarkdownRenderChild {
        return this._renderJavascript(source, container, component, sourcePath, "js");
    }

    /**
     * Similar to `executeJs`, but for JSX scripts. If you are unsure if your input will be JS
     * or JSX, use this one, as it also supports regular javascript (albeit at at a mild performance
     * hit to rendering).
     */
    public executeJsx(
        source: string,
        container: HTMLElement,
        component: Component | MarkdownPostProcessorContext,
        sourcePath: string
    ): MarkdownRenderChild {
        return this._renderJavascript(source, container, component, sourcePath, "jsx");
    }
    /**
     * Similar to `executeJs`, but for TypeScript scripts. Use the TSX variant for TSX supprot.
     */
    public executeTs(
        source: string,
        container: HTMLElement,
        component: Component | MarkdownPostProcessorContext,
        sourcePath: string
    ): MarkdownRenderChild {
        return this._renderJavascript(source, container, component, sourcePath, "ts");
    }

    /**
     * Similar to `executeTs`, but for TSX scripts. If you are unsure if your input will be TS
     * or TSX, use this one, as it also supports regular javascript (albeit at at a mild performance
     * hit to rendering).
     *
     * This generally will also work if you are unsure if your input is javascript or typescript,
     * though beware there are a few niche cases where javascript and typescript diverge in syntax.
     */
    public executeTsx(
        source: string,
        container: HTMLElement,
        component: Component | MarkdownPostProcessorContext,
        sourcePath: string
    ): MarkdownRenderChild {
        return this._renderJavascript(source, container, component, sourcePath, "tsx");
    }

    /** Shared logic for rendering any JS/TS script. */
    private _renderJavascript(
        source: string,
        container: HTMLElement,
        component: Component | MarkdownPostProcessorContext,
        sourcePath: string,
        language: "js" | "ts" | "jsx" | "tsx"
    ) {
        let local = new DatacoreLocalApi(this, sourcePath);
        const renderer = new DatacoreJSRenderer(local, container, sourcePath, source, language);
        component.addChild(renderer);

        return renderer;
    }
}
```


It's instantiated with a Datacore object, which is the central state manager for the plugin.

- Local API:

The DatacoreApi provides a method to create a DatacoreLocalApi instance for a specific file path:


```jsx
    /** Construct a local API for the file at the given path. */
    public local(path: string): DatacoreLocalApi {
        return new DatacoreLocalApi(this, path);
    }
```




This local API is used for operations specific to a particular file context.

- Querying and Fetching:

The API offers several methods for querying and fetching data:

a. page(): Loads a markdown file by path or link.

b. query(): Executes a query and returns results.

c. tryQuery(): Executes a query and returns a Result object.

d. fullquery(): Executes a query and returns results with performance metadata.

These methods allow users to retrieve indexed data and execute complex queries.

- Utility Functions:

The API provides various utility functions:

a. resolvePath(): Resolves relative or absolute paths.

b. parseQuery(): Parses a query string into an IndexQuery object.

c. fileLink(), headerLink(), blockLink(): Create different types of links.

d. parseLink(): Parses a link string into a Link object.

e. array(): Creates a DataArray from a regular array.

These utilities help with common operations like path resolution, link creation, and data manipulation.

- Script Execution:

The API includes methods for executing different types of scripts within the Obsidian environment:

- executeJs()

- executeJsx()

- executeTs()

- executeTsx()

These methods render JavaScript, JSX, TypeScript, or TSX code into a given container, allowing for dynamic content generation within Obsidian notes.

- Integration with Obsidian:

The API is designed to work seamlessly with Obsidian's component system. For example, the script execution methods return a MarkdownRenderChild, which integrates with Obsidian's rendering lifecycle.

- Error Handling:

The API uses a Result type for many operations, allowing for graceful error handling. Methods like tryQuery() and tryParseLink() return Result objects, which can be used to handle success and failure cases explicitly.

- Extensibility:

The API is designed to be extensible. For instance, the DatacoreLocalApi (which is created by the DatacoreApi) provides additional methods and React hooks for use within specific file contexts.

In summary, the DatacoreApi serves as a comprehensive interface for interacting with the Datacore plugin. It provides methods for querying indexed data, executing scripts, manipulating links and paths, and integrating with Obsidian's component system. This API is the primary way that other parts of the plugin (or potentially other plugins) would interact with Datacore's functionality, making it a crucial part of the plugin's architecture.





ERROR HANDLING:


this syntax:

SyntaxError: Cannot use import statement outside a module



m



