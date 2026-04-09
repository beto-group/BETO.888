/**
 * RootComposition.jsx
 * Pure React entry point for the Remotion Video engine.
 */
function RootComposition({
    React: R, // Official React
    remotion: remotionLib, // Official Remotion
    activeBackground,
    libraryComponents,
    sequence,
    frame,
    fps
}) {
    if (!R || !remotionLib) return null;
    const { Sequence, interpolate, spring } = remotionLib;
    if (!Sequence) return null;

    // Background Layer
    const renderBackground = () => {
        if (!activeBackground || activeBackground === 'GradientBackground') {
            return R.createElement('div', {
                key: 'bg',
                style: {
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(${frame + 45}deg, #0d0221 0%, #000000 100%)`
                }
            });
        }
        const BGComp = libraryComponents[activeBackground];
        if (!BGComp) return null;

        return R.createElement(BGComp, {
            key: 'bg',
            frame,
            fps,
            isPlaying: true,
            interpolate,
            spring,
            RemotionReact: R
        });
    };

    // Foreground Layers (Sequences)
    const renderLayers = () => {
        return (sequence || []).map(layer => {
            const Comp = libraryComponents[layer.component];
            if (!Comp) return null;

            return R.createElement(Sequence, {
                key: layer.id,
                from: layer.from,
                durationInFrames: layer.duration
            }, R.createElement(Comp, {
                ...layer,
                frame: frame - layer.from,
                fps,
                isPlaying: true,
                interpolate,
                spring,
                RemotionReact: R
            }));
        });
    };

    // Clean diagnostic marker
    return R.createElement('div', {
        id: 'remotion-root-composition',
        style: {
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            position: 'relative',
            overflow: 'hidden'
        }
    }, [
        // Canary dot
        R.createElement('div', {
            key: 'canary',
            style: {
                position: 'absolute', top: '5px', left: '5px', width: '8px', height: '8px',
                borderRadius: '50%', backgroundColor: '#8b5cf6', zIndex: 9999, opacity: 0.5
            }
        }),
        renderBackground(),
        ...renderLayers()
    ]);
}

return { RootComposition };
