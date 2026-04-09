const { React } = dc;

function GlobalBackground({ frame }) {
    const t = frame * 0.02; // Time factor

    // Gradient Blob 1: Purple
    const x1 = 50 + 20 * Math.sin(t);
    const y1 = 30 + 10 * Math.cos(t * 0.8);

    // Gradient Blob 2: Orange/Amber
    const x2 = 20 + 20 * Math.cos(t * 0.5);
    const y2 = 70 + 10 * Math.sin(t * 0.9);

    // Gradient Blob 3: Indigo/Blue
    const x3 = 80 + 15 * Math.sin(t * 0.7);
    const y3 = 60 + 15 * Math.cos(t * 1.1);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: '#050505',
            position: 'absolute',
            top: 0,
            left: 0,
            overflow: 'hidden',
            zIndex: 0
        }}>
            {/* Blob 1 */}
            <div style={{
                position: 'absolute',
                top: `${y1}%`,
                left: `${x1}%`,
                width: '600px',
                height: '600px',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(0,0,0,0) 70%)',
                filter: 'blur(80px)',
                opacity: 0.8
            }} />

            {/* Blob 2 */}
            <div style={{
                position: 'absolute',
                top: `${y2}%`,
                left: `${x2}%`,
                width: '500px',
                height: '500px',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(0,0,0,0) 70%)',
                filter: 'blur(80px)',
                opacity: 0.6
            }} />

            {/* Blob 3 */}
            <div style={{
                position: 'absolute',
                top: `${y3}%`,
                left: `${x3}%`,
                width: '550px',
                height: '550px',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(79, 70, 229, 0.4) 0%, rgba(0,0,0,0) 70%)',
                filter: 'blur(80px)',
                opacity: 0.7
            }} />
        </div>
    );
}

GlobalBackground.metadata = [
    { id: 'category', type: 'text', default: 'background' }
];

return { GlobalBackground };
