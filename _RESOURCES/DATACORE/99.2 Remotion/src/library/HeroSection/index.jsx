const { React } = dc;

function HeroSection({ frame }) {
    const opacity = Math.min(1, (frame - 10) / 20); // Delay start slightly
    const transformY = Math.max(0, 30 - (frame - 10)); // Slide up

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: frame < 10 ? 0 : opacity,
            transform: `translateY(${transformY}px)`,
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            {/* Tagline */}
            <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                color: '#fff',
                marginBottom: '20px',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                v2.0 Now Available
            </div>

            {/* Main Heading */}
            <h1 style={{
                fontSize: '80px',
                fontWeight: '800',
                color: '#fff',
                margin: '0 0 10px 0',
                letterSpacing: '-2px',
                textAlign: 'center',
                lineHeight: '1.1'
            }}>
                The AI Code Editor
            </h1>

            <p style={{
                fontSize: '24px',
                color: '#999',
                marginTop: '10px',
                marginBottom: '40px',
                maxWidth: '600px',
                textAlign: 'center'
            }}>
                Write better software, faster. Designed for the future of coding.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{
                    padding: '16px 32px',
                    background: '#fff',
                    color: '#000',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '16px',
                    cursor: 'pointer'
                }}>
                    Get Started
                </div>
                <div style={{
                    padding: '16px 32px',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '16px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer'
                }}>
                    Watch Demo
                </div>
            </div>
        </div>
    );
}

HeroSection.metadata = [
    { id: 'category', type: 'text', default: 'component' }
];

return { HeroSection };
