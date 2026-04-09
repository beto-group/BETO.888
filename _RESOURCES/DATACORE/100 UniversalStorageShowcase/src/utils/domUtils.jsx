/**
 * Finds the nearest ancestor of an element that has the specified class name.
 * @param {HTMLElement} element - The starting element.
 * @param {string} className - The class name to search for.
 * @returns {HTMLElement|null} - The ancestor element or null if not found.
 */
/**
 * Finds the nearest ancestor of an element that has the specified class name.
 * Uses native .closest() for better performance.
 * @param {HTMLElement} element - The starting element.
 * @param {string} className - The class name to search for.
 * @returns {HTMLElement|null} - The ancestor element or null if not found.
 */
function findNearestAncestorWithClass(element, className) {
    if (!element) return null;
    return element.closest('.' + className);
}

/**
 * Finds the first direct child of an element that has the specified class name.
 * @param {HTMLElement} parent - The parent element.
 * @param {string} className - The class name to search for.
 * @returns {HTMLElement|null} - The child element or null if not found.
 */
/**
 * Finds the first direct child of an element that has the specified class name.
 * @param {HTMLElement} parent - The parent element.
 * @param {string} className - The class name to search for.
 * @returns {HTMLElement|null} - The child element or null if not found.
 */
function findDirectChildByClass(parent, className) {
    if (!parent) return null;
    return parent.querySelector(':scope > .' + className);
}

return { findNearestAncestorWithClass, findDirectChildByClass };
