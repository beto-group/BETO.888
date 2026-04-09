const { React } = dc;

function PureBlack({ frame }) {
    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#000000',
            position: 'absolute',
            top: 0,
            left: 0
        }} />
    );
}

PureBlack.metadata = [
    { id: 'category', type: 'text', default: 'background' }
];

return { PureBlack };
