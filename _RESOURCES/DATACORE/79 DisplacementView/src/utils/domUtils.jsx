/**
 * Returns the nearest ancestor node that has the specified class name.
 * @param {HTMLElement} element - The starting element.
 * @param {string} className - The class name to search for.
 * @returns {HTMLElement|null} The ancestor element or null if not found.
 */
function findNearestAncestorWithClass(element, className) {
    if (!element) return null;
    let current = element.parentNode;
    while (current) {
        if (current.classList && current.classList.contains(className)) {
            return current;
        }
        current = current.parentNode;
    }
    return null;
}

/**
 * Returns the first direct child of the parent element that has the specified class.
 * @param {HTMLElement} parent - The parent element to search.
 * @param {string} className - The class name to search for.
 * @returns {HTMLElement|null} The child element or null if not found.
 */
function findDirectChildByClass(parent, className) {
    if (!parent) return null;
    for (const child of parent.children) {
        if (child.classList && child.classList.contains(className)) {
            return child;
        }
    }
    return null;
}

return { findNearestAncestorWithClass, findDirectChildByClass };
