const { React } = dc;

function LogoMarquee({ frame }) {
    const offset = frame * 2; // Scroll speed

    // Placeholder squares/text for logos since we don't have assets
    const logos = ["OpenAI", "Stripe", "Vercel", "Shopify", "GitHub", "Linear"];

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            paddingBottom: '40px',
            overflow: 'hidden'
        }}>
            <div style={{
                fontSize: '10px',
                color: '#444',
                textAlign: 'center',
                marginBottom: '20px',
                textTransform: 'uppercase',
                letterSpacing: '2px'
            }}>
                Trusted by engineering teams at
            </div>

            <div style={{
                display: 'flex',
                gap: '60px',
                transform: `translateX(-${offset}px)`,
                width: '200%', // Ensure scrolling space
                opacity: 0.5,
                maskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)'
            }}>
                {/* Double the list for infinite loop illusion */}
                {[...logos, ...logos, ...logos].map((logo, i) => (
                    <div key={i} style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#666',
                        whiteSpace: 'nowrap',
                        filter: 'grayscale(100%)'
                    }}>
                        {logo}
                    </div>
                ))}
            </div>
        </div>
    );
}

LogoMarquee.metadata = [
    { id: 'category', type: 'text', default: 'component' }
];

return { LogoMarquee };
