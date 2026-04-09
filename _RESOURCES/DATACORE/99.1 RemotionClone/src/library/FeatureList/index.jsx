function FeatureList({ frame }) {
    const elements = FeatureList.metadata || [];
    return (
        <div style={{
            width: '1280px',
            height: '720px',
            position: 'relative',
            opacity: 1,
            overflow: 'hidden'
        }}>
            {elements.map((el, i) => {
                const startFrame = i * 15;
                const opacity = Math.min(1, (frame - startFrame) / 20);
                const xOffset = Math.max(0, 50 - (frame - startFrame));

                return (
                    <div key={el.id} style={{
                        position: 'absolute',
                        left: el.x + 'px',
                        top: el.y + 'px',
                        fontSize: el.fontSize + 'px',
                        color: el.color,
                        opacity,
                        transform: `translateX(${xOffset}px)`,
                        fontFamily: (el.fontFamily || 'Inter') + ', sans-serif'
                    }}>
                        {el.content}
                    </div>
                );
            })}
        </div>
    );
}

FeatureList.metadata = [
    { id: "category", type: "text", default: "foreground", hidden: true },
    { id: "items", type: "list", default: ["Feature 1", "Feature 2", "Feature 3"], label: "Features" },
    { id: 'f_head', type: 'text', content: 'Key Features:', x: 180, y: 150, fontSize: 48, color: '#8b5cf6', fontFamily: 'Inter' },
    { id: 'f1', type: 'text', content: '• Timeline Control', x: 200, y: 220, fontSize: 32, color: '#ffffff', fontFamily: 'Inter' },
    { id: 'f2', type: 'text', content: '• Sequencer Layers', x: 200, y: 270, fontSize: 32, color: '#ffffff', fontFamily: 'Inter' },
    { id: 'f3', type: 'text', content: '• Real-time Preview', x: 200, y: 320, fontSize: 32, color: '#ffffff', fontFamily: 'Inter' },
    { id: 'f4', type: 'text', content: '• Absolute Black Theme', x: 200, y: 370, fontSize: 32, color: '#ffffff', fontFamily: 'Inter' }
];

return { FeatureList };
