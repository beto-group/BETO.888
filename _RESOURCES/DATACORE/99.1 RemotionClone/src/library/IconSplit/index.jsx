export const IconSplit = ({ frame }) => {
    // Four shapes of the Slack logo
    const { speed, explodeFrame } = IconSplit.metadata.reduce((acc, item) => {
        acc[item.id] = item.default;
        return acc;
    }, {});

    const colors = ["#36C5F0", "#2EB67D", "#E01E5A", "#ECB22E"]; // Blue, Green, Red, Yellow

    // Animation Logic
    // 0 -> 1 (Assemble)
    const assembleProgress = Math.min(1, frame / 45);
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const tAssemble = easeOut(assembleProgress);

    // 1 -> 0 (Explode)
    const isExploding = frame >= explodeFrame;
    const explodeProgress = isExploding ? Math.min(1, (frame - explodeFrame) / 30) : 0;
    const tExplode = easeOut(explodeProgress);

    // Positions
    // Start far out, come to center (0), then go back out
    const startOffset = 300;
    const endOffset = 0;

    const currentOffset = isExploding
        ? endOffset + (startOffset * tExplode)
        : startOffset - (startOffset * tAssemble);

    const rotation = frame * speed; // Continuous slow rotation

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                position: 'relative',
                width: '200px',
                height: '200px',
                transform: `rotate(${rotation}deg)`
            }}>
                {/* Top Left - Blue */}
                <div style={{
                    position: 'absolute',
                    top: '0', left: '0',
                    transform: `translate(-${currentOffset}px, -${currentOffset}px)`
                }}>
                    <svg width="100" height="100" viewBox="0 0 100 100">
                        <path d="M20 20a20 20 0 1 1 40 0v20H20z" fill={colors[0]} opacity="0.8" />
                        <path d="M65 20a20 20 0 1 1 0 40h-20V20h20z" fill={colors[0]} />
                    </svg>
                </div>

                {/* Top Right - Green */}
                <div style={{
                    position: 'absolute',
                    top: '0', right: '0',
                    transform: `translate(${currentOffset}px, -${currentOffset}px) rotate(90deg)`
                }}>
                    <svg width="100" height="100" viewBox="0 0 100 100">
                        <path d="M20 20a20 20 0 1 1 40 0v20H20z" fill={colors[1]} opacity="0.8" />
                        <path d="M65 20a20 20 0 1 1 0 40h-20V20h20z" fill={colors[1]} />
                    </svg>
                </div>

                {/* Bottom Right - Red */}
                <div style={{
                    position: 'absolute',
                    bottom: '0', right: '0',
                    transform: `translate(${currentOffset}px, ${currentOffset}px) rotate(180deg)`
                }}>
                    <svg width="100" height="100" viewBox="0 0 100 100">
                        <path d="M20 20a20 20 0 1 1 40 0v20H20z" fill={colors[2]} opacity="0.8" />
                        <path d="M65 20a20 20 0 1 1 0 40h-20V20h20z" fill={colors[2]} />
                    </svg>
                </div>

                {/* Bottom Left - Yellow */}
                <div style={{
                    position: 'absolute',
                    bottom: '0', left: '0',
                    transform: `translate(-${currentOffset}px, ${currentOffset}px) rotate(270deg)`
                }}>
                    <svg width="100" height="100" viewBox="0 0 100 100">
                        <path d="M20 20a20 20 0 1 1 40 0v20H20z" fill={colors[3]} opacity="0.8" />
                        <path d="M65 20a20 20 0 1 1 0 40h-20V20h20z" fill={colors[3]} />
                    </svg>
                </div>
            </div>
        </div>
    );
};

IconSplit.metadata = [
    { id: "category", type: "text", default: "graphics", hidden: true },
    { id: "speed", type: "number", default: 0.5, label: "Rotation Speed" },
    { id: "explodeFrame", type: "number", default: 90, label: "Explosion Frame" }
];

export default IconSplit;
