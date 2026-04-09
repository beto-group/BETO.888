const { React } = dc;

function PureWhiteBackground({ frame }) {
    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            position: 'absolute',
            top: 0,
            left: 0
        }} />
    );
}

PureWhiteBackground.metadata = [
    { id: 'category', type: 'text', default: 'background' }
];

return { PureWhiteBackground };
