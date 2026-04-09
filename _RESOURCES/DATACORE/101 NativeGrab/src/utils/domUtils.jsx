
function findNearestAncestorWithClass(element, className) {
    if (!element) return null;
    return element.closest('.' + className);
}

function findDirectChildByClass(parent, className) {
    if (!parent) return null;
    return parent.querySelector(':scope > .' + className);
}

/**
 * Common style reset for portalized containers
 */
function applyImmersionStyles(element) {
    if (!element) return;
    Object.assign(element.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '9998',
        display: 'flex',
        background: 'var(--ng-bg, #000)',
        border: 'none',
        margin: '0',
        padding: '0'
    });
}

return { findNearestAncestorWithClass, findDirectChildByClass, applyImmersionStyles };
