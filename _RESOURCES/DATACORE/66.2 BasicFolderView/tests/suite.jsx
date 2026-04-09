/**
 * Test Suite for 66.6 BasicFolderView
 * containing unit tests for utils and components.
 */
async function createSuite(folderPath) {
    const results = [];

    // Helper: Assertion
    const test = async (description, fn) => {
        try {
            await fn();
            results.push({ passed: true, description });
        } catch (e) {
            console.error(e);
            results.push({ passed: false, description, error: e.message || e });
        }
    };

    const expect = (actual) => ({
        toBe: (expected) => {
            if (actual !== expected) throw new Error(`Expected ${expected} but got ${actual}`);
        },
        toBeTruthy: () => {
            if (!actual) throw new Error(`Expected truthy but got ${actual}`);
        },
        toBeNull: () => {
            if (actual !== null) throw new Error(`Expected null but got ${actual}`);
        }
    });

    // --- Load Modules ---
    const domUtils = await dc.require(folderPath + '/src/utils/domUtils.jsx');
    const { MainComponent } = await dc.require(folderPath + '/src/components/MainComponent.jsx');
    const { ControlsMenu } = await dc.require(folderPath + '/src/components/ControlsMenu.jsx');
    const { CSS } = await dc.require(folderPath + '/src/styles/theme.css.js');

    // --- Tests: domUtils ---
    await test('domUtils.findNearestAncestorWithClass finds correct ancestor', () => {
        const grandparent = document.createElement('div');
        grandparent.className = 'grandparent';
        const parent = document.createElement('div');
        parent.className = 'target-class';
        const child = document.createElement('div');

        grandparent.appendChild(parent);
        parent.appendChild(child);

        const result = domUtils.findNearestAncestorWithClass(child, 'target-class');
        expect(result).toBe(parent);
    });

    await test('domUtils.findNearestAncestorWithClass returns null if not found', () => {
        const div = document.createElement('div');
        const result = domUtils.findNearestAncestorWithClass(div, 'missing-class');
        expect(result).toBeNull();
    });

    await test('domUtils.findDirectChildByClass finds correct child', () => {
        const parent = document.createElement('div');
        const child1 = document.createElement('div');
        const child2 = document.createElement('div');
        child2.className = 'target-child';

        parent.appendChild(child1);
        parent.appendChild(child2);

        const result = domUtils.findDirectChildByClass(parent, 'target-child');
        expect(result).toBe(child2);
    });

    // --- Tests: Components Existence ---
    await test('MainComponent is a function', () => {
        expect(typeof MainComponent).toBe('function');
    });

    await test('ControlsMenu is a function', () => {
        expect(typeof ControlsMenu).toBe('function');
    });

    // --- Tests: Styles ---
    await test('CSS theme string exists and is valid', () => {
        expect(typeof CSS).toBe('string');
        expect(CSS.includes('.bfv-container')).toBeTruthy();
    });

    return results;
}

return { createSuite };
