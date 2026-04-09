const { useState, useRef } = dc;

function DraggableItem({ el, onUpdate, isSelected, onSelect, canvasScale }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, elX: 0, elY: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, size: 0 });

    const itemRef = useRef(null);

    const handlePointerDown = (e) => {
        e.stopPropagation();
        onSelect(el.id);
        setDragStart({
            x: e.clientX,
            y: e.clientY,
            elX: el.x,
            elY: el.y
        });
        setIsDragging(true);
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;

        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        const scale = canvasScale || 0.4;
        const newX = dragStart.elX + (dx / scale);
        const newY = dragStart.elY + (dy / scale);

        onUpdate(el.id, { x: newX, y: newY });
    };

    const handlePointerUp = (e) => {
        setIsDragging(false);
        if (e.target.hasPointerCapture(e.pointerId)) {
            e.target.releasePointerCapture(e.pointerId);
        }
    };

    // Resizing Logic
    const handleResizeStart = (e) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeStart({ x: e.clientX, size: el.fontSize });
        e.target.setPointerCapture(e.pointerId);
    };

    const handleResizeMove = (e) => {
        if (!isResizing) return;
        const dx = e.clientX - resizeStart.x;
        const scale = canvasScale || 0.4;

        // Change size based on horizontal drag
        const newSize = Math.max(8, resizeStart.size + (dx / scale));
        onUpdate(el.id, { fontSize: Math.round(newSize) });
    };

    const handleResizeUp = (e) => {
        setIsResizing(false);
        if (e.target.hasPointerCapture(e.pointerId)) {
            e.target.releasePointerCapture(e.pointerId);
        }
    };

    return (
        <div
            ref={itemRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onDoubleClick={(e) => {
                e.stopPropagation();
                const newContent = prompt("Enter text:", el.content);
                if (newContent !== null) onUpdate(el.id, { content: newContent });
            }}
            style={{
                position: 'absolute',
                left: `${el.x}px`,
                top: `${el.y}px`,
                cursor: isDragging ? 'grabbing' : 'grab',
                padding: '5px',
                fontSize: `${el.fontSize}px`,
                color: el.color,
                fontFamily: (el.fontFamily || 'Inter') + ', sans-serif',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                backgroundColor: isDragging ? 'rgba(139, 92, 246, 0.2)' : isSelected ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                borderRadius: '4px',
                border: isDragging || isSelected ? '1px dashed #8b5cf6' : '1px solid transparent',
                touchAction: 'none',
                zIndex: isSelected ? 100 : 1
            }}
        >
            {el.content}

            {/* Resize Handle */}
            {isSelected && (
                <div
                    onPointerDown={handleResizeStart}
                    onPointerMove={handleResizeMove}
                    onPointerUp={handleResizeUp}
                    style={{
                        position: 'absolute',
                        right: '-5px',
                        bottom: '-5px',
                        width: '12px',
                        height: '12px',
                        backgroundColor: '#8b5cf6',
                        borderRadius: '50%',
                        cursor: 'nwse-resize',
                        zIndex: 101,
                        border: '2px solid white',
                        boxShadow: '0 0 5px rgba(0,0,0,0.5)'
                    }}
                />
            )}
        </div>
    );
}

return { DraggableItem };
