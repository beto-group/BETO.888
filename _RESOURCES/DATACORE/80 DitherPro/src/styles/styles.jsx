const STYLES = {
    fullTabWrapper: {
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#050505',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#ccc',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    },
    canvas: {
        boxShadow: '0 0 50px rgba(0,0,0,0.9)',
        maxWidth: '95vw',
        maxHeight: '95vh',
        backgroundImage: `
      linear-gradient(45deg, #151515 25%, transparent 25%), 
      linear-gradient(-45deg, #151515 25%, transparent 25%), 
      linear-gradient(45deg, transparent 75%, #151515 75%), 
      linear-gradient(-45deg, transparent 75%, #151515 75%)
    `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
    },
    tweakpaneContainer: {
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        zIndex: 100,
        width: '340px',
        maxHeight: '90vh',
        overflowY: 'auto'
    }
};

return { STYLES };
