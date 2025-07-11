




```datacoretsx
/**
 * @TODO handle circular links
 * @TODO handle multiple parents (Array of parents)
 */

import React from 'react';

// Debug toggle to enable or disable debugging messages
const DEBUG = true;

// Property in frontmatter to look at for parent linkage
const FRONTMATTER_PARENT_PROPERTY = "parent";

// Utility function to determine color based on depth for dark/light mode
function getColor(depth, isDarkMode) {
    const baseLightness = isDarkMode ? 60 : 50; // Start with different lightness for dark vs. light mode
    const adjustedLightness = Math.max(baseLightness - (depth * 10), 20); // Adjust lightness based on depth
    return `hsl(45, 90%, ${adjustedLightness}%)`;
}

// ColoredIcon Component to centralize icon styling
function ColoredIcon({ icon, depth, isDarkMode, style = {}, className = "", ...props }) {
    const color = getColor(depth, isDarkMode);
    return <dc.Icon icon={icon} style={{ color, ...style }} className={className} {...props} />;
}

// SuperchargedLink Component updated to mimic Obsidian's internal link behavior
function SuperchargedLink({ page, isDarkMode, depth }) {
    const attributes = Object.entries(page.$frontmatter || {}).map(
        ([key, value]) => [`data-link-${key}`, value?.raw ?? value]
    );
    const attributesObject = Object.fromEntries(attributes);
    const color = getColor(depth, isDarkMode);
    const pageName = typeof page.$name === "string" ? page.$name : "Unknown";
    const icon = typeof page.$frontmatter?.icon === "string" ? page.$frontmatter.icon : "file";

    return (
        <a 
            href={`#${page.$path}`} // Use hash to prevent default browser navigation
            className="internal-link md-link breadcrumb-link" // Obsidian's internal link classes
            data-href={page.$path} 
            data-link-path={page.$path} 
            data-link-tags={page.$tags} 
            {...attributesObject}
            style={{ color, textDecoration: 'none' }} // Remove underline if desired
            aria-label={`Navigate to ${pageName}`} // Accessibility enhancement
        >
            <ColoredIcon 
                icon={icon} 
                depth={depth} 
                isDarkMode={isDarkMode} 
                className="breadcrumb-icon" 
            />
            <span className="obsidian-link" style={{ color }}>{pageName}</span>
        </a>
    );
}

// Breadcrumb Component
function Breadcrumb({ path, depth = 0, isDarkMode }) {
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
        return (
            <a 
                href={`#${path}`} 
                className="internal-link md-link breadcrumb-link" 
                data-href={path}
                style={{ color: getColor(depth, isDarkMode), textDecoration: 'none' }}
                aria-label="Navigate to Home"
            >
                <ColoredIcon 
                    icon="house" 
                    depth={depth} 
                    isDarkMode={isDarkMode} 
                    className="breadcrumb-icon" 
                />
                <span>Home</span>
            </a>
        );
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
                const currentDepth = index + 1;
                return (
                    <span key={index} className="flex items-center gap-2">
                        <SuperchargedLink page={parentFile} depth={currentDepth} isDarkMode={isDarkMode} />
                        <ColoredIcon 
                            icon="chevron-right" 
                            depth={currentDepth} 
                            isDarkMode={isDarkMode} 
                            className="breadcrumb-separator" 
                            aria-hidden="true" // Hide from screen readers
                        />
                    </span>
                );
            })}
            <SuperchargedLink page={file} depth={parentPaths.length + 1} isDarkMode={isDarkMode} />
        </>
    );
}

// Breadcrumbs Component
function Breadcrumbs() {
    const current = dc.useCurrentFile();
    if (!current) {
        if (DEBUG) console.debug("Breadcrumbs: No current file found.");
        return null;
    }
    const isDarkMode = document.body.classList.contains('theme-dark'); // Determine if the current theme is dark mode

    // Find the root item (item without a parent)
    let rootFile = current;
    while (rootFile?.$frontmatter?.[FRONTMATTER_PARENT_PROPERTY]?.value?.path) {
        const parentPath = rootFile.$frontmatter[FRONTMATTER_PARENT_PROPERTY].value.path;
        const parent = dc.useQuery(`@page and $path = "${parentPath}"`)[0];
        if (!parent || rootFile === parent) break; // Prevent circular references
        rootFile = parent;
    }

    // Build the breadcrumb trail starting from the root
    const parentPaths = [];
    let currentFile = current;
    while (currentFile?.$frontmatter?.[FRONTMATTER_PARENT_PROPERTY]?.value?.path) {
        const parentPath = currentFile.$frontmatter[FRONTMATTER_PARENT_PROPERTY].value.path;
        if (!parentPath || parentPaths.includes(parentPath)) {
            // Prevent circular reference or missing path issues
            break;
        }
        parentPaths.unshift(parentPath);
        if (DEBUG) console.debug(`Breadcrumbs: Adding parent path - ${parentPath}`);
        currentFile = dc.useQuery(`@page and $path = "${parentPath}"`)[0];
    }

    if (DEBUG) console.debug(`Breadcrumbs: Full parent paths: ${parentPaths.join(' -> ')}`);

    // Render the entire breadcrumb path, starting from the root
    return (
        <nav 
            className="tint indigo bg flex items-center gap-2 p-2 rounded-md" 
            role="navigation" 
            aria-label="Breadcrumb"
        >
            <Breadcrumb path={current.$path} isDarkMode={isDarkMode} />
        </nav>
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





