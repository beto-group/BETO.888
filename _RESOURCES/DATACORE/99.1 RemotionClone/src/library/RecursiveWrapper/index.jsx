const { useState, useEffect } = dc;

function RecursiveWrapper(props) {
    const { frame, targetPath } = props;
    const [InnerComp, setInnerComp] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadInner() {
            try {
                // 1. Try prop path (from layer settings)
                // 2. Try metadata default
                let componentPath = targetPath;
                if (!componentPath && RecursiveWrapper.metadata) {
                    const meta = RecursiveWrapper.metadata.find(m => m.id === 'targetPath');
                    if (meta) componentPath = meta.default;
                }

                if (!componentPath) {
                    // 3. Fallback: Search local folder for any .component.md or InnerComponent.md
                    const folderPath = RecursiveWrapper._folderPath;
                    if (folderPath) {
                        try {
                            const list = await dc.app.vault.adapter.list(folderPath);
                            const found = list.files.find(f => f.endsWith('.component.md') || f.endsWith('InnerComponent.md'));
                            if (found) componentPath = found;
                        } catch (e) { /* Ignore list error */ }
                    }
                }

                if (!componentPath) {
                    throw new Error("No target path provided and no local inner component found.");
                }

                console.log("[RecursiveWrapper] Loading:", componentPath);

                // Require the ViewComponent block from the markdown file
                const module = await dc.require(dc.headerLink(componentPath, "ViewComponent"));

                // Extract the exported function (usually ViewComponent or default)
                const Comp = module.ViewComponent || module.default || Object.values(module)[0];

                if (Comp) {
                    setInnerComp(() => Comp);
                } else {
                    throw new Error("Module did not export a renderable component.");
                }

            } catch (err) {
                console.error("[RecursiveWrapper] Load failed", err);
                setError(err.message);
            }
        }

        loadInner();
    }, [targetPath]);

    if (error) {
        return (
            <div style={{ padding: '20px', color: 'red', border: '1px solid red' }}>
                Error: {error}
            </div>
        );
    }

    if (!InnerComp) {
        return <div style={{ color: '#888' }}>Loading inner component...</div>;
    }

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <InnerComp
                frame={frame}
                folderPath={RecursiveWrapper._folderPath}
                isFullTab={false} // Prevent component from maximizing itself
                style={{ width: '100%', height: '100%', position: 'absolute' }} // Force fit
            />
        </div>
    );
}

RecursiveWrapper.metadata = [
    { id: 'category', type: 'text', default: 'component' },
    { id: 'targetPath', type: 'text', default: '_RESOURCES/DATACORE/18 ViewsInceptions/D.q.viewsinceptions.component.md' }
];

return { RecursiveWrapper };
