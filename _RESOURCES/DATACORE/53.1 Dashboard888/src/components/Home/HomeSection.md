
# HomeSection

```jsx
const { useEffect, useState } = dc;
const { Showcase } = await dc.require(dc.headerLink(dc.resolvePath("src/components/Shared/HeroComponents.md"), "HeroComponents"));

const Home = ({ 
    setSection, 
    setSectionWithTransition, 
    navTabs, 
    isTransitioning, 
    transitionOpacity,
    styles = {},
    OverlayLogo
}) => {
    const [showUpdater, setShowUpdater] = useState(false);
    useEffect(() => {
        // Defer heavy update check to allow initial boot animation to finish
        const timer = setTimeout(() => setShowUpdater(true), 2500);
        return () => clearTimeout(timer);
    }, []);

    // Filter out 'home' and use the parsed dynamic tabs
    const slides = navTabs.filter(tab => {
        const id = (tab.id || '').toLowerCase();
        const title = (tab.title || '').toLowerCase();
        return !id.endsWith('home') && !title.endsWith('home');
    }).map(tab => ({
        ...tab,
        description: tab.id === 'docs' ? (
            <>Further Enhance Your <span className="flicker-text" data-original-text="Knowledge">Knowledge</span></>
        ) : tab.id === 'devlog' ? (
            <>Monthly Expansions with <span className="new-toy-glow">New Shiny Toys</span></>
        ) : tab.subtitle,
        flipMedia: tab.id === 'devlog'
    }));

    // Fallback for empty state
    if (slides.length === 0) {
        slides.push({ id: 'loading', title: 'Loading...', file: 'HOME' });
    }
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                boxSizing: "border-box"
            }}
        >
            <Showcase
                slides={slides}
                onButtonClick={(slide) => setSectionWithTransition(slide.id)}
                buttonTextTemplate={(title) => `[ Access ${title} ]`}
                imageDir="_RESOURCES/IMAGES"
                videoDir="_RESOURCES/VIDEOS"
                getThumbName={(slide) => `${slide.file}.webp`}
                styles={styles}
            />
            {/* --- TRANSITION PORTAL --- */}
            <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2147483647, // Infinite z-index
                background: 'var(--background-primary)',
                pointerEvents: isTransitioning ? 'auto' : 'none',
                opacity: transitionOpacity,
                transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--glow)',
                fontVariant: 'small-caps',
                letterSpacing: '4px'
            }}>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
                   {OverlayLogo && <OverlayLogo size={80} animated={isTransitioning} />}
                   <span style={{ 
                       animation: 'pulse 1.5s infinite', 
                       fontVariant: 'small-caps', 
                       letterSpacing: '4px',
                       fontSize: '14px',
                       opacity: 0.8
                   }}>[ LOADING ]</span>
               </div>
            </div>
        </div>
    );
};

return { Home };
```
