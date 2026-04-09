function TitleCard({ frame }) {
    const elements = TitleCard.metadata || [];
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

TitleCard.metadata = [{ "id": "category", "type": "text", "default": "foreground", "hidden": true }, { "id": "title", "type": "text", "content": "REMOTION CLONE", "x": 294.51020408163265, "y": 172.47619047619048, "fontSize": 80, "color": "#ffffff", "fontFamily": "Outfit" }, { "id": "subtitle", "type": "text", "content": "React-based Video Engine", "x": 450, "y": 350, "fontSize": 32, "color": "#8b5cf6", "fontFamily": "Inter" }];

return { TitleCard };
