function CountdownDisplay({ countdown }) {
    return (
        <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 0.8 }}>
            <div style={{ fontSize: '180px', fontWeight: '900', letterSpacing: '-5px' }}>
                {countdown}
            </div>
        </div>
    );
}

return { CountdownDisplay };
