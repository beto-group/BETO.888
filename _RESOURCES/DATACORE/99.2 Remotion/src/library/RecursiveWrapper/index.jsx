const { useState, useEffect } = dc;

function RecursiveWrapper(props) {
    const {
        frame = 0,
        targetPath,
        interpolate,
        spring,
        fps = 30,
        isPlaying = false
    } = props;
    const [InnerComp, setInnerComp] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadInner() {
            try {
                let componentPath = targetPath;
                if (!componentPath && RecursiveWrapper.metadata) {
                    const meta = RecursiveWrapper.metadata.find(m => m.id === 'targetPath');
                    if (meta) componentPath = meta.default;
                }

                if (!componentPath) {
                    const folderPath = RecursiveWrapper._folderPath;
                    if (folderPath) {
                        try {
                            const list = await dc.app.vault.adapter.list(folderPath);
                            const found = list.files.find(f => f.endsWith('.component.md') || f.endsWith('InnerComponent.md'));
                            if (found) componentPath = found;
                        } catch (e) { }
                    }
                }

                if (!componentPath) {
                    throw new Error("No target path provided and no local inner component found.");
                }

                console.log("[RecursiveWrapper] Loading:", componentPath);
                const module = await dc.require(dc.headerLink(componentPath, "ViewComponent"));
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
        return <div style={{ color: '#888', padding: '10px' }}>Loading inner component...</div>;
    }

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <InnerComp
                frame={frame}
                fps={fps}
                isPlaying={isPlaying}
                interpolate={interpolate}
                spring={spring}
                folderPath={RecursiveWrapper._folderPath}
                isFullTab={false}
                style={{ width: '100%', height: '100%', position: 'absolute' }}
            />
        </div>
    );
}

RecursiveWrapper.metadata = [
    { id: 'category', type: 'text', default: 'component' },
    { id: 'targetPath', type: 'text', default: '_RESOURCES/DATACORE/18 ViewsInceptions/D.q.viewsinceptions.component.md' }
];

return { RecursiveWrapper };
