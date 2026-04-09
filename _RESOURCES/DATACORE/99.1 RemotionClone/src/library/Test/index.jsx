function Test({ frame }) {
    const elements = Test.metadata || [];
    return (
        <div style={{
            width: '1280px',
            height: '720px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {elements.map((el, i) => {
                const startFrame = i * 10;
                const opacity = Math.min(1, (frame - startFrame) / 20);
                const yOffset = Math.max(0, 20 - (frame - startFrame));

                return (
                    <div key={el.id} style={{
                        position: 'absolute',
                        left: el.x + 'px',
                        top: el.y + 'px',
                        fontSize: el.fontSize + 'px',
                        color: el.color,
                        opacity,
                        transform: `translateY(${yOffset}px)`,
                        fontFamily: (el.fontFamily || 'Inter') + ', sans-serif'
                    }}>
                        {el.content}
                    </div>
                );
            })}
        </div>
    );
}

Test.metadata = [
    { id: "category", type: "text", default: "foreground", hidden: true },
    { id: "text", type: "text", default: "Test Component", label: "Content" }
];

return { Test };
