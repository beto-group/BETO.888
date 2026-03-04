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
