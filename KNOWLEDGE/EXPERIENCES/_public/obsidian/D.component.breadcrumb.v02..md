


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

function SuperchargedLink({page, isDarkMode, depth}) {
    const attributes = Object.entries(page.$frontmatter || {}).map(([key, value]) => ([`data-link-${key}`, value?.raw ?? value]));
    const attributesObject = Object.fromEntries(attributes);
    const color = getColor(depth, isDarkMode);
    const pageName = typeof page.$name === "string" ? page.$name : "Unknown";
    const icon = typeof page.$frontmatter?.icon === "string" ? page.$frontmatter.icon : "file";
    return (
        <span className="data-link-text-dc flex align-center gap-6" data-link-path={page.$path} data-link-tags={page.$tags} {...attributesObject}>
            <dc.Icon icon={icon} style={{ color: color, marginRight: "8px" }} />
            <span className="obsidian-link" style={{ color: color }}>{pageName}</span>
        </span>
    );
}

// Function to determine color based on depth for dark/light mode
function getColor(depth, isDarkMode) {
    const baseLightness = isDarkMode ? 60 : 50; // Start with different lightness for dark vs. light mode
    const adjustedLightness = Math.max(baseLightness - (depth * 10), 20); // Adjust lightness based on depth
    return `hsl(45, 90%, ${adjustedLightness}%)`;
}

function Breadcrumb({path, depth = 0, isDarkMode}) {
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
                if (!parentFile) {
                    if (DEBUG) console.debug(`Breadcrumb: No file found for parent path: ${parentPath}`);
                    return null;
                }
                if (DEBUG) console.debug(`Breadcrumb: Rendering parent link for path: ${parentPath}`);
                const depth = index + 1;
                return (
                    <span key={index} className="flex align-center gap-6">
                        <SuperchargedLink page={parentFile} depth={depth} isDarkMode={isDarkMode} />
                        <dc.Icon icon="chevron-right" style={{ margin: "0 12px", color: getColor(depth, isDarkMode) }} />
                    </span>
                );
            })}
            <SuperchargedLink page={file} depth={parentPaths.length + 1} isDarkMode={isDarkMode} />
        </>
    );
}

function Breadcrumbs() {
    const current = dc.useCurrentFile();
    if (!current) {
        if (DEBUG) console.debug("Breadcrumbs: No current file found.");
        return null;
    }
    const isDarkMode = document.body.classList.contains('theme-dark'); // Determine if the current theme is dark mode

    // Check if the current file has a parent; if not, use it as the home link
    const hasParent = current?.$frontmatter?.[FRONTMATTER_PARENT_PROPERTY]?.value?.path;
    const homeLink = !hasParent ? (
        <SuperchargedLink page={current} depth={0} isDarkMode={isDarkMode} />
    ) : (
        <a className="flex align-center gap-6" data-href="/" title="Home">
            <dc.Icon icon="house" style={{ color: getColor(0, isDarkMode), marginRight: "8px" }} />
            <span className="obsidian-link" style={{ color: getColor(0, isDarkMode) }}>Home</span>
        </a>
    );

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
        <div className="tint indigo bg flex align-center gap-2 p-2 rounded-md">
            {homeLink}
            {hasParent && <dc.Icon icon="chevron-right" style={{ margin: "0 12px", color: getColor(0, isDarkMode) }} />}
            {hasParent && <Breadcrumb path={current.$path} isDarkMode={isDarkMode} />}
        </div>
    );
}

return Breadcrumbs;

```

