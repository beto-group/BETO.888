function MyNewComponent({ frame }) {
    const elements = MyNewComponent.metadata || [];
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

MyNewComponent.metadata = [
    { id: "category", type: "text", default: "foreground", hidden: true },
    { id: "legacy1", type: "text", "content": "New Component", "x": 961.6444217687074, "y": 37.737551020408205, "fontSize": 33, "color": "#ffffff", "fontFamily": "Inter" }
];

return { MyNewComponent };
