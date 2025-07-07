




```datacoretsx
/**
 * @TODO handle circular links
 * @TODO handle multiple parents (Array of parents)
 * @TODO make home link actually work
 */

// Debug toggle to enable or disable debugging messages
const DEBUG = true;

// Property in frontmatter to look at for parent linkage
const FRONTMATTER_PARENT_PROPERTY = "parent";

function SuperchargedLink({page}) {
    const attributes = Object.entries(page.$frontmatter || {}).map(([key, value]) => ([`data-link-${key}`, value?.raw ?? value]));
    const attributesObject = Object.fromEntries(attributes);
    return <span className="data-link-text-dc" data-link-path={page.$path} data-link-tags={page.$tags} {...attributesObject}>
        <dc.Link link={page.$link} />
    </span>;
}

function Breadcrumb({path}) {
    const file = dc.useQuery(`@page and $path = "${path}"`)[0];
    if (!file) {
        if (DEBUG) console.debug(`Breadcrumb: No file found for path: ${path}`);
        return <mark className="flex red text"><dc.Icon icon="file-x" /></mark>;
    }

    // Display the properties of the current file for debugging purposes
    if (DEBUG) console.debug(`Breadcrumb: Frontmatter properties for current file (${path}):`, file.$frontmatter);

    // Handle circular references to avoid infinite loops
    if (file.$frontmatter?.[FRONTMATTER_PARENT_PROPERTY]?.value?.path === path) {
        if (DEBUG) console.debug(`Breadcrumb: Circular reference detected for path: ${path}`);
        return <a className="flex" data-href={path}><dc.Icon icon="house" /></a>;
    }

    // If parent exists, recursively build the breadcrumb trail
    const parentPaths = [];
    let currentFile = file;
    while (currentFile?.$frontmatter?.[FRONTMATTER_PARENT_PROPERTY]?.value?.path) {
        const parentPath = currentFile.$frontmatter[FRONTMATTER_PARENT_PROPERTY].value.path;
        if (!parentPath || parentPaths.includes(parentPath)) {
            // Prevent circular reference or missing path issues
            break;
        }
        parentPaths.unshift(parentPath);
        if (DEBUG) console.debug(`Breadcrumb: Adding parent path - ${parentPath}`);
        currentFile = dc.useQuery(`@page and $path = "${parentPath}"`)[0];
    }

    if (DEBUG) console.debug(`Breadcrumb: Full parent paths: ${parentPaths.join(' -> ')}`);

    // Render the breadcrumb trail
    return (
        <>
            {parentPaths.map((parentPath, index) => {
                const parentFile = dc.useQuery(`@page and $path = "${parentPath}"`)[0];
                if (DEBUG) console.debug(`Breadcrumb: Rendering parent link for path: ${parentPath}`);
                return (
                    <span key={index}>
                        <SuperchargedLink page={parentFile} />
                        <dc.Icon icon="chevron-right" />
                    </span>
                );
            })}
            <SuperchargedLink page={file} />
        </>
    );
}

function Breadcrumbs() {
    const current = dc.useCurrentFile();
    const homeLink = <a className="flex" data-href="/" title="Home"><dc.Icon icon="house" /></a>;
    const hasParent = current?.$frontmatter?.[FRONTMATTER_PARENT_PROPERTY]?.value?.path;

    if (DEBUG) {
        console.debug(`Breadcrumbs: Starting parent hierarchy for ${current.$path}`);
        console.debug(`Breadcrumbs: Frontmatter properties for current file (${current.$path}):`, current.$frontmatter);
        let currentParent = hasParent;
        while (currentParent) {
            console.debug(`Breadcrumbs: Parent path - ${currentParent ?? "undefined"}`);
            currentParent = currentParent ? dc.useQuery(`@page and $path = "${currentParent}"`)[0]?.$frontmatter?.[FRONTMATTER_PARENT_PROPERTY]?.value?.path : null;
        }
        console.debug(`Breadcrumbs: End of parent hierarchy for ${current.$path}`);
    }

    // Render the entire breadcrumb path, starting from the home link
    return (
        <div className="tint indigo bg flex align-center gap-1 p-2 rounded-md">
            {homeLink}
            {hasParent && <dc.Icon icon="chevron-right" />}
            <Breadcrumb path={current.$path} />
        </div>
    );
}

return Breadcrumbs;

```


> [!info]- SETTINGS
> # settings
> ```tsx
> function initialSettingsOverride() {
> const settings = {
> 	queryPath: "CUSTOM_PATH/RECIPES",
> 	initialNameFilter: "search_term_here",
> 	dynamicColumnProperties: 
> 	  Recipes: "name.obsidian",
> 	    Source: "source",
> 	    Diet: "diet",
> 	    Tags: "tags",
> 	    Ingredients: "ingredients",
> 	"Creation Date": "ctime.obsidian",
> 	},
> 	groupByColumns: ["Genre"],
> 	pagination: {
> 	  isEnabled: false,
> 	itemsPerPage: 10,
> 	},
> 	viewHeight: "750px",
> 	placeholders: {
> 	  nameFilter: "Search recipes here...",
> 	    queryPath: "Enter your custom path...",
> 	headerTitle: "My Custom Recipe Viewer",
> },
> };
> ```





