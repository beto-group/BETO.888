const { useState, useEffect } = dc;

function SocialLinks({ style }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '15px',
            borderLeft: '2px solid #a076f9',
            paddingLeft: '15px',
            ...style
        }}>
            <div style={socialStyle}>
                <dc.Icon icon="youtube" style={{ width: 20 }} /> @BETO_GROUP
            </div>
            <div style={socialStyle}>
                <dc.Icon icon="instagram" style={{ width: 20 }} /> @BETO.GROUP
            </div>
            <div style={socialStyle}>
                <dc.Icon icon="twitter" style={{ width: 20 }} /> @X_BETO_GROUP
            </div>
            <div style={socialStyle}>
                <dc.Icon icon="message-circle" style={{ width: 20 }} /> JOIN DISCORD
            </div>
        </div>
    );
}

const socialStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#a1a1aa',
    letterSpacing: '1px'
};

return { SocialLinks };
