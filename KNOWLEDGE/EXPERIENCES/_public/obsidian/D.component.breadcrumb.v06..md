




```datacoretsx
/**
 * @TODO handle circular links
 * @TODO handle multiple parents (Array of parents)
 * @TODO make home link actually work
 */

// Debug toggle to enable or disable debugging messages
const DEBUG = true;

// Toggle to use vault's default color instead of custom color tones
const USE_VAULT_COLOR = false;

// If `USE_VAULT_COLOR` is false, set a custom base color (Hex or RGB)
const CUSTOM_BASE_COLOR = "#3498db"; // Example: Blue shade

// Property in frontmatter to look at for parent linkage
const FRONTMATTER_PARENT_PROPERTY = "parent";

// Utility function to generate lighter or darker tones based on a base color
function adjustColorTone(color, amount) {
    const usePound = color[0] === "#";
    let col = usePound ? color.slice(1) : color;

    let num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;

    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    return (usePound ? "#" : "") + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Utility function to determine color based on depth for dark/light mode.
/**
 * Utility function to determine color based on depth for dark/light mode.
 * 
 * Capabilities:
 * - Uses vault default theme color if `USE_VAULT_COLOR` is set to `true`.
 * - Automatically adjusts color tones based on breadcrumb depth.
 * - Fixes the first and last tones and evenly adjusts the lightness for intermediate steps.
 * 
 * @param {number} depth - The current breadcrumb depth.
 * @param {number} totalDepth - The total number of breadcrumbs.
 * @param {boolean} isDarkMode - Whether the theme is in dark mode.
 * @returns {string} - The resulting CSS color string.
 */
function getColor(depth, totalDepth, isDarkMode) {
    if (USE_VAULT_COLOR) {
        // Improved method to fetch the vault's default color, with fallbacks
        const vaultColor = getComputedStyle(document.body).getPropertyValue('--text-normal') || 
                           getComputedStyle(document.body).getPropertyValue('--color-text') || 
                           getComputedStyle(document.documentElement).getPropertyValue('--text-normal') || 
                           '#000000'; // Default to black if unable to fetch

        if (vaultColor && vaultColor.trim()) {
            return vaultColor.trim();
        } else {
            console.warn("Vault default color not found. Falling back to custom tone.");
        }
    }

    // Use custom tones based on the base color
    const startAmount = isDarkMode ? 50 : -50; // Adjust starting tone: lighter or darker
    const endAmount = isDarkMode ? -100 : 100; // Adjust ending tone: lighter or darker

    // Calculate the adjustment step per breadcrumb
    const step = (endAmount - startAmount) / (totalDepth - 1);
    const adjustedTone = startAmount + (depth * step);

    return adjustColorTone(CUSTOM_BASE_COLOR, adjustedTone);
}

// ColoredIcon Component to centralize icon styling
function ColoredIcon({ icon, depth, totalDepth, isDarkMode, style = {}, className = "", ...props }) {
    const color = getColor(depth, totalDepth, isDarkMode);
    return <dc.Icon icon={icon} style={{ color, ...style }} className={className} {...props} />;
}

// SuperchargedLink Component updated to mimic Obsidian's internal link behavior
function SuperchargedLink({ page, isDarkMode, depth, totalDepth }) {
    const attributes = Object.entries(page.$frontmatter || {}).map(
        ([key, value]) => {
            const sanitizedKey = key.replace(/[^a-zA-Z0-9-_]/g, '-');
            return [`data-link-${sanitizedKey}`, value?.raw ?? value];
        }
    );
    const attributesObject = Object.fromEntries(attributes);
    const color = getColor(depth, totalDepth, isDarkMode);
    const pageName = typeof page.$name === "string" ? page.$name : "Unknown";
    const icon = typeof page.$frontmatter?.icon === "string" ? page.$frontmatter.icon : "file";

    return (
        <a 
            href={`#${page.$path}`} 
            className="internal-link md-link flex items-center gap-2" 
            data-href={page.$path} 
            data-link-path={page.$path} 
            data-link-tags={page.$tags} 
            {...attributesObject}
            style={{ color, textDecoration: 'none' }} 
        >
            <ColoredIcon 
                icon={icon} 
                depth={depth} 
                totalDepth={totalDepth} 
                isDarkMode={isDarkMode} 
                className="breadcrumb-icon" 
                style={{ marginRight: "8px" }} 
            />
            <span className="obsidian-link" style={{ color }}>{pageName}</span>
        </a>
    );
}

// Function to find the top-most parent
function getTopMostParentPath(current) {
    let topMostParentPath = current.$path;
    let parentPath = current.$frontmatter?.[FRONTMATTER_PARENT_PROPERTY]?.value?.path;

    while (parentPath) {
        const parentFile = dc.useQuery(`@page and $path = "${parentPath}"`)[0];
        if (!parentFile || !parentFile.$frontmatter?.[FRONTMATTER_PARENT_PROPERTY]?.value?.path) {
            break;
        }
        topMostParentPath = parentPath;
        parentPath = parentFile.$frontmatter[FRONTMATTER_PARENT_PROPERTY].value.path;
    }

    return topMostParentPath;
}

// Breadcrumb Component
function Breadcrumb({ path, depth = 0, isDarkMode }) {
    const file = dc.useQuery(`@page and $path = "${path}"`)[0];
    if (!file) {
        if (DEBUG) console.debug(`Breadcrumb: No file found for path: ${path}`);
        return <mark className="flex red text"><dc.Icon icon="file-x" /></mark>;
    }

    if (DEBUG) console.debug(`Breadcrumb: Frontmatter properties for current file (${path}):`, file.$frontmatter);

    const parentPaths = [];
    let currentFile = file;
    while (currentFile?.$frontmatter?.[FRONTMATTER_PARENT_PROPERTY]?.value?.path) {
        const parentPath = currentFile.$frontmatter[FRONTMATTER_PARENT_PROPERTY].value.path;
        if (!parentPath || parentPaths.includes(parentPath)) {
            break;
        }
        parentPaths.unshift(parentPath);
        if (DEBUG) console.debug(`Breadcrumb: Adding parent path - ${parentPath}`);
        currentFile = dc.useQuery(`@page and $path = "${parentPath}"`)[0];
    }

    if (DEBUG) console.debug(`Breadcrumb: Full parent paths: ${parentPaths.join(' -> ')}`);

    return (
        <>
            {parentPaths.map((parentPath, index) => {
                const parentFile = dc.useQuery(`@page and $path = "${parentPath}"`)[0];
                if (!parentFile) {
                    if (DEBUG) console.debug(`Breadcrumb: No file found for parent path: ${parentPath}`);
                    return null;
                }
                const currentDepth = index + 1;
                return (
                    <span key={index} className="flex items-center gap-2">
                        <SuperchargedLink 
                            page={parentFile} 
                            depth={currentDepth} 
                            totalDepth={parentPaths.length + 1} 
                            isDarkMode={isDarkMode} 
                        />
                        <ColoredIcon 
                            icon="chevron-right" 
                            depth={currentDepth} 
                            totalDepth={parentPaths.length + 1} 
                            isDarkMode={isDarkMode} 
                            style={{ margin: "0 12px" }} 
                        />
                    </span>
                );
            })}
            <SuperchargedLink 
                page={file} 
                depth={parentPaths.length + 1} 
                totalDepth={parentPaths.length + 1} 
                isDarkMode={isDarkMode} 
            />
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
    const isDarkMode = document.body.classList.contains('theme-dark');

    if (DEBUG) {
        console.debug(`Breadcrumbs: Building breadcrumb trail for ${current.$path}`);
    }

    return (
        <div className="tint indigo bg flex items-center gap-2 p-2 rounded-md">
            <Breadcrumb path={current.$path} isDarkMode={isDarkMode} />
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





